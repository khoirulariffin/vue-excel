<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { FileSpreadsheet } from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'
import type { CellStyle } from '@/shared/types'
import RibbonToolbar from '@/features/spreadsheet/ui/RibbonToolbar.vue'
import FormulaBar from '@/features/spreadsheet/ui/FormulaBar.vue'
import SpreadsheetTable from '@/features/spreadsheet/ui/SpreadsheetTable.vue'

const store = useSpreadsheetStore()

const activeSheet = computed(() => store.sheets[store.activeSheetIndex])

const clipboard = ref<{ value: string | number | null; style?: CellStyle } | null>(null)

const editingSheetIndex = ref<number | null>(null)
const sheetNameInputRef = ref<HTMLInputElement | null>(null)
const editingSheetName = ref('')

const handleSheetNameDoubleClick = (index: number) => {
  editingSheetIndex.value = index
  editingSheetName.value = store.sheets[index]?.name || `Sheet ${index + 1}`
  nextTick(() => {
    sheetNameInputRef.value?.focus()
    sheetNameInputRef.value?.select()
  })
}

const handleSheetNameKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    finishEditingSheetName()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    cancelEditingSheetName()
  }
}

const finishEditingSheetName = () => {
  const index = editingSheetIndex.value
  if (index !== null && store.sheets[index]) {
    const newName = editingSheetName.value.trim() || `Sheet ${index + 1}`
    store.sheets[index].name = newName
  }
  editingSheetIndex.value = null
}

const cancelEditingSheetName = () => {
  editingSheetIndex.value = null
}

const handleSheetNameBlur = () => {
  finishEditingSheetName()
}

const handleAddSheet = () => {
  store.addSheet()
}

const handleKeydown = (e: KeyboardEvent) => {
  // Escape: cancel edit or unselect cell (works in all modes)
  if (e.key === 'Escape') {
    e.preventDefault()
    if (store.editingCell) {
      store.cancelEdit()
    } else if (store.selectedCell) {
      store.selectedCell = null
      store.selectionRange = null
    }
    return
  }

  if (store.appMode !== 'manual') return
  const mod = e.ctrlKey || e.metaKey

  // Undo/Redo (works without selection)
  if (mod && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    store.undo()
    return
  }
  if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    store.redo()
    return
  }

  if (!store.selectedCell) return
  const { row, col } = store.selectedCell

  // Delete/Backspace - clear cell value
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (!store.editingCell) {
      e.preventDefault()
      store.updateCellValue(row, col, null)
    }
    return
  }

  // Copy
  if (mod && e.key === 'c') {
    e.preventDefault()
    const cellData = store.selectedCellData
    if (cellData) {
      clipboard.value = { value: cellData.value, style: cellData.style }
    }
    return
  }

  // Cut
  if (mod && e.key === 'x') {
    e.preventDefault()
    const cellData = store.selectedCellData
    if (cellData) {
      clipboard.value = { value: cellData.value, style: cellData.style }
      store.updateCellValue(row, col, null)
    }
    return
  }

  // Paste
  if (mod && e.key === 'v') {
    e.preventDefault()
    if (clipboard.value) {
      store.updateCellValue(row, col, clipboard.value.value)
      if (clipboard.value.style) {
        const sheet = store.activeSheet
        if (sheet) {
          if (!sheet.rows[row]) sheet.rows[row] = {}
          if (!sheet.rows[row]![col]) sheet.rows[row]![col] = { value: null }
          sheet.rows[row]![col]!.style = { ...clipboard.value.style }
        }
      }
    }
    return
  }

  // Formatting shortcuts
  if (mod && e.key === 'b') {
    e.preventDefault()
    store.toggleBold()
  } else if (mod && e.key === 'i') {
    e.preventDefault()
    store.toggleItalic()
  } else if (mod && e.key === 'u') {
    e.preventDefault()
    store.toggleUnderline()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="flex flex-col h-full bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <!-- Ribbon Toolbar (Header + Ribbon) -->
    <RibbonToolbar />

    <!-- Formula Bar (Manual mode only) -->
    <FormulaBar v-if="store.appMode === 'manual'" />

    <!-- Spreadsheet Area -->
    <div class="flex-1 overflow-hidden relative flex flex-col">
      <SpreadsheetTable
        v-if="activeSheet"
        :data="activeSheet"
        :show-gridlines="store.showGridlines"
        :zoom="store.zoom"
      />
    </div>

    <!-- Sheet Tabs (Bottom Bar) -->
    <div
      class="h-10 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center px-1 overflow-x-auto select-none shrink-0"
    >
      <div
        v-for="(sheet, index) in store.sheets"
        :key="index"
        class="flex items-center gap-2 px-4 h-full text-xs font-medium border-r border-gray-200 dark:border-gray-700 transition-colors relative group cursor-pointer"
        :class="
          store.activeSheetIndex === index
            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
        "
        @click="store.activeSheetIndex = index"
        @dblclick="handleSheetNameDoubleClick(index)"
      >
        <span
          v-if="store.activeSheetIndex === index"
          class="absolute top-0 left-0 right-0 h-0.5 bg-primary-500"
        ></span>
        <FileSpreadsheet class="w-3.5 h-3.5 opacity-70" />
        <input
          v-if="editingSheetIndex === index"
          ref="sheetNameInputRef"
          v-model="editingSheetName"
          class="bg-transparent border-none outline-none text-xs font-medium truncate min-w-[60px] max-w-[120px]"
          @keydown="handleSheetNameKeydown"
          @blur="handleSheetNameBlur"
          @click.stop
        />
        <span v-else class="truncate hover:bg-white/20 px-1 rounded transition-colors cursor-text">
          {{ sheet.name || `Sheet ${index + 1}` }}
        </span>
      </div>

      <!-- Add Sheet Button -->
      <button
        class="px-3 h-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Add Sheet"
        @click="handleAddSheet"
      >
        <span class="text-lg leading-none">+</span>
      </button>
    </div>
  </div>
</template>
