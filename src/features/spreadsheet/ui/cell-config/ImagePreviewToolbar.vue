<script setup lang="ts">
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Crop,
  Trash2,
  ImagePlus,
  PenTool,
  Undo2,
} from 'lucide-vue-next'

interface Props {
  zoomPercent: string
  isCropping: boolean
  hasCropSelection: boolean
  drawMode: boolean
  drawColor: string
  drawBrushSize: number
  drawStrokesCount: number
  drawColors: string[]
  allowReplace?: boolean
  allowDelete?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  zoomIn: []
  zoomOut: []
  rotateLeft: []
  rotateRight: []
  toggleCrop: []
  applyCrop: []
  toggleDraw: []
  'update:drawColor': [color: string]
  'update:drawBrushSize': [size: number]
  undoStroke: []
  reset: []
  replace: []
  delete: []
}>()
</script>

<template>
  <div
    class="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-1 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 flex-wrap"
  >
    <!-- Zoom -->
    <button
      class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
      title="Zoom In"
      @click="emit('zoomIn')"
    >
      <ZoomIn :size="16" />
    </button>
    <span
      class="text-[11px] font-mono text-gray-500 dark:text-gray-400 min-w-[40px] text-center select-none"
    >
      {{ zoomPercent }}
    </span>
    <button
      class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
      title="Zoom Out"
      @click="emit('zoomOut')"
    >
      <ZoomOut :size="16" />
    </button>

    <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

    <!-- Rotate Left -->
    <button
      class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
      title="Rotate Left 90°"
      @click="emit('rotateLeft')"
    >
      <RotateCcw :size="16" />
    </button>

    <!-- Rotate Right -->
    <button
      class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
      title="Rotate Right 90°"
      @click="emit('rotateRight')"
    >
      <RotateCw :size="16" />
    </button>

    <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

    <!-- Crop -->
    <button
      class="p-1.5 rounded-lg transition-all"
      :class="
        isCropping
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
      "
      title="Crop"
      @click="emit('toggleCrop')"
    >
      <Crop :size="16" />
    </button>
    <button
      v-if="isCropping && hasCropSelection"
      class="px-2 py-1 rounded-lg text-[11px] font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all"
      @click="emit('applyCrop')"
    >
      Apply Crop
    </button>

    <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

    <!-- Draw -->
    <button
      class="p-1.5 rounded-lg transition-all"
      :class="
        drawMode
          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
          : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
      "
      title="Draw / Annotate"
      @click="emit('toggleDraw')"
    >
      <PenTool :size="16" />
    </button>
    <!-- Draw controls -->
    <template v-if="drawMode">
      <div class="flex items-center gap-0.5 ml-1">
        <button
          v-for="c in drawColors"
          :key="c"
          class="w-4 h-4 rounded-full border transition-all"
          :class="
            drawColor === c
              ? 'ring-2 ring-offset-1 ring-blue-500 scale-110'
              : 'border-gray-300 dark:border-gray-600 hover:scale-110'
          "
          :style="{ backgroundColor: c }"
          @click="emit('update:drawColor', c)"
        ></button>
      </div>
      <select
        :value="drawBrushSize"
        class="ml-1 text-[10px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 text-gray-600 dark:text-gray-300 outline-none"
        @change="emit('update:drawBrushSize', Number(($event.target as HTMLSelectElement).value))"
      >
        <option :value="1">1px</option>
        <option :value="2">2px</option>
        <option :value="3">3px</option>
        <option :value="5">5px</option>
        <option :value="8">8px</option>
        <option :value="12">12px</option>
      </select>
      <button
        v-if="drawStrokesCount > 0"
        class="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all ml-0.5"
        title="Undo last stroke"
        @click="emit('undoStroke')"
      >
        <Undo2 :size="14" />
      </button>
    </template>

    <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

    <!-- Reset -->
    <button
      class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
      title="Reset All"
      @click="emit('reset')"
    >
      <RotateCcw :size="14" />
    </button>

    <div class="flex-1"></div>

    <!-- Replace -->
    <button
      v-if="allowReplace"
      class="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
      title="Replace Image"
      @click="emit('replace')"
    >
      <ImagePlus :size="14" />
      Replace
    </button>

    <!-- Delete -->
    <button
      v-if="allowDelete"
      class="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
      title="Delete Image"
      @click="emit('delete')"
    >
      <Trash2 :size="14" />
      Delete
    </button>
  </div>
</template>
