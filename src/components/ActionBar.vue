<script setup>
defineProps({
  heroName: {
    type: String,
    required: true
  },
  hasSkills: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['open-skills'])
</script>

<template>
  <div class="action-bar">
    <div class="turn-indicator">
      <span class="hero-name">{{ heroName }}'s turn</span>
      <span class="hint">Tap enemy to attack</span>
    </div>
    <button
      v-if="hasSkills"
      class="skills-btn"
      @click="emit('open-skills')"
    >
      Skills
    </button>
  </div>
</template>

<style scoped>
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #1f2937;
  border-radius: 12px;
}

.turn-indicator {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-name {
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.95rem;
}

.hint {
  font-size: 0.75rem;
  color: #6b7280;
}

.skills-btn {
  padding: 10px 20px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.skills-btn:hover {
  background: #2563eb;
}

.skills-btn:active {
  transform: scale(0.98);
}
</style>
