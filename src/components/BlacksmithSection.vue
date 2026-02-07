<script setup>
import { ref, computed } from 'vue'
import { useEquipmentStore } from '../stores/equipment.js'
import { useGachaStore } from '../stores/gacha'
import { useInventoryStore } from '../stores/inventory'
import { getEquipment, SLOT_ICONS } from '../data/equipment.js'
import { getItem } from '../data/items.js'
import StarRating from './StarRating.vue'

const equipmentStore = useEquipmentStore()
const gachaStore = useGachaStore()
const inventoryStore = useInventoryStore()

const upgradeMessage = ref(null)
const selectedEquipment = ref(null)

const rarityColors = {
  1: '#9ca3af',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f59e0b'
}

// Get all owned equipment sorted by rarity (highest first), then by slot
const ownedEquipmentList = computed(() => {
  const list = []
  for (const [equipmentId, count] of Object.entries(equipmentStore.ownedEquipment)) {
    if (count <= 0) continue
    const equip = getEquipment(equipmentId)
    if (!equip) continue
    list.push({
      ...equip,
      count
    })
  }

  // Sort by rarity (descending), then by slot name
  return list.sort((a, b) => {
    if (b.rarity !== a.rarity) return b.rarity - a.rarity
    return a.slot.localeCompare(b.slot)
  })
})

function getSlotIcon(slot) {
  return SLOT_ICONS[slot] || '?'
}

function getRarityColor(rarity) {
  return rarityColors[rarity] || rarityColors[1]
}

function formatStats(stats) {
  if (!stats) return ''
  const parts = []
  if (stats.atk) parts.push(`+${stats.atk} ATK`)
  if (stats.def) parts.push(`+${stats.def} DEF`)
  if (stats.hp) parts.push(`+${stats.hp} HP`)
  if (stats.spd) parts.push(`+${stats.spd} SPD`)
  if (stats.mp) parts.push(`+${stats.mp} MP`)
  return parts.join(', ')
}

function formatEffect(effect) {
  if (!effect) return null
  // Format various effect types
  switch (effect.type) {
    case 'mp_regen': return `+${effect.value} MP/turn`
    case 'hp_regen_percent': return `+${effect.value}% HP/turn`
    case 'crit_chance': return `+${effect.value}% Crit`
    case 'low_hp_atk_boost': return `+${effect.value}% ATK when below ${effect.threshold}% HP`
    case 'starting_mp': return `Start with +${effect.value} MP`
    case 'starting_resource': return `Start with +${effect.value}% class resource`
    case 'mp_boost_and_cost_reduction': return `+${effect.mpBoost} Max MP, -${effect.costReduction}% skill cost`
    case 'valor_on_block': return `+${effect.value} Valor when blocking`
    case 'rage_on_kill': return `+${effect.value} Rage on kill`
    case 'focus_on_crit': return `+${effect.value} Focus on crit`
    case 'spell_amp': return `+${effect.value}% spell damage`
    case 'heal_amp': return `+${effect.value}% healing`
    case 'ally_damage_reduction': return `Allies take ${effect.value}% less damage`
    case 'nature_regen': return `+${effect.value}% max HP/turn`
    case 'finale_boost': return `+${effect.value}% Finale power`
    default: return JSON.stringify(effect)
  }
}

function selectEquipment(equip) {
  selectedEquipment.value = equip
}

function closeDetail() {
  selectedEquipment.value = null
}

function getUpgradeInfo(equipmentId) {
  return equipmentStore.canUpgrade(equipmentId)
}

function getMaterialName(materialId) {
  const item = getItem(materialId)
  return item?.name || materialId
}

function performUpgrade(equipmentId) {
  const result = equipmentStore.upgrade(equipmentId)

  if (result.success) {
    const resultEquip = getEquipment(result.resultId)
    upgradeMessage.value = {
      success: true,
      message: `Upgraded to ${resultEquip?.name || result.resultId}!`
    }
    // Update selected equipment to the new item
    selectedEquipment.value = {
      ...resultEquip,
      count: equipmentStore.getOwnedCount(result.resultId)
    }
  } else {
    upgradeMessage.value = {
      success: false,
      message: `Upgrade failed: ${result.message}`
    }
  }

  setTimeout(() => {
    upgradeMessage.value = null
  }, 2000)
}
</script>

<template>
  <div class="blacksmith-section">
    <div class="section-header">
      <span class="section-icon">⚒️</span>
      <h2 class="section-title">Blacksmith</h2>
      <div class="gold-display">
        <span class="gold-icon">🪙</span>
        <span class="gold-count">{{ gachaStore.gold.toLocaleString() }}</span>
      </div>
    </div>

    <p class="section-description">
      Upgrade your equipment by combining copies with materials and gold.
    </p>

    <!-- Empty state -->
    <div v-if="ownedEquipmentList.length === 0" class="empty-state">
      <span class="empty-icon">🎒</span>
      <p>No equipment owned yet.</p>
      <p class="empty-hint">Find equipment from quests and exploration.</p>
    </div>

    <!-- Equipment Grid -->
    <div v-else class="equipment-grid">
      <div
        v-for="equip in ownedEquipmentList"
        :key="equip.id"
        :class="['equipment-card', `rarity-${equip.rarity}`]"
        @click="selectEquipment(equip)"
      >
        <div class="card-header">
          <span class="slot-icon">{{ getSlotIcon(equip.slot) }}</span>
          <span v-if="equip.count > 1" class="item-count">x{{ equip.count }}</span>
        </div>
        <div class="card-body">
          <div class="item-name" :style="{ color: getRarityColor(equip.rarity) }">
            {{ equip.name }}
          </div>
          <StarRating :rating="equip.rarity" size="sm" />
        </div>
        <div class="card-footer">
          <div class="stats-preview">{{ formatStats(equip.stats) }}</div>
        </div>
      </div>
    </div>

    <!-- Equipment Detail Modal -->
    <div v-if="selectedEquipment" class="detail-backdrop" @click="closeDetail">
      <div class="detail-modal" @click.stop>
        <div class="modal-header" :style="{ borderColor: getRarityColor(selectedEquipment.rarity) }">
          <span class="modal-icon">{{ getSlotIcon(selectedEquipment.slot) }}</span>
          <div class="modal-title-area">
            <h3 :style="{ color: getRarityColor(selectedEquipment.rarity) }">{{ selectedEquipment.name }}</h3>
            <StarRating :rating="selectedEquipment.rarity" size="md" />
          </div>
          <button class="close-btn" @click="closeDetail">x</button>
        </div>

        <div class="modal-body">
          <!-- Stats -->
          <div class="stat-section">
            <div class="stat-label">Stats</div>
            <div class="stat-values">{{ formatStats(selectedEquipment.stats) }}</div>
          </div>

          <!-- Effect -->
          <div v-if="selectedEquipment.effect" class="effect-section">
            <div class="effect-label">Effect</div>
            <div class="effect-value">{{ formatEffect(selectedEquipment.effect) }}</div>
          </div>

          <!-- Owned count -->
          <div class="owned-section">
            <span class="owned-label">Owned:</span>
            <span class="owned-count">{{ equipmentStore.getOwnedCount(selectedEquipment.id) }}</span>
          </div>

          <!-- Upgrade Section -->
          <template v-if="selectedEquipment.upgradesTo !== null">
            <div class="upgrade-section">
              <div class="upgrade-header">Upgrade Requirements</div>

              <template v-if="getUpgradeInfo(selectedEquipment.id)">
                <div class="requirement-row">
                  <span class="req-label">Copies:</span>
                  <span
                    :class="['req-value', { sufficient: getUpgradeInfo(selectedEquipment.id).copiesHave >= getUpgradeInfo(selectedEquipment.id).copiesNeeded }]"
                  >
                    {{ getUpgradeInfo(selectedEquipment.id).copiesHave }}/{{ getUpgradeInfo(selectedEquipment.id).copiesNeeded }}
                  </span>
                </div>

                <div class="requirement-row">
                  <span class="req-label">Gold:</span>
                  <span
                    :class="['req-value', { sufficient: getUpgradeInfo(selectedEquipment.id).goldHave >= getUpgradeInfo(selectedEquipment.id).goldCost }]"
                  >
                    {{ getUpgradeInfo(selectedEquipment.id).goldHave.toLocaleString() }}/{{ getUpgradeInfo(selectedEquipment.id).goldCost.toLocaleString() }}
                  </span>
                </div>

                <div class="requirement-row">
                  <span class="req-label">{{ getMaterialName(getUpgradeInfo(selectedEquipment.id).materialId) }}:</span>
                  <span
                    :class="['req-value', { sufficient: getUpgradeInfo(selectedEquipment.id).materialsHave >= getUpgradeInfo(selectedEquipment.id).materialCount }]"
                  >
                    {{ getUpgradeInfo(selectedEquipment.id).materialsHave }}/{{ getUpgradeInfo(selectedEquipment.id).materialCount }}
                  </span>
                </div>

                <!-- Result preview -->
                <div v-if="getUpgradeInfo(selectedEquipment.id).resultId" class="result-preview">
                  <span class="result-arrow">⬇️</span>
                  <span class="result-name" :style="{ color: getRarityColor(selectedEquipment.rarity + 1) }">
                    {{ getEquipment(getUpgradeInfo(selectedEquipment.id).resultId)?.name }}
                  </span>
                  <StarRating :rating="selectedEquipment.rarity + 1" size="sm" />
                </div>

                <button
                  :class="['upgrade-btn', { disabled: !getUpgradeInfo(selectedEquipment.id).canUpgrade }]"
                  :disabled="!getUpgradeInfo(selectedEquipment.id).canUpgrade"
                  @click="performUpgrade(selectedEquipment.id)"
                >
                  Upgrade
                </button>
              </template>
            </div>
          </template>

          <div v-else class="max-tier-badge">
            Max Tier
          </div>
        </div>
      </div>
    </div>

    <!-- Upgrade Message Toast -->
    <div v-if="upgradeMessage" :class="['upgrade-message', upgradeMessage.success ? 'success' : 'error']">
      {{ upgradeMessage.message }}
    </div>
  </div>
</template>

<style scoped>
.blacksmith-section {
  padding: 16px 0;
  position: relative;
  z-index: 1;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.section-icon {
  font-size: 1.5rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
  flex: 1;
}

.gold-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #302a1f 0%, #1f2937 100%);
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid #f59e0b33;
}

.gold-icon {
  font-size: 0.9rem;
}

.gold-count {
  font-size: 0.9rem;
  font-weight: 700;
  color: #f59e0b;
}

.section-description {
  color: #9ca3af;
  font-size: 0.85rem;
  margin: 0 0 16px 0;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
}

.empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 0.8rem;
  color: #4b5563;
  margin-top: 8px;
}

/* Equipment Grid */
.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.equipment-card {
  background: #1f2937;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.equipment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Rarity borders and backgrounds */
.equipment-card.rarity-1 { border-left: 3px solid #9ca3af; background: linear-gradient(135deg, #1f2937 0%, #262d36 100%); }
.equipment-card.rarity-2 { border-left: 3px solid #22c55e; background: linear-gradient(135deg, #1f2937 0%, #1f3329 100%); }
.equipment-card.rarity-3 { border-left: 3px solid #3b82f6; background: linear-gradient(135deg, #1f2937 0%, #1f2a3d 100%); }
.equipment-card.rarity-4 { border-left: 3px solid #a855f7; background: linear-gradient(135deg, #1f2937 0%, #2a2340 100%); }
.equipment-card.rarity-5 { border-left: 3px solid #f59e0b; background: linear-gradient(135deg, #1f2937 0%, #302a1f 100%); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.slot-icon {
  font-size: 1.3rem;
}

.item-count {
  font-size: 0.8rem;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.card-body {
  text-align: center;
  margin-bottom: 6px;
}

.item-name {
  font-weight: 600;
  font-size: 0.8rem;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  text-align: center;
}

.stats-preview {
  font-size: 0.65rem;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Detail Modal */
.detail-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.detail-modal {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 16px;
  max-width: 360px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 3px solid #374151;
}

.modal-icon {
  font-size: 1.8rem;
}

.modal-title-area {
  flex: 1;
}

.modal-title-area h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #f3f4f6;
}

.modal-body {
  padding: 16px;
}

.stat-section,
.effect-section,
.owned-section {
  margin-bottom: 16px;
}

.stat-label,
.effect-label {
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-values {
  font-size: 0.9rem;
  color: #4ade80;
  font-weight: 600;
}

.effect-value {
  font-size: 0.85rem;
  color: #a78bfa;
  font-weight: 500;
}

.owned-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.owned-label {
  font-size: 0.85rem;
  color: #9ca3af;
}

.owned-count {
  font-size: 1rem;
  font-weight: 700;
  color: #f3f4f6;
}

/* Upgrade Section */
.upgrade-section {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 14px;
  margin-top: 8px;
}

.upgrade-header {
  font-size: 0.8rem;
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.requirement-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.req-label {
  font-size: 0.8rem;
  color: #9ca3af;
}

.req-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #ef4444;
}

.req-value.sufficient {
  color: #4ade80;
}

.result-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  margin: 12px 0;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  justify-content: center;
}

.result-arrow {
  color: #6b7280;
}

.result-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.upgrade-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #854d0e 0%, #f59e0b 100%);
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.upgrade-btn:hover:not(.disabled) {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  transform: translateY(-1px);
}

.upgrade-btn.disabled {
  background: #374151;
  color: #6b7280;
  cursor: not-allowed;
}

.max-tier-badge {
  text-align: center;
  padding: 12px;
  background: linear-gradient(135deg, #302a1f 0%, #1f2937 100%);
  border: 1px solid #f59e0b33;
  border-radius: 8px;
  color: #f59e0b;
  font-weight: 600;
  font-size: 0.9rem;
  margin-top: 8px;
}

/* Upgrade Message Toast */
.upgrade-message {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  z-index: 300;
  animation: slideUp 0.3s ease;
}

.upgrade-message.success {
  background: linear-gradient(135deg, #065f46 0%, #047857 100%);
  color: #d1fae5;
}

.upgrade-message.error {
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
  color: #fecaca;
}

@keyframes slideUp {
  from { transform: translateX(-50%) translateY(20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}
</style>
