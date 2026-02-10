<script setup lang="ts">
import { computed } from 'vue'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  WrapText,
} from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'

const store = useSpreadsheetStore()
const currentStyle = computed(() => store.selectedCellData?.style ?? {})
</script>

<template>
  <!-- GROUP: Alignment -->
  <div
    v-if="store.appMode === 'manual'"
    class="flex flex-col items-center px-2 relative h-full justify-between py-1"
  >
    <div class="flex flex-col gap-0.5 h-full justify-center">
      <!-- Horizontal Alignment Row -->
      <div class="flex items-center gap-0.5">
        <button
          class="flex items-center justify-center w-7 h-7 rounded transition-all"
          :class="
            currentStyle.align === 'left' || !currentStyle.align
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          "
          title="Align Left"
          @click="store.setAlign('left')"
        >
          <AlignLeft :size="14" />
        </button>
        <button
          class="flex items-center justify-center w-7 h-7 rounded transition-all"
          :class="
            currentStyle.align === 'center'
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          "
          title="Align Center"
          @click="store.setAlign('center')"
        >
          <AlignCenter :size="14" />
        </button>
        <button
          class="flex items-center justify-center w-7 h-7 rounded transition-all"
          :class="
            currentStyle.align === 'right'
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          "
          title="Align Right"
          @click="store.setAlign('right')"
        >
          <AlignRight :size="14" />
        </button>
      </div>

      <!-- Vertical Alignment + Wrap Row -->
      <div class="flex items-center gap-0.5">
        <button
          class="flex items-center justify-center w-7 h-7 rounded transition-all"
          :class="
            currentStyle.verticalAlign === 'top'
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          "
          title="Align Top"
          @click="store.setVerticalAlign('top')"
        >
          <AlignVerticalJustifyStart :size="14" />
        </button>
        <button
          class="flex items-center justify-center w-7 h-7 rounded transition-all"
          :class="
            currentStyle.verticalAlign === 'center' || !currentStyle.verticalAlign
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          "
          title="Align Middle"
          @click="store.setVerticalAlign('center')"
        >
          <AlignVerticalJustifyCenter :size="14" />
        </button>
        <button
          class="flex items-center justify-center w-7 h-7 rounded transition-all"
          :class="
            currentStyle.verticalAlign === 'bottom'
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          "
          title="Align Bottom"
          @click="store.setVerticalAlign('bottom')"
        >
          <AlignVerticalJustifyEnd :size="14" />
        </button>

        <!-- Separator -->
        <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

        <!-- Wrap Text -->
        <button
          class="flex items-center justify-center w-7 h-7 rounded transition-all"
          :class="
            currentStyle.wrapText
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          "
          title="Wrap Text"
          @click="store.toggleWrapText()"
        >
          <WrapText :size="14" />
        </button>
      </div>
    </div>
    <span
      class="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-1 select-none"
      >Alignment</span
    >
    <div class="absolute right-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700"></div>
  </div>
</template>
