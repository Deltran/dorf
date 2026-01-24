<script setup>
import questBg from '../assets/backgrounds/quests_bg.png'
import genusLociBg from '../assets/backgrounds/genus_loci.png'
import exploreBg from '../assets/backgrounds/explore_bg.png'

const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="map-room-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Map Room</h1>
      <div class="header-spacer"></div>
    </header>

    <nav class="hub-nav">
      <button
        class="nav-button quests-button"
        :style="{ backgroundImage: `url(${questBg})` }"
        @click="emit('navigate', 'worldmap')"
      >
        <div class="nav-icon-wrapper quests">
          <span class="nav-icon">🗺️</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Quests</span>
          <span class="nav-hint">Explore the world</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <button
        class="nav-button explorations-button"
        :style="{ backgroundImage: `url(${exploreBg})` }"
        @click="emit('navigate', 'explorations')"
      >
        <div class="nav-icon-wrapper explorations">
          <span class="nav-icon">🧭</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Explorations</span>
          <span class="nav-hint">Send heroes on expeditions</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <button
        class="nav-button genus-loci-button"
        :style="{ backgroundImage: `url(${genusLociBg})` }"
        @click="emit('navigate', 'genus-loci-list')"
      >
        <div class="nav-icon-wrapper genus-loci">
          <span class="nav-icon">👹</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Genus Loci</span>
          <span class="nav-hint">Challenge powerful bosses</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.map-room-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  overflow: hidden;
}

/* Animated Background */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-gradient {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e3a2f 25%,
    #172554 50%,
    #1e3a2f 75%,
    #0f172a 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  opacity: 0.03;
  background-image:
    radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  z-index: -1;
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
  padding: 16px 20px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  position: relative;
  overflow: hidden;
}

.nav-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  transition: left 0.5s ease;
}

.nav-button:hover::before {
  left: 100%;
}

.nav-button:hover {
  border-color: #4b5563;
  transform: translateX(6px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
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

.nav-icon-wrapper.quests {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.nav-icon-wrapper.explorations {
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
}

.nav-icon-wrapper.genus-loci {
  background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%);
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
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

/* Quests button with background image */
.nav-button.quests-button {
  background-size: cover;
  background-position: center;
  border-color: #10b981;
}

.nav-button.quests-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.75) 0%, rgba(16, 185, 129, 0.6) 100%);
  border-radius: 13px;
  z-index: 0;
}

.nav-button.quests-button > * {
  position: relative;
  z-index: 1;
}

.nav-button.quests-button .nav-label {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.nav-button.quests-button .nav-hint {
  color: rgba(255, 255, 255, 0.75);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.nav-button.quests-button .nav-arrow {
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.nav-button.quests-button:hover .nav-arrow {
  color: rgba(255, 255, 255, 0.9);
}

.nav-button.quests-button:hover {
  border-color: #34d399;
  box-shadow: 0 4px 25px rgba(16, 185, 129, 0.4);
}

/* Genus Loci button with background image */
.nav-button.genus-loci-button {
  background-size: cover;
  background-position: center;
  border-color: #9333ea;
}

.nav-button.genus-loci-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(107, 33, 168, 0.75) 0%, rgba(147, 51, 234, 0.6) 100%);
  border-radius: 13px;
  z-index: 0;
}

.nav-button.genus-loci-button > * {
  position: relative;
  z-index: 1;
}

.nav-button.genus-loci-button .nav-label {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.nav-button.genus-loci-button .nav-hint {
  color: rgba(255, 255, 255, 0.75);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.nav-button.genus-loci-button .nav-arrow {
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.nav-button.genus-loci-button:hover .nav-arrow {
  color: rgba(255, 255, 255, 0.9);
}

.nav-button.genus-loci-button:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 25px rgba(147, 51, 234, 0.4);
}

/* Explorations button with background image */
.nav-button.explorations-button {
  background-size: cover;
  background-position: center;
  border-color: #06b6d4;
}

.nav-button.explorations-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(8, 145, 178, 0.75) 0%, rgba(6, 182, 212, 0.6) 100%);
  border-radius: 13px;
  z-index: 0;
}

.nav-button.explorations-button > * {
  position: relative;
  z-index: 1;
}

.nav-button.explorations-button .nav-label {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.nav-button.explorations-button .nav-hint {
  color: rgba(255, 255, 255, 0.75);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.nav-button.explorations-button .nav-arrow {
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.nav-button.explorations-button:hover .nav-arrow {
  color: rgba(255, 255, 255, 0.9);
}

.nav-button.explorations-button:hover {
  border-color: #22d3ee;
  box-shadow: 0 4px 25px rgba(6, 182, 212, 0.4);
}
</style>
