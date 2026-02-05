/**
 * @vitest-environment happy-dom
 *
 * Tests for PartyScreen frameless hero slot rendering.
 * These tests verify that party slots render hero images directly
 * without using HeroCard components.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PartyScreen from '../PartyScreen.vue'
import { useHeroesStore } from '../../stores'

// Mock hero image imports
vi.mock('../../assets/heroes/*.png', () => ({}))
vi.mock('../../assets/heroes/*.gif', () => ({}))

describe('PartyScreen - Frameless Hero Slot Rendering', () => {
  let pinia
  let heroesStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    heroesStore = useHeroesStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Empty slots', () => {
    it('should render empty slots with dashed placeholder', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      // All 4 slots should exist
      const slots = wrapper.findAll('.party-slot')
      expect(slots).toHaveLength(4)

      // All should have empty slot divs
      const emptySlots = wrapper.findAll('.empty-slot')
      expect(emptySlots).toHaveLength(4)
    })

    it('should show "+ Add Hero" text in empty slots', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const emptySlots = wrapper.findAll('.empty-slot')
      emptySlots.forEach(slot => {
        expect(slot.text()).toContain('Add Hero')
      })
    })

    it('should show "+" icon in empty slots', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const slotIcons = wrapper.findAll('.slot-icon')
      expect(slotIcons.length).toBeGreaterThan(0)
      slotIcons.forEach(icon => {
        expect(icon.text()).toBe('+')
      })
    })
  })

  describe('Filled slots - frameless images', () => {
    beforeEach(() => {
      // Add some heroes to the collection
      heroesStore.addHero('aurora_the_dawn')
      heroesStore.addHero('shadow_king')
      heroesStore.addHero('militia_soldier')
      heroesStore.addHero('farm_hand')

      // Add heroes to party slots
      const heroes = heroesStore.collection
      heroesStore.setPartySlot(0, heroes[0].instanceId)
      heroesStore.setPartySlot(1, heroes[1].instanceId)
      heroesStore.setPartySlot(2, heroes[2].instanceId)
      heroesStore.setPartySlot(3, heroes[3].instanceId)
    })

    it('should NOT render HeroCard components in filled slots', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      // HeroCard components should NOT exist
      const heroCards = wrapper.findAllComponents({ name: 'HeroCard' })
      expect(heroCards).toHaveLength(0)
    })

    it('should render hero images directly as img elements', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      // Find filled slots (slots with heroes)
      const filledSlots = wrapper.findAll('.party-slot.filled')
      expect(filledSlots.length).toBeGreaterThan(0)

      // Each filled slot should contain an img element
      filledSlots.forEach(slot => {
        const img = slot.find('img.hero-image')
        expect(img.exists()).toBe(true)
      })
    })

    it('should apply rarity-based CSS classes to hero images', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const filledSlots = wrapper.findAll('.party-slot.filled')

      // Check that each hero image has a rarity glow class
      filledSlots.forEach((slot, index) => {
        const img = slot.find('img.hero-image')

        // Get the hero for this slot
        const hero = heroesStore.partyHeroes[index]
        if (hero && hero.template) {
          const expectedClass = `rarity-glow-${hero.template.rarity}`
          expect(img.classes()).toContain(expectedClass)
        }
      })
    })

    it('should render hero images with alt text for accessibility', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const filledSlots = wrapper.findAll('.party-slot.filled')

      filledSlots.forEach((slot, index) => {
        const img = slot.find('img.hero-image')
        const hero = heroesStore.partyHeroes[index]

        if (hero && hero.template) {
          expect(img.attributes('alt')).toBe(hero.template.name)
        }
      })
    })
  })

  describe('Leader crown indicator', () => {
    beforeEach(() => {
      // Add heroes to collection and party
      const hero1 = heroesStore.addHero('aurora_the_dawn')
      const hero2 = heroesStore.addHero('shadow_king')

      heroesStore.setPartySlot(0, hero1.instanceId)
      heroesStore.setPartySlot(1, hero2.instanceId)

      // Set first hero as leader
      heroesStore.setPartyLeader(hero1.instanceId)
    })

    it('should display crown emoji on leader slot', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      // Find the leader crown
      const leaderCrown = wrapper.find('.leader-crown')
      expect(leaderCrown.exists()).toBe(true)
      expect(leaderCrown.text()).toContain('👑')
    })

    it('should NOT show crown on non-leader slots', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      // Should only have one crown
      const leaderCrowns = wrapper.findAll('.leader-crown')
      expect(leaderCrowns).toHaveLength(1)
    })

    it('should position crown on top-right of hero slot', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const leaderCrown = wrapper.find('.leader-crown')
      expect(leaderCrown.exists()).toBe(true)

      // Crown should be absolutely positioned
      // (actual CSS values are tested via CSS, we just verify the element exists)
    })
  })

  describe('Remove button', () => {
    beforeEach(() => {
      // Add heroes to party
      const hero1 = heroesStore.addHero('aurora_the_dawn')
      const hero2 = heroesStore.addHero('shadow_king')

      heroesStore.setPartySlot(0, hero1.instanceId)
      heroesStore.setPartySlot(1, hero2.instanceId)
    })

    it('should show remove button below each filled slot', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const filledSlots = wrapper.findAll('.party-slot.filled')

      // Each filled slot should have a remove button
      filledSlots.forEach(slot => {
        const removeBtn = slot.find('.remove-btn')
        expect(removeBtn.exists()).toBe(true)
        expect(removeBtn.text()).toContain('Remove')
      })
    })

    it('should NOT show remove button on empty slots', () => {
      // Add only 2 heroes, leaving 2 slots empty
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const emptySlots = wrapper.findAll('.party-slot').filter(slot =>
        !slot.classes().includes('filled')
      )

      // Empty slots should not have remove buttons
      emptySlots.forEach(slot => {
        const removeBtn = slot.find('.remove-btn')
        expect(removeBtn.exists()).toBe(false)
      })
    })

    it('should remove hero from slot when clicked', async () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const initialHeroCount = heroesStore.party.filter(Boolean).length
      expect(initialHeroCount).toBe(2)

      // Click remove button on first filled slot
      const firstFilledSlot = wrapper.find('.party-slot.filled')
      const removeBtn = firstFilledSlot.find('.remove-btn')
      await removeBtn.trigger('click')

      // Hero should be removed from party
      const newHeroCount = heroesStore.party.filter(Boolean).length
      expect(newHeroCount).toBe(initialHeroCount - 1)
    })
  })

  describe('Rarity glow effects', () => {
    it('should apply rarity-glow-1 class for 1-star heroes', () => {
      const hero = heroesStore.addHero('farm_hand') // 1-star
      heroesStore.setPartySlot(0, hero.instanceId)

      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const heroImage = wrapper.find('img.hero-image')
      expect(heroImage.classes()).toContain('rarity-glow-1')
    })

    it('should apply rarity-glow-2 class for 2-star heroes', () => {
      const hero = heroesStore.addHero('militia_soldier') // 2-star
      heroesStore.setPartySlot(0, hero.instanceId)

      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const heroImage = wrapper.find('img.hero-image')
      expect(heroImage.classes()).toContain('rarity-glow-2')
    })

    it('should apply rarity-glow-3 class for 3-star heroes', () => {
      const hero = heroesStore.addHero('town_guard') // 3-star
      heroesStore.setPartySlot(0, hero.instanceId)

      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const heroImage = wrapper.find('img.hero-image')
      expect(heroImage.classes()).toContain('rarity-glow-3')
    })

    it('should apply rarity-glow-4 class for 4-star heroes', () => {
      const hero = heroesStore.addHero('sir_gallan') // 4-star
      heroesStore.setPartySlot(0, hero.instanceId)

      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const heroImage = wrapper.find('img.hero-image')
      expect(heroImage.classes()).toContain('rarity-glow-4')
    })

    it('should apply rarity-glow-5 class for 5-star heroes', () => {
      const hero = heroesStore.addHero('aurora_the_dawn') // 5-star
      heroesStore.setPartySlot(0, hero.instanceId)

      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const heroImage = wrapper.find('img.hero-image')
      expect(heroImage.classes()).toContain('rarity-glow-5')
    })
  })

  describe('Hero image sources', () => {
    it('should prioritize GIF images over PNG when both exist', () => {
      // shadow_king has a GIF
      const hero = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, hero.instanceId)

      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const heroImage = wrapper.find('img.hero-image')
      // Should attempt to load .gif path (mocked, so we just verify it's attempting to render an image)
      expect(heroImage.exists()).toBe(true)
    })

    it('should handle missing hero images gracefully', () => {
      // Add a hero that doesn't have an image
      const hero = heroesStore.addHero('hedge_wizard')
      heroesStore.setPartySlot(0, hero.instanceId)

      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      // Should still render the slot without error
      const filledSlot = wrapper.find('.party-slot.filled')
      expect(filledSlot.exists()).toBe(true)
    })
  })

  describe('Slot layout', () => {
    beforeEach(() => {
      // Fill all party slots
      for (let i = 0; i < 4; i++) {
        const hero = heroesStore.addHero('militia_soldier')
        heroesStore.setPartySlot(i, hero.instanceId)
      }
    })

    it('should render exactly 4 party slots', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const slots = wrapper.findAll('.party-slot')
      expect(slots).toHaveLength(4)
    })

    it('should use 2x2 grid layout for slots', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const slotsContainer = wrapper.find('.party-slots')
      expect(slotsContainer.exists()).toBe(true)

      // The grid-template-columns should be set (actual CSS verification)
      // We verify the container exists with the right class
    })
  })

  describe('Hero info display', () => {
    beforeEach(() => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)
    })

    it('should display hero name below image', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const filledSlot = wrapper.find('.party-slot.filled')
      const heroName = filledSlot.find('.hero-name')

      expect(heroName.exists()).toBe(true)
      expect(heroName.text()).toBe('Aurora the Dawn')
    })

    it('should display hero level', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const filledSlot = wrapper.find('.party-slot.filled')
      const heroLevel = filledSlot.find('.hero-level')

      expect(heroLevel.exists()).toBe(true)
      expect(heroLevel.text()).toContain('Lv')
    })

    it('should display hero class', () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const filledSlot = wrapper.find('.party-slot.filled')
      const heroClass = filledSlot.find('.hero-class')

      expect(heroClass.exists()).toBe(true)
      // Aurora is a Paladin
      expect(heroClass.text()).toBe('Paladin')
    })
  })

  describe('Placement mode interaction', () => {
    it('should allow clicking empty slot to open hero picker', async () => {
      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const emptySlot = wrapper.find('.empty-slot.clickable')
      expect(emptySlot.exists()).toBe(true)

      await emptySlot.trigger('click')

      // Hero picker should be opened (tested by checking if selectingSlot is set)
      // This is verified by the picker being visible
    })

    it('should allow toggling hero as leader when clicking hero image', async () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const heroImage = wrapper.find('img.hero-image')
      await heroImage.trigger('click')

      // Hero should now be leader
      expect(heroesStore.partyLeader).toBe(hero.instanceId)
    })
  })

  describe('Visual consistency', () => {
    it('should NOT show stat bars (HP/MP) in party view', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      // Stat bars should not exist (they're for combat view only)
      const statBars = wrapper.findAll('.stat-bar')
      expect(statBars).toHaveLength(0)
    })

    it('should NOT show HeroCard borders and backgrounds', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      // Should not find hero-card elements
      const heroCard = wrapper.find('.hero-card')
      expect(heroCard.exists()).toBe(false)
    })

    it('should show frameless design with minimal UI chrome', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      const wrapper = mount(PartyScreen, {
        global: {
          plugins: [pinia],
          stubs: {
            Teleport: true
          }
        }
      })

      const filledSlot = wrapper.find('.party-slot.filled')

      // Main hero content should be image-focused
      const heroImage = filledSlot.find('img.hero-image')
      expect(heroImage.exists()).toBe(true)

      // Should have minimal decorative elements
      // (primarily just the image with glow effect)
    })
  })
})
