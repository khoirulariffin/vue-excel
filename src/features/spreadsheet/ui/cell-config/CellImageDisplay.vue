<script setup lang="ts">
interface Props {
  imageSrc: string
  showResizeHandle: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  openPreview: []
  resizeStart: [e: MouseEvent]
  widthResizeStart: [e: MouseEvent]
  heightResizeStart: [e: MouseEvent]
}>()
</script>

<template>
  <div class="w-full h-full relative group">
    <img :src="imageSrc" alt="cell-img" class="h-full w-auto object-contain" />
    <div
      class="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
      @dblclick.stop="emit('openPreview')"
    >
      <span class="text-[8px] text-white font-medium bg-black/50 px-1.5 py-0.5 rounded">
        Double-click to edit
      </span>
    </div>
    <!-- Corner resize handle (width + height) -->
    <div
      v-if="showResizeHandle"
      class="absolute -bottom-[4px] -right-[4px] w-[10px] h-[10px] bg-blue-500 border-2 border-white rounded-sm cursor-nwse-resize z-40 shadow-sm hover:bg-blue-600 transition-colors"
      @mousedown.stop.prevent="emit('resizeStart', $event)"
    ></div>
    <!-- Side resize handle (width only) -->
    <div
      v-if="showResizeHandle"
      class="absolute top-1/2 -right-[4px] -translate-y-1/2 w-[6px] h-[16px] bg-blue-500 border border-white rounded-sm cursor-ew-resize z-40 shadow-sm hover:bg-blue-600 transition-colors"
      @mousedown.stop.prevent="emit('widthResizeStart', $event)"
    ></div>
    <!-- Bottom resize handle (height only) -->
    <div
      v-if="showResizeHandle"
      class="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-[16px] h-[6px] bg-blue-500 border border-white rounded-sm cursor-ns-resize z-40 shadow-sm hover:bg-blue-600 transition-colors"
      @mousedown.stop.prevent="emit('heightResizeStart', $event)"
    ></div>
  </div>
</template>
