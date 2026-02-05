<script setup>
import { useCodexStore } from '../stores'
import codexIcon from '../assets/icons/codex.png'

const emit = defineEmits(['navigate'])
const codexStore = useCodexStore()
</script>

<template>
  <div class="codex-screen">
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Codex</h1>
      <div class="header-spacer"></div>
    </header>

    <nav class="hub-nav">
      <button
        class="nav-button nav-button-primary field-guide-button"
        @click="emit('navigate', 'field-guide')"
      >
        <div class="nav-icon-wrapper field-guide">
          <img :src="codexIcon" alt="Field Guide" class="nav-icon-img" />
        </div>
        <div class="nav-content">
          <span class="nav-label">Field Guide</span>
          <span class="nav-hint">Game mechanics & systems</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <button
        class="nav-button nav-button-primary compendium-button"
        @click="emit('navigate', 'compendium')"
      >
        <div class="nav-icon-wrapper compendium">
          <img :src="codexIcon" alt="Compendium" class="nav-icon-img" />
        </div>
        <div class="nav-content">
          <span class="nav-label">Compendium</span>
          <span class="nav-hint">Heroes, enemies & regions</span>
        </div>
        <span v-if="codexStore.unreadHeroCount + codexStore.unreadEnemyCount + codexStore.unreadRegionCount > 0" class="unread-badge">
          {{ codexStore.unreadHeroCount + codexStore.unreadEnemyCount + codexStore.unreadRegionCount }} new
        </span>
        <div class="nav-arrow">›</div>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.codex-screen {
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
  padding: 28px 24px;
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
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon-wrapper.field-guide {
  background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
}

.nav-icon-wrapper.compendium {
  background: linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%);
}

.nav-icon {
  font-size: 1.8rem;
}

.nav-icon-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.nav-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.nav-label {
  font-size: 1.3rem;
  font-weight: 600;
  color: #f3f4f6;
}

.nav-hint {
  color: #6b7280;
  font-size: 0.8rem;
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

/* Field Guide button styling */
.nav-button.field-guide-button {
  border-color: #b45309;
}

.nav-button.field-guide-button:hover {
  border-color: #d97706;
}

/* Compendium button styling */
.nav-button.compendium-button {
  border-color: #1d4ed8;
}

.nav-button.compendium-button:hover {
  border-color: #3b82f6;
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
