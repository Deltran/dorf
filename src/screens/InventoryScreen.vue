<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore, useGachaStore, useEquipmentStore } from '../stores'
import ItemCard from '../components/ItemCard.vue'
import StarRating from '../components/StarRating.vue'
import { getEquipment, SLOT_ICONS } from '../data/equipment.js'
import { getHeroTemplate } from '../data/heroes/index.js'
import { useSwipeToDismiss } from '../composables/useSwipeToDismiss.js'
import gemIcon from '../assets/icons/gems.png'
import goldIcon from '../assets/icons/gold.png'
import storeIcon from '../assets/icons/store_goods.png'

const emit = defineEmits(['navigate'])

const inventoryStore = useInventoryStore()
const gachaStore = useGachaStore()
const equipmentStore = useEquipmentStore()

const selectedItem = ref(null)
const sellCount = ref(1)
const itemDetailRef = ref(null)

// Swipe to dismiss
const isItemDetailOpen = computed(() => !!selectedItem.value)
useSwipeToDismiss({
  elementRef: itemDetailRef,
  isOpen: isItemDetailOpen,
  onClose: () => { selectedItem.value = null }
})

// Regular inventory items
const regularItems = computed(() => inventoryStore.itemList)

// Equipment items converted to item-like format for display
const equipmentItems = computed(() => {
  const items = []
  for (const [equipmentId, count] of Object.entries(equipmentStore.ownedEquipment)) {
    if (count <= 0) continue
    const equip = getEquipment(equipmentId)
    if (!equip) continue
    items.push({
      id: equipmentId,
      name: equip.name,
      description: formatEquipmentDescription(equip),
      type: 'equipment',
      rarity: equip.rarity,
      count,
      isEquipment: true,
      equipment: equip // Store full equipment data
    })
  }
  // Sort by rarity descending, then name
  return items.sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name))
})

// Merged items list
const items = computed(() => {
  // Equipment first, then regular items
  return [...equipmentItems.value, ...regularItems.value]
})

// Helper to format equipment description
function formatEquipmentDescription(equip) {
  const parts = []
  if (equip.stats) {
    const statStrings = []
    if (equip.stats.atk) statStrings.push(`+${equip.stats.atk} ATK`)
    if (equip.stats.def) statStrings.push(`+${equip.stats.def} DEF`)
    if (equip.stats.hp) statStrings.push(`+${equip.stats.hp} HP`)
    if (equip.stats.spd) statStrings.push(`+${equip.stats.spd} SPD`)
    if (equip.stats.mp) statStrings.push(`+${equip.stats.mp} MP`)
    if (statStrings.length) parts.push(statStrings.join(', '))
  }
  return parts.join('. ') || 'Equipment item'
}

// Get list of heroes who have this equipment equipped
function getEquippedByList(equipmentId) {
  const equippedBy = []
  for (const [templateId, gear] of Object.entries(equipmentStore.equippedGear)) {
    for (const slot in gear) {
      if (gear[slot] === equipmentId) {
        equippedBy.push(templateId)
      }
    }
  }
  return equippedBy
}

// Get hero names from template IDs
function getHeroNames(templateIds) {
  return templateIds.map(id => {
    const template = getHeroTemplate(id)
    return template ? template.name : id
  })
}

// Get slot icon for equipment
function getSlotIcon(equip) {
  return SLOT_ICONS[equip.slot] || '📦'
}

// Format effect description
function formatEffect(effect) {
  if (!effect) return null
  switch (effect.type) {
    case 'mp_regen': return `+${effect.value} MP per turn`
    case 'hp_regen_percent': return `Heal ${effect.value}% max HP per turn`
    case 'crit_chance': return `+${effect.value}% crit chance`
    case 'low_hp_atk_boost': return `+${effect.value}% ATK when below ${effect.threshold}% HP`
    case 'starting_mp': return `Start battle with +${effect.value} MP`
    case 'starting_resource': return `Start with +${effect.value}% class resource`
    case 'mp_boost_and_cost_reduction': return `+${effect.mpBoost} max MP, -${effect.costReduction}% skill cost`
    case 'valor_on_block': return `Gain ${effect.value} Valor when blocking`
    case 'rage_on_kill': return `Gain ${effect.value} Rage on kill`
    case 'focus_on_crit': return `Gain ${effect.value} Focus on crit`
    case 'spell_amp': return `+${effect.value}% spell damage`
    case 'heal_amp': return `+${effect.value}% healing done`
    case 'ally_damage_reduction': return `Allies take ${effect.value}% less damage`
    case 'nature_regen': return `Regenerate ${effect.value}% max HP per turn`
    case 'finale_boost': return `+${effect.value}% Finale power`
    default: return null
  }
}

// Check if equipment can be upgraded
function canUpgradeEquipment(equipmentId) {
  const equip = getEquipment(equipmentId)
  return equip && equip.upgradesTo !== null
}

function selectItem(item) {
  selectedItem.value = item
  sellCount.value = 1
}

function closeDetail() {
  selectedItem.value = null
}

function sellSelected() {
  if (!selectedItem.value) return
  const success = inventoryStore.sellItem(selectedItem.value.id, sellCount.value)
  if (success) {
    // Update selected item's count or close if sold all
    const remaining = inventoryStore.getItemCount(selectedItem.value.id)
    if (remaining <= 0) {
      selectedItem.value = null
    } else {
      // Refresh selected item data
      selectedItem.value = {
        ...selectedItem.value,
        count: remaining
      }
      sellCount.value = Math.min(sellCount.value, remaining)
    }
  }
}

function incrementSellCount() {
  if (selectedItem.value && sellCount.value < selectedItem.value.count) {
    sellCount.value++
  }
}

function decrementSellCount() {
  if (sellCount.value > 1) {
    sellCount.value--
  }
}

function sellAll() {
  if (selectedItem.value) {
    sellCount.value = selectedItem.value.count
    sellSelected()
  }
}

const sellRewardType = computed(() => {
  if (!selectedItem.value?.sellReward) return null
  if (selectedItem.value.sellReward.gold) return 'gold'
  if (selectedItem.value.sellReward.gems) return 'gems'
  return null
})

const sellValue = computed(() => {
  if (!selectedItem.value?.sellReward) return 0
  const reward = selectedItem.value.sellReward
  const baseValue = reward.gold || reward.gems || 0
  return baseValue * sellCount.value
})

function getContextualAction(item) {
  switch (item.type) {
    case 'xp': return { label: 'Use on Hero', screen: 'heroes' }
    case 'token': return { label: 'Use Token', screen: 'worldmap', param: item.region }
    case 'key': return { label: 'Challenge Boss', screen: 'genus-loci-list' }
    case 'merge_material': return { label: 'Merge Hero', screen: 'merge' }
    case 'genusLoci': return { label: 'Enhance Exploration', screen: 'explorations' }
    default: return null
  }
}
</script>

<template>
  <div class="inventory-screen">
    <header class="inventory-header">
      <button class="back-button" @click="emit('navigate', 'goodsAndMarkets')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Inventory</h1>
      <div class="gem-display">
        <img :src="gemIcon" alt="Gems" class="currency-icon" />
        <span class="gem-count">{{ gachaStore.gems }}</span>
      </div>
    </header>

    <div class="item-count-badge">
      <span class="count-value">{{ items.length }}</span>
      <span class="count-label">items</span>
    </div>

    <!-- Empty State -->
    <section v-if="items.length === 0" class="empty-inventory">
      <img :src="storeIcon" alt="Empty" class="empty-icon-img" />
      <p>No items yet!</p>
      <p class="empty-hint">Complete quests to find items.</p>
      <button class="quest-cta" @click="emit('navigate', 'worldmap')">
        <span>Go to Quests</span>
      </button>
    </section>

    <!-- Item Grid -->
    <section v-else class="inventory-grid">
      <ItemCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        :selected="selectedItem?.id === item.id"
        @click="selectItem(item)"
      />
    </section>

    <!-- Detail Backdrop -->
    <div
      v-if="selectedItem"
      class="detail-backdrop"
      @click="closeDetail"
    ></div>

    <!-- Item Detail Panel -->
    <aside v-if="selectedItem" ref="itemDetailRef" :class="['item-detail', `rarity-${selectedItem.rarity}`]">
      <div class="detail-header">
        <div class="header-info">
          <h3>{{ selectedItem.name }}</h3>
          <StarRating :rating="selectedItem.rarity" />
        </div>
        <button class="close-detail" @click="closeDetail">×</button>
      </div>

      <div class="detail-body">
        <!-- Equipment Detail View -->
        <template v-if="selectedItem.isEquipment">
          <div class="equipment-slot-badge">
            <span class="slot-icon">{{ getSlotIcon(selectedItem.equipment) }}</span>
            <span class="slot-name">{{ selectedItem.equipment.slot.replace('_', ' ') }}</span>
          </div>

          <div class="item-stats">
            <div class="stat-row">
              <span class="stat-label">Owned</span>
              <span class="stat-value">{{ selectedItem.count }}</span>
            </div>
            <!-- Equipment stats -->
            <div v-if="selectedItem.equipment.stats.atk" class="stat-row">
              <span class="stat-label">ATK</span>
              <span class="stat-value atk">+{{ selectedItem.equipment.stats.atk }}</span>
            </div>
            <div v-if="selectedItem.equipment.stats.def" class="stat-row">
              <span class="stat-label">DEF</span>
              <span class="stat-value def">+{{ selectedItem.equipment.stats.def }}</span>
            </div>
            <div v-if="selectedItem.equipment.stats.hp" class="stat-row">
              <span class="stat-label">HP</span>
              <span class="stat-value hp">+{{ selectedItem.equipment.stats.hp }}</span>
            </div>
            <div v-if="selectedItem.equipment.stats.spd" class="stat-row">
              <span class="stat-label">SPD</span>
              <span class="stat-value spd">+{{ selectedItem.equipment.stats.spd }}</span>
            </div>
            <div v-if="selectedItem.equipment.stats.mp" class="stat-row">
              <span class="stat-label">MP</span>
              <span class="stat-value mp">+{{ selectedItem.equipment.stats.mp }}</span>
            </div>
          </div>

          <!-- Equipment effect -->
          <div v-if="selectedItem.equipment.effect" class="equipment-effect">
            <span class="effect-label">Effect:</span>
            <span class="effect-value">{{ formatEffect(selectedItem.equipment.effect) }}</span>
          </div>

          <!-- Who has it equipped -->
          <div v-if="getEquippedByList(selectedItem.id).length > 0" class="equipped-by-section">
            <span class="equipped-label">Equipped by:</span>
            <div class="equipped-heroes">
              <span v-for="name in getHeroNames(getEquippedByList(selectedItem.id))" :key="name" class="equipped-hero-tag">
                {{ name }}
              </span>
            </div>
          </div>

          <div class="detail-actions">
            <button
              v-if="canUpgradeEquipment(selectedItem.id)"
              class="upgrade-btn"
              @click="emit('navigate', 'blacksmith', selectedItem.id)"
            >
              Upgrade
            </button>
            <div v-else class="max-tier-badge">
              Max Tier
            </div>
          </div>
        </template>

        <!-- Regular Item Detail View -->
        <template v-else>
          <p class="item-description">{{ selectedItem.description }}</p>

          <div class="item-stats">
            <div class="stat-row">
              <span class="stat-label">Owned</span>
              <span class="stat-value">{{ selectedItem.count }}</span>
            </div>
            <div v-if="selectedItem.type === 'xp'" class="stat-row">
              <span class="stat-label">XP Value</span>
              <span class="stat-value xp">+{{ selectedItem.xpValue }}</span>
            </div>
            <div v-if="sellRewardType" class="stat-row">
              <span class="stat-label">Sell Value</span>
              <span :class="['stat-value', sellRewardType === 'gold' ? 'sell-gold' : 'sell']">
                {{ selectedItem.sellReward.gold || selectedItem.sellReward.gems }}
                <img :src="sellRewardType === 'gold' ? goldIcon : gemIcon" alt="" class="inline-currency-icon" />
              </span>
            </div>
          </div>

          <div class="detail-actions">
            <button
              v-if="getContextualAction(selectedItem)"
              class="context-action-btn"
              @click="emit('navigate', getContextualAction(selectedItem).screen, getContextualAction(selectedItem).param)"
            >
              {{ getContextualAction(selectedItem).label }}
            </button>

            <div v-if="sellRewardType" class="sell-section">
              <div class="sell-count-control">
                <button class="count-btn" @click="decrementSellCount" :disabled="sellCount <= 1">-</button>
                <span class="count-display">{{ sellCount }}</span>
                <button class="count-btn" @click="incrementSellCount" :disabled="sellCount >= selectedItem.count">+</button>
              </div>
              <button class="sell-btn" :class="{ 'sell-for-gold': sellRewardType === 'gold' }" @click="sellSelected">
                Sell for {{ sellValue }} <img :src="sellRewardType === 'gold' ? goldIcon : gemIcon" alt="" class="btn-currency-icon" />
              </button>
              <button v-if="selectedItem.count > 1" class="sell-all-btn" @click="sellAll">
                Sell All ({{ selectedItem.count }})
              </button>
            </div>
          </div>
        </template>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* Base Layout */
.inventory-screen {
  min-height: 100vh;
  padding: 20px;
  padding-top: calc(20px + var(--safe-area-top));
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
  background: #111827;
}

/* Header */
.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.screen-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.gem-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid #334155;
}

.currency-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.inline-currency-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  vertical-align: middle;
  margin-left: 2px;
}

.btn-currency-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  vertical-align: middle;
  margin-left: 4px;
}

.empty-icon-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  opacity: 0.4;
  margin-bottom: 12px;
}

.gem-count {
  font-size: 1.1rem;
  font-weight: 700;
  color: #60a5fa;
}

.item-count-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  background: rgba(30, 41, 59, 0.6);
  padding: 8px 16px;
  border-radius: 8px;
  position: relative;
  z-index: 1;
}

.count-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
}

.count-label {
  font-size: 0.8rem;
  color: #6b7280;
}

/* Empty State */
.empty-inventory {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border-radius: 16px;
  border: 1px solid #334155;
  position: relative;
  z-index: 1;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-inventory p {
  color: #9ca3af;
  margin: 0 0 8px 0;
}

.empty-hint {
  font-size: 0.9rem;
  margin-bottom: 20px !important;
}

.quest-cta {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.quest-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

/* Item Grid */
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  position: relative;
  z-index: 1;
}

/* Detail Panel */
.detail-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 99;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.item-detail {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px 20px 0 0;
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
  animation: slideUp 0.3s ease;
  border: 1px solid #334155;
  border-bottom: none;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.item-detail::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 20px 20px 0 0;
}

.item-detail.rarity-1::before { background: linear-gradient(90deg, #9ca3af 0%, transparent 100%); }
.item-detail.rarity-2::before { background: linear-gradient(90deg, #22c55e 0%, transparent 100%); }
.item-detail.rarity-3::before { background: linear-gradient(90deg, #3b82f6 0%, transparent 100%); }
.item-detail.rarity-4::before { background: linear-gradient(90deg, #a855f7 0%, transparent 100%); }
.item-detail.rarity-5::before { background: linear-gradient(90deg, #f59e0b 0%, transparent 100%); }

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.header-info h3 {
  color: #f3f4f6;
  margin: 0 0 4px 0;
  font-size: 1.2rem;
}

.close-detail {
  background: rgba(55, 65, 81, 0.5);
  border: 1px solid #4b5563;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 1.3rem;
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-detail:hover {
  background: rgba(55, 65, 81, 0.8);
  color: #f3f4f6;
}

.item-description {
  color: #9ca3af;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.item-stats {
  background: rgba(55, 65, 81, 0.3);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}

.stat-row + .stat-row {
  border-top: 1px solid #374151;
}

.stat-label {
  color: #6b7280;
  font-size: 0.85rem;
}

.stat-value {
  color: #f3f4f6;
  font-weight: 600;
}

.stat-value.xp {
  color: #a78bfa;
}

.stat-value.sell {
  color: #60a5fa;
}

.stat-value.sell-gold {
  color: #f59e0b;
}

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.context-action-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.context-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.sell-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sell-count-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.count-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #4b5563;
  background: #374151;
  color: #f3f4f6;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.count-btn:hover:not(:disabled) {
  background: #4b5563;
}

.count-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.count-display {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f3f4f6;
  min-width: 40px;
  text-align: center;
}

.sell-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sell-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.sell-btn.sell-for-gold {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.sell-btn.sell-for-gold:hover {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.sell-all-btn {
  width: 100%;
  padding: 10px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sell-all-btn:hover {
  background: rgba(55, 65, 81, 0.5);
  color: #f3f4f6;
}

/* Equipment-specific styles */
.equipment-slot-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(55, 65, 81, 0.4);
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.slot-icon {
  font-size: 1.2rem;
}

.slot-name {
  font-size: 0.9rem;
  color: #9ca3af;
  text-transform: capitalize;
}

.stat-value.atk {
  color: #ef4444;
}

.stat-value.def {
  color: #3b82f6;
}

.stat-value.hp {
  color: #22c55e;
}

.stat-value.spd {
  color: #f59e0b;
}

.stat-value.mp {
  color: #a78bfa;
}

.equipment-effect {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.effect-label {
  font-size: 0.8rem;
  color: #a855f7;
  display: block;
  margin-bottom: 4px;
}

.effect-value {
  font-size: 0.9rem;
  color: #e9d5ff;
}

.equipped-by-section {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.equipped-label {
  font-size: 0.8rem;
  color: #60a5fa;
  display: block;
  margin-bottom: 8px;
}

.equipped-heroes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.equipped-hero-tag {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.upgrade-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upgrade-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.max-tier-badge {
  text-align: center;
  padding: 12px;
  background: rgba(55, 65, 81, 0.4);
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  font-weight: 500;
}
</style>
