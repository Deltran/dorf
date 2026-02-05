import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHeroesStore } from '../heroes.js'

describe('heroes store - multiple parties', () => {
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    heroesStore = useHeroesStore()
  })

  describe('party structure', () => {
    it('has 3 parties with default names', () => {
      expect(heroesStore.parties).toHaveLength(3)
      expect(heroesStore.parties[0].name).toBe('Party 1')
      expect(heroesStore.parties[1].name).toBe('Party 2')
      expect(heroesStore.parties[2].name).toBe('Party 3')
    })

    it('each party has unique id', () => {
      const ids = heroesStore.parties.map(p => p.id)
      expect(new Set(ids).size).toBe(3)
    })

    it('each party has 4 slots initialized to null', () => {
      heroesStore.parties.forEach(party => {
        expect(party.slots).toHaveLength(4)
        expect(party.slots).toEqual([null, null, null, null])
      })
    })

    it('each party has a leader initialized to null', () => {
      heroesStore.parties.forEach(party => {
        expect(party.leader).toBeNull()
      })
    })
  })

  describe('active party', () => {
    it('starts with party 1 active', () => {
      expect(heroesStore.activePartyId).toBe(1)
    })

    it('activeParty returns the first party initially', () => {
      expect(heroesStore.activeParty.id).toBe(1)
      expect(heroesStore.activeParty.name).toBe('Party 1')
    })

    it('setActiveParty switches to a different party', () => {
      heroesStore.setActiveParty(2)
      expect(heroesStore.activePartyId).toBe(2)
      expect(heroesStore.activeParty.name).toBe('Party 2')
    })

    it('setActiveParty with invalid id does nothing', () => {
      heroesStore.setActiveParty(99)
      expect(heroesStore.activePartyId).toBe(1)
    })
  })

  describe('backward compatibility - party alias', () => {
    it('party returns active party slots', () => {
      expect(heroesStore.party).toEqual([null, null, null, null])
    })

    it('party reflects changes to active party slots', () => {
      const hero = heroesStore.addHero('militia_soldier')
      heroesStore.setPartySlot(0, hero.instanceId)
      expect(heroesStore.party[0]).toBe(hero.instanceId)
    })

    it('party changes when active party changes', () => {
      const hero1 = heroesStore.addHero('militia_soldier')
      const hero2 = heroesStore.addHero('apprentice_mage')

      // Add hero1 to party 1
      heroesStore.setPartySlot(0, hero1.instanceId)
      expect(heroesStore.party[0]).toBe(hero1.instanceId)

      // Switch to party 2, add hero2
      heroesStore.setActiveParty(2)
      heroesStore.setPartySlot(0, hero2.instanceId)
      expect(heroesStore.party[0]).toBe(hero2.instanceId)

      // Switch back to party 1, should see hero1 again
      heroesStore.setActiveParty(1)
      expect(heroesStore.party[0]).toBe(hero1.instanceId)
    })
  })

  describe('backward compatibility - partyLeader alias', () => {
    it('partyLeader returns active party leader', () => {
      expect(heroesStore.partyLeader).toBeNull()
    })

    it('partyLeader reflects changes to active party leader', () => {
      const hero = heroesStore.addHero('militia_soldier')
      heroesStore.setPartySlot(0, hero.instanceId)
      heroesStore.setPartyLeader(hero.instanceId)
      expect(heroesStore.partyLeader).toBe(hero.instanceId)
    })

    it('partyLeader changes when active party changes', () => {
      const hero1 = heroesStore.addHero('militia_soldier')
      const hero2 = heroesStore.addHero('apprentice_mage')

      // Set up party 1 with hero1 as leader
      heroesStore.setPartySlot(0, hero1.instanceId)
      heroesStore.setPartyLeader(hero1.instanceId)

      // Set up party 2 with hero2 as leader
      heroesStore.setActiveParty(2)
      heroesStore.setPartySlot(0, hero2.instanceId)
      heroesStore.setPartyLeader(hero2.instanceId)
      expect(heroesStore.partyLeader).toBe(hero2.instanceId)

      // Switch back to party 1
      heroesStore.setActiveParty(1)
      expect(heroesStore.partyLeader).toBe(hero1.instanceId)
    })
  })

  describe('party operations affect active party only', () => {
    it('setPartySlot affects active party', () => {
      const hero = heroesStore.addHero('militia_soldier')
      heroesStore.setPartySlot(0, hero.instanceId)

      expect(heroesStore.parties[0].slots[0]).toBe(hero.instanceId)
      expect(heroesStore.parties[1].slots[0]).toBeNull()
      expect(heroesStore.parties[2].slots[0]).toBeNull()
    })

    it('clearPartySlot affects active party', () => {
      const hero = heroesStore.addHero('militia_soldier')
      heroesStore.setPartySlot(0, hero.instanceId)
      heroesStore.clearPartySlot(0)

      expect(heroesStore.parties[0].slots[0]).toBeNull()
    })

    it('setPartyLeader affects active party', () => {
      const hero = heroesStore.addHero('militia_soldier')
      heroesStore.setPartySlot(0, hero.instanceId)
      heroesStore.setPartyLeader(hero.instanceId)

      expect(heroesStore.parties[0].leader).toBe(hero.instanceId)
      expect(heroesStore.parties[1].leader).toBeNull()
    })

    it('autoFillParty affects active party', () => {
      heroesStore.addHero('militia_soldier')
      heroesStore.addHero('apprentice_mage')
      heroesStore.autoFillParty()

      // Active party should have heroes
      expect(heroesStore.parties[0].slots.filter(Boolean).length).toBeGreaterThan(0)
      // Other parties should be empty
      expect(heroesStore.parties[1].slots.filter(Boolean).length).toBe(0)
    })
  })

  describe('renameParty', () => {
    it('renames a party by id', () => {
      heroesStore.renameParty(1, 'Boss Team')
      expect(heroesStore.parties[0].name).toBe('Boss Team')
    })

    it('renames party 2', () => {
      heroesStore.renameParty(2, 'PvP Squad')
      expect(heroesStore.parties[1].name).toBe('PvP Squad')
    })

    it('does nothing for invalid id', () => {
      heroesStore.renameParty(99, 'Invalid')
      // All parties keep original names
      expect(heroesStore.parties[0].name).toBe('Party 1')
      expect(heroesStore.parties[1].name).toBe('Party 2')
      expect(heroesStore.parties[2].name).toBe('Party 3')
    })
  })

  describe('switching parties shows different heroes', () => {
    it('each party maintains its own hero lineup', () => {
      const hero1 = heroesStore.addHero('militia_soldier')
      const hero2 = heroesStore.addHero('apprentice_mage')
      const hero3 = heroesStore.addHero('herb_gatherer')

      // Party 1: hero1
      heroesStore.setPartySlot(0, hero1.instanceId)

      // Party 2: hero2
      heroesStore.setActiveParty(2)
      heroesStore.setPartySlot(0, hero2.instanceId)

      // Party 3: hero3
      heroesStore.setActiveParty(3)
      heroesStore.setPartySlot(0, hero3.instanceId)

      // Verify each party has correct hero
      heroesStore.setActiveParty(1)
      expect(heroesStore.party[0]).toBe(hero1.instanceId)

      heroesStore.setActiveParty(2)
      expect(heroesStore.party[0]).toBe(hero2.instanceId)

      heroesStore.setActiveParty(3)
      expect(heroesStore.party[0]).toBe(hero3.instanceId)
    })
  })

  describe('removeHero clears from ALL parties', () => {
    it('removes hero from all parties when deleted', () => {
      const hero = heroesStore.addHero('militia_soldier')

      // Add hero to all 3 parties
      heroesStore.setPartySlot(0, hero.instanceId)
      heroesStore.setActiveParty(2)
      heroesStore.setPartySlot(0, hero.instanceId)
      heroesStore.setActiveParty(3)
      heroesStore.setPartySlot(0, hero.instanceId)

      // Remove the hero
      heroesStore.removeHero(hero.instanceId)

      // Verify all parties no longer have the hero
      expect(heroesStore.parties[0].slots[0]).toBeNull()
      expect(heroesStore.parties[1].slots[0]).toBeNull()
      expect(heroesStore.parties[2].slots[0]).toBeNull()
    })

    it('clears leader in all parties when hero removed', () => {
      const hero = heroesStore.addHero('militia_soldier')

      // Set hero as leader in party 1 and 2
      heroesStore.setPartySlot(0, hero.instanceId)
      heroesStore.setPartyLeader(hero.instanceId)

      heroesStore.setActiveParty(2)
      heroesStore.setPartySlot(0, hero.instanceId)
      heroesStore.setPartyLeader(hero.instanceId)

      // Remove hero
      heroesStore.removeHero(hero.instanceId)

      // Verify leader is cleared in all parties
      expect(heroesStore.parties[0].leader).toBeNull()
      expect(heroesStore.parties[1].leader).toBeNull()
    })
  })

  describe('partyHeroes computed', () => {
    it('returns heroes from active party', () => {
      const hero = heroesStore.addHero('militia_soldier')
      heroesStore.setPartySlot(0, hero.instanceId)

      expect(heroesStore.partyHeroes[0].instanceId).toBe(hero.instanceId)
      expect(heroesStore.partyHeroes[1]).toBeNull()
    })

    it('changes when switching parties', () => {
      const hero1 = heroesStore.addHero('militia_soldier')
      const hero2 = heroesStore.addHero('apprentice_mage')

      heroesStore.setPartySlot(0, hero1.instanceId)
      heroesStore.setActiveParty(2)
      heroesStore.setPartySlot(0, hero2.instanceId)

      expect(heroesStore.partyHeroes[0].instanceId).toBe(hero2.instanceId)

      heroesStore.setActiveParty(1)
      expect(heroesStore.partyHeroes[0].instanceId).toBe(hero1.instanceId)
    })
  })

  describe('availableForParty computed', () => {
    it('excludes heroes in active party only', () => {
      const hero1 = heroesStore.addHero('militia_soldier')
      const hero2 = heroesStore.addHero('apprentice_mage')

      // Put hero1 in party 1
      heroesStore.setPartySlot(0, hero1.instanceId)

      // hero1 should not be available for party 1
      expect(heroesStore.availableForParty.some(h => h.instanceId === hero1.instanceId)).toBe(false)
      expect(heroesStore.availableForParty.some(h => h.instanceId === hero2.instanceId)).toBe(true)

      // Switch to party 2 - hero1 should now be available (it's in party 1, not party 2)
      heroesStore.setActiveParty(2)
      expect(heroesStore.availableForParty.some(h => h.instanceId === hero1.instanceId)).toBe(true)
    })
  })

  describe('leaderHero computed', () => {
    it('returns leader from active party', () => {
      const hero = heroesStore.addHero('militia_soldier')
      heroesStore.setPartySlot(0, hero.instanceId)
      heroesStore.setPartyLeader(hero.instanceId)

      expect(heroesStore.leaderHero.instanceId).toBe(hero.instanceId)
    })

    it('changes when switching parties', () => {
      const hero1 = heroesStore.addHero('militia_soldier')
      const hero2 = heroesStore.addHero('apprentice_mage')

      heroesStore.setPartySlot(0, hero1.instanceId)
      heroesStore.setPartyLeader(hero1.instanceId)

      heroesStore.setActiveParty(2)
      heroesStore.setPartySlot(0, hero2.instanceId)
      heroesStore.setPartyLeader(hero2.instanceId)

      expect(heroesStore.leaderHero.instanceId).toBe(hero2.instanceId)

      heroesStore.setActiveParty(1)
      expect(heroesStore.leaderHero.instanceId).toBe(hero1.instanceId)
    })
  })
})
