<script setup>
import { ref, computed } from 'vue'
import { useGenusLociStore, useInventoryStore } from '../stores'
import { getGenusLoci, getAllGenusLoci } from '../data/genusLoci.js'
import { getAllQuestNodes } from '../data/quests/index.js'
import { items } from '../data/items.js'

// Enemy portraits for genus loci
const enemyPortraits = import.meta.glob('../assets/enemies/*_portrait.png', { eager: true, import: 'default' })

// Battle backgrounds for genus loci cards
const battleBackgrounds = import.meta.glob('../assets/battle_backgrounds/*.png', { eager: true, import: 'default' })

function getBossPortraitUrl(bossId) {
  const portraitPath = `../assets/enemies/${bossId}_portrait.png`
  return enemyPortraits[portraitPath] || null
}

function getBossBackgroundUrl(bossId) {
  // Find the quest node that has this genusLociId
  const questNode = getAllQuestNodes().find(n => n.genusLociId === bossId)
  if (questNode) {
    const bgPath = `../assets/battle_backgrounds/${questNode.id}.png`
    if (battleBackgrounds[bgPath]) {
      return battleBackgrounds[bgPath]
    }
  }
  return null
}

const emit = defineEmits(['navigate', 'startGenusLociBattle'])

const props = defineProps({
  selectedBossId: {
    type: String,
    default: null
  }
})

const genusLociStore = useGenusLociStore()
const inventoryStore = useInventoryStore()

const selectedBoss = computed(() => {
  if (props.selectedBossId) {
    return getGenusLoci(props.selectedBossId)
  }
  return null
})

const selectedLevel = ref(null)

const availableLevels = computed(() => {
  if (!selectedBoss.value) return []
  return genusLociStore.getAvailableLevels(selectedBoss.value.id)
})

const highestCleared = computed(() => {
  if (!selectedBoss.value) return 0
  return genusLociStore.getHighestCleared(selectedBoss.value.id)
})

const keyCount = computed(() => {
  if (!selectedBoss.value) return 0
  return inventoryStore.getItemCount(selectedBoss.value.keyItemId)
})

const canChallenge = computed(() => {
  return selectedLevel.value && keyCount.value > 0
})

function selectLevel(level) {
  selectedLevel.value = level
}

function startBattle() {
  if (!canChallenge.value) return
  emit('startGenusLociBattle', {
    genusLociId: selectedBoss.value.id,
    powerLevel: selectedLevel.value
  })
}

function calculateGoldReward(level) {
  if (!selectedBoss.value) return null
  const { base, perLevel } = selectedBoss.value.currencyRewards
  if (!base.gold) return null
  return base.gold + (perLevel.gold || 0) * (level - 1)
}

function calculateGemsReward(level) {
  if (!selectedBoss.value) return null
  const { base, perLevel } = selectedBoss.value.currencyRewards
  if (!base.gems) return null
  return base.gems + (perLevel.gems || 0) * (level - 1)
}

const itemDropsDisplay = computed(() => {
  if (!selectedBoss.value?.itemDrops) return []
  return selectedBoss.value.itemDrops.map(drop => {
    const item = items[drop.itemId]
    if (!item) return null
    const qty = drop.min === drop.max ? `${drop.min}` : `${drop.min}-${drop.max}`
    return {
      icon: '📜',
      name: item.name,
      qty,
      isPerLevel: drop.perLevel || false
    }
  }).filter(Boolean)
})

function goBack() {
  emit('navigate', 'genus-loci-list')
}
</script>

<template>
  <div class="genus-loci-screen">
    <header class="screen-header">
      <button class="back-button" @click="goBack">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">{{ selectedBoss?.name || 'Genus Loci' }}</h1>
      <div class="header-spacer"></div>
    </header>

    <div v-if="selectedBoss" class="boss-detail">
      <div
        class="boss-header"
        :style="getBossBackgroundUrl(selectedBoss.id) ? { backgroundImage: `url(${getBossBackgroundUrl(selectedBoss.id)})` } : {}"
      >
        <div class="boss-header-overlay"></div>
        <div class="boss-icon">
          <img
            v-if="getBossPortraitUrl(selectedBoss.id)"
            :src="getBossPortraitUrl(selectedBoss.id)"
            :alt="selectedBoss.name"
            class="boss-portrait"
          />
          <span v-else>👹</span>
        </div>
        <div class="boss-title">
          <p class="boss-description">{{ selectedBoss.description }}</p>
        </div>
      </div>

      <div :class="['key-status', { 'no-keys': keyCount === 0, 'low-keys': keyCount === 1 }]">
        <div class="key-icon-wrapper">
          <div class="key-glow"></div>
          <span class="key-icon">🔑</span>
        </div>
        <div class="key-info">
          <div class="key-count-row">
            <span class="key-count">{{ keyCount }}</span>
            <span v-if="keyCount === 1" class="last-key-warning">Last one!</span>
          </div>
          <span class="key-label">{{ keyCount === 0 ? 'No Keys' : keyCount === 1 ? 'Key Remaining' : 'Keys Available' }}</span>
        </div>
        <div v-if="keyCount === 0" class="key-empty-state">
          <span class="empty-icon">📜</span>
          <span class="empty-text">Complete quests to earn keys</span>
        </div>
        <div v-else-if="keyCount >= 3" class="key-plenty">
          <span class="plenty-text">Ready to challenge</span>
        </div>
      </div>

      <div class="level-selection">
        <div class="section-header">
          <div class="section-line"></div>
          <h3>Power Level</h3>
          <div class="section-line"></div>
        </div>

        <div class="level-track">
          <div class="track-line">
            <div class="track-progress" :style="{ width: selectedLevel ? `${((selectedLevel - 1) / (availableLevels.length - 1)) * 100}%` : '0%' }"></div>
          </div>
          <div class="level-nodes">
            <button
              v-for="level in availableLevels"
              :key="level"
              :class="['level-node', {
                selected: selectedLevel === level,
                cleared: level <= highestCleared,
                danger: level > 5
              }]"
              :style="{ '--danger-level': Math.min((level - 1) / 9, 1) }"
              @click="selectLevel(level)"
            >
              <div class="node-glow"></div>
              <div class="node-ring"></div>
              <span class="node-number">{{ level }}</span>
              <span v-if="level <= highestCleared" class="node-cleared">✓</span>
            </button>
          </div>
        </div>

        <div v-if="selectedLevel" class="level-detail">
          <div class="detail-card">
            <div class="detail-header">
              <span class="detail-level">Lv.{{ selectedLevel }}</span>
              <span :class="['detail-difficulty', { hard: selectedLevel > 5, extreme: selectedLevel > 8 }]">
                {{ selectedLevel <= 3 ? 'Normal' : selectedLevel <= 5 ? 'Hard' : selectedLevel <= 8 ? 'Brutal' : 'Nightmare' }}
              </span>
            </div>
            <div class="detail-rewards">
              <div v-if="calculateGoldReward(selectedLevel)" class="reward-item gold">
                <span class="reward-icon">🪙</span>
                <span class="reward-value">{{ calculateGoldReward(selectedLevel) }}</span>
              </div>
              <div v-if="calculateGemsReward(selectedLevel)" class="reward-item gems">
                <span class="reward-icon">💎</span>
                <span class="reward-value">{{ calculateGemsReward(selectedLevel) }}</span>
              </div>
              <div v-for="(drop, i) in itemDropsDisplay" :key="i" class="reward-item item">
                <span class="reward-icon">{{ drop.icon }}</span>
                <span class="reward-value">{{ drop.qty }}<span v-if="drop.isPerLevel" class="per-level">/lvl</span></span>
              </div>
            </div>
            <div v-if="selectedLevel && highestCleared === 0" class="first-clear-badge">
              First Clear Bonus
            </div>
          </div>
        </div>

        <div v-else class="level-prompt">
          <span class="prompt-icon">👆</span>
          <span class="prompt-text">Select a power level to challenge</span>
        </div>

        <div v-if="availableLevels.length < selectedBoss.maxPowerLevel" class="locked-hint">
          <span class="lock-icon">🔒</span>
          Defeat Lv.{{ availableLevels[availableLevels.length - 1] }} to unlock next
        </div>
      </div>

      <button
        :class="['challenge-btn', {
          'state-no-keys': keyCount === 0,
          'state-select-level': !selectedLevel && keyCount > 0,
          'state-ready': selectedLevel && keyCount > 0
        }]"
        :disabled="!canChallenge"
        @click="startBattle"
      >
        <!-- State: No Keys - Blocked, needs to earn keys -->
        <span v-if="keyCount === 0" class="btn-content btn-blocked">
          <span class="btn-icon-wrapper blocked">
            <span class="btn-icon">🔑</span>
            <span class="btn-icon-slash"></span>
          </span>
          <span class="btn-text">
            <span class="btn-primary">Need Keys</span>
            <span class="btn-secondary">Complete quests to earn</span>
          </span>
        </span>

        <!-- State: Select Level - Waiting for user input -->
        <span v-else-if="!selectedLevel" class="btn-content btn-waiting">
          <span class="btn-icon-wrapper waiting">
            <span class="btn-icon">👆</span>
          </span>
          <span class="btn-text">
            <span class="btn-primary">Choose a Level Above</span>
          </span>
        </span>

        <!-- State: Ready - Can challenge -->
        <span v-else class="btn-content btn-ready">
          <span class="btn-icon-wrapper ready">
            <span class="btn-icon">⚔️</span>
          </span>
          <span class="btn-text">
            <span class="btn-primary">Begin Challenge</span>
            <span class="btn-secondary">Level {{ selectedLevel }} · {{ selectedLevel <= 3 ? 'Normal' : selectedLevel <= 5 ? 'Hard' : selectedLevel <= 8 ? 'Brutal' : 'Nightmare' }}</span>
          </span>
          <span class="btn-cost">
            <span class="cost-icon">🔑</span>
            <span class="cost-value">1</span>
          </span>
        </span>
      </button>
    </div>

    <div v-else class="no-boss-selected">
      <div class="empty-icon">👹</div>
      <p class="empty-text">No Genus Loci selected</p>
      <p class="empty-hint">Return to the list to choose a guardian to challenge.</p>
      <button class="back-btn-large" @click="goBack">
        <span>← Return to List</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ===== Base Layout ===== */
.genus-loci-screen {
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
  font-size: 1.4rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
  text-shadow: 0 2px 10px rgba(147, 51, 234, 0.4);
  text-align: center;
  flex: 1;
}

.header-spacer {
  width: 70px;
}

/* ===== Boss Detail ===== */
.boss-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.boss-header {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #2a1f3d 0%, #1f2937 100%);
  background-size: cover;
  background-position: center;
  border-radius: 16px;
  border: 1px solid #6b21a8;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(147, 51, 234, 0.2);
}

.boss-header-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(42, 31, 61, 0.85) 0%, rgba(31, 41, 55, 0.8) 100%);
  z-index: 0;
}

.boss-header > *:not(.boss-header-overlay) {
  position: relative;
  z-index: 1;
}

.boss-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(147, 51, 234, 0.3);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
  border: 2px solid rgba(147, 51, 234, 0.5);
}

.boss-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.boss-title {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.boss-description {
  margin: 0;
  color: #d1d5db;
  font-size: 0.9rem;
  line-height: 1.5;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* ===== Key Status ===== */
.key-status {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
  border-radius: 12px;
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-left: 4px solid #fbbf24;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

/* Shimmer effect for normal state */
.key-status::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(251, 191, 36, 0.05) 50%,
    transparent 100%
  );
  animation: keyShimmer 4s ease-in-out infinite;
}

@keyframes keyShimmer {
  0%, 100% { left: -100%; }
  50% { left: 100%; }
}

/* Low keys - anxious state */
.key-status.low-keys {
  border-left-color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.3);
  background: linear-gradient(135deg, rgba(48, 42, 31, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%);
  animation: lowKeysPulse 3s ease-in-out infinite;
}

.key-status.low-keys::before {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(245, 158, 11, 0.08) 50%,
    transparent 100%
  );
  animation: keyShimmer 2.5s ease-in-out infinite;
}

@keyframes lowKeysPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
  50% {
    box-shadow: 0 0 20px 2px rgba(245, 158, 11, 0.15);
  }
}

/* No keys - urgent empty state */
.key-status.no-keys {
  border-left-color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
  background: linear-gradient(135deg, rgba(48, 31, 31, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%);
  animation: none;
}

.key-status.no-keys::before {
  animation: none;
  opacity: 0;
}

/* Key icon wrapper */
.key-icon-wrapper {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(251, 191, 36, 0.12);
  border-radius: 10px;
  position: relative;
  flex-shrink: 0;
}

.key-glow {
  position: absolute;
  inset: -4px;
  border-radius: 14px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%);
  opacity: 0.6;
  animation: keyGlowPulse 2.5s ease-in-out infinite;
}

@keyframes keyGlowPulse {
  0%, 100% { opacity: 0.4; transform: scale(0.95); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

.low-keys .key-glow {
  background: radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%);
  animation: lastKeyGlow 1.5s ease-in-out infinite;
}

@keyframes lastKeyGlow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}

.no-keys .key-glow {
  opacity: 0;
  animation: none;
}

.key-icon {
  font-size: 1.4rem;
  position: relative;
  z-index: 1;
  animation: keyFloat 3s ease-in-out infinite;
}

@keyframes keyFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-2px) rotate(-5deg); }
  75% { transform: translateY(1px) rotate(3deg); }
}

.low-keys .key-icon {
  animation: lastKeyShake 0.8s ease-in-out infinite;
}

@keyframes lastKeyShake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(-2px) rotate(-8deg); }
  75% { transform: translateX(2px) rotate(8deg); }
}

.no-keys .key-icon {
  animation: none;
  opacity: 0.35;
  filter: grayscale(0.8);
}

.no-keys .key-icon-wrapper {
  background: rgba(107, 114, 128, 0.15);
}

/* Key info */
.key-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 2px;
}

.key-count-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.key-count {
  font-size: 1.4rem;
  font-weight: 800;
  color: #fbbf24;
  text-shadow: 0 0 12px rgba(251, 191, 36, 0.4);
  transition: all 0.3s ease;
}

.low-keys .key-count {
  color: #f59e0b;
  text-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
  animation: countPulse 1.5s ease-in-out infinite;
}

@keyframes countPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.no-keys .key-count {
  color: #ef4444;
  text-shadow: none;
  opacity: 0.7;
}

.last-key-warning {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
  animation: warningBlink 2s ease-in-out infinite;
}

@keyframes warningBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.key-label {
  color: #9ca3af;
  font-size: 0.75rem;
  letter-spacing: 0.3px;
}

.no-keys .key-label {
  color: #6b7280;
}

/* Empty state - no keys */
.key-empty-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  margin-left: auto;
}

.key-empty-state .empty-icon {
  font-size: 1rem;
  animation: scrollBounce 2s ease-in-out infinite;
}

@keyframes scrollBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.key-empty-state .empty-text {
  font-size: 0.7rem;
  color: #9ca3af;
  line-height: 1.3;
}

/* Plenty state - comfortable */
.key-plenty {
  margin-left: auto;
}

.key-plenty .plenty-text {
  font-size: 0.7rem;
  color: #86efac;
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .key-status::before,
  .key-glow,
  .key-icon,
  .key-count,
  .last-key-warning,
  .key-empty-state .empty-icon,
  .key-status.low-keys {
    animation: none !important;
  }

  .key-glow {
    opacity: 0.5;
  }
}

/* ===== Section Header ===== */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.section-header h3 {
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
  background: linear-gradient(90deg, transparent 0%, rgba(147, 51, 234, 0.4) 50%, transparent 100%);
}

/* ===== Level Selection ===== */
.level-selection {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #334155;
}

/* Level Track - Horizontal progression */
.level-track {
  position: relative;
  padding: 20px 0 16px;
}

.track-line {
  position: absolute;
  top: 50%;
  left: 24px;
  right: 24px;
  height: 4px;
  background: rgba(75, 85, 99, 0.5);
  border-radius: 2px;
  transform: translateY(-50%);
  margin-top: -8px;
}

.track-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #7c3aed 0%, #9333ea 100%);
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 12px rgba(147, 51, 234, 0.6);
}

.level-nodes {
  display: flex;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.level-node {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
  border: 3px solid rgba(75, 85, 99, 0.6);
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.node-glow {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.node-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.level-node:hover {
  transform: scale(1.15);
  border-color: rgba(147, 51, 234, 0.6);
}

.level-node:hover .node-glow {
  opacity: 0.5;
}

/* Danger escalation - nodes get more ominous at higher levels */
.level-node.danger {
  border-color: rgba(239, 68, 68, calc(0.3 + var(--danger-level) * 0.4));
}

.level-node.danger .node-glow {
  background: radial-gradient(circle,
    rgba(239, 68, 68, calc(0.2 + var(--danger-level) * 0.3)) 0%,
    transparent 70%
  );
}

.level-node.danger:hover {
  border-color: rgba(239, 68, 68, 0.8);
}

/* Selected state - dramatic commitment */
.level-node.selected {
  transform: scale(1.2);
  border-color: #9333ea;
  background: linear-gradient(145deg, #3b2667 0%, #1e1b4b 100%);
  box-shadow:
    0 0 0 4px rgba(147, 51, 234, 0.2),
    0 0 30px rgba(147, 51, 234, 0.5),
    0 8px 24px rgba(0, 0, 0, 0.4);
}

.level-node.selected .node-glow {
  opacity: 1;
  animation: selectedPulse 2s ease-in-out infinite;
}

.level-node.selected .node-ring {
  border-color: rgba(167, 139, 250, 0.5);
  animation: ringRotate 8s linear infinite;
}

.level-node.selected.danger {
  border-color: #dc2626;
  background: linear-gradient(145deg, #450a0a 0%, #1c1917 100%);
  box-shadow:
    0 0 0 4px rgba(239, 68, 68, 0.2),
    0 0 30px rgba(239, 68, 68, 0.4),
    0 8px 24px rgba(0, 0, 0, 0.4);
}

.level-node.selected.danger .node-glow {
  background: radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, transparent 70%);
}

@keyframes selectedPulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

@keyframes ringRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Cleared state */
.level-node.cleared {
  border-color: rgba(34, 197, 94, 0.5);
}

.level-node.cleared:not(.selected) .node-number {
  color: #86efac;
}

.node-cleared {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  color: white;
  box-shadow: 0 2px 6px rgba(34, 197, 94, 0.4);
}

.node-number {
  font-size: 1.3rem;
  font-weight: 800;
  color: #f3f4f6;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 1;
}

/* Level Detail Card - Appears when selected */
.level-detail {
  margin-top: 20px;
  animation: detailSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes detailSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-card {
  background: linear-gradient(145deg, rgba(42, 31, 61, 0.9) 0%, rgba(30, 27, 75, 0.9) 100%);
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 12px;
  padding: 16px 20px;
  position: relative;
  overflow: hidden;
}

.detail-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #7c3aed, #9333ea, #c084fc);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.detail-level {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f3f4f6;
  text-shadow: 0 2px 8px rgba(147, 51, 234, 0.5);
}

.detail-difficulty {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(107, 114, 128, 0.3);
  color: #9ca3af;
}

.detail-difficulty.hard {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.detail-difficulty.extreme {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  animation: dangerPulse 2s ease-in-out infinite;
}

@keyframes dangerPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
}

.detail-rewards {
  display: flex;
  gap: 16px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.reward-icon {
  font-size: 1.1rem;
}

.reward-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.reward-item.gold .reward-value {
  color: #fbbf24;
}

.reward-item.gems .reward-value {
  color: #a78bfa;
}

.reward-item.item .reward-value {
  color: #60a5fa;
}

.per-level {
  font-size: 0.55rem;
  color: #6b7280;
  margin-left: 1px;
}

.first-clear-badge {
  margin-top: 12px;
  padding: 8px 12px;
  background: linear-gradient(90deg, rgba(251, 191, 36, 0.15) 0%, transparent 100%);
  border-left: 3px solid #fbbf24;
  border-radius: 0 6px 6px 0;
  font-size: 0.75rem;
  color: #fbbf24;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Prompt when no level selected */
.level-prompt {
  margin-top: 16px;
  padding: 16px;
  background: rgba(55, 65, 81, 0.3);
  border: 1px dashed rgba(107, 114, 128, 0.4);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #6b7280;
}

.prompt-icon {
  font-size: 1.2rem;
  animation: promptBounce 1.5s ease-in-out infinite;
}

@keyframes promptBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.prompt-text {
  font-size: 0.9rem;
}

.locked-hint {
  margin-top: 16px;
  text-align: center;
  color: #6b7280;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.lock-icon {
  font-size: 0.75rem;
}

/* ===== Challenge Button ===== */
.challenge-btn {
  padding: 16px 20px;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  color: white;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  min-height: 72px;
}

.challenge-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 0.5s ease;
}

.challenge-btn:disabled {
  cursor: not-allowed;
}

/* ===== State: No Keys (Blocked) ===== */
.challenge-btn.state-no-keys {
  background: linear-gradient(135deg, #1f1315 0%, #27171a 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.challenge-btn.state-no-keys .btn-icon-wrapper {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}

.challenge-btn.state-no-keys .btn-primary {
  color: #fca5a5;
}

.challenge-btn.state-no-keys .btn-secondary {
  color: #9ca3af;
}

/* ===== State: Select Level (Waiting) ===== */
.challenge-btn.state-select-level {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border: 1px dashed rgba(148, 163, 184, 0.4);
}

.challenge-btn.state-select-level .btn-icon-wrapper {
  background: rgba(148, 163, 184, 0.15);
  border-color: rgba(148, 163, 184, 0.3);
  animation: waitingPulse 2s ease-in-out infinite;
}

@keyframes waitingPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.challenge-btn.state-select-level .btn-primary {
  color: #94a3b8;
}

.challenge-btn.state-select-level .btn-icon {
  animation: pointUp 1.5s ease-in-out infinite;
}

@keyframes pointUp {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* ===== State: Ready (Can Challenge) ===== */
.challenge-btn.state-ready {
  background: linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #9333ea 100%);
  border: 1px solid rgba(167, 139, 250, 0.4);
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.3);
  cursor: pointer;
}

.challenge-btn.state-ready::before {
  animation: readyShimmer 3s ease-in-out infinite;
}

@keyframes readyShimmer {
  0%, 100% { left: -100%; }
  50% { left: 100%; }
}

.challenge-btn.state-ready:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(147, 51, 234, 0.5);
  border-color: rgba(167, 139, 250, 0.6);
}

.challenge-btn.state-ready:active {
  transform: translateY(-1px);
}

.challenge-btn.state-ready .btn-icon-wrapper {
  background: rgba(167, 139, 250, 0.2);
  border-color: rgba(167, 139, 250, 0.4);
}

.challenge-btn.state-ready .btn-primary {
  color: #f3f4f6;
  font-size: 1.05rem;
}

.challenge-btn.state-ready .btn-secondary {
  color: #c4b5fd;
}

/* ===== Button Content Layout ===== */
.btn-content {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.btn-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(107, 114, 128, 0.2);
  border: 1px solid rgba(107, 114, 128, 0.3);
  border-radius: 10px;
  flex-shrink: 0;
  position: relative;
}

.btn-icon {
  font-size: 1.3rem;
  position: relative;
  z-index: 1;
}

/* Slash through icon for blocked state */
.btn-icon-slash {
  position: absolute;
  width: 28px;
  height: 2px;
  background: #ef4444;
  transform: rotate(-45deg);
  border-radius: 1px;
  box-shadow: 0 0 4px rgba(239, 68, 68, 0.5);
}

.btn-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  flex: 1;
}

.btn-primary {
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.2;
}

.btn-secondary {
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.9;
}

/* Cost badge for ready state */
.btn-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-cost .cost-icon {
  font-size: 0.9rem;
}

.btn-cost .cost-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: #fbbf24;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .challenge-btn.state-select-level .btn-icon-wrapper,
  .challenge-btn.state-select-level .btn-icon,
  .challenge-btn.state-ready::before {
    animation: none !important;
  }
}

/* ===== Empty State ===== */
.no-boss-selected {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid #334155;
  border-radius: 16px;
  position: relative;
  z-index: 1;
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  color: #f3f4f6;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.empty-hint {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0 0 24px 0;
}

.back-btn-large {
  padding: 14px 28px;
  background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  border: 1px solid #4b5563;
  border-radius: 10px;
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn-large:hover {
  background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
  transform: translateY(-2px);
}
</style>
