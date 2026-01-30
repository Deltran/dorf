<script setup>
import { computed } from 'vue'
import { useEquipmentStore } from '../stores/equipment.js'
import { getEquipment, CLASS_SLOTS, SLOT_ICONS } from '../data/equipment.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  slotType: {
    type: String,
    required: true,
    validator: (v) => ['weapon', 'armor', 'trinket', 'special'].includes(v)
  },
  heroTemplateId: {
    type: String,
    required: true
  },
  heroClassId: {
    type: String,
    required: true
  },
  currentEquipmentId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'equip', 'unequip'])

const equipmentStore = useEquipmentStore()

const rarityColors = {
  1: '#9ca3af',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f59e0b'
}

// Get available equipment for the selected slot with special filtering for class slots
const availableEquipment = computed(() => {
  const items = equipmentStore.getAvailableForSlot(props.slotType)

  // For special slots, filter to only show items matching the hero's class slot
  if (props.slotType === 'special' && props.heroClassId) {
    const classSlotType = CLASS_SLOTS[props.heroClassId]
    return items
      .filter(item => {
        const equip = getEquipment(item.id)
        return equip && equip.slot === classSlotType
      })
      .map(item => ({
        ...item,
        data: getEquipment(item.id)
      }))
      .sort((a, b) => {
        // Sort by rarity descending, then by name
        if (b.data.rarity !== a.data.rarity) return b.data.rarity - a.data.rarity
        return a.data.name.localeCompare(b.data.name)
      })
  }

  // For other slots, just map and sort
  return items
    .map(item => ({
      ...item,
      data: getEquipment(item.id)
    }))
    .filter(item => item.data)
    .sort((a, b) => {
      // Sort by rarity descending, then by name
      if (b.data.rarity !== a.data.rarity) return b.data.rarity - a.data.rarity
      return a.data.name.localeCompare(b.data.name)
    })
})

// Get the current equipment data
const currentEquipment = computed(() => {
  if (!props.currentEquipmentId) return null
  return getEquipment(props.currentEquipmentId)
})

// Slot display label
const slotLabel = computed(() => {
  if (props.slotType === 'special' && props.heroClassId) {
    const classSlotType = CLASS_SLOTS[props.heroClassId]
    if (classSlotType) {
      return classSlotType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
  }
  return props.slotType.charAt(0).toUpperCase() + props.slotType.slice(1)
})

// Slot icon
const slotIcon = computed(() => {
  if (props.slotType === 'special' && props.heroClassId) {
    const classSlotType = CLASS_SLOTS[props.heroClassId]
    return SLOT_ICONS[classSlotType] || '?'
  }
  return SLOT_ICONS[props.slotType] || SLOT_ICONS.ring
})

function formatStats(stats) {
  const parts = []
  if (stats.hp) parts.push(`+${stats.hp} HP`)
  if (stats.atk) parts.push(`+${stats.atk} ATK`)
  if (stats.def) parts.push(`+${stats.def} DEF`)
  if (stats.spd) parts.push(`+${stats.spd} SPD`)
  if (stats.mp) parts.push(`+${stats.mp} MP`)
  return parts.join(', ')
}

function formatEffect(effect) {
  if (!effect) return null

  const effectDescriptions = {
    mp_regen: `+${effect.value} MP/turn`,
    hp_regen_percent: `+${effect.value}% HP/turn`,
    crit_chance: `+${effect.value}% Crit`,
    low_hp_atk_boost: `+${effect.value}% ATK below ${effect.threshold}% HP`,
    starting_mp: `+${effect.value} starting MP`,
    starting_resource: `+${effect.value}% starting resource`,
    mp_boost_and_cost_reduction: `+${effect.mpBoost} max MP, -${effect.costReduction}% costs`,
    valor_on_block: `+${effect.value} Valor on block`,
    rage_on_kill: `+${effect.value} Rage on kill`,
    focus_on_crit: `+${effect.value} Focus on crit`,
    spell_amp: `+${effect.value}% spell damage`,
    heal_amp: `+${effect.value}% healing`,
    ally_damage_reduction: `Allies take ${effect.value}% less damage`,
    nature_regen: `+${effect.value}% HP/turn`,
    finale_boost: `+${effect.value}% Finale power`
  }

  return effectDescriptions[effect.type] || JSON.stringify(effect)
}

function getRarityStars(rarity) {
  return '*'.repeat(rarity)
}

function handleEquip(equipmentId) {
  emit('equip', equipmentId)
}

function handleUnequip() {
  emit('unequip')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-backdrop" @click="handleClose"></div>
    <div v-if="visible" class="equipment-select-modal">
      <div class="modal-header">
        <span class="header-icon">{{ slotIcon }}</span>
        <h4>Select {{ slotLabel }}</h4>
        <button class="close-btn" @click="handleClose">x</button>
      </div>

      <!-- Currently Equipped Section -->
      <div v-if="currentEquipment" class="current-section">
        <div class="current-label">Currently Equipped</div>
        <div class="current-item" :style="{ borderColor: rarityColors[currentEquipment.rarity] }">
          <div class="item-icon">{{ SLOT_ICONS[currentEquipment.slot] || '?' }}</div>
          <div class="item-info">
            <div class="item-name" :style="{ color: rarityColors[currentEquipment.rarity] }">
              {{ currentEquipment.name }}
            </div>
            <div class="item-rarity">{{ getRarityStars(currentEquipment.rarity) }}</div>
            <div class="item-stats">{{ formatStats(currentEquipment.stats) }}</div>
            <div v-if="currentEquipment.effect" class="item-effect">
              {{ formatEffect(currentEquipment.effect) }}
            </div>
          </div>
          <button class="unequip-btn" @click="handleUnequip">Unequip</button>
        </div>
      </div>

      <!-- Available Equipment List -->
      <div class="available-section">
        <div class="available-label">
          Available ({{ availableEquipment.length }})
        </div>

        <div v-if="availableEquipment.length === 0" class="empty-state">
          <div class="empty-icon">{{ slotIcon }}</div>
          <p>No {{ slotLabel.toLowerCase() }} equipment available</p>
        </div>

        <div v-else class="equipment-list">
          <div
            v-for="item in availableEquipment"
            :key="item.id"
            :class="['equipment-item', { current: item.id === currentEquipmentId }]"
            :style="{ borderColor: rarityColors[item.data.rarity] }"
            @click="handleEquip(item.id)"
          >
            <div class="item-icon">{{ SLOT_ICONS[item.data.slot] || '?' }}</div>
            <div class="item-info">
              <div class="item-header">
                <span class="item-name" :style="{ color: rarityColors[item.data.rarity] }">
                  {{ item.data.name }}
                </span>
                <span v-if="item.count > 1" class="item-count">x{{ item.count }}</span>
              </div>
              <div class="item-rarity">{{ getRarityStars(item.data.rarity) }}</div>
              <div class="item-stats">{{ formatStats(item.data.stats) }}</div>
              <div v-if="item.data.effect" class="item-effect">
                {{ formatEffect(item.data.effect) }}
              </div>
            </div>
            <div v-if="item.id === currentEquipmentId" class="equipped-badge">Equipped</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 200;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.equipment-select-modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 70vh;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px 20px 0 0;
  border: 1px solid #334155;
  border-bottom: none;
  z-index: 201;
  animation: slideUp 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #334155;
  flex-shrink: 0;
}

.header-icon {
  font-size: 1.4rem;
}

.modal-header h4 {
  flex: 1;
  margin: 0;
  font-size: 1.1rem;
  color: #f3f4f6;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.4rem;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #f3f4f6;
  background: rgba(255, 255, 255, 0.1);
}

.current-section {
  padding: 16px 20px;
  border-bottom: 1px solid #334155;
  flex-shrink: 0;
}

.current-label,
.available-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.current-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(55, 65, 81, 0.3);
  padding: 12px;
  border-radius: 10px;
  border: 2px solid;
}

.available-section {
  flex: 1;
  min-height: 0;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
}

.equipment-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 20px;
}

.equipment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(55, 65, 81, 0.3);
  padding: 12px;
  border-radius: 10px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.2s ease;
}

.equipment-item:hover {
  background: rgba(55, 65, 81, 0.5);
  transform: translateY(-1px);
}

.equipment-item:active {
  transform: translateY(0);
}

.equipment-item.current {
  background: rgba(55, 65, 81, 0.5);
}

.item-icon {
  font-size: 1.5rem;
  width: 36px;
  text-align: center;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-name {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-count {
  font-size: 0.8rem;
  color: #9ca3af;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
}

.item-rarity {
  font-size: 0.7rem;
  color: #f59e0b;
  letter-spacing: 1px;
  margin-top: 2px;
}

.item-stats {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 4px;
}

.item-effect {
  font-size: 0.7rem;
  color: #3b82f6;
  margin-top: 4px;
  font-style: italic;
}

.unequip-btn {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.unequip-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.equipped-badge {
  font-size: 0.7rem;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}
</style>
