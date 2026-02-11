<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ExcelShape } from '@/shared/types'
import { useThemeStore } from '@/features/theme/model/themeStore'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'
import {
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Copy,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  Crop,
  Download,
} from 'lucide-vue-next'

interface Props {
  shapes: ExcelShape[]
}

defineProps<Props>()

const themeStore = useThemeStore()
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

// --- Helpers ---
const getStrokeDashArray = (dash?: string): string | undefined => {
  if (dash === 'dash') return '5,5'
  if (dash === 'dot') return '2,2'
  if (dash === 'dashDot') return '5,2,2,2'
  if (dash === 'sysDash') return '4,2'
  if (dash === 'sysDot') return '1,1'
  return undefined
}

const isLine = (shape: ExcelShape): boolean =>
  shape.shapeType === 'line' ||
  !!shape.shapeType?.toLowerCase().includes('connector') ||
  !!shape.shapeType?.includes('Arrow')

const getTextColor = (shape: ExcelShape) => {
  if (shape.textColor && shape.textColor !== '#000000') return shape.textColor
  return themeStore.theme === 'dark' ? '#e5e7eb' : '#000000'
}

const getShapeTransform = (shape: ExcelShape): string => {
  const parts: string[] = []
  if (shape.rotation) parts.push(`rotate(${shape.rotation}deg)`)
  const sx = shape.flipH ? -1 : 1
  const sy = shape.flipV ? -1 : 1
  if (sx !== 1 || sy !== 1) parts.push(`scale(${sx}, ${sy})`)
  return parts.length > 0 ? parts.join(' ') : 'none'
}

// --- Click to select ---
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
      if (shape.stroke && shape.stroke !== 'transparent') ctx.strokeRect(0, 0, shape.w, shape.h)
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

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('keydown', handleKeyDown)
})

const resizeHandles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

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
</script>

<template>
  <!-- Background click catcher -->
  <div
    class="absolute inset-0 z-30"
    @mousedown="handleBackgroundClick"
    v-if="store.selectedShapeId"
  ></div>

  <template v-for="(shape, index) in shapes" :key="shape.id">
    <!-- SHAPE WRAPPER (both image and form) -->
    <div
      :style="{
        position: 'absolute',
        top: `${shape.y + 32}px`,
        left: `${shape.x + 40}px`,
        width: `${shape.w}px`,
        height: `${shape.h}px`,
        zIndex: 40 + index,
        opacity: shape.opacity ?? 1,
        transform: getShapeTransform(shape),
        cursor: isDragging && isSelected(shape.id) ? 'grabbing' : 'pointer',
      }"
      @mousedown="handleShapeMouseDown($event, shape)"
    >
      <!-- IMAGE -->
      <img
        v-if="shape.type === 'image' && shape.src"
        :src="shape.src"
        alt="shape"
        class="w-full h-full object-fill pointer-events-none select-none"
        draggable="false"
      />

      <!-- VECTOR SHAPE (SVG) -->
      <template v-if="shape.type === 'form'">
        <svg
          width="100%"
          height="100%"
          class="absolute inset-0 pointer-events-none"
          style="overflow: visible"
        >
          <!-- LINE / CONNECTOR -->
          <g v-if="isLine(shape)">
            <defs v-if="shape.shapeType?.includes('Arrow')">
              <marker
                :id="`arrowhead-${shape.id}`"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" :fill="shape.stroke || 'transparent'" />
              </marker>
            </defs>
            <line
              :x1="shape.flipH ? shape.w : 0"
              :y1="shape.flipV ? shape.h : 0"
              :x2="shape.flipH ? 0 : shape.w"
              :y2="shape.flipV ? 0 : shape.h"
              :stroke="shape.stroke || 'transparent'"
              :stroke-width="shape.strokeWidth || 1"
              :stroke-dasharray="getStrokeDashArray(shape.strokeDash)"
              :marker-end="
                shape.shapeType?.includes('Arrow') ? `url(#arrowhead-${shape.id})` : undefined
              "
            />
          </g>

          <!-- TRIANGLE -->
          <polygon
            v-else-if="shape.shapeType === 'triangle'"
            :points="`${shape.w / 2},0 ${shape.w},${shape.h} 0,${shape.h}`"
            :fill="shape.fill || 'transparent'"
            :stroke="shape.stroke || 'transparent'"
            :stroke-width="shape.strokeWidth || 1"
            :stroke-dasharray="getStrokeDashArray(shape.strokeDash)"
          />

          <!-- ELLIPSE -->
          <ellipse
            v-else-if="shape.shapeType === 'ellipse'"
            :cx="shape.w / 2"
            :cy="shape.h / 2"
            :rx="shape.w / 2"
            :ry="shape.h / 2"
            :fill="shape.fill || 'transparent'"
            :stroke="shape.stroke || 'transparent'"
            :stroke-width="shape.strokeWidth || 1"
            :stroke-dasharray="getStrokeDashArray(shape.strokeDash)"
          />

          <!-- RECT / ROUNDRECT / DEFAULT -->
          <rect
            v-else
            x="0"
            y="0"
            :width="shape.w"
            :height="shape.h"
            :fill="shape.fill || 'transparent'"
            :stroke="shape.stroke || 'transparent'"
            :stroke-width="shape.strokeWidth || 1"
            :stroke-dasharray="getStrokeDashArray(shape.strokeDash)"
            :rx="shape.shapeType === 'roundRect' ? 10 : 0"
          />
        </svg>

        <!-- TEXT OVERLAY -->
        <div
          v-if="shape.text"
          class="absolute inset-0 pointer-events-none select-none"
          :style="{
            display: 'flex',
            alignItems:
              shape.textVertical === 'top'
                ? 'flex-start'
                : shape.textVertical === 'bottom'
                  ? 'flex-end'
                  : 'center',
            justifyContent:
              shape.textAlign === 'left'
                ? 'flex-start'
                : shape.textAlign === 'right'
                  ? 'flex-end'
                  : 'center',
            padding: '4px',
            color: getTextColor(shape),
            fontSize: `${shape.textSize || 11}pt`,
            fontWeight: shape.textBold ? 'bold' : 'normal',
            whiteSpace: 'pre-wrap',
            textAlign: shape.textAlign || 'center',
          }"
        >
          {{ shape.text }}
        </div>
      </template>

      <!-- SELECTION FRAME + HANDLES -->
      <template v-if="isSelected(shape.id) && !isCropping">
        <!-- Selection border -->
        <div class="absolute inset-0 border-2 border-blue-500 rounded-sm pointer-events-none"></div>

        <!-- Resize handles -->
        <div
          v-for="h in resizeHandles"
          :key="h"
          class="bg-white border-2 border-blue-500 rounded-sm z-10 hover:bg-blue-100 transition-colors"
          :style="getHandleStyle(h, shape)"
          @mousedown="handleResizeMouseDown($event, h)"
        ></div>

        <!-- Rotate handle -->
        <div
          class="absolute z-10"
          :style="{
            left: `${shape.w / 2 - 10}px`,
            top: '-32px',
            width: '20px',
            height: '20px',
            cursor: 'grab',
          }"
          @mousedown="handleRotateMouseDown"
        >
          <div
            class="w-5 h-5 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center hover:bg-blue-50 transition-colors"
          >
            <RotateCw :size="10" class="text-blue-500" />
          </div>
          <!-- Connector line -->
          <div class="absolute left-1/2 -translate-x-1/2 top-full w-px h-3 bg-blue-500"></div>
        </div>
      </template>

      <!-- CROP OVERLAY -->
      <template v-if="isSelected(shape.id) && isCropping && shape.type === 'image'">
        <!-- Dark overlay outside crop area (4 rects) -->
        <div
          class="absolute bg-black/50 pointer-events-none"
          :style="{ left: 0, top: 0, width: `${cropRect.x}px`, height: `${shape.h}px` }"
        ></div>
        <div
          class="absolute bg-black/50 pointer-events-none"
          :style="{
            left: `${cropRect.x + cropRect.w}px`,
            top: 0,
            width: `${shape.w - cropRect.x - cropRect.w}px`,
            height: `${shape.h}px`,
          }"
        ></div>
        <div
          class="absolute bg-black/50 pointer-events-none"
          :style="{
            left: `${cropRect.x}px`,
            top: 0,
            width: `${cropRect.w}px`,
            height: `${cropRect.y}px`,
          }"
        ></div>
        <div
          class="absolute bg-black/50 pointer-events-none"
          :style="{
            left: `${cropRect.x}px`,
            top: `${cropRect.y + cropRect.h}px`,
            width: `${cropRect.w}px`,
            height: `${shape.h - cropRect.y - cropRect.h}px`,
          }"
        ></div>

        <!-- Crop rect border (draggable to move) -->
        <div
          class="absolute border-2 border-white cursor-move"
          :style="{
            left: `${cropRect.x}px`,
            top: `${cropRect.y}px`,
            width: `${cropRect.w}px`,
            height: `${cropRect.h}px`,
          }"
          @mousedown="handleCropMouseDown($event, 'move')"
        >
          <!-- Rule of thirds grid lines -->
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute left-1/3 top-0 w-px h-full bg-white/30"></div>
            <div class="absolute left-2/3 top-0 w-px h-full bg-white/30"></div>
            <div class="absolute top-1/3 left-0 h-px w-full bg-white/30"></div>
            <div class="absolute top-2/3 left-0 h-px w-full bg-white/30"></div>
          </div>
        </div>

        <!-- Crop resize handles -->
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-nw-resize z-10"
          :style="{ left: `${cropRect.x - 6}px`, top: `${cropRect.y - 6}px` }"
          @mousedown="handleCropMouseDown($event, 'nw')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-n-resize z-10"
          :style="{ left: `${cropRect.x + cropRect.w / 2 - 6}px`, top: `${cropRect.y - 6}px` }"
          @mousedown="handleCropMouseDown($event, 'n')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-ne-resize z-10"
          :style="{ left: `${cropRect.x + cropRect.w - 6}px`, top: `${cropRect.y - 6}px` }"
          @mousedown="handleCropMouseDown($event, 'ne')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-e-resize z-10"
          :style="{
            left: `${cropRect.x + cropRect.w - 6}px`,
            top: `${cropRect.y + cropRect.h / 2 - 6}px`,
          }"
          @mousedown="handleCropMouseDown($event, 'e')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-se-resize z-10"
          :style="{
            left: `${cropRect.x + cropRect.w - 6}px`,
            top: `${cropRect.y + cropRect.h - 6}px`,
          }"
          @mousedown="handleCropMouseDown($event, 'se')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-s-resize z-10"
          :style="{
            left: `${cropRect.x + cropRect.w / 2 - 6}px`,
            top: `${cropRect.y + cropRect.h - 6}px`,
          }"
          @mousedown="handleCropMouseDown($event, 's')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-sw-resize z-10"
          :style="{ left: `${cropRect.x - 6}px`, top: `${cropRect.y + cropRect.h - 6}px` }"
          @mousedown="handleCropMouseDown($event, 'sw')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-w-resize z-10"
          :style="{ left: `${cropRect.x - 6}px`, top: `${cropRect.y + cropRect.h / 2 - 6}px` }"
          @mousedown="handleCropMouseDown($event, 'w')"
        ></div>
      </template>
    </div>
  </template>

  <!-- FLOATING TOOLBAR -->
  <div
    v-if="selectedShapeObj && !isCropping"
    class="absolute z-200 pointer-events-auto"
    :style="{
      left: `${toolbarPosition.x}px`,
      top: `${toolbarPosition.y}px`,
      transform: 'translateX(-50%) translateY(-150%)',
    }"
  >
    <div
      class="flex items-center gap-0.5 p-1 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700"
    >
      <!-- Crop (image only) -->
      <button
        v-if="selectedShapeObj.type === 'image'"
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Crop"
        @click="startCrop"
      >
        <Crop :size="14" />
      </button>

      <!-- Flip Horizontal -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Flip Horizontal"
        @click="store.flipShape(selectedShapeObj.id, 'horizontal')"
      >
        <FlipHorizontal :size="14" />
      </button>

      <!-- Flip Vertical -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Flip Vertical"
        @click="store.flipShape(selectedShapeObj.id, 'vertical')"
      >
        <FlipVertical :size="14" />
      </button>

      <!-- Rotate 90° -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Rotate 90°"
        @click="store.rotateShape(selectedShapeObj.id, 90)"
      >
        <RotateCw :size="14" />
      </button>

      <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

      <!-- Opacity slider -->
      <div class="flex items-center gap-1 px-1">
        <input
          type="range"
          min="0"
          max="100"
          :value="Math.round((selectedShapeObj.opacity ?? 1) * 100)"
          class="w-12 h-1 accent-blue-500 cursor-pointer"
          title="Opacity"
          @input="
            store.setShapeOpacity(
              selectedShapeObj!.id,
              Number(($event.target as HTMLInputElement).value) / 100,
            )
          "
        />
        <span class="text-[9px] font-medium text-gray-400 w-5 tabular-nums"
          >{{ Math.round((selectedShapeObj.opacity ?? 1) * 100) }}%</span
        >
      </div>

      <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

      <!-- Bring Forward -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Bring Forward"
        @click="store.bringShapeForward(selectedShapeObj.id)"
      >
        <ArrowUpToLine :size="14" />
      </button>

      <!-- Send Backward -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Send Backward"
        @click="store.sendShapeBackward(selectedShapeObj.id)"
      >
        <ArrowDownToLine :size="14" />
      </button>

      <!-- Duplicate -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Duplicate"
        @click="store.duplicateShape(selectedShapeObj.id)"
      >
        <Copy :size="14" />
      </button>

      <!-- Download -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Download"
        @click="exportObject"
      >
        <Download :size="14" />
      </button>

      <!-- Delete -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
        title="Delete"
        @click="store.deleteShape(selectedShapeObj.id)"
      >
        <Trash2 :size="14" />
      </button>
    </div>

    <!-- Arrow indicator -->
    <div class="flex justify-center -mt-1">
      <div
        class="w-2.5 h-2.5 bg-white dark:bg-gray-800 rotate-45 border-r border-b border-gray-200 dark:border-gray-700"
      ></div>
    </div>
  </div>

  <!-- CROP TOOLBAR -->
  <div
    v-if="selectedShapeObj && isCropping"
    class="absolute z-200 pointer-events-auto"
    :style="{
      left: `${toolbarPosition.x}px`,
      top: `${toolbarPosition.y}px`,
      transform: 'translateX(-50%) translateY(-100%)',
    }"
  >
    <div class="flex items-center gap-2 px-3 py-2 bg-blue-500 rounded-full shadow-xl">
      <Crop :size="14" class="text-white" />
      <span class="text-xs font-bold text-white">Crop Image</span>
      <button
        class="px-3 h-7 rounded-full bg-white text-blue-500 text-xs font-bold hover:bg-gray-100 transition-colors"
        @click="applyCrop"
      >
        Done
      </button>
      <button
        class="px-3 h-7 rounded-full bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-colors"
        @click="cancelCrop"
      >
        Cancel
      </button>
    </div>
  </div>
</template>
