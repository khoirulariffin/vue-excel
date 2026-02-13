<script setup lang="ts">
import type { ExcelShape } from '@/shared/types'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'
import { useShapeInteraction } from '@/features/spreadsheet/lib/useShapeInteraction'
import { RotateCw } from 'lucide-vue-next'
import ShapeRenderer from './shape/ShapeRenderer.vue'
import ShapeToolbar from './shape/ShapeToolbar.vue'

interface Props {
  shapes: ExcelShape[]
}

defineProps<Props>()

const store = useSpreadsheetStore()

const {
  isDragging,
  isCropping,
  cropRect,
  selectedShapeObj,
  toolbarPosition,
  resizeHandles,
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
} = useShapeInteraction()

const getShapeTransform = (shape: ExcelShape): string => {
  const parts: string[] = []
  if (shape.rotation) parts.push(`rotate(${shape.rotation}deg)`)
  const sx = shape.flipH ? -1 : 1
  const sy = shape.flipV ? -1 : 1
  if (sx !== 1 || sy !== 1) parts.push(`scale(${sx}, ${sy})`)
  return parts.length > 0 ? parts.join(' ') : 'none'
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
      @touchstart="handleShapeTouchStart($event, shape)"
    >
      <!-- Shape content (image / SVG / text) -->
      <ShapeRenderer :shape="shape" />

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
          @touchstart="handleResizeTouchStart($event, h)"
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
          @touchstart="handleRotateTouchStart"
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
          @touchstart="handleCropTouchStart($event, 'move')"
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
          @touchstart="handleCropTouchStart($event, 'nw')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-n-resize z-10"
          :style="{ left: `${cropRect.x + cropRect.w / 2 - 6}px`, top: `${cropRect.y - 6}px` }"
          @mousedown="handleCropMouseDown($event, 'n')"
          @touchstart="handleCropTouchStart($event, 'n')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-ne-resize z-10"
          :style="{ left: `${cropRect.x + cropRect.w - 6}px`, top: `${cropRect.y - 6}px` }"
          @mousedown="handleCropMouseDown($event, 'ne')"
          @touchstart="handleCropTouchStart($event, 'ne')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-e-resize z-10"
          :style="{
            left: `${cropRect.x + cropRect.w - 6}px`,
            top: `${cropRect.y + cropRect.h / 2 - 6}px`,
          }"
          @mousedown="handleCropMouseDown($event, 'e')"
          @touchstart="handleCropTouchStart($event, 'e')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-se-resize z-10"
          :style="{
            left: `${cropRect.x + cropRect.w - 6}px`,
            top: `${cropRect.y + cropRect.h - 6}px`,
          }"
          @mousedown="handleCropMouseDown($event, 'se')"
          @touchstart="handleCropTouchStart($event, 'se')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-s-resize z-10"
          :style="{
            left: `${cropRect.x + cropRect.w / 2 - 6}px`,
            top: `${cropRect.y + cropRect.h - 6}px`,
          }"
          @mousedown="handleCropMouseDown($event, 's')"
          @touchstart="handleCropTouchStart($event, 's')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-sw-resize z-10"
          :style="{ left: `${cropRect.x - 6}px`, top: `${cropRect.y + cropRect.h - 6}px` }"
          @mousedown="handleCropMouseDown($event, 'sw')"
          @touchstart="handleCropTouchStart($event, 'sw')"
        ></div>
        <div
          class="absolute w-3 h-3 bg-white rounded-full border border-gray-400 cursor-w-resize z-10"
          :style="{ left: `${cropRect.x - 6}px`, top: `${cropRect.y + cropRect.h / 2 - 6}px` }"
          @mousedown="handleCropMouseDown($event, 'w')"
          @touchstart="handleCropTouchStart($event, 'w')"
        ></div>
      </template>
    </div>
  </template>

  <!-- Toolbars -->
  <ShapeToolbar
    v-if="selectedShapeObj"
    :shape="selectedShapeObj"
    :is-cropping="isCropping"
    :toolbar-position="toolbarPosition"
    @start-crop="startCrop"
    @apply-crop="applyCrop"
    @cancel-crop="cancelCrop"
    @export-object="exportObject"
  />
</template>
