/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatBar from '../StatBar.vue'

describe('StatBar', () => {
  it('renders with required props', () => {
    const wrapper = mount(StatBar, {
      props: { current: 50, max: 100 }
    })
    expect(wrapper.find('.stat-bar').exists()).toBe(true)
    expect(wrapper.find('.bar-fill').exists()).toBe(true)
  })

  it('calculates percentage correctly', () => {
    const wrapper = mount(StatBar, {
      props: { current: 25, max: 100 }
    })
    const fill = wrapper.find('.bar-fill')
    expect(fill.attributes('style')).toContain('width: 25%')
  })

  describe('showLabel prop', () => {
    it('shows label by default when label text is provided', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100, label: 'HP' }
      })
      expect(wrapper.find('.bar-label').exists()).toBe(true)
      expect(wrapper.find('.bar-label').text()).toBe('HP')
    })

    it('hides label when showLabel is false', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100, label: 'HP', showLabel: false }
      })
      expect(wrapper.find('.bar-label').exists()).toBe(false)
    })

    it('shows label when showLabel is true', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100, label: 'HP', showLabel: true }
      })
      expect(wrapper.find('.bar-label').exists()).toBe(true)
    })
  })

  describe('showNumbers prop', () => {
    it('shows numbers by default', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100 }
      })
      expect(wrapper.find('.bar-text').exists()).toBe(true)
      expect(wrapper.find('.bar-text').text()).toBe('50 / 100')
    })

    it('hides numbers when showNumbers is false', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100, showNumbers: false }
      })
      expect(wrapper.find('.bar-text').exists()).toBe(false)
    })

    it('shows numbers when showNumbers is true', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100, showNumbers: true }
      })
      expect(wrapper.find('.bar-text').exists()).toBe(true)
    })

    // Backwards compatibility: showValues should still work
    it('hides numbers when showValues is false (backwards compat)', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100, showValues: false }
      })
      expect(wrapper.find('.bar-text').exists()).toBe(false)
    })
  })

  describe('size prop', () => {
    it('applies md size class by default', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100 }
      })
      expect(wrapper.find('.stat-bar').classes()).toContain('bar-md')
    })

    it('applies sm size class', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100, size: 'sm' }
      })
      expect(wrapper.find('.stat-bar').classes()).toContain('bar-sm')
    })

    it('applies lg size class', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100, size: 'lg' }
      })
      expect(wrapper.find('.stat-bar').classes()).toContain('bar-lg')
    })

    it('applies xs size class', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100, size: 'xs' }
      })
      expect(wrapper.find('.stat-bar').classes()).toContain('bar-xs')
    })
  })

  describe('color prop', () => {
    it('applies green color class by default', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100 }
      })
      expect(wrapper.find('.bar-fill').classes()).toContain('bar-green')
    })

    it('applies specified color class', () => {
      const wrapper = mount(StatBar, {
        props: { current: 50, max: 100, color: 'blue' }
      })
      expect(wrapper.find('.bar-fill').classes()).toContain('bar-blue')
    })
  })
})
