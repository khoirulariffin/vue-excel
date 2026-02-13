<script setup lang="ts">
import { ref } from 'vue'
import { X, Maximize2, Check } from 'lucide-vue-next'
import { useImageCanvas } from '@/features/spreadsheet/lib/useImageCanvas'
import ImagePreviewToolbar from './ImagePreviewToolbar.vue'

interface Props {
  isOpen: boolean
  imageSrc: string
  allowDelete?: boolean
  allowReplace?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  allowDelete: true,
  allowReplace: true,
})

const emit = defineEmits<{
  close: []
  save: [dataUrl: string]
  delete: []
  replace: [e: Event]
}>()

const replaceInputRef = ref<HTMLInputElement | null>(null)

const {
  canvasRef,
  containerRef,
  isCropping,
  drawMode,
  drawColor,
  drawBrushSize,
  drawStrokes,
  drawColors,
  zoomPercent,
  imageDimensionsLabel,
  hasCropSelection,
  canvasCursor,
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
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleCanvasMouseUp,
} = useImageCanvas(
  () => props.imageSrc,
  () => props.isOpen,
)

const handleSave = () => {
  const dataUrl = exportImage()
  if (dataUrl) {
    emit('save', dataUrl)
  } else {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="imgmodal">
      <div
        v-if="isOpen"
        class="fixed inset-0 flex items-center justify-center"
        style="z-index: 10002"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')"></div>

        <div
          class="relative w-full max-w-[600px] mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]"
        >
          <!-- Header -->
          <div
            class="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0"
          >
            <div class="flex items-center gap-2">
              <Maximize2 :size="16" class="text-blue-500" />
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Image Preview
              </span>
              <span
                v-if="imageDimensionsLabel"
                class="text-[10px] text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded"
              >
                {{ imageDimensionsLabel }}
              </span>
            </div>
            <button
              class="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              @click="emit('close')"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- Toolbar -->
          <ImagePreviewToolbar
            :zoom-percent="zoomPercent"
            :is-cropping="isCropping"
            :has-crop-selection="hasCropSelection"
            :draw-mode="drawMode"
            :draw-color="drawColor"
            :draw-brush-size="drawBrushSize"
            :draw-strokes-count="drawStrokes.length"
            :draw-colors="drawColors"
            :allow-replace="allowReplace"
            :allow-delete="allowDelete"
            @zoom-in="handleZoomIn"
            @zoom-out="handleZoomOut"
            @rotate-left="handleRotateLeft"
            @rotate-right="handleRotateRight"
            @toggle-crop="toggleCrop"
            @apply-crop="applyCrop"
            @toggle-draw="toggleDraw"
            @update:draw-color="drawColor = $event"
            @update:draw-brush-size="drawBrushSize = $event"
            @undo-stroke="undoDrawStroke"
            @reset="handleReset"
            @replace="replaceInputRef?.click()"
            @delete="emit('delete')"
          />
          <input
            ref="replaceInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="emit('replace', $event)"
          />

          <!-- Canvas Area -->
          <div
            ref="containerRef"
            class="flex-1 overflow-auto flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-800/50 min-h-[200px]"
            style="
              background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22><rect width=%228%22 height=%228%22 fill=%22%23f0f0f0%22/><rect x=%228%22 y=%228%22 width=%228%22 height=%228%22 fill=%22%23f0f0f0%22/></svg>');
              background-size: 16px 16px;
            "
          >
            <canvas
              ref="canvasRef"
              class="shadow-lg rounded-lg"
              :class="canvasCursor"
              @mousedown="handleCanvasMouseDown"
              @mousemove="handleCanvasMouseMove"
              @mouseup="handleCanvasMouseUp"
              @mouseleave="handleCanvasMouseUp"
            ></canvas>
          </div>

          <!-- Footer -->
          <div
            class="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2 shrink-0"
          >
            <button
              class="px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              class="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-sm transition-colors"
              @click="handleSave"
            >
              <Check :size="14" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.imgmodal-enter-active,
.imgmodal-leave-active {
  transition: all 0.2s ease;
}

.imgmodal-enter-active > div:last-child,
.imgmodal-leave-active > div:last-child {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.imgmodal-enter-from,
.imgmodal-leave-to {
  opacity: 0;
}

.imgmodal-enter-from > div:last-child,
.imgmodal-leave-to > div:last-child {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
</style>
