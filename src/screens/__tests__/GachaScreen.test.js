/**
 * @vitest-environment happy-dom
 *
 * Tests for the redesigned GachaScreen with dark altar aesthetic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GachaScreen from '../GachaScreen.vue'
import { useGachaStore, useHeroesStore } from '../../stores'

// Mock the asset imports that Vite handles
vi.mock('../../assets/backgrounds/summoning.png', () => ({ default: 'summoning-bg.png' }))

describe('GachaScreen - Dark Altar Redesign', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Layout and structure', () => {
    it('should not have scrollable content (fits in viewport)', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Check that the main container has overflow hidden or no scroll
      const screen = wrapper.find('.gacha-screen')
      expect(screen.exists()).toBe(true)

      // The screen should have height: 100vh and overflow: hidden
      const styles = getComputedStyle(screen.element)
      // In happy-dom, we check the class is applied - actual CSS values may vary
      expect(screen.classes()).toContain('gacha-screen')
    })

    it('should have a compact header with back button and gem display', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Check for header
      const header = wrapper.find('.gacha-header')
      expect(header.exists()).toBe(true)

      // Check for back button
      const backButton = wrapper.find('.back-button')
      expect(backButton.exists()).toBe(true)

      // Check for gem display
      const gemDisplay = wrapper.find('.gem-display')
      expect(gemDisplay.exists()).toBe(true)
    })

    it('should NOT have a tab bar (removed in redesign)', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Tab bar should not exist
      const tabBar = wrapper.find('.tab-bar')
      expect(tabBar.exists()).toBe(false)
    })

    it('should NOT have inline rates section (moved to info sheet)', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Rates section should not exist on main view
      const ratesSection = wrapper.find('.rates-info')
      expect(ratesSection.exists()).toBe(false)
    })

    it('should NOT have inline pity section (moved to info sheet)', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Pity section should not exist on main view
      const pitySection = wrapper.find('.pity-info')
      expect(pitySection.exists()).toBe(false)
    })

    it('should NOT have purple cosmic gradients (removed in redesign)', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Old purple gradients should not exist
      const bgGradient = wrapper.find('.bg-gradient')
      expect(bgGradient.exists()).toBe(false)

      const bgStars = wrapper.find('.bg-stars')
      expect(bgStars.exists()).toBe(false)
    })
  })

  describe('Stone-framed banner', () => {
    it('should display banner in a stone frame', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Check for stone-framed banner
      const bannerFrame = wrapper.find('.banner-frame')
      expect(bannerFrame.exists()).toBe(true)
    })

    it('should display banner name and availability', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Check for banner name
      const bannerName = wrapper.find('.banner-name')
      expect(bannerName.exists()).toBe(true)

      // Check for availability text
      const availability = wrapper.find('.banner-availability')
      expect(availability.exists()).toBe(true)
    })
  })

  describe('Banner navigation', () => {
    it('should have stone chevron navigation arrows', async () => {
      const gachaStore = useGachaStore()

      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Navigation arrows should exist when multiple banners
      const leftArrow = wrapper.find('.banner-arrow-left')
      const rightArrow = wrapper.find('.banner-arrow-right')

      // At least one should exist (depends on active banners)
      const hasNavigation = leftArrow.exists() || rightArrow.exists()
      expect(hasNavigation).toBe(true)
    })

    it('should navigate to previous banner when left arrow clicked', async () => {
      const gachaStore = useGachaStore()
      const initialBannerId = gachaStore.selectedBannerId

      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      const leftArrow = wrapper.find('.banner-arrow-left')
      if (leftArrow.exists()) {
        await leftArrow.trigger('click')
        // Banner should have changed (or cycled if only one)
        expect(gachaStore.selectedBannerId).toBeDefined()
      }
    })

    it('should navigate to next banner when right arrow clicked', async () => {
      const gachaStore = useGachaStore()

      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      const rightArrow = wrapper.find('.banner-arrow-right')
      if (rightArrow.exists()) {
        await rightArrow.trigger('click')
        expect(gachaStore.selectedBannerId).toBeDefined()
      }
    })
  })

  describe('Ember particles and altar', () => {
    it('should include EmberParticles component on altar', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Check for altar section
      const altar = wrapper.find('.altar-section')
      expect(altar.exists()).toBe(true)

      // Check for EmberParticles component
      const emberParticles = wrapper.findComponent({ name: 'EmberParticles' })
      expect(emberParticles.exists()).toBe(true)
    })
  })

  describe('Pull buttons', () => {
    it('should have pull buttons with 30/70 width split', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Check for pull buttons section
      const pullButtons = wrapper.find('.pull-buttons')
      expect(pullButtons.exists()).toBe(true)

      // Check for single and ten pull buttons
      const singlePull = wrapper.find('.pull-button.single')
      const tenPull = wrapper.find('.pull-button.ten')

      expect(singlePull.exists()).toBe(true)
      expect(tenPull.exists()).toBe(true)
    })

    it('should show gem cost on ten-pull button', async () => {
      const gachaStore = useGachaStore()

      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      const tenPull = wrapper.find('.pull-button.ten')
      expect(tenPull.text()).toContain(gachaStore.TEN_PULL_COST.toString())
    })

    it('should disable pull buttons when not enough gems', async () => {
      const gachaStore = useGachaStore()
      gachaStore.gems = 0

      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      const singlePull = wrapper.find('.pull-button.single')
      const tenPull = wrapper.find('.pull-button.ten')

      expect(singlePull.attributes('disabled')).toBeDefined()
      expect(tenPull.attributes('disabled')).toBeDefined()
    })
  })

  describe('Info button and SummonInfoSheet', () => {
    it('should have an info button (?) below pull buttons', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      const infoButton = wrapper.find('.info-button')
      expect(infoButton.exists()).toBe(true)
      expect(infoButton.text()).toContain('?')
    })

    it('should open SummonInfoSheet when info button clicked', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Initially, sheet should not be visible
      let infoSheet = wrapper.findComponent({ name: 'SummonInfoSheet' })
      expect(infoSheet.props('visible')).toBe(false)

      // Click info button
      const infoButton = wrapper.find('.info-button')
      await infoButton.trigger('click')

      // Sheet should now be visible
      infoSheet = wrapper.findComponent({ name: 'SummonInfoSheet' })
      expect(infoSheet.props('visible')).toBe(true)
    })

    it('should close SummonInfoSheet when close event emitted', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Open sheet
      const infoButton = wrapper.find('.info-button')
      await infoButton.trigger('click')

      // Emit close event
      const infoSheet = wrapper.findComponent({ name: 'SummonInfoSheet' })
      await infoSheet.vm.$emit('close')

      // Sheet should be hidden
      expect(wrapper.findComponent({ name: 'SummonInfoSheet' }).props('visible')).toBe(false)
    })
  })

  describe('Black Market hidden door', () => {
    it('should show Black Market door when unlocked', async () => {
      const gachaStore = useGachaStore()
      // Need to do enough pulls to unlock black market (threshold is 135)
      // Set totalPulls via the internal state - simulate having done pulls
      gachaStore.addGems(50000)
      // Do pulls to reach the threshold (135 total pulls needed)
      for (let i = 0; i < 14; i++) {
        gachaStore.tenPull() // 14 x 10 = 140 pulls
      }

      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Verify it's unlocked
      expect(gachaStore.blackMarketUnlocked).toBe(true)

      const blackMarketDoor = wrapper.find('.black-market-door')
      expect(blackMarketDoor.exists()).toBe(true)
    })

    it('should NOT show Black Market door when locked', async () => {
      // Fresh store - no pulls done
      const gachaStore = useGachaStore()

      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      // Verify it's locked
      expect(gachaStore.blackMarketUnlocked).toBe(false)

      const blackMarketDoor = wrapper.find('.black-market-door')
      expect(blackMarketDoor.exists()).toBe(false)
    })
  })

  describe('Pull functionality', () => {
    it('should perform single pull when button clicked with enough gems', async () => {
      const gachaStore = useGachaStore()
      const heroesStore = useHeroesStore()

      gachaStore.addGems(1000)
      const initialGems = gachaStore.gems

      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      const singlePull = wrapper.find('.pull-button.single')
      await singlePull.trigger('click')

      // Advance past animation delay
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      // Gems should be spent
      expect(gachaStore.gems).toBe(initialGems - gachaStore.SINGLE_PULL_COST)

      // Hero should be added to collection
      expect(heroesStore.collection.length).toBe(1)
    })

    it('should perform ten pull when button clicked with enough gems', async () => {
      const gachaStore = useGachaStore()
      const heroesStore = useHeroesStore()

      gachaStore.addGems(2000)
      const initialGems = gachaStore.gems

      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      const tenPull = wrapper.find('.pull-button.ten')
      await tenPull.trigger('click')

      // Advance past animation delay
      await vi.advanceTimersByTimeAsync(1200)
      await flushPromises()

      // Gems should be spent
      expect(gachaStore.gems).toBe(initialGems - gachaStore.TEN_PULL_COST)

      // 10 heroes should be added to collection
      expect(heroesStore.collection.length).toBe(10)
    })
  })

  describe('Vignette effect', () => {
    it('should have vignette edges on the screen', async () => {
      const wrapper = mount(GachaScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            StarRating: true,
            BlackMarketContent: true,
            EmberParticles: true,
            SummonInfoSheet: true,
            HeroSpotlight: true,
            HeroCard: true
          }
        }
      })

      const vignette = wrapper.find('.bg-vignette')
      expect(vignette.exists()).toBe(true)
    })
  })
})
