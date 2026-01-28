<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { tooltipState } from '../composables/useTooltip.js'

function dismiss() {
  tooltipState.visible = false
}

// Dismiss on scroll or outside touch
function handleScroll() {
  dismiss()
}

function handlePointerDown(event) {
  if (!event.target.closest('.tooltip-bubble')) {
    dismiss()
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, true)
  document.addEventListener('pointerdown', handlePointerDown)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll, true)
  document.removeEventListener('pointerdown', handlePointerDown)
})

const style = computed(() => {
  const padding = 12
  const viewportWidth = window.innerWidth
  let left = tooltipState.x
  // Clamp to viewport
  left = Math.max(padding + 100, Math.min(viewportWidth - padding - 100, left))
  return {
    left: `${left}px`,
    top: `${tooltipState.y}px`
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="tooltipState.visible" class="tooltip-container" :style="style">
      <div class="tooltip-bubble">
        {{ tooltipState.text }}
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tooltip-container {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  transform: translate(-50%, -100%);
  padding-bottom: 8px;
}

.tooltip-bubble {
  background: #0f172a;
  color: #e2e8f0;
  font-size: 0.8rem;
  line-height: 1.4;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #334155;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  max-width: 240px;
  text-align: center;
  white-space: pre-line;
  pointer-events: auto;
  animation: tooltipFadeIn 0.15s ease;
}

@keyframes tooltipFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
