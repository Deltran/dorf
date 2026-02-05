<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  options: { type: Array, required: true },
  placeholder: { type: String, default: 'Search...' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['select'])

const query = ref('')
const isOpen = ref(false)
let blurTimeout = null

const filteredOptions = computed(() => {
  if (!query.value) return props.options.slice(0, 50)
  const q = query.value.toLowerCase()
  return props.options
    .filter(opt => opt.label.toLowerCase().includes(q) || opt.id.toLowerCase().includes(q))
    .slice(0, 50)
})

const showNoMatches = computed(() => {
  return isOpen.value && query.value && filteredOptions.value.length === 0
})

function onFocus() {
  if (blurTimeout) {
    clearTimeout(blurTimeout)
    blurTimeout = null
  }
  isOpen.value = true
}

function onBlur() {
  blurTimeout = setTimeout(() => {
    isOpen.value = false
  }, 200)
}

function selectOption(option) {
  emit('select', option)
  query.value = ''
  isOpen.value = false
  if (blurTimeout) {
    clearTimeout(blurTimeout)
    blurTimeout = null
  }
}
</script>

<template>
  <div class="searchable-dropdown">
    <input
      v-model="query"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      class="search-input"
      @focus="onFocus"
      @blur="onBlur"
    />
    <div v-if="isOpen" class="dropdown-list">
      <div
        v-for="option in filteredOptions"
        :key="option.id"
        class="dropdown-option"
        @mousedown.prevent="selectOption(option)"
      >
        <span class="option-label">{{ option.label }}</span>
        <span v-if="option.sublabel" class="option-sublabel">{{ option.sublabel }}</span>
      </div>
      <div v-if="showNoMatches" class="no-matches">No matches</div>
    </div>
  </div>
</template>

<style scoped>
.searchable-dropdown {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 8px 10px;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 0.85rem;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}

.search-input:focus {
  border-color: #3b82f6;
}

.search-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 4px;
  margin-top: 2px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}

.dropdown-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  cursor: pointer;
  transition: background 0.1s;
}

.dropdown-option:hover {
  background: #374151;
}

.option-label {
  font-size: 0.85rem;
  color: #f3f4f6;
}

.option-sublabel {
  font-size: 0.7rem;
  color: #6b7280;
  font-family: monospace;
  text-align: right;
  margin-left: 8px;
  flex-shrink: 0;
}

.no-matches {
  text-align: center;
  padding: 10px;
  font-size: 0.8rem;
  color: #6b7280;
}
</style>
