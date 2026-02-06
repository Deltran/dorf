<script setup>
import { useCodexStore } from '../stores'

const emit = defineEmits(['navigate', 'back'])
const codexStore = useCodexStore()
</script>

<template>
  <div class="compendium-screen">
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('back')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Compendium</h1>
      <div class="header-spacer"></div>
    </header>

    <nav class="hub-nav">
      <!-- Roster -->
      <button
        class="nav-button roster-button"
        @click="emit('navigate', 'compendium-roster')"
      >
        <div class="nav-icon-wrapper roster">
          <span class="nav-icon">⚔️</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Hero Roster</span>
          <span class="nav-counter">
            {{ codexStore.discoveredHeroes.length }}/{{ codexStore.totalHeroes }}
          </span>
        </div>
        <span v-if="codexStore.unreadHeroCount > 0" class="unread-badge">
          {{ codexStore.unreadHeroCount }} new
        </span>
        <div class="nav-arrow">›</div>
      </button>

      <!-- Bestiary -->
      <button
        class="nav-button bestiary-button"
        @click="emit('navigate', 'compendium-bestiary')"
      >
        <div class="nav-icon-wrapper bestiary">
          <span class="nav-icon">👹</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Bestiary</span>
          <span class="nav-counter">
            {{ codexStore.discoveredEnemies.length }}/{{ codexStore.totalEnemies }}
          </span>
        </div>
        <span v-if="codexStore.unreadEnemyCount > 0" class="unread-badge">
          {{ codexStore.unreadEnemyCount }} new
        </span>
        <div class="nav-arrow">›</div>
      </button>

      <!-- Atlas -->
      <button
        class="nav-button atlas-button"
        @click="emit('navigate', 'compendium-atlas')"
      >
        <div class="nav-icon-wrapper atlas">
          <span class="nav-icon">🗺️</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Atlas</span>
          <span class="nav-counter">
            {{ codexStore.discoveredRegions.length }}/{{ codexStore.totalRegions }}
          </span>
        </div>
        <span v-if="codexStore.unreadRegionCount > 0" class="unread-badge">
          {{ codexStore.unreadRegionCount }} new
        </span>
        <div class="nav-arrow">›</div>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.compendium-screen {
  min-height: 100vh;
  padding: 20px;
  padding-top: calc(20px + var(--safe-area-top));
  display: flex;
  flex-direction: column;
  gap: 24px;
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

/* Navigation */
.hub-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  position: relative;
  overflow: hidden;
}

.nav-button:hover {
  border-color: #4b5563;
  transform: translateX(6px);
}

.nav-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon-wrapper.roster {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
}

.nav-icon-wrapper.bestiary {
  background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%);
}

.nav-icon-wrapper.atlas {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}

.nav-icon {
  font-size: 1.5rem;
}

.nav-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.nav-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.nav-counter {
  font-size: 0.85rem;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
}

.nav-arrow {
  font-size: 1.5rem;
  color: #4b5563;
  transition: transform 0.3s ease, color 0.3s ease;
}

.nav-button:hover .nav-arrow {
  transform: translateX(4px);
  color: #6b7280;
}

/* Button accent colors */
.nav-button.roster-button {
  border-color: rgba(220, 38, 38, 0.4);
}

.nav-button.roster-button:hover {
  border-color: #ef4444;
}

.nav-button.bestiary-button {
  border-color: rgba(147, 51, 234, 0.4);
}

.nav-button.bestiary-button:hover {
  border-color: #a855f7;
}

.nav-button.atlas-button {
  border-color: rgba(5, 150, 105, 0.4);
}

.nav-button.atlas-button:hover {
  border-color: #10b981;
}

/* Unread badge */
.unread-badge {
  background: #f59e0b;
  color: #0f172a;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
