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
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 6px;
  border-radius: 6px;
  background: #1f2937;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  border: 2px solid transparent;
  min-width: 60px;
  user-select: none;
}

.hero-battle-info.sm {
  padding: 6px 8px;
  gap: 3px;
  min-width: 80px;
}

.hero-battle-info:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.hero-battle-info.active {
  border-color: #fbbf24;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
}

.hero-battle-info.dead {
  filter: grayscale(60%) brightness(0.7);
  opacity: 0.5;
  border-color: #991b1b;
  box-shadow: inset 0 0 8px rgba(127, 29, 29, 0.4);
}

.hero-battle-info.dead:hover {
  transform: none;
  box-shadow: inset 0 0 8px rgba(127, 29, 29, 0.4);
}

/* Rarity left border accent */
.rarity-1 { border-left: 2px solid #9ca3af; }
.rarity-2 { border-left: 2px solid #22c55e; }
.rarity-3 { border-left: 2px solid #3b82f6; }
.rarity-4 { border-left: 2px solid #a855f7; }
.rarity-5 { border-left: 2px solid #f59e0b; }

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
