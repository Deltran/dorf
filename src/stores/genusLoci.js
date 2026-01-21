// src/stores/genusLoci.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getGenusLoci, getAllGenusLoci } from '../data/genusLoci.js'

export const useGenusLociStore = defineStore('genusLoci', () => {
  // State - progress per boss: { [id]: { unlocked, highestCleared, firstClearClaimed } }
  const progress = ref({})

  // Getters
  const unlockedBosses = computed(() => {
    return getAllGenusLoci()
      .filter(boss => progress.value[boss.id]?.unlocked)
      .map(boss => ({
        ...boss,
        highestCleared: progress.value[boss.id]?.highestCleared || 0
      }))
  })

  // Actions
  function isUnlocked(genusLociId) {
    return progress.value[genusLociId]?.unlocked || false
  }

  function getHighestCleared(genusLociId) {
    return progress.value[genusLociId]?.highestCleared || 0
  }

  function getAvailableLevels(genusLociId) {
    const boss = getGenusLoci(genusLociId)
    if (!boss) return []

    const highest = getHighestCleared(genusLociId)
    const maxAvailable = Math.min(highest + 1, boss.maxPowerLevel)
    return Array.from({ length: maxAvailable }, (_, i) => i + 1)
  }

  function recordVictory(genusLociId, powerLevel) {
    if (!progress.value[genusLociId]) {
      progress.value[genusLociId] = {
        unlocked: false,
        highestCleared: 0,
        firstClearClaimed: false
      }
    }

    const bossProgress = progress.value[genusLociId]
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
