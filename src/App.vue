<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/features/theme/model/themeStore'

// Initialize theme store to apply saved theme preference
useThemeStore()
</script>

<template>
  <div
    class="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300"
  >
    <RouterView />
  </div>
</template>
