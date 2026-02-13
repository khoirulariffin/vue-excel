import { ref, computed, watch, nextTick } from 'vue'

export interface DrawStroke {
  points: { x: number; y: number }[]
  color: string
  size: number
}

export const useImageCanvas = (imageSrc: () => string, isOpen: () => boolean) => {
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const imgRef = ref<HTMLImageElement | null>(null)
  const containerRef = ref<HTMLDivElement | null>(null)

  const scale = ref(1)
  const rotation = ref(0)
  const isCropping = ref(false)

  // Crop state
  const cropStart = ref({ x: 0, y: 0 })
  const cropEnd = ref({ x: 0, y: 0 })
  const isCropDragging = ref(false)

  // Draw state
  const drawMode = ref(false)
  const drawColor = ref('#ef4444')
  const drawBrushSize = ref(3)
  const isDrawingStroke = ref(false)
  const drawStrokes = ref<DrawStroke[]>([])
  const currentStroke = ref<{ x: number; y: number }[]>([])

  const drawColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#8b5cf6', '#ec4899', '#000000',
    '#ffffff',
  ]

  // Original image dimensions
  const naturalWidth = ref(0)
  const naturalHeight = ref(0)

  const displayDimensions = computed(() => {
    const maxW = 500
    const maxH = 400
    const nw = naturalWidth.value
    const nh = naturalHeight.value
    if (!nw || !nh) return { width: maxW, height: maxH }

    const ratio = Math.min(maxW / nw, maxH / nh, 1)
    return {
      width: Math.round(nw * ratio),
      height: Math.round(nh * ratio),
    }
  })

  const loadImage = () => {
    const src = imageSrc()
    if (!src) return
    const img = new Image()
    img.onload = () => {
      naturalWidth.value = img.naturalWidth
      naturalHeight.value = img.naturalHeight
      imgRef.value = img
      nextTick(drawCanvas)
    }
    img.src = src
  }

  watch(
    () => isOpen(),
    (open) => {
      if (open) {
        scale.value = 1
        rotation.value = 0
        isCropping.value = false
        drawMode.value = false
        drawStrokes.value = []
        currentStroke.value = []
        cropStart.value = { x: 0, y: 0 }
        cropEnd.value = { x: 0, y: 0 }
        nextTick(loadImage)
      }
    },
  )

  const drawCanvas = () => {
    const canvas = canvasRef.value
    const img = imgRef.value
    if (!canvas || !img) return

    const dw = displayDimensions.value.width
    const dh = displayDimensions.value.height

    canvas.width = dw * 2
    canvas.height = dh * 2
    canvas.style.width = `${dw}px`
    canvas.style.height = `${dh}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.scale(scale.value * 2, scale.value * 2)
    ctx.rotate((rotation.value * Math.PI) / 180)
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)

    ctx.restore()

    // Draw saved strokes
    if (drawStrokes.value.length > 0) {
      for (const stroke of drawStrokes.value) {
        if (stroke.points.length < 2) continue
        ctx.save()
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.size * 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(stroke.points[0]!.x * 2, stroke.points[0]!.y * 2)
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i]!.x * 2, stroke.points[i]!.y * 2)
        }
        ctx.stroke()
        ctx.restore()
      }
    }

    // Draw crop overlay
    if (
      isCropping.value &&
      (cropStart.value.x !== cropEnd.value.x || cropStart.value.y !== cropEnd.value.y)
    ) {
      const sx = Math.min(cropStart.value.x, cropEnd.value.x) * 2
      const sy = Math.min(cropStart.value.y, cropEnd.value.y) * 2
      const sw = Math.abs(cropEnd.value.x - cropStart.value.x) * 2
      const sh = Math.abs(cropEnd.value.y - cropStart.value.y) * 2

      // Darken outside crop
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, canvas.width, sy)
      ctx.fillRect(0, sy, sx, sh)
      ctx.fillRect(sx + sw, sy, canvas.width - sx - sw, sh)
      ctx.fillRect(0, sy + sh, canvas.width, canvas.height - sy - sh)

      // Crop border
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 3])
      ctx.strokeRect(sx, sy, sw, sh)
      ctx.setLineDash([])

      // Corner handles
      const handleSize = 8
      ctx.fillStyle = '#3b82f6'
      const corners: [number, number][] = [
        [sx, sy],
        [sx + sw, sy],
        [sx, sy + sh],
        [sx + sw, sy + sh],
      ]
      for (const [cx, cy] of corners) {
        ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize)
      }
    }
  }

  watch([scale, rotation], () => drawCanvas())

  // --- Actions ---
  const handleZoomIn = () => {
    scale.value = Math.min(scale.value + 0.15, 3)
  }

  const handleZoomOut = () => {
    scale.value = Math.max(scale.value - 0.15, 0.2)
  }

  const handleRotateRight = () => {
    rotation.value = (rotation.value + 90) % 360
  }

  const handleRotateLeft = () => {
    rotation.value = (rotation.value - 90 + 360) % 360
  }

  const handleReset = () => {
    scale.value = 1
    rotation.value = 0
    isCropping.value = false
    drawMode.value = false
    drawStrokes.value = []
    currentStroke.value = []
    cropStart.value = { x: 0, y: 0 }
    cropEnd.value = { x: 0, y: 0 }
    drawCanvas()
  }

  const toggleCrop = () => {
    isCropping.value = !isCropping.value
    drawMode.value = false
    if (isCropping.value) {
      cropStart.value = { x: 0, y: 0 }
      cropEnd.value = { x: 0, y: 0 }
    }
    drawCanvas()
  }

  const toggleDraw = () => {
    drawMode.value = !drawMode.value
    isCropping.value = false
    drawCanvas()
  }

  const undoDrawStroke = () => {
    if (drawStrokes.value.length > 0) {
      drawStrokes.value.pop()
      drawCanvas()
    }
  }

  // --- Canvas mouse events ---
  const getCanvasCoords = (e: MouseEvent) => {
    const canvas = canvasRef.value
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    }
  }

  const drawStrokesOnCanvas = () => {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw saved strokes
    for (const stroke of drawStrokes.value) {
      if (stroke.points.length < 2) continue
      ctx.save()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.size * 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(stroke.points[0]!.x * 2, stroke.points[0]!.y * 2)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i]!.x * 2, stroke.points[i]!.y * 2)
      }
      ctx.stroke()
      ctx.restore()
    }

    // Draw current in-progress stroke
    if (currentStroke.value.length >= 2) {
      ctx.save()
      ctx.strokeStyle = drawColor.value
      ctx.lineWidth = drawBrushSize.value * 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(currentStroke.value[0]!.x * 2, currentStroke.value[0]!.y * 2)
      for (let i = 1; i < currentStroke.value.length; i++) {
        ctx.lineTo(currentStroke.value[i]!.x * 2, currentStroke.value[i]!.y * 2)
      }
      ctx.stroke()
      ctx.restore()
    }
  }

  const handleCanvasMouseDown = (e: MouseEvent) => {
    if (isCropping.value) {
      isCropDragging.value = true
      const coords = getCanvasCoords(e)
      cropStart.value = coords
      cropEnd.value = coords
    } else if (drawMode.value) {
      isDrawingStroke.value = true
      const coords = getCanvasCoords(e)
      currentStroke.value = [coords]
    }
  }

  const handleCanvasMouseMove = (e: MouseEvent) => {
    if (isCropDragging.value) {
      cropEnd.value = getCanvasCoords(e)
      drawCanvas()
    } else if (isDrawingStroke.value) {
      const coords = getCanvasCoords(e)
      currentStroke.value.push(coords)
      drawCanvas()
      drawStrokesOnCanvas()
    }
  }

  const handleCanvasMouseUp = () => {
    if (isCropDragging.value) {
      isCropDragging.value = false
    }
    if (isDrawingStroke.value && currentStroke.value.length > 0) {
      drawStrokes.value.push({
        points: [...currentStroke.value],
        color: drawColor.value,
        size: drawBrushSize.value,
      })
      currentStroke.value = []
      isDrawingStroke.value = false
      drawCanvas()
    }
  }

  // --- Crop apply ---
  const applyCrop = () => {
    const canvas = canvasRef.value
    const img = imgRef.value
    if (!canvas || !img) return

    const sx = Math.min(cropStart.value.x, cropEnd.value.x)
    const sy = Math.min(cropStart.value.y, cropEnd.value.y)
    const sw = Math.abs(cropEnd.value.x - cropStart.value.x)
    const sh = Math.abs(cropEnd.value.y - cropStart.value.y)

    if (sw < 5 || sh < 5) return

    const dw = displayDimensions.value.width
    const dh = displayDimensions.value.height
    const ratioX = naturalWidth.value / dw
    const ratioY = naturalHeight.value / dh

    const cropCanvas = document.createElement('canvas')
    const cropW = Math.round(sw * ratioX)
    const cropH = Math.round(sh * ratioY)
    cropCanvas.width = cropW
    cropCanvas.height = cropH

    const ctx = cropCanvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(img, sx * ratioX, sy * ratioY, cropW, cropH, 0, 0, cropW, cropH)

    const croppedDataUrl = cropCanvas.toDataURL('image/png')

    const newImg = new Image()
    newImg.onload = () => {
      naturalWidth.value = newImg.naturalWidth
      naturalHeight.value = newImg.naturalHeight
      imgRef.value = newImg
      isCropping.value = false
      cropStart.value = { x: 0, y: 0 }
      cropEnd.value = { x: 0, y: 0 }
      scale.value = 1
      rotation.value = 0
      nextTick(drawCanvas)
    }
    newImg.src = croppedDataUrl
  }

  // --- Export final image ---
  const exportImage = (): string | null => {
    const canvas = canvasRef.value
    const img = imgRef.value
    if (!canvas || !img) return null

    const outCanvas = document.createElement('canvas')
    const nw = naturalWidth.value
    const nh = naturalHeight.value

    const isRotated90 = rotation.value === 90 || rotation.value === 270
    outCanvas.width = isRotated90 ? nh : nw
    outCanvas.height = isRotated90 ? nw : nh

    const ctx = outCanvas.getContext('2d')
    if (!ctx) return null

    ctx.translate(outCanvas.width / 2, outCanvas.height / 2)
    ctx.rotate((rotation.value * Math.PI) / 180)
    ctx.drawImage(img, -nw / 2, -nh / 2, nw, nh)

    if (drawStrokes.value.length > 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      if (isRotated90) {
        ctx.translate(outCanvas.width / 2, outCanvas.height / 2)
        ctx.rotate((rotation.value * Math.PI) / 180)
        ctx.translate(-nw / 2, -nh / 2)
      }
      const dw = displayDimensions.value.width
      const dh = displayDimensions.value.height
      const ratioX = nw / dw
      const ratioY = nh / dh
      for (const stroke of drawStrokes.value) {
        if (stroke.points.length < 2) continue
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.size * ratioX
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(stroke.points[0]!.x * ratioX, stroke.points[0]!.y * ratioY)
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i]!.x * ratioX, stroke.points[i]!.y * ratioY)
        }
        ctx.stroke()
      }
    }

    return outCanvas.toDataURL('image/png')
  }

  // --- Computed ---
  const zoomPercent = computed(() => `${Math.round(scale.value * 100)}%`)

  const imageDimensionsLabel = computed(() => {
    if (!naturalWidth.value || !naturalHeight.value) return ''
    return `${naturalWidth.value} × ${naturalHeight.value}px`
  })

  const hasCropSelection = computed(
    () => cropStart.value.x !== cropEnd.value.x || cropStart.value.y !== cropEnd.value.y,
  )

  const canvasCursor = computed(() => {
    if (isCropping.value || drawMode.value) return 'cursor-crosshair'
    return 'cursor-default'
  })

  return {
    // Refs (for template binding)
    canvasRef,
    containerRef,
    // State
    scale,
    rotation,
    isCropping,
    drawMode,
    drawColor,
    drawBrushSize,
    drawStrokes,
    drawColors,
    // Computed
    zoomPercent,
    imageDimensionsLabel,
    hasCropSelection,
    canvasCursor,
    // Actions
    handleZoomIn,
    handleZoomOut,
    handleRotateRight,
    handleRotateLeft,
    handleReset,
    toggleCrop,
    toggleDraw,
    undoDrawStroke,
    applyCrop,
    exportImage,
    // Canvas events
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  }
}
