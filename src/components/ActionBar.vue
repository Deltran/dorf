<script setup>
import { computed } from 'vue'

const props = defineProps({
  heroName: {
    type: String,
    required: true
  },
  classColor: {
    type: String,
    default: '#3b82f6'
  },
  role: {
    type: String,
    default: 'dps'
  },
  hasSkills: {
    type: Boolean,
    default: true
  },
  isStunned: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-skills'])

const roleIcon = computed(() => {
  const icons = {
    tank: '🛡️',
    dps: '⚔️',
    healer: '💚',
    support: '✨'
  }
  return icons[props.role] || '⚔️'
})

function handleClick() {
  if (!props.isStunned && props.hasSkills) {
    emit('open-skills')
  }
}
</script>

<template>
  <div class="action-bar">
    <button
      :class="['hero-trigger', { stunned: isStunned, disabled: !hasSkills }]"
      :style="{ '--class-color': classColor }"
      :disabled="isStunned || !hasSkills"
      @click="handleClick"
    >
      <span class="role-icon">{{ roleIcon }}</span>
      <span class="hero-name">{{ heroName }}</span>
    </button>
    <span class="hint">tap to select skill</span>
  </div>
</template>

<style scoped>
.action-bar {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.hero-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #111827;
  border: none;
  border-left: 3px solid var(--class-color);
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s ease, border-color 0.1s ease;
  text-align: left;
}

.hero-trigger:hover:not(:disabled) {
  transform: translateX(4px);
}

.hero-trigger:active:not(:disabled) {
  transform: translateX(2px);
}

.hero-trigger.stunned .hero-name {
  text-decoration: line-through;
  color: #6b7280;
}

.hero-trigger.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.role-icon {
  font-size: 1.1rem;
}

.hero-name {
  letter-spacing: 0.02em;
}

.hint {
  font-size: 0.7rem;
  color: #6b7280;
  padding-left: 19px;
  text-transform: lowercase;
}
</style>
