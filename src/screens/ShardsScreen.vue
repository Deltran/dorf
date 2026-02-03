<script setup>
import { ref, computed } from 'vue'
import { useShardsStore, useHeroesStore } from '../stores'
import { getHeroTemplate } from '../data/heroes/index.js'

const emit = defineEmits(['navigate'])

const shardsStore = useShardsStore()
const heroesStore = useHeroesStore()

const showHeroPicker = ref(false)
const selectedSlot = ref(null)

// Get unique owned hero templates for picker
const ownedTemplates = computed(() => {
  const templateIds = [...new Set(heroesStore.collection.map(h => h.templateId))]
  return templateIds.map(id => getHeroTemplate(id)).filter(Boolean)
})

// Get heroes with their shard data, sorted by shards desc
const heroesWithShards = computed(() => {
  return heroesStore.collection
    .map(hero => ({
      ...heroesStore.getHeroFull(hero.instanceId),
      shards: hero.shards || 0,
      shardTier: hero.shardTier || 0
    }))
    .sort((a, b) => b.shards - a.shards)
})

// Get hunting slot data
const huntingSlotData = computed(() => {
  return shardsStore.huntingSlots.map((templateId, index) => {
    if (!templateId) return { index, template: null }
    return { index, template: getHeroTemplate(templateId) }
  })
})

function openSlotPicker(index) {
  selectedSlot.value = index
  showHeroPicker.value = true
}

function selectHeroForSlot(templateId) {
  if (selectedSlot.value !== null) {
    shardsStore.setHuntingSlot(selectedSlot.value, templateId)
  }
  showHeroPicker.value = false
  selectedSlot.value = null
}

function clearSlot(index) {
  shardsStore.clearHuntingSlot(index)
}

function getNextTierCost(hero) {
  const tier = hero.shardTier || 0
  if (tier >= 3) return null
  return heroesStore.SHARD_TIER_COSTS[tier]
}

function navigateToHero(hero) {
  emit('navigate', 'heroes', hero.instanceId)
}
</script>

<template>
  <div class="shards-screen">
    <header class="screen-header">
      <button class="back-btn" @click="emit('navigate', 'fellowship-hall')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1>Shards</h1>
      <div class="header-spacer"></div>
    </header>

    <!-- Locked state -->
    <div v-if="!shardsStore.isUnlocked" class="locked-overlay">
      <div class="locked-content">
        <div class="lock-icon">🔒</div>
        <h2>Shards Locked</h2>
        <p>Reach <strong>Gate to Aquaria</strong> to unlock the Shard system.</p>
        <p class="hint">Complete the Western Veros regions to discover the path to Aquaria.</p>
      </div>
    </div>

    <!-- Unlocked content -->
    <template v-else>
      <!-- Hunting Loadout Section -->
      <section class="hunting-section">
        <div class="section-header">
          <div class="section-line"></div>
          <h2>Shard Hunting</h2>
          <div class="section-line"></div>
        </div>
        <p class="section-desc">Select up to 5 heroes to hunt shards for. Empty slots roll random heroes.</p>

        <div class="hunting-slots">
          <div
            v-for="slot in huntingSlotData"
            :key="slot.index"
            class="hunting-slot"
            @click="openSlotPicker(slot.index)"
          >
            <template v-if="slot.template">
              <div class="slot-hero">
                <span class="hero-name">{{ slot.template.name }}</span>
                <button class="clear-btn" @click.stop="clearSlot(slot.index)">×</button>
              </div>
            </template>
            <template v-else>
              <div class="slot-empty">
                <span class="random-icon">?</span>
                <span class="random-text">Random</span>
              </div>
            </template>
          </div>
        </div>
      </section>

      <!-- Shard Progress Section -->
      <section class="progress-section">
        <div class="section-header">
          <div class="section-line"></div>
          <h2>Shard Progress</h2>
          <div class="section-line"></div>
        </div>

        <div class="hero-shard-list">
          <div
            v-for="hero in heroesWithShards"
            :key="hero.instanceId"
            class="hero-shard-row"
            @click="navigateToHero(hero)"
          >
            <div class="hero-info">
              <span class="hero-name">{{ hero.template.name }}</span>
              <span class="hero-level">Lv.{{ hero.level }}</span>
            </div>
            <div class="shard-info">
              <span class="shard-count">{{ hero.shards }} shards</span>
              <div class="tier-pips">
                <span
                  v-for="i in 3"
                  :key="i"
                  :class="['pip', { filled: hero.shardTier >= i }]"
                />
              </div>
            </div>
            <div class="upgrade-hint" v-if="getNextTierCost(hero)">
              {{ hero.shards }}/{{ getNextTierCost(hero) }}
            </div>
            <div class="upgrade-hint max" v-else>MAX</div>
          </div>
        </div>
      </section>
    </template>

    <!-- Hero Picker Modal -->
    <div v-if="showHeroPicker" class="modal-overlay" @click="showHeroPicker = false">
      <div class="modal" @click.stop>
        <h3>Select Hero</h3>
        <div class="hero-picker-list">
          <div
            v-for="template in ownedTemplates"
            :key="template.id"
            class="picker-item"
            @click="selectHeroForSlot(template.id)"
          >
            {{ template.name }}
          </div>
        </div>
        <button class="cancel-btn" @click="showHeroPicker = false">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== Base Layout ===== */
.shards-screen {
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

/* ===== Header ===== */
.screen-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.screen-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  text-shadow: 0 2px 10px rgba(168, 85, 247, 0.5);
  flex: 1;
  text-align: center;
}

.header-spacer {
  width: 72px;
}

.back-btn {
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

.back-btn:hover {
  color: #f3f4f6;
  border-color: #4b5563;
  background: rgba(55, 65, 81, 0.8);
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

/* ===== Section Headers ===== */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.section-header h2 {
  font-size: 0.8rem;
  color: #c4b5fd;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin: 0;
  white-space: nowrap;
}

.section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(168, 85, 247, 0.4) 50%, transparent 100%);
}

/* ===== Locked State ===== */
.locked-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  position: relative;
  z-index: 1;
}

.locked-content {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border-radius: 16px;
  border: 1px solid #334155;
  max-width: 320px;
}

.lock-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.8;
}

.locked-content h2 {
  color: #c4b5fd;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
}

.locked-content p {
  color: #9ca3af;
  margin: 0;
  line-height: 1.5;
}

.locked-content .hint {
  font-size: 0.8rem;
  margin-top: 1rem;
  color: #6b7280;
}

/* ===== Hunting Section ===== */
.hunting-section {
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

.section-desc {
  color: #9ca3af;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  text-align: center;
}

.hunting-slots {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.hunting-slot {
  flex: 1;
  min-width: 90px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
  border: 1px solid #374151;
  border-radius: 10px;
  padding: 14px 10px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.hunting-slot::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), transparent);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.hunting-slot:hover {
  border-color: #4b5563;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.hunting-slot:hover::before {
  opacity: 1;
}

.slot-hero {
  position: relative;
}

.slot-hero .hero-name {
  font-size: 0.75rem;
  color: #f3f4f6;
  font-weight: 500;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clear-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  border: none;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.clear-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 8px rgba(239, 68, 68, 0.4);
}

.slot-empty {
  color: #6b7280;
}

.random-icon {
  font-size: 1.4rem;
  display: block;
  color: #a855f7;
  opacity: 0.6;
  margin-bottom: 4px;
}

.random-text {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ===== Progress Section ===== */
.progress-section {
  position: relative;
  z-index: 1;
  flex: 1;
}

.hero-shard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hero-shard-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid #334155;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.hero-shard-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #a855f7 0%, #7c3aed 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.hero-shard-row:hover {
  border-color: #4b5563;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.hero-shard-row:hover::before {
  opacity: 1;
}

.hero-info {
  flex: 1;
  min-width: 0;
}

.hero-info .hero-name {
  display: block;
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-info .hero-level {
  font-size: 0.75rem;
  color: #6b7280;
}

.shard-info {
  text-align: right;
}

.shard-count {
  font-size: 0.85rem;
  color: #c4b5fd;
  font-weight: 500;
}

.tier-pips {
  display: flex;
  gap: 5px;
  justify-content: flex-end;
  margin-top: 5px;
}

.pip {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #374151;
  border: 1px solid #4b5563;
  transition: all 0.3s ease;
}

.pip.filled {
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
  border-color: #c084fc;
  box-shadow: 0 0 6px rgba(168, 85, 247, 0.5);
}

.upgrade-hint {
  font-size: 0.75rem;
  color: #6b7280;
  min-width: 55px;
  text-align: right;
  font-weight: 500;
}

.upgrade-hint.max {
  color: #22c55e;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
}

/* ===== Modal ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 0;
  min-width: 280px;
  max-width: 90%;
  max-height: 80vh;
  overflow: hidden;
  border: 1px solid #334155;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.modal h3 {
  margin: 0;
  padding: 16px 20px;
  font-size: 1.1rem;
  color: #f3f4f6;
  border-bottom: 1px solid #334155;
  text-align: center;
}

.hero-picker-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.picker-item {
  padding: 12px 14px;
  background: rgba(55, 65, 81, 0.5);
  border-radius: 8px;
  cursor: pointer;
  color: #f3f4f6;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.picker-item:hover {
  background: rgba(75, 85, 99, 0.6);
  border-color: #4b5563;
  transform: translateX(4px);
}

.cancel-btn {
  width: calc(100% - 40px);
  margin: 0 20px 16px;
  padding: 12px;
  background: rgba(55, 65, 81, 0.6);
  border: 1px solid #4b5563;
  color: #9ca3af;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: rgba(75, 85, 99, 0.8);
  color: #f3f4f6;
}
</style>
