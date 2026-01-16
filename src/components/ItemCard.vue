<script setup>
import { computed } from 'vue'
import StarRating from './StarRating.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  showCount: {
    type: Boolean,
    default: true
  },
  selected: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const rarityClass = computed(() => `rarity-${props.item.rarity || 1}`)

const typeIcon = computed(() => {
  switch (props.item.type) {
    case 'xp': return '📖'
    case 'junk': return '🪨'
    case 'material': return '💎'
    default: return '📦'
  }
})
</script>

<template>
  <div
    :class="['item-card', rarityClass, { selected, compact }]"
    @click="emit('click', item)"
  >
    <div class="card-header">
      <span class="type-icon">{{ typeIcon }}</span>
      <span v-if="showCount && item.count" class="item-count">×{{ item.count }}</span>
    </div>

    <div class="card-body">
      <div class="item-name">{{ item.name }}</div>
      <StarRating :rating="item.rarity || 1" size="sm" />
    </div>

    <div v-if="!compact" class="card-footer">
      <div v-if="item.type === 'xp'" class="item-value xp">
        +{{ item.xpValue }} XP
      </div>
      <div v-else-if="item.sellReward?.gems" class="item-value sell">
        {{ item.sellReward.gems }} 💎
      </div>
    </div>
  </div>
</template>

<style scoped>
.item-card {
  background: #1f2937;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  min-width: 100px;
  user-select: none;
}

.item-card.compact {
  padding: 8px;
  min-width: 80px;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.item-card.selected {
  border-color: #3b82f6;
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

.type-icon {
  font-size: 1.4rem;
}

.compact .type-icon {
  font-size: 1.1rem;
}

.item-count {
  font-size: 0.85rem;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.card-body {
  text-align: center;
}

.item-name {
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 4px;
  font-size: 0.85rem;
}

.compact .item-name {
  font-size: 0.75rem;
}

.card-footer {
  margin-top: 8px;
  text-align: center;
}

.item-value {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.item-value.xp {
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.2);
}

.item-value.sell {
  color: #9ca3af;
}
</style>
