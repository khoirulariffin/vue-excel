import { ref, computed, triggerRef } from 'vue'
import { defineStore } from 'pinia'
import type {
  SheetData,
  AppMode,
  CellStyle,
  MergeRange,
  ExcelShape,
  InputConfig,
} from '@/shared/types'
import { UserRole } from '@/shared/types'
import {
  generateEmptySheet,
  parseExcelFile,
  getColumnLabel,
  exportToExcelBlob,
} from '@/shared/lib/excelService'

export interface SelectedCell {
  row: number
  col: number
}

export interface SelectionRange {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

export const useSpreadsheetStore = defineStore('spreadsheet', () => {
  const sheets = ref<SheetData[]>([generateEmptySheet('Sheet1')])
  const activeSheetIndex = ref(0)
  const fileName = ref('Untitled Project')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Editor state
  const appMode = ref<AppMode>('manual')
  const currentUserRole = ref<UserRole>(UserRole.ADMIN)
  const showGridlines = ref(true)
  const zoom = ref(1.0)
  const selectedCell = ref<SelectedCell | null>(null)
  const selectionRange = ref<SelectionRange | null>(null)
  const pendingEditValue = ref<string | null>(null)
  const editingCell = ref<SelectedCell | null>(null)
  const formulaBarFocused = ref(false)

  const activeSheet = computed(() => sheets.value[activeSheetIndex.value])

  // --- Undo / Redo ---
  const MAX_HISTORY = 50
  const undoStack = ref<string[]>([])
  const redoStack = ref<string[]>([])

  const takeSnapshot = (): string => JSON.stringify(sheets.value)

  const pushUndo = () => {
    undoStack.value.push(takeSnapshot())
    if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
    redoStack.value = []
  }

  const undo = () => {
    if (undoStack.value.length === 0) return
    redoStack.value.push(takeSnapshot())
    const prev = undoStack.value.pop()!
    sheets.value = JSON.parse(prev) as SheetData[]
  }

  const redo = () => {
    if (redoStack.value.length === 0) return
    undoStack.value.push(takeSnapshot())
    const next = redoStack.value.pop()!
    sheets.value = JSON.parse(next) as SheetData[]
  }

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  const selectedCellAddress = computed(() => {
    if (!selectedCell.value) return ''
    const col = getColumnLabel(selectedCell.value.col)
    const row = selectedCell.value.row + 1
    return `${col}${row}`
  })

  const selectedCellData = computed(() => {
    if (!selectedCell.value || !activeSheet.value) return null
    const { row, col } = selectedCell.value
    return activeSheet.value.rows[row]?.[col] ?? null
  })

  const selectedCellValue = computed(() => {
    const cell = selectedCellData.value
    if (!cell) return ''
    return cell.value !== null && cell.value !== undefined ? String(cell.value) : ''
  })

  const importExcel = async (file: File) => {
    try {
      isLoading.value = true
      error.value = null
      const data = await parseExcelFile(file)
      sheets.value = data
      activeSheetIndex.value = 0
      fileName.value = file.name
      selectedCell.value = null
    } catch (err) {
      console.error('Import failed:', err)
      error.value = 'Failed to parse Excel file.'
    } finally {
      isLoading.value = false
    }
  }

  const updateCellValue = (row: number, col: number, value: string | number | null) => {
    pushUndo()
    const sheet = activeSheet.value
    if (!sheet) return
    if (!sheet.rows[row]) sheet.rows[row] = {}
    if (!sheet.rows[row]![col]) {
      sheet.rows[row]![col] = { value: null }
    }
    sheet.rows[row]![col]!.value = value
    triggerRef(sheets)
  }

  const selectCell = (row: number, col: number) => {
    // Commit any pending edit before selecting new cell
    if (editingCell.value && pendingEditValue.value !== null) {
      commitEdit(pendingEditValue.value)
    } else if (editingCell.value) {
      editingCell.value = null
    }
    selectedCell.value = { row, col }
    selectionRange.value = { startRow: row, startCol: col, endRow: row, endCol: col }
  }

  const setSelectionRange = (
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
  ) => {
    selectionRange.value = {
      startRow: Math.min(startRow, endRow),
      startCol: Math.min(startCol, endCol),
      endRow: Math.max(startRow, endRow),
      endCol: Math.max(startCol, endCol),
    }
  }

  // --- Helpers for formatting ---
  const ensureCellExists = (row: number, col: number) => {
    const sheet = activeSheet.value
    if (!sheet) return null
    if (!sheet.rows[row]) sheet.rows[row] = {}
    if (!sheet.rows[row]![col]) {
      sheet.rows[row]![col] = { value: null }
    }
    return sheet.rows[row]![col]!
  }

  const forEachSelectedCell = (fn: (row: number, col: number) => void) => {
    const range = selectionRange.value
    if (!range) {
      if (selectedCell.value) fn(selectedCell.value.row, selectedCell.value.col)
      return
    }
    for (let r = range.startRow; r <= range.endRow; r++) {
      for (let c = range.startCol; c <= range.endCol; c++) {
        fn(r, c)
      }
    }
  }

  const setCellStyleProp = <K extends keyof CellStyle>(key: K, value: CellStyle[K]) => {
    pushUndo()
    forEachSelectedCell((row, col) => {
      const cell = ensureCellExists(row, col)
      if (!cell) return
      if (!cell.style) cell.style = {}
      cell.style[key] = value
    })
    triggerRef(sheets)
  }

  const toggleCellStyleProp = (key: 'bold' | 'italic' | 'underline') => {
    // Check current state from first selected cell
    const sc = selectedCell.value
    if (!sc) return
    const sheet = activeSheet.value
    if (!sheet) return
    const currentCell = sheet.rows[sc.row]?.[sc.col]
    const currentVal = currentCell?.style?.[key] ?? false
    setCellStyleProp(key, !currentVal)
  }

  // --- Public formatting actions ---
  const toggleBold = () => toggleCellStyleProp('bold')
  const toggleItalic = () => toggleCellStyleProp('italic')
  const toggleUnderline = () => toggleCellStyleProp('underline')

  const setAlign = (align: CellStyle['align']) => setCellStyleProp('align', align)
  const setVerticalAlign = (va: CellStyle['verticalAlign']) => setCellStyleProp('verticalAlign', va)
  const toggleWrapText = () => {
    const sc = selectedCell.value
    if (!sc) return
    const sheet = activeSheet.value
    if (!sheet) return
    const currentCell = sheet.rows[sc.row]?.[sc.col]
    const currentVal = currentCell?.style?.wrapText ?? false
    setCellStyleProp('wrapText', !currentVal)
  }

  const setTextColor = (color: string) => setCellStyleProp('color', color)
  const setBgColor = (color: string) => setCellStyleProp('backgroundColor', color)

  // --- Merge / Unmerge ---
  const mergeCells = () => {
    const sheet = activeSheet.value
    const range = selectionRange.value
    if (!sheet || !range) return
    if (range.startRow === range.endRow && range.startCol === range.endCol) return
    pushUndo()

    const newMerge: MergeRange = {
      s: { r: range.startRow, c: range.startCol },
      e: { r: range.endRow, c: range.endCol },
    }

    // Remove any existing merges that overlap
    sheet.merges = sheet.merges.filter(
      (m) =>
        !(
          m.s.r >= range.startRow &&
          m.e.r <= range.endRow &&
          m.s.c >= range.startCol &&
          m.e.c <= range.endCol
        ),
    )

    // Move all values to top-left cell
    const topLeftCell = ensureCellExists(range.startRow, range.startCol)
    if (topLeftCell && (topLeftCell.value === null || topLeftCell.value === undefined)) {
      // Find first non-empty cell value in range
      for (let r = range.startRow; r <= range.endRow; r++) {
        for (let c = range.startCol; c <= range.endCol; c++) {
          if (r === range.startRow && c === range.startCol) continue
          const cell = sheet.rows[r]?.[c]
          if (cell?.value !== null && cell?.value !== undefined) {
            topLeftCell.value = cell.value
            cell.value = null
            break
          }
        }
        if (topLeftCell.value !== null) break
      }
    }

    sheet.merges.push(newMerge)
    triggerRef(sheets)
  }

  const unmergeCells = () => {
    const sheet = activeSheet.value
    const range = selectionRange.value
    if (!sheet || !range) return
    pushUndo()

    // Remove merges that overlap with the selection range
    sheet.merges = sheet.merges.filter((m) => {
      const overlaps =
        m.s.r <= range.endRow &&
        m.e.r >= range.startRow &&
        m.s.c <= range.endCol &&
        m.e.c >= range.startCol
      return !overlaps
    })
    triggerRef(sheets)
  }

  const startEditing = (row?: number, col?: number) => {
    if (row !== undefined && col !== undefined) {
      selectedCell.value = { row, col }
      editingCell.value = { row, col }
    } else if (selectedCell.value) {
      editingCell.value = { ...selectedCell.value }
    }
  }

  const commitEdit = (value: string) => {
    if (!editingCell.value) return
    const { row, col } = editingCell.value
    const numVal = Number(value)
    updateCellValue(row, col, value === '' ? null : isNaN(numVal) ? value : numVal)
    editingCell.value = null
    pendingEditValue.value = null
  }

  const cancelEdit = () => {
    editingCell.value = null
    pendingEditValue.value = null
  }

  const clearSelection = () => {
    selectedCell.value = null
    editingCell.value = null
  }

  const setZoom = (value: number) => {
    zoom.value = Math.max(0.5, Math.min(2.0, value))
  }

  const zoomIn = () => setZoom(zoom.value + 0.1)
  const zoomOut = () => setZoom(zoom.value - 0.1)

  const toggleGridlines = () => {
    showGridlines.value = !showGridlines.value
  }

  const setColumnWidth = (colIndex: number, width: number) => {
    const sheet = activeSheet.value
    if (!sheet || !sheet.columns[colIndex]) return
    sheet.columns[colIndex].width = Math.max(30, Math.round(width))
    triggerRef(sheets)
  }

  const setRowHeight = (rowIndex: number, height: number) => {
    const sheet = activeSheet.value
    if (!sheet) return
    if (!sheet.rowMetadata[rowIndex]) {
      sheet.rowMetadata[rowIndex] = { id: rowIndex, height: 24 }
    }
    sheet.rowMetadata[rowIndex].height = Math.max(16, Math.round(height))
    triggerRef(sheets)
  }

  const exportExcel = async () => {
    try {
      const blob = await exportToExcelBlob(sheets.value)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName.value || 'spreadsheet'}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      error.value = 'Failed to export Excel file.'
    }
  }

  // --- Border actions ---
  type BorderPosition = 'all' | 'outer' | 'top' | 'bottom' | 'left' | 'right' | 'none'

  const setCellBorder = (position: BorderPosition, style = 'thin', color = '#000000') => {
    pushUndo()
    const borderVal = { style, color }

    forEachSelectedCell((row, col) => {
      const cell = ensureCellExists(row, col)
      if (!cell) return
      if (!cell.style) cell.style = {}

      const range = selectionRange.value
      const isTop = range ? row === range.startRow : true
      const isBottom = range ? row === range.endRow : true
      const isLeft = range ? col === range.startCol : true
      const isRight = range ? col === range.endCol : true

      if (position === 'none') {
        cell.style.border = undefined
        return
      }

      if (!cell.style.border) cell.style.border = {}

      if (position === 'all') {
        cell.style.border = { top: borderVal, bottom: borderVal, left: borderVal, right: borderVal }
      } else if (position === 'outer') {
        if (isTop) cell.style.border.top = borderVal
        if (isBottom) cell.style.border.bottom = borderVal
        if (isLeft) cell.style.border.left = borderVal
        if (isRight) cell.style.border.right = borderVal
      } else if (position === 'top') {
        if (isTop) cell.style.border.top = borderVal
      } else if (position === 'bottom') {
        if (isBottom) cell.style.border.bottom = borderVal
      } else if (position === 'left') {
        if (isLeft) cell.style.border.left = borderVal
      } else if (position === 'right') {
        if (isRight) cell.style.border.right = borderVal
      }
    })
    triggerRef(sheets)
  }

  // --- Insert image into cell ---
  const insertImageToCell = (row: number, col: number, dataUrl: string) => {
    pushUndo()
    const cell = ensureCellExists(row, col)
    if (!cell) return
    cell.value = dataUrl
    triggerRef(sheets)
  }

  // --- Shape manipulation ---
  const selectedShapeId = ref<string | null>(null)

  const selectedShape = computed<ExcelShape | null>(() => {
    if (!selectedShapeId.value || !activeSheet.value) return null
    return activeSheet.value.shapes.find((s) => s.id === selectedShapeId.value) ?? null
  })

  const selectShape = (id: string | null) => {
    selectedShapeId.value = id
    if (id) {
      selectedCell.value = null
      editingCell.value = null
    }
  }

  const addShape = (shape: ExcelShape) => {
    const sheet = activeSheet.value
    if (!sheet) return
    pushUndo()
    sheet.shapes.push(shape)
    selectedShapeId.value = shape.id
    triggerRef(sheets)
  }

  const updateShape = (id: string, updates: Partial<ExcelShape>) => {
    const sheet = activeSheet.value
    if (!sheet) return
    const idx = sheet.shapes.findIndex((s) => s.id === id)
    if (idx === -1) return
    Object.assign(sheet.shapes[idx]!, updates)
    triggerRef(sheets)
  }

  const moveShape = (id: string, x: number, y: number) => {
    updateShape(id, { x, y })
  }

  const resizeShape = (id: string, w: number, h: number, x?: number, y?: number) => {
    const updates: Partial<ExcelShape> = { w: Math.max(10, w), h: Math.max(10, h) }
    if (x !== undefined) updates.x = x
    if (y !== undefined) updates.y = y
    updateShape(id, updates)
  }

  const rotateShape = (id: string, angle: number) => {
    const shape = activeSheet.value?.shapes.find((s) => s.id === id)
    if (!shape) return
    pushUndo()
    updateShape(id, { rotation: ((shape.rotation ?? 0) + angle) % 360 })
  }

  const flipShape = (id: string, direction: 'horizontal' | 'vertical') => {
    const shape = activeSheet.value?.shapes.find((s) => s.id === id)
    if (!shape) return
    pushUndo()
    if (direction === 'horizontal') {
      updateShape(id, { flipH: !shape.flipH })
    } else {
      updateShape(id, { flipV: !shape.flipV })
    }
  }

  const setShapeOpacity = (id: string, opacity: number) => {
    pushUndo()
    updateShape(id, { opacity: Math.max(0, Math.min(1, opacity)) })
  }

  const deleteShape = (id: string) => {
    const sheet = activeSheet.value
    if (!sheet) return
    pushUndo()
    sheet.shapes = sheet.shapes.filter((s) => s.id !== id)
    if (selectedShapeId.value === id) selectedShapeId.value = null
    triggerRef(sheets)
  }

  const duplicateShape = (id: string) => {
    const sheet = activeSheet.value
    if (!sheet) return
    const shape = sheet.shapes.find((s) => s.id === id)
    if (!shape) return
    pushUndo()
    const clone: ExcelShape = {
      ...JSON.parse(JSON.stringify(shape)),
      id: `shp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      x: shape.x + 20,
      y: shape.y + 20,
    }
    sheet.shapes.push(clone)
    selectedShapeId.value = clone.id
    triggerRef(sheets)
  }

  const bringShapeForward = (id: string) => {
    const sheet = activeSheet.value
    if (!sheet) return
    const idx = sheet.shapes.findIndex((s) => s.id === id)
    if (idx === -1 || idx === sheet.shapes.length - 1) return
    pushUndo()
    const [item] = sheet.shapes.splice(idx, 1)
    sheet.shapes.splice(idx + 1, 0, item!)
    triggerRef(sheets)
  }

  const sendShapeBackward = (id: string) => {
    const sheet = activeSheet.value
    if (!sheet) return
    const idx = sheet.shapes.findIndex((s) => s.id === id)
    if (idx <= 0) return
    pushUndo()
    const [item] = sheet.shapes.splice(idx, 1)
    sheet.shapes.splice(idx - 1, 0, item!)
    triggerRef(sheets)
  }

  // --- Designer mode: Cell Input Config ---
  const setCellInputConfig = (row: number, col: number, config: InputConfig | undefined) => {
    const sheet = activeSheet.value
    if (!sheet) return
    pushUndo()
    const cell = ensureCellExists(row, col)
    if (!cell) return
    cell.inputConfig = config
    triggerRef(sheets)
  }

  const addSheet = () => {
    pushUndo()
    const newSheet = generateEmptySheet(`Sheet ${sheets.value.length + 1}`)
    sheets.value.push(newSheet)
    activeSheetIndex.value = sheets.value.length - 1
  }

  const reset = () => {
    sheets.value = [generateEmptySheet('Sheet1')]
    activeSheetIndex.value = 0
    fileName.value = 'Untitled Project'
    error.value = null
    selectedCell.value = null
    zoom.value = 1.0
    showGridlines.value = true
  }

  return {
    sheets,
    activeSheetIndex,
    fileName,
    isLoading,
    error,
    appMode,
    currentUserRole,
    showGridlines,
    zoom,
    selectedCell,
    selectionRange,
    activeSheet,
    selectedCellAddress,
    selectedCellData,
    selectedCellValue,
    editingCell,
    pendingEditValue,
    formulaBarFocused,
    importExcel,
    exportExcel,
    addSheet,
    updateCellValue,
    selectCell,
    setSelectionRange,
    startEditing,
    commitEdit,
    cancelEdit,
    clearSelection,
    setZoom,
    zoomIn,
    zoomOut,
    toggleGridlines,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    setAlign,
    setVerticalAlign,
    toggleWrapText,
    setTextColor,
    setBgColor,
    mergeCells,
    unmergeCells,
    setCellBorder,
    insertImageToCell,
    selectedShapeId,
    selectedShape,
    selectShape,
    addShape,
    updateShape,
    moveShape,
    resizeShape,
    rotateShape,
    flipShape,
    setShapeOpacity,
    deleteShape,
    duplicateShape,
    bringShapeForward,
    sendShapeBackward,
    setCellInputConfig,
    setColumnWidth,
    setRowHeight,
    pushUndo,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  }
})
