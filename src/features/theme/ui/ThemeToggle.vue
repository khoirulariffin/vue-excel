<script setup lang="ts">
import { Moon, Sun, Monitor } from 'lucide-vue-next'
import { useThemeStore } from '../model/themeStore'

const themeStore = useThemeStore()
</script>

<template>
  <button
    @click="themeStore.toggleTheme"
    class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
    title="Toggle Theme"
  >
    <Sun v-if="themeStore.theme === 'light'" class="w-5 h-5" />
    <Moon v-else-if="themeStore.theme === 'dark'" class="w-5 h-5" />
    <Monitor v-else class="w-5 h-5" />
  </button>
</template>
