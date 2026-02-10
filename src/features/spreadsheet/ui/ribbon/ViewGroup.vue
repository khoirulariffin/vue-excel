<script setup lang="ts">
import { Grid2x2Check, ZoomIn, ZoomOut } from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'

const store = useSpreadsheetStore()
</script>

<template>
  <!-- GROUP: View -->
  <div class="flex flex-col items-center px-2 relative h-full justify-between py-1">
    <div class="flex items-center gap-1 h-full">
      <!-- Gridlines Toggle -->
      <button
        class="flex flex-col items-center justify-center h-16 min-w-[64px] px-2 rounded-lg transition-all group focus:outline-none"
        :class="
          store.showGridlines
            ? 'bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-500/50 shadow-inner'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
        "
        @click="store.toggleGridlines()"
      >
        <div
          class="p-2 rounded-md mb-1 transition-transform group-hover:-translate-y-0.5"
          :class="
            store.showGridlines
              ? 'bg-transparent text-indigo-600 dark:text-indigo-400'
              : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
          "
        >
          <Grid2x2Check :size="20" :stroke-width="2" />
        </div>
        <span
          class="text-[11px] font-medium leading-tight text-center tracking-tight"
          :class="
            store.showGridlines
              ? 'text-primary-900 dark:text-primary-300 font-bold'
              : 'text-gray-700 dark:text-gray-300'
          "
        >
          Gridlines
        </span>
      </button>

      <!-- Zoom Controls -->
      <div class="flex flex-col h-16 justify-center gap-1 mx-1">
        <button
          class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300"
          title="Zoom In"
          @click="store.zoomIn()"
        >
          <ZoomIn :size="16" />
        </button>
        <button
          class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300"
          title="Zoom Out"
          @click="store.zoomOut()"
        >
          <ZoomOut :size="16" />
        </button>
      </div>

      <!-- Zoom Percentage -->
      <div
        class="flex items-center justify-center w-12 text-xs font-bold text-gray-600 dark:text-gray-400"
      >
        {{ Math.round(store.zoom * 100) }}%
      </div>
    </div>
    <span
      class="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-1 select-none"
      >View</span
    >
  </div>
</template>
