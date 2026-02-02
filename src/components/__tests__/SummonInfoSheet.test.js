/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SummonInfoSheet from '../SummonInfoSheet.vue'

// Mock banner data
const mockBanner = {
  id: 'standard',
  name: 'Standard Banner',
  heroPool: {
    5: ['aurora_the_dawn', 'shadow_king'],
    4: ['sir_gallan', 'ember_witch'],
    3: ['town_guard', 'hedge_wizard'],
    2: ['militia_soldier', 'apprentice_mage'],
    1: ['farm_hand', 'street_urchin']
  }
}

// Mock pity info for normal banner
const mockNormalPityInfo = {
  pullsSince4Star: 5,
  pullsSince5Star: 30,
  pity4Percent: 50,
  pity5SoftPercent: 60,
  pity5HardPercent: 33.3,
  current5StarRate: '2.0',
  FOUR_STAR_PITY: 10,
  SOFT_PITY_START: 50,
  HARD_PITY: 90
}

// Mock pity info for black market
const mockBlackMarketPityInfo = {
  pullsSince4Star: 3,
  pullsSince5Star: 45,
  pity4Percent: 30,
  pity5HardPercent: 50,
  FOUR_STAR_PITY: 10,
  HARD_PITY: 90
}

// Mock hero template resolver
vi.mock('../../data/heroes/index.js', () => ({
  getHeroTemplate: (id) => {
    const templates = {
      aurora_the_dawn: { id: 'aurora_the_dawn', name: 'Aurora the Dawn', classId: 'paladin', rarity: 5 },
      shadow_king: { id: 'shadow_king', name: 'Shadow King', classId: 'berserker', rarity: 5 },
      sir_gallan: { id: 'sir_gallan', name: 'Sir Gallan', classId: 'knight', rarity: 4 },
      ember_witch: { id: 'ember_witch', name: 'Ember Witch', classId: 'mage', rarity: 4 },
      town_guard: { id: 'town_guard', name: 'Town Guard', classId: 'knight', rarity: 3 },
      hedge_wizard: { id: 'hedge_wizard', name: 'Hedge Wizard', classId: 'mage', rarity: 3 },
      militia_soldier: { id: 'militia_soldier', name: 'Militia Soldier', classId: 'knight', rarity: 2 },
      apprentice_mage: { id: 'apprentice_mage', name: 'Apprentice Mage', classId: 'mage', rarity: 2 },
      farm_hand: { id: 'farm_hand', name: 'Farm Hand', classId: 'berserker', rarity: 1 },
      street_urchin: { id: 'street_urchin', name: 'Street Urchin', classId: 'ranger', rarity: 1 }
    }
    return templates[id]
  }
}))

describe('SummonInfoSheet', () => {
  describe('Visibility', () => {
    it('renders when visible is true', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })
      expect(wrapper.find('.summon-info-sheet').exists()).toBe(true)
    })

    it('does not render when visible is false', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: false,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })
      expect(wrapper.find('.summon-info-sheet').exists()).toBe(false)
    })

    it('renders backdrop when visible', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })
      expect(wrapper.find('.sheet-backdrop').exists()).toBe(true)
    })
  })

  describe('Hero Pool Display', () => {
    it('displays heroes grouped by rarity from 5-star to 1-star', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      const rarityGroups = wrapper.findAll('.pool-rarity-group')
      expect(rarityGroups.length).toBe(5)

      // Verify order is 5-star first
      expect(rarityGroups[0].text()).toContain('Legendary')
      expect(rarityGroups[1].text()).toContain('Epic')
      expect(rarityGroups[2].text()).toContain('Rare')
      expect(rarityGroups[3].text()).toContain('Uncommon')
      expect(rarityGroups[4].text()).toContain('Common')
    })

    it('displays hero names within their rarity groups', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      expect(wrapper.text()).toContain('Aurora the Dawn')
      expect(wrapper.text()).toContain('Shadow King')
      expect(wrapper.text()).toContain('Sir Gallan')
      expect(wrapper.text()).toContain('Town Guard')
      expect(wrapper.text()).toContain('Militia Soldier')
      expect(wrapper.text()).toContain('Farm Hand')
    })

    it('displays hero class within pool entries', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      expect(wrapper.text()).toContain('paladin')
      expect(wrapper.text()).toContain('knight')
      expect(wrapper.text()).toContain('mage')
    })
  })

  describe('Pity Display for Normal Banner', () => {
    it('displays 4-star pity progress for normal banner', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      expect(wrapper.text()).toContain('4')
      expect(wrapper.text()).toContain('Pity')
      expect(wrapper.text()).toContain('5/10') // pullsSince4Star / FOUR_STAR_PITY
    })

    it('displays 5-star soft pity progress for normal banner', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      expect(wrapper.text()).toContain('Soft Pity')
      expect(wrapper.text()).toContain('30/50') // pullsSince5Star / SOFT_PITY_START
    })

    it('displays 5-star hard pity progress for normal banner', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      expect(wrapper.text()).toContain('Hard Pity')
      expect(wrapper.text()).toContain('30/90') // pullsSince5Star / HARD_PITY
    })

    it('renders pity bar fills with correct width percentages', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      const pityFills = wrapper.findAll('.pity-fill')
      expect(pityFills.length).toBeGreaterThanOrEqual(3)

      // Check that width styles are applied
      const fill4Star = wrapper.find('.pity-fill.pity-4')
      expect(fill4Star.attributes('style')).toContain('width')
    })
  })

  describe('Pity Display for Black Market', () => {
    it('displays Black Market specific pity info', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockBlackMarketPityInfo,
          bannerType: 'blackMarket'
        }
      })

      expect(wrapper.text()).toContain('3/10') // BM pullsSince4Star / FOUR_STAR_PITY
      expect(wrapper.text()).toContain('45/90') // BM pullsSince5Star / HARD_PITY
    })

    it('does not show soft pity for Black Market (only hard pity)', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockBlackMarketPityInfo,
          bannerType: 'blackMarket'
        }
      })

      // Black Market uses different pity display - no soft pity concept
      const softPityElements = wrapper.findAll('.pity-item').filter(el =>
        el.text().includes('Soft Pity')
      )
      expect(softPityElements.length).toBe(0)
    })
  })

  describe('Rates Display', () => {
    it('displays summon rate percentages', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      // Base rates should be visible
      expect(wrapper.text()).toContain('2%') // 5-star base
      expect(wrapper.text()).toContain('8%') // 4-star
      expect(wrapper.text()).toContain('20%') // 3-star
    })
  })

  describe('Close Interactions', () => {
    it('emits close event when backdrop is clicked', async () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      await wrapper.find('.sheet-backdrop').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('close').length).toBe(1)
    })

    it('emits close event when close button is clicked', async () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      await wrapper.find('.sheet-close').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('does not emit close when clicking inside the sheet content', async () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      await wrapper.find('.sheet-content').trigger('click')
      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })

  describe('Swipe to Close', () => {
    it('handles touchstart event', async () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      const sheet = wrapper.find('.sheet-content')
      await sheet.trigger('touchstart', {
        touches: [{ clientY: 100 }]
      })

      // Should not throw and component should handle touch
      expect(wrapper.find('.sheet-content').exists()).toBe(true)
    })

    it('emits close on sufficient swipe down', async () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      const sheet = wrapper.find('.sheet-content')

      // Simulate swipe down
      await sheet.trigger('touchstart', {
        touches: [{ clientY: 100 }]
      })
      await sheet.trigger('touchmove', {
        touches: [{ clientY: 250 }] // 150px down swipe
      })
      await sheet.trigger('touchend')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('does not emit close on insufficient swipe', async () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      const sheet = wrapper.find('.sheet-content')

      // Simulate small swipe (not enough to close)
      await sheet.trigger('touchstart', {
        touches: [{ clientY: 100 }]
      })
      await sheet.trigger('touchmove', {
        touches: [{ clientY: 130 }] // Only 30px down
      })
      await sheet.trigger('touchend')

      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })

  describe('Banner Name Display', () => {
    it('displays the banner name in the header', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      expect(wrapper.text()).toContain('Standard Banner')
    })
  })

  describe('Visual Styling', () => {
    it('has dark stone background styling', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      const content = wrapper.find('.sheet-content')
      expect(content.exists()).toBe(true)
      // The component should have the proper class structure for styling
    })

    it('applies slide-up animation class when visible', () => {
      const wrapper = mount(SummonInfoSheet, {
        props: {
          visible: true,
          banner: mockBanner,
          pityInfo: mockNormalPityInfo,
          bannerType: 'normal'
        }
      })

      const sheet = wrapper.find('.summon-info-sheet')
      expect(sheet.classes()).toContain('visible')
    })
  })
})
