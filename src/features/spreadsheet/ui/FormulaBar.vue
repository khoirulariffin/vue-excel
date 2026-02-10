<script setup lang="ts">
import { ref, watch } from 'vue'
import { Sigma } from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'

const store = useSpreadsheetStore()
const formulaInput = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const isFormulaBarEditing = ref(false)

// Sync selected cell value → formula bar input
// Always update when selection changes, skip only when formula bar itself is actively editing
watch(
  () => store.selectedCellAddress,
  () => {
    if (!isFormulaBarEditing.value) {
      formulaInput.value = store.selectedCellValue
    }
  },
  { immediate: true },
)

// Also sync when cell value changes externally (e.g. after commit from cell inline edit)
watch(
  () => store.selectedCellValue,
  (val) => {
    if (!isFormulaBarEditing.value) {
      formulaInput.value = val
    }
  },
)

const handleFocus = () => {
  if (!store.selectedCell) return
  store.formulaBarFocused = true
  isFormulaBarEditing.value = true
  formulaInput.value = store.selectedCellValue
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    commitFromFormulaBar()
    inputRef.value?.blur()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    formulaInput.value = store.selectedCellValue
    isFormulaBarEditing.value = false
    store.formulaBarFocused = false
    inputRef.value?.blur()
  }
}

const handleBlur = () => {
  if (isFormulaBarEditing.value) {
    commitFromFormulaBar()
  }
  store.formulaBarFocused = false
  isFormulaBarEditing.value = false
}

const commitFromFormulaBar = () => {
  if (!store.selectedCell) return
  const { row, col } = store.selectedCell
  const val = formulaInput.value
  const numVal = Number(val)
  store.updateCellValue(row, col, val === '' ? null : isNaN(numVal) ? val : numVal)
}
</script>

<template>
  <div
    class="h-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-2 gap-2 shrink-0 transition-colors"
  >
    <!-- Cell Address Box -->
    <div
      class="w-20 h-6 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200 select-none shrink-0"
    >
      {{ store.selectedCellAddress || '—' }}
    </div>

    <!-- Divider -->
    <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 shrink-0"></div>

    <!-- fx icon -->
    <div class="text-gray-400 dark:text-gray-500 shrink-0">
      <Sigma class="w-4 h-4" />
    </div>

    <!-- Formula / Value Input -->
    <input
      ref="inputRef"
      v-model="formulaInput"
      type="text"
      class="flex-1 h-6 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-800 dark:text-gray-200 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-colors"
      placeholder="Select a cell..."
      @focus="handleFocus"
      @keydown="handleKeydown"
      @blur="handleBlur"
    />
  </div>
</template>
