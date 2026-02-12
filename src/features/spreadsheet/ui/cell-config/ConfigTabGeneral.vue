<script setup lang="ts">
import { ref } from 'vue'
import type { InputType, UidMode } from '@/shared/types'
import {
  X,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  Image as ImageIcon,
  Shapes,
  Check,
  PenTool,
  Fingerprint,
  Plus,
} from 'lucide-vue-next'

interface Props {
  inputType: InputType
  label: string
  placeholder: string
  optionsStr: string
  required: boolean
  uidMode: UidMode
  uidPrefix: string
  uidSuffix: string
  uidStartFrom: number
  uidPreview: string
  symbolOptions: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:inputType': [val: InputType]
  'update:label': [val: string]
  'update:placeholder': [val: string]
  'update:optionsStr': [val: string]
  'update:required': [val: boolean]
  'update:uidMode': [val: UidMode]
  'update:uidPrefix': [val: string]
  'update:uidSuffix': [val: string]
  'update:uidStartFrom': [val: number]
  'update:symbolOptions': [val: string[]]
}>()

const predefinedSymbols: { value: string; label: string }[] = [
  { value: '✓', label: '✓ Check' },
  { value: '✗', label: '✗ Cross' },
  { value: '●', label: '● Circle' },
  { value: '○', label: '○ Empty Circle' },
  { value: '■', label: '■ Square' },
  { value: '□', label: '□ Empty Square' },
  { value: '▲', label: '▲ Triangle' },
  { value: '★', label: '★ Star' },
  { value: '☆', label: '☆ Empty Star' },
  { value: '♦', label: '♦ Diamond' },
  { value: '⚠', label: '⚠ Warning' },
  { value: '⬤', label: '⬤ Large Circle' },
  { value: '→', label: '→ Arrow Right' },
  { value: '←', label: '← Arrow Left' },
  { value: '↑', label: '↑ Arrow Up' },
  { value: '↓', label: '↓ Arrow Down' },
]

const customSymbol = ref('')

const addCustomSymbol = () => {
  const sym = customSymbol.value.trim()
  if (sym && !props.symbolOptions.includes(sym)) {
    emit('update:symbolOptions', [...props.symbolOptions, sym])
  }
  customSymbol.value = ''
}

const toggleSymbol = (symValue: string) => {
  if (props.symbolOptions.includes(symValue)) {
    emit(
      'update:symbolOptions',
      props.symbolOptions.filter((s) => s !== symValue),
    )
  } else {
    emit('update:symbolOptions', [...props.symbolOptions, symValue])
  }
}

const removeSymbol = (sym: string) => {
  emit(
    'update:symbolOptions',
    props.symbolOptions.filter((s) => s !== sym),
  )
}

const inputTypes: { id: InputType; icon: typeof Type; label: string }[] = [
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'number', icon: Hash, label: 'Integer' },
  { id: 'float', icon: Hash, label: 'Float' },
  { id: 'select', icon: List, label: 'Select' },
  { id: 'boolean', icon: ToggleLeft, label: 'Toggle' },
  { id: 'date', icon: Calendar, label: 'Date' },
  { id: 'image', icon: ImageIcon, label: 'Image' },
  { id: 'draw', icon: PenTool, label: 'Draw' },
  { id: 'uid', icon: Fingerprint, label: 'UID' },
  { id: 'symbol', icon: Shapes, label: 'Symbol' },
]
</script>

<template>
  <!-- Input Type Grid -->
  <div>
    <label
      class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-2.5 uppercase tracking-wider"
    >
      Input Type
    </label>
    <div class="grid grid-cols-4 gap-2">
      <button
        v-for="t in inputTypes"
        :key="t.id"
        class="flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all"
        :class="
          inputType === t.id
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/10'
            : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
        "
        @click="emit('update:inputType', t.id)"
      >
        <component :is="t.icon" :size="18" class="mb-1" />
        <span class="text-[10px] font-medium">{{ t.label }}</span>
      </button>
    </div>
  </div>

  <!-- Field Label -->
  <div>
    <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
      Field Label
      <span class="text-[10px] font-normal text-gray-400 ml-1">Unique ID</span>
    </label>
    <input
      :value="label"
      type="text"
      class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
      placeholder="e.g. EmployeeName"
      @input="emit('update:label', ($event.target as HTMLInputElement).value)"
    />
    <p class="text-[10px] text-gray-400 dark:text-gray-600 mt-1 ml-1">
      Required for conditional logic references.
    </p>
  </div>

  <!-- Select Options -->
  <div v-if="inputType === 'select'">
    <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
      Options
      <span class="text-[10px] font-normal text-gray-400 ml-1">comma separated</span>
    </label>
    <textarea
      :value="optionsStr"
      class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all resize-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
      placeholder="Option 1, Option 2, Option 3"
      rows="3"
      @input="emit('update:optionsStr', ($event.target as HTMLTextAreaElement).value)"
    ></textarea>
  </div>

  <!-- Symbol Options -->
  <div v-if="inputType === 'symbol'">
    <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
      Symbol Options
      <span class="text-[10px] font-normal text-gray-400 ml-1">click to toggle</span>
    </label>
    <div class="grid grid-cols-8 gap-1.5 mb-3">
      <button
        v-for="sym in predefinedSymbols"
        :key="sym.value"
        class="w-9 h-9 rounded-lg border flex items-center justify-center text-lg transition-all"
        :class="
          symbolOptions.includes(sym.value)
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400'
            : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
        "
        :title="sym.label"
        @click="toggleSymbol(sym.value)"
      >
        {{ sym.value }}
      </button>
    </div>
    <!-- Custom symbol add -->
    <div class="flex gap-2">
      <input
        v-model="customSymbol"
        type="text"
        class="flex-1 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
        placeholder="Custom symbol or emoji"
        @keydown.enter.prevent="addCustomSymbol"
      />
      <button
        class="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-500 dark:hover:bg-blue-900/20 dark:hover:border-blue-600 dark:hover:text-blue-400 transition-all"
        :disabled="!customSymbol.trim()"
        @click="addCustomSymbol"
      >
        <Plus :size="16" />
      </button>
    </div>
    <!-- Custom symbols list -->
    <div
      v-if="symbolOptions.filter((s) => !predefinedSymbols.some((p) => p.value === s)).length"
      class="mt-2 flex flex-wrap gap-1.5"
    >
      <span
        v-for="sym in symbolOptions.filter((s) => !predefinedSymbols.some((p) => p.value === s))"
        :key="sym"
        class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-sm"
      >
        <span>{{ sym }}</span>
        <button class="text-indigo-400 hover:text-red-500 transition-colors" @click="removeSymbol(sym)">
          <X :size="12" />
        </button>
      </span>
    </div>
  </div>

  <!-- Placeholder -->
  <div
    v-if="
      inputType === 'text' ||
      inputType === 'number' ||
      inputType === 'float' ||
      inputType === 'image' ||
      inputType === 'draw'
    "
  >
    <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
      Placeholder
    </label>
    <input
      :value="placeholder"
      type="text"
      class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
      :placeholder="inputType === 'draw' ? 'e.g. Sign here' : 'Helper text for user'"
      @input="emit('update:placeholder', ($event.target as HTMLInputElement).value)"
    />
  </div>

  <!-- Draw Info -->
  <div
    v-if="inputType === 'draw'"
    class="flex gap-2.5 p-3.5 bg-indigo-50 dark:bg-indigo-900/15 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40"
  >
    <PenTool :size="16" class="text-indigo-500 shrink-0 mt-0.5" />
    <div class="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
      <p><strong>Draw / Signature</strong></p>
      <p class="mt-0.5">
        Operator can draw or sign directly on the cell using a canvas pad. The result is saved as an
        image.
      </p>
    </div>
  </div>

  <!-- UID Config -->
  <template v-if="inputType === 'uid'">
    <!-- UID Mode -->
    <div>
      <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
        UID Mode
      </label>
      <div class="grid grid-cols-2 gap-2">
        <button
          class="flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all"
          :class="
            uidMode === 'sequential'
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
          "
          @click="emit('update:uidMode', 'sequential')"
        >
          <Hash :size="16" class="mb-1" />
          <span class="text-[10px] font-medium">Sequential</span>
          <span class="text-[9px] opacity-60 mt-0.5">Auto-increment</span>
        </button>
        <button
          class="flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all"
          :class="
            uidMode === 'manual'
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
          "
          @click="emit('update:uidMode', 'manual')"
        >
          <Type :size="16" class="mb-1" />
          <span class="text-[10px] font-medium">Manual</span>
          <span class="text-[9px] opacity-60 mt-0.5">User enters ID</span>
        </button>
      </div>
    </div>

    <!-- Prefix & Suffix -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Prefix
        </label>
        <input
          :value="uidPrefix"
          type="text"
          class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
          placeholder="e.g. INV-"
          @input="emit('update:uidPrefix', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div>
        <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Suffix
        </label>
        <input
          :value="uidSuffix"
          type="text"
          class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
          placeholder="e.g. /2026"
          @input="emit('update:uidSuffix', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- Start From (sequential only) -->
    <div v-if="uidMode === 'sequential'">
      <label class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        Start From
      </label>
      <input
        :value="uidStartFrom"
        type="number"
        min="0"
        step="1"
        class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all"
        @input="emit('update:uidStartFrom', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <!-- UID Preview -->
    <div
      class="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800"
    >
      <p class="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1.5">
        Preview
      </p>
      <p class="text-sm font-mono text-gray-700 dark:text-gray-200 font-medium tracking-wide">
        {{ uidPreview }}
      </p>
      <p v-if="uidMode === 'sequential'" class="text-[10px] text-gray-400 mt-1">
        Next: {{ uidPrefix }}{{ String(uidStartFrom + 1).padStart(4, '0') }}{{ uidSuffix }}
      </p>
    </div>
  </template>

  <!-- Required Toggle -->
  <div
    class="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer select-none"
    @click="emit('update:required', !required)"
  >
    <div
      class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
      :class="required ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'"
    >
      <Check v-if="required" :size="12" class="text-white" />
    </div>
    <div>
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300"> Required Field </span>
      <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
        Operator must fill this field before submitting
      </p>
    </div>
  </div>
</template>
