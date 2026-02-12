<script setup lang="ts">
import { ref } from 'vue'
import type { UserRole } from '@/shared/types'
import { Shield, Building2, Check, Plus, X } from 'lucide-vue-next'

interface Props {
  allowedRoles: UserRole[]
  allowedDepartments: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:allowedRoles': [val: UserRole[]]
  'update:allowedDepartments': [val: string[]]
}>()

const newDepartment = ref('')

const allRoles: UserRole[] = [
  'Admin' as UserRole,
  'Manager' as UserRole,
  'Staff' as UserRole,
  'Viewer' as UserRole,
]

const predefinedDepartments: string[] = [
  'Engineering',
  'Marketing',
  'Finance',
  'HR',
  'Operations',
  'Sales',
  'Legal',
  'IT',
]

const toggleRole = (role: UserRole) => {
  const updated = [...props.allowedRoles]
  const idx = updated.indexOf(role)
  if (idx >= 0) {
    updated.splice(idx, 1)
  } else {
    updated.push(role)
  }
  emit('update:allowedRoles', updated)
}

const toggleDepartment = (dept: string) => {
  const updated = [...props.allowedDepartments]
  const idx = updated.indexOf(dept)
  if (idx >= 0) {
    updated.splice(idx, 1)
  } else {
    updated.push(dept)
  }
  emit('update:allowedDepartments', updated)
}

const addDepartment = () => {
  const dept = newDepartment.value.trim()
  if (dept && !props.allowedDepartments.includes(dept)) {
    emit('update:allowedDepartments', [...props.allowedDepartments, dept])
  }
  newDepartment.value = ''
}

const removeDepartment = (dept: string) => {
  emit(
    'update:allowedDepartments',
    props.allowedDepartments.filter((d) => d !== dept),
  )
}
</script>

<template>
  <!-- Role Access -->
  <div
    class="flex gap-2.5 p-3.5 bg-blue-50 dark:bg-blue-900/15 rounded-xl border border-blue-200/60 dark:border-blue-800/40"
  >
    <Shield :size="16" class="text-blue-500 shrink-0 mt-0.5" />
    <div class="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
      <p>Select roles that can edit this cell.</p>
      <p class="text-blue-500/70 dark:text-blue-400/50 mt-0.5">
        If empty, column-level permissions apply.
      </p>
    </div>
  </div>

  <div class="space-y-2">
    <button
      v-for="role in allRoles"
      :key="role"
      class="w-full flex items-center justify-between p-3.5 rounded-xl border transition-all"
      :class="
        allowedRoles.includes(role)
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-700 shadow-sm shadow-blue-500/10'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
      "
      @click="toggleRole(role)"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center"
          :class="
            allowedRoles.includes(role)
              ? 'bg-blue-100 dark:bg-blue-800/40'
              : 'bg-gray-100 dark:bg-gray-700'
          "
        >
          <Shield
            :size="14"
            :class="
              allowedRoles.includes(role)
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500'
            "
          />
        </div>
        <span
          class="text-sm font-medium"
          :class="
            allowedRoles.includes(role)
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300'
          "
        >
          {{ role }}
        </span>
      </div>
      <div
        v-if="allowedRoles.includes(role)"
        class="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
      >
        <Check :size="12" class="text-white" />
      </div>
    </button>
  </div>

  <!-- Department Access -->
  <div class="pt-2 border-t border-gray-100 dark:border-gray-800">
    <div
      class="flex gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-900/15 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 mb-4"
    >
      <Building2 :size="16" class="text-emerald-500 shrink-0 mt-0.5" />
      <div class="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
        <p>Restrict access by department.</p>
        <p class="text-emerald-500/70 dark:text-emerald-400/50 mt-0.5">
          If empty, all departments can access.
        </p>
      </div>
    </div>

    <label
      class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-2.5 uppercase tracking-wider"
    >
      Departments
    </label>

    <!-- Predefined departments grid -->
    <div class="grid grid-cols-2 gap-2 mb-3">
      <button
        v-for="dept in predefinedDepartments"
        :key="dept"
        class="flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left"
        :class="
          allowedDepartments.includes(dept)
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-700 shadow-sm shadow-emerald-500/10'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
        "
        @click="toggleDepartment(dept)"
      >
        <span
          class="text-[12px] font-medium"
          :class="
            allowedDepartments.includes(dept)
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-gray-600 dark:text-gray-400'
          "
        >
          {{ dept }}
        </span>
        <div
          v-if="allowedDepartments.includes(dept)"
          class="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
        >
          <Check :size="10" class="text-white" />
        </div>
      </button>
    </div>

    <!-- Custom department add -->
    <div class="flex gap-2">
      <input
        v-model="newDepartment"
        type="text"
        class="flex-1 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
        placeholder="Add custom department..."
        @keydown.enter.prevent="addDepartment"
      />
      <button
        class="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-500 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-600 dark:hover:text-emerald-400 transition-all"
        :disabled="!newDepartment.trim()"
        @click="addDepartment"
      >
        <Plus :size="16" />
      </button>
    </div>

    <!-- Custom departments (not in predefined list) -->
    <div
      v-if="allowedDepartments.filter((d) => !predefinedDepartments.includes(d)).length"
      class="mt-2 flex flex-wrap gap-1.5"
    >
      <span
        v-for="dept in allowedDepartments.filter((d) => !predefinedDepartments.includes(d))"
        :key="dept"
        class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-[12px] font-medium text-emerald-700 dark:text-emerald-300"
      >
        {{ dept }}
        <button
          class="text-emerald-400 hover:text-red-500 transition-colors"
          @click="removeDepartment(dept)"
        >
          <X :size="12" />
        </button>
      </span>
    </div>
  </div>
</template>
