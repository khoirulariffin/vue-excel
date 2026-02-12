<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle } from 'lucide-vue-next'

interface Props {
  depLabel: string
  depValue: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:depLabel': [val: string]
  'update:depValue': [val: string]
}>()

const logicPreview = computed(() => {
  if (!props.depLabel || !props.depValue) return ''
  return `If [${props.depLabel}] = "${props.depValue}" → Show this field`
})
</script>

<template>
  <div
    class="flex gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-900/15 rounded-xl border border-amber-200/60 dark:border-amber-800/40"
  >
    <AlertCircle :size="16" class="text-amber-500 shrink-0 mt-0.5" />
    <p class="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
      Show this field <strong>only if</strong> another field has a specific value.
    </p>
  </div>

  <div>
    <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
      Dependency Field Label
    </label>
    <input
      :value="depLabel"
      type="text"
      class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
      placeholder="e.g. Gender"
      @input="emit('update:depLabel', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <div>
    <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
      Required Value
    </label>
    <input
      :value="depValue"
      type="text"
      class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
      placeholder="e.g. Female"
      @input="emit('update:depValue', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <!-- Logic Preview -->
  <div
    v-if="logicPreview"
    class="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800"
  >
    <p class="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1.5">Preview</p>
    <p class="text-xs text-gray-600 dark:text-gray-300 font-medium">
      {{ logicPreview }}
    </p>
  </div>
</template>
