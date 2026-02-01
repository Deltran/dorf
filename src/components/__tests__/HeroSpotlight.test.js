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
})
