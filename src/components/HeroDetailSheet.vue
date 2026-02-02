<script setup>
import { computed } from 'vue'
import { Teleport } from 'vue'
import StatBar from './StatBar.vue'
import RageBar from './RageBar.vue'
import ValorBar from './ValorBar.vue'
import FocusIndicator from './FocusIndicator.vue'
import VerseIndicator from './VerseIndicator.vue'
import EssenceBar from './EssenceBar.vue'
import { getClass } from '../data/classes.js'
import { getHeroTemplate } from '../data/heroes/index.js'

const props = defineProps({
  hero: {
    type: Object,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const template = computed(() => {
  if (!props.hero) return null
  if (props.hero.template) return props.hero.template
  return getHeroTemplate(props.hero.templateId)
})

const heroClass = computed(() => {
  if (!props.hero) return null
  if (props.hero.class) return props.hero.class
  return getClass(template.value?.classId)
})

const isRangerHero = computed(() => heroClass.value?.resourceType === 'focus')
const isKnightHero = computed(() => heroClass.value?.resourceType === 'valor')
const isBerserkerHero = computed(() => heroClass.value?.resourceType === 'rage')
const isBardHero = computed(() => heroClass.value?.resourceType === 'verse')
const isAlchemistHero = computed(() => heroClass.value?.resourceType === 'essence')

const statusEffects = computed(() => props.hero?.statusEffects || [])

const buffs = computed(() => statusEffects.value.filter(e => e.definition?.isBuff))
const debuffs = computed(() => statusEffects.value.filter(e => !e.definition?.isBuff))

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

  // Add redirect percentage for guardian link
  if (effect.redirectPercent !== undefined) {
    desc += ` (${effect.redirectPercent}% redirect)`
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
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="isOpen && hero"
        class="sheet-backdrop"
        @click="emit('close')"
      ></div>
    </Transition>

    <!-- Drawer -->
    <Transition name="slide-up">
      <div v-if="isOpen && hero" class="sheet-drawer">
        <!-- Handle bar for closing -->
        <div class="sheet-handle" @click="emit('close')">
          <div class="handle-bar"></div>
        </div>

        <!-- Hero header -->
        <div class="sheet-header">
          <div class="hero-info">
            <h2 class="hero-name">{{ template?.name || 'Unknown' }}</h2>
            <div class="hero-meta">
              <span class="hero-class">{{ heroClass?.title || 'Unknown' }}</span>
              <span class="hero-level">Lv.{{ hero.level || 1 }}</span>
            </div>
          </div>
        </div>

        <!-- HP Bar -->
        <div class="sheet-section">
          <StatBar
            :current="hero.currentHp || 0"
            :max="hero.maxHp || 1"
            label="HP"
            color="green"
            size="md"
          />
        </div>

        <!-- Resource Bar (class-specific) -->
        <div class="sheet-section">
          <FocusIndicator
            v-if="isRangerHero"
            :hasFocus="hero.hasFocus"
            size="md"
          />
          <ValorBar
            v-else-if="isKnightHero"
            :currentValor="hero.currentValor || 0"
            size="md"
          />
          <RageBar
            v-else-if="isBerserkerHero"
            :currentRage="hero.currentRage || 0"
            size="md"
          />
          <VerseIndicator
            v-else-if="isBardHero"
            :currentVerses="hero.currentVerses || 0"
            size="md"
          />
          <EssenceBar
            v-else-if="isAlchemistHero"
            :currentEssence="hero.currentEssence || 0"
            :maxEssence="hero.maxEssence || 60"
            size="md"
          />
          <StatBar
            v-else
            :current="hero.currentMp || 0"
            :max="hero.maxMp || 1"
            :label="heroClass?.resourceName || 'MP'"
            color="blue"
            size="md"
          />
        </div>

        <!-- Stats -->
        <div class="sheet-section stats-section">
          <div class="stat-item">
            <span class="stat-label">ATK</span>
            <span class="stat-value">{{ hero.stats?.atk || hero.atk || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">DEF</span>
            <span class="stat-value">{{ hero.stats?.def || hero.def || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">SPD</span>
            <span class="stat-value">{{ hero.stats?.spd || hero.spd || 0 }}</span>
          </div>
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

        <div v-else class="sheet-section no-effects">
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
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
}

.sheet-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 60vh;
  background: #1f2937;
  border-radius: 16px 16px 0 0;
  z-index: 1001;
  overflow-y: auto;
  padding: 0 16px 24px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
}

.sheet-handle {
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;
  cursor: pointer;
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: #4b5563;
  border-radius: 2px;
}

.sheet-header {
  margin-bottom: 16px;
}

.hero-info {
  text-align: center;
}

.hero-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0 0 4px;
}

.hero-meta {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-size: 0.85rem;
  color: #9ca3af;
}

.hero-class {
  color: #d1d5db;
}

.hero-level {
  color: #6b7280;
  background: #374151;
  padding: 2px 8px;
  border-radius: 4px;
}

.sheet-section {
  margin-bottom: 16px;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  background: #111827;
  padding: 12px;
  border-radius: 8px;
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
  color: #6b7280;
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
}

.effects-section {
  background: #111827;
  padding: 12px;
  border-radius: 8px;
}

.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #9ca3af;
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.effects-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.effects-group + .effects-group {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #374151;
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
  color: #d1d5db;
}

.no-effects {
  text-align: center;
  color: #6b7280;
  font-size: 0.85rem;
  padding: 16px;
  background: #111827;
  border-radius: 8px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
