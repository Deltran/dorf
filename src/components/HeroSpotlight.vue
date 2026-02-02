<script setup>
import { computed, ref, watch, onMounted } from 'vue'

const props = defineProps({
  hero: { type: Object, default: null },
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['dismiss'])

const isExiting = ref(false)
const isAnimating = ref(false)

// Robust animation trigger that waits for DOM to be ready
function triggerAnimation() {
  isAnimating.value = false

  // Use double-RAF to ensure browser has painted the initial state
  // First RAF: browser acknowledges render
  // Second RAF: browser has actually painted
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isAnimating.value = true
    })
  })
}

// Trigger animation when component mounts
onMounted(() => {
  if (props.visible && props.hero) {
    triggerAnimation()
  }
})

// Watch visible prop - this handles the primary use case
// When spotlight becomes visible, trigger animation
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.hero) {
    isExiting.value = false
    triggerAnimation()
  }
}, { immediate: false })

// Watch hero changes while visible (for sequential reveals)
watch(() => props.hero?.instance?.instanceId, (newId, oldId) => {
  if (newId && newId !== oldId && props.visible) {
    isExiting.value = false
    triggerAnimation()
  }
})

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

// Ember count scales with rarity
const emberCount = computed(() => {
  if (rarity.value === 5) return 24
  if (rarity.value === 4) return 16
  return 8
})

// Generate randomized ember styles
function emberStyle(index) {
  const left = Math.random() * 100
  const delay = Math.random() * 3
  const duration = 2.5 + Math.random() * 2
  const size = 2 + Math.random() * 3
  const drift = -20 + Math.random() * 40
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    width: `${size}px`,
    height: `${size}px`,
    '--drift': `${drift}px`
  }
}

function handleDismiss() {
  if (isExiting.value) return // Prevent multiple dismiss triggers
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
    :key="hero?.instance?.instanceId"
    class="hero-spotlight"
    :class="[`rarity-${rarity}`, { exiting: isExiting, animating: isAnimating }]"
    @click="handleDismiss"
  >
    <div v-if="rarity >= 3" class="ember-field">
      <div class="ember" v-for="n in emberCount" :key="n" :style="emberStyle(n)"></div>
    </div>

    <div class="spotlight-beam"></div>
    <div v-if="rarity === 5" class="light-shaft"></div>

    <div class="spotlight-content">
      <div class="hero-image-container">
        <div class="rim-light"></div>
        <img v-if="heroImageUrl" :src="heroImageUrl" :alt="heroName" class="hero-image" />
        <div v-else class="hero-placeholder">?</div>
      </div>
      <div class="hero-text">
        <h2 class="hero-name">{{ heroName }}</h2>
        <p v-if="epithet" class="hero-epithet">{{ epithet }}</p>
        <p v-if="introQuote" class="hero-quote">"{{ introQuote }}"</p>
      </div>
      <p class="tap-hint">Continue</p>
    </div>
  </div>
</template>

<style scoped>
.hero-spotlight {
  /* Defaults - overridden by rarity classes */
  --rarity-color: #9ca3af;
  --rarity-warm: #a89585;
  --hero-size: 160px;
  --rim-size: 180px;
  --rim-opacity: 0.4;
  --beam-width: 300px;
  --beam-intensity: 0.08;
  --stagger: 0s;
  --entrance-duration: 0.5s;
  --text-delay: 0.4s;

  position: fixed;
  inset: 0;
  background: #050505;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  cursor: pointer;
  overflow: hidden;
}

/* Rarity theming via custom properties
   --stagger: delay before hero appears (anticipation beat)
   --entrance-duration: how long the hero emergence takes
   --text-delay: when text starts (after hero lands)
*/
.rarity-1 {
  --rarity-color: #8b939e; --rarity-warm: #a89585;
  --hero-size: 128px; --rim-size: 140px; --rim-opacity: 0.2;
  --beam-width: 180px; --beam-intensity: 0.04;
  --stagger: 0s; --entrance-duration: 0.25s; --text-delay: 0.2s;
}
.rarity-2 {
  --rarity-color: #2dd468; --rarity-warm: #85c77a;
  --hero-size: 128px; --rim-size: 140px; --rim-opacity: 0.25;
  --beam-width: 200px; --beam-intensity: 0.05;
  --stagger: 0s; --entrance-duration: 0.3s; --text-delay: 0.25s;
}
.rarity-3 {
  --rarity-color: #4a9eff; --rarity-warm: #7ab4ff;
  --rim-opacity: 0.4;
  --stagger: 0.1s; --entrance-duration: 0.4s; --text-delay: 0.4s;
}
.rarity-4 {
  --rarity-color: #b86eff; --rarity-warm: #d4a3ff;
  --hero-size: 200px; --rim-size: 220px; --rim-opacity: 0.5;
  --beam-width: 360px; --beam-intensity: 0.12;
  --stagger: 0.25s; --entrance-duration: 0.5s; --text-delay: 0.6s;
}
.rarity-5 {
  --rarity-color: #ffb020; --rarity-warm: #ffd080;
  --hero-size: 200px; --rim-size: 220px; --rim-opacity: 0.6;
  --beam-width: 360px; --beam-intensity: 0.15;
  --stagger: 0.4s; --entrance-duration: 0.6s; --text-delay: 0.85s;
}

.spotlight-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 20px;
  z-index: 10;
}

/* Embers */
.ember-field {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.ember {
  position: absolute;
  bottom: -10px;
  background: radial-gradient(circle, var(--rarity-warm) 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0;
  animation: emberRise linear infinite;
}

.rarity-5 .ember { animation-duration: 2s; }

@keyframes emberRise {
  0% { opacity: 0; transform: translateY(0) translateX(0); }
  10% { opacity: 0.8; }
  90% { opacity: 0.6; }
  100% { opacity: 0; transform: translateY(-100vh) translateX(var(--drift, 0)); }
}

/* Spotlight beam - appears immediately, hero follows after stagger */
.spotlight-beam {
  position: absolute;
  top: -20%;
  left: 50%;
  width: var(--beam-width);
  height: 120%;
  transform: translateX(-50%);
  background: linear-gradient(180deg, transparent 0%, rgba(255, 248, 230, calc(var(--beam-intensity) * 0.4)) 20%, rgba(255, 248, 230, var(--beam-intensity)) 40%, rgba(255, 248, 230, calc(var(--beam-intensity) * 0.5)) 70%, transparent 100%);
  clip-path: polygon(35% 0%, 65% 0%, 80% 100%, 20% 100%);
  opacity: 0;
  z-index: 2;
}

.animating .spotlight-beam {
  animation: beamReveal 0.4s ease-out forwards;
}

/* For 4-5★, beam widens dramatically as hero appears */
.animating.rarity-4 .spotlight-beam,
.animating.rarity-5 .spotlight-beam {
  animation: beamRevealDramatic 0.6s ease-out forwards;
}

@keyframes beamReveal {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes beamRevealDramatic {
  0% { opacity: 0; transform: translateX(-50%) scaleX(0.6); }
  50% { opacity: 1; transform: translateX(-50%) scaleX(0.8); }
  100% { opacity: 1; transform: translateX(-50%) scaleX(1); }
}

/* Legendary light shaft - descends from above like a curtain */
.light-shaft {
  position: absolute;
  top: -10%;
  left: 50%;
  width: 200px;
  height: 110%;
  transform: translateX(-50%);
  background: linear-gradient(180deg, rgba(255, 200, 100, 0.2) 0%, rgba(255, 220, 150, 0.3) 30%, rgba(255, 200, 100, 0.15) 60%, transparent 100%);
  clip-path: polygon(40% 0%, 60% 0%, 75% 100%, 25% 100%);
  opacity: 0;
  z-index: 3;
}

.animating .light-shaft {
  animation: shaftDescend 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
}

@keyframes shaftDescend {
  0% {
    opacity: 0;
    transform: translateX(-50%) scaleY(0);
    transform-origin: top center;
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) scaleY(1);
  }
}

/* Hero image */
.hero-image-container {
  position: relative;
  width: var(--hero-size);
  height: var(--hero-size);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
}

.animating .hero-image-container {
  animation: heroEmergence var(--entrance-duration, 0.5s) cubic-bezier(0.16, 1, 0.3, 1) var(--stagger, 0s) forwards;
}

.rim-light {
  position: absolute;
  width: var(--rim-size);
  height: var(--rim-size);
  border-radius: 50%;
  background: radial-gradient(circle at 50% 30%, var(--rarity-warm) 0%, transparent 50%);
  opacity: var(--rim-opacity, 0.4);
  filter: blur(8px);
}

.rarity-4 .rim-light { animation: rimPulse 2s ease-in-out infinite; }
.rarity-5 .rim-light { animation: legendaryRim 1.5s ease-in-out infinite; }

@keyframes rimPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

@keyframes legendaryRim {
  0%, 100% { opacity: 0.6; transform: scale(1); filter: blur(8px); }
  50% { opacity: 0.9; transform: scale(1.1); filter: blur(12px); }
}

.hero-image {
  position: relative;
  width: var(--hero-size);
  height: var(--hero-size);
  image-rendering: pixelated;
  z-index: 1;
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.8));
}

.hero-placeholder {
  position: relative;
  width: var(--hero-size);
  height: var(--hero-size);
  background: rgba(30, 30, 30, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.5rem;
  color: #3a3a3a;
  z-index: 1;
}

@keyframes heroEmergence {
  0% { opacity: 0; transform: translateY(30px) scale(0.9); filter: brightness(0) drop-shadow(0 4px 20px rgba(0, 0, 0, 0.8)); }
  60% { filter: brightness(1.2) drop-shadow(0 4px 20px rgba(0, 0, 0, 0.8)); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1) drop-shadow(0 4px 20px rgba(0, 0, 0, 0.8)); }
}

/* Typography - all timings relative to --text-delay */
.hero-name {
  font-size: 1.875rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--rarity-color, #9ca3af);
  margin: 0;
  text-transform: uppercase;
  opacity: 0;
}

.animating .hero-name {
  animation: textSlam 0.25s cubic-bezier(0.16, 1, 0.3, 1) var(--text-delay, 0.4s) forwards;
}

.rarity-4 .hero-name,
.rarity-5 .hero-name {
  font-size: 2.25rem;
}

@keyframes textSlam {
  from { opacity: 0; transform: translateY(-10px); letter-spacing: 0.1em; }
  to { opacity: 1; transform: translateY(0); letter-spacing: -0.02em; }
}

.hero-epithet {
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #6b7280;
  margin: -4px 0 0;
  opacity: 0;
}

.animating .hero-epithet {
  animation: fadeUp 0.2s ease-out calc(var(--text-delay, 0.4s) + 0.15s) forwards;
}

.hero-quote {
  font-size: 0.95rem;
  color: #52525b;
  font-style: italic;
  margin: 8px auto 0;
  max-width: 280px;
  line-height: 1.4;
  text-align: center;
  opacity: 0;
}

.animating .hero-quote {
  animation: fadeIn 0.3s ease-out calc(var(--text-delay, 0.4s) + 0.3s) forwards;
}

.tap-hint {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #52525b;
  margin-top: 40px;
  padding: 8px 20px;
  border: 1px solid #3f3f46;
  border-radius: 4px;
  opacity: 0;
  transition: border-color 0.15s, color 0.15s;
}

.animating .tap-hint {
  animation: hintAppear 0.3s ease-out calc(var(--text-delay, 0.4s) + 0.6s) forwards;
}

.tap-hint:hover {
  color: #71717a;
  border-color: #52525b;
}

@keyframes hintAppear {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 0.7; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}


/* Epic (4★) - purple flash on entry */
.rarity-4::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 45%, var(--rarity-color) 0%, transparent 60%);
  opacity: 0;
  pointer-events: none;
  z-index: 5;
}

.animating.rarity-4::before {
  animation: epicFlash 0.4s ease-out forwards;
}

@keyframes epicFlash {
  0% { opacity: 0.6; transform: scale(0.8); }
  100% { opacity: 0; transform: scale(1.5); }
}

/* Legendary (5★) - screen shake + golden burst */
.animating.rarity-5 {
  animation: legendaryShake 0.5s ease-out 0.25s;
}

.rarity-5::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 45%, var(--rarity-color) 0%, transparent 50%);
  opacity: 0;
  pointer-events: none;
  z-index: 5;
}

.animating.rarity-5::before {
  animation: legendaryBurst 0.7s ease-out forwards;
}

@keyframes legendaryShake {
  0%, 100% { transform: translateX(0); }
  15%, 45%, 75% { transform: translateX(-4px); }
  30%, 60%, 90% { transform: translateX(4px); }
}

@keyframes legendaryBurst {
  0% { opacity: 0.8; transform: scale(0.5); }
  40% { opacity: 0.5; }
  100% { opacity: 0; transform: scale(2); }
}

/* Exit */
.exiting { animation: fadeOut 0.2s ease-in forwards; }
.exiting .hero-image-container { animation: exitDown 0.15s ease-in forwards; }
.exiting .hero-text,
.exiting .ember-field,
.exiting .spotlight-beam,
.exiting .light-shaft { animation: fadeOut 0.15s ease-in forwards; }

@keyframes fadeOut {
  to { opacity: 0; }
}

@keyframes exitDown {
  to { opacity: 0; transform: translateY(10px); }
}

/* Reduced motion: instant reveals, no transforms */
@media (prefers-reduced-motion: reduce) {
  .hero-spotlight,
  .hero-spotlight * {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
