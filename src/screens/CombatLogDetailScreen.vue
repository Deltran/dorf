<script setup>
import { computed } from 'vue'
import { useCombatLogsStore } from '../stores'
import { parseLogStats } from '../utils/logStats'
import { useTooltip } from '../composables/useTooltip.js'

const { onClick: showTooltip } = useTooltip()

const props = defineProps({
  logId: { type: String, default: null }
})
const emit = defineEmits(['navigate', 'back'])
const combatLogsStore = useCombatLogsStore()

const log = computed(() => props.logId ? combatLogsStore.getLog(props.logId) : null)

const rarityColors = {
  1: '#9ca3af',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f59e0b'
}

const battleTypeEmoji = {
  quest: '⚔️',
  genusLoci: '🐉',
  colosseum: '🏟️'
}

function getTitle() {
  if (!log.value) return ''
  if (log.value.battleType === 'genusLoci') return log.value.context.genusLociName
  if (log.value.battleType === 'colosseum') return `Colosseum Bout ${log.value.context.colosseumBout}`
  return log.value.context.nodeName || 'Unknown Quest'
}

function getSubtitle() {
  if (!log.value) return ''
  if (log.value.battleType === 'quest' && log.value.context.region) return log.value.context.region
  if (log.value.battleType === 'genusLoci') return 'Genus Loci'
  if (log.value.battleType === 'colosseum') return 'Colosseum'
  return ''
}

function formatTimestamp(ts) {
  const d = new Date(ts)
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day = d.getDate()
  const hours = d.getHours()
  const mins = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return `${month} ${day}, ${h}:${mins} ${ampm}`
}

// Group entries by wave and round
const groupedEntries = computed(() => {
  if (!log.value?.logEntries?.length) return []

  const groups = []
  let lastWave = null
  let lastRound = null

  for (const entry of log.value.logEntries) {
    if (entry.wave !== lastWave) {
      groups.push({ type: 'wave', wave: entry.wave })
      lastWave = entry.wave
      lastRound = null
    }
    if (entry.round !== lastRound) {
      groups.push({ type: 'round', round: entry.round })
      lastRound = entry.round
    }
    groups.push({ type: 'message', message: entry.message })
  }

  return groups
})

const showWaveDividers = computed(() => {
  if (!log.value?.context) return false
  return (log.value.context.waveCount || 1) > 1
})

function formatNumber(n) {
  return n.toLocaleString()
}

const heroStats = computed(() => {
  if (!log.value) return []
  return parseLogStats(log.value.logEntries, log.value.party)
})
</script>

<template>
  <div class="log-detail-screen">
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('back')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Battle Log</h1>
      <div class="header-spacer"></div>
    </header>

    <div v-if="!log" class="empty-state">
      <p class="empty-text">Log not found.</p>
    </div>

    <template v-else>
      <!-- Summary banner -->
      <div class="summary-banner" :class="log.outcome">
        <div class="summary-top">
          <span class="summary-emoji">{{ battleTypeEmoji[log.battleType] || '⚔️' }}</span>
          <div class="summary-title-group">
            <span class="summary-title">{{ getTitle() }}</span>
            <span v-if="getSubtitle()" class="summary-subtitle">{{ getSubtitle() }}</span>
          </div>
          <span class="summary-outcome" :class="log.outcome">
            {{ log.outcome === 'victory' ? 'Victory' : 'Defeat' }}
          </span>
        </div>
        <div class="summary-time">{{ formatTimestamp(log.timestamp) }}</div>
      </div>

      <!-- Party row -->
      <div class="party-row">
        <span
          v-for="hero in log.party"
          :key="hero.templateId"
          class="party-hero"
          :style="{ color: rarityColors[hero.rarity] || '#9ca3af' }"
        >
          <span v-if="hero.isLeader" class="leader-crown">👑</span>{{ hero.name }}
        </span>
      </div>

      <!-- Battle Stats -->
      <div v-if="heroStats.length > 0" class="stats-section">
        <div class="stats-section-label">Battle Stats</div>
        <div class="stats-cards">
          <div v-for="hero in heroStats" :key="hero.name" class="stats-card">
            <div class="stats-hero-name" :style="{ color: rarityColors[hero.rarity] || '#9ca3af' }">
              <span v-if="hero.isLeader" class="leader-crown">👑</span>{{ hero.name }}
            </div>
            <div class="stats-row">
              <span v-if="hero.damageDealt > 0" class="stat-item" @click="showTooltip($event, 'Damage Dealt')">⚔️ {{ formatNumber(hero.damageDealt) }}</span>
              <span v-if="hero.healingDone > 0" class="stat-item" @click="showTooltip($event, 'Healing Done')">💚 {{ formatNumber(hero.healingDone) }}</span>
              <span v-if="hero.kills > 0" class="stat-item" @click="showTooltip($event, 'Kills')">💀 {{ hero.kills }}</span>
              <span v-if="hero.deaths > 0" class="stat-item" @click="showTooltip($event, 'Deaths')">🪦 {{ hero.deaths }}</span>
              <span v-if="hero.damageIntercepted > 0" class="stat-item" @click="showTooltip($event, 'Damage Intercepted')">🛡️ {{ formatNumber(hero.damageIntercepted) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Log body -->
      <div class="log-body">
        <template v-for="(item, idx) in groupedEntries" :key="idx">
          <div v-if="item.type === 'wave' && showWaveDividers" class="wave-divider">
            — Wave {{ item.wave }} —
          </div>
          <div v-else-if="item.type === 'round'" class="round-header">
            Round {{ item.round }}
          </div>
          <div v-else-if="item.type === 'message'" class="log-message">
            {{ item.message }}
          </div>
        </template>

        <div v-if="groupedEntries.length === 0" class="log-empty">
          No log entries recorded.
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.log-detail-screen {
  min-height: 100vh;
  padding: 20px;
  padding-top: calc(20px + var(--safe-area-top));
  padding-bottom: calc(20px + var(--safe-area-bottom));
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, #0a0a0a 0%, #111827 100%);
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.8) 100%);
  pointer-events: none;
  z-index: 0;
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

.header-spacer {
  width: 70px;
}

/* Empty */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  position: relative;
  z-index: 1;
}

.empty-text {
  color: #6b7280;
  font-size: 1rem;
}

/* Summary banner */
.summary-banner {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  position: relative;
  z-index: 1;
  border-left: 4px solid #334155;
}

.summary-banner.victory {
  border-left-color: #22c55e;
}

.summary-banner.defeat {
  border-left-color: #ef4444;
}

.summary-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.summary-emoji {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.summary-title-group {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.summary-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
}

.summary-subtitle {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 1px;
}

.summary-outcome {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.summary-outcome.victory {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.summary-outcome.defeat {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.summary-time {
  font-size: 0.8rem;
  color: #4b5563;
}

/* Party row */
.party-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  position: relative;
  z-index: 1;
  padding: 0 4px;
}

.party-hero {
  font-size: 0.85rem;
  font-weight: 600;
}

.leader-crown {
  margin-right: 2px;
}

/* Battle Stats */
.stats-section {
  position: relative;
  z-index: 1;
}

.stats-section-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.stats-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 10px 12px;
}

.stats-hero-name {
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}

.stat-item {
  font-size: 0.78rem;
  color: #d1d5db;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

/* Log body */
.log-body {
  flex: 1;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 14px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.wave-divider {
  text-align: center;
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 10px 0 6px;
  letter-spacing: 1px;
}

.round-header {
  color: #d1d5db;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 8px 0 2px;
  border-top: 1px solid rgba(51, 65, 85, 0.3);
  margin-top: 4px;
}

.round-header:first-child,
.wave-divider + .round-header {
  border-top: none;
  margin-top: 0;
}

.log-message {
  color: #9ca3af;
  font-size: 0.78rem;
  padding: 2px 0;
  line-height: 1.4;
}

.log-empty {
  text-align: center;
  color: #4b5563;
  font-size: 0.85rem;
  padding: 20px;
}
</style>
