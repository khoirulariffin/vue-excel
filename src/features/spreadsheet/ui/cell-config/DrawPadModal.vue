<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { PenTool } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  initialImage?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [dataUrl: string]
}>()

const drawCanvasRef = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const drawCtx = ref<CanvasRenderingContext2D | null>(null)

const initCanvas = () => {
  const canvas = drawCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  drawCtx.value = ctx
  canvas.width = canvas.offsetWidth * 2
  canvas.height = canvas.offsetHeight * 2
  ctx.scale(2, 2)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 2
  ctx.strokeStyle = '#000000'
  // Restore existing drawing if any
  if (props.initialImage && props.initialImage.startsWith('data:image')) {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight)
    }
    img.src = props.initialImage
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      nextTick(initCanvas)
    }
  },
)

const startDraw = (e: MouseEvent) => {
  if (!drawCtx.value || !drawCanvasRef.value) return
  isDrawing.value = true
  const rect = drawCanvasRef.value.getBoundingClientRect()
  drawCtx.value.beginPath()
  drawCtx.value.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

const moveDraw = (e: MouseEvent) => {
  if (!isDrawing.value || !drawCtx.value || !drawCanvasRef.value) return
  const rect = drawCanvasRef.value.getBoundingClientRect()
  drawCtx.value.lineTo(e.clientX - rect.left, e.clientY - rect.top)
  drawCtx.value.stroke()
}

const endDraw = () => {
  isDrawing.value = false
}

const clearDraw = () => {
  if (!drawCtx.value || !drawCanvasRef.value) return
  const canvas = drawCanvasRef.value
  drawCtx.value.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
}

const saveDraw = () => {
  if (!drawCanvasRef.value) return
  const dataUrl = drawCanvasRef.value.toDataURL('image/png')
  emit('save', dataUrl)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 flex items-center justify-center"
      style="z-index: 10001"
    >
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')"></div>
      <div
        class="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
      >
        <div
          class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <PenTool :size="16" class="text-blue-500" />
            <span class="text-sm font-semibold text-gray-800 dark:text-gray-200"
              >Draw / Signature</span
            >
          </div>
          <button
            class="text-[11px] font-medium text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            @click="clearDraw"
          >
            Clear
          </button>
        </div>
        <div class="p-4">
          <canvas
            ref="drawCanvasRef"
            class="w-full h-48 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-crosshair bg-white"
            @mousedown="startDraw"
            @mousemove="moveDraw"
            @mouseup="endDraw"
            @mouseleave="endDraw"
          ></canvas>
        </div>
        <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
          <button
            class="px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-sm transition-colors"
            @click="saveDraw"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
