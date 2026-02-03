<script setup>
import { computed, ref, toRef } from 'vue'
import { Teleport } from 'vue'
import StatBar from './StatBar.vue'
import { useSwipeToDismiss } from '../composables/useSwipeToDismiss.js'

const props = defineProps({
  enemy: {
    type: Object,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: false
  },
  isKnown: {
    type: Boolean,
    default: false
  },
  inCombat: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const drawerRef = ref(null)
useSwipeToDismiss({
  elementRef: drawerRef,
  isOpen: toRef(props, 'isOpen'),
  onClose: () => emit('close')
})

const template = computed(() => props.enemy?.template)

// Get all skills (supports both 'skill' and 'skills')
const allSkills = computed(() => {
  if (template.value?.skills) return template.value.skills
  if (template.value?.skill) return [template.value.skill]
  return []
})

const statusEffects = computed(() => props.enemy?.statusEffects || [])
const buffs = computed(() => statusEffects.value.filter(e => e.definition?.isBuff))
const debuffs = computed(() => statusEffects.value.filter(e => !e.definition?.isBuff))

// Stats - show raw numbers if known, ??? otherwise
const atkValue = computed(() => {
  if (!props.isKnown) return '???'
  return template.value?.stats?.atk || 0
})

const defValue = computed(() => {
  if (!props.isKnown) return '???'
  return template.value?.stats?.def || 0
})

const spdValue = computed(() => {
  if (!props.isKnown) return '???'
  return template.value?.stats?.spd || 0
})

// Format effect description with value and duration
function getEffectDescription(effect) {
  const def = effect.definition
  if (!def) return 'Unknown effect'

  let desc = def.name

  // Add value info for stat modifiers
  if (effect.value && (def.stat || def.isDot || def.isHot)) {
    desc += ` (${effect.value > 0 ? '+' : ''}${effect.value}%)`
  }

  // Add shield HP for shields
  if (effect.shieldHp !== undefined) {
    desc += ` (${effect.shieldHp} HP)`
  }

  // Add damage reduction percentage
  if (effect.damageReduction !== undefined) {
    desc += ` (-${effect.damageReduction}% dmg)`
  }

  // Add duration
  if (effect.duration <= 99) {
    desc += ` - ${effect.duration} turn${effect.duration !== 1 ? 's' : ''}`
  }

  return desc
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop - cool/hostile tint -->
    <Transition name="fade">
      <div
        v-if="isOpen && enemy"
        class="sheet-backdrop"
        @click="emit('close')"
      ></div>
    </Transition>

    <!-- Drawer -->
    <Transition name="slide-up">
      <div v-if="isOpen && enemy" ref="drawerRef" class="sheet-drawer">
        <!-- Danger accent bar at top - sharp red threat indicator -->
        <div class="danger-accent"></div>

        <!-- Diagonal hatching texture overlay -->
        <div class="danger-texture"></div>

        <!-- Handle bar for closing -->
        <div class="sheet-handle" @click="emit('close')">
          <div class="handle-bar"></div>
        </div>

        <!-- Enemy header -->
        <div class="sheet-header">
          <div class="enemy-info">
            <h2 class="enemy-name">{{ template?.name || 'Unknown' }}</h2>
          </div>
        </div>

        <!-- HP Bar with numbers -->
        <div class="sheet-section section-hp">
          <div class="hp-display">
            <StatBar
              :current="enemy.currentHp || 0"
              :max="enemy.maxHp || 1"
              label="HP"
              color="red"
              size="md"
            />
            <div class="hp-numbers">
              {{ enemy.currentHp || 0 }} / {{ enemy.maxHp || 0 }}
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="sheet-section stats-section">
          <div class="stat-item">
            <span class="stat-label">ATK</span>
            <span class="stat-value" :class="{ 'stat-unknown': !isKnown }">{{ atkValue }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">DEF</span>
            <span class="stat-value" :class="{ 'stat-unknown': !isKnown }">{{ defValue }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">SPD</span>
            <span class="stat-value" :class="{ 'stat-unknown': !isKnown }">{{ spdValue }}</span>
          </div>
        </div>

        <!-- Skills - threatening presentation -->
        <div class="sheet-section skills-section">
          <h3 class="section-title">Abilities</h3>
          <template v-if="isKnown">
            <div v-if="allSkills.length > 0" class="skills-list">
              <div v-for="skill in allSkills" :key="skill.name" class="skill-item">
                <div class="skill-name">{{ skill.name }}</div>
                <div class="skill-description">{{ skill.description }}</div>
              </div>
            </div>
            <div v-else class="no-skills">Basic attacks only</div>
          </template>
          <div v-else class="unknown-skills">???</div>
        </div>

        <!-- Status Effects -->
        <div v-if="statusEffects.length > 0" class="sheet-section effects-section">
          <h3 class="section-title">Status Effects</h3>

          <!-- Buffs -->
          <div v-if="buffs.length > 0" class="effects-group">
            <div
              v-for="(effect, index) in buffs"
              :key="'buff-' + index"
              class="effect-row buff"
            >
              <span class="effect-icon" :style="{ color: effect.definition?.color }">
                {{ effect.definition?.icon }}
              </span>
              <span class="effect-text">{{ getEffectDescription(effect) }}</span>
            </div>
          </div>

          <!-- Debuffs -->
          <div v-if="debuffs.length > 0" class="effects-group">
            <div
              v-for="(effect, index) in debuffs"
              :key="'debuff-' + index"
              class="effect-row debuff"
            >
              <span class="effect-icon" :style="{ color: effect.definition?.color }">
                {{ effect.definition?.icon }}
              </span>
              <span class="effect-text">{{ getEffectDescription(effect) }}</span>
            </div>
          </div>
        </div>

        <div v-else-if="inCombat" class="sheet-section no-effects">
          No active status effects
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* Slightly red-tinted backdrop for threat */
  background: rgba(20, 8, 8, 0.7);
  z-index: 1000;
}

.sheet-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 60vh;
  /* Cool, desaturated hostile background */
  background: #1a1a1f;
  /* Sharper corners - more aggressive feel */
  border-radius: 8px 8px 0 0;
  z-index: 1001;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 16px 24px;
  box-shadow:
    0 -4px 24px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(200, 50, 50, 0.1);
}

/* Sharp red danger accent at top */
.danger-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    #8b1a1a 0%,
    #dc2626 30%,
    #ef4444 50%,
    #dc2626 70%,
    #8b1a1a 100%
  );
  border-radius: 8px 8px 0 0;
}

/* Subtle diagonal hatching texture - danger pattern */
.danger-texture {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
  opacity: 0.02;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 8px,
    #ff0000 8px,
    #ff0000 9px
  );
}

.sheet-handle {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;
  cursor: pointer;
}

.handle-bar {
  width: 40px;
  height: 4px;
  /* Slightly red-tinted gray */
  background: #4a4548;
  border-radius: 2px;
}

.sheet-header {
  margin-bottom: 16px;
}

.enemy-info {
  text-align: center;
}

.enemy-name {
  font-size: 1.25rem;
  font-weight: 700;
  /* Hostile red for enemy names */
  color: #f87171;
  margin: 0;
  text-shadow: 0 0 20px rgba(248, 113, 113, 0.2);
}

.sheet-section {
  margin-bottom: 16px;
}

.section-hp {
  margin-bottom: 20px;
}

.hp-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hp-numbers {
  text-align: center;
  font-size: 0.85rem;
  color: #b0a8a8;
  font-weight: 600;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  /* Cold dark background */
  background: #121215;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(200, 50, 50, 0.08);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #5a5560;
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #e8e0e0;
}

.stat-unknown {
  color: #5a5560;
}

/* Skills section - threatening presentation */
.skills-section {
  /* Darker, more ominous background */
  background: #0d0d10;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(220, 38, 38, 0.12);
}

.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #8a8085;
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skill-item {
  padding: 10px;
  /* Red-tinted background for threat */
  background: rgba(220, 38, 38, 0.08);
  border-radius: 6px;
  /* Full left border - more aggressive */
  border-left: 3px solid #dc2626;
}

.skill-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f0e8e8;
  margin-bottom: 4px;
}

.skill-description {
  font-size: 0.8rem;
  /* Slightly desaturated for hostility */
  color: #a09898;
  line-height: 1.4;
}

.no-skills,
.unknown-skills {
  text-align: center;
  color: #5a5560;
  font-size: 0.85rem;
  padding: 8px;
}

.unknown-skills {
  font-size: 1.1rem;
  font-weight: 600;
}

.effects-section {
  background: #121215;
  padding: 12px;
  border-radius: 6px;
  margin-top: 20px;
  border: 1px solid rgba(200, 50, 50, 0.08);
}

.effects-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.effects-group + .effects-group {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #2a282d;
}

.effect-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
}

.effect-row.buff {
  background: rgba(34, 197, 94, 0.1);
  border-left: 2px solid #22c55e;
}

.effect-row.debuff {
  background: rgba(239, 68, 68, 0.1);
  border-left: 2px solid #ef4444;
}

.effect-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.effect-text {
  font-size: 0.8rem;
  color: #c0b8b8;
}

.no-effects {
  text-align: center;
  color: #5a5560;
  font-size: 0.85rem;
  padding: 16px;
  background: #121215;
  border-radius: 6px;
  border: 1px solid rgba(200, 50, 50, 0.08);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
