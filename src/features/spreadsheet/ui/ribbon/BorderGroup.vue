<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Component } from 'vue'
import {
  Grid3x3,
  Square,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  X,
  ChevronDown,
} from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'

const store = useSpreadsheetStore()

type BorderPosition = 'all' | 'outer' | 'top' | 'bottom' | 'left' | 'right' | 'none'

const borderColor = ref('#000000')
const borderStyle = ref<'thin' | 'medium' | 'thick'>('thin')
const showDropdown = ref(false)
const borderColorInput = ref<HTMLInputElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)

const dropdownPosition = computed(() => {
  if (!buttonRef.value) return { left: 0, top: 0 }
  const rect = buttonRef.value.getBoundingClientRect()
  return {
    left: rect.left,
    top: rect.bottom + 4,
  }
})

const borderActions: { position: BorderPosition; icon: Component; title: string }[] = [
  { position: 'all', icon: Grid3x3, title: 'All Borders' },
  { position: 'outer', icon: Square, title: 'Outer Borders' },
  { position: 'top', icon: ArrowUp, title: 'Top Border' },
  { position: 'bottom', icon: ArrowDown, title: 'Bottom Border' },
  { position: 'left', icon: ArrowLeft, title: 'Left Border' },
  { position: 'right', icon: ArrowRight, title: 'Right Border' },
  { position: 'none', icon: X, title: 'No Border' },
]

const styleOptions: { value: 'thin' | 'medium' | 'thick'; label: string; width: string }[] = [
  { value: 'thin', label: 'Thin', width: '1px' },
  { value: 'medium', label: 'Medium', width: '2px' },
  { value: 'thick', label: 'Thick', width: '3px' },
]

const handleBorder = (position: BorderPosition) => {
  store.setCellBorder(position, borderStyle.value, borderColor.value)
  showDropdown.value = false
}

const handleColorChange = (e: Event) => {
  borderColor.value = (e.target as HTMLInputElement).value
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
}

// Close dropdown when clicking outside (use mousedown to avoid race with button click)
const handleClickOutside = (e: MouseEvent) => {
  if (!showDropdown.value) return
  const target = e.target as HTMLElement
  if (
    buttonRef.value &&
    !buttonRef.value.contains(target) &&
    !target.closest('.border-dropdown-panel')
  ) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div
    v-if="store.appMode === 'manual'"
    class="flex flex-col items-center px-2 relative h-full justify-between py-1"
  >
    <div class="flex items-center gap-0.5 h-full">
      <!-- Border Dropdown Trigger -->
      <div>
        <button
          ref="buttonRef"
          class="flex items-center gap-0.5 h-8 px-1.5 rounded transition-all hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Borders"
          @click="toggleDropdown"
        >
          <Grid3x3 :size="16" :stroke-width="2" />
          <ChevronDown :size="10" />
        </button>
      </div>
    </div>
    <span
      class="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-1 select-none"
      >Border</span
    >
    <div class="absolute right-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700"></div>

    <!-- Dropdown Panel (Fixed Position, Outside Parent) -->
    <Teleport to="body">
      <div
        v-if="showDropdown"
        class="border-dropdown-panel fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 min-w-[180px]"
        :style="{
          left: `${dropdownPosition.left}px`,
          top: `${dropdownPosition.top}px`,
          zIndex: 9999,
        }"
        @mousedown.stop
      >
        <!-- Border Position Buttons -->
        <div class="grid grid-cols-4 gap-0.5 mb-2">
          <button
            v-for="action in borderActions"
            :key="action.position"
            class="flex items-center justify-center w-9 h-9 rounded transition-all hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            :title="action.title"
            @click="handleBorder(action.position)"
          >
            <component :is="action.icon" :size="14" :stroke-width="2" />
          </button>
        </div>

        <div class="h-px bg-gray-200 dark:bg-gray-700 my-1.5"></div>

        <!-- Border Style -->
        <div class="mb-1.5">
          <span class="text-[10px] text-gray-400 uppercase font-medium mb-1 block">Style</span>
          <div class="flex gap-1">
            <button
              v-for="opt in styleOptions"
              :key="opt.value"
              class="flex-1 h-7 rounded flex items-center justify-center transition-all border"
              :class="
                borderStyle === opt.value
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700'
                  : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
              "
              :title="opt.label"
              @click="borderStyle = opt.value"
            >
              <div
                class="w-8 rounded-full"
                :style="{
                  height: opt.width,
                  backgroundColor: borderColor,
                }"
              ></div>
            </button>
          </div>
        </div>

        <div class="h-px bg-gray-200 dark:bg-gray-700 my-1.5"></div>

        <!-- Border Color -->
        <div>
          <span class="text-[10px] text-gray-400 uppercase font-medium mb-1 block">Color</span>
          <button
            class="flex items-center gap-2 w-full h-7 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            @click="borderColorInput?.click()"
          >
            <div
              class="w-5 h-5 rounded border border-gray-300 dark:border-gray-600"
              :style="{ backgroundColor: borderColor }"
            ></div>
            <span class="text-xs text-gray-600 dark:text-gray-300">{{ borderColor }}</span>
          </button>
          <input
            ref="borderColorInput"
            type="color"
            class="absolute opacity-0 w-0 h-0"
            :value="borderColor"
            @input="handleColorChange"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
