<script setup>
import { useColosseumStore } from '../stores/colosseum.js'
import questBg from '../assets/backgrounds/quests_bg.png'
import genusLociBg from '../assets/backgrounds/genus_loci.png'
import exploreBg from '../assets/backgrounds/explore_bg.png'
import mapRoomBg from '../assets/backgrounds/map_room.png'
import colosseumBg from '../assets/backgrounds/colosseum_button.png'
import mapIcon from '../assets/icons/map.png'
import compassIcon from '../assets/icons/compass.png'
import genusLociIcon from '../assets/icons/genus_loci_icon.png'
import colosseumIcon from '../assets/icons/colosseum.png'

const emit = defineEmits(['navigate'])
const colosseumStore = useColosseumStore()
</script>

<template>
  <div class="map-room-screen">
    <!-- Dark vignette background -->
    <div class="bg-vignette"></div>

    <!-- Atmospheric background image -->
    <div
      class="room-background"
      :style="{ backgroundImage: `url(${mapRoomBg})` }"
    ></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Map Room</h1>
      <div class="header-spacer"></div>
    </header>

    <nav class="hub-nav">
      <!-- Primary: Quests -->
      <button
        class="nav-button nav-button-primary quests-button"
        :style="{ backgroundImage: `url(${questBg})` }"
        @click="emit('navigate', 'worldmap')"
      >
        <div class="nav-icon-wrapper quests">
          <img :src="mapIcon" alt="Quests" class="nav-icon-img" />
        </div>
        <div class="nav-content">
          <span class="nav-label">Quests</span>
          <span class="nav-hint">Explore the world</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <!-- Secondary: Explorations & Genus Loci -->
      <div class="secondary-nav">
        <button
          class="nav-button nav-button-secondary explorations-button"
          :style="{ backgroundImage: `url(${exploreBg})` }"
          @click="emit('navigate', 'explorations')"
        >
          <div class="nav-icon-wrapper explorations">
            <img :src="compassIcon" alt="Explorations" class="nav-icon-img" />
          </div>
          <div class="nav-content">
            <span class="nav-label">Explorations</span>
          </div>
        </button>

        <button
          class="nav-button nav-button-secondary genus-loci-button"
          :style="{ backgroundImage: `url(${genusLociBg})` }"
          @click="emit('navigate', 'genus-loci-list')"
        >
          <div class="nav-icon-wrapper genus-loci">
            <img :src="genusLociIcon" alt="Genus Loci" class="nav-icon-img" />
          </div>
          <div class="nav-content">
            <span class="nav-label">Genus Loci</span>
          </div>
        </button>
      </div>

      <!-- Colosseum (shown when unlocked) -->
      <button
        v-if="colosseumStore.colosseumUnlocked"
        class="nav-button nav-button-secondary colosseum-button"
        :style="{ backgroundImage: `url(${colosseumBg})` }"
        @click="emit('navigate', 'colosseum')"
      >
        <div class="nav-icon-wrapper colosseum">
          <img :src="colosseumIcon" alt="Colosseum" class="nav-icon-img" />
        </div>
        <div class="nav-content">
          <span class="nav-label">Colosseum</span>
          <span class="nav-hint">PvP Gauntlet</span>
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
  padding-top: calc(20px + var(--safe-area-top));
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, #0a0a0a 0%, #111827 100%);
}

/* Dark vignette background */
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

/* Atmospheric background image */
.room-background {
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
  z-index: 0;
  opacity: 0.6;
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

.secondary-nav {
  display: flex;
  gap: 12px;
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

/* Primary button - larger, more prominent */
.nav-button-primary {
  padding: 28px 24px;
}

.nav-button-primary .nav-icon-wrapper {
  width: 56px;
  height: 56px;
}

.nav-button-primary .nav-icon {
  font-size: 1.8rem;
}

.nav-button-primary .nav-label {
  font-size: 1.3rem;
}

/* Secondary buttons - compact, side-by-side */
.nav-button-secondary {
  flex: 1;
  padding: 14px 16px;
  gap: 12px;
}

.nav-button-secondary .nav-icon-wrapper {
  width: 40px;
  height: 40px;
}

.nav-button-secondary .nav-icon {
  font-size: 1.2rem;
}

.nav-button-secondary .nav-label {
  font-size: 0.95rem;
}

.nav-button:hover {
  border-color: #4b5563;
  transform: translateX(4px);
}

.nav-button-primary:hover {
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

.nav-icon-wrapper.quests {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}

.nav-icon-wrapper.explorations {
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
}

.nav-icon-wrapper.genus-loci {
  background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%);
}

.nav-icon {
  font-size: 1.5rem;
}

.nav-icon-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
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
  background: linear-gradient(90deg, rgba(5, 150, 105, 0.92) 0%, rgba(5, 150, 105, 0.7) 50%, rgba(5, 150, 105, 0.15) 100%);
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
  color: #f3f4f6;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
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
  background: linear-gradient(90deg, rgba(107, 33, 168, 0.92) 0%, rgba(107, 33, 168, 0.7) 50%, rgba(107, 33, 168, 0.15) 100%);
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
  color: #f3f4f6;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
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
  background: linear-gradient(90deg, rgba(8, 145, 178, 0.92) 0%, rgba(8, 145, 178, 0.7) 50%, rgba(8, 145, 178, 0.15) 100%);
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
  color: #f3f4f6;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
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
}

/* Colosseum button */
.nav-icon-wrapper.colosseum {
  background: linear-gradient(135deg, #b45309 0%, #f59e0b 100%);
}

.nav-button.colosseum-button {
  border-color: #f59e0b;
  background-size: cover;
  background-position: center;
}

.nav-button.colosseum-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(120, 53, 15, 0.85) 0%, rgba(180, 83, 9, 0.5) 100%);
  border-radius: inherit;
}

.nav-button.colosseum-button > * {
  position: relative;
  z-index: 1;
}

.nav-button.colosseum-button .nav-label {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.nav-button.colosseum-button:hover {
  border-color: #fbbf24;
}

.nav-button.colosseum-button .nav-arrow {
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.nav-button.colosseum-button:hover .nav-arrow {
  color: rgba(255, 255, 255, 0.9);
}

.nav-button.colosseum-button .nav-hint {
  color: #fbbf24;
  font-size: 0.75rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}
</style>
