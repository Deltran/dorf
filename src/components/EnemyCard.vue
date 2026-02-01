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
  },
  hitEffect: {
    type: String,
    default: null // 'damage', 'heal', 'buff', 'debuff'
  }
})

const emit = defineEmits(['click'])

const template = computed(() => props.enemy.template)

// Get all skills (supports both 'skill' and 'skills')
const allSkills = computed(() => {
  if (template.value?.skills) return template.value.skills
  if (template.value?.skill) return [template.value.skill]
  return []
})

function getSkillCooldown(skill) {
  return props.enemy.currentCooldowns?.[skill.name] ?? 0
}

const isDead = computed(() => props.enemy.currentHp <= 0)

const statusEffects = computed(() => {
  return props.enemy.statusEffects || []
})
</script>

<template>
  <div
    :class="[
      'enemy-card',
      { selected, active, targetable, dead: isDead },
      hitEffect ? `hit-${hitEffect}` : ''
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

    <div v-if="statusEffects.length > 0" class="status-effects">
      <div
        v-for="(effect, index) in statusEffects"
        :key="index"
        class="effect-badge"
        :class="{ buff: effect.definition?.isBuff, debuff: !effect.definition?.isBuff }"
        :style="{ backgroundColor: effect.definition?.color + '33' }"
        :title="effect.duration > 99 ? effect.definition?.name : `${effect.definition?.name} (${effect.duration} turns)`"
      >
        <span class="effect-icon">{{ effect.definition?.icon }}</span>
        <span v-if="effect.duration <= 99" class="effect-duration">{{ effect.duration }}</span>
      </div>
    </div>

    <div v-if="allSkills.length > 0" class="skills-info">
      <div v-for="skill in allSkills" :key="skill.name" class="skill-info">
        <span class="skill-name">{{ skill.name }}</span>
        <span v-if="getSkillCooldown(skill) > 0" class="cooldown">
          {{ getSkillCooldown(skill) }}
        </span>
        <span v-else class="ready">Ready</span>
      </div>
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
  user-select: none;
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

.skills-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.status-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
  justify-content: center;
}

.effect-badge {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.effect-badge.buff {
  border: 1px solid rgba(34, 197, 94, 0.5);
}

.effect-badge.debuff {
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.effect-icon {
  font-size: 0.8rem;
}

.effect-duration {
  color: #d1d5db;
  font-size: 0.65rem;
  font-weight: 600;
}

/* Hit Effects */
.enemy-card.hit-damage {
  animation: hitDamage 0.3s ease-out;
}

.enemy-card.hit-heal {
  animation: hitHeal 0.4s ease-out;
}

.enemy-card.hit-buff {
  animation: hitBuff 0.4s ease-out;
}

.enemy-card.hit-debuff {
  animation: hitDebuff 0.3s ease-out;
}

@keyframes hitDamage {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(-4px); background-color: rgba(239, 68, 68, 0.3); }
  30% { transform: translateX(4px); }
  50% { transform: translateX(-3px); }
  70% { transform: translateX(2px); }
  90% { transform: translateX(-1px); }
}

@keyframes hitHeal {
  0% { box-shadow: inset 0 0 0 rgba(34, 197, 94, 0); }
  50% { box-shadow: inset 0 0 20px rgba(34, 197, 94, 0.4); }
  100% { box-shadow: inset 0 0 0 rgba(34, 197, 94, 0); }
}

@keyframes hitBuff {
  0% { box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
  50% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.6); }
  100% { box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
}

@keyframes hitDebuff {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(168, 85, 247, 0.3); }
}
</style>
