<script setup>
import { computed } from 'vue'
import StarRating from './StarRating.vue'
import StatBar from './StatBar.vue'
import { getHeroTemplate } from '../data/heroTemplates.js'
import { getClass } from '../data/classes.js'

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
</script>

<template>
  <div
    :class="[
      'hero-card',
      rarityClass,
      { selected, active, compact }
    ]"
    @click="emit('click', hero)"
  >
    <div class="card-header">
      <span class="role-icon">{{ roleIcon }}</span>
      <span class="hero-level">Lv.{{ hero.level || 1 }}</span>
    </div>

    <div class="card-body">
      <div class="hero-name">{{ template?.name || 'Unknown' }}</div>
      <div class="hero-class">{{ heroClass?.title || 'Unknown' }}</div>
      <StarRating :rating="template?.rarity || 1" size="sm" />
    </div>

    <div v-if="showBars && hero.currentHp !== undefined" class="card-bars">
      <StatBar
        :current="hero.currentHp"
        :max="hero.maxHp"
        label="HP"
        color="green"
        size="sm"
      />
      <StatBar
        :current="hero.currentMp"
        :max="hero.maxMp"
        :label="heroClass?.resourceName || 'MP'"
        color="blue"
        size="sm"
      />
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

/* Rarity borders */
.rarity-1 { border-left: 3px solid #9ca3af; }
.rarity-2 { border-left: 3px solid #22c55e; }
.rarity-3 { border-left: 3px solid #3b82f6; }
.rarity-4 { border-left: 3px solid #a855f7; }
.rarity-5 { border-left: 3px solid #f59e0b; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.role-icon {
  font-size: 1.2rem;
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
</style>
