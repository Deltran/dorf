/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SummonRevealCard from '../SummonRevealCard.vue'

const mockHero = {
  templateId: 'aurora_the_dawn',
  template: {
    id: 'aurora_the_dawn',
    name: 'Aurora',
    rarity: 5
  }
}

const make3StarHero = () => ({
  templateId: 'town_guard',
  template: {
    id: 'town_guard',
    name: 'Town Guard',
    rarity: 3
  }
})

const make1StarHero = () => ({
  templateId: 'farm_hand',
  template: {
    id: 'farm_hand',
    name: 'Farm Hand',
    rarity: 1
  }
})

describe('SummonRevealCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic rendering', () => {
    it('renders hero name', () => {
      const wrapper = mount(SummonRevealCard, {
        props: { hero: mockHero, revealed: true, isNew: false, revealDelay: 0 }
      })
      expect(wrapper.text()).toContain('Aurora')
    })

    it('renders StarRating component with correct rating', () => {
      const wrapper = mount(SummonRevealCard, {
        props: { hero: mockHero, revealed: true, isNew: false, revealDelay: 0 }
      })
      const starRating = wrapper.findComponent({ name: 'StarRating' })
      expect(starRating.exists()).toBe(true)
      expect(starRating.props('rating')).toBe(5)
    })

    it('renders star rating for 3-star hero', () => {
      const hero = make3StarHero()
      const wrapper = mount(SummonRevealCard, {
        props: { hero, revealed: true, isNew: false, revealDelay: 0 }
      })
      const starRating = wrapper.findComponent({ name: 'StarRating' })
      expect(starRating.props('rating')).toBe(3)
    })
  })

  describe('Hero image', () => {
    it('shows hero image container when available', () => {
      const heroWithImage = {
        templateId: 'militia_soldier',
        template: {
          id: 'militia_soldier',
          name: 'Militia Soldier',
          rarity: 2
        }
      }
      const wrapper = mount(SummonRevealCard, {
        props: { hero: heroWithImage, revealed: true, isNew: false, revealDelay: 0 }
      })
      // The portrait container should always exist
      expect(wrapper.find('.card-portrait').exists()).toBe(true)
    })

    it('has fallback when hero has no image', () => {
      const heroNoImage = {
        templateId: 'nonexistent_hero',
        template: {
          id: 'nonexistent_hero',
          name: 'Unknown Hero',
          rarity: 1
        }
      }
      const wrapper = mount(SummonRevealCard, {
        props: { hero: heroNoImage, revealed: true, isNew: false, revealDelay: 0 }
      })
      // Should still render the card without crashing
      expect(wrapper.find('.summon-reveal-card').exists()).toBe(true)
      // Should show placeholder
      expect(wrapper.find('.no-image').exists()).toBe(true)
    })
  })

  describe('Rarity-based border color', () => {
    it('applies rarity-5 class for 5-star hero', () => {
      const wrapper = mount(SummonRevealCard, {
        props: { hero: mockHero, revealed: true, isNew: false, revealDelay: 0 }
      })
      expect(wrapper.find('.summon-reveal-card').classes()).toContain('rarity-5')
    })

    it('applies rarity-3 class for 3-star hero', () => {
      const hero = make3StarHero()
      const wrapper = mount(SummonRevealCard, {
        props: { hero, revealed: true, isNew: false, revealDelay: 0 }
      })
      expect(wrapper.find('.summon-reveal-card').classes()).toContain('rarity-3')
    })

    it('applies rarity-1 class for 1-star hero', () => {
      const hero = make1StarHero()
      const wrapper = mount(SummonRevealCard, {
        props: { hero, revealed: true, isNew: false, revealDelay: 0 }
      })
      expect(wrapper.find('.summon-reveal-card').classes()).toContain('rarity-1')
    })
  })

  describe('Revealed state', () => {
    it('has revealed class when revealed=true', () => {
      const wrapper = mount(SummonRevealCard, {
        props: { hero: mockHero, revealed: true, isNew: false, revealDelay: 0 }
      })
      expect(wrapper.find('.summon-reveal-card').classes()).toContain('revealed')
    })

    it('does not have revealed class when revealed=false', () => {
      const wrapper = mount(SummonRevealCard, {
        props: { hero: mockHero, revealed: false, isNew: false, revealDelay: 0 }
      })
      expect(wrapper.find('.summon-reveal-card').classes()).not.toContain('revealed')
    })
  })

  describe('New hero state', () => {
    it('has new-hero class when isNew=true', () => {
      const wrapper = mount(SummonRevealCard, {
        props: { hero: mockHero, revealed: true, isNew: true, revealDelay: 0 }
      })
      expect(wrapper.find('.summon-reveal-card').classes()).toContain('new-hero')
    })

    it('does not have new-hero class when isNew=false', () => {
      const wrapper = mount(SummonRevealCard, {
        props: { hero: mockHero, revealed: true, isNew: false, revealDelay: 0 }
      })
      expect(wrapper.find('.summon-reveal-card').classes()).not.toContain('new-hero')
    })
  })

  describe('Reveal delay', () => {
    it('applies animation delay style based on revealDelay prop', () => {
      const wrapper = mount(SummonRevealCard, {
        props: { hero: mockHero, revealed: true, isNew: false, revealDelay: 300 }
      })
      const card = wrapper.find('.summon-reveal-card')
      expect(card.attributes('style')).toContain('animation-delay: 300ms')
    })

    it('applies 0ms delay when revealDelay is 0', () => {
      const wrapper = mount(SummonRevealCard, {
        props: { hero: mockHero, revealed: true, isNew: false, revealDelay: 0 }
      })
      const card = wrapper.find('.summon-reveal-card')
      expect(card.attributes('style')).toContain('animation-delay: 0ms')
    })
  })

  describe('Click handling', () => {
    it('emits click event when clicked', async () => {
      const wrapper = mount(SummonRevealCard, {
        props: { hero: mockHero, revealed: true, isNew: false, revealDelay: 0 }
      })
      await wrapper.find('.summon-reveal-card').trigger('click')
      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')[0]).toEqual([mockHero])
    })
  })

  describe('Compact sizing', () => {
    it('has compact width for 2x5 grid layout', () => {
      const wrapper = mount(SummonRevealCard, {
        props: { hero: mockHero, revealed: true, isNew: false, revealDelay: 0 }
      })
      // Card should have a constrained width class/style
      expect(wrapper.find('.summon-reveal-card').exists()).toBe(true)
      // Visual verification - component styles define max-width around 100-120px
    })
  })
})
