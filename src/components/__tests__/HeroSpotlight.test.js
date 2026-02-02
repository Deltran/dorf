/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import HeroSpotlight from '../HeroSpotlight.vue'

const mockHero = {
  templateId: 'aurora_the_dawn',
  template: {
    id: 'aurora_the_dawn',
    name: 'Aurora',
    rarity: 5,
    epithet: 'The Dawn',
    introQuote: 'Light breaks even the longest darkness.'
  }
}

describe('HeroSpotlight', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders when visible with hero', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.find('.hero-spotlight').exists()).toBe(true)
  })

  it('does not render when not visible', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: false }
    })
    expect(wrapper.find('.hero-spotlight').exists()).toBe(false)
  })

  it('displays hero name', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.text()).toContain('Aurora')
  })

  it('displays epithet when present', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.text()).toContain('The Dawn')
  })

  it('displays introQuote when present', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.text()).toContain('Light breaks even the longest darkness.')
  })

  it('emits dismiss event on click after animation delay', async () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    await wrapper.find('.hero-spotlight').trigger('click')
    // Dismiss is delayed by 250ms for exit animation
    vi.advanceTimersByTime(250)
    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })

  it('applies rarity class to root element', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.find('.hero-spotlight').classes()).toContain('rarity-5')
  })

  it('applies correct rarity class for 3-star heroes', () => {
    const rareHero = {
      ...mockHero,
      template: { ...mockHero.template, rarity: 3 }
    }
    const wrapper = mount(HeroSpotlight, {
      props: { hero: rareHero, visible: true }
    })
    expect(wrapper.find('.hero-spotlight').classes()).toContain('rarity-3')
  })

  it('applies correct rarity class for 2-star heroes', () => {
    const uncommonHero = {
      ...mockHero,
      template: { ...mockHero.template, rarity: 2 }
    }
    const wrapper = mount(HeroSpotlight, {
      props: { hero: uncommonHero, visible: true }
    })
    expect(wrapper.find('.hero-spotlight').classes()).toContain('rarity-2')
  })

  it('renders ember field for 3+ star heroes', () => {
    const rareHero = {
      ...mockHero,
      template: { ...mockHero.template, rarity: 3 }
    }
    const wrapper = mount(HeroSpotlight, {
      props: { hero: rareHero, visible: true }
    })
    expect(wrapper.find('.ember-field').exists()).toBe(true)
  })

  it('does not render ember field for 1-2 star heroes', () => {
    const commonHero = {
      ...mockHero,
      template: { ...mockHero.template, rarity: 2 }
    }
    const wrapper = mount(HeroSpotlight, {
      props: { hero: commonHero, visible: true }
    })
    expect(wrapper.find('.ember-field').exists()).toBe(false)
  })

  it('renders hero image container with rim light', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.find('.hero-image-container').exists()).toBe(true)
    expect(wrapper.find('.rim-light').exists()).toBe(true)
  })

  it('renders spotlight beam for all rarities', () => {
    const commonHero = {
      ...mockHero,
      template: { ...mockHero.template, rarity: 1 }
    }
    const wrapper = mount(HeroSpotlight, {
      props: { hero: commonHero, visible: true }
    })
    expect(wrapper.find('.spotlight-beam').exists()).toBe(true)
  })

  it('renders light shaft only for 5-star heroes', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.find('.light-shaft').exists()).toBe(true)
  })

  it('does not render light shaft for 4-star heroes', () => {
    const epicHero = {
      ...mockHero,
      template: { ...mockHero.template, rarity: 4 }
    }
    const wrapper = mount(HeroSpotlight, {
      props: { hero: epicHero, visible: true }
    })
    expect(wrapper.find('.light-shaft').exists()).toBe(false)
  })

  it('applies exiting class when dismissing', async () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    await wrapper.find('.hero-spotlight').trigger('click')
    expect(wrapper.find('.hero-spotlight').classes()).toContain('exiting')
  })

  it('renders continue button', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.find('.tap-hint').text()).toBe('Continue')
  })

  describe('Animation triggering', () => {
    it('applies animating class after mount and frame', async () => {
      const wrapper = mount(HeroSpotlight, {
        props: { hero: mockHero, visible: true }
      })

      // Initially should NOT have animating class (before RAF fires)
      expect(wrapper.find('.hero-spotlight').classes()).not.toContain('animating')

      // Advance through nextTick + requestAnimationFrame
      await vi.runAllTimersAsync()
      await wrapper.vm.$nextTick()

      // Now should have animating class
      expect(wrapper.find('.hero-spotlight').classes()).toContain('animating')
    })

    it('applies animating class for 1-star heroes', async () => {
      const commonHero = {
        ...mockHero,
        template: { ...mockHero.template, rarity: 1 }
      }
      const wrapper = mount(HeroSpotlight, {
        props: { hero: commonHero, visible: true }
      })

      await vi.runAllTimersAsync()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.hero-spotlight').classes()).toContain('animating')
    })

    it('applies animating class for 2-star heroes', async () => {
      const uncommonHero = {
        ...mockHero,
        template: { ...mockHero.template, rarity: 2 }
      }
      const wrapper = mount(HeroSpotlight, {
        props: { hero: uncommonHero, visible: true }
      })

      await vi.runAllTimersAsync()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.hero-spotlight').classes()).toContain('animating')
    })

    it('resets and reapplies animating class when hero changes', async () => {
      const wrapper = mount(HeroSpotlight, {
        props: { hero: mockHero, visible: true }
      })

      // Initial animation
      await vi.runAllTimersAsync()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.hero-spotlight').classes()).toContain('animating')

      // Change hero
      const newHero = {
        ...mockHero,
        instance: { instanceId: 'new-hero-id' },
        template: { ...mockHero.template, name: 'New Hero' }
      }
      await wrapper.setProps({ hero: newHero })

      // Should reset animating (briefly false)
      // Then re-apply after RAF
      await vi.runAllTimersAsync()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.hero-spotlight').classes()).toContain('animating')
    })

    it('animation works when component mounts with hero already set (first pull scenario)', async () => {
      // This simulates the exact scenario: component mounts fresh with hero data
      // This is what happens on first pull - no prior mount, hero is set immediately
      const firstPullHero = {
        instance: { instanceId: 'first-pull-123' },
        template: {
          id: 'militia_soldier',
          name: 'Militia Soldier',
          rarity: 2,
          epithet: null,
          introQuote: null
        }
      }

      const wrapper = mount(HeroSpotlight, {
        props: { hero: firstPullHero, visible: true }
      })

      // Advance all timers and ticks
      await vi.runAllTimersAsync()
      await wrapper.vm.$nextTick()

      // MUST have animating class
      expect(wrapper.find('.hero-spotlight').classes()).toContain('animating')
      expect(wrapper.find('.hero-spotlight').classes()).toContain('rarity-2')
    })
  })
})
