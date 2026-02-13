<script setup lang="ts">
import { computed, ref, toRef, onMounted, onUnmounted } from 'vue'
import type { SheetData } from '@/shared/types'
import { useMergeMap } from '@/features/spreadsheet/lib/useMergeMap'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'
import { touchToMouseCoords } from '@/shared/lib/useTouchGestures'
import SpreadsheetCell from './SpreadsheetCell.vue'
import ShapeLayer from './ShapeLayer.vue'

interface Props {
  data: SheetData
  showGridlines?: boolean
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  showGridlines: true,
  zoom: 1.0,
})

const store = useSpreadsheetStore()

const mergesRef = toRef(() => props.data.merges)
const { spanMap, skipMap } = useMergeMap(mergesRef)

const totalTableWidth = computed(() => props.data.columns.reduce((acc, col) => acc + col.width, 40))

const totalTableHeight = computed(() => {
  let h = 32
  for (let r = 0; r < props.data.rowCount; r++) {
    h += props.data.rowMetadata?.[r]?.height || 24
  }
  return h
})

const rowIndices = computed(() => Array.from({ length: props.data.rowCount }, (_, i) => i))

const getRowHeight = (rowIndex: number): number => props.data.rowMetadata?.[rowIndex]?.height || 24

const getCellData = (rowIndex: number, colIndex: number) =>
  props.data.rows[rowIndex]?.[colIndex] || { value: null }

// --- Selection ---
const isDragging = ref(false)
const dragAnchor = ref<{ row: number; col: number } | null>(null)

const isCellSelected = (row: number, col: number): boolean => {
  const sel = store.selectedCell
  if (sel !== null && sel.row === row && sel.col === col) return true
  return isCellInRange(row, col)
}

const isCellInRange = (row: number, col: number): boolean => {
  const range = store.selectionRange
  if (!range) return false
  return (
    row >= range.startRow && row <= range.endRow && col >= range.startCol && col <= range.endCol
  )
}

const handleCellSelect = (row: number, col: number) => {
  store.selectCell(row, col)
}

const handleCellMousedown = (row: number, col: number) => {
  isDragging.value = true
  dragAnchor.value = { row, col }
  store.selectCell(row, col)
}

const handleCellMouseenter = (row: number, col: number) => {
  if (!isDragging.value || !dragAnchor.value) return
  store.setSelectionRange(dragAnchor.value.row, dragAnchor.value.col, row, col)
}

const handleMouseup = () => {
  isDragging.value = false
}

onMounted(() => {
  window.addEventListener('mouseup', handleMouseup)
  window.addEventListener('touchend', handleMouseup)
})
onUnmounted(() => {
  window.removeEventListener('mouseup', handleMouseup)
  window.removeEventListener('touchend', handleMouseup)
})

// --- Column Resize ---
const colResizing = ref<{ colIndex: number; startX: number; startWidth: number } | null>(null)

const handleColResizeStart = (e: MouseEvent, colIndex: number) => {
  e.preventDefault()
  e.stopPropagation()
  const col = props.data.columns[colIndex]
  if (!col) return
  store.pushUndo()
  colResizing.value = { colIndex, startX: e.clientX, startWidth: col.width }
  window.addEventListener('mousemove', handleColResizeMove)
  window.addEventListener('mouseup', handleColResizeEnd)
}

const handleColResizeMove = (e: MouseEvent) => {
  if (!colResizing.value) return
  const delta = (e.clientX - colResizing.value.startX) / props.zoom
  const newWidth = colResizing.value.startWidth + delta
  store.setColumnWidth(colResizing.value.colIndex, newWidth)
}

const handleColResizeEnd = () => {
  colResizing.value = null
  window.removeEventListener('mousemove', handleColResizeMove)
  window.removeEventListener('mouseup', handleColResizeEnd)
  window.removeEventListener('touchmove', handleColTouchMove)
  window.removeEventListener('touchend', handleColResizeEnd)
}

// Touch column resize
const handleColTouchStart = (e: TouchEvent, colIndex: number) => {
  e.preventDefault()
  e.stopPropagation()
  const col = props.data.columns[colIndex]
  if (!col) return
  store.pushUndo()
  const { clientX } = touchToMouseCoords(e)
  colResizing.value = { colIndex, startX: clientX, startWidth: col.width }
  window.addEventListener('touchmove', handleColTouchMove, { passive: false })
  window.addEventListener('touchend', handleColResizeEnd)
}

const handleColTouchMove = (e: TouchEvent) => {
  if (!colResizing.value) return
  e.preventDefault()
  const { clientX } = touchToMouseCoords(e)
  const delta = (clientX - colResizing.value.startX) / props.zoom
  const newWidth = colResizing.value.startWidth + delta
  store.setColumnWidth(colResizing.value.colIndex, newWidth)
}

// --- Row Resize ---
const rowResizing = ref<{ rowIndex: number; startY: number; startHeight: number } | null>(null)

const handleRowResizeStart = (e: MouseEvent, rowIndex: number) => {
  e.preventDefault()
  e.stopPropagation()
  const height = getRowHeight(rowIndex)
  store.pushUndo()
  rowResizing.value = { rowIndex, startY: e.clientY, startHeight: height }
  window.addEventListener('mousemove', handleRowResizeMove)
  window.addEventListener('mouseup', handleRowResizeEnd)
}

const handleRowResizeMove = (e: MouseEvent) => {
  if (!rowResizing.value) return
  const delta = (e.clientY - rowResizing.value.startY) / props.zoom
  const newHeight = rowResizing.value.startHeight + delta
  store.setRowHeight(rowResizing.value.rowIndex, newHeight)
}

const handleRowResizeEnd = () => {
  rowResizing.value = null
  window.removeEventListener('mousemove', handleRowResizeMove)
  window.removeEventListener('mouseup', handleRowResizeEnd)
  window.removeEventListener('touchmove', handleRowTouchMove)
  window.removeEventListener('touchend', handleRowResizeEnd)
}

// Touch row resize
const handleRowTouchStart = (e: TouchEvent, rowIndex: number) => {
  e.preventDefault()
  e.stopPropagation()
  const height = getRowHeight(rowIndex)
  store.pushUndo()
  const { clientY } = touchToMouseCoords(e)
  rowResizing.value = { rowIndex, startY: clientY, startHeight: height }
  window.addEventListener('touchmove', handleRowTouchMove, { passive: false })
  window.addEventListener('touchend', handleRowResizeEnd)
}

const handleRowTouchMove = (e: TouchEvent) => {
  if (!rowResizing.value) return
  e.preventDefault()
  const { clientY } = touchToMouseCoords(e)
  const delta = (clientY - rowResizing.value.startY) / props.zoom
  const newHeight = rowResizing.value.startHeight + delta
  store.setRowHeight(rowResizing.value.rowIndex, newHeight)
}
</script>

<template>
  <div
    class="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 relative select-none transition-colors duration-300"
  >
    <!-- Zoom Wrapper -->
    <div
      :style="{
        width: `${totalTableWidth * zoom + 100}px`,
        height: `${totalTableHeight * zoom + 100}px`,
        position: 'relative',
      }"
    >
      <div
        :style="{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: '20px',
          left: '20px',
        }"
      >
        <div
          class="inline-block bg-white dark:bg-gray-800 shadow-sm rounded-sm border border-gray-300 dark:border-gray-700 relative transition-colors duration-300"
        >
          <table
            class="table-fixed bg-white dark:bg-gray-800 text-black dark:text-gray-100"
            :style="{
              width: `${totalTableWidth}px`,
              fontFamily: 'Calibri, \'Segoe UI\', sans-serif',
              borderCollapse: 'separate',
              borderSpacing: '0px',
            }"
          >
            <colgroup>
              <col style="width: 40px" />
              <col v-for="col in data.columns" :key="col.id" :style="{ width: `${col.width}px` }" />
            </colgroup>

            <!-- HEADER -->
            <thead class="z-9999 relative">
              <tr>
                <th
                  class="sticky top-0 left-0 z-30 bg-gray-200 dark:bg-gray-700 border-r border-b border-gray-300 dark:border-gray-600 h-8 w-10 transition-colors"
                />
                <th
                  v-for="(col, colIdx) in data.columns"
                  :key="col.id"
                  class="sticky top-0 z-20 h-8 border-r border-b border-gray-300 dark:border-gray-600 px-1 font-normal bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  :style="{ width: `${col.width}px` }"
                >
                  <div class="flex items-center justify-center w-full h-full">
                    <span class="text-[10px] font-bold text-gray-600 dark:text-gray-300">
                      {{ col.header }}
                    </span>
                  </div>
                  <!-- Column Resize Handle -->
                  <div
                    class="absolute top-0 right-0 w-[5px] h-full cursor-col-resize z-30 hover:bg-primary-400/50"
                    @mousedown="handleColResizeStart($event, colIdx)"
                    @touchstart="handleColTouchStart($event, colIdx)"
                  />
                </th>
              </tr>
            </thead>

            <!-- BODY -->
            <tbody>
              <tr
                v-for="rowIndex in rowIndices"
                :key="rowIndex"
                class="hover:bg-gray-50/30 dark:hover:bg-white/5"
              >
                <!-- Row Number -->
                <td
                  :style="{ height: `${getRowHeight(rowIndex)}px` }"
                  class="left-0 z-10 bg-gray-50 dark:bg-gray-800 border-r border-b border-gray-300 dark:border-gray-600 text-center text-xs text-gray-500 dark:text-gray-400 font-semibold select-none transition-colors relative"
                >
                  {{ rowIndex + 1 }}
                  <!-- Row Resize Handle -->
                  <div
                    class="absolute bottom-0 left-0 w-full h-[6px] cursor-row-resize z-40 hover:bg-primary-500 active:bg-primary-600 transition-colors"
                    style="margin-bottom: -3px"
                    @mousedown="handleRowResizeStart($event, rowIndex)"
                    @touchstart="handleRowTouchStart($event, rowIndex)"
                  />
                </td>

                <!-- Cells -->
                <template v-for="(col, colIndex) in data.columns" :key="col.id">
                  <SpreadsheetCell
                    v-if="!skipMap.has(`${rowIndex},${colIndex}`)"
                    :cell-data="getCellData(rowIndex, colIndex)"
                    :row-index="rowIndex"
                    :col-index="colIndex"
                    :row-height="getRowHeight(rowIndex)"
                    :show-gridlines="showGridlines"
                    :merge-info="spanMap.get(`${rowIndex},${colIndex}`)"
                    :is-selected="isCellSelected(rowIndex, colIndex)"
                    :is-in-range="isCellInRange(rowIndex, colIndex)"
                    @select="handleCellSelect"
                    @cellmousedown="handleCellMousedown"
                    @cellmouseenter="handleCellMouseenter"
                  />
                </template>
              </tr>
            </tbody>
          </table>

          <!-- SHAPE / IMAGE OVERLAY -->
          <ShapeLayer :shapes="data.shapes || []" />
        </div>
      </div>
    </div>
  </div>
</template>
