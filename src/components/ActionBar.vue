<script setup>
import { computed } from 'vue'
import overlayImage from '../assets/action_backgrounds/action_bar_overlay_1.png'

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
  },
  backgroundImage: {
    type: String,
    default: null
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

const heroCardStyle = computed(() => {
  const style = { '--class-color': props.classColor }
  if (props.backgroundImage) {
    // Layer overlay on top of class background
    style.backgroundImage = `url(${overlayImage}), url(${props.backgroundImage})`
  }
  return style
})
</script>

<template>
  <div class="action-bar" :style="{ '--class-color': classColor }">
    <div :class="['hero-card', { stunned: isStunned }]" :style="heroCardStyle">
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
  background-color: #111827;
  background-size: cover, cover;
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
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
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5);
}

.hero-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f3f4f6;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5);
}

.hint {
  font-size: 0.7rem;
  color: #9ca3af;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5);
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
