<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  cost: {
    type: [Number, String],
    default: null
  },
  costLabel: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'default' // default, primary, danger
  }
})

const emit = defineEmits(['click'])
</script>

<template>
  <button
    :class="['action-button', variant, { selected, disabled }]"
    :disabled="disabled"
    @click="emit('click')"
  >
    <div class="button-content">
      <span class="button-label">{{ label }}</span>
      <span v-if="description" class="button-desc">{{ description }}</span>
    </div>
    <span v-if="cost !== null" class="button-cost">
      {{ cost }} {{ costLabel }}
    </span>
  </button>
</template>

<style scoped>
.action-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid #4b5563;
  border-radius: 8px;
  background: #1f2937;
  color: #f3f4f6;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  user-select: none;
}

.action-button:hover:not(.disabled) {
  border-color: #6b7280;
  background: #374151;
}

.action-button.selected {
  border-color: #3b82f6;
  background: #1e3a5f;
}

.action-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.primary {
  border-color: #3b82f6;
}

.action-button.primary:hover:not(.disabled) {
  border-color: #60a5fa;
  background: #1e3a5f;
}

.action-button.danger {
  border-color: #ef4444;
}

.action-button.danger:hover:not(.disabled) {
  border-color: #f87171;
  background: #450a0a;
}

.button-content {
  display: flex;
  flex-direction: column;
}

.button-label {
  font-weight: 600;
  font-size: 0.95rem;
}

.button-desc {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 2px;
}

.button-cost {
  font-size: 0.8rem;
  color: #60a5fa;
  background: #1e3a5f;
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
