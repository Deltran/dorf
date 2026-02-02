<script setup>
import { computed } from 'vue'
import StatBar from './StatBar.vue'
import FocusIndicator from './FocusIndicator.vue'
import ValorBar from './ValorBar.vue'
import RageBar from './RageBar.vue'
import VerseIndicator from './VerseIndicator.vue'
import EssenceBar from './EssenceBar.vue'
import { getHeroTemplate } from '../data/heroes/index.js'
import { getClass } from '../data/classes.js'

const props = defineProps({
  hero: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  hitEffect: {
    type: String,
    default: null // 'damage', 'heal', 'buff', 'debuff'
  },
  size: {
    type: String,
    default: 'xs',
    validator: (v) => ['xs', 'sm'].includes(v)
  }
})

const emit = defineEmits(['click'])

const template = computed(() => {
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

const isBardHero = computed(() => {
  return heroClass.value?.resourceType === 'verse'
})

const isAlchemistHero = computed(() => {
  return heroClass.value?.resourceType === 'essence'
})

const isDead = computed(() => {
  return props.hero.currentHp !== undefined && props.hero.currentHp <= 0
})

const rarityClass = computed(() => {
  const rarity = template.value?.rarity || 1
  return `rarity-${rarity}`
})
</script>

<template>
  <div
    :class="[
      'hero-battle-info',
      rarityClass,
      size,
      { active, dead: isDead },
      hitEffect ? `hit-${hitEffect}` : ''
    ]"
    @click="emit('click', hero)"
  >
    <!-- HP Bar -->
    <StatBar
      v-if="hero.currentHp !== undefined"
      :current="hero.currentHp"
      :max="hero.maxHp"
      color="green"
      :size="size"
      :showLabel="false"
      :showNumbers="false"
    />

    <!-- Resource Bar based on class -->
    <FocusIndicator
      v-if="isRangerHero"
      :hasFocus="hero.hasFocus"
      :size="size"
    />
    <ValorBar
      v-else-if="isKnightHero"
      :currentValor="hero.currentValor || 0"
      :size="size"
    />
    <RageBar
      v-else-if="isBerserkerHero"
      :currentRage="hero.currentRage || 0"
      :size="size"
    />
    <VerseIndicator
      v-else-if="isBardHero"
      :currentVerses="hero.currentVerses || 0"
      :size="size"
    />
    <EssenceBar
      v-else-if="isAlchemistHero"
      :currentEssence="hero.currentEssence || 0"
      :maxEssence="hero.maxEssence || 60"
      :size="size"
    />
    <!-- MP bar for standard classes -->
    <StatBar
      v-else
      :current="hero.currentMp"
      :max="hero.maxMp"
      color="blue"
      :size="size"
      :showLabel="false"
      :showNumbers="false"
    />
  </div>
</template>

<style scoped>
.hero-battle-info {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 8px;
  border-radius: 4px;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  border: 1px solid #374151;
  min-width: 64px;
  user-select: none;
}

/* Noise texture for Dorf grittiness */
.hero-battle-info::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
  border-radius: inherit;
}

.hero-battle-info.sm {
  padding: 6px 10px;
  gap: 3px;
  min-width: 80px;
}

.hero-battle-info:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
}

/* Active hero - much bolder treatment */
.hero-battle-info.active {
  border-color: #fbbf24;
  box-shadow:
    0 0 12px rgba(251, 191, 36, 0.5),
    inset 0 1px 0 rgba(251, 191, 36, 0.15);
  transform: scale(1.05);
  z-index: 10;
}

.hero-battle-info.dead {
  filter: grayscale(60%) brightness(0.6);
  opacity: 0.4;
  border-color: #7f1d1d;
  box-shadow: inset 0 0 10px rgba(127, 29, 29, 0.5);
}

.hero-battle-info.dead:hover {
  transform: none;
  box-shadow: inset 0 0 10px rgba(127, 29, 29, 0.5);
}

/* Rarity left border accent - thicker, more visible */
.rarity-1 {
  border-left: 3px solid #6b7280;
}
.rarity-2 {
  border-left: 3px solid #22c55e;
}
.rarity-3 {
  border-left: 3px solid #3b82f6;
}
.rarity-4 {
  border-left: 3px solid #a855f7;
  box-shadow: inset 0 0 8px rgba(168, 85, 247, 0.1);
}
.rarity-5 {
  border-left: 3px solid #f59e0b;
  box-shadow: inset 0 0 10px rgba(245, 158, 11, 0.15);
}

/* Override box-shadow when active (rarity glow + active glow) */
.rarity-4.active {
  box-shadow:
    0 0 12px rgba(251, 191, 36, 0.5),
    inset 0 0 8px rgba(168, 85, 247, 0.15),
    inset 0 1px 0 rgba(251, 191, 36, 0.15);
}
.rarity-5.active {
  box-shadow:
    0 0 14px rgba(251, 191, 36, 0.6),
    inset 0 0 10px rgba(245, 158, 11, 0.2),
    inset 0 1px 0 rgba(251, 191, 36, 0.2);
}

/* Hit Effects - same as HeroCard */
.hero-battle-info.hit-damage {
  animation: hitDamage 0.3s ease-out;
}

.hero-battle-info.hit-heal {
  animation: hitHeal 0.4s ease-out;
}

.hero-battle-info.hit-buff {
  animation: hitBuff 0.4s ease-out;
}

.hero-battle-info.hit-debuff {
  animation: hitDebuff 0.3s ease-out;
}

@keyframes hitDamage {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(-3px); background-color: rgba(239, 68, 68, 0.3); }
  30% { transform: translateX(3px); }
  50% { transform: translateX(-2px); }
  70% { transform: translateX(1px); }
  90% { transform: translateX(-1px); }
}

@keyframes hitHeal {
  0% { box-shadow: inset 0 0 0 rgba(34, 197, 94, 0); }
  50% { box-shadow: inset 0 0 15px rgba(34, 197, 94, 0.4); }
  100% { box-shadow: inset 0 0 0 rgba(34, 197, 94, 0); }
}

@keyframes hitBuff {
  0% { box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
  50% { box-shadow: 0 0 10px rgba(251, 191, 36, 0.6); }
  100% { box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
}

@keyframes hitDebuff {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(168, 85, 247, 0.3); }
}
</style>
