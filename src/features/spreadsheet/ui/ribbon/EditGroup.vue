<script setup lang="ts">
import { Undo2, Redo2 } from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'

const store = useSpreadsheetStore()
</script>

<template>
  <!-- GROUP: Edit (Undo/Redo) -->
  <div
    v-if="store.appMode === 'manual'"
    class="flex flex-col items-center px-2 relative h-full justify-between py-1"
  >
    <div class="flex items-center gap-0.5 h-full">
      <!-- Undo -->
      <button
        class="flex flex-col items-center justify-center h-16 min-w-[44px] px-1.5 rounded-lg transition-all group"
        :class="
          store.canUndo
            ? 'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
            : 'opacity-40 cursor-not-allowed'
        "
        title="Undo (Ctrl+Z)"
        :disabled="!store.canUndo"
        @click="store.undo()"
      >
        <div
          class="p-1.5 rounded-md mb-1 transition-transform group-hover:-translate-y-0.5 text-gray-600 dark:text-gray-400"
        >
          <Undo2 :size="18" :stroke-width="2" />
        </div>
        <span
          class="text-[10px] font-medium leading-tight text-center tracking-tight text-gray-700 dark:text-gray-300"
          >Undo</span
        >
      </button>

      <!-- Redo -->
      <button
        class="flex flex-col items-center justify-center h-16 min-w-[44px] px-1.5 rounded-lg transition-all group"
        :class="
          store.canRedo
            ? 'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
            : 'opacity-40 cursor-not-allowed'
        "
        title="Redo (Ctrl+Y)"
        :disabled="!store.canRedo"
        @click="store.redo()"
      >
        <div
          class="p-1.5 rounded-md mb-1 transition-transform group-hover:-translate-y-0.5 text-gray-600 dark:text-gray-400"
        >
          <Redo2 :size="18" :stroke-width="2" />
        </div>
        <span
          class="text-[10px] font-medium leading-tight text-center tracking-tight text-gray-700 dark:text-gray-300"
          >Redo</span
        >
      </button>
    </div>
    <span
      class="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-1 select-none"
      >Edit</span
    >
    <div class="absolute right-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700"></div>
  </div>
</template>
