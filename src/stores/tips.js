// src/stores/tips.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tips } from '../data/tips.js'

const STORAGE_KEY = 'dorf_seen_tips'

export const useTipsStore = defineStore('tips', () => {
  // Persisted state - Set of tip IDs the player has dismissed
  const seenTips = ref(new Set())

  // Transient state - currently displayed tip
  const activeTip = ref(null)
  const anchorElement = ref(null)

  /**
   * Show a tip if not already seen
   * @param {string} tipId - ID of the tip to show
   * @param {object} options - Optional overrides (e.g., { anchor: 'custom-id' })
   * @returns {boolean} - True if tip was shown, false if already seen
   */
  function showTip(tipId, options = {}) {
    if (seenTips.value.has(tipId)) return false

    const tipData = tips[tipId]
    if (!tipData) {
      console.warn(`Tip not found: ${tipId}`)
      return false
    }

    // If another tip is showing, don't interrupt
    if (activeTip.value) return false

    activeTip.value = { id: tipId, ...tipData, ...options }

    // Find anchor element if specified
    const anchorId = options.anchor || tipData.anchor
    if (anchorId) {
      // Use nextTick timing to ensure DOM is ready
      setTimeout(() => {
        anchorElement.value = document.getElementById(anchorId)
      }, 0)
    }

    return true
  }

  /**
   * Dismiss the current tip and mark it as seen
   */
  function dismissTip() {
    if (activeTip.value) {
      seenTips.value.add(activeTip.value.id)
      activeTip.value = null
      anchorElement.value = null
      saveTips()
    }
  }

  /**
   * Save seen tips to localStorage
   */
  function saveTips() {
    try {
      const data = Array.from(seenTips.value)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save tips:', e)
    }
  }

  /**
   * Load seen tips from localStorage
   */
  function loadTips() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        seenTips.value = new Set(data)
      }
    } catch (e) {
      console.error('Failed to load tips:', e)
    }
  }

  /**
   * Reset all tips (for testing/admin)
   */
  function resetTips() {
    seenTips.value = new Set()
    activeTip.value = null
    anchorElement.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    seenTips,
    activeTip,
    anchorElement,
    showTip,
    dismissTip,
    loadTips,
    saveTips,
    resetTips
  }
})
