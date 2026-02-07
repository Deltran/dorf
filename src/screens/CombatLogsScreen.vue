<script setup>
import { computed } from 'vue'
import { useCombatLogsStore } from '../stores'

const emit = defineEmits(['navigate', 'back'])
const combatLogsStore = useCombatLogsStore()

const logs = computed(() => combatLogsStore.logs)

const battleTypeEmoji = {
  quest: '⚔️',
  genusLoci: '🐉',
  colosseum: '🏟️'
}

function getTitle(log) {
  if (log.battleType === 'genusLoci') return log.context.genusLociName
  if (log.battleType === 'colosseum') return `Colosseum Bout ${log.context.colosseumBout}`
  return log.context.nodeName || 'Unknown Quest'
}

function getSubtitle(log) {
  if (log.battleType === 'quest' && log.context.region) return log.context.region
  if (log.battleType === 'genusLoci') return 'Genus Loci'
  if (log.battleType === 'colosseum') return 'Colosseum'
  return ''
}

function getPartyNames(log) {
  return (log.party || []).map(h => h.name).join(', ')
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}
</script>

<template>
  <div class="combat-logs-screen">
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('back')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Combat Logs</h1>
      <div class="header-spacer"></div>
    </header>

    <div v-if="logs.length === 0" class="empty-state">
      <div class="empty-icon">📜</div>
      <p class="empty-text">No battles recorded yet.</p>
      <p class="empty-hint">Fight quests, Genus Loci, or Colosseum bouts to see logs here.</p>
    </div>

    <div v-else class="log-list">
      <button
        v-for="log in logs"
        :key="log.id"
        class="log-card"
        :class="log.outcome"
        @click="emit('navigate', 'combat-log-detail', log.id)"
      >
        <div class="log-outcome-bar"></div>
        <div class="log-body">
          <div class="log-header-row">
            <span class="log-type-emoji">{{ battleTypeEmoji[log.battleType] || '⚔️' }}</span>
            <div class="log-title-group">
              <span class="log-title">{{ getTitle(log) }}</span>
              <span v-if="getSubtitle(log)" class="log-subtitle">{{ getSubtitle(log) }}</span>
            </div>
            <span class="log-outcome-badge" :class="log.outcome">
              {{ log.outcome === 'victory' ? 'Victory' : 'Defeat' }}
            </span>
          </div>
          <div class="log-meta">
            <span class="log-party">{{ getPartyNames(log) }}</span>
          </div>
          <div class="log-footer">
            <span class="log-waves" v-if="log.context.waveCount > 1">{{ log.context.waveCount }} waves</span>
            <span class="log-time">{{ timeAgo(log.timestamp) }}</span>
          </div>
        </div>
        <div class="log-arrow">›</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.combat-logs-screen {
  min-height: 100vh;
  padding: 20px;
  padding-top: calc(20px + var(--safe-area-top));
  display: flex;
  flex-direction: column;
  gap: 20px;
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

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  position: relative;
  z-index: 1;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  color: #9ca3af;
  font-size: 1.1rem;
  margin: 0 0 8px;
}

.empty-hint {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
  text-align: center;
}

/* Log list */
.log-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.log-card {
  display: flex;
  align-items: stretch;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  overflow: hidden;
  padding: 0;
}

.log-card:hover {
  border-color: #4b5563;
  transform: translateX(4px);
}

.log-outcome-bar {
  width: 4px;
  flex-shrink: 0;
}

.log-card.victory .log-outcome-bar {
  background: #22c55e;
}

.log-card.defeat .log-outcome-bar {
  background: #ef4444;
}

.log-body {
  flex: 1;
  padding: 14px 12px;
  min-width: 0;
}

.log-header-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.log-type-emoji {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.log-title-group {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.log-title {
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 1px;
}

.log-outcome-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.log-outcome-badge.victory {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.log-outcome-badge.defeat {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.log-meta {
  margin-bottom: 6px;
}

.log-party {
  font-size: 0.8rem;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.log-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-waves {
  font-size: 0.75rem;
  color: #6b7280;
}

.log-time {
  font-size: 0.75rem;
  color: #4b5563;
}

.log-arrow {
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 1.3rem;
  color: #4b5563;
  flex-shrink: 0;
}
</style>
