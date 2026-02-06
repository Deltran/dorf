<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  boons: { type: Array, required: true },
  playerBoons: { type: Array, default: () => [] },
  showVictory: { type: Boolean, default: false }
})

const emit = defineEmits(['select'])

const selectedBoon = ref(null)
const confirming = ref(false)

const categoryColors = {
  offensive: '#ef4444',
  defensive: '#3b82f6',
  tactical: '#22c55e',
  synergy: '#a855f7'
}

const categoryIcons = {
  offensive: '\u2694\uFE0F',
  defensive: '\u{1F6E1}\uFE0F',
  tactical: '\u2699\uFE0F',
  synergy: '\u{1F517}'
}

const rarityBorderColors = {
  common: '#6b7280',
  rare: '#3b82f6',
  epic: '#a855f7'
}

const rarityGlowColors = {
  common: 'rgba(107, 114, 128, 0.3)',
  rare: 'rgba(59, 130, 246, 0.4)',
  epic: 'rgba(168, 85, 247, 0.5)'
}

const rarityLabels = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic'
}

const playerSeedTags = computed(() => {
  const tags = new Set()
  for (const boon of props.playerBoons) {
    if (boon.isSeed && boon.seedTags) {
      boon.seedTags.forEach(t => tags.add(t))
    }
  }
  return tags
})

function isPayoffMatch(boon) {
  if (!boon.isPayoff || !boon.payoffTags) return false
  return boon.payoffTags.some(t => playerSeedTags.value.has(t))
}

function selectCard(boon) {
  if (confirming.value && selectedBoon.value?.id === boon.id) {
    // Second tap — confirm
    emit('select', boon.id)
    return
  }
  selectedBoon.value = boon
  confirming.value = true
}

function cancelSelection() {
  selectedBoon.value = null
  confirming.value = false
}
</script>

<template>
  <div class="boon-overlay" @click.self="cancelSelection">
    <div class="overlay-content">
      <h2 v-if="showVictory" class="victory-banner">Victory!</h2>
      <h2 class="overlay-title">Choose a Boon</h2>
      <p class="overlay-subtitle">Select one to empower your descent</p>

      <div class="boon-cards">
        <button
          v-for="boon in boons"
          :key="boon.id"
          class="boon-card"
          :class="{
            selected: selectedBoon?.id === boon.id,
            'payoff-match': isPayoffMatch(boon)
          }"
          :style="{
            borderColor: selectedBoon?.id === boon.id
              ? categoryColors[boon.category]
              : rarityBorderColors[boon.rarity],
            boxShadow: selectedBoon?.id === boon.id
              ? `0 0 20px ${categoryColors[boon.category]}40, 0 0 40px ${categoryColors[boon.category]}20`
              : `0 0 12px ${rarityGlowColors[boon.rarity]}`
          }"
          @click="selectCard(boon)"
        >
          <!-- Payoff match golden highlight -->
          <div v-if="isPayoffMatch(boon)" class="payoff-glow"></div>

          <!-- Category accent bar -->
          <div
            class="category-bar"
            :style="{ backgroundColor: categoryColors[boon.category] }"
          ></div>

          <!-- Rarity badge -->
          <div class="boon-header">
            <span
              class="rarity-badge"
              :style="{ color: rarityBorderColors[boon.rarity] }"
            >{{ rarityLabels[boon.rarity] }}</span>
            <span class="category-icon">{{ categoryIcons[boon.category] }}</span>
          </div>

          <!-- Boon name -->
          <h3 class="boon-name">{{ boon.name }}</h3>

          <!-- Description -->
          <p class="boon-description">{{ boon.description }}</p>

          <!-- Seed/Payoff tags -->
          <div class="boon-tags">
            <span v-if="boon.isSeed" class="tag seed-tag">Seed</span>
            <span v-if="boon.isPayoff" class="tag payoff-tag" :class="{ 'payoff-active': isPayoffMatch(boon) }">Payoff</span>
          </div>

          <!-- Confirm prompt -->
          <div v-if="selectedBoon?.id === boon.id && confirming" class="confirm-prompt">
            Tap again to confirm
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.boon-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  padding-top: calc(20px + var(--safe-area-top));
  padding-bottom: calc(20px + var(--safe-area-bottom));
}

.overlay-content {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.victory-banner {
  color: #fbbf24;
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.5), 0 2px 4px rgba(0, 0, 0, 0.5);
}

.overlay-title {
  color: #c4b5fd;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.05em;
  text-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
}

.overlay-subtitle {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
}

.boon-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.boon-card {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1f 100%);
  border: 2px solid #334155;
  border-radius: 12px;
  padding: 16px;
  padding-left: 22px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  width: 100%;
  font-family: inherit;
}

.boon-card:hover {
  transform: translateY(-2px);
}

.boon-card:active {
  transform: translateY(0);
}

.boon-card.selected {
  border-width: 2px;
}

.boon-card.payoff-match {
  background: linear-gradient(135deg, #1a1a2e 0%, #1f1a10 100%);
}

.payoff-glow {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  box-shadow: inset 0 0 30px rgba(245, 158, 11, 0.15);
  pointer-events: none;
}

.category-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 12px 0 0 12px;
}

.boon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.rarity-badge {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.category-icon {
  font-size: 1rem;
}

.boon-name {
  color: #f3f4f6;
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 6px;
}

.boon-description {
  color: #9ca3af;
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0 0 8px;
}

.boon-tags {
  display: flex;
  gap: 6px;
}

.tag {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: 4px;
}

.seed-tag {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.payoff-tag {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.payoff-tag.payoff-active {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.5);
}

.confirm-prompt {
  margin-top: 8px;
  color: #c4b5fd;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  animation: pulse-text 1.2s ease-in-out infinite;
}

@keyframes pulse-text {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
