<script setup lang="ts">
import { Merge, SplitSquareHorizontal } from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'

const store = useSpreadsheetStore()
</script>

<template>
  <!-- GROUP: Cells (Merge) -->
  <div
    v-if="store.appMode === 'manual'"
    class="flex flex-col items-center px-2 relative h-full justify-between py-1"
  >
    <div class="flex items-center gap-0.5 h-full">
      <!-- Merge Cells -->
      <button
        class="flex flex-col items-center justify-center h-16 min-w-[52px] px-1.5 rounded-lg transition-all group hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
        title="Merge Cells"
        @click="store.mergeCells()"
      >
        <div
          class="p-1.5 rounded-md mb-1 transition-transform group-hover:-translate-y-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
        >
          <Merge :size="18" :stroke-width="2" />
        </div>
        <span
          class="text-[10px] font-medium leading-tight text-center tracking-tight text-gray-700 dark:text-gray-300"
          >Merge</span
        >
      </button>

      <!-- Unmerge Cells -->
      <button
        class="flex flex-col items-center justify-center h-16 min-w-[52px] px-1.5 rounded-lg transition-all group hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
        title="Unmerge Cells"
        @click="store.unmergeCells()"
      >
        <div
          class="p-1.5 rounded-md mb-1 transition-transform group-hover:-translate-y-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
        >
          <SplitSquareHorizontal :size="18" :stroke-width="2" />
        </div>
        <span
          class="text-[10px] font-medium leading-tight text-center tracking-tight text-gray-700 dark:text-gray-300"
          >Unmerge</span
        >
      </button>
    </div>
    <span
      class="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-1 select-none"
      >Cells</span
    >
    <div class="absolute right-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700"></div>
  </div>
</template>
