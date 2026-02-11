<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import type { CellData, InputConfig } from '@/shared/types'
import type { MergeInfo } from '@/features/spreadsheet/lib/useMergeMap'
import { buildCellCssStyle, buildCellContentStyle } from '@/features/spreadsheet/lib/useCellStyle'
import { useThemeStore } from '@/features/theme/model/themeStore'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'
import { evaluateFormula } from '@/shared/lib/formulaEngine'
import { getColumnLabel } from '@/shared/lib/excelService'
import CellConfigModal from './CellConfigModal.vue'

interface Props {
  cellData: CellData
  rowIndex: number
  colIndex: number
  rowHeight: number
  showGridlines: boolean
  mergeInfo?: MergeInfo
  isSelected?: boolean
  isInRange?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [row: number, col: number]
  cellmousedown: [row: number, col: number]
  cellmouseenter: [row: number, col: number]
}>()
const themeStore = useThemeStore()
const store = useSpreadsheetStore()

const editValue = ref('')
const cellInputRef = ref<HTMLInputElement | null>(null)

const isEditing = computed(() => {
  const ec = store.editingCell
  return ec !== null && ec.row === props.rowIndex && ec.col === props.colIndex
})

const isImageValue = (val: string | number | null) =>
  typeof val === 'string' && val.startsWith('data:image')

// Read cell directly from store for reactivity (triggerRef(sheets) triggers these)
const liveCell = computed(() => {
  const sheet = store.activeSheet
  if (!sheet) return props.cellData
  return sheet.rows[props.rowIndex]?.[props.colIndex] ?? props.cellData
})

const cellStyle = computed(() => {
  const cell = liveCell.value
  const s = cell.style
  const hasValue = cell.value !== null && cell.value !== undefined && String(cell.value) !== ''
  const isConfigured = !!cell.inputConfig

  let zIndex = 1
  if (hasValue || isConfigured) zIndex = 10
  if (s?.wrapText) zIndex = 1

  return buildCellCssStyle(
    s,
    props.rowHeight,
    props.showGridlines,
    zIndex,
    themeStore.theme === 'dark',
  )
})

const contentStyle = computed(() => buildCellContentStyle(liveCell.value.style))

const displayValue = computed(() => {
  const raw = liveCell.value.value
  if (raw === null || raw === undefined) return null
  const sheet = store.activeSheet
  if (!sheet) return raw
  return evaluateFormula(raw, sheet)
})

const handleDoubleClick = () => {
  // Only allow editing in Manual mode
  if (store.appMode !== 'manual') return

  const val = liveCell.value.value
  editValue.value = val !== null && val !== undefined ? String(val) : ''
  store.startEditing(props.rowIndex, props.colIndex)
  nextTick(() => {
    cellInputRef.value?.focus()
  })
}

// --- Designer Mode: Cell Config Modal ---
const showConfigModal = ref(false)

const cellAddress = computed(() => {
  return `${getColumnLabel(props.colIndex)}${props.rowIndex + 1}`
})

const handleCellClick = () => {
  emit('select', props.rowIndex, props.colIndex)
  if (store.appMode === 'designer') {
    showConfigModal.value = true
  }
}

const handleConfigSave = (config: InputConfig | undefined) => {
  store.setCellInputConfig(props.rowIndex, props.colIndex, config)
}

const isConfigured = computed(() => !!liveCell.value.inputConfig)
const isDesigner = computed(() => store.appMode === 'designer')
const isOperator = computed(() => store.appMode === 'operator')

// --- Operator Mode: Text Color ---
const operatorTextColor = computed(() => {
  return themeStore.theme === 'dark' ? '#e5e7eb' : '#111827' // gray-200 : gray-900
})

// --- Operator Mode ---
const operatorValue = ref<string>('')

const isCellEnabledForOperator = computed(() => {
  if (!isOperator.value) return false
  const config = liveCell.value.inputConfig
  if (!config) return false

  // Check role-based access
  if (config.allowedRoles && config.allowedRoles.length > 0) {
    if (!config.allowedRoles.includes(store.currentUserRole)) return false
  }

  // Check conditional logic
  if (config.conditional) {
    const sheet = store.activeSheet
    if (sheet) {
      const depLabel = config.conditional.dependencyLabel
      const depValue = config.conditional.value
      let found = false
      for (const rowKey of Object.keys(sheet.rows)) {
        const row = sheet.rows[Number(rowKey)]
        if (!row) continue
        for (const colKey of Object.keys(row)) {
          const cell = row[Number(colKey)]
          if (cell?.inputConfig?.label === depLabel) {
            const cellVal =
              cell.value !== null && cell.value !== undefined ? String(cell.value) : ''
            if (cellVal === depValue) found = true
            break
          }
        }
        if (found) break
      }
      if (!found) return false
    }
  }

  return true
})

const isCellDisabledForOperator = computed(() => {
  return isOperator.value && !isCellEnabledForOperator.value
})

// Sync operatorValue when cell data changes
watch(
  () => liveCell.value.value,
  (val) => {
    operatorValue.value = val !== null && val !== undefined ? String(val) : ''
  },
  { immediate: true },
)

const commitOperatorValue = (val: string) => {
  const config = liveCell.value.inputConfig
  if (!config) return
  let finalVal: string | number | null = val
  if (config.type === 'number' && val !== '') {
    finalVal = Number(val)
  }
  if (val === '') finalVal = null
  store.updateCellValue(props.rowIndex, props.colIndex, finalVal)
}

const handleOperatorInput = (e: Event) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement
  operatorValue.value = target.value
  commitOperatorValue(target.value)
}

const handleBooleanToggle = () => {
  const newVal = operatorValue.value === 'true' ? 'false' : 'true'
  operatorValue.value = newVal
  commitOperatorValue(newVal)
}

const handleEditKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    store.commitEdit(editValue.value)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    store.cancelEdit()
  } else if (e.key === 'Tab') {
    e.preventDefault()
    store.commitEdit(editValue.value)
  }
}

const handleEditBlur = () => {
  // Delay to let formula bar focus intercept
  setTimeout(() => {
    if (isEditing.value && !store.formulaBarFocused) {
      store.commitEdit(editValue.value)
    }
  }, 50)
}

// Sync editValue when editing starts from formula bar
watch(
  () => store.editingCell,
  (ec) => {
    if (ec && ec.row === props.rowIndex && ec.col === props.colIndex) {
      const val = liveCell.value.value
      editValue.value = val !== null && val !== undefined ? String(val) : ''
      store.pendingEditValue = editValue.value
      nextTick(() => {
        cellInputRef.value?.focus()
      })
    }
  },
)

// Sync editValue to store.pendingEditValue as user types
watch(editValue, (val) => {
  if (isEditing.value) {
    store.pendingEditValue = val
  }
})
</script>

<template>
  <td
    :rowspan="mergeInfo?.rowspan"
    :colspan="mergeInfo?.colspan"
    class="text-[11pt] leading-tight px-[2px]"
    :class="[
      isCellDisabledForOperator ? 'cursor-not-allowed' : 'cursor-cell',
      isSelected && !isCellDisabledForOperator ? 'ring-2 ring-primary-500 ring-inset z-20' : '',
      isInRange && !isSelected ? 'bg-primary-100/40 dark:bg-primary-800/30' : '',
    ]"
    :style="cellStyle"
    @click.stop="handleCellClick"
    @mousedown.left="emit('cellmousedown', rowIndex, colIndex)"
    @mouseenter="emit('cellmouseenter', rowIndex, colIndex)"
    @dblclick.stop="handleDoubleClick"
  >
    <!-- Designer Mode: Config Badge -->
    <div
      v-if="isDesigner && isConfigured"
      class="absolute top-0 right-0 w-0 h-0 z-30"
      style="border-top: 8px solid #3b82f6; border-left: 8px solid transparent"
    ></div>
    <div
      v-if="isDesigner && isConfigured"
      class="absolute inset-0 border-2 border-blue-400/40 dark:border-blue-500/30 rounded-sm pointer-events-none z-10"
    ></div>

    <!-- Operator Mode: Input Widgets -->
    <template v-if="isCellEnabledForOperator">
      <!-- Required indicator -->
      <span
        v-if="liveCell.inputConfig?.required"
        class="absolute top-0 right-0.5 text-red-500 text-base font-bold z-30 leading-none"
        >*</span
      >

      <!-- Text Input -->
      <input
        v-if="liveCell.inputConfig?.type === 'text'"
        :value="operatorValue"
        type="text"
        class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 text-[11pt] px-1 outline-none border-none m-0"
        :style="{ color: operatorTextColor }"
        :placeholder="liveCell.inputConfig?.placeholder || ''"
        @input="handleOperatorInput"
      />

      <!-- Number Input -->
      <input
        v-else-if="liveCell.inputConfig?.type === 'number'"
        :value="operatorValue"
        type="number"
        class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 text-[11pt] px-1 outline-none border-none m-0"
        :style="{ color: operatorTextColor }"
        :placeholder="liveCell.inputConfig?.placeholder || ''"
        :min="liveCell.inputConfig?.validation?.min"
        :max="liveCell.inputConfig?.validation?.max"
        @input="handleOperatorInput"
      />

      <!-- Select Dropdown -->
      <select
        v-else-if="liveCell.inputConfig?.type === 'select'"
        :value="operatorValue"
        class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 text-[11pt] px-0.5 outline-none border-none m-0 cursor-pointer"
        :style="{ color: operatorValue ? operatorTextColor : '#9ca3af' }"
        @change="handleOperatorInput"
      >
        <option value="" disabled>{{ liveCell.inputConfig?.placeholder || '-- Select --' }}</option>
        <option
          v-for="opt in liveCell.inputConfig?.options || []"
          :key="opt"
          :value="opt"
          :style="{ color: operatorTextColor }"
        >
          {{ opt }}
        </option>
      </select>

      <!-- Boolean Toggle -->
      <div
        v-else-if="liveCell.inputConfig?.type === 'boolean'"
        class="w-full h-full flex items-center justify-center bg-blue-50/40 dark:bg-blue-900/20 cursor-pointer"
        @click.stop="handleBooleanToggle"
      >
        <div
          class="w-8 h-[18px] rounded-full transition-all relative"
          :class="operatorValue === 'true' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'"
        >
          <div
            class="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all"
            :class="operatorValue === 'true' ? 'left-[16px]' : 'left-[2px]'"
          ></div>
        </div>
      </div>

      <!-- Date Input -->
      <input
        v-else-if="liveCell.inputConfig?.type === 'date'"
        :value="operatorValue"
        type="date"
        class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 text-[10pt] px-0.5 outline-none border-none m-0 cursor-pointer"
        :style="{ color: operatorTextColor }"
        @input="handleOperatorInput"
      />

      <!-- Fallback: text input for symbol/image/etc -->
      <input
        v-else
        :value="operatorValue"
        type="text"
        class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 text-[11pt] px-1 outline-none border-none m-0"
        :style="{ color: operatorTextColor }"
        :placeholder="liveCell.inputConfig?.placeholder || ''"
        @input="handleOperatorInput"
      />
    </template>

    <!-- Manual Mode: Editing -->
    <template v-else-if="!isOperator">
      <input
        v-if="isEditing"
        ref="cellInputRef"
        v-model="editValue"
        class="w-full h-full bg-transparent text-[11pt] px-[2px] outline-none border-none m-0"
        :style="{ color: cellStyle.color as string }"
        @keydown="handleEditKeydown"
        @blur="handleEditBlur"
      />

      <!-- Display Mode -->
      <div v-else :style="contentStyle">
        <!-- Designer mode: show type badge -->
        <span
          v-if="isDesigner && isConfigured && !displayValue"
          class="text-[9px] font-medium text-blue-400 dark:text-blue-500 uppercase tracking-wider"
        >
          {{ liveCell.inputConfig?.type }}
        </span>
        <img
          v-else-if="isImageValue(liveCell.value)"
          :src="liveCell.value as string"
          alt="cell-img"
          class="h-full w-auto object-contain"
        />
        <template v-else>{{ displayValue }}</template>
      </div>
    </template>

    <!-- Operator Mode: Display value for disabled cells -->
    <template v-else>
      <div :style="contentStyle">
        <img
          v-if="isImageValue(liveCell.value)"
          :src="liveCell.value as string"
          alt="cell-img"
          class="h-full w-auto object-contain"
        />
        <template v-else>{{ displayValue }}</template>
      </div>
    </template>

    <!-- Cell Config Modal -->
    <CellConfigModal
      :is-open="showConfigModal"
      :initial-config="liveCell.inputConfig"
      :target-label="cellAddress"
      @close="showConfigModal = false"
      @save="handleConfigSave"
    />
  </td>
</template>
