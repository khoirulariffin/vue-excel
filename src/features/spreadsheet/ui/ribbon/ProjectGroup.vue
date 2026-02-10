<script setup lang="ts">
import { ref } from 'vue'
import { Upload, Download, Save } from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'

const store = useSpreadsheetStore()
const excelInputRef = ref<HTMLInputElement | null>(null)

const handleExcelUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  await store.importExcel(file)
  target.value = ''
}

const handleExportExcel = async () => {
  await store.exportExcel()
}

const handleSave = async () => {
  alert('Ceritanya nyimpen bray...')
}
</script>

<template>
  <!-- GROUP: Project File -->
  <div class="flex flex-col items-center px-2 relative h-full justify-between py-1">
    <div class="flex items-center gap-1 h-full">
      <!-- Hidden file input -->
      <input
        ref="excelInputRef"
        type="file"
        accept=".xlsx,.xls"
        class="hidden"
        @change="handleExcelUpload"
      />

      <!-- Import Excel -->
      <button
        class="flex flex-col items-center justify-center h-16 min-w-[64px] px-2 rounded-lg transition-all group hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
        @click="excelInputRef?.click()"
      >
        <div
          class="p-2 rounded-md mb-1 transition-transform group-hover:-translate-y-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
        >
          <Upload :size="20" :stroke-width="2" />
        </div>
        <span
          class="text-[11px] font-medium leading-tight text-center tracking-tight text-gray-700 dark:text-gray-300"
          >Import</span
        >
      </button>

      <!-- Save Project -->
      <button
        class="flex flex-col items-center justify-center h-16 min-w-[64px] px-2 rounded-lg transition-all group hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
        @click="handleSave"
      >
        <div
          class="p-2 rounded-md mb-1 transition-transform group-hover:-translate-y-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
        >
          <Save :size="20" :stroke-width="2" />
        </div>
        <span
          class="text-[11px] font-medium leading-tight text-center tracking-tight text-gray-700 dark:text-gray-300"
          >Save</span
        >
      </button>

      <!-- Export -->
      <button
        class="flex flex-col items-center justify-center h-16 min-w-[64px] px-2 rounded-lg transition-all group hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
        @click="handleExportExcel"
      >
        <div
          class="p-2 rounded-md mb-1 transition-transform group-hover:-translate-y-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
        >
          <Download :size="20" :stroke-width="2" />
        </div>
        <span
          class="text-[11px] font-medium leading-tight text-center tracking-tight text-gray-700 dark:text-gray-300"
          >Export</span
        >
      </button>
    </div>
    <span
      class="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-1 select-none"
      >Project</span
    >
    <div class="absolute right-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700"></div>
  </div>
</template>
