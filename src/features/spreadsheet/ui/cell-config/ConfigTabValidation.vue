<script setup lang="ts">
import type { InputType } from '@/shared/types'
import { AlertCircle } from 'lucide-vue-next'

interface Props {
  inputType: InputType
  minVal: string
  maxVal: string
  pattern: string
  errorMsg: string
}

defineProps<Props>()
const emit = defineEmits<{
  'update:minVal': [val: string]
  'update:maxVal': [val: string]
  'update:pattern': [val: string]
  'update:errorMsg': [val: string]
}>()
</script>

<template>
  <div v-if="inputType === 'number' || inputType === 'float'" class="grid grid-cols-2 gap-3">
    <div>
      <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        Min Value
      </label>
      <input
        :value="minVal"
        type="number"
        class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all"
        @input="emit('update:minVal', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div>
      <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        Max Value
      </label>
      <input
        :value="maxVal"
        type="number"
        class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all"
        @input="emit('update:maxVal', ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>

  <div>
    <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
      Regex Pattern
    </label>
    <input
      :value="pattern"
      type="text"
      class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
      placeholder="e.g. ^[A-Z]{3}$"
      @input="emit('update:pattern', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <div>
    <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
      Custom Error Message
    </label>
    <input
      :value="errorMsg"
      type="text"
      class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
      placeholder="Value must be..."
      @input="emit('update:errorMsg', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <div
    v-if="inputType !== 'number' && inputType !== 'float' && !pattern && !errorMsg"
    class="text-center py-8 text-gray-300 dark:text-gray-600"
  >
    <AlertCircle :size="32" class="mx-auto mb-2 opacity-50" />
    <p class="text-xs">Add regex patterns or error messages to validate input</p>
  </div>
</template>
