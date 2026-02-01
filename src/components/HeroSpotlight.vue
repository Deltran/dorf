<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  hero: { type: Object, default: null },
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['dismiss'])

const isExiting = ref(false)

const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })

const heroImageUrl = computed(() => {
  const heroId = props.hero?.template?.id
  if (!heroId) return null
  const gifPath = `../assets/heroes/${heroId}.gif`
  if (heroGifs[gifPath]) return heroGifs[gifPath]
  const pngPath = `../assets/heroes/${heroId}.png`
  return heroImages[pngPath] || null
})

const heroName = computed(() => props.hero?.template?.name || '')
const epithet = computed(() => props.hero?.template?.epithet || '')
const introQuote = computed(() => props.hero?.template?.introQuote || '')
const rarity = computed(() => props.hero?.template?.rarity || 1)

function handleDismiss() {
  isExiting.value = true
  setTimeout(() => {
    isExiting.value = false
    emit('dismiss')
  }, 250) // Wait for exit animation
}
</script>

<template>
  <div
    v-if="visible"
    class="hero-spotlight"
    :class="{
      'shake-5star': rarity === 5 && !isExiting,
      'exiting': isExiting
    }"
    @click="handleDismiss"
  >
    <div class="starfield"></div>
    <div class="nebula" :class="`rarity-${rarity}`"></div>
    <div
      class="spotlight-content"
      :class="[
        `rarity-${rarity}`,
        { 'enhanced-4star': rarity === 4, 'enhanced-5star': rarity === 5 }
      ]"
    >
      <div class="hero-image-container animate-entrance">
        <div class="hero-glow" :class="`rarity-${rarity}`"></div>
        <img
          v-if="heroImageUrl"
          :src="heroImageUrl"
          :alt="heroName"
          class="hero-image"
        />
        <div v-else class="hero-placeholder">?</div>
      </div>
      <div class="hero-text">
        <h2 class="hero-name animate-slam" :class="`rarity-${rarity}`">{{ heroName }}</h2>
        <p v-if="epithet" class="hero-epithet animate-sweep">{{ epithet }}</p>
        <p v-if="introQuote" class="hero-quote animate-fade">"{{ introQuote }}"</p>
      </div>
      <p class="tap-hint">Tap to continue</p>
    </div>
  </div>
</template>

<style scoped>
.hero-spotlight {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  cursor: pointer;
}

.spotlight-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  padding: 20px;
}

/* Rarity color variables */
.rarity-1 { --rarity-color: #9ca3af; }
.rarity-2 { --rarity-color: #22c55e; }
.rarity-3 { --rarity-color: #3b82f6; }
.rarity-4 { --rarity-color: #a855f7; }
.rarity-5 { --rarity-color: #f59e0b; }

.hero-name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--rarity-color, #f3f4f6);
  text-shadow: 0 0 20px var(--rarity-color);
  margin: 0;
}

.hero-epithet {
  font-size: 1.2rem;
  color: #9ca3af;
  margin: 0;
}

.hero-quote {
  font-size: 1rem;
  color: #6b7280;
  font-style: italic;
  margin: 0;
  max-width: 300px;
}

.tap-hint {
  font-size: 0.8rem;
  color: #4b5563;
  margin-top: 24px;
}

.starfield {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.4), transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.3), transparent),
    radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.4), transparent),
    radial-gradient(2px 2px at 130px 80px, rgba(255,255,255,0.3), transparent),
    radial-gradient(1px 1px at 160px 120px, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 200px 90px, rgba(255,255,255,0.3), transparent),
    radial-gradient(2px 2px at 250px 150px, rgba(255,255,255,0.4), transparent),
    radial-gradient(1px 1px at 300px 60px, rgba(255,255,255,0.3), transparent);
  background-size: 350px 200px;
  animation: starDrift 20s linear infinite;
}

@keyframes starDrift {
  0% { background-position: 0 0; }
  100% { background-position: 350px -200px; }
}

.nebula {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 400px;
  height: 400px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, var(--rarity-color) 0%, transparent 70%);
  opacity: 0.15;
  animation: nebulaPulse 3s ease-in-out infinite;
}

@keyframes nebulaPulse {
  0%, 100% { opacity: 0.15; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.25; transform: translate(-50%, -50%) scale(1.1); }
}

.hero-image-container {
  position: relative;
  width: 128px;
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-glow {
  position: absolute;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--rarity-color) 0%, transparent 70%);
  opacity: 0.6;
  animation: heroGlowPulse 2s ease-in-out infinite;
}

@keyframes heroGlowPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.hero-image {
  position: relative;
  width: 128px;
  height: 128px;
  image-rendering: pixelated;
  z-index: 1;
}

.hero-placeholder {
  position: relative;
  width: 128px;
  height: 128px;
  background: rgba(55, 65, 81, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #4b5563;
  z-index: 1;
}

/* Entrance animations */
.animate-entrance {
  animation: heroEntrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes heroEntrance {
  0% { opacity: 0; transform: scale(0); }
  70% { transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}

.animate-slam {
  animation: textSlam 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: 0.4s;
  opacity: 0;
}

@keyframes textSlam {
  0% { opacity: 0; transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}

.animate-sweep {
  animation: textSweep 0.2s ease-out forwards;
  animation-delay: 0.55s;
  opacity: 0;
  transform: translateX(20px);
}

@keyframes textSweep {
  0% { opacity: 0; transform: translateX(20px); }
  100% { opacity: 1; transform: translateX(0); }
}

.animate-fade {
  animation: textFade 0.3s ease-out forwards;
  animation-delay: 0.75s;
  opacity: 0;
}

@keyframes textFade {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.tap-hint {
  animation: textFade 0.3s ease-out forwards;
  animation-delay: 1.5s;
  opacity: 0;
}

.shake-5star {
  animation: screenShake 0.4s ease-out;
  animation-delay: 0.4s;
}

@keyframes screenShake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
  20%, 40%, 60%, 80% { transform: translateX(3px); }
}

/* 5-star specific enhancements */
.rarity-5 .hero-glow {
  animation: heroGlowPulse5Star 1.5s ease-in-out infinite;
}

@keyframes heroGlowPulse5Star {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}

/* Golden burst particles for 5-star */
.rarity-5.animate-entrance::after {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 50%);
  animation: goldenBurst 0.6s ease-out forwards;
}

@keyframes goldenBurst {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

/* 4-star enhancements */
.enhanced-4star .hero-glow {
  animation: heroGlowPulse4Star 2s ease-in-out infinite;
}

@keyframes heroGlowPulse4Star {
  0%, 100% { opacity: 0.65; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.08); }
}

.enhanced-4star .starfield {
  animation: starDrift 15s linear infinite;
}

.enhanced-4star::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
  animation: purpleFlash 0.3s ease-out;
  pointer-events: none;
}

@keyframes purpleFlash {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(3); }
}

.exiting {
  animation: spotlightExit 0.25s ease-in forwards;
}

.exiting .hero-image-container {
  animation: heroExit 0.2s ease-in forwards;
}

.exiting .hero-text {
  animation: textExit 0.15s ease-in forwards;
}

@keyframes spotlightExit {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes heroExit {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.9); }
}

@keyframes textExit {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
