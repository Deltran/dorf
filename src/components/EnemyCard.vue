<script setup>
import { computed } from 'vue'
import StatBar from './StatBar.vue'

const props = defineProps({
  enemy: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: false
  },
  targetable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const template = computed(() => props.enemy.template)

const skillCooldown = computed(() => {
  if (!template.value?.skill) return null
  const skillName = template.value.skill.name
  return props.enemy.currentCooldowns?.[skillName] ?? 0
})

const isDead = computed(() => props.enemy.currentHp <= 0)
</script>

<template>
  <div
    :class="[
      'enemy-card',
      { selected, active, targetable, dead: isDead }
    ]"
    @click="!isDead && emit('click', enemy)"
  >
    <div class="card-header">
      <span class="enemy-name">{{ template?.name || 'Unknown' }}</span>
    </div>

    <div class="card-body">
      <StatBar
        :current="enemy.currentHp"
        :max="enemy.maxHp"
        color="red"
        size="md"
      />
    </div>

    <div v-if="template?.skill" class="skill-info">
      <span class="skill-name">{{ template.skill.name }}</span>
      <span v-if="skillCooldown > 0" class="cooldown">
        {{ skillCooldown }} turns
      </span>
      <span v-else class="ready">Ready!</span>
    </div>
  </div>
</template>

<style scoped>
.enemy-card {
  background: #1f2937;
  border-radius: 8px;
  padding: 12px;
  border: 2px solid #4b5563;
  min-width: 120px;
  transition: all 0.2s ease;
}

.enemy-card.targetable {
  cursor: pointer;
}

.enemy-card.targetable:hover {
  border-color: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

.enemy-card.selected {
  border-color: #ef4444;
}

.enemy-card.active {
  border-color: #fbbf24;
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.4);
}

.enemy-card.dead {
  opacity: 0.4;
  cursor: not-allowed;
}

.card-header {
  margin-bottom: 8px;
}

.enemy-name {
  font-weight: 600;
  color: #f87171;
  font-size: 0.9rem;
}

.card-body {
  margin-bottom: 8px;
}

.skill-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  color: #9ca3af;
  background: #374151;
  padding: 4px 8px;
  border-radius: 4px;
}

.skill-name {
  color: #d1d5db;
}

.cooldown {
  color: #6b7280;
}

.ready {
  color: #f87171;
  font-weight: 600;
}
</style>
