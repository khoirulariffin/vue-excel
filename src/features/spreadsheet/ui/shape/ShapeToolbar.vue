<script setup lang="ts">
import type { ExcelShape } from '@/shared/types'
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
  shape: ExcelShape
  isCropping: boolean
  toolbarPosition: { x: number; y: number }
}

defineProps<Props>()
const emit = defineEmits<{
  startCrop: []
  applyCrop: []
  cancelCrop: []
  exportObject: []
}>()

const store = useSpreadsheetStore()
</script>

<template>
  <!-- FLOATING TOOLBAR -->
  <div
    v-if="!isCropping"
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
        v-if="shape.type === 'image'"
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Crop"
        @click="emit('startCrop')"
      >
        <Crop :size="14" />
      </button>

      <!-- Flip Horizontal -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Flip Horizontal"
        @click="store.flipShape(shape.id, 'horizontal')"
      >
        <FlipHorizontal :size="14" />
      </button>

      <!-- Flip Vertical -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Flip Vertical"
        @click="store.flipShape(shape.id, 'vertical')"
      >
        <FlipVertical :size="14" />
      </button>

      <!-- Rotate 90° -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Rotate 90°"
        @click="store.rotateShape(shape.id, 90)"
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
          :value="Math.round((shape.opacity ?? 1) * 100)"
          class="w-12 h-1 accent-blue-500 cursor-pointer"
          title="Opacity"
          @input="
            store.setShapeOpacity(
              shape.id,
              Number(($event.target as HTMLInputElement).value) / 100,
            )
          "
        />
        <span class="text-[9px] font-medium text-gray-400 w-5 tabular-nums"
          >{{ Math.round((shape.opacity ?? 1) * 100) }}%</span
        >
      </div>

      <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

      <!-- Bring Forward -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Bring Forward"
        @click="store.bringShapeForward(shape.id)"
      >
        <ArrowUpToLine :size="14" />
      </button>

      <!-- Send Backward -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Send Backward"
        @click="store.sendShapeBackward(shape.id)"
      >
        <ArrowDownToLine :size="14" />
      </button>

      <!-- Duplicate -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Duplicate"
        @click="store.duplicateShape(shape.id)"
      >
        <Copy :size="14" />
      </button>

      <!-- Download -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Download"
        @click="emit('exportObject')"
      >
        <Download :size="14" />
      </button>

      <!-- Delete -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
        title="Delete"
        @click="store.deleteShape(shape.id)"
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
    v-if="isCropping"
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
        @click="emit('applyCrop')"
      >
        Done
      </button>
      <button
        class="px-3 h-7 rounded-full bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-colors"
        @click="emit('cancelCrop')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>
