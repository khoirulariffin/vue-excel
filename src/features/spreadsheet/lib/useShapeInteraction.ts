import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ExcelShape } from '@/shared/types'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'
import { touchToMouseCoords } from '@/shared/lib/useTouchGestures'

export const useShapeInteraction = () => {
  const store = useSpreadsheetStore()

  // --- Drag state ---
  const isDragging = ref(false)
  const dragStartX = ref(0)
  const dragStartY = ref(0)
  const dragShapeStartX = ref(0)
  const dragShapeStartY = ref(0)

  // --- Resize state ---
  const isResizing = ref(false)
  const resizeHandle = ref('')
  const resizeStartX = ref(0)
  const resizeStartY = ref(0)
  const resizeStartW = ref(0)
  const resizeStartH = ref(0)
  const resizeStartShapeX = ref(0)
  const resizeStartShapeY = ref(0)

  // --- Rotate state ---
  const isRotating = ref(false)
  const rotateStartAngle = ref(0)
  const rotateCenterX = ref(0)
  const rotateCenterY = ref(0)

  // --- Crop state ---
  const isCropping = ref(false)
  const cropRect = ref({ x: 0, y: 0, w: 0, h: 0 })
  const isCropDragging = ref(false)
  const cropDragHandle = ref('')
  const cropDragStartX = ref(0)
  const cropDragStartY = ref(0)
  const cropDragStartRect = ref({ x: 0, y: 0, w: 0, h: 0 })

  const isSelected = (id: string) => store.selectedShapeId === id

  const selectedShapeObj = computed(() => store.selectedShape)

  const toolbarPosition = computed(() => {
    const shape = selectedShapeObj.value
    if (!shape) return { x: 0, y: 0 }
    return {
      x: shape.x + 40 + shape.w / 2,
      y: shape.y + 32 - 12,
    }
  })

  // --- Click to select / drag ---
  const handleShapeMouseDown = (e: MouseEvent, shape: ExcelShape) => {
    e.stopPropagation()
    e.preventDefault()
    store.selectShape(shape.id)

    isDragging.value = true
    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
    dragShapeStartX.value = shape.x
    dragShapeStartY.value = shape.y
  }

  // --- Resize handles ---
  const handleResizeMouseDown = (e: MouseEvent, handle: string) => {
    e.stopPropagation()
    e.preventDefault()
    const shape = selectedShapeObj.value
    if (!shape) return

    isResizing.value = true
    resizeHandle.value = handle
    resizeStartX.value = e.clientX
    resizeStartY.value = e.clientY
    resizeStartW.value = shape.w
    resizeStartH.value = shape.h
    resizeStartShapeX.value = shape.x
    resizeStartShapeY.value = shape.y
    store.pushUndo()
  }

  // --- Rotate handle ---
  const handleRotateMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const shape = selectedShapeObj.value
    if (!shape) return

    isRotating.value = true
    rotateCenterX.value = shape.x + 40 + shape.w / 2
    rotateCenterY.value = shape.y + 32 + shape.h / 2
    const dx = e.clientX - rotateCenterX.value
    const dy = e.clientY - rotateCenterY.value
    rotateStartAngle.value = Math.atan2(dy, dx) * (180 / Math.PI) - (shape.rotation ?? 0)
    store.pushUndo()
  }

  // --- Crop ---
  const startCrop = () => {
    const shape = selectedShapeObj.value
    if (!shape || shape.type !== 'image') return
    isCropping.value = true
    // Start with 80% crop area centered
    const margin = 0.1
    cropRect.value = {
      x: shape.w * margin,
      y: shape.h * margin,
      w: shape.w * (1 - margin * 2),
      h: shape.h * (1 - margin * 2),
    }
  }

  const applyCrop = () => {
    const shape = selectedShapeObj.value
    if (!shape || !shape.src) return
    store.pushUndo()

    // Crop the actual image using canvas
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const scaleX = img.naturalWidth / shape.w
      const scaleY = img.naturalHeight / shape.h
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = cropRect.value.w * scaleX
      canvas.height = cropRect.value.h * scaleY
      ctx.drawImage(
        img,
        cropRect.value.x * scaleX,
        cropRect.value.y * scaleY,
        canvas.width,
        canvas.height,
        0,
        0,
        canvas.width,
        canvas.height,
      )
      const croppedSrc = canvas.toDataURL('image/png')
      store.updateShape(shape.id, {
        src: croppedSrc,
        x: shape.x + cropRect.value.x,
        y: shape.y + cropRect.value.y,
        w: cropRect.value.w,
        h: cropRect.value.h,
      })
      isCropping.value = false
    }
    img.src = shape.src
  }

  const cancelCrop = () => {
    isCropping.value = false
  }

  const handleCropMouseDown = (e: MouseEvent, handle: string) => {
    e.stopPropagation()
    e.preventDefault()
    isCropDragging.value = true
    cropDragHandle.value = handle
    cropDragStartX.value = e.clientX
    cropDragStartY.value = e.clientY
    cropDragStartRect.value = { ...cropRect.value }
  }

  const handleCropMouseMove = (e: MouseEvent) => {
    if (!isCropDragging.value) return
    const shape = selectedShapeObj.value
    if (!shape) return

    const dx = e.clientX - cropDragStartX.value
    const dy = e.clientY - cropDragStartY.value
    const s = cropDragStartRect.value
    const h = cropDragHandle.value
    const minSize = 20

    let { x, y, w, h: ch } = { x: s.x, y: s.y, w: s.w, h: s.h }

    if (h === 'move') {
      x = Math.max(0, Math.min(shape.w - w, s.x + dx))
      y = Math.max(0, Math.min(shape.h - ch, s.y + dy))
    } else {
      if (h.includes('e')) w = Math.max(minSize, Math.min(shape.w - x, s.w + dx))
      if (h.includes('w')) {
        const newW = Math.max(minSize, s.w - dx)
        const newX = s.x + (s.w - newW)
        if (newX >= 0) {
          x = newX
          w = newW
        }
      }
      if (h.includes('s')) ch = Math.max(minSize, Math.min(shape.h - y, s.h + dy))
      if (h.includes('n')) {
        const newH = Math.max(minSize, s.h - dy)
        const newY = s.y + (s.h - newH)
        if (newY >= 0) {
          y = newY
          ch = newH
        }
      }
    }

    cropRect.value = { x, y, w, h: ch }
  }

  const handleCropMouseUp = () => {
    isCropDragging.value = false
    cropDragHandle.value = ''
  }

  // --- Export/Download Object ---
  const exportObject = () => {
    const shape = selectedShapeObj.value
    if (!shape) return

    if (shape.type === 'image' && shape.src) {
      // Download image directly
      const link = document.createElement('a')
      link.download = `image-${Date.now()}.png`
      link.href = shape.src
      link.click()
    } else if (shape.type === 'form') {
      // Render SVG shape to canvas and download
      const canvas = document.createElement('canvas')
      const scale = 2
      canvas.width = shape.w * scale
      canvas.height = shape.h * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)

      // Draw shape
      ctx.fillStyle = shape.fill || 'transparent'
      ctx.strokeStyle = shape.stroke || 'transparent'
      ctx.lineWidth = shape.strokeWidth || 1

      if (shape.shapeType === 'ellipse') {
        ctx.beginPath()
        ctx.ellipse(shape.w / 2, shape.h / 2, shape.w / 2, shape.h / 2, 0, 0, Math.PI * 2)
        if (shape.fill && shape.fill !== 'transparent') ctx.fill()
        if (shape.stroke && shape.stroke !== 'transparent') ctx.stroke()
      } else if (shape.shapeType === 'triangle') {
        ctx.beginPath()
        ctx.moveTo(shape.w / 2, 0)
        ctx.lineTo(shape.w, shape.h)
        ctx.lineTo(0, shape.h)
        ctx.closePath()
        if (shape.fill && shape.fill !== 'transparent') ctx.fill()
        if (shape.stroke && shape.stroke !== 'transparent') ctx.stroke()
      } else if (shape.shapeType === 'roundRect') {
        const r = 10
        ctx.beginPath()
        ctx.roundRect(0, 0, shape.w, shape.h, r)
        if (shape.fill && shape.fill !== 'transparent') ctx.fill()
        if (shape.stroke && shape.stroke !== 'transparent') ctx.stroke()
      } else {
        if (shape.fill && shape.fill !== 'transparent') ctx.fillRect(0, 0, shape.w, shape.h)
        if (shape.stroke && shape.stroke !== 'transparent')
          ctx.strokeRect(0, 0, shape.w, shape.h)
      }

      // Draw text
      if (shape.text) {
        ctx.fillStyle = shape.textColor || '#000000'
        ctx.font = `${shape.textBold ? 'bold ' : ''}${shape.textSize || 11}pt sans-serif`
        ctx.textAlign = (shape.textAlign as CanvasTextAlign) || 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(shape.text, shape.w / 2, shape.h / 2)
      }

      const link = document.createElement('a')
      link.download = `${shape.shapeType || 'shape'}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  // --- Touch handlers for shape drag/resize/rotate ---
  const handleShapeTouchStart = (e: TouchEvent, shape: ExcelShape) => {
    e.stopPropagation()
    e.preventDefault()
    store.selectShape(shape.id)
    const { clientX, clientY } = touchToMouseCoords(e)
    isDragging.value = true
    dragStartX.value = clientX
    dragStartY.value = clientY
    dragShapeStartX.value = shape.x
    dragShapeStartY.value = shape.y
  }

  const handleResizeTouchStart = (e: TouchEvent, handle: string) => {
    e.stopPropagation()
    e.preventDefault()
    const shape = selectedShapeObj.value
    if (!shape) return
    const { clientX, clientY } = touchToMouseCoords(e)
    isResizing.value = true
    resizeHandle.value = handle
    resizeStartX.value = clientX
    resizeStartY.value = clientY
    resizeStartW.value = shape.w
    resizeStartH.value = shape.h
    resizeStartShapeX.value = shape.x
    resizeStartShapeY.value = shape.y
    store.pushUndo()
  }

  const handleRotateTouchStart = (e: TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const shape = selectedShapeObj.value
    if (!shape) return
    const { clientX, clientY } = touchToMouseCoords(e)
    isRotating.value = true
    rotateCenterX.value = shape.x + 40 + shape.w / 2
    rotateCenterY.value = shape.y + 32 + shape.h / 2
    const dx = clientX - rotateCenterX.value
    const dy = clientY - rotateCenterY.value
    rotateStartAngle.value = Math.atan2(dy, dx) * (180 / Math.PI) - (shape.rotation ?? 0)
    store.pushUndo()
  }

  const handleCropTouchStart = (e: TouchEvent, handle: string) => {
    e.stopPropagation()
    e.preventDefault()
    const { clientX, clientY } = touchToMouseCoords(e)
    isCropDragging.value = true
    cropDragHandle.value = handle
    cropDragStartX.value = clientX
    cropDragStartY.value = clientY
    cropDragStartRect.value = { ...cropRect.value }
  }

  // --- Global mouse move/up ---
  const handleMouseMove = (e: MouseEvent) => {
    // Handle crop drag first
    if (isCropDragging.value) {
      handleCropMouseMove(e)
      return
    }

    const shape = selectedShapeObj.value
    if (!shape) return

    if (isDragging.value) {
      const dx = e.clientX - dragStartX.value
      const dy = e.clientY - dragStartY.value
      store.moveShape(shape.id, dragShapeStartX.value + dx, dragShapeStartY.value + dy)
    }

    if (isResizing.value) {
      const dx = e.clientX - resizeStartX.value
      const dy = e.clientY - resizeStartY.value
      const h = resizeHandle.value

      let newW = resizeStartW.value
      let newH = resizeStartH.value
      let newX = resizeStartShapeX.value
      let newY = resizeStartShapeY.value

      if (h.includes('e')) newW = resizeStartW.value + dx
      if (h.includes('w')) {
        newW = resizeStartW.value - dx
        newX = resizeStartShapeX.value + dx
      }
      if (h.includes('s')) newH = resizeStartH.value + dy
      if (h.includes('n')) {
        newH = resizeStartH.value - dy
        newY = resizeStartShapeY.value + dy
      }

      store.resizeShape(shape.id, newW, newH, newX, newY)
    }

    if (isRotating.value) {
      const dx = e.clientX - rotateCenterX.value
      const dy = e.clientY - rotateCenterY.value
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)
      const newRotation = Math.round(angle - rotateStartAngle.value)
      store.updateShape(shape.id, { rotation: ((newRotation % 360) + 360) % 360 })
    }
  }

  const handleMouseUp = () => {
    isDragging.value = false
    isResizing.value = false
    isRotating.value = false
    handleCropMouseUp()
  }

  const handleTouchMove = (e: TouchEvent) => {
    const { clientX, clientY } = touchToMouseCoords(e)
    handleMouseMove({ clientX, clientY } as MouseEvent)
  }

  const handleTouchUp = () => {
    handleMouseUp()
  }

  const handleBackgroundClick = () => {
    if (!isDragging.value && !isResizing.value && !isRotating.value) {
      store.selectShape(null)
      isCropping.value = false
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!store.selectedShapeId) return
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (store.editingCell) return
      store.deleteShape(store.selectedShapeId)
    }
    if (e.key === 'Escape') {
      store.selectShape(null)
      isCropping.value = false
    }
  }

  // --- Lifecycle ---
  onMounted(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchUp)
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleTouchUp)
    window.removeEventListener('keydown', handleKeyDown)
  })

  // --- Resize handle styles ---
  const resizeHandles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const

  const getHandleStyle = (handle: string, shape: ExcelShape) => {
    const size = 8
    const half = size / 2
    const w = shape.w
    const h = shape.h
    const positions: Record<string, { left: string; top: string; cursor: string }> = {
      nw: { left: `${-half}px`, top: `${-half}px`, cursor: 'nw-resize' },
      n: { left: `${w / 2 - half}px`, top: `${-half}px`, cursor: 'n-resize' },
      ne: { left: `${w - half}px`, top: `${-half}px`, cursor: 'ne-resize' },
      e: { left: `${w - half}px`, top: `${h / 2 - half}px`, cursor: 'e-resize' },
      se: { left: `${w - half}px`, top: `${h - half}px`, cursor: 'se-resize' },
      s: { left: `${w / 2 - half}px`, top: `${h - half}px`, cursor: 's-resize' },
      sw: { left: `${-half}px`, top: `${h - half}px`, cursor: 'sw-resize' },
      w: { left: `${-half}px`, top: `${h / 2 - half}px`, cursor: 'w-resize' },
    }
    return {
      ...positions[handle],
      width: `${size}px`,
      height: `${size}px`,
      position: 'absolute' as const,
    }
  }

  return {
    // State
    isDragging,
    isCropping,
    cropRect,
    selectedShapeObj,
    toolbarPosition,
    resizeHandles,
    // Methods
    isSelected,
    getHandleStyle,
    handleShapeMouseDown,
    handleShapeTouchStart,
    handleResizeMouseDown,
    handleResizeTouchStart,
    handleRotateMouseDown,
    handleRotateTouchStart,
    handleCropMouseDown,
    handleCropTouchStart,
    handleBackgroundClick,
    startCrop,
    applyCrop,
    cancelCrop,
    exportObject,
  }
}
