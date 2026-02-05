<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useShopsStore, useGachaStore, useInventoryStore } from '../stores'
import { useQuestsStore } from '../stores/quests'
import { useShardsStore } from '../stores/shards'
import { useEquipmentStore } from '../stores/equipment'
import { useColosseumStore } from '../stores/colosseum'
import { useGemShopStore } from '../stores/gemShop'
import { getAllShops, getShop } from '../data/shops.js'
import { getItem } from '../data/items.js'
import StarRating from '../components/StarRating.vue'
import BlacksmithSection from '../components/BlacksmithSection.vue'
import laurelIcon from '../assets/icons/laurels.png'
import gemIcon from '../assets/icons/gems.png'
import goldIcon from '../assets/icons/gold.png'
import codexIcon from '../assets/icons/codex.png'
import dragonHeartIcon from '../assets/icons/dragon_heart.png'
import dragonShardIcon from '../assets/icons/shard_of_dragon_heart.png'
import gemShopBg from '../assets/backgrounds/gem_shop_bg.png'

// Map item icon property to imported icons
const itemIconImages = {
  dragon_heart: dragonHeartIcon,
  shard_of_dragon_heart: dragonShardIcon
}

const enemyPortraits = import.meta.glob('../assets/enemies/*_portrait.png', { eager: true, import: 'default' })
const battleBackgrounds = import.meta.glob('../assets/battle_backgrounds/*.png', { eager: true, import: 'default' })

function getSectionPortrait(section) {
  const path = `../assets/enemies/${section.id}_portrait.png`
  return enemyPortraits[path] || null
}

function getSectionBackground(section) {
  const nodeId = section.unlockCondition?.completedNode
  if (!nodeId) return null
  const path = `../assets/battle_backgrounds/${nodeId}.png`
  return battleBackgrounds[path] || null
}

const emit = defineEmits(['navigate'])

const shopsStore = useShopsStore()
const gachaStore = useGachaStore()
const inventoryStore = useInventoryStore()
const questsStore = useQuestsStore()
const shardsStore = useShardsStore()
const equipmentStore = useEquipmentStore()
const colosseumStore = useColosseumStore()
const gemShopStore = useGemShopStore()

// Track if blacksmith tab is active
const showBlacksmith = ref(false)
const showLaurelShop = ref(false)
const showGemShop = ref(false)

// Laurel shop data
const laurelShopItems = computed(() => colosseumStore.getColosseumShopDisplay())

// Gem shop data
const gemShopItems = computed(() => gemShopStore.getTodaysItems())
const gemShopResetTime = computed(() => gemShopStore.getTimeUntilReset())
const gemShopHasItems = computed(() => gemShopItems.value.length > 0)

function purchaseGemShopItem(itemId) {
  const result = gemShopStore.purchaseItem(itemId)
  purchaseMessage.value = result
  setTimeout(() => {
    purchaseMessage.value = null
  }, result.success ? 1500 : 2500)
}

function isGemShopItemPurchased(itemId) {
  return gemShopStore.purchasedToday.includes(itemId)
}

function canAffordGemShopItem(price) {
  return gachaStore.gems >= price
}

const rarityColors = {
  1: '#9ca3af',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f59e0b'
}

function purchaseLaurelItem(itemId) {
  colosseumStore.purchaseColosseumItem(itemId)
}

const shops = getAllShops()
const activeShopId = ref(shops[0]?.id || null)
const purchaseMessage = ref(null)
const confirmingItem = ref(null)
const purchaseQuantity = ref(1)

const activeShop = computed(() => getShop(activeShopId.value))

// Crest shop section filtering
const unlockedSections = computed(() => {
  if (!activeShop.value?.sections) return []
  return activeShop.value.sections.filter(section =>
    questsStore.completedNodes.includes(section.unlockCondition?.completedNode)
  )
})

const isSectionUnlocked = computed(() => {
  return (sectionId) => unlockedSections.value.some(s => s.id === sectionId)
})

const shopInventory = computed(() => {
  if (!activeShop.value) return []

  // For crest shop, filter by unlocked sections
  if (activeShop.value.currency === 'crest') {
    return activeShop.value.inventory.filter(item => {
      if (!isSectionUnlocked.value(item.sectionId)) return false
      if (item.requiresShardsUnlocked && !shardsStore.isUnlocked) return false
      return true
    })
  }

  // For gold/gems shops, map with stock info
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

const getCrestCount = (sectionId) => {
  const section = activeShop.value?.sections?.find(s => s.id === sectionId)
  if (!section) return 0
  return inventoryStore.getItemCount(section.crestId)
}

const currentCurrency = computed(() => {
  if (!activeShop.value) return 0
  if (activeShop.value.currency === 'gems') return gachaStore.gems
  return gachaStore.gold
})

const currencyIconSrc = computed(() => {
  if (!activeShop.value) return goldIcon
  return activeShop.value.currency === 'gems' ? gemIcon : goldIcon
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

const maxPurchaseQuantity = computed(() => {
  const item = confirmingItem.value
  if (!item) return 1
  const shop = activeShop.value
  if (!shop) return 1

  // Available stock
  let stock
  if (shop.currency === 'crest') {
    stock = getItemStock(item)
  } else {
    stock = item.remaining ?? Infinity
  }

  // Affordable quantity
  let affordable
  if (shop.currency === 'crest') {
    const crests = getCrestCount(item.sectionId)
    affordable = Math.floor(crests / item.price)
  } else if (shop.currency === 'gold') {
    affordable = Math.floor(gachaStore.gold / item.price)
  } else if (shop.currency === 'gems') {
    affordable = Math.floor(gachaStore.gems / item.price)
  } else {
    affordable = 1
  }

  return Math.max(1, Math.min(stock, affordable))
})

const totalCost = computed(() => {
  if (!confirmingItem.value) return 0
  return confirmingItem.value.price * purchaseQuantity.value
})

const confirmingItemData = computed(() => {
  if (!confirmingItem.value) return null
  return confirmingItem.value.item || getItem(confirmingItem.value.itemId)
})

function handleItemClick(shopItem) {
  // Check stock for crest shop items
  if (activeShop.value?.currency === 'crest') {
    if (getItemStock(shopItem) === 0) return
    if (getCrestCount(shopItem.sectionId) < shopItem.price) return
  } else {
    if (shopItem.soldOut) return
  }

  confirmingItem.value = shopItem
  purchaseQuantity.value = 1
}

// Crest shop helper methods
function getItemsForSection(sectionId) {
  return shopInventory.value.filter(item => item.sectionId === sectionId)
}

function getItemStock(item) {
  if (item.stockType === 'weekly') {
    return shopsStore.getRemainingWeeklyStock(activeShop.value.id, item.itemId, item.maxStock)
  }
  if (item.maxStock) {
    return shopsStore.getRemainingStock(activeShop.value.id, item.itemId, item.maxStock)
  }
  return Infinity
}

function getWeeklyStockRemaining(item) {
  return shopsStore.getRemainingWeeklyStock(activeShop.value.id, item.itemId, item.maxStock)
}

function getItemIconImage(item) {
  const itemData = getItem(item.itemId)
  if (itemData?.icon && itemIconImages[itemData.icon]) {
    return itemIconImages[itemData.icon]
  }
  return null
}

function getItemIconEmoji(item) {
  if (item.heroId) return '✨'
  const itemData = getItem(item.itemId)
  if (!itemData) return '📦'
  const icons = { xp: '📖', junk: '🪨', token: '🎟️', key: '🗝️', merge: '💎', genusLoci: '🏅' }
  return icons[itemData.type] || '📦'
}

function getItemName(itemId) {
  const itemData = getItem(itemId)
  return itemData?.name || itemId
}

function executePurchase() {
  const shopItem = confirmingItem.value
  if (!shopItem) return
  const qty = purchaseQuantity.value
  const result = shopsStore.purchase(activeShopId.value, shopItem, qty)
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
  purchaseQuantity.value = 1
}

function cancelConfirm() {
  confirmingItem.value = null
  purchaseQuantity.value = 1
}

function adjustQuantity(delta) {
  const newQty = purchaseQuantity.value + delta
  if (newQty >= 1 && newQty <= maxPurchaseQuantity.value) {
    purchaseQuantity.value = newQty
  }
}

function setMaxQuantity() {
  purchaseQuantity.value = maxPurchaseQuantity.value
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
    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'goodsAndMarkets')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Shops</h1>
      <div class="currency-display">
        <img :src="currencyIconSrc" alt="" class="currency-icon-img" />
        <span class="currency-count">{{ currentCurrency.toLocaleString() }}</span>
      </div>
    </header>

    <!-- Shop Tabs -->
    <div class="shop-tabs">
      <button
        v-for="shop in shops"
        :key="shop.id"
        :class="['shop-tab', { active: activeShopId === shop.id && !showBlacksmith && !showLaurelShop && !showGemShop }]"
        @click="activeShopId = shop.id; showBlacksmith = false; showLaurelShop = false; showGemShop = false"
      >
        {{ shop.name }}
      </button>
      <button
        v-if="gemShopHasItems"
        :class="['shop-tab', 'gem-tab', { active: showGemShop }]"
        @click="showGemShop = true; showBlacksmith = false; showLaurelShop = false"
      >
        Gem Shop
      </button>
      <button
        v-if="colosseumStore.colosseumUnlocked"
        :class="['shop-tab', 'laurel-tab', { active: showLaurelShop }]"
        @click="showLaurelShop = true; showBlacksmith = false; showGemShop = false"
      >
        Laurel Shop
      </button>
      <button
        v-if="equipmentStore.blacksmithUnlocked"
        :class="['shop-tab', 'blacksmith-tab', { active: showBlacksmith }]"
        @click="showBlacksmith = true; showLaurelShop = false; showGemShop = false"
      >
        Blacksmith
      </button>
    </div>

    <!-- Blacksmith Section -->
    <BlacksmithSection v-if="showBlacksmith" />

    <!-- Gem Shop Section -->
    <div v-else-if="showGemShop" class="gem-shop-section">
      <div class="gem-shop-background" :style="{ backgroundImage: `url(${gemShopBg})` }"></div>
      <div class="gem-shop-vignette"></div>

      <div class="gem-shop-header">
        <div class="gem-balance">
          <img :src="gemIcon" alt="Gems" class="gem-icon-img" />
          <span class="gem-count">{{ gachaStore.gems.toLocaleString() }}</span>
        </div>
        <div class="gem-shop-reset">
          <span class="reset-icon">🕐</span>
          <span>Refreshes in {{ gemShopResetTime.hours }}h {{ gemShopResetTime.minutes }}m</span>
        </div>
      </div>

      <div class="gem-shop-subtitle">Two items available daily from your quest pool</div>

      <div class="gem-shop-items">
        <div
          v-for="shopItem in gemShopItems"
          :key="shopItem.id"
          :class="[
            'gem-shop-card',
            `rarity-${shopItem.item.rarity}`,
            { 'purchased': isGemShopItemPurchased(shopItem.id) },
            { 'cannot-afford': !canAffordGemShopItem(shopItem.price) && !isGemShopItemPurchased(shopItem.id) }
          ]"
        >
          <div v-if="isGemShopItemPurchased(shopItem.id)" class="sold-overlay">SOLD</div>

          <div class="card-icon">{{ typeIcon(shopItem.item.type) }}</div>
          <div class="card-name">{{ shopItem.item.name }}</div>
          <div class="card-stars" :style="{ color: rarityColors[shopItem.item.rarity] }">
            {{ '★'.repeat(shopItem.item.rarity) }}
          </div>
          <div class="card-price">
            <img :src="gemIcon" alt="Gems" class="price-gem-img" />
            <span class="price-amount">{{ shopItem.price }}</span>
          </div>
          <button
            class="buy-btn"
            :disabled="isGemShopItemPurchased(shopItem.id) || !canAffordGemShopItem(shopItem.price)"
            @click="purchaseGemShopItem(shopItem.id)"
          >
            {{ isGemShopItemPurchased(shopItem.id) ? 'Purchased' : 'Buy' }}
          </button>
        </div>
      </div>

      <div v-if="gemShopItems.length === 0" class="gem-shop-empty">
        <p>Complete quest nodes to unlock items in the Gem Shop!</p>
      </div>
    </div>

    <!-- Laurel Shop Section -->
    <div v-else-if="showLaurelShop" class="laurel-shop-section">
      <div class="laurel-shop-header">
        <div class="laurel-balance">
          <img :src="laurelIcon" alt="Laurels" class="laurel-icon" />
          <span class="laurel-count">{{ colosseumStore.laurels }}</span>
        </div>
        <div class="laurel-income">
          <span class="income-label">Daily:</span>
          <span class="income-value">+{{ colosseumStore.getDailyIncome() }} <img :src="laurelIcon" alt="" class="inline-laurel" /></span>
        </div>
      </div>

      <!-- Exclusive Heroes -->
      <div class="laurel-category">
        <h3 class="category-title">Exclusive Heroes</h3>
        <div class="laurel-hero-grid">
          <div
            v-for="item in laurelShopItems.filter(i => i.type === 'exclusive_hero')"
            :key="item.id"
            class="laurel-hero-card"
            :style="{ borderColor: rarityColors[item.rarity] || '#9ca3af' }"
          >
            <div class="hero-stars" :style="{ color: rarityColors[item.rarity] }">
              {{ '★'.repeat(item.rarity) }}
            </div>
            <div class="hero-name">{{ item.name }}</div>
            <div class="hero-coming-soon">Coming Soon</div>
            <div class="hero-cost">{{ item.cost }} <img :src="laurelIcon" alt="" class="inline-laurel" /></div>
          </div>
        </div>
      </div>

      <!-- Resources -->
      <div class="laurel-category">
        <h3 class="category-title">Resources</h3>
        <div class="laurel-items-list">
          <div
            v-for="item in laurelShopItems.filter(i => i.type !== 'exclusive_hero')"
            :key="item.id"
            class="laurel-item-row"
          >
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span v-if="item.maxStock" class="item-stock">{{ item.remainingStock }}/{{ item.maxStock }}</span>
            </div>
            <button
              class="laurel-buy-btn"
              :disabled="colosseumStore.laurels < item.cost || (item.maxStock && item.remainingStock <= 0)"
              @click="purchaseLaurelItem(item.id)"
            >
              {{ item.cost }} <img :src="laurelIcon" alt="" class="inline-laurel" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Shop Info -->
    <div v-if="activeShop && !showBlacksmith && !showLaurelShop && !showGemShop" class="shop-info">
      <div class="shop-name">{{ activeShop.name }}</div>
      <div class="shop-description">{{ activeShop.description }}</div>
      <div class="reset-timer">
        <span class="timer-icon">🕐</span>
        <span>Resets in {{ resetTimer }}</span>
      </div>
    </div>

    <!-- Crest Shop Sectioned Layout -->
    <template v-if="activeShop?.currency === 'crest' && !showBlacksmith && !showLaurelShop && !showGemShop">
      <div v-if="unlockedSections.length === 0" class="no-sections">
        <p>Defeat a Genus Loci to unlock their offerings.</p>
      </div>

      <div v-for="section in unlockedSections" :key="section.id" class="shop-section">
        <div class="section-header"
          :style="getSectionBackground(section) ? {
            backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%), url(${getSectionBackground(section)})`
          } : {}"
        >
          <img
            v-if="getSectionPortrait(section)"
            :src="getSectionPortrait(section)"
            :alt="section.name"
            class="section-portrait"
          />
          <span class="section-name">{{ section.name }}</span>
          <span class="section-currency"><img :src="laurelIcon" alt="Laurels" class="inline-icon" /> {{ getCrestCount(section.id) }}</span>
        </div>

        <div class="item-grid">
          <div
            v-for="item in getItemsForSection(section.id)"
            :key="`${section.id}-${item.itemId}`"
            class="shop-item"
            :class="{
              'sold-out': getItemStock(item) === 0,
              'cannot-afford': getCrestCount(section.id) < item.price
            }"
            @click="handleItemClick(item)"
          >
            <div class="item-header">
              <img v-if="getItemIconImage(item)" :src="getItemIconImage(item)" alt="" class="item-type-icon-img" />
              <span v-else class="item-type-icon">{{ getItemIconEmoji(item) }}</span>
            </div>
            <div class="item-body">
              <div class="item-name">{{ item.name || getItemName(item.itemId) }}</div>
            </div>
            <div class="item-footer">
              <div class="item-price">
                <img :src="laurelIcon" alt="Laurels" class="price-icon-img" />
                <span class="price-value">{{ item.price }}</span>
              </div>
              <div v-if="item.stockType === 'weekly'" class="item-stock">
                {{ getWeeklyStockRemaining(item) }}/{{ item.maxStock }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Gold/Gems Item Grid -->
    <div v-else-if="!showBlacksmith && !showLaurelShop && !showGemShop" class="item-grid">
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
            <img :src="currencyIconSrc" alt="" class="price-icon-img" />
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

    <!-- Purchase Dialog -->
    <div v-if="confirmingItem" class="confirm-backdrop" @click="cancelConfirm">
      <div class="confirm-modal" @click.stop>
        <h3>Purchase</h3>
        <div class="purchase-item-name">
          {{ confirmingItem.name || confirmingItemData?.name }}
        </div>

        <p v-if="confirmingItemData?.description" class="purchase-item-desc">
          {{ confirmingItemData.description }}
        </p>

        <div v-if="confirmingItemData?.xpValue" class="purchase-item-effect">
          XP Value: <span class="effect-value">+{{ confirmingItemData.xpValue }}</span>
        </div>

        <div class="quantity-row">
          <button class="qty-btn" :disabled="purchaseQuantity <= 1" @click="adjustQuantity(-1)">-</button>
          <span class="qty-value">{{ purchaseQuantity }}</span>
          <button class="qty-btn" :disabled="purchaseQuantity >= maxPurchaseQuantity" @click="adjustQuantity(1)">+</button>
          <button v-if="maxPurchaseQuantity > 1" class="qty-max-btn" @click="setMaxQuantity">Max</button>
        </div>

        <div class="purchase-total">
          <span class="total-label">Total:</span>
          <span class="total-value">
            <template v-if="activeShop?.currency === 'crest'">
              <img :src="laurelIcon" alt="Laurels" class="inline-icon" /> {{ totalCost }}
            </template>
            <template v-else>
              <img :src="currencyIconSrc" alt="" class="inline-icon" /> {{ totalCost.toLocaleString() }}
            </template>
          </span>
        </div>

        <div class="confirm-actions">
          <button class="cancel-btn" @click="cancelConfirm">Cancel</button>
          <button class="confirm-btn" @click="executePurchase">Buy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shops-screen {
  min-height: 100vh;
  padding: 20px;
  padding-top: calc(20px + var(--safe-area-top));
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
  background: #111827;
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

.currency-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.inline-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  vertical-align: middle;
}

.price-icon-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.gem-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.price-gem-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
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

.shop-tab.blacksmith-tab {
  border-color: #dc2626;
}

.shop-tab.blacksmith-tab.active {
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
  border-color: #ef4444;
}

.shop-tab.laurel-tab {
  border-color: #65a30d;
}

.shop-tab.laurel-tab.active {
  background: linear-gradient(135deg, #365314 0%, #3f6212 100%);
  border-color: #84cc16;
}

/* Laurel Shop Section */
.laurel-shop-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.laurel-shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(101, 163, 13, 0.15) 0%, rgba(30, 41, 59, 0.8) 100%);
  border: 1px solid rgba(132, 204, 22, 0.3);
  border-radius: 12px;
  padding: 16px;
}

.laurel-balance {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.3rem;
  font-weight: 700;
  color: #84cc16;
}

.laurel-icon {
  height: 22px;
  width: auto;
  vertical-align: middle;
}

.inline-laurel {
  height: 14px;
  width: auto;
  vertical-align: middle;
  margin-left: 2px;
}

.laurel-income {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 0.9rem;
}

.laurel-income .income-value {
  color: #a3e635;
  font-weight: 600;
}

.laurel-category {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.laurel-category .category-title {
  font-size: 1rem;
  font-weight: 600;
  color: #d1d5db;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #334155;
}

.laurel-hero-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.laurel-hero-card {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 2px solid #334155;
  border-radius: 10px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.laurel-hero-card .hero-stars {
  font-size: 0.8rem;
  letter-spacing: 1px;
}

.laurel-hero-card .hero-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #e5e7eb;
  line-height: 1.2;
}

.laurel-hero-card .hero-coming-soon {
  font-size: 0.65rem;
  color: #6b7280;
  font-style: italic;
}

.laurel-hero-card .hero-cost {
  font-size: 0.8rem;
  font-weight: 700;
  color: #84cc16;
  margin-top: 4px;
}

.laurel-items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.laurel-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px 14px;
}

.laurel-item-row .item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.laurel-item-row .item-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e5e7eb;
}

.laurel-item-row .item-stock {
  font-size: 0.75rem;
  color: #6b7280;
}

.laurel-buy-btn {
  background: linear-gradient(135deg, #365314 0%, #3f6212 100%);
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  color: #ecfccb;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.laurel-buy-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #3f6212 0%, #4d7c0f 100%);
}

.laurel-buy-btn:disabled {
  background: #374151;
  color: #6b7280;
  cursor: not-allowed;
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

.item-type-icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
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

/* Purchase Dialog */
.purchase-item-name {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8px;
}

.purchase-item-desc {
  color: #9ca3af;
  font-size: 0.8rem;
  line-height: 1.4;
  margin: 0 0 8px 0;
}

.purchase-item-effect {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-bottom: 16px;
}

.purchase-item-effect .effect-value {
  color: #4ade80;
  font-weight: 600;
}

.quantity-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.qty-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #4b5563;
  background: rgba(30, 41, 59, 0.8);
  color: #f3f4f6;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover:not(:disabled) {
  background: rgba(55, 65, 81, 0.8);
  border-color: #6b7280;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #f3f4f6;
  min-width: 40px;
  text-align: center;
}

.qty-max-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #4b5563;
  background: rgba(30, 41, 59, 0.8);
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qty-max-btn:hover {
  background: rgba(55, 65, 81, 0.8);
  color: #f3f4f6;
}

.purchase-total {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
}

.total-label {
  color: #9ca3af;
  font-size: 0.9rem;
}

.total-value {
  font-weight: 700;
  color: #f59e0b;
  font-size: 1.1rem;
}

/* Crest Shop Sections */
.shop-section {
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.section-portrait {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(251, 191, 36, 0.6);
  object-fit: cover;
  flex-shrink: 0;
}

.section-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
  flex: 1;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

.section-currency {
  font-size: 1rem;
  color: #fbbf24;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

.no-sections {
  text-align: center;
  padding: 48px 24px;
  color: #9ca3af;
  position: relative;
  z-index: 1;
}

.shop-item.cannot-afford {
  opacity: 0.6;
}

.shop-item.sold-out {
  opacity: 0.4;
  pointer-events: none;
}

/* Gem Shop Tab */
.shop-tab.gem-tab {
  border-color: #8b5cf6;
}

.shop-tab.gem-tab.active {
  background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%);
  border-color: #a78bfa;
}

/* Gem Shop Section */
.gem-shop-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.gem-shop-background {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  height: 100%;
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: -1;
  opacity: 0.6;
}

.gem-shop-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.8) 100%);
  pointer-events: none;
  z-index: -1;
}

.gem-shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(30, 41, 59, 0.9) 100%);
  border: 1px solid rgba(167, 139, 250, 0.3);
  border-radius: 12px;
  padding: 16px;
}

.gem-balance {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.3rem;
  font-weight: 700;
  color: #a78bfa;
}

.gem-icon {
  font-size: 1.2rem;
}

.gem-shop-reset {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 0.85rem;
}

.reset-icon {
  font-size: 0.9rem;
}

.gem-shop-subtitle {
  text-align: center;
  color: #9ca3af;
  font-size: 0.85rem;
  font-style: italic;
}

.gem-shop-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.gem-shop-card {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 2px solid #334155;
  border-radius: 12px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  position: relative;
  transition: all 0.2s ease;
}

.gem-shop-card:hover:not(.purchased):not(.cannot-afford) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

/* Rarity borders for gem shop cards */
.gem-shop-card.rarity-1 { border-color: #9ca3af; }
.gem-shop-card.rarity-2 { border-color: #22c55e; }
.gem-shop-card.rarity-3 { border-color: #3b82f6; }
.gem-shop-card.rarity-4 { border-color: #a855f7; }
.gem-shop-card.rarity-5 { border-color: #f59e0b; }

.gem-shop-card.purchased {
  opacity: 0.5;
}

.gem-shop-card.cannot-afford {
  opacity: 0.6;
}

.sold-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  font-size: 1.8rem;
  font-weight: 900;
  color: #ef4444;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 2px;
  z-index: 2;
}

.card-icon {
  font-size: 2rem;
}

.card-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e5e7eb;
  line-height: 1.2;
}

.card-stars {
  font-size: 0.85rem;
  letter-spacing: 1px;
}

.card-price {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.price-gem {
  font-size: 0.9rem;
}

.price-amount {
  font-size: 1.1rem;
  font-weight: 700;
  color: #a78bfa;
}

.buy-btn {
  margin-top: 8px;
  width: 100%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%);
  border: none;
  border-radius: 8px;
  color: #e9d5ff;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.buy-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.buy-btn:disabled {
  background: #374151;
  color: #6b7280;
  cursor: not-allowed;
}

.gem-shop-empty {
  text-align: center;
  padding: 48px 24px;
  color: #9ca3af;
}
</style>
