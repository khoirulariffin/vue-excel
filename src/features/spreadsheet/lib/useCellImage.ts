import { ref, computed, onUnmounted } from 'vue'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'
import { touchToMouseCoords } from '@/shared/lib/useTouchGestures'

export const isImageValue = (val: string | number | null) =>
  typeof val === 'string' && val.startsWith('data:image')

export const useCellImage = (
  rowIndex: () => number,
  colIndex: () => number,
  rowHeight: () => number,
  isSelected: () => boolean,
  cellValue: () => string | number | null,
  operatorValue: () => string,
) => {
  const store = useSpreadsheetStore()

  // --- Image Preview Modal ---
  const showImagePreview = ref(false)
  const showDrawPad = ref(false)

  const currentImageSrc = computed(() => {
    const val = cellValue()
    if (typeof val === 'string' && val.startsWith('data:image')) return val
    const opVal = operatorValue()
    if (opVal && opVal.startsWith('data:image')) return opVal
    return ''
  })

  const hasImageInCell = computed(() => isImageValue(cellValue()))

  const showResizeHandle = computed(() => {
    if (!isSelected()) return false
    if (!hasImageInCell.value) return false
    if (store.appMode === 'designer') return false
    return true
  })

  const handleImagePreviewSave = (dataUrl: string) => {
    store.updateCellValue(rowIndex(), colIndex(), dataUrl)
    showImagePreview.value = false
  }

  const handleImageDelete = () => {
    store.updateCellValue(rowIndex(), colIndex(), null)
    showImagePreview.value = false
  }

  const handleImageReplace = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      store.updateCellValue(rowIndex(), colIndex(), dataUrl)
      showImagePreview.value = false
    }
    reader.readAsDataURL(file)
    input.value = ''
  }

  const handleImageUpload = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      store.updateCellValue(rowIndex(), colIndex(), dataUrl)
    }
    reader.readAsDataURL(file)
    input.value = ''
  }

  const handleDrawSave = (dataUrl: string) => {
    store.updateCellValue(rowIndex(), colIndex(), dataUrl)
    showDrawPad.value = false
  }

  // --- Image Resize ---
  const imgResizing = ref<{
    startX: number
    startY: number
    startW: number
    startH: number
  } | null>(null)

  const handleImgResizeStart = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const sheet = store.activeSheet
    if (!sheet) return
    const colW = sheet.columns[colIndex()]?.width ?? 80
    const rowH = sheet.rowMetadata?.[rowIndex()]?.height ?? rowHeight()
    store.pushUndo()
    imgResizing.value = { startX: e.clientX, startY: e.clientY, startW: colW, startH: rowH }
    window.addEventListener('mousemove', handleImgResizeMove)
    window.addEventListener('mouseup', handleImgResizeEnd)
  }

  const handleImgResizeMove = (e: MouseEvent) => {
    if (!imgResizing.value) return
    const dx = e.clientX - imgResizing.value.startX
    const dy = e.clientY - imgResizing.value.startY
    const newW = Math.max(30, imgResizing.value.startW + dx)
    const newH = Math.max(14, imgResizing.value.startH + dy)
    store.setColumnWidth(colIndex(), newW)
    store.setRowHeight(rowIndex(), newH)
  }

  const handleImgResizeEnd = () => {
    imgResizing.value = null
    window.removeEventListener('mousemove', handleImgResizeMove)
    window.removeEventListener('mousemove', handleWidthResizeMove)
    window.removeEventListener('mousemove', handleHeightResizeMove)
    window.removeEventListener('mouseup', handleImgResizeEnd)
    window.removeEventListener('touchmove', handleImgTouchMove)
    window.removeEventListener('touchmove', handleWidthTouchMove)
    window.removeEventListener('touchmove', handleHeightTouchMove)
    window.removeEventListener('touchend', handleImgResizeEnd)
  }

  const handleWidthResizeStart = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const sheet = store.activeSheet
    if (!sheet) return
    const colW = sheet.columns[colIndex()]?.width ?? 80
    const rowH = sheet.rowMetadata?.[rowIndex()]?.height ?? rowHeight()
    store.pushUndo()
    imgResizing.value = { startX: e.clientX, startY: e.clientY, startW: colW, startH: rowH }
    window.addEventListener('mousemove', handleWidthResizeMove)
    window.addEventListener('mouseup', handleImgResizeEnd)
  }

  const handleWidthResizeMove = (e: MouseEvent) => {
    if (!imgResizing.value) return
    const dx = e.clientX - imgResizing.value.startX
    const newW = Math.max(30, imgResizing.value.startW + dx)
    store.setColumnWidth(colIndex(), newW)
  }

  const handleHeightResizeStart = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const sheet = store.activeSheet
    if (!sheet) return
    const colW = sheet.columns[colIndex()]?.width ?? 80
    const rowH = sheet.rowMetadata?.[rowIndex()]?.height ?? rowHeight()
    store.pushUndo()
    imgResizing.value = { startX: e.clientX, startY: e.clientY, startW: colW, startH: rowH }
    window.addEventListener('mousemove', handleHeightResizeMove)
    window.addEventListener('mouseup', handleImgResizeEnd)
  }

  const handleHeightResizeMove = (e: MouseEvent) => {
    if (!imgResizing.value) return
    const dy = e.clientY - imgResizing.value.startY
    const newH = Math.max(14, imgResizing.value.startH + dy)
    store.setRowHeight(rowIndex(), newH)
  }

  // --- Touch resize handlers ---
  const initResizeState = (clientX: number, clientY: number) => {
    const sheet = store.activeSheet
    if (!sheet) return false
    const colW = sheet.columns[colIndex()]?.width ?? 80
    const rowH = sheet.rowMetadata?.[rowIndex()]?.height ?? rowHeight()
    store.pushUndo()
    imgResizing.value = { startX: clientX, startY: clientY, startW: colW, startH: rowH }
    return true
  }

  const handleImgTouchMove = (e: TouchEvent) => {
    const { clientX, clientY } = touchToMouseCoords(e)
    if (!imgResizing.value) return
    const dx = clientX - imgResizing.value.startX
    const dy = clientY - imgResizing.value.startY
    const newW = Math.max(30, imgResizing.value.startW + dx)
    const newH = Math.max(14, imgResizing.value.startH + dy)
    store.setColumnWidth(colIndex(), newW)
    store.setRowHeight(rowIndex(), newH)
  }

  const handleWidthTouchMove = (e: TouchEvent) => {
    const { clientX } = touchToMouseCoords(e)
    if (!imgResizing.value) return
    const dx = clientX - imgResizing.value.startX
    const newW = Math.max(30, imgResizing.value.startW + dx)
    store.setColumnWidth(colIndex(), newW)
  }

  const handleHeightTouchMove = (e: TouchEvent) => {
    const { clientY } = touchToMouseCoords(e)
    if (!imgResizing.value) return
    const dy = clientY - imgResizing.value.startY
    const newH = Math.max(14, imgResizing.value.startH + dy)
    store.setRowHeight(rowIndex(), newH)
  }

  const handleTouchImgResizeStart = (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const { clientX, clientY } = touchToMouseCoords(e)
    if (!initResizeState(clientX, clientY)) return
    window.addEventListener('touchmove', handleImgTouchMove, { passive: false })
    window.addEventListener('touchend', handleImgResizeEnd)
  }

  const handleTouchWidthResizeStart = (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const { clientX, clientY } = touchToMouseCoords(e)
    if (!initResizeState(clientX, clientY)) return
    window.addEventListener('touchmove', handleWidthTouchMove, { passive: false })
    window.addEventListener('touchend', handleImgResizeEnd)
  }

  const handleTouchHeightResizeStart = (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const { clientX, clientY } = touchToMouseCoords(e)
    if (!initResizeState(clientX, clientY)) return
    window.addEventListener('touchmove', handleHeightTouchMove, { passive: false })
    window.addEventListener('touchend', handleImgResizeEnd)
  }

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleImgResizeMove)
    window.removeEventListener('mousemove', handleWidthResizeMove)
    window.removeEventListener('mousemove', handleHeightResizeMove)
    window.removeEventListener('mouseup', handleImgResizeEnd)
    window.removeEventListener('touchmove', handleImgTouchMove)
    window.removeEventListener('touchmove', handleWidthTouchMove)
    window.removeEventListener('touchmove', handleHeightTouchMove)
    window.removeEventListener('touchend', handleImgResizeEnd)
  })

  return {
    showImagePreview,
    showDrawPad,
    currentImageSrc,
    hasImageInCell,
    showResizeHandle,
    handleImagePreviewSave,
    handleImageDelete,
    handleImageReplace,
    handleImageUpload,
    handleDrawSave,
    handleImgResizeStart,
    handleWidthResizeStart,
    handleHeightResizeStart,
    handleTouchImgResizeStart,
    handleTouchWidthResizeStart,
    handleTouchHeightResizeStart,
  }
}
