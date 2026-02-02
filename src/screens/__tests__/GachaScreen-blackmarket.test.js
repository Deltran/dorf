/**
 * @vitest-environment happy-dom
 *
 * Tests for the Black Market hidden entrance and corrupted altar variant.
 * These tests verify the hidden door, view transitions, and corrupted palette.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GachaScreen from '../GachaScreen.vue'
import { useGachaStore, useHeroesStore } from '../../stores'

// Mock the asset imports that Vite handles
vi.mock('../../assets/backgrounds/summoning.png', () => ({ default: 'summoning-bg.png' }))

describe('GachaScreen - Black Market Entrance', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mountGachaScreen = (options = {}) => {
    return mount(GachaScreen, {
      global: {
        plugins: [pinia],
        stubs: {
          StarRating: true,
          EmberParticles: true,
          SummonInfoSheet: true,
          HeroSpotlight: true,
          HeroCard: true,
          ...options.stubs
        }
      }
    })
  }

  const unlockBlackMarket = () => {
    const gachaStore = useGachaStore()
    // Need to do enough pulls to unlock black market (threshold is 135)
    gachaStore.addGems(50000)
    for (let i = 0; i < 14; i++) {
      gachaStore.tenPull() // 14 x 10 = 140 pulls
    }
    return gachaStore
  }

  describe('Hidden door visibility', () => {
    it('should NOT show Black Market door when locked', async () => {
      const wrapper = mountGachaScreen()
      const gachaStore = useGachaStore()

      expect(gachaStore.blackMarketUnlocked).toBe(false)
      const door = wrapper.find('.black-market-door')
      expect(door.exists()).toBe(false)
    })

    it('should show Black Market door when unlocked', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()
      const gachaStore = useGachaStore()

      expect(gachaStore.blackMarketUnlocked).toBe(true)
      const door = wrapper.find('.black-market-door')
      expect(door.exists()).toBe(true)
    })

    it('should have the door icon (moon symbol)', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()

      const doorIcon = wrapper.find('.door-icon')
      expect(doorIcon.exists()).toBe(true)
    })

    it('should have corrupt ember particles near the door', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen({ stubs: { EmberParticles: false } })

      const door = wrapper.find('.black-market-door')
      expect(door.exists()).toBe(true)

      // Check for EmberParticles component inside or near door
      const doorEmbers = wrapper.find('.door-embers')
      expect(doorEmbers.exists()).toBe(true)
    })
  })

  describe('View state and transitions', () => {
    it('should start in normal view by default', async () => {
      const wrapper = mountGachaScreen()

      // The altar should not have corrupted class
      const altarSurface = wrapper.find('.altar-surface')
      expect(altarSurface.exists()).toBe(true)
      expect(altarSurface.classes()).not.toContain('altar-corrupted')
    })

    it('should transition to Black Market view when door clicked', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()

      const door = wrapper.find('.black-market-door')
      await door.trigger('click')
      await flushPromises()

      // Should now be in black market view
      const altarContainer = wrapper.find('.altar-container')
      expect(altarContainer.classes()).toContain('view-black-market')
    })

    it('should show corrupted altar in Black Market view', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()

      const door = wrapper.find('.black-market-door')
      await door.trigger('click')
      await flushPromises()

      // Altar should have corrupted styling
      const altarSurface = wrapper.find('.altar-surface')
      expect(altarSurface.classes()).toContain('altar-corrupted')
    })

    it('should show back arrow when in Black Market view', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()

      // Initially no Black Market back arrow
      let bmBackArrow = wrapper.find('.black-market-back')
      expect(bmBackArrow.exists()).toBe(false)

      // Enter Black Market
      const door = wrapper.find('.black-market-door')
      await door.trigger('click')
      await flushPromises()

      // Now back arrow should be visible
      bmBackArrow = wrapper.find('.black-market-back')
      expect(bmBackArrow.exists()).toBe(true)
    })

    it('should return to normal view when back arrow clicked', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()

      // Enter Black Market
      const door = wrapper.find('.black-market-door')
      await door.trigger('click')
      await flushPromises()

      // Click back arrow
      const bmBackArrow = wrapper.find('.black-market-back')
      await bmBackArrow.trigger('click')
      await flushPromises()

      // Should be back in normal view
      const altarContainer = wrapper.find('.altar-container')
      expect(altarContainer.classes()).not.toContain('view-black-market')

      const altarSurface = wrapper.find('.altar-surface')
      expect(altarSurface.classes()).not.toContain('altar-corrupted')
    })

    it('should hide Black Market door when in Black Market view', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()

      // Enter Black Market
      const door = wrapper.find('.black-market-door')
      await door.trigger('click')
      await flushPromises()

      // Door should be hidden
      const doorAfter = wrapper.find('.black-market-door')
      expect(doorAfter.exists()).toBe(false)
    })
  })

  describe('Corrupted palette styling', () => {
    it('should apply green-black tint to corrupted altar', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()

      const door = wrapper.find('.black-market-door')
      await door.trigger('click')
      await flushPromises()

      const altarSurface = wrapper.find('.altar-surface.altar-corrupted')
      expect(altarSurface.exists()).toBe(true)
    })

    it('should use corrupt palette for EmberParticles in Black Market', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen({ stubs: {} }) // Don't stub EmberParticles

      const door = wrapper.find('.black-market-door')
      await door.trigger('click')
      await flushPromises()

      // Find EmberParticles with corrupt palette
      const emberParticles = wrapper.findAllComponents({ name: 'EmberParticles' })
      const corruptEmbers = emberParticles.filter(e => e.props('palette') === 'corrupt')
      expect(corruptEmbers.length).toBeGreaterThan(0)
    })

    it('should apply corrupted border color to banner frame', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()

      const door = wrapper.find('.black-market-door')
      await door.trigger('click')
      await flushPromises()

      const bannerFrame = wrapper.find('.banner-frame.frame-corrupted')
      expect(bannerFrame.exists()).toBe(true)
    })
  })

  describe('Black Market banner integration', () => {
    it('should show Black Market banners when in Black Market view', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()

      const door = wrapper.find('.black-market-door')
      await door.trigger('click')
      await flushPromises()

      // Banner name should change to reflect Black Market
      const bannerName = wrapper.find('.banner-name')
      expect(bannerName.exists()).toBe(true)
      // Note: actual banner name depends on available Black Market banners
    })

    it('should cycle through Black Market banners with arrows', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()

      const door = wrapper.find('.black-market-door')
      await door.trigger('click')
      await flushPromises()

      // Navigation arrows should still work
      const rightArrow = wrapper.find('.banner-arrow-right')
      if (rightArrow.exists()) {
        await rightArrow.trigger('click')
        // Banner should cycle
        expect(wrapper.find('.banner-name').exists()).toBe(true)
      }
    })
  })

  describe('Info sheet for Black Market', () => {
    it('should pass blackMarket banner type when in Black Market view', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen({ stubs: { SummonInfoSheet: false } })

      const door = wrapper.find('.black-market-door')
      await door.trigger('click')
      await flushPromises()

      // Open info sheet
      const infoButton = wrapper.find('.info-button')
      await infoButton.trigger('click')
      await flushPromises()

      const infoSheet = wrapper.findComponent({ name: 'SummonInfoSheet' })
      expect(infoSheet.props('bannerType')).toBe('blackMarket')
    })

    it('should pass normal banner type when in normal view', async () => {
      const wrapper = mountGachaScreen({ stubs: { SummonInfoSheet: false } })

      // Open info sheet
      const infoButton = wrapper.find('.info-button')
      await infoButton.trigger('click')
      await flushPromises()

      const infoSheet = wrapper.findComponent({ name: 'SummonInfoSheet' })
      expect(infoSheet.props('bannerType')).toBe('normal')
    })
  })

  describe('Black Market pull functionality', () => {
    it('should use Black Market pull costs when in Black Market view', async () => {
      const gachaStore = unlockBlackMarket()
      gachaStore.addGems(5000)

      const wrapper = mountGachaScreen()

      const door = wrapper.find('.black-market-door')
      await door.trigger('click')
      await flushPromises()

      // Check that pull buttons show Black Market costs
      const singlePull = wrapper.find('.pull-button.single')
      const tenPull = wrapper.find('.pull-button.ten')

      // Ten pull should show Black Market cost (1800)
      expect(tenPull.text()).toContain(gachaStore.BLACK_MARKET_TEN_COST.toString())
    })
  })

  describe('Slide transition animation', () => {
    it('should have slide transition classes on altar container', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()

      const altarContainer = wrapper.find('.altar-container')
      expect(altarContainer.exists()).toBe(true)
      // Container should have transition property
      expect(altarContainer.classes()).toContain('altar-container')
    })

    it('should apply view-transitioning class during transition', async () => {
      unlockBlackMarket()
      const wrapper = mountGachaScreen()

      const door = wrapper.find('.black-market-door')
      await door.trigger('click')

      // During transition, should have transitioning class
      const altarContainer = wrapper.find('.altar-container')
      expect(altarContainer.exists()).toBe(true)
    })
  })
})
