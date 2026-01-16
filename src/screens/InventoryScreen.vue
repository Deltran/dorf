<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore, useGachaStore } from '../stores'
import ItemCard from '../components/ItemCard.vue'
import StarRating from '../components/StarRating.vue'

const emit = defineEmits(['navigate'])

const inventoryStore = useInventoryStore()
const gachaStore = useGachaStore()

const selectedItem = ref(null)
const sellCount = ref(1)

const items = computed(() => inventoryStore.itemList)

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

const sellValue = computed(() => {
  if (!selectedItem.value?.sellReward?.gems) return 0
  return selectedItem.value.sellReward.gems * sellCount.value
})
</script>

<template>
  <div class="inventory-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="inventory-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Inventory</h1>
      <div class="gem-display">
        <span class="gem-icon">💎</span>
        <span class="gem-count">{{ gachaStore.gems }}</span>
      </div>
    </header>

    <div class="item-count-badge">
      <span class="count-value">{{ inventoryStore.totalItemCount }}</span>
      <span class="count-label">items</span>
    </div>

    <!-- Empty State -->
    <section v-if="items.length === 0" class="empty-inventory">
      <div class="empty-icon">📦</div>
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
    <aside v-if="selectedItem" :class="['item-detail', `rarity-${selectedItem.rarity}`]">
      <div class="detail-header">
        <div class="header-info">
          <h3>{{ selectedItem.name }}</h3>
          <StarRating :rating="selectedItem.rarity" />
        </div>
        <button class="close-detail" @click="closeDetail">×</button>
      </div>

      <div class="detail-body">
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
          <div v-if="selectedItem.sellReward?.gems" class="stat-row">
            <span class="stat-label">Sell Value</span>
            <span class="stat-value sell">{{ selectedItem.sellReward.gems }} 💎</span>
          </div>
        </div>

        <div class="detail-actions">
          <div v-if="selectedItem.type === 'xp'" class="action-hint">
            Use from Heroes screen
          </div>

          <div class="sell-section">
            <div class="sell-count-control">
              <button class="count-btn" @click="decrementSellCount" :disabled="sellCount <= 1">−</button>
              <span class="count-display">{{ sellCount }}</span>
              <button class="count-btn" @click="incrementSellCount" :disabled="sellCount >= selectedItem.count">+</button>
            </div>
            <button class="sell-btn" @click="sellSelected">
              Sell for {{ sellValue }} 💎
            </button>
            <button v-if="selectedItem.count > 1" class="sell-all-btn" @click="sellAll">
              Sell All ({{ selectedItem.count }})
            </button>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* Base Layout */
.inventory-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

/* Animated Background (same as HeroesScreen) */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-gradient {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e3a5f 25%,
    #1e1b4b 50%,
    #1e3a5f 75%,
    #0f172a 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  opacity: 0.03;
  background-image:
    radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  z-index: -1;
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

.gem-icon {
  font-size: 1.1rem;
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

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-hint {
  text-align: center;
  color: #6b7280;
  font-size: 0.85rem;
  padding: 8px;
  background: rgba(55, 65, 81, 0.3);
  border-radius: 8px;
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
</style>
