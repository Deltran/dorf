<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useShopsStore, useGachaStore } from '../stores'
import { getAllShops, getShop } from '../data/shops.js'
import { getItem } from '../data/items.js'
import StarRating from '../components/StarRating.vue'

const emit = defineEmits(['navigate'])

const shopsStore = useShopsStore()
const gachaStore = useGachaStore()

const shops = getAllShops()
const activeShopId = ref(shops[0]?.id || null)
const purchaseMessage = ref(null)
const confirmingItem = ref(null)

const activeShop = computed(() => getShop(activeShopId.value))

const shopInventory = computed(() => {
  if (!activeShop.value) return []
  return activeShop.value.inventory.map(shopItem => {
    const item = getItem(shopItem.itemId)
    const remaining = shopsStore.getRemainingStock(
      activeShopId.value,
      shopItem.itemId,
      shopItem.maxStock
    )
    return {
      ...shopItem,
      item,
      remaining,
      soldOut: remaining <= 0
    }
  })
})

const currentCurrency = computed(() => {
  if (!activeShop.value) return 0
  if (activeShop.value.currency === 'gold') return gachaStore.gold
  if (activeShop.value.currency === 'gems') return gachaStore.gems
  return 0
})

const currencyIcon = computed(() => {
  if (!activeShop.value) return '🪙'
  return activeShop.value.currency === 'gems' ? '💎' : '🪙'
})

// Reset timer
const resetTimer = ref('')
let timerInterval = null

function updateResetTimer() {
  const seconds = shopsStore.getSecondsUntilReset()
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  resetTimer.value = `${hours}h ${minutes}m`
}

onMounted(() => {
  updateResetTimer()
  timerInterval = setInterval(updateResetTimer, 60000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

function handleItemClick(shopItem) {
  if (shopItem.soldOut) return

  if (shopItem.price >= activeShop.value.confirmThreshold) {
    confirmingItem.value = shopItem
  } else {
    executePurchase(shopItem)
  }
}

function executePurchase(shopItem) {
  const result = shopsStore.purchase(activeShopId.value, shopItem)
  purchaseMessage.value = result

  if (result.success) {
    setTimeout(() => {
      purchaseMessage.value = null
    }, 1500)
  } else {
    setTimeout(() => {
      purchaseMessage.value = null
    }, 2500)
  }

  confirmingItem.value = null
}

function cancelConfirm() {
  confirmingItem.value = null
}

function typeIcon(type) {
  switch (type) {
    case 'xp': return '📖'
    case 'junk': return '🪨'
    case 'token': return '🎟️'
    case 'key': return '🗝️'
    default: return '📦'
  }
}
</script>

<template>
  <div class="shops-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'goodsAndMarkets')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Shops</h1>
      <div class="currency-display">
        <span class="currency-icon">{{ currencyIcon }}</span>
        <span class="currency-count">{{ currentCurrency.toLocaleString() }}</span>
      </div>
    </header>

    <!-- Shop Tabs -->
    <div class="shop-tabs">
      <button
        v-for="shop in shops"
        :key="shop.id"
        :class="['shop-tab', { active: activeShopId === shop.id }]"
        @click="activeShopId = shop.id"
      >
        {{ shop.name }}
      </button>
    </div>

    <!-- Shop Info -->
    <div v-if="activeShop" class="shop-info">
      <div class="shop-name">{{ activeShop.name }}</div>
      <div class="shop-description">{{ activeShop.description }}</div>
      <div class="reset-timer">
        <span class="timer-icon">🕐</span>
        <span>Resets in {{ resetTimer }}</span>
      </div>
    </div>

    <!-- Item Grid -->
    <div class="item-grid">
      <div
        v-for="shopItem in shopInventory"
        :key="shopItem.itemId"
        :class="['shop-item', `rarity-${shopItem.item?.rarity || 1}`, { 'sold-out': shopItem.soldOut }]"
        @click="handleItemClick(shopItem)"
      >
        <div class="item-header">
          <span class="item-type-icon">{{ typeIcon(shopItem.item?.type) }}</span>
        </div>
        <div class="item-body">
          <div class="item-name">{{ shopItem.item?.name }}</div>
          <StarRating v-if="shopItem.item" :rating="shopItem.item.rarity" size="sm" />
        </div>
        <div class="item-footer">
          <div class="item-price">
            <span class="price-icon">{{ currencyIcon }}</span>
            <span class="price-value">{{ shopItem.price }}</span>
          </div>
          <div :class="['item-stock', { 'out': shopItem.soldOut }]">
            {{ shopItem.soldOut ? 'SOLD OUT' : `${shopItem.remaining} left` }}
          </div>
        </div>
      </div>
    </div>

    <!-- Purchase Message -->
    <div v-if="purchaseMessage" :class="['purchase-message', purchaseMessage.success ? 'success' : 'error']">
      {{ purchaseMessage.message }}
    </div>

    <!-- Confirmation Modal -->
    <div v-if="confirmingItem" class="confirm-backdrop" @click="cancelConfirm">
      <div class="confirm-modal" @click.stop>
        <h3>Confirm Purchase</h3>
        <p>Buy <strong>{{ confirmingItem.item?.name }}</strong> for <strong>{{ confirmingItem.price }} {{ currencyIcon }}</strong>?</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="cancelConfirm">Cancel</button>
          <button class="confirm-btn" @click="executePurchase(confirmingItem)">Buy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shops-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

/* Animated Background */
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
    #302a1f 25%,
    #1e1b4b 50%,
    #302a1f 75%,
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
.screen-header {
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

.currency-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #302a1f 0%, #1f2937 100%);
  padding: 10px 14px;
  border-radius: 24px;
  border: 1px solid #f59e0b33;
}

.currency-icon {
  font-size: 1rem;
}

.currency-count {
  font-size: 1rem;
  font-weight: 700;
  color: #f59e0b;
}

/* Shop Tabs */
.shop-tabs {
  display: flex;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.shop-tab {
  padding: 10px 20px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.shop-tab:hover {
  background: rgba(30, 41, 59, 0.8);
  color: #f3f4f6;
}

.shop-tab.active {
  background: linear-gradient(135deg, #854d0e 0%, #92400e 100%);
  border-color: #f59e0b;
  color: #f3f4f6;
}

/* Shop Info */
.shop-info {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  position: relative;
  z-index: 1;
}

.shop-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
  margin-bottom: 4px;
}

.shop-description {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-bottom: 8px;
}

.reset-timer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #6b7280;
}

.timer-icon {
  font-size: 0.9rem;
}

/* Item Grid */
.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  position: relative;
  z-index: 1;
}

.shop-item {
  background: #1f2937;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  user-select: none;
}

.shop-item:hover:not(.sold-out) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.shop-item.sold-out {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Rarity borders */
.shop-item.rarity-1 { border-left: 3px solid #9ca3af; background: linear-gradient(135deg, #1f2937 0%, #262d36 100%); }
.shop-item.rarity-2 { border-left: 3px solid #22c55e; background: linear-gradient(135deg, #1f2937 0%, #1f3329 100%); }
.shop-item.rarity-3 { border-left: 3px solid #3b82f6; background: linear-gradient(135deg, #1f2937 0%, #1f2a3d 100%); }
.shop-item.rarity-4 { border-left: 3px solid #a855f7; background: linear-gradient(135deg, #1f2937 0%, #2a2340 100%); }
.shop-item.rarity-5 { border-left: 3px solid #f59e0b; background: linear-gradient(135deg, #1f2937 0%, #302a1f 100%); }

.item-header {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.item-type-icon {
  font-size: 1.4rem;
}

.item-body {
  text-align: center;
  margin-bottom: 8px;
}

.item-name {
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.8rem;
  margin-bottom: 4px;
}

.item-footer {
  text-align: center;
}

.item-price {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 4px;
}

.price-icon {
  font-size: 0.9rem;
}

.price-value {
  font-weight: 700;
  color: #f59e0b;
  font-size: 0.9rem;
}

.item-stock {
  font-size: 0.7rem;
  color: #6b7280;
}

.item-stock.out {
  color: #ef4444;
  font-weight: 700;
}

/* Purchase Message */
.purchase-message {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  z-index: 100;
  animation: slideUp 0.3s ease;
}

.purchase-message.success {
  background: linear-gradient(135deg, #065f46 0%, #047857 100%);
  color: #d1fae5;
}

.purchase-message.error {
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
  color: #fecaca;
}

@keyframes slideUp {
  from { transform: translateX(-50%) translateY(20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

/* Confirmation Modal */
.confirm-backdrop {
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

.confirm-modal {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 24px;
  max-width: 320px;
  text-align: center;
}

.confirm-modal h3 {
  color: #f3f4f6;
  margin: 0 0 12px 0;
}

.confirm-modal p {
  color: #9ca3af;
  margin: 0 0 20px 0;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn {
  flex: 1;
  padding: 12px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: rgba(55, 65, 81, 0.5);
  color: #f3f4f6;
}

.confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #854d0e 0%, #f59e0b 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn:hover {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}
</style>
