<script setup>
import { computed } from 'vue'

const props = defineProps({
  hero: { type: Object, default: null },
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['dismiss'])

const heroName = computed(() => props.hero?.template?.name || '')
const epithet = computed(() => props.hero?.template?.epithet || '')
const introQuote = computed(() => props.hero?.template?.introQuote || '')
const rarity = computed(() => props.hero?.template?.rarity || 1)

function handleDismiss() {
  emit('dismiss')
}
</script>

<template>
  <div v-if="visible" class="hero-spotlight" @click="handleDismiss">
    <div class="starfield"></div>
    <div class="nebula" :class="`rarity-${rarity}`"></div>
    <div class="spotlight-content" :class="`rarity-${rarity}`">
      <div class="hero-image-container">
        <!-- Hero image placeholder -->
      </div>
      <div class="hero-text">
        <h2 class="hero-name">{{ heroName }}</h2>
        <p v-if="epithet" class="hero-epithet">{{ epithet }}</p>
        <p v-if="introQuote" class="hero-quote">"{{ introQuote }}"</p>
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
</style>
