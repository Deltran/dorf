<script setup>
import fellowshipHallBg from '../assets/backgrounds/fellowship_hall_bg.png'
import partyBg from '../assets/backgrounds/party_bg.png'
import fusionBg from '../assets/backgrounds/fusion.png'
import shardsBg from '../assets/backgrounds/shards.png'

const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="fellowship-hall-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Fellowship Hall</h1>
      <div class="header-spacer"></div>
    </header>

    <nav class="hub-nav">
      <button
        class="nav-button heroes-button"
        :style="{ backgroundImage: `url(${fellowshipHallBg})` }"
        @click="emit('navigate', 'heroes')"
      >
        <div class="nav-icon-wrapper heroes">
          <span class="nav-icon">⚔️</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Heroes</span>
          <span class="nav-hint">View your collection</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <button
        class="nav-button party-button"
        :style="{ backgroundImage: `url(${partyBg})` }"
        @click="emit('navigate', 'party')"
      >
        <div class="nav-icon-wrapper party">
          <span class="nav-icon">🛡️</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Party</span>
          <span class="nav-hint">Manage your team</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <button
        class="nav-button fusion-button"
        :style="{ backgroundImage: `url(${fusionBg})` }"
        @click="emit('navigate', 'merge')"
      >
        <div class="nav-icon-wrapper fusion">
          <span class="nav-icon">⭐</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Fusion</span>
          <span class="nav-hint">Upgrade stars</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <button
        class="nav-button shards-button"
        :style="{ backgroundImage: `url(${shardsBg})` }"
        @click="emit('navigate', 'shards')"
      >
        <div class="nav-icon-wrapper shards">
          <span class="nav-icon">💎</span>
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
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  overflow: hidden;
}

/* Animated Background - same as other screens */
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
    #1e1b4b 25%,
    #7f1d1d 50%,
    #1e1b4b 75%,
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

.nav-icon-wrapper.heroes {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.nav-icon-wrapper.party {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.nav-icon-wrapper.fusion {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.nav-icon-wrapper.shards {
  background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%);
  box-shadow: 0 4px 12px rgba(192, 38, 211, 0.4);
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
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.75) 0%, rgba(239, 68, 68, 0.6) 100%);
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

.nav-button.heroes-button .nav-icon-wrapper {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(239, 68, 68, 0.5);
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
  box-shadow: 0 4px 25px rgba(239, 68, 68, 0.4);
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
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.75) 0%, rgba(16, 185, 129, 0.6) 100%);
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

.nav-button.party-button .nav-hint {
  color: #f3f4f6;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.nav-button.party-button .nav-icon-wrapper {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(16, 185, 129, 0.5);
}

.nav-button.party-button .nav-arrow {
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.nav-button.party-button:hover .nav-arrow {
  color: rgba(255, 255, 255, 0.9);
}

.nav-button.party-button:hover {
  border-color: #34d399;
  box-shadow: 0 4px 25px rgba(16, 185, 129, 0.4);
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
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.75) 0%, rgba(251, 191, 36, 0.6) 100%);
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

.nav-button.fusion-button .nav-hint {
  color: #f3f4f6;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.nav-button.fusion-button .nav-icon-wrapper {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(251, 191, 36, 0.5);
}

.nav-button.fusion-button .nav-arrow {
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.nav-button.fusion-button:hover .nav-arrow {
  color: rgba(255, 255, 255, 0.9);
}

.nav-button.fusion-button:hover {
  border-color: #fcd34d;
  box-shadow: 0 4px 25px rgba(251, 191, 36, 0.4);
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
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.75) 0%, rgba(192, 38, 211, 0.6) 100%);
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

.nav-button.shards-button .nav-icon-wrapper {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(168, 85, 247, 0.5);
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
  box-shadow: 0 4px 25px rgba(168, 85, 247, 0.4);
}
</style>
