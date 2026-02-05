<script setup>
import fellowshipHallBg from '../assets/backgrounds/fellowship_hall_bg.png'
import partyBg from '../assets/backgrounds/party_bg.png'
import fusionBg from '../assets/backgrounds/fusion.png'
import shardsBg from '../assets/backgrounds/shards.png'
import heroPrepBg from '../assets/backgrounds/hero_prep_bg.png'
import gemIcon from '../assets/icons/gems.png'
import crossedSwordsIcon from '../assets/icons/crossed_swords.png'
import shieldIcon from '../assets/icons/shield.png'
import dragonShardIcon from '../assets/icons/shard_of_dragon_heart.png'

const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="fellowship-hall-screen">
    <!-- Dark vignette background -->
    <div class="bg-vignette"></div>

    <!-- Atmospheric background image -->
    <div
      class="room-background"
      :style="{ backgroundImage: `url(${heroPrepBg})` }"
    ></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Fellowship Hall</h1>
      <div class="header-spacer"></div>
    </header>

    <nav class="hub-nav">
      <!-- Primary: Heroes -->
      <button
        class="nav-button nav-button-primary heroes-button"
        :style="{ backgroundImage: `url(${fellowshipHallBg})` }"
        @click="emit('navigate', 'heroes')"
      >
        <div class="nav-icon-wrapper heroes">
          <img :src="crossedSwordsIcon" alt="Heroes" class="nav-icon-img" />
        </div>
        <div class="nav-content">
          <span class="nav-label">Heroes</span>
          <span class="nav-hint">View your collection</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <!-- Secondary: Party, Fusion, Shards -->
      <div class="secondary-nav">
        <button
          class="nav-button nav-button-secondary party-button"
          :style="{ backgroundImage: `url(${partyBg})` }"
          @click="emit('navigate', 'party')"
        >
          <div class="nav-icon-wrapper party">
            <img :src="shieldIcon" alt="Party" class="nav-icon-img" />
          </div>
          <div class="nav-content">
            <span class="nav-label">Party</span>
          </div>
        </button>

        <button
          class="nav-button nav-button-secondary fusion-button"
          :style="{ backgroundImage: `url(${fusionBg})` }"
          @click="emit('navigate', 'merge')"
        >
          <div class="nav-icon-wrapper fusion">
            <img :src="dragonShardIcon" alt="Fusion" class="nav-icon-img" />
          </div>
          <div class="nav-content">
            <span class="nav-label">Fusion</span>
          </div>
        </button>
      </div>

      <button
        class="nav-button nav-button-secondary shards-button"
        :style="{ backgroundImage: `url(${shardsBg})` }"
        @click="emit('navigate', 'shards')"
      >
        <div class="nav-icon-wrapper shards">
          <img :src="gemIcon" alt="Shards" class="nav-icon-img" />
        </div>
        <div class="nav-content">
          <span class="nav-label">Shards</span>
          <span class="nav-hint">Hero fragments</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.fellowship-hall-screen {
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

.nav-icon-wrapper.heroes {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
}

.nav-icon-wrapper.party {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}

.nav-icon-wrapper.fusion {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.nav-icon-wrapper.shards {
  background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%);
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

/* Heroes button with background image */
.nav-button.heroes-button {
  background-size: cover;
  background-position: center;
  border-color: #ef4444;
}

.nav-button.heroes-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(220, 38, 38, 0.92) 0%, rgba(220, 38, 38, 0.7) 50%, rgba(220, 38, 38, 0.15) 100%);
  border-radius: 13px;
  z-index: 0;
}

.nav-button.heroes-button > * {
  position: relative;
  z-index: 1;
}

.nav-button.heroes-button .nav-label {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.nav-button.heroes-button .nav-hint {
  color: #f3f4f6;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.nav-button.heroes-button .nav-arrow {
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.nav-button.heroes-button:hover .nav-arrow {
  color: rgba(255, 255, 255, 0.9);
}

.nav-button.heroes-button:hover {
  border-color: #f87171;
}

/* Party button with background image */
.nav-button.party-button {
  background-size: cover;
  background-position: center;
  border-color: #10b981;
}

.nav-button.party-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(5, 150, 105, 0.92) 0%, rgba(5, 150, 105, 0.7) 50%, rgba(5, 150, 105, 0.15) 100%);
  border-radius: 13px;
  z-index: 0;
}

.nav-button.party-button > * {
  position: relative;
  z-index: 1;
}

.nav-button.party-button .nav-label {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.nav-button.party-button:hover {
  border-color: #34d399;
}

/* Fusion button with background image */
.nav-button.fusion-button {
  background-size: cover;
  background-position: center;
  border-color: #fbbf24;
}

.nav-button.fusion-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.92) 0%, rgba(245, 158, 11, 0.7) 50%, rgba(245, 158, 11, 0.15) 100%);
  border-radius: 13px;
  z-index: 0;
}

.nav-button.fusion-button > * {
  position: relative;
  z-index: 1;
}

.nav-button.fusion-button .nav-label {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.nav-button.fusion-button:hover {
  border-color: #fcd34d;
}

/* Shards button with background image */
.nav-button.shards-button {
  background-size: cover;
  background-position: center;
  border-color: #a855f7;
}

.nav-button.shards-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(124, 58, 237, 0.92) 0%, rgba(124, 58, 237, 0.7) 50%, rgba(124, 58, 237, 0.15) 100%);
  border-radius: 13px;
  z-index: 0;
}

.nav-button.shards-button > * {
  position: relative;
  z-index: 1;
}

.nav-button.shards-button .nav-label {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.nav-button.shards-button .nav-hint {
  color: #f3f4f6;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.nav-button.shards-button .nav-arrow {
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.nav-button.shards-button:hover .nav-arrow {
  color: rgba(255, 255, 255, 0.9);
}

.nav-button.shards-button:hover {
  border-color: #c084fc;
}
</style>
