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
</script>

<template>
  <div class="action-bar" :style="{ '--class-color': classColor }">
    <div :class="['hero-card', { stunned: isStunned }]">
      <div class="hero-info">
        <span class="role-icon">{{ roleIcon }}</span>
        <span class="hero-name">{{ heroName }}</span>
      </div>
      <span class="hint">tap enemy to attack</span>
    </div>
    <button
      v-if="hasSkills"
      :class="['skills-btn', { disabled: isStunned }]"
      :disabled="isStunned"
      @click="emit('open-skills')"
    >
      Skills
    </button>
  </div>
</template>

<style scoped>
.action-bar {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.hero-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  background: #111827;
  border-left: 3px solid var(--class-color);
  border-top: 1px solid #374151;
  border-bottom: 1px solid #374151;
}

.hero-card.stunned .hero-name {
  text-decoration: line-through;
  color: #6b7280;
}

.hero-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-icon {
  font-size: 1rem;
}

.hero-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f3f4f6;
  letter-spacing: 0.02em;
}

.hint {
  font-size: 0.7rem;
  color: #6b7280;
}

.skills-btn {
  padding: 10px 20px;
  background: #374151;
  border: none;
  border-left: 2px solid var(--class-color);
  color: #f3f4f6;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.1s ease;
}

.skills-btn:hover:not(:disabled) {
  background: #4b5563;
}

.skills-btn:active:not(:disabled) {
  background: #1f2937;
}

.skills-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
