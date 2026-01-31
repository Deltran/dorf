import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('Leader Skill HP Condition', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('checkLeaderCondition with hpBelow', () => {
    it('should return true when hero HP is below threshold', () => {
      const hero = { currentHp: 40, maxHp: 100 }
      const condition = { hpBelow: 50 }

      expect(battleStore.checkLeaderCondition(hero, condition)).toBe(true)
    })

    it('should return false when hero HP is at threshold', () => {
      const hero = { currentHp: 50, maxHp: 100 }
      const condition = { hpBelow: 50 }

      expect(battleStore.checkLeaderCondition(hero, condition)).toBe(false)
    })

    it('should return false when hero HP is above threshold', () => {
      const hero = { currentHp: 75, maxHp: 100 }
      const condition = { hpBelow: 50 }

      expect(battleStore.checkLeaderCondition(hero, condition)).toBe(false)
    })
  })

  describe('getLeaderBonusStat with HP condition', () => {
    it('should apply ATK bonus only to heroes below HP threshold', () => {
      const leaderSkill = {
        effects: [{
          type: 'passive',
          stat: 'atk',
          value: 20,
          condition: { hpBelow: 50 }
        }]
      }

      const heroLowHp = { currentHp: 30, maxHp: 100, atk: 50 }
      const heroHighHp = { currentHp: 80, maxHp: 100, atk: 50 }

      expect(battleStore.getLeaderBonusStat(heroLowHp, 'atk', leaderSkill)).toBe(10)
      expect(battleStore.getLeaderBonusStat(heroHighHp, 'atk', leaderSkill)).toBe(0)
    })
  })
})
