<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bold, Italic, Underline, Type, Paintbrush } from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'

const store = useSpreadsheetStore()
const textColorInput = ref<HTMLInputElement | null>(null)
const bgColorInput = ref<HTMLInputElement | null>(null)

const currentStyle = computed(() => store.selectedCellData?.style ?? {})

const handleTextColor = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  store.setTextColor(val)
}

const handleBgColor = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  store.setBgColor(val)
}
</script>

<template>
  <!-- GROUP: Font -->
  <div
    v-if="store.appMode === 'manual'"
    class="flex flex-col items-center px-2 relative h-full justify-between py-1"
  >
    <div class="flex items-center gap-0.5 h-full">
      <!-- Bold -->
      <button
        class="flex items-center justify-center w-8 h-8 rounded transition-all"
        :class="
          currentStyle.bold
            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        "
        title="Bold (Ctrl+B)"
        @click="store.toggleBold()"
      >
        <Bold :size="16" :stroke-width="2.5" />
      </button>

      <!-- Italic -->
      <button
        class="flex items-center justify-center w-8 h-8 rounded transition-all"
        :class="
          currentStyle.italic
            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        "
        title="Italic (Ctrl+I)"
        @click="store.toggleItalic()"
      >
        <Italic :size="16" :stroke-width="2.5" />
      </button>

      <!-- Underline -->
      <button
        class="flex items-center justify-center w-8 h-8 rounded transition-all"
        :class="
          currentStyle.underline
            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        "
        title="Underline (Ctrl+U)"
        @click="store.toggleUnderline()"
      >
        <Underline :size="16" :stroke-width="2.5" />
      </button>

      <!-- Separator -->
      <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

      <!-- Text Color -->
      <button
        class="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 relative"
        title="Text Color"
        @click="textColorInput?.click()"
      >
        <Type :size="16" :stroke-width="2" />
        <div
          class="absolute bottom-0.5 left-1 right-1 h-1 rounded-full"
          :style="{ backgroundColor: currentStyle.color || '#111827' }"
        ></div>
        <input
          ref="textColorInput"
          type="color"
          class="absolute opacity-0 w-0 h-0"
          :value="currentStyle.color || '#000000'"
          @input="handleTextColor"
        />
      </button>

      <!-- Background Color -->
      <button
        class="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 relative"
        title="Fill Color"
        @click="bgColorInput?.click()"
      >
        <Paintbrush :size="16" :stroke-width="2" />
        <div
          class="absolute bottom-0.5 left-1 right-1 h-1 rounded-full"
          :style="{ backgroundColor: currentStyle.backgroundColor || 'transparent' }"
        ></div>
        <input
          ref="bgColorInput"
          type="color"
          class="absolute opacity-0 w-0 h-0"
          :value="currentStyle.backgroundColor || '#ffffff'"
          @input="handleBgColor"
        />
      </button>
    </div>
    <span
      class="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-1 select-none"
      >Font</span
    >
    <div class="absolute right-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700"></div>
  </div>
</template>
