<script setup lang="ts">
import { ref } from 'vue'
import { Image, RectangleHorizontal, Circle, Triangle } from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'

const store = useSpreadsheetStore()
const imageInputRef = ref<HTMLInputElement | null>(null)

const handleImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    if (store.selectedCell) {
      store.insertImageToCell(store.selectedCell.row, store.selectedCell.col, dataUrl)
    } else {
      store.addShape({
        id: `img_${Date.now()}`,
        type: 'image',
        src: dataUrl,
        x: 60,
        y: 60,
        w: 200,
        h: 150,
      })
    }
  }
  reader.readAsDataURL(file)
  target.value = ''
}

const insertShape = (shapeType: string) => {
  const fills: Record<string, string> = {
    rect: '#4472C4',
    ellipse: '#ED7D31',
    triangle: '#A5A5A5',
  }
  store.addShape({
    id: `shp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'form',
    shapeType,
    fill: fills[shapeType] ?? '#4472C4',
    stroke: '#2F5496',
    strokeWidth: 1,
    textAlign: 'center',
    textVertical: 'center',
    opacity: 1,
    rotation: 0,
    x: 80,
    y: 80,
    w: 120,
    h: 80,
  })
}
</script>

<template>
  <div class="flex flex-col items-center px-2 relative h-full justify-between py-1">
    <div class="flex items-center gap-0.5 h-full">
      <!-- Insert Image -->
      <button
        class="flex flex-col items-center justify-center h-14 min-w-[48px] px-1.5 rounded-lg transition-all group hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
        title="Insert Image"
        @click="imageInputRef?.click()"
      >
        <div
          class="p-1.5 rounded-md mb-0.5 transition-transform group-hover:-translate-y-0.5 text-green-600 dark:text-green-400"
        >
          <Image :size="18" :stroke-width="2" />
        </div>
        <span class="text-[10px] font-medium text-gray-600 dark:text-gray-400">Image</span>
      </button>
      <input
        ref="imageInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleImageUpload"
      />

      <!-- Separator -->
      <div class="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

      <!-- Insert Rectangle -->
      <button
        class="flex items-center justify-center w-8 h-8 rounded transition-all hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400"
        title="Rectangle"
        @click="insertShape('rect')"
      >
        <RectangleHorizontal :size="16" :stroke-width="2" />
      </button>

      <!-- Insert Circle -->
      <button
        class="flex items-center justify-center w-8 h-8 rounded transition-all hover:bg-gray-200 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400"
        title="Ellipse"
        @click="insertShape('ellipse')"
      >
        <Circle :size="16" :stroke-width="2" />
      </button>

      <!-- Insert Triangle -->
      <button
        class="flex items-center justify-center w-8 h-8 rounded transition-all hover:bg-gray-200 dark:hover:bg-gray-700 text-orange-600 dark:text-orange-400"
        title="Triangle"
        @click="insertShape('triangle')"
      >
        <Triangle :size="16" :stroke-width="2" />
      </button>
    </div>
    <span
      class="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-1 select-none"
      >Insert</span
    >
    <div class="absolute right-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700"></div>
  </div>
</template>
