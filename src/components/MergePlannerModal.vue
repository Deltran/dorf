<script setup>
import { ref, computed, watch } from 'vue'
import { useHeroesStore, useGachaStore, useInventoryStore } from '../stores'
import { getHeroTemplate } from '../data/heroTemplates.js'
import { getItem } from '../data/items.js'
import StarRating from './StarRating.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  heroInstanceId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'complete'])

const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()
const inventoryStore = useInventoryStore()

// Tier merge counts (how many merges to perform at each tier)
const tier1Count = ref(0) // 1*->2* merges
const tier2Count = ref(0) // 2*->3* merges
const tier3Count = ref(0) // 3*->4* merges
const tier4Count = ref(0) // 4*->5* merges

// Reset counts when hero changes
watch(() => props.heroInstanceId, () => {
  tier1Count.value = 0
  tier2Count.value = 0
  tier3Count.value = 0
  tier4Count.value = 0
})

// Get target hero info
const targetHero = computed(() => {
  if (!props.heroInstanceId) return null
  return heroesStore.getHeroFull(props.heroInstanceId)
})

const targetStarLevel = computed(() => {
  if (!targetHero.value) return 1
  return targetHero.value.starLevel || targetHero.value.template?.rarity || 1
})

// Merge costs per tier
const MERGE_COSTS = {
  1: { copiesNeeded: 1, goldCost: 2000, material: null },
  2: { copiesNeeded: 2, goldCost: 3000, material: null },
  3: { copiesNeeded: 3, goldCost: 4000, material: 'shard_dragon_heart' },
  4: { copiesNeeded: 4, goldCost: 5000, material: 'dragon_heart' }
}

// Helper to get hero star level
function getHeroStarLevel(hero) {
  const template = getHeroTemplate(hero.templateId)
  return hero.starLevel || template?.rarity || 1
}

// Count existing copies at each tier (excluding target, party members, and heroes on expedition)
const existingCopies = computed(() => {
  if (!targetHero.value) return { 1: 0, 2: 0, 3: 0, 4: 0 }

  const templateId = targetHero.value.templateId
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 }

  heroesStore.collection.forEach(h => {
    if (h.templateId !== templateId) return
    if (h.instanceId === props.heroInstanceId) return // Exclude target
    if (heroesStore.party.includes(h.instanceId)) return // Exclude party members
    if (h.explorationNodeId) return // Exclude heroes on expedition

    const star = getHeroStarLevel(h)
    if (star >= 1 && star <= 4) {
      counts[star]++
    }
  })

  return counts
})

// Calculate available copies at each tier (existing + created from lower tier merges)
// A merge at tier N consumes (copiesNeeded + 1) copies at tier N and creates 1 copy at tier N+1
const availableCopies = computed(() => {
  const existing = existingCopies.value
  const available = { 1: existing[1], 2: existing[2], 3: existing[3], 4: existing[4] }

  // Tier 1 merges: consume 2 1-star copies, create 1 2-star copy
  const tier1Merges = tier1Count.value
  available[1] -= tier1Merges * 2
  available[2] += tier1Merges

  // Tier 2 merges: consume 3 2-star copies, create 1 3-star copy
  const tier2Merges = tier2Count.value
  available[2] -= tier2Merges * 3
  available[3] += tier2Merges

  // Tier 3 merges: consume 4 3-star copies, create 1 4-star copy
  const tier3Merges = tier3Count.value
  available[3] -= tier3Merges * 4
  available[4] += tier3Merges

  // Tier 4 merges: consume 5 4-star copies, no creation (result is 5-star)
  const tier4Merges = tier4Count.value
  available[4] -= tier4Merges * 5

  return available
})

// Calculate maximum merges possible at each tier
const maxMerges = computed(() => {
  const existing = existingCopies.value

  // Start from bottom up, accounting for cascading availability
  let copies1 = existing[1]
  let copies2 = existing[2]
  let copies3 = existing[3]
  let copies4 = existing[4]

  // Max tier 1 merges (2 copies -> 1 merge)
  const max1 = Math.floor(copies1 / 2)

  // For tier 2, we need to account for copies created from tier 1
  // Max is when all tier 1 copies become tier 2
  const tier1Contribution = max1 // Each max tier1 merge creates 1 tier2 copy
  const max2AfterTier1 = Math.floor((copies2 + tier1Contribution) / 3)
  const max2Standalone = Math.floor(copies2 / 3)

  // For tier 3, account for tier 2 contributions
  const max3Standalone = Math.floor(copies3 / 4)

  // For tier 4, account for tier 3 contributions
  const max4Standalone = Math.floor(copies4 / 5)

  return {
    1: max1,
    2: max2Standalone, // Conservative max without cascading
    3: max3Standalone,
    4: max4Standalone
  }
})

// Calculate copies created at each tier by planned merges
const copiesCreated = computed(() => {
  return {
    2: tier1Count.value, // 1*->2* creates 2-star copies
    3: tier2Count.value, // 2*->3* creates 3-star copies
    4: tier3Count.value, // 3*->4* creates 4-star copies
    5: tier4Count.value  // 4*->5* creates 5-star copies
  }
})

// Total gold cost
const totalGoldCost = computed(() => {
  return tier1Count.value * MERGE_COSTS[1].goldCost +
         tier2Count.value * MERGE_COSTS[2].goldCost +
         tier3Count.value * MERGE_COSTS[3].goldCost +
         tier4Count.value * MERGE_COSTS[4].goldCost
})

// Materials needed and available
const materialsNeeded = computed(() => {
  return {
    shard_dragon_heart: tier3Count.value,
    dragon_heart: tier4Count.value
  }
})

const materialsAvailable = computed(() => {
  return {
    shard_dragon_heart: inventoryStore.getItemCount('shard_dragon_heart'),
    dragon_heart: inventoryStore.getItemCount('dragon_heart')
  }
})

// Validation
const canConfirm = computed(() => {
  // Need at least one merge planned
  const totalMerges = tier1Count.value + tier2Count.value + tier3Count.value + tier4Count.value
  if (totalMerges === 0) return false

  // Check gold
  if (gachaStore.gold < totalGoldCost.value) return false

  // Check materials
  if (materialsNeeded.value.shard_dragon_heart > materialsAvailable.value.shard_dragon_heart) return false
  if (materialsNeeded.value.dragon_heart > materialsAvailable.value.dragon_heart) return false

  // Check copy availability (no negative counts)
  if (availableCopies.value[1] < 0) return false
  if (availableCopies.value[2] < 0) return false
  if (availableCopies.value[3] < 0) return false
  if (availableCopies.value[4] < 0) return false

  return true
})

const validationMessage = computed(() => {
  const totalMerges = tier1Count.value + tier2Count.value + tier3Count.value + tier4Count.value
  if (totalMerges === 0) return 'Select merges to perform'

  if (gachaStore.gold < totalGoldCost.value) {
    return `Not enough gold (need ${totalGoldCost.value.toLocaleString()}, have ${gachaStore.gold.toLocaleString()})`
  }

  if (materialsNeeded.value.shard_dragon_heart > materialsAvailable.value.shard_dragon_heart) {
    return `Not enough Dragon Heart Shards (need ${materialsNeeded.value.shard_dragon_heart}, have ${materialsAvailable.value.shard_dragon_heart})`
  }

  if (materialsNeeded.value.dragon_heart > materialsAvailable.value.dragon_heart) {
    return `Not enough Dragon Hearts (need ${materialsNeeded.value.dragon_heart}, have ${materialsAvailable.value.dragon_heart})`
  }

  if (availableCopies.value[1] < 0) return 'Not enough 1-star copies'
  if (availableCopies.value[2] < 0) return 'Not enough 2-star copies'
  if (availableCopies.value[3] < 0) return 'Not enough 3-star copies'
  if (availableCopies.value[4] < 0) return 'Not enough 4-star copies'

  return ''
})

// Visible tiers - only show tiers below target star level that have copies available
const visibleTiers = computed(() => {
  const tiers = []
  const targetStar = targetStarLevel.value

  for (let tier = 1; tier <= 4; tier++) {
    // Only show tiers below target star level
    if (tier >= targetStar) continue

    // Only show if there are existing copies or copies could be created from lower tier
    const hasExisting = existingCopies.value[tier] > 0
    const canCreate = tier > 1 && existingCopies.value[tier - 1] >= 2 // Lower tier has enough for at least one merge

    if (hasExisting || canCreate) {
      tiers.push(tier)
    }
  }

  return tiers
})

// Tier control functions
function getCount(tier) {
  switch (tier) {
    case 1: return tier1Count.value
    case 2: return tier2Count.value
    case 3: return tier3Count.value
    case 4: return tier4Count.value
    default: return 0
  }
}

function increment(tier) {
  // Check if we can add another merge
  const copies = existingCopies.value[tier]
  const currentCount = getCount(tier)
  const copiesNeeded = MERGE_COSTS[tier].copiesNeeded + 1 // Total copies per merge

  // Calculate available at this tier with current selections
  let availableAtTier = copies
  if (tier === 2) availableAtTier += tier1Count.value // Cascading from tier 1
  if (tier === 3) availableAtTier += tier2Count.value // Cascading from tier 2
  if (tier === 4) availableAtTier += tier3Count.value // Cascading from tier 3

  // Check if we have enough copies for one more merge
  const usedAtTier = currentCount * copiesNeeded
  const remainingAtTier = availableAtTier - usedAtTier

  if (remainingAtTier < copiesNeeded) return

  // Check material availability for this tier
  const materialId = MERGE_COSTS[tier].material
  if (materialId) {
    const owned = inventoryStore.getItemCount(materialId)
    if (currentCount + 1 > owned) return
  }

  switch (tier) {
    case 1: tier1Count.value++; break
    case 2: tier2Count.value++; break
    case 3: tier3Count.value++; break
    case 4: tier4Count.value++; break
  }
}

function getMaterialName(tier) {
  const materialId = MERGE_COSTS[tier].material
  if (!materialId) return ''
  const item = getItem(materialId)
  return item?.name || materialId
}

function getMaterialOwned(tier) {
  const materialId = MERGE_COSTS[tier].material
  if (!materialId) return 0
  return inventoryStore.getItemCount(materialId)
}

function decrement(tier) {
  switch (tier) {
    case 1: if (tier1Count.value > 0) tier1Count.value--; break
    case 2: if (tier2Count.value > 0) tier2Count.value--; break
    case 3: if (tier3Count.value > 0) tier3Count.value--; break
    case 4: if (tier4Count.value > 0) tier4Count.value--; break
  }
}

function confirmMerges() {
  if (!canConfirm.value || !targetHero.value) return

  const mergeConfig = {
    tier1: tier1Count.value,
    tier2: tier2Count.value,
    tier3: tier3Count.value,
    tier4: tier4Count.value
  }

  const result = heroesStore.executeBulkMerge(targetHero.value.templateId, mergeConfig)

  if (result.success) {
    emit('complete', result)
  } else {
    // Handle error - could show message
    console.error('Bulk merge failed:', result.error)
  }
}

function closeModal() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <!-- Header -->
        <div class="modal-header">
          <h2>Build Copies</h2>
          <button class="close-button" @click="closeModal">X</button>
        </div>

        <!-- Target Hero Info -->
        <div v-if="targetHero" class="target-info">
          <StarRating :rating="targetStarLevel" size="md" />
          <span class="target-name">{{ targetHero.template?.name }}</span>
        </div>

        <!-- Tier Sections -->
        <div class="tier-sections">
          <div v-if="visibleTiers.length === 0" class="no-copies">
            No lower-tier copies available to merge.
          </div>

          <div
            v-for="tier in visibleTiers"
            :key="tier"
            class="tier-row"
          >
            <div class="tier-label">
              <span class="star-display">{{ tier }}★</span>
              <span class="arrow">→</span>
              <span class="star-display">{{ tier + 1 }}★</span>
            </div>

            <div class="tier-info">
              <div class="copies-needed">
                {{ MERGE_COSTS[tier].copiesNeeded + 1 }} copies
              </div>
              <div class="copies-available">
                Available: {{ existingCopies[tier] }}
                <span v-if="tier > 1 && getCount(tier - 1) > 0" class="cascade-note">
                  (+{{ getCount(tier - 1) }} from merges)
                </span>
              </div>
              <div v-if="MERGE_COSTS[tier].material" class="material-req" :class="{ insufficient: getMaterialOwned(tier) === 0 }">
                {{ getMaterialName(tier) }}: {{ getMaterialOwned(tier) }} owned
              </div>
            </div>

            <div class="tier-controls">
              <button
                class="control-btn"
                :disabled="getCount(tier) === 0"
                @click="decrement(tier)"
              >-</button>
              <span class="count">{{ getCount(tier) }}</span>
              <button
                class="control-btn"
                @click="increment(tier)"
              >+</button>
            </div>

            <div class="tier-result">
              <span v-if="getCount(tier) > 0" class="creates">
                Creates {{ getCount(tier) }} × {{ tier + 1 }}★
              </span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <div class="cost-summary">
            <div class="cost-item gold">
              <span class="cost-icon">🪙</span>
              <span class="cost-value">{{ totalGoldCost.toLocaleString() }}</span>
              <span class="cost-available">({{ gachaStore.gold.toLocaleString() }})</span>
            </div>

            <div v-if="materialsNeeded.shard_dragon_heart > 0" class="cost-item material">
              <span class="cost-icon">💎</span>
              <span class="cost-label">Dragon Heart Shards:</span>
              <span class="cost-value">{{ materialsNeeded.shard_dragon_heart }}</span>
              <span class="cost-available">({{ materialsAvailable.shard_dragon_heart }})</span>
            </div>

            <div v-if="materialsNeeded.dragon_heart > 0" class="cost-item material">
              <span class="cost-icon">❤️</span>
              <span class="cost-label">Dragon Hearts:</span>
              <span class="cost-value">{{ materialsNeeded.dragon_heart }}</span>
              <span class="cost-available">({{ materialsAvailable.dragon_heart }})</span>
            </div>
          </div>

          <div v-if="validationMessage && !canConfirm" class="validation-message">
            {{ validationMessage }}
          </div>

          <div class="button-row">
            <button class="btn-cancel" @click="closeModal">Cancel</button>
            <button
              class="btn-confirm"
              :disabled="!canConfirm"
              @click="confirmMerges"
            >
              Confirm Merges
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
  border: 2px solid #374151;
  border-radius: 16px;
  padding: 24px;
  max-width: 480px;
  width: 100%;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  color: #f3f4f6;
  font-size: 1.5rem;
}

.close-button {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.close-button:hover {
  background: #374151;
  color: #f3f4f6;
}

.target-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #374151;
  border-radius: 8px;
  margin-bottom: 20px;
}

.target-name {
  color: #f3f4f6;
  font-weight: 600;
  font-size: 1.1rem;
}

.tier-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.no-copies {
  text-align: center;
  color: #6b7280;
  padding: 24px;
}

.tier-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
}

.tier-label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
}

.star-display {
  color: #fbbf24;
  font-weight: 600;
}

.arrow {
  color: #6b7280;
}

.tier-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.copies-needed {
  color: #9ca3af;
  font-size: 0.85rem;
}

.copies-available {
  color: #6b7280;
  font-size: 0.8rem;
}

.cascade-note {
  color: #22c55e;
}

.material-req {
  color: #9ca3af;
  font-size: 0.8rem;
}

.material-req.insufficient {
  color: #ef4444;
}

.tier-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #4b5563;
  border-radius: 6px;
  background: #374151;
  color: #f3f4f6;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.control-btn:hover:not(:disabled) {
  background: #4b5563;
  border-color: #6b7280;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.count {
  min-width: 24px;
  text-align: center;
  color: #f3f4f6;
  font-weight: 600;
  font-size: 1.1rem;
}

.tier-result {
  min-width: 100px;
  text-align: right;
}

.creates {
  color: #22c55e;
  font-size: 0.85rem;
  font-weight: 500;
}

.modal-footer {
  border-top: 1px solid #374151;
  padding-top: 16px;
}

.cost-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.cost-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cost-icon {
  font-size: 1.1rem;
}

.cost-label {
  color: #9ca3af;
  font-size: 0.9rem;
}

.cost-value {
  color: #f3f4f6;
  font-weight: 600;
}

.cost-available {
  color: #6b7280;
  font-size: 0.85rem;
}

.validation-message {
  color: #ef4444;
  font-size: 0.9rem;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
}

.button-row {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: #374151;
  border: 1px solid #4b5563;
  color: #9ca3af;
}

.btn-cancel:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.btn-confirm {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
