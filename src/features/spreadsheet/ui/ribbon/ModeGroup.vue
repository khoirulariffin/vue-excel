<script setup lang="ts">
import type { Component } from 'vue'
import { PenTool, Eye, Grid3x3, Shield } from 'lucide-vue-next'
import { useSpreadsheetStore } from '@/features/spreadsheet/model/spreadsheetStore'
import type { AppMode } from '@/shared/types'
import { UserRole } from '@/shared/types'

const store = useSpreadsheetStore()

const roleOptions: { value: UserRole; label: string }[] = [
  { value: UserRole.ADMIN, label: 'Admin' },
  { value: UserRole.MANAGER, label: 'Manager' },
  { value: UserRole.STAFF, label: 'Staff' },
  { value: UserRole.VIEWER, label: 'Viewer' },
]

const handleSwitchMode = (mode: AppMode) => {
  store.appMode = mode
}

const modes: { key: AppMode; label: string; icon: Component; color: string; bg: string }[] = [
  {
    key: 'designer',
    label: 'Designer',
    icon: PenTool,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    key: 'operator',
    label: 'Operator',
    icon: Eye,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    key: 'manual',
    label: 'Manual',
    icon: Grid3x3,
    color: 'text-gray-700 dark:text-gray-300',
    bg: 'bg-gray-200 dark:bg-gray-600',
  },
]
</script>

<template>
  <!-- GROUP: Application Mode -->
  <div class="flex flex-col items-center px-2 relative h-full justify-between py-1">
    <div class="flex items-center gap-1 h-full">
      <button
        v-for="mode in modes"
        :key="mode.key"
        class="flex flex-col items-center justify-center h-16 min-w-[64px] px-2 rounded-lg transition-all group focus:outline-none"
        :class="
          store.appMode === mode.key
            ? 'bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-500/50 shadow-inner'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
        "
        @click="handleSwitchMode(mode.key)"
      >
        <div
          class="p-2 rounded-md mb-1 transition-transform group-hover:-translate-y-0.5"
          :class="[store.appMode === mode.key ? 'bg-transparent' : mode.bg, mode.color]"
        >
          <component :is="mode.icon" :size="20" :stroke-width="2" />
        </div>
        <span
          class="text-[11px] font-medium leading-tight text-center tracking-tight"
          :class="
            store.appMode === mode.key
              ? 'text-primary-900 dark:text-primary-300 font-bold'
              : 'text-gray-700 dark:text-gray-300'
          "
        >
          {{ mode.label }}
        </span>
      </button>
    </div>
    <span
      class="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-1 select-none"
      >Mode</span
    >
    <div class="absolute right-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700"></div>
  </div>

  <!-- Role Selector (visible in Operator mode) -->
  <div
    v-if="store.appMode === 'operator'"
    class="flex flex-col items-center px-2 relative h-full justify-between py-1"
  >
    <div class="flex flex-col items-center justify-center h-full gap-1">
      <div class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        <Shield :size="13" />
        <span class="text-[10px] font-semibold uppercase tracking-wider">Role</span>
      </div>
      <select
        :value="store.currentUserRole"
        class="h-7 px-2 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 cursor-pointer"
        @change="
          (e: Event) => (store.currentUserRole = (e.target as HTMLSelectElement).value as UserRole)
        "
      >
        <option v-for="role in roleOptions" :key="role.value" :value="role.value">
          {{ role.label }}
        </option>
      </select>
    </div>
    <span
      class="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-1 select-none"
      >As</span
    >
    <div class="absolute right-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700"></div>
  </div>
</template>
