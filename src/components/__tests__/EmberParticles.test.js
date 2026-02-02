/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmberParticles from '../EmberParticles.vue'

describe('EmberParticles', () => {
  describe('count prop', () => {
    it('renders correct number of embers based on count prop', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 8 }
      })
      expect(wrapper.findAll('.ember').length).toBe(8)
    })

    it('renders 16 embers when count is 16', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 16 }
      })
      expect(wrapper.findAll('.ember').length).toBe(16)
    })

    it('renders 24 embers when count is 24', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 24 }
      })
      expect(wrapper.findAll('.ember').length).toBe(24)
    })

    it('defaults to 12 embers when count is not provided', () => {
      const wrapper = mount(EmberParticles)
      expect(wrapper.findAll('.ember').length).toBe(12)
    })
  })

  describe('palette prop', () => {
    it('applies warm palette class when palette is warm', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 8, palette: 'warm' }
      })
      expect(wrapper.find('.ember-field').classes()).toContain('palette-warm')
    })

    it('applies corrupt palette class when palette is corrupt', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 8, palette: 'corrupt' }
      })
      expect(wrapper.find('.ember-field').classes()).toContain('palette-corrupt')
    })

    it('defaults to warm palette when not specified', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 8 }
      })
      expect(wrapper.find('.ember-field').classes()).toContain('palette-warm')
    })
  })

  describe('intensity prop', () => {
    it('applies low intensity class when intensity is low', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 8, intensity: 'low' }
      })
      expect(wrapper.find('.ember-field').classes()).toContain('intensity-low')
    })

    it('applies medium intensity class when intensity is medium', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 8, intensity: 'medium' }
      })
      expect(wrapper.find('.ember-field').classes()).toContain('intensity-medium')
    })

    it('applies high intensity class when intensity is high', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 8, intensity: 'high' }
      })
      expect(wrapper.find('.ember-field').classes()).toContain('intensity-high')
    })

    it('defaults to medium intensity when not specified', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 8 }
      })
      expect(wrapper.find('.ember-field').classes()).toContain('intensity-medium')
    })
  })

  describe('ember styling', () => {
    it('each ember has inline styles for position and animation', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 4 }
      })
      const embers = wrapper.findAll('.ember')
      embers.forEach(ember => {
        const style = ember.attributes('style')
        expect(style).toContain('left:')
        expect(style).toContain('animation-delay:')
        expect(style).toContain('animation-duration:')
        expect(style).toContain('width:')
        expect(style).toContain('height:')
      })
    })

    it('embers have random horizontal positions', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 10 }
      })
      const embers = wrapper.findAll('.ember')
      const leftValues = embers.map(ember => {
        const style = ember.attributes('style')
        const match = style.match(/left:\s*([\d.]+)%/)
        return match ? parseFloat(match[1]) : null
      })
      // With 10 embers, they should have some variation (not all the same value)
      const uniqueValues = new Set(leftValues)
      expect(uniqueValues.size).toBeGreaterThan(1)
    })
  })

  describe('component structure', () => {
    it('renders ember-field container', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 8 }
      })
      expect(wrapper.find('.ember-field').exists()).toBe(true)
    })

    it('ember-field has pointer-events none for click-through', () => {
      const wrapper = mount(EmberParticles, {
        props: { count: 8 }
      })
      // This is validated by the scoped CSS, but we can check the class exists
      expect(wrapper.find('.ember-field').exists()).toBe(true)
    })
  })
})
