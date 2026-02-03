<script setup>
defineProps({
  hasFocus: {
    type: Boolean,
    required: true
  },
  size: {
    type: String,
    default: 'sm', // xs, sm, md
    validator: (v) => ['xs', 'sm', 'md'].includes(v)
  }
})
</script>

<template>
  <div
    :class="['focus-indicator', size, { focused: hasFocus }]"
    role="status"
    :aria-label="hasFocus ? 'Focused' : 'Not focused'"
  >
    <div class="focus-icon">
      <span class="focus-symbol">◎</span>
    </div>
    <span v-if="size !== 'xs'" class="focus-label">{{ hasFocus ? 'Focused' : 'Unfocused' }}</span>
  </div>
</template>

<style scoped>
.focus-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #374151;
  transition: all 0.3s ease;
  width: 100%;
}

.focus-indicator.sm {
  padding: 2px 6px;
  gap: 4px;
}

.focus-indicator.xs {
  padding: 2px 4px;
  gap: 0;
  justify-content: center;
}

.focus-indicator.focused {
  background: linear-gradient(135deg, #f59e0b22, #d9770622);
  border: 1px solid #f59e0b55;
}

.focus-indicator:not(.focused) {
  background: #374151;
  border: 1px solid #4b5563;
  opacity: 0.7;
}

.focus-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.focus-symbol {
  font-size: 1rem;
  transition: all 0.3s ease;
}

.sm .focus-symbol {
  font-size: 0.85rem;
}

.xs .focus-symbol {
  font-size: 0.7rem;
}

.focused .focus-symbol {
  color: #f59e0b;
  text-shadow: 0 0 8px #f59e0b88;
  animation: focusPulse 2s ease-in-out infinite;
}

.focus-indicator:not(.focused) .focus-symbol {
  color: #6b7280;
}

.focus-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
}

.sm .focus-label {
  font-size: 0.6rem;
}

.focused .focus-label {
  color: #fbbf24;
}

@keyframes focusPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}
</style>
