<script setup lang="ts">
import { ref, nextTick, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, FileSpreadsheet, Sheet } from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'
import ThemeToggle from '@/features/theme/ui/ThemeToggle.vue'
import ProjectGroup from './ribbon/ProjectGroup.vue'
import ModeGroup from './ribbon/ModeGroup.vue'
import EditGroup from './ribbon/EditGroup.vue'
import FontGroup from './ribbon/FontGroup.vue'
import AlignmentGroup from './ribbon/AlignmentGroup.vue'
import CellsGroup from './ribbon/CellsGroup.vue'
import BorderGroup from './ribbon/BorderGroup.vue'
import InsertGroup from './ribbon/InsertGroup.vue'
import ViewGroup from './ribbon/ViewGroup.vue'

const store = useSpreadsheetStore()
const router = useRouter()

const isEditingFileName = ref(false)
const fileNameInputRef = ref<HTMLInputElement | null>(null)

const activeTab = ref('home')

const allTabs = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'insert', label: 'Insert', icon: '➕' },
  { id: 'data', label: 'Data', icon: '📊' },
  { id: 'view', label: 'View', icon: '👁️' },
] as const

const visibleTabs = computed(() => {
  if (store.appMode === 'manual') {
    return allTabs
  } else {
    return allTabs.filter((tab) => tab.id === 'data' || tab.id === 'view')
  }
})

watch(visibleTabs, (tabs) => {
  if (!tabs.some((t) => t.id === activeTab.value)) {
    activeTab.value = tabs[0]?.id ?? 'data'
  }
})

const handleBack = () => {
  store.reset()
  router.push('/')
}

const handleFileNameDoubleClick = () => {
  isEditingFileName.value = true
  nextTick(() => {
    fileNameInputRef.value?.focus()
    fileNameInputRef.value?.select()
  })
}

const handleFileNameKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    finishEditingFileName()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    cancelEditingFileName()
  }
}

const finishEditingFileName = () => {
  const input = fileNameInputRef.value
  if (input) {
    const newName = input.value.trim() || 'Untitled Project'
    store.fileName = newName
  }
  isEditingFileName.value = false
}

const cancelEditingFileName = () => {
  isEditingFileName.value = false
}

const handleFileNameBlur = () => {
  finishEditingFileName()
}
</script>

<template>
  <div
    class="flex flex-col z-20 shadow-sm border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 transition-colors shrink-0"
  >
    <!-- 1. TOP HEADER BAR -->
    <div
      class="bg-primary-700 dark:bg-primary-900 text-white px-4 h-10 flex justify-between items-center select-none"
    >
      <div class="flex items-center gap-3">
        <button
          class="p-1 hover:bg-white/20 rounded-full transition-colors"
          title="Back to Home"
          @click="handleBack"
        >
          <ArrowLeft :size="18" class="text-white" />
        </button>

        <div class="flex items-center gap-2 opacity-95 cursor-default">
          <FileSpreadsheet :size="18" class="text-white" />
          <span class="font-bold tracking-wide text-sm">Vue Spreadsheet</span>
        </div>

        <div class="h-4 w-px bg-white/30 rounded-full"></div>

        <div
          class="flex items-center gap-2 bg-primary-800 dark:bg-primary-950 px-3 py-0.5 rounded text-xs border border-white/10"
          title="Current File (double-click to edit)"
          @dblclick="handleFileNameDoubleClick"
        >
          <Sheet :size="12" class="opacity-70" />
          <input
            v-if="isEditingFileName"
            ref="fileNameInputRef"
            :value="store.fileName"
            class="bg-transparent border-none outline-none text-white font-medium truncate max-w-[200px] min-w-[50px]"
            @keydown="handleFileNameKeydown"
            @blur="handleFileNameBlur"
          />
          <span
            v-else
            class="font-medium truncate max-w-[200px] cursor-text hover:bg-white/10 px-1 rounded transition-colors"
          >
            {{ store.fileName }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>

    <!-- 2. RIBBON TABS -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <!-- Tab Navigation -->
      <div class="flex items-center h-10 px-2">
        <div class="flex items-center gap-1">
          <button
            v-for="tab in visibleTabs"
            :key="tab.id"
            class="px-4 py-2 text-xs font-medium rounded-t-md transition-all border-b-2"
            :class="
              activeTab === tab.id
                ? 'bg-gray-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            "
            @click="activeTab = tab.id"
          >
            <span class="mr-1">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div
        class="h-[88px] bg-gray-50/80 dark:bg-gray-800/80 flex items-center px-2 overflow-x-auto border-t border-gray-200 dark:border-gray-700 scrollbar-thin"
      >
        <!-- Home Tab -->
        <div v-if="activeTab === 'home'" class="flex items-center gap-2">
          <FontGroup />
          <AlignmentGroup />
          <CellsGroup />
          <BorderGroup />
          <EditGroup />
        </div>

        <!-- Insert Tab -->
        <div v-else-if="activeTab === 'insert'" class="flex items-center gap-2">
          <InsertGroup />
        </div>

        <!-- Data Tab -->
        <div v-else-if="activeTab === 'data'" class="flex items-center gap-2">
          <ProjectGroup />
        </div>

        <!-- View Tab -->
        <div v-else-if="activeTab === 'view'" class="flex items-center gap-2">
          <ViewGroup />
          <ModeGroup />
        </div>
      </div>
    </div>
  </div>
</template>
