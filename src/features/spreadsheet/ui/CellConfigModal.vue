<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { InputConfig, InputType, ValidationRule, UserRole } from '@/shared/types'
import {
  X,
  Settings,
  List,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  Image as ImageIcon,
  Shield,
  GitBranch,
  AlertCircle,
  Shapes,
  Check,
  Trash2,
  Sparkles,
} from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  initialConfig?: InputConfig
  targetLabel?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [config: InputConfig | undefined]
}>()

type Tab = 'general' | 'validation' | 'logic' | 'permission'

const activeTab = ref<Tab>('general')

// General
const inputType = ref<InputType>('text')
const label = ref('')
const placeholder = ref('')
const optionsStr = ref('')
const required = ref(false)

// Validation
const minVal = ref('')
const maxVal = ref('')
const pattern = ref('')
const errorMsg = ref('')

// Logic
const depLabel = ref('')
const depValue = ref('')

// Permissions
const allowedRoles = ref<UserRole[]>([])

const inputTypes: { id: InputType; icon: typeof Type; label: string }[] = [
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'number', icon: Hash, label: 'Number' },
  { id: 'select', icon: List, label: 'Select' },
  { id: 'boolean', icon: ToggleLeft, label: 'Toggle' },
  { id: 'date', icon: Calendar, label: 'Date' },
  { id: 'symbol', icon: Shapes, label: 'Symbol' },
  { id: 'image', icon: ImageIcon, label: 'Image' },
]

const allRoles: UserRole[] = [
  'Admin' as UserRole,
  'Manager' as UserRole,
  'Staff' as UserRole,
  'Viewer' as UserRole,
]

const tabs: { id: Tab; icon: typeof Settings; label: string }[] = [
  { id: 'general', icon: Settings, label: 'General' },
  { id: 'validation', icon: AlertCircle, label: 'Rules' },
  { id: 'logic', icon: GitBranch, label: 'Logic' },
  { id: 'permission', icon: Shield, label: 'Access' },
]

const logicPreview = computed(() => {
  if (!depLabel.value || !depValue.value) return ''
  return `If [${depLabel.value}] = "${depValue.value}" → Show this field`
})

// Reset form when modal opens
watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    activeTab.value = 'general'

    if (props.initialConfig) {
      inputType.value = props.initialConfig.type
      label.value = props.initialConfig.label || ''
      placeholder.value = props.initialConfig.placeholder || ''
      optionsStr.value = props.initialConfig.options?.join(', ') || ''
      required.value = props.initialConfig.required || false

      minVal.value = props.initialConfig.validation?.min?.toString() || ''
      maxVal.value = props.initialConfig.validation?.max?.toString() || ''
      pattern.value = props.initialConfig.validation?.pattern || ''
      errorMsg.value = props.initialConfig.validation?.message || ''

      depLabel.value = props.initialConfig.conditional?.dependencyLabel || ''
      depValue.value = props.initialConfig.conditional?.value || ''

      allowedRoles.value = props.initialConfig.allowedRoles
        ? [...props.initialConfig.allowedRoles]
        : []
    } else {
      inputType.value = 'text'
      label.value = ''
      placeholder.value = ''
      optionsStr.value = ''
      required.value = false
      minVal.value = ''
      maxVal.value = ''
      pattern.value = ''
      errorMsg.value = ''
      depLabel.value = ''
      depValue.value = ''
      allowedRoles.value = []
    }
  },
)

const handleSave = () => {
  const config: InputConfig = {
    type: inputType.value,
    label: label.value || undefined,
    placeholder: placeholder.value || undefined,
    required: required.value,
  }

  if (inputType.value === 'select') {
    config.options = optionsStr.value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  const validation: ValidationRule = {}
  if (minVal.value !== '') validation.min = Number(minVal.value)
  if (maxVal.value !== '') validation.max = Number(maxVal.value)
  if (pattern.value) validation.pattern = pattern.value
  if (errorMsg.value) validation.message = errorMsg.value
  if (Object.keys(validation).length > 0) config.validation = validation

  if (depLabel.value && depValue.value) {
    config.conditional = {
      dependencyLabel: depLabel.value,
      value: depValue.value,
      action: 'show',
    }
  }

  if (allowedRoles.value.length > 0) {
    config.allowedRoles = [...allowedRoles.value]
  }

  emit('save', config)
  emit('close')
}

const handleRemove = () => {
  emit('save', undefined)
  emit('close')
}

const toggleRole = (role: UserRole) => {
  const idx = allowedRoles.value.indexOf(role)
  if (idx >= 0) {
    allowedRoles.value.splice(idx, 1)
  } else {
    allowedRoles.value.push(role)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 flex items-center justify-center"
        style="z-index: 10000"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')"></div>

        <!-- Modal -->
        <div
          class="relative w-full max-w-[460px] mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-200/60 dark:border-gray-700/60"
        >
          <!-- Header -->
          <div class="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
                >
                  <Sparkles :size="18" class="text-white" />
                </div>
                <div>
                  <h2
                    class="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight"
                  >
                    Cell Configuration
                  </h2>
                  <p
                    v-if="targetLabel"
                    class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1"
                  >
                    <span
                      class="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600 dark:text-gray-400"
                    >
                      {{ targetLabel }}
                    </span>
                  </p>
                </div>
              </div>
              <button
                class="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                @click="emit('close')"
              >
                <X :size="16" />
              </button>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div
            class="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50"
          >
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="flex-1 py-2.5 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all relative"
              :class="
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
              "
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" :size="13" />
              {{ tab.label }}
              <div
                v-if="activeTab === tab.id"
                class="absolute bottom-0 left-3 right-3 h-[2px] bg-blue-500 rounded-full"
              ></div>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="flex-1 overflow-y-auto p-5 space-y-5">
            <!-- GENERAL TAB -->
            <template v-if="activeTab === 'general'">
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
                    @click="inputType = t.id"
                  >
                    <component :is="t.icon" :size="18" class="mb-1" />
                    <span class="text-[10px] font-medium">{{ t.label }}</span>
                  </button>
                </div>
              </div>

              <!-- Field Label -->
              <div>
                <label
                  class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Field Label
                  <span class="text-[10px] font-normal text-gray-400 ml-1">Unique ID</span>
                </label>
                <input
                  v-model="label"
                  type="text"
                  class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  placeholder="e.g. EmployeeName"
                />
                <p class="text-[10px] text-gray-400 dark:text-gray-600 mt-1 ml-1">
                  Required for conditional logic references.
                </p>
              </div>

              <!-- Select Options -->
              <div v-if="inputType === 'select'">
                <label
                  class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Options
                  <span class="text-[10px] font-normal text-gray-400 ml-1">comma separated</span>
                </label>
                <textarea
                  v-model="optionsStr"
                  class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all resize-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  placeholder="Option 1, Option 2, Option 3"
                  rows="3"
                ></textarea>
              </div>

              <!-- Placeholder -->
              <div v-if="inputType === 'text' || inputType === 'number'">
                <label
                  class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Placeholder
                </label>
                <input
                  v-model="placeholder"
                  type="text"
                  class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  placeholder="Helper text for user"
                />
              </div>

              <!-- Required Toggle -->
              <div
                class="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer select-none"
                @click="required = !required"
              >
                <div
                  class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                  :class="
                    required
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  "
                >
                  <Check v-if="required" :size="12" class="text-white" />
                </div>
                <div>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Required Field
                  </span>
                  <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Operator must fill this field before submitting
                  </p>
                </div>
              </div>
            </template>

            <!-- VALIDATION TAB -->
            <template v-if="activeTab === 'validation'">
              <div v-if="inputType === 'number'" class="grid grid-cols-2 gap-3">
                <div>
                  <label
                    class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Min Value
                  </label>
                  <input
                    v-model="minVal"
                    type="number"
                    class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Max Value
                  </label>
                  <input
                    v-model="maxVal"
                    type="number"
                    class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Regex Pattern
                </label>
                <input
                  v-model="pattern"
                  type="text"
                  class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  placeholder="e.g. ^[A-Z]{3}$"
                />
              </div>

              <div>
                <label
                  class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Custom Error Message
                </label>
                <input
                  v-model="errorMsg"
                  type="text"
                  class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  placeholder="Value must be..."
                />
              </div>

              <div
                v-if="inputType !== 'number' && !pattern && !errorMsg"
                class="text-center py-8 text-gray-300 dark:text-gray-600"
              >
                <AlertCircle :size="32" class="mx-auto mb-2 opacity-50" />
                <p class="text-xs">Add regex patterns or error messages to validate input</p>
              </div>
            </template>

            <!-- LOGIC TAB -->
            <template v-if="activeTab === 'logic'">
              <div
                class="flex gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-900/15 rounded-xl border border-amber-200/60 dark:border-amber-800/40"
              >
                <AlertCircle :size="16" class="text-amber-500 shrink-0 mt-0.5" />
                <p class="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                  Show this field <strong>only if</strong> another field has a specific value.
                </p>
              </div>

              <div>
                <label
                  class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Dependency Field Label
                </label>
                <input
                  v-model="depLabel"
                  type="text"
                  class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  placeholder="e.g. Gender"
                />
              </div>

              <div>
                <label
                  class="block text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Required Value
                </label>
                <input
                  v-model="depValue"
                  type="text"
                  class="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  placeholder="e.g. Female"
                />
              </div>

              <!-- Logic Preview -->
              <div
                v-if="logicPreview"
                class="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800"
              >
                <p class="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1.5">
                  Preview
                </p>
                <p class="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  {{ logicPreview }}
                </p>
              </div>
            </template>

            <!-- PERMISSION TAB -->
            <template v-if="activeTab === 'permission'">
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
            </template>
          </div>

          <!-- Footer -->
          <div
            class="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between"
          >
            <button
              v-if="initialConfig"
              class="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              @click="handleRemove"
            >
              <Trash2 :size="13" />
              Remove Widget
            </button>
            <div v-else></div>

            <div class="flex items-center gap-2">
              <button
                class="px-4 py-2 text-[12px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                @click="emit('close')"
              >
                Cancel
              </button>
              <button
                class="px-5 py-2 text-[12px] font-semibold text-white bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.97]"
                @click="handleSave"
              >
                Save Config
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
</style>
