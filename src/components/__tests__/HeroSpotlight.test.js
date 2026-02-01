/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
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

  it('emits dismiss event on click', async () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    await wrapper.find('.hero-spotlight').trigger('click')
    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })

  it('applies rarity-5 class for legendary heroes', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.find('.spotlight-content').classes()).toContain('rarity-5')
  })

  it('applies rarity-3 class for rare heroes', () => {
    const rareHero = {
      ...mockHero,
      template: { ...mockHero.template, rarity: 3 }
    }
    const wrapper = mount(HeroSpotlight, {
      props: { hero: rareHero, visible: true }
    })
    expect(wrapper.find('.spotlight-content').classes()).toContain('rarity-3')
  })

  it('renders starfield background', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.find('.starfield').exists()).toBe(true)
  })

  it('renders hero image container with glow', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.find('.hero-image-container').exists()).toBe(true)
    expect(wrapper.find('.hero-glow').exists()).toBe(true)
  })

  it('has entrance animation class on hero image', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.find('.hero-image-container').classes()).toContain('animate-entrance')
  })

  it('has slam animation class on hero name', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.find('.hero-name').classes()).toContain('animate-slam')
  })

  it('applies screen-shake class for 5-star heroes', () => {
    const wrapper = mount(HeroSpotlight, {
      props: { hero: mockHero, visible: true }
    })
    expect(wrapper.find('.hero-spotlight').classes()).toContain('shake-5star')
  })

  it('does not apply screen-shake for lower rarity', () => {
    const rareHero = {
      ...mockHero,
      template: { ...mockHero.template, rarity: 3 }
    }
    const wrapper = mount(HeroSpotlight, {
      props: { hero: rareHero, visible: true }
    })
    expect(wrapper.find('.hero-spotlight').classes()).not.toContain('shake-5star')
  })
})
