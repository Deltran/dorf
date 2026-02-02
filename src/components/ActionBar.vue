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
  align-items: center;
  padding: 12px 14px;
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
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 0, 0, 0.6);
}

.skills-btn {
  padding: 12px 24px;
  background: linear-gradient(180deg, #4b5563 0%, #374151 100%);
  border: 1px solid #4b5563;
  border-left: 3px solid var(--class-color);
  border-radius: 0 4px 4px 0;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: all 0.12s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.skills-btn:hover:not(:disabled) {
  background: linear-gradient(180deg, #6b7280 0%, #4b5563 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.skills-btn:active:not(:disabled) {
  background: linear-gradient(180deg, #374151 0%, #1f2937 100%);
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.skills-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(30%);
}
</style>
