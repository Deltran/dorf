<script setup>
import { ref, computed, watch } from 'vue'
import { useIntroStore } from '../stores/intro.js'
import HeroSpotlight from '../components/HeroSpotlight.vue'
import whisperingWoodsMap from '../assets/maps/whispering_woods.png'

const emit = defineEmits(['startBattle', 'complete'])

const introStore = useIntroStore()

const isTextAnimating = ref(false)

// Narrative content
const narrativeScreens = [
  {
    step: 'NARRATIVE_1',
    lines: [
      'The land of Veros is dying.',
      'A creeping darkness spreads from the east — corrupting forests, twisting beasts, waking ancient evils that should have slept forever.'
    ]
  },
  {
    step: 'NARRATIVE_2',
    lines: [
      'The kingdoms have fallen silent. Their armies broken. Their heroes scattered.',
      'But not all hope is lost. Those who still fight seek a commander worthy of leading them against the shadow.'
    ]
  },
  {
    step: 'NARRATIVE_3',
    lines: [
      'Your journey begins in the Whispering Woods — where the corruption first took root, and where the first blow against it must be struck.',
      'Rally the fallen. Command the brave. Reclaim Veros.'
    ]
  }
]

const currentNarrative = computed(() => {
  return narrativeScreens.find(n => n.step === introStore.currentStep)
})

const isNarrativeStep = computed(() => {
  return ['NARRATIVE_1', 'NARRATIVE_2', 'NARRATIVE_3'].includes(introStore.currentStep)
})

const isBattlePrompt = computed(() => introStore.currentStep === 'BATTLE_PROMPT')
const isVictoryOutro = computed(() => introStore.currentStep === 'VICTORY_OUTRO')
const isDefeatMessage = computed(() => introStore.currentStep === 'DEFEAT_MESSAGE')

// Hero spotlights
const showKensinSpotlight = computed(() => introStore.currentStep === 'HERO_SPOTLIGHT_KENSIN')
const showFourStarSpotlight = computed(() => introStore.currentStep === 'HERO_SPOTLIGHT_4STAR')

// Get Kensin hero data for spotlight (created before spotlight step)
const kensinHero = computed(() => {
  if (!showKensinSpotlight.value) return null
  return introStore.starterHero
})

// Get gifted 4-star hero for spotlight (created before spotlight step)
const fourStarHero = computed(() => {
  if (!showFourStarSpotlight.value) return null
  return introStore.giftedHero
})

// Transition text shown before hero spotlights
const transitionText = computed(() => {
  if (introStore.currentStep === 'HERO_SPOTLIGHT_KENSIN') {
    return 'A stalwart defender stands ready...'
  }
  if (introStore.currentStep === 'HERO_SPOTLIGHT_4STAR') {
    return '...and another answers your call.'
  }
  return null
})

// "Joins your cause" text overlay for spotlights
const joinsText = computed(() => {
  if (showKensinSpotlight.value && kensinHero.value) {
    return `${kensinHero.value.template.name} joins your cause.`
  }
  if (showFourStarSpotlight.value && fourStarHero.value) {
    return `${fourStarHero.value.template.name} joins your cause.`
  }
  return null
})

// Trigger text animation on step change
watch(() => introStore.currentStep, () => {
  isTextAnimating.value = false
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isTextAnimating.value = true
    })
  })
}, { immediate: true })

// Heroes are now created in advanceStep() before spotlight steps
// No async watchers needed - heroes exist when spotlights render

function handleContinue() {
  if (introStore.currentStep === 'VICTORY_OUTRO') {
    introStore.advanceStep()
    emit('complete')
  } else {
    introStore.advanceStep()
  }
}

function handleSpotlightDismiss() {
  introStore.advanceStep()
}

function handleStartBattle() {
  introStore.advanceStep() // Move to BATTLE step
  emit('startBattle')
}

function handleRetry() {
  introStore.retryBattle()
  emit('startBattle')
}

function handleGoHome() {
  introStore.goHome()
  emit('complete')
}
</script>

<template>
  <div class="intro-screen" :style="{ backgroundImage: `url(${whisperingWoodsMap})` }">
    <!-- Narrative screens -->
    <div v-if="isNarrativeStep && currentNarrative" class="narrative-container" @click="handleContinue">
      <div class="narrative-content" :class="{ animating: isTextAnimating }">
        <p v-for="(line, index) in currentNarrative.lines" :key="index" class="narrative-line" :style="{ animationDelay: `${index * 0.5}s` }">
          {{ line }}
        </p>
      </div>
      <button class="continue-btn" :class="{ animating: isTextAnimating }">Continue</button>
    </div>

    <!-- Kensin spotlight -->
    <div v-if="showKensinSpotlight" class="spotlight-wrapper">
      <div v-if="transitionText && !kensinHero" class="transition-text" :class="{ animating: isTextAnimating }">
        {{ transitionText }}
      </div>
      <HeroSpotlight
        :hero="kensinHero"
        :visible="!!kensinHero"
        @dismiss="handleSpotlightDismiss"
      />
      <div v-if="kensinHero && joinsText" class="joins-text">{{ joinsText }}</div>
    </div>

    <!-- 4-star spotlight -->
    <div v-if="showFourStarSpotlight" class="spotlight-wrapper">
      <div v-if="transitionText && !fourStarHero" class="transition-text" :class="{ animating: isTextAnimating }">
        {{ transitionText }}
      </div>
      <HeroSpotlight
        :hero="fourStarHero"
        :visible="!!fourStarHero"
        @dismiss="handleSpotlightDismiss"
      />
      <div v-if="fourStarHero && joinsText" class="joins-text">{{ joinsText }}</div>
    </div>

    <!-- Battle prompt -->
    <div v-if="isBattlePrompt" class="narrative-container" @click="handleStartBattle">
      <div class="narrative-content" :class="{ animating: isTextAnimating }">
        <p class="narrative-line">The Whispering Woods await. Darkness gathers at the Dark Thicket...</p>
      </div>
      <button class="begin-btn" :class="{ animating: isTextAnimating }">Begin</button>
    </div>

    <!-- Victory outro -->
    <div v-if="isVictoryOutro" class="narrative-container" @click="handleContinue">
      <div class="narrative-content" :class="{ animating: isTextAnimating }">
        <p class="narrative-line">The first shadow has fallen. But the darkness runs deep.</p>
        <p class="narrative-line" style="animation-delay: 0.5s">Your journey has only begun.</p>
      </div>
      <button class="continue-btn" :class="{ animating: isTextAnimating }">Continue</button>
    </div>

    <!-- Defeat message -->
    <div v-if="isDefeatMessage" class="narrative-container defeat">
      <div class="narrative-content" :class="{ animating: isTextAnimating }">
        <p class="narrative-line">The shadow is strong... but so are you.</p>
      </div>
      <div class="defeat-buttons" :class="{ animating: isTextAnimating }">
        <button class="retry-btn" @click="handleRetry">Try Again</button>
        <button class="home-btn" @click="handleGoHome">Go Home</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.intro-screen {
  position: fixed;
  inset: 0;
  background-color: #0a0f0a;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.intro-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.8) 100%);
  pointer-events: none;
}

/* Narrative screens */
.narrative-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 30px;
  max-width: 480px;
  text-align: center;
  cursor: pointer;
}

.narrative-content {
  margin-bottom: 40px;
}

.narrative-line {
  font-size: 1.125rem;
  line-height: 1.7;
  color: #e5e7eb;
  margin: 0 0 20px;
  font-style: italic;
  opacity: 0;
  transform: translateY(10px);
}

.animating .narrative-line {
  animation: fadeInUp 0.6s ease-out forwards;
}

.narrative-line:last-child {
  margin-bottom: 0;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.continue-btn,
.begin-btn {
  background: transparent;
  border: 1px solid #4b5563;
  color: #9ca3af;
  padding: 12px 32px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
}

.animating .continue-btn,
.animating .begin-btn {
  animation: fadeIn 0.4s ease-out 1s forwards;
}

.continue-btn:hover,
.begin-btn:hover {
  border-color: #6b7280;
  color: #d1d5db;
}

.begin-btn {
  background: rgba(34, 197, 94, 0.15);
  border-color: #22c55e;
  color: #22c55e;
}

.begin-btn:hover {
  background: rgba(34, 197, 94, 0.25);
  border-color: #4ade80;
  color: #4ade80;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* Spotlight wrapper */
.spotlight-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.transition-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.25rem;
  color: #d1d5db;
  font-style: italic;
  text-align: center;
  z-index: 50;
  opacity: 0;
}

.transition-text.animating {
  animation: fadeIn 0.5s ease-out forwards;
}

.joins-text {
  position: fixed;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1rem;
  color: #9ca3af;
  font-weight: 500;
  letter-spacing: 0.05em;
  z-index: 201;
  animation: fadeIn 0.5s ease-out 0.8s forwards;
  opacity: 0;
}

/* Defeat screen */
.defeat .narrative-content {
  margin-bottom: 30px;
}

.defeat-buttons {
  display: flex;
  gap: 16px;
  opacity: 0;
}

.defeat-buttons.animating {
  animation: fadeIn 0.4s ease-out 0.8s forwards;
}

.retry-btn,
.home-btn {
  padding: 12px 24px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.retry-btn {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid #22c55e;
  color: #22c55e;
}

.retry-btn:hover {
  background: rgba(34, 197, 94, 0.25);
}

.home-btn {
  background: transparent;
  border: 1px solid #4b5563;
  color: #9ca3af;
}

.home-btn:hover {
  border-color: #6b7280;
  color: #d1d5db;
}

/* Vignette effect */
.intro-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 150px 50px rgba(0, 0, 0, 0.8);
  pointer-events: none;
}
</style>
