<!-- src/components/TipPopup.vue -->
<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useTipsStore } from '../stores/tips.js'

const tipsStore = useTipsStore()

const tip = computed(() => tipsStore.activeTip)
const anchorEl = computed(() => tipsStore.anchorElement)

// Position state
const cardStyle = ref({})
const pointerStyle = ref({})
const hasAnchor = ref(false)

function dismiss() {
  tipsStore.dismissTip()
}

function calculatePosition() {
  if (!tip.value) return

  const anchor = anchorEl.value
  if (!anchor) {
    // Center position (no anchor)
    hasAnchor.value = false
    cardStyle.value = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
    pointerStyle.value = {}
    return
  }

  hasAnchor.value = true
  const rect = anchor.getBoundingClientRect()
  const cardWidth = 320
  const cardHeight = 180 // Approximate
  const padding = 16
  const pointerSize = 12

  // Calculate horizontal position (centered on anchor)
  let left = rect.left + rect.width / 2 - cardWidth / 2
  left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding))

  // Calculate vertical position (prefer below)
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top

  let top
  let pointerTop
  let pointerDirection

  if (spaceBelow >= cardHeight + pointerSize + padding) {
    // Position below anchor
    top = rect.bottom + pointerSize
    pointerDirection = 'up'
    pointerTop = -pointerSize
  } else if (spaceAbove >= cardHeight + pointerSize + padding) {
    // Position above anchor
    top = rect.top - cardHeight - pointerSize
    pointerDirection = 'down'
    pointerTop = cardHeight
  } else {
    // Fallback to center
    hasAnchor.value = false
    cardStyle.value = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
    pointerStyle.value = {}
    return
  }

  cardStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`
  }

  // Position pointer to point at anchor center
  const pointerLeft = rect.left + rect.width / 2 - left - pointerSize / 2
  pointerStyle.value = {
    left: `${Math.max(padding, Math.min(pointerLeft, cardWidth - padding - pointerSize))}px`,
    top: pointerDirection === 'up' ? `${pointerTop}px` : `${pointerTop}px`,
    transform: pointerDirection === 'down' ? 'rotate(180deg)' : ''
  }
}

// Recalculate on anchor change or window resize
watch([tip, anchorEl], () => {
  if (tip.value) {
    // Small delay to ensure DOM is ready
    setTimeout(calculatePosition, 10)
  }
})

let resizeHandler = null
onMounted(() => {
  resizeHandler = () => {
    if (tip.value) calculatePosition()
  }
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="tip" class="tip-overlay" @click="dismiss">
      <div
        class="tip-card"
        :class="{ 'has-anchor': hasAnchor }"
        :style="cardStyle"
        @click.stop
      >
        <div v-if="hasAnchor" class="tip-pointer" :style="pointerStyle"></div>
        <h3 class="tip-title">{{ tip.title }}</h3>
        <p class="tip-message">{{ tip.message }}</p>
        <button class="tip-button" @click="dismiss">Got it</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tip-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
}

.tip-card {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 20px;
  max-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 1001;
}

.tip-card.has-anchor {
  position: fixed;
}

.tip-pointer {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 12px solid #1f2937;
}

.tip-title {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
}

.tip-message {
  margin: 0 0 20px 0;
  font-size: 0.95rem;
  color: #9ca3af;
  line-height: 1.5;
}

.tip-button {
  display: block;
  width: 100%;
  padding: 12px 24px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 8px;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tip-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}
</style>
