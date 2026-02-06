<script setup>
import { computed, ref } from 'vue'
import { useMawStore } from '../stores/maw.js'
import { useGachaStore } from '../stores/gacha.js'
import { useInventoryStore } from '../stores/inventory.js'
import { getMawShopItems } from '../data/maw/shop.js'
import dregsIcon from '../assets/icons/valor_marks.png'

const mawStore = useMawStore()
const gachaStore = useGachaStore()
const inventoryStore = useInventoryStore()

const purchaseFlash = ref(null)
const purchaseMessage = ref(null)

const shopItems = computed(() => {
  return getMawShopItems().map(item => ({
    ...item,
    stock: mawStore.getShopItemStock(item.id),
    affordable: mawStore.dregs >= item.cost,
    inStock: !item.maxStock || mawStore.getShopItemStock(item.id) > 0
  }))
})

function buyItem(itemId) {
  const result = mawStore.purchaseShopItem(itemId)
  if (result.success && result.reward) {
    if (result.reward.gold) gachaStore.addGold(result.reward.gold)
    if (result.reward.gems) gachaStore.addGems(result.reward.gems)
    if (result.reward.itemId) inventoryStore.addItem(result.reward.itemId, result.reward.count || 1)

    purchaseFlash.value = itemId
    purchaseMessage.value = 'Purchased!'
    setTimeout(() => {
      purchaseFlash.value = null
      purchaseMessage.value = null
    }, 1200)
  } else {
    purchaseMessage.value = result.message || 'Purchase failed.'
    setTimeout(() => { purchaseMessage.value = null }, 1500)
  }
}

function formatStock(item) {
  if (!item.maxStock) return 'Unlimited'
  return `${item.stock}/${item.maxStock}`
}

function getItemIcon(item) {
  if (item.type === 'xp_tome') return '\u{1F4D6}'
  if (item.type === 'currency' && item.reward?.gold) return '\u{1FA99}'
  if (item.type === 'currency' && item.reward?.gems) return '\u{1F48E}'
  return '\u{1F4E6}'
}
</script>

<template>
  <div class="dregs-shop">
    <!-- Dregs balance -->
    <div class="dregs-balance">
      <span class="balance-label">Dregs</span>
      <span class="balance-value"><img :src="dregsIcon" alt="Dregs" class="dregs-inline-icon" /> {{ mawStore.dregs }}</span>
    </div>

    <!-- Purchase feedback -->
    <div v-if="purchaseMessage" class="purchase-feedback">
      {{ purchaseMessage }}
    </div>

    <!-- Shop items -->
    <div class="shop-list">
      <button
        v-for="item in shopItems"
        :key="item.id"
        class="shop-item"
        :class="{
          'out-of-stock': !item.inStock,
          'flash': purchaseFlash === item.id
        }"
        :disabled="!item.affordable || !item.inStock"
        @click="buyItem(item.id)"
      >
        <div class="item-left">
          <span class="item-icon">{{ getItemIcon(item) }}</span>
          <div class="item-details">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-desc">{{ item.description }}</span>
          </div>
        </div>
        <div class="item-right">
          <span class="item-stock" :class="{ 'stock-low': item.maxStock && item.stock <= 1 }">
            {{ formatStock(item) }}
          </span>
          <span class="item-cost" :class="{ 'cannot-afford': !item.affordable }">
            <img :src="dregsIcon" alt="Dregs" class="dregs-inline-icon" /> {{ item.cost }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dregs-inline-icon {
  width: 14px;
  height: 14px;
  vertical-align: middle;
}

.dregs-shop {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  z-index: 1;
}

.dregs-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: 10px;
  padding: 10px 16px;
}

.balance-label {
  color: #9ca3af;
  font-size: 0.9rem;
  font-weight: 500;
}

.balance-value {
  color: #4ade80;
  font-weight: 700;
  font-size: 1.1rem;
}

.purchase-feedback {
  text-align: center;
  color: #4ade80;
  font-size: 0.85rem;
  font-weight: 600;
  animation: fade-in-out 1.2s ease;
}

@keyframes fade-in-out {
  0% { opacity: 0; transform: translateY(4px); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

.shop-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shop-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  font-family: inherit;
  text-align: left;
}

.shop-item:not(:disabled):hover {
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(30, 41, 59, 0.9);
  transform: translateY(-1px);
}

.shop-item:not(:disabled):active {
  transform: translateY(0);
}

.shop-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.shop-item.out-of-stock {
  opacity: 0.35;
}

.shop-item.flash {
  border-color: #4ade80;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.3);
}

.item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.item-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-name {
  color: #f3f4f6;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-desc {
  color: #6b7280;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 10px;
}

.item-stock {
  color: #6b7280;
  font-size: 0.7rem;
}

.item-stock.stock-low {
  color: #f59e0b;
}

.item-cost {
  color: #4ade80;
  font-weight: 700;
  font-size: 0.85rem;
}

.item-cost.cannot-afford {
  color: #ef4444;
}
</style>
