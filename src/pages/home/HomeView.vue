<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { FileSpreadsheet, Upload, Loader2 } from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'
import ThemeToggle from '@/features/theme/ui/ThemeToggle.vue'

const router = useRouter()
const store = useSpreadsheetStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  await processFile(file)
  target.value = ''
}

const handleDrop = async (event: DragEvent) => {
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  await processFile(file)
}

const processFile = async (file: File) => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ]
  const validExtensions = ['.xlsx', '.xls']
  const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

  if (!validTypes.includes(file.type) && !hasValidExt) {
    alert('Please select a valid Excel file (.xlsx or .xls)')
    return
  }

  await store.importExcel(file)

  if (!store.error) {
    router.push('/editor')
  }
}
</script>

<template>
  <main class="flex-1 flex flex-col items-center justify-center p-6 relative">
    <!-- Theme Toggle (Top Right) -->
    <div class="absolute top-6 right-6">
      <ThemeToggle />
    </div>

    <div class="text-center max-w-lg w-full">
      <!-- Card Container with Apple-style Glassmorphism -->
      <div
        class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-3xl p-10 shadow-2xl transition-all duration-300"
      >
        <!-- Logo / Icon -->
        <div
          class="mx-auto w-24 h-24 bg-linear-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-primary-500/30"
        >
          <FileSpreadsheet class="w-12 h-12 text-white" />
        </div>

        <!-- Title -->
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
          Vue Excel
        </h1>
        <p class="text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
          The secure, intelligent way to manage <br />
          your Excel data and forms.
        </p>

        <!-- Drop Zone -->
        <div
          class="border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer mb-6 group relative overflow-hidden"
          :class="
            isDragOver
              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          "
          @click="triggerFileInput"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDrop"
        >
          <div v-if="store.isLoading" class="flex flex-col items-center gap-4">
            <Loader2 class="w-10 h-10 text-primary-500 animate-spin" />
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Processing your file...
            </p>
          </div>

          <div v-else class="flex flex-col items-center gap-4">
            <div
              class="w-14 h-14 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
            >
              <Upload class="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p class="text-base font-medium text-gray-700 dark:text-gray-200">
                Click to upload or drag and drop
              </p>
              <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Supports .xlsx and .xls files
              </p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="store.error"
          class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2"
        >
          {{ store.error }}
        </div>

        <!-- Hidden File Input -->
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls"
          class="hidden"
          @change="handleFileSelect"
        />
      </div>

      <!-- Footer / Credits -->
      <p class="mt-8 text-sm text-gray-400 dark:text-gray-600">
        &copy; {{ new Date().getFullYear() }} Vue Excel. All rights reserved.
      </p>
    </div>
  </main>
</template>
