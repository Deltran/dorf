<script setup>
import { computed } from 'vue'
import { getEquipment, SLOT_ICONS, CLASS_SLOTS } from '../data/equipment.js'

const props = defineProps({
  slotType: {
    type: String,
    required: true,
    validator: (v) => ['weapon', 'armor', 'trinket', 'special'].includes(v)
  },
  equipmentId: {
    type: String,
    default: null
  },
  heroClassId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['click'])

const rarityColors = {
  1: '#9ca3af',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f59e0b'
}

const equipment = computed(() => {
  if (!props.equipmentId) return null
  return getEquipment(props.equipmentId)
})

const slotIcon = computed(() => {
  // If equipment is equipped, show its actual slot icon
  if (equipment.value) {
    return SLOT_ICONS[equipment.value.slot] || '?'
  }

  // For empty slots, show appropriate icon based on slot type
  if (props.slotType === 'weapon') return SLOT_ICONS.weapon
  if (props.slotType === 'armor') return SLOT_ICONS.armor
  if (props.slotType === 'trinket') return SLOT_ICONS.ring // Default to ring for empty trinket slot
  if (props.slotType === 'special' && props.heroClassId) {
    const classSlotType = CLASS_SLOTS[props.heroClassId]
    return SLOT_ICONS[classSlotType] || '?'
  }

  return '?'
})

const slotLabel = computed(() => {
  if (props.slotType === 'special' && props.heroClassId) {
    const classSlotType = CLASS_SLOTS[props.heroClassId]
    // Convert snake_case to Title Case
    if (classSlotType) {
      return classSlotType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
  }
  return props.slotType.charAt(0).toUpperCase() + props.slotType.slice(1)
})

const rarityColor = computed(() => {
  if (!equipment.value) return null
  return rarityColors[equipment.value.rarity] || rarityColors[1]
})

const borderStyle = computed(() => {
  if (!equipment.value) return {}
  return {
    borderColor: rarityColor.value
  }
})
</script>

<template>
  <div
    :class="['equipment-slot', { equipped: equipment }]"
    :style="borderStyle"
    @click="emit('click', slotType)"
  >
    <div class="slot-icon">{{ slotIcon }}</div>
    <div class="slot-content">
      <div v-if="equipment" class="item-name" :style="{ color: rarityColor }">
        {{ equipment.name }}
      </div>
      <div v-else class="empty-label">None</div>
      <div class="slot-label">{{ slotLabel }}</div>
    </div>
  </div>
</template>

<style scoped>
.equipment-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(55, 65, 81, 0.3);
  padding: 10px 12px;
  border-radius: 8px;
  border: 2px solid #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.equipment-slot:hover {
  background: rgba(55, 65, 81, 0.5);
  transform: translateY(-1px);
}

.equipment-slot:active {
  transform: translateY(0);
}

.equipment-slot.equipped {
  border-width: 2px;
}

.slot-icon {
  font-size: 1.3rem;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.slot-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.item-name {
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-style: italic;
}

.slot-label {
  font-size: 0.65rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}
</style>
