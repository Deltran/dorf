<script setup>
import { computed, ref, toRef } from 'vue'
import { Teleport } from 'vue'
import StatBar from './StatBar.vue'
import RageBar from './RageBar.vue'
import ValorBar from './ValorBar.vue'
import FocusIndicator from './FocusIndicator.vue'
import VerseIndicator from './VerseIndicator.vue'
import EssenceBar from './EssenceBar.vue'
import { getClass } from '../data/classes.js'
import { getHeroTemplate } from '../data/heroes/index.js'
import { useSwipeToDismiss } from '../composables/useSwipeToDismiss.js'

// Hero image loading (portrait preferred, fallback to regular image)
const heroPortraits = import.meta.glob('../assets/heroes/*_portrait.png', { eager: true, import: 'default' })
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })

function getHeroPortraitUrl(heroId) {
  if (!heroId) return null
  // Try portrait first
  const portraitPath = `../assets/heroes/${heroId}_portrait.png`
  if (heroPortraits[portraitPath]) return heroPortraits[portraitPath]
  // Fallback to GIF
  const gifPath = `../assets/heroes/${heroId}.gif`
  if (heroGifs[gifPath]) return heroGifs[gifPath]
  // Fallback to regular PNG
  const pngPath = `../assets/heroes/${heroId}.png`
  return heroImages[pngPath] || null
}

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

const drawerRef = ref(null)
useSwipeToDismiss({
  elementRef: drawerRef,
  isOpen: toRef(props, 'isOpen'),
  onClose: () => emit('close')
})

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

// Hero ID for image lookup
const heroId = computed(() => {
  return props.hero?.templateId || template.value?.id || null
})

// Hero portrait URL
const heroPortraitUrl = computed(() => {
  return getHeroPortraitUrl(heroId.value)
})

// Hero epithet (e.g., "The Dawn")
const epithet = computed(() => {
  return template.value?.epithet || null
})

// Get rarity from hero or template
const rarity = computed(() => {
  return props.hero?.rarity || template.value?.rarity || 1
})

// Rarity-based colors for the glow effect
const rarityGlowColor = computed(() => {
  switch (rarity.value) {
    case 5: return '#f59e0b' // Legendary - gold
    case 4: return '#a855f7' // Epic - purple
    case 3: return '#3b82f6' // Rare - blue
    case 2: return '#22c55e' // Uncommon - green
    default: return '#9ca3af' // Common - gray
  }
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

  // Add stack count for counter-stacked effects
  if (effect.stacks) {
    desc += ` x${effect.stacks}`
  }

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
    <!-- Backdrop - warm tint for allies -->
    <Transition name="fade">
      <div
        v-if="isOpen && hero"
        class="sheet-backdrop"
        @click="emit('close')"
      ></div>
    </Transition>

    <!-- Drawer -->
    <Transition name="slide-up">
      <div
        v-if="isOpen && hero"
        ref="drawerRef"
        class="sheet-drawer"
        :class="`rarity-${rarity}`"
        :style="{ '--rarity-glow': rarityGlowColor }"
      >
        <!-- Ally accent bar at top -->
        <div class="ally-accent"></div>

        <!-- Handle bar for closing -->
        <div class="sheet-handle" @click="emit('close')">
          <div class="handle-bar"></div>
        </div>

        <!-- Hero header with portrait -->
        <div class="sheet-header">
          <!-- Portrait -->
          <div v-if="heroPortraitUrl" class="hero-portrait-wrapper">
            <img
              :src="heroPortraitUrl"
              :alt="template?.name"
              class="hero-portrait"
            />
          </div>

          <div class="hero-info">
            <h2 class="hero-name">{{ template?.name || 'Unknown' }}</h2>
            <div v-if="epithet" class="hero-epithet">{{ epithet }}</div>
            <div class="hero-meta">
              <span class="hero-class">{{ heroClass?.title || 'Unknown' }}</span>
              <span class="hero-level">Lv.{{ hero.level || 1 }}</span>
            </div>
          </div>
        </div>

        <!-- HP Bar -->
        <div class="sheet-section section-hp">
          <StatBar
            :current="hero.currentHp || 0"
            :max="hero.maxHp || 1"
            label="HP"
            color="green"
            size="md"
          />
        </div>

        <!-- Resource Bar (class-specific) -->
        <div class="sheet-section section-resource">
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
  background: rgba(15, 12, 8, 0.65);
  z-index: 1000;
}

.sheet-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 60vh;
  /* Warm tinted background for ally feel */
  background: #1f2520;
  border-radius: 16px 16px 0 0;
  z-index: 1001;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 16px 24px;
  box-shadow:
    0 -4px 20px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 200, 100, 0.08);
}

/* Gold/amber accent bar at the very top - ally indicator */
.ally-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    #c9a227 20%,
    #e8c547 50%,
    #c9a227 80%,
    transparent 100%
  );
  border-radius: 16px 16px 0 0;
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
  background: #4a5244;
  border-radius: 2px;
}

.sheet-header {
  position: relative;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Hero portrait */
.hero-portrait-wrapper {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  background: #161a15;
  border: 2px solid var(--rarity-glow, #9ca3af);
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.4);
}

.hero-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.hero-info {
  text-align: left;
  flex: 1;
  min-width: 0;
}

.hero-name {
  font-size: 1.25rem;
  font-weight: 700;
  /* Warm off-white for ally names */
  color: #f5f0e6;
  margin: 0 0 2px;
}

.hero-epithet {
  font-size: 0.85rem;
  font-style: italic;
  color: var(--rarity-glow, #9ca3af);
  margin-bottom: 6px;
  opacity: 0.9;
}

.hero-meta {
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
  color: #a8a090;
}

.hero-class {
  color: #d4cfc0;
}

.hero-level {
  color: #7a7568;
  background: #2a2f28;
  padding: 2px 8px;
  border-radius: 4px;
}

.sheet-section {
  margin-bottom: 16px;
}

/* Tighter spacing between HP and resource */
.section-hp {
  margin-bottom: 8px;
}

.section-resource {
  margin-bottom: 20px;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  /* Warm-tinted dark background */
  background: #161a15;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(201, 162, 39, 0.08);
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
  color: #6b6960;
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f0ebe0;
}

.effects-section {
  background: #161a15;
  padding: 12px;
  border-radius: 8px;
  margin-top: 24px;
  border: 1px solid rgba(201, 162, 39, 0.08);
}

.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #9a958a;
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
  border-top: 1px solid #2d322a;
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
  color: #d4cfc0;
}

.no-effects {
  text-align: center;
  color: #6b6960;
  font-size: 0.85rem;
  padding: 16px;
  background: #161a15;
  border-radius: 8px;
  margin-top: 24px;
  border: 1px solid rgba(201, 162, 39, 0.08);
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
