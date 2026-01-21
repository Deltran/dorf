// src/stores/genusLoki.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getGenusLoki, getAllGenusLoki } from '../data/genusLoki.js'

export const useGenusLokiStore = defineStore('genusLoki', () => {
  // State - progress per boss: { [id]: { unlocked, highestCleared, firstClearClaimed } }
  const progress = ref({})

  // Getters
  const unlockedBosses = computed(() => {
    return getAllGenusLoki()
      .filter(boss => progress.value[boss.id]?.unlocked)
      .map(boss => ({
        ...boss,
        highestCleared: progress.value[boss.id]?.highestCleared || 0
      }))
  })

  // Actions
  function isUnlocked(genusLokiId) {
    return progress.value[genusLokiId]?.unlocked || false
  }

  function getHighestCleared(genusLokiId) {
    return progress.value[genusLokiId]?.highestCleared || 0
  }

  function getAvailableLevels(genusLokiId) {
    const boss = getGenusLoki(genusLokiId)
    if (!boss) return []

    const highest = getHighestCleared(genusLokiId)
    const maxAvailable = Math.min(highest + 1, boss.maxPowerLevel)
    return Array.from({ length: maxAvailable }, (_, i) => i + 1)
  }

  function recordVictory(genusLokiId, powerLevel) {
    if (!progress.value[genusLokiId]) {
      progress.value[genusLokiId] = {
        unlocked: false,
        highestCleared: 0,
        firstClearClaimed: false
      }
    }

    const bossProgress = progress.value[genusLokiId]
    const isFirstClear = !bossProgress.firstClearClaimed

    bossProgress.unlocked = true
    bossProgress.highestCleared = Math.max(bossProgress.highestCleared, powerLevel)

    if (isFirstClear) {
      bossProgress.firstClearClaimed = true
    }

    return { isFirstClear }
  }

  // Persistence
  function saveState() {
    return { progress: progress.value }
  }

  function loadState(savedState) {
    if (savedState?.progress) {
      progress.value = savedState.progress
    }
  }

  return {
    // State
    progress,
    // Getters
    unlockedBosses,
    // Actions
    isUnlocked,
    getHighestCleared,
    getAvailableLevels,
    recordVictory,
    // Persistence
    saveState,
    loadState
  }
})
