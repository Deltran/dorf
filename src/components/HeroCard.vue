<script setup>
import { computed } from 'vue'
import StarRating from './StarRating.vue'
import StatBar from './StatBar.vue'
import FocusIndicator from './FocusIndicator.vue'
import ValorBar from './ValorBar.vue'
import RageBar from './RageBar.vue'
import { getHeroTemplate } from '../data/heroTemplates.js'
import { getClass } from '../data/classes.js'

// Import all hero images
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })

function getHeroImageUrl(heroId) {
  const path = `../assets/heroes/${heroId}.png`
  return heroImages[path] || null
}

const props = defineProps({
  hero: {
    type: Object,
    required: true
    // Can be hero instance or battle hero object
  },
  showStats: {
    type: Boolean,
    default: false
  },
  showBars: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  },
  hitEffect: {
    type: String,
    default: null // 'damage', 'heal', 'buff', 'debuff'
  }
})

const emit = defineEmits(['click'])

const template = computed(() => {
  // Support both hero instances and battle hero objects
  if (props.hero.template) return props.hero.template
  return getHeroTemplate(props.hero.templateId)
})

const heroClass = computed(() => {
  if (props.hero.class) return props.hero.class
  return getClass(template.value?.classId)
})

const isRangerHero = computed(() => {
  return heroClass.value?.resourceType === 'focus'
})

const isKnightHero = computed(() => {
  return heroClass.value?.resourceType === 'valor'
})

const isBerserkerHero = computed(() => {
  return heroClass.value?.resourceType === 'rage'
})

const isDead = computed(() => {
  return props.showBars && props.hero.currentHp !== undefined && props.hero.currentHp <= 0
})

const rarityClass = computed(() => {
  const rarity = template.value?.rarity || 1
  return `rarity-${rarity}`
})

const roleIcon = computed(() => {
  const icons = {
    tank: '🛡️',
    dps: '⚔️',
    healer: '💚',
    support: '✨'
  }
  return icons[heroClass.value?.role] || '❓'
})

const statusEffects = computed(() => {
  return props.hero.statusEffects || []
})

const levelDisplay = computed(() => {
  const level = props.hero.level || 1
  return level >= 250 ? 'Master' : `Lv.${level}`
})

// Star level (can be upgraded through merging)
const starLevel = computed(() => {
  return props.hero.starLevel || template.value?.rarity || 1
})

// Base rarity from template (origin)
const baseRarity = computed(() => {
  return template.value?.rarity || 1
})

// Has been merged if star level exceeds base rarity
const isMerged = computed(() => {
  return starLevel.value > baseRarity.value
})

const rarityNames = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Epic',
  5: 'Legendary'
}
</script>

<template>
  <div
    :class="[
      'hero-card',
      rarityClass,
      { selected, active, compact, dead: isDead },
      hitEffect ? `hit-${hitEffect}` : ''
    ]"
    @click="emit('click', hero)"
  >
    <div class="card-header">
      <span class="role-icon">{{ roleIcon }}</span>
      <img
        v-if="!showBars && getHeroImageUrl(template?.id)"
        :src="getHeroImageUrl(template?.id)"
        :alt="template?.name"
        class="card-hero-image"
      />
      <span class="hero-level">{{ levelDisplay }}</span>
    </div>

    <div class="card-body">
      <div class="hero-name">{{ template?.name || 'Unknown' }}</div>
      <div class="hero-class">{{ heroClass?.title || 'Unknown' }}</div>
      <StarRating :rating="starLevel" size="sm" />
      <div v-if="isMerged" class="origin-badge">
        {{ rarityNames[baseRarity] }} origin
      </div>
    </div>

    <div v-if="showBars && hero.currentHp !== undefined" class="card-bars">
      <StatBar
        :current="hero.currentHp"
        :max="hero.maxHp"
        label="HP"
        color="green"
        size="sm"
      />
      <!-- Focus indicator for Rangers -->
      <FocusIndicator
        v-if="isRangerHero"
        :hasFocus="hero.hasFocus"
        size="sm"
      />
      <!-- Valor bar for Knights -->
      <ValorBar
        v-else-if="isKnightHero"
        :currentValor="hero.currentValor || 0"
        size="sm"
      />
      <!-- Rage bar for Berserkers -->
      <RageBar
        v-else-if="isBerserkerHero"
        :currentRage="hero.currentRage || 0"
        size="sm"
      />
      <!-- MP bar for others -->
      <StatBar
        v-else
        :current="hero.currentMp"
        :max="hero.maxMp"
        :label="heroClass?.resourceName || 'MP'"
        color="blue"
        size="sm"
      />
    </div>

    <div v-if="statusEffects.length > 0" class="status-effects">
      <div
        v-for="(effect, index) in statusEffects"
        :key="index"
        class="effect-badge"
        :class="{ buff: effect.definition?.isBuff, debuff: !effect.definition?.isBuff }"
        :style="{ backgroundColor: effect.definition?.color + '33' }"
        :title="`${effect.definition?.name} (${effect.duration} turns)`"
      >
        <span class="effect-icon">{{ effect.definition?.icon }}</span>
        <span class="effect-duration">{{ effect.duration }}</span>
      </div>
    </div>

    <div v-if="showStats && hero.stats" class="card-stats">
      <div class="stat"><span>ATK</span> {{ hero.stats.atk }}</div>
      <div class="stat"><span>DEF</span> {{ hero.stats.def }}</div>
      <div class="stat"><span>SPD</span> {{ hero.stats.spd }}</div>
    </div>
  </div>
</template>

<style scoped>
.hero-card {
  background: #1f2937;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  min-width: 120px;
  user-select: none;
}

.hero-card.compact {
  padding: 8px;
  min-width: 100px;
}

.hero-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.hero-card.selected {
  border-color: #3b82f6;
}

.hero-card.active {
  border-color: #fbbf24;
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.4);
}

.hero-card.dead {
  filter: grayscale(100%);
  opacity: 0.6;
}

.hero-card.dead:hover {
  transform: none;
  box-shadow: none;
}

/* Rarity borders and backgrounds */
.rarity-1 { border-left: 3px solid #9ca3af; background: linear-gradient(135deg, #1f2937 0%, #262d36 100%); }
.rarity-2 { border-left: 3px solid #22c55e; background: linear-gradient(135deg, #1f2937 0%, #1f3329 100%); }
.rarity-3 { border-left: 3px solid #3b82f6; background: linear-gradient(135deg, #1f2937 0%, #1f2a3d 100%); }
.rarity-4 { border-left: 3px solid #a855f7; background: linear-gradient(135deg, #1f2937 0%, #2a2340 100%); }
.rarity-5 { border-left: 3px solid #f59e0b; background: linear-gradient(135deg, #1f2937 0%, #302a1f 100%); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.role-icon {
  font-size: 1.2rem;
}

.card-hero-image {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #374151;
}

.hero-level {
  font-size: 0.75rem;
  color: #9ca3af;
  background: #374151;
  padding: 2px 6px;
  border-radius: 4px;
}

.card-body {
  text-align: center;
}

.hero-name {
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.compact .hero-name {
  font-size: 0.8rem;
}

.hero-class {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 4px;
}

.origin-badge {
  font-size: 0.65rem;
  color: #9ca3af;
  opacity: 0.7;
  font-style: italic;
  margin-top: 2px;
}

.card-bars {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-stats {
  margin-top: 10px;
  display: flex;
  justify-content: space-around;
  font-size: 0.7rem;
}

.stat {
  text-align: center;
  color: #d1d5db;
}

.stat span {
  display: block;
  color: #6b7280;
  font-size: 0.6rem;
}

.status-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
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
.hero-card.hit-damage {
  animation: hitDamage 0.3s ease-out;
}

.hero-card.hit-heal {
  animation: hitHeal 0.4s ease-out;
}

.hero-card.hit-buff {
  animation: hitBuff 0.4s ease-out;
}

.hero-card.hit-debuff {
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
