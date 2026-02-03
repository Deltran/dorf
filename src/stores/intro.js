import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHeroesStore } from './heroes.js'
import { getHeroTemplate } from '../data/heroes/index.js'
import { getBannerById } from '../data/banners.js'

// Intro flow steps
const STEPS = [
  'NARRATIVE_1',
  'NARRATIVE_2',
  'NARRATIVE_3',
  'HERO_SPOTLIGHT_KENSIN',
  'HERO_SPOTLIGHT_4STAR',
  'BATTLE_PROMPT',
  'BATTLE',
  'VICTORY_OUTRO',
  'DEFEAT_MESSAGE',
  'COMPLETE'
]

export const useIntroStore = defineStore('intro', () => {
  // State
  const currentStep = ref('NARRATIVE_1')
  const isIntroComplete = ref(false)
  const starterHero = ref(null)
  const giftedHero = ref(null)

  // Actions
  function advanceStep() {
    const currentIndex = STEPS.indexOf(currentStep.value)

    // Special case: VICTORY_OUTRO advances to COMPLETE and marks intro done
    if (currentStep.value === 'VICTORY_OUTRO') {
      currentStep.value = 'COMPLETE'
      isIntroComplete.value = true
      return
    }

    // When advancing from NARRATIVE_3, create heroes BEFORE showing spotlights
    if (currentStep.value === 'NARRATIVE_3') {
      if (!starterHero.value) {
        giftStarterHero()
      }
      if (!giftedHero.value) {
        giftRandomFourStar()
      }
    }

    // Normal progression through narrative and reveal steps
    if (currentIndex >= 0 && currentIndex < STEPS.indexOf('BATTLE')) {
      currentStep.value = STEPS[currentIndex + 1]
    }
  }

  function giftStarterHero() {
    const heroesStore = useHeroesStore()
    const kensin = heroesStore.addHero('town_guard')
    heroesStore.setPartySlot(0, kensin.instanceId)

    // Store reference for spotlight display
    starterHero.value = {
      template: getHeroTemplate('town_guard'),
      instance: kensin
    }

    return starterHero.value
  }

  function giftRandomFourStar() {
    const heroesStore = useHeroesStore()

    // Get 4-star heroes from standard banner pool only
    const standardBanner = getBannerById('standard')
    const fourStarIds = standardBanner.heroPool[4]
    const randomHeroId = fourStarIds[Math.floor(Math.random() * fourStarIds.length)]
    const randomTemplate = getHeroTemplate(randomHeroId)

    // Add hero to collection
    const heroInstance = heroesStore.addHero(randomTemplate.id)

    // Add to party slot 2 (index 1)
    heroesStore.setPartySlot(1, heroInstance.instanceId)

    // Store reference for spotlight display
    giftedHero.value = {
      template: randomTemplate,
      instance: heroInstance
    }

    return giftedHero.value
  }

  function handleVictory() {
    currentStep.value = 'VICTORY_OUTRO'
  }

  function handleDefeat() {
    currentStep.value = 'DEFEAT_MESSAGE'
  }

  function retryBattle() {
    currentStep.value = 'BATTLE'
  }

  function goHome() {
    completeIntro()
  }

  function completeIntro() {
    isIntroComplete.value = true
    currentStep.value = 'COMPLETE'
  }

  // Persistence
  function saveState() {
    return {
      isIntroComplete: isIntroComplete.value
    }
  }

  function loadState(savedState) {
    if (savedState.isIntroComplete !== undefined) {
      isIntroComplete.value = savedState.isIntroComplete
      if (isIntroComplete.value) {
        currentStep.value = 'COMPLETE'
      }
    }
  }

  return {
    // State
    currentStep,
    isIntroComplete,
    starterHero,
    giftedHero,
    // Actions
    advanceStep,
    giftStarterHero,
    giftRandomFourStar,
    handleVictory,
    handleDefeat,
    retryBattle,
    goHome,
    completeIntro,
    // Persistence
    saveState,
    loadState
  }
})
