<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { InputConfig, InputType, ValidationRule, UserRole, UidMode } from '@/shared/types'
import { X, Settings, Shield, GitBranch, AlertCircle, Trash2, Sparkles } from 'lucide-vue-next'
import ConfigTabGeneral from './cell-config/ConfigTabGeneral.vue'
import ConfigTabValidation from './cell-config/ConfigTabValidation.vue'
import ConfigTabLogic from './cell-config/ConfigTabLogic.vue'
import ConfigTabPermission from './cell-config/ConfigTabPermission.vue'

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

// UID Config
const uidMode = ref<UidMode>('sequential')
const uidPrefix = ref('')
const uidSuffix = ref('')
const uidStartFrom = ref(1)

// Permissions
const allowedRoles = ref<UserRole[]>([])
const allowedDepartments = ref<string[]>([])

// Symbol
const defaultSymbols = [
  '✓',
  '✗',
  '●',
  '○',
  '■',
  '□',
  '▲',
  '★',
  '☆',
  '♦',
  '⚠',
  '⬤',
  '→',
  '←',
  '↑',
  '↓',
]
const symbolOptions = ref<string[]>([...defaultSymbols])

const tabs: { id: Tab; icon: typeof Settings; label: string }[] = [
  { id: 'general', icon: Settings, label: 'General' },
  { id: 'validation', icon: AlertCircle, label: 'Rules' },
  { id: 'logic', icon: GitBranch, label: 'Logic' },
  { id: 'permission', icon: Shield, label: 'Access' },
]

const uidPreview = computed(() => {
  const prefix = uidPrefix.value || ''
  const suffix = uidSuffix.value || ''
  const num = uidMode.value === 'sequential' ? String(uidStartFrom.value).padStart(4, '0') : '____'
  return `${prefix}${num}${suffix}`
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
      allowedDepartments.value = props.initialConfig.allowedDepartments
        ? [...props.initialConfig.allowedDepartments]
        : []

      if (props.initialConfig.type === 'symbol' && props.initialConfig.options?.length) {
        symbolOptions.value = [...new Set([...defaultSymbols, ...props.initialConfig.options])]
      }

      uidMode.value = props.initialConfig.uidConfig?.mode || 'sequential'
      uidPrefix.value = props.initialConfig.uidConfig?.prefix || ''
      uidSuffix.value = props.initialConfig.uidConfig?.suffix || ''
      uidStartFrom.value = props.initialConfig.uidConfig?.startFrom ?? 1
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
      allowedDepartments.value = []
      symbolOptions.value = [...defaultSymbols]
      uidMode.value = 'sequential'
      uidPrefix.value = ''
      uidSuffix.value = ''
      uidStartFrom.value = 1
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

  if (inputType.value === 'symbol') {
    config.options = [...symbolOptions.value]
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

  if (allowedDepartments.value.length > 0) {
    config.allowedDepartments = [...allowedDepartments.value]
  }

  if (inputType.value === 'uid') {
    config.uidConfig = {
      mode: uidMode.value,
      prefix: uidPrefix.value || undefined,
      suffix: uidSuffix.value || undefined,
      startFrom: uidMode.value === 'sequential' ? uidStartFrom.value : undefined,
    }
  }

  emit('save', config)
  emit('close')
}

const handleRemove = () => {
  emit('save', undefined)
  emit('close')
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
            <ConfigTabGeneral
              v-if="activeTab === 'general'"
              v-model:input-type="inputType"
              v-model:label="label"
              v-model:placeholder="placeholder"
              v-model:options-str="optionsStr"
              v-model:required="required"
              v-model:uid-mode="uidMode"
              v-model:uid-prefix="uidPrefix"
              v-model:uid-suffix="uidSuffix"
              v-model:uid-start-from="uidStartFrom"
              v-model:symbol-options="symbolOptions"
              :uid-preview="uidPreview"
            />

            <ConfigTabValidation
              v-if="activeTab === 'validation'"
              v-model:min-val="minVal"
              v-model:max-val="maxVal"
              v-model:pattern="pattern"
              v-model:error-msg="errorMsg"
              :input-type="inputType"
            />

            <ConfigTabLogic
              v-if="activeTab === 'logic'"
              v-model:dep-label="depLabel"
              v-model:dep-value="depValue"
            />

            <ConfigTabPermission
              v-if="activeTab === 'permission'"
              v-model:allowed-roles="allowedRoles"
              v-model:allowed-departments="allowedDepartments"
            />
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
