<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  active: { type: Boolean, default: false }
})

const emit = defineEmits(['screenSwap', 'complete'])

const phase = ref('idle')

// Try to load the battle door image (may not exist yet)
let battleDoorImg = null
try {
  const images = import.meta.glob('../assets/backgrounds/battle_door.png', { eager: true, import: 'default' })
  const path = '../assets/backgrounds/battle_door.png'
  battleDoorImg = images[path] || null
} catch (e) {
  battleDoorImg = null
}

const doorStyle = battleDoorImg
  ? { backgroundImage: `url(${battleDoorImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  : {}

// Watch active prop to trigger the sequence
watch(() => props.active, (newVal) => {
  if (newVal && phase.value === 'idle') {
    startSequence()
  }
})

function startSequence() {
  phase.value = 'closing'
}

function onTransitionEnd(event) {
  // Only respond to transform transitions on the left door
  if (event.propertyName !== 'transform') return

  if (phase.value === 'closing') {
    phase.value = 'closed'
    emit('screenSwap')
    // Hold closed for 400ms, then open
    setTimeout(() => {
      phase.value = 'opening'
    }, 400)
  } else if (phase.value === 'opening') {
    phase.value = 'idle'
    emit('complete')
  }
}
</script>

<template>
  <div class="battle-transition-overlay" :class="phase">
    <div
      class="door door-left"
      :style="doorStyle"
      @transitionend="onTransitionEnd"
    ></div>
    <div
      class="door door-right"
      :style="doorStyle"
    ></div>
  </div>
</template>

<style scoped>
.battle-transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  pointer-events: none;
  visibility: hidden;
}

.battle-transition-overlay:not(.idle) {
  pointer-events: auto;
  visibility: visible;
}

.battle-transition-overlay.idle {
  pointer-events: none;
  visibility: hidden;
}

.door {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  background-color: #0a0e17;
}

.door-left {
  left: 0;
  transform: translateX(-100%);
}

.door-right {
  right: 0;
  transform: translateX(100%) scaleX(-1);
}

/* Closing: doors slide to center */
.closing .door-left {
  transform: translateX(0);
  transition: transform 0.4s ease-in;
}

.closing .door-right {
  transform: translateX(0) scaleX(-1);
  transition: transform 0.4s ease-in;
}

/* Closed: doors stay at center, no transition */
.closed .door-left {
  transform: translateX(0);
}

.closed .door-right {
  transform: translateX(0) scaleX(-1);
}

/* Opening: doors slide back off-screen */
.opening .door-left {
  transform: translateX(-100%);
  transition: transform 0.7s ease-out;
}

.opening .door-right {
  transform: translateX(100%) scaleX(-1);
  transition: transform 0.7s ease-out;
}

/* Idle: doors off-screen, no transition */
.idle .door-left {
  transform: translateX(-100%);
}

.idle .door-right {
  transform: translateX(100%) scaleX(-1);
}
</style>
