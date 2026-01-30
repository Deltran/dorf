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
      <button class="back-btn" @click="emit('navigate', 'fellowship-hall')">Back</button>
      <h1>Shards</h1>
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
        <h2>Shard Hunting</h2>
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
        <h2>Shard Progress</h2>

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
.shards-screen {
  min-height: 100vh;
  background: #111827;
  padding: 1rem;
}

.screen-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.screen-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.back-btn {
  background: #374151;
  border: none;
  color: #f3f4f6;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

/* Locked state */
.locked-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.locked-content {
  text-align: center;
  padding: 2rem;
}

.lock-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.locked-content h2 {
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.locked-content p {
  color: #6b7280;
}

.hint {
  font-size: 0.875rem;
  margin-top: 1rem;
}

/* Hunting section */
.hunting-section {
  margin-bottom: 2rem;
}

.hunting-section h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.section-desc {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.hunting-slots {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.hunting-slot {
  flex: 1;
  min-width: 100px;
  background: #1f2937;
  border: 2px dashed #374151;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  text-align: center;
}

.hunting-slot:hover {
  border-color: #4b5563;
}

.slot-hero {
  position: relative;
}

.slot-hero .hero-name {
  font-size: 0.75rem;
  color: #f3f4f6;
}

.clear-btn {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: #ef4444;
  border: none;
  color: white;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  line-height: 1;
}

.slot-empty {
  color: #6b7280;
}

.random-icon {
  font-size: 1.5rem;
  display: block;
}

.random-text {
  font-size: 0.75rem;
}

/* Progress section */
.progress-section h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.hero-shard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hero-shard-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #1f2937;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.hero-shard-row:hover {
  background: #374151;
}

.hero-info {
  flex: 1;
}

.hero-info .hero-name {
  display: block;
  font-weight: 500;
}

.hero-info .hero-level {
  font-size: 0.75rem;
  color: #6b7280;
}

.shard-info {
  text-align: right;
}

.shard-count {
  font-size: 0.875rem;
  color: #a855f7;
}

.tier-pips {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  margin-top: 4px;
}

.pip {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #374151;
}

.pip.filled {
  background: #a855f7;
}

.upgrade-hint {
  font-size: 0.75rem;
  color: #6b7280;
  min-width: 60px;
  text-align: right;
}

.upgrade-hint.max {
  color: #22c55e;
  font-weight: 500;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #1f2937;
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 280px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal h3 {
  margin: 0 0 1rem 0;
}

.hero-picker-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.picker-item {
  padding: 0.75rem;
  background: #374151;
  border-radius: 6px;
  cursor: pointer;
}

.picker-item:hover {
  background: #4b5563;
}

.cancel-btn {
  width: 100%;
  padding: 0.75rem;
  background: #374151;
  border: none;
  color: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
}
</style>
