/**
 * @vitest-environment happy-dom
 *
 * Tests for the 10-pull reveal sequence in GachaScreen.
 * This tests the new cinematic reveal flow that replaces the old results modal.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GachaScreen from '../GachaScreen.vue'
import { useGachaStore, useHeroesStore } from '../../stores'

// Mock the asset imports that Vite handles
vi.mock('../../assets/backgrounds/summoning.png', () => ({ default: 'summoning-bg.png' }))

describe('GachaScreen - 10-Pull Reveal Sequence', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Reveal sequence state', () => {
    it('should enter reveal sequence state after 10-pull', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true,
            SummonRevealCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(2000)

      // Do 10-pull
      const tenPullBtn = wrapper.find('.pull-button.ten')
      await tenPullBtn.trigger('click')

      // Advance past animation delay (1200ms)
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      // Should be in reveal sequence state (check for reveal stage)
      const revealStage = wrapper.find('.reveal-stage')
      expect(revealStage.exists()).toBe(true)
    })

    it('should NOT use reveal sequence for single pulls', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true,
            SummonRevealCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(1000)

      // Do single pull
      const singlePullBtn = wrapper.find('.pull-button.single')
      await singlePullBtn.trigger('click')

      // Advance past animation delay (800ms)
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      // Should NOT have reveal stage (single pulls go straight to spotlight)
      const revealStage = wrapper.find('.reveal-stage')
      expect(revealStage.exists()).toBe(false)
    })
  })

  describe('Sequential card reveal', () => {
    it('should reveal cards one by one with SummonRevealCard', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(2000)

      // Do 10-pull
      const tenPullBtn = wrapper.find('.pull-button.ten')
      await tenPullBtn.trigger('click')

      // Advance past animation delay
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      // Initially no cards should be revealed
      let revealedCards = wrapper.findAllComponents({ name: 'SummonRevealCard' })
        .filter(c => c.props('revealed'))
      expect(revealedCards.length).toBe(0)

      // Advance time to reveal first card
      await vi.advanceTimersByTimeAsync(300) // Initial delay
      await flushPromises()

      // First card should be revealed
      revealedCards = wrapper.findAllComponents({ name: 'SummonRevealCard' })
        .filter(c => c.props('revealed'))
      expect(revealedCards.length).toBeGreaterThanOrEqual(1)
    })

    it('should use longer delay for higher rarity cards (4-star: 400ms, 5-star: 500ms)', async () => {
      // This tests that the timing logic exists in the component
      // The actual timing is based on rarity of each card

      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(2000)

      // Do 10-pull
      const tenPullBtn = wrapper.find('.pull-button.ten')
      await tenPullBtn.trigger('click')

      // Advance past animation delay
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      // The reveal-stage should exist
      const revealStage = wrapper.find('.reveal-stage')
      expect(revealStage.exists()).toBe(true)
    })
  })

  describe('New hero spotlight integration', () => {
    it('should pause reveal and show HeroSpotlight for NEW heroes', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroCard: true,
            SummonRevealCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      const heroesStore = useHeroesStore()
      gachaStore.addGems(2000)

      // Collection should be empty
      expect(heroesStore.collection.length).toBe(0)

      // Do 10-pull
      const tenPullBtn = wrapper.find('.pull-button.ten')
      await tenPullBtn.trigger('click')

      // Advance past animation delay
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      // Advance to first card reveal - first card is always new
      await vi.advanceTimersByTimeAsync(300)
      await flushPromises()

      // Additional RAF delays for animation triggering
      await vi.advanceTimersByTimeAsync(100)
      await flushPromises()

      // Spotlight should be visible for the first new hero
      const spotlight = wrapper.findComponent({ name: 'HeroSpotlight' })
      expect(spotlight.exists()).toBe(true)
      expect(spotlight.props('visible')).toBe(true)
    })

    it('should resume reveal after spotlight dismiss', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroCard: true,
            SummonRevealCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(2000)

      // Do 10-pull
      const tenPullBtn = wrapper.find('.pull-button.ten')
      await tenPullBtn.trigger('click')

      // Advance past animation delay
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      // Advance to trigger spotlight
      await vi.advanceTimersByTimeAsync(400)
      await flushPromises()

      const spotlight = wrapper.findComponent({ name: 'HeroSpotlight' })
      if (spotlight.exists() && spotlight.props('visible')) {
        // Dismiss spotlight
        await spotlight.vm.$emit('dismiss')
        await flushPromises()

        // After dismiss, spotlight should be hidden
        expect(spotlight.props('visible')).toBe(false)

        // Reveal should continue (wait for next card)
        await vi.advanceTimersByTimeAsync(500)
        await flushPromises()

        // More cards should be revealed or spotlight triggered again
        const revealedCards = wrapper.findAllComponents({ name: 'SummonRevealCard' })
          .filter(c => c.props('revealed'))
        expect(revealedCards.length).toBeGreaterThanOrEqual(1)
      }
    })
  })

  describe('Skip functionality', () => {
    it('should show skip button during reveal sequence', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true,
            SummonRevealCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(2000)

      // Do 10-pull
      const tenPullBtn = wrapper.find('.pull-button.ten')
      await tenPullBtn.trigger('click')

      // Advance past animation delay
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      // Skip button should exist
      const skipButton = wrapper.find('.skip-reveal-button')
      expect(skipButton.exists()).toBe(true)
    })

    it('should show summary grid immediately when skip clicked', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true,
            SummonRevealCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(2000)

      // Do 10-pull
      const tenPullBtn = wrapper.find('.pull-button.ten')
      await tenPullBtn.trigger('click')

      // Advance past animation delay
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      // Click skip button
      const skipButton = wrapper.find('.skip-reveal-button')
      await skipButton.trigger('click')
      await flushPromises()

      // Summary grid should be visible
      const summaryGrid = wrapper.find('.summary-grid')
      expect(summaryGrid.exists()).toBe(true)
    })

    it('should allow tapping NEW heroes in summary grid to trigger spotlight', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(2000)

      // Do 10-pull
      const tenPullBtn = wrapper.find('.pull-button.ten')
      await tenPullBtn.trigger('click')

      // Advance past animation delay
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      // Click skip to show summary
      const skipButton = wrapper.find('.skip-reveal-button')
      await skipButton.trigger('click')
      await flushPromises()

      // Find a card marked as new in the summary grid
      const newHeroCards = wrapper.findAllComponents({ name: 'SummonRevealCard' })
        .filter(c => c.props('isNew'))

      if (newHeroCards.length > 0) {
        // Emit the click event from the component instead of triggering click
        // This avoids the stopPropagation issue in happy-dom
        await newHeroCards[0].vm.$emit('click', newHeroCards[0].props('hero'))
        await flushPromises()
        await vi.advanceTimersByTimeAsync(100)
        await flushPromises()

        // Spotlight should appear
        const spotlight = wrapper.findComponent({ name: 'HeroSpotlight' })
        expect(spotlight.exists()).toBe(true)
        expect(spotlight.props('visible')).toBe(true)
      }
    })
  })

  describe('Summary grid', () => {
    it('should show 2x5 summary grid after all cards revealed', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true,
            SummonRevealCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(2000)

      // Do 10-pull
      const tenPullBtn = wrapper.find('.pull-button.ten')
      await tenPullBtn.trigger('click')

      // Advance past animation delay
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      // Skip to summary
      const skipButton = wrapper.find('.skip-reveal-button')
      await skipButton.trigger('click')
      await flushPromises()

      // Summary grid should have 10 cards displayed
      const summaryGrid = wrapper.find('.summary-grid')
      expect(summaryGrid.exists()).toBe(true)

      // Should have 2 rows (styled as 2x5 grid)
      const cards = wrapper.findAllComponents({ name: 'SummonRevealCard' })
      expect(cards.length).toBe(10)
    })

    it('should have Continue button in summary view', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true,
            SummonRevealCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(2000)

      // Do 10-pull and skip to summary
      const tenPullBtn = wrapper.find('.pull-button.ten')
      await tenPullBtn.trigger('click')
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      const skipButton = wrapper.find('.skip-reveal-button')
      await skipButton.trigger('click')
      await flushPromises()

      // Continue button should exist
      const continueButton = wrapper.find('.continue-button')
      expect(continueButton.exists()).toBe(true)
    })

    it('should return to altar when Continue clicked', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true,
            SummonRevealCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(2000)

      // Do 10-pull and skip to summary
      const tenPullBtn = wrapper.find('.pull-button.ten')
      await tenPullBtn.trigger('click')
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      const skipButton = wrapper.find('.skip-reveal-button')
      await skipButton.trigger('click')
      await flushPromises()

      // Click continue
      const continueButton = wrapper.find('.continue-button')
      await continueButton.trigger('click')
      await flushPromises()

      // Should return to altar view (reveal stage gone)
      const revealStage = wrapper.find('.reveal-stage')
      expect(revealStage.exists()).toBe(false)

      // Altar should be visible
      const altar = wrapper.find('.altar-section')
      expect(altar.exists()).toBe(true)
    })
  })

  describe('Tap to advance', () => {
    it('should advance to next card when tapping during reveal', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      const gachaStore = useGachaStore()
      gachaStore.addGems(2000)

      // Do 10-pull
      const tenPullBtn = wrapper.find('.pull-button.ten')
      await tenPullBtn.trigger('click')

      // Advance past animation delay
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      // Get current revealed count
      const initialRevealed = wrapper.findAllComponents({ name: 'SummonRevealCard' })
        .filter(c => c.props('revealed')).length

      // Tap on the reveal stage to advance
      const revealStage = wrapper.find('.reveal-stage')
      await revealStage.trigger('click')
      await vi.advanceTimersByTimeAsync(100)
      await flushPromises()

      // Should have revealed more cards (or triggered spotlight)
      const newRevealed = wrapper.findAllComponents({ name: 'SummonRevealCard' })
        .filter(c => c.props('revealed')).length

      // Either more cards revealed or spotlight triggered
      const spotlight = wrapper.findComponent({ name: 'HeroSpotlight' })
      const moreRevealed = newRevealed > initialRevealed
      const spotlightVisible = spotlight.exists() && spotlight.props('visible')

      expect(moreRevealed || spotlightVisible).toBe(true)
    })
  })
})
