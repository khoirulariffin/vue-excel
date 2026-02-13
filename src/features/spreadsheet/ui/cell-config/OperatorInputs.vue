<script setup lang="ts">
import { ImagePlus, PenTool, Fingerprint, Maximize2, Trash2 } from 'lucide-vue-next'
import type { InputConfig } from '@/shared/types'
import CellImageDisplay from './CellImageDisplay.vue'

interface Props {
  inputConfig: InputConfig
  operatorValue: string
  operatorTextColor: string
  showResizeHandle?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  input: [e: Event]
  booleanToggle: []
  imageUpload: [e: Event]
  openDraw: []
  generateUid: []
  openImagePreview: []
  clearImage: []
  resizeStart: [e: MouseEvent]
  widthResizeStart: [e: MouseEvent]
  heightResizeStart: [e: MouseEvent]
  touchResizeStart: [e: TouchEvent]
  touchWidthResizeStart: [e: TouchEvent]
  touchHeightResizeStart: [e: TouchEvent]
}>()
</script>

<template>
  <!-- Required indicator -->
  <span
    v-if="inputConfig.required"
    class="absolute top-0 right-0.5 text-red-500 text-base font-bold z-30 leading-none"
    >*</span
  >

  <!-- Text Input -->
  <input
    v-if="inputConfig.type === 'text'"
    :value="operatorValue"
    type="text"
    class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 text-[11pt] px-1 outline-none border-none m-0"
    :style="{ color: operatorTextColor }"
    :placeholder="inputConfig.placeholder || ''"
    @input="emit('input', $event)"
  />

  <!-- Number Input (int) -->
  <input
    v-else-if="inputConfig.type === 'number'"
    :value="operatorValue"
    type="number"
    step="1"
    class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 text-[11pt] px-1 outline-none border-none m-0"
    :style="{ color: operatorTextColor }"
    :placeholder="inputConfig.placeholder || ''"
    :min="inputConfig.validation?.min"
    :max="inputConfig.validation?.max"
    @input="emit('input', $event)"
  />

  <!-- Float Input -->
  <input
    v-else-if="inputConfig.type === 'float'"
    :value="operatorValue"
    type="number"
    step="any"
    class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 text-[11pt] px-1 outline-none border-none m-0"
    :style="{ color: operatorTextColor }"
    :placeholder="inputConfig.placeholder || ''"
    :min="inputConfig.validation?.min"
    :max="inputConfig.validation?.max"
    @input="emit('input', $event)"
  />

  <!-- Select Dropdown -->
  <select
    v-else-if="inputConfig.type === 'select'"
    :value="operatorValue"
    class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 text-[11pt] px-0.5 outline-none border-none m-0 cursor-pointer"
    :style="{ color: operatorValue ? operatorTextColor : '#9ca3af' }"
    @change="emit('input', $event)"
  >
    <option value="" disabled>{{ inputConfig.placeholder || '-- Select --' }}</option>
    <option
      v-for="opt in inputConfig.options || []"
      :key="opt"
      :value="opt"
      :style="{ color: operatorTextColor }"
    >
      {{ opt }}
    </option>
  </select>

  <!-- Boolean Toggle -->
  <div
    v-else-if="inputConfig.type === 'boolean'"
    class="w-full h-full flex items-center justify-center bg-blue-50/40 dark:bg-blue-900/20 cursor-pointer"
    @click.stop="emit('booleanToggle')"
  >
    <div
      class="w-8 h-[18px] rounded-full transition-all relative"
      :class="operatorValue === 'true' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'"
    >
      <div
        class="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all"
        :class="operatorValue === 'true' ? 'left-[16px]' : 'left-[2px]'"
      ></div>
    </div>
  </div>

  <!-- Image Upload -->
  <div
    v-else-if="inputConfig.type === 'image'"
    class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 flex items-center justify-center overflow-hidden relative group cursor-pointer"
    @click.stop="
      operatorValue && operatorValue.startsWith('data:image')
        ? undefined
        : ($refs.imageInput as HTMLInputElement)?.click()
    "
  >
    <!-- Image with resize handles -->
    <CellImageDisplay
      v-if="operatorValue && operatorValue.startsWith('data:image')"
      :image-src="operatorValue"
      :show-resize-handle="showResizeHandle ?? false"
      @open-preview="emit('openImagePreview')"
      @resize-start="emit('resizeStart', $event)"
      @width-resize-start="emit('widthResizeStart', $event)"
      @height-resize-start="emit('heightResizeStart', $event)"
      @touch-resize-start="emit('touchResizeStart', $event)"
      @touch-width-resize-start="emit('touchWidthResizeStart', $event)"
      @touch-height-resize-start="emit('touchHeightResizeStart', $event)"
    />
    <div v-else class="flex flex-col items-center gap-0.5 text-gray-400 dark:text-gray-500">
      <ImagePlus :size="18" />
      <span class="text-[8pt]">{{ inputConfig.placeholder || 'Upload' }}</span>
    </div>
    <!-- Hover overlay with actions -->
    <div
      v-if="operatorValue && operatorValue.startsWith('data:image')"
      class="absolute inset-0 bg-black/40 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30"
    >
      <button
        class="p-1 rounded bg-white/20 hover:bg-white/40 transition-colors"
        title="Preview & Edit"
        @click.stop="emit('openImagePreview')"
      >
        <Maximize2 :size="12" class="text-white" />
      </button>
      <button
        class="p-1 rounded bg-white/20 hover:bg-white/40 transition-colors"
        title="Replace"
        @click.stop="($refs.imageInput as HTMLInputElement)?.click()"
      >
        <ImagePlus :size="12" class="text-white" />
      </button>
      <button
        class="p-1 rounded bg-red-500/40 hover:bg-red-500/70 transition-colors"
        title="Delete"
        @click.stop="emit('clearImage')"
      >
        <Trash2 :size="12" class="text-white" />
      </button>
    </div>
    <input
      ref="imageInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="emit('imageUpload', $event)"
    />
  </div>

  <!-- Draw / Signature -->
  <div
    v-else-if="inputConfig.type === 'draw'"
    class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 flex items-center justify-center overflow-hidden relative group cursor-pointer"
    @click.stop="
      operatorValue && operatorValue.startsWith('data:image') ? undefined : emit('openDraw')
    "
  >
    <!-- Signature image with resize handles -->
    <CellImageDisplay
      v-if="operatorValue && operatorValue.startsWith('data:image')"
      :image-src="operatorValue"
      :show-resize-handle="showResizeHandle ?? false"
      @open-preview="emit('openImagePreview')"
      @resize-start="emit('resizeStart', $event)"
      @width-resize-start="emit('widthResizeStart', $event)"
      @height-resize-start="emit('heightResizeStart', $event)"
      @touch-resize-start="emit('touchResizeStart', $event)"
      @touch-width-resize-start="emit('touchWidthResizeStart', $event)"
      @touch-height-resize-start="emit('touchHeightResizeStart', $event)"
    />
    <div v-else class="flex flex-col items-center gap-0.5 text-gray-400 dark:text-gray-500">
      <PenTool :size="18" />
      <span class="text-[8pt]">{{ inputConfig.placeholder || 'Sign here' }}</span>
    </div>
    <!-- Hover overlay with actions -->
    <div
      v-if="operatorValue && operatorValue.startsWith('data:image')"
      class="absolute inset-0 bg-black/40 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30"
    >
      <button
        class="p-1 rounded bg-white/20 hover:bg-white/40 transition-colors"
        title="Preview & Edit"
        @click.stop="emit('openImagePreview')"
      >
        <Maximize2 :size="12" class="text-white" />
      </button>
      <button
        class="p-1 rounded bg-white/20 hover:bg-white/40 transition-colors"
        title="Re-draw"
        @click.stop="emit('openDraw')"
      >
        <PenTool :size="12" class="text-white" />
      </button>
      <button
        class="p-1 rounded bg-red-500/40 hover:bg-red-500/70 transition-colors"
        title="Delete"
        @click.stop="emit('clearImage')"
      >
        <Trash2 :size="12" class="text-white" />
      </button>
    </div>
  </div>

  <!-- UID -->
  <div
    v-else-if="inputConfig.type === 'uid'"
    class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 flex items-center overflow-hidden"
  >
    <template v-if="inputConfig.uidConfig?.mode === 'manual'">
      <input
        :value="operatorValue"
        type="text"
        class="w-full h-full bg-transparent text-[11pt] px-1 outline-none border-none m-0 font-mono"
        :style="{ color: operatorTextColor }"
        :placeholder="
          (inputConfig.uidConfig?.prefix || '') + '____' + (inputConfig.uidConfig?.suffix || '')
        "
        @input="emit('input', $event)"
      />
    </template>
    <template v-else>
      <span
        v-if="operatorValue"
        class="flex-1 text-[11pt] font-mono px-1 truncate"
        :style="{ color: operatorTextColor }"
      >
        {{ operatorValue }}
      </span>
      <button
        v-if="!operatorValue"
        class="flex items-center gap-1 mx-auto px-2 py-0.5 text-[9pt] font-medium text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
        @click.stop="emit('generateUid')"
      >
        <Fingerprint :size="14" />
        Generate
      </button>
    </template>
  </div>

  <!-- Symbol Select -->
  <select
    v-else-if="inputConfig.type === 'symbol'"
    :value="operatorValue"
    class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 text-[14pt] px-0.5 outline-none border-none m-0 cursor-pointer text-center"
    :style="{ color: operatorValue ? operatorTextColor : '#9ca3af' }"
    @change="emit('input', $event)"
  >
    <option value="" disabled>{{ inputConfig.placeholder || '-- Symbol --' }}</option>
    <option
      v-for="opt in inputConfig.options || []"
      :key="opt"
      :value="opt"
      :style="{ color: operatorTextColor }"
    >
      {{ opt }}
    </option>
  </select>

  <!-- Date Input -->
  <input
    v-else-if="inputConfig.type === 'date'"
    :value="operatorValue"
    type="date"
    class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 text-[10pt] px-0.5 outline-none border-none m-0 cursor-pointer"
    :style="{ color: operatorTextColor }"
    @input="emit('input', $event)"
  />

  <!-- Fallback: text input -->
  <input
    v-else
    :value="operatorValue"
    type="text"
    class="w-full h-full bg-blue-50/40 dark:bg-blue-900/20 text-[11pt] px-1 outline-none border-none m-0"
    :style="{ color: operatorTextColor }"
    :placeholder="inputConfig.placeholder || ''"
    @input="emit('input', $event)"
  />
</template>
