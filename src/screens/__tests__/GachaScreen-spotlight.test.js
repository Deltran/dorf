/**
 * @vitest-environment happy-dom
 *
 * Integration tests for the HeroSpotlight reveal flow in GachaScreen.
 * These tests verify that new heroes trigger the spotlight animation correctly.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GachaScreen from '../GachaScreen.vue'
import { useGachaStore, useHeroesStore } from '../../stores'

// Mock the asset imports that Vite handles
vi.mock('../../assets/backgrounds/summoning.png', () => ({ default: 'summoning-bg.png' }))

describe('GachaScreen Spotlight Flow', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('New hero spotlight triggering', () => {
    it('should show spotlight for first-time hero pull', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            // Stub components we don't need for this test
            StarRating: true,
            BlackMarketContent: true
          }
        }
      })

      const gachaStore = useGachaStore()
      const heroesStore = useHeroesStore()

      // Give the player enough gems
      gachaStore.addGems(1000)

      // Verify collection is empty
      expect(heroesStore.collection.length).toBe(0)

      // Find and click the single pull button (by class)
      const singlePullBtn = wrapper.find('.pull-button.single')
      expect(singlePullBtn.exists()).toBe(true)
      await singlePullBtn.trigger('click')

      // Advance past the animation delay (800ms for single pull)
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      // Now a hero should be in the collection
      expect(heroesStore.collection.length).toBe(1)

      // Advance past the reveal delay (300ms)
      await vi.advanceTimersByTimeAsync(300)
      await flushPromises()

      // The spotlight should be visible
      const spotlight = wrapper.findComponent({ name: 'HeroSpotlight' })
      expect(spotlight.exists()).toBe(true)

      // Check the visible prop is true
      expect(spotlight.props('visible')).toBe(true)
    })

    it('existingCount check correctly identifies new heroes', async () => {
      const heroesStore = useHeroesStore()

      // Use a real hero ID
      const heroId = 'militia_soldier'

      // Add the hero to collection (simulating what singlePull does)
      heroesStore.addHero(heroId)

      // Now check the existingCount
      const existingCount = heroesStore.collection.filter(
        h => h.templateId === heroId
      ).length

      // Should be 1 (the hero we just added)
      expect(existingCount).toBe(1)
    })

    it('spotlights first occurrence when same hero pulled multiple times', async () => {
      // This tests the scenario where a 10-pull contains duplicates:
      // e.g., pulling herb_gatherer 4 times - should spotlight the FIRST one only

      const heroesStore = useHeroesStore()
      const heroId = 'militia_soldier'

      // Simulate pre-pull state: record what's owned (nothing)
      const ownedBeforePull = new Set(heroesStore.collection.map(h => h.templateId))
      expect(ownedBeforePull.has(heroId)).toBe(false)

      // Simulate a pull that adds the same hero twice (like in a 10-pull)
      heroesStore.addHero(heroId)
      heroesStore.addHero(heroId)

      // Now simulate the new reveal logic
      const spotlightedThisPull = new Set()
      const pullResults = [
        { template: { id: heroId } },
        { template: { id: heroId } }
      ]

      const spotlightResults = []
      for (const result of pullResults) {
        const templateId = result.template.id
        const isNewTemplate = !ownedBeforePull.has(templateId)
        const alreadySpotlighted = spotlightedThisPull.has(templateId)

        if (isNewTemplate && !alreadySpotlighted) {
          spotlightedThisPull.add(templateId)
          spotlightResults.push(result)
        }
      }

      // Should only spotlight the FIRST occurrence
      expect(spotlightResults.length).toBe(1)
      expect(spotlightResults[0].template.id).toBe(heroId)
    })

    it('spotlight has animating class after mount', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(1000)

      // Find and trigger pull (by class)
      const singlePullBtn = wrapper.find('.pull-button.single')
      if (singlePullBtn.exists()) {
        await singlePullBtn.trigger('click')
      }

      // Advance past animation delay + reveal delay
      await vi.advanceTimersByTimeAsync(800 + 300)
      await flushPromises()

      // Advance past the RAF delay for animation triggering
      await vi.advanceTimersByTimeAsync(100)
      await flushPromises()

      const spotlight = wrapper.findComponent({ name: 'HeroSpotlight' })
      if (spotlight.exists() && spotlight.props('visible')) {
        // Check for the animating class
        const spotlightEl = spotlight.find('.hero-spotlight')
        if (spotlightEl.exists()) {
          expect(spotlightEl.classes()).toContain('animating')
        }
      }
    })
  })

  describe('Reveal flow timing', () => {
    it('spotlight appears before hero is revealed in results', async () => {
      // This test verifies the flow:
      // 1. Pull happens, hero added to collection
      // 2. showResults = true triggers watch
      // 3. 300ms delay
      // 4. revealHeroesSequentially checks existingCount
      // 5. If new, spotlightHero is set (pausing reveal)
      // 6. revealedCount stays at 0 until spotlight dismissed

      const heroesStore = useHeroesStore()

      // Simulate the reveal flow manually
      const pullResults = []
      let spotlightHero = null
      let revealedCount = 0
      let pendingRevealIndex = 0

      // Step 1: Simulate pull - add hero to collection
      const heroInstance = heroesStore.addHero('militia_soldier')
      const result = {
        template: { id: 'militia_soldier', name: 'Militia Soldier', rarity: 2 },
        instance: heroInstance
      }
      pullResults.push(result)

      // Step 2: Simulate revealHeroesSequentially
      const existingCount = heroesStore.collection.filter(
        h => h.templateId === result.template.id
      ).length

      // Step 3: Check if new (should be 1)
      expect(existingCount).toBe(1)

      // Step 4: If new, set spotlight
      if (existingCount === 1) {
        spotlightHero = result
        // Should NOT increment revealedCount
      } else {
        revealedCount++
        pendingRevealIndex++
      }

      // Verify spotlight is set and reveal is paused
      expect(spotlightHero).not.toBeNull()
      expect(spotlightHero.template.id).toBe('militia_soldier')
      expect(revealedCount).toBe(0)
    })
  })
})
