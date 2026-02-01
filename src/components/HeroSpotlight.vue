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
</style>
