import { describe, it, expect } from 'vitest'
import { parseLogStats } from '../logStats.js'

const party = [
  { name: 'Aurora the Dawn', rarity: 5, isLeader: true },
  { name: 'Town Guard', rarity: 3, isLeader: false },
  { name: 'Village Healer', rarity: 3, isLeader: false }
]

function entries(...messages) {
  return messages.map(m => ({ message: m }))
}

describe('parseLogStats', () => {
  describe('edge cases', () => {
    it('returns empty array for null/empty inputs', () => {
      expect(parseLogStats(null, null)).toEqual([])
      expect(parseLogStats([], [])).toEqual([])
      expect(parseLogStats([], party)).toEqual([])
      expect(parseLogStats(entries('hello'), [])).toEqual([])
    })

    it('returns empty array when no stats are detected', () => {
      const result = parseLogStats(entries('Battle start! Round 1'), party)
      expect(result).toEqual([])
    })
  })

  describe('damage tracking', () => {
    it('tracks basic attack damage', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin Scout for 36 damage!'
      ), party)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Aurora the Dawn')
      expect(result[0].damageDealt).toBe(36)
    })

    it('tracks skill damage', () => {
      const result = parseLogStats(entries(
        "Town Guard's turn",
        'Town Guard uses Shield Bash on Goblin Scout for 50 damage!'
      ), party)
      expect(result[0].damageDealt).toBe(50)
    })

    it('tracks AoE total damage', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn deals 120 total damage'
      ), party)
      expect(result[0].damageDealt).toBe(120)
    })

    it('tracks burn detonation damage', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn detonates 3 burns for 200 total damage!'
      ), party)
      expect(result[0].damageDealt).toBe(200)
    })

    it('tracks true damage', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn deals 75 true damage'
      ), party)
      expect(result[0].damageDealt).toBe(75)
    })

    it('tracks shadow damage', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn deals 60 shadow damage'
      ), party)
      expect(result[0].damageDealt).toBe(60)
    })

    it('tracks damage store release', () => {
      const result = parseLogStats(entries(
        "Town Guard's turn",
        'Town Guard releases 300 stored damage'
      ), party)
      expect(result[0].damageDealt).toBe(300)
    })

    it('tracks riposte damage', () => {
      const result = parseLogStats(entries(
        "Town Guard's turn",
        'Town Guard ripostes Goblin Scout for 45 damage!'
      ), party)
      expect(result[0].damageDealt).toBe(45)
    })

    it('tracks chain lightning to last hero actor', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin Scout for 30 damage!',
        'Lightning chains to Goblin Archer for 25 damage!'
      ), party)
      expect(result[0].damageDealt).toBe(55) // 30 + 25
    })

    it('tracks splash damage to last hero actor', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin Scout for 30 damage!',
        'Attack splashes to Goblin Archer for 15 damage!'
      ), party)
      expect(result[0].damageDealt).toBe(45) // 30 + 15
    })

    it('tracks echoing damage to last hero actor', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin Scout for 30 damage!',
        'Echoing damage strikes 3 enemies for 20 each!'
      ), party)
      expect(result[0].damageDealt).toBe(90) // 30 + 3*20
    })

    it('accumulates damage across multiple rounds', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin Scout for 36 damage!',
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin Scout for 36 damage!'
      ), party)
      expect(result[0].damageDealt).toBe(72)
    })

    it('does not attribute enemy damage to heroes', () => {
      const result = parseLogStats(entries(
        "Goblin Scout's turn",
        'Goblin Scout attacks Aurora the Dawn for 12 damage!'
      ), party)
      // No hero damage detected
      expect(result).toEqual([])
    })

    it('tracks reflect damage as hero damage', () => {
      const result = parseLogStats(entries(
        "Town Guard's turn",
        'Town Guard reflects 25 damage back to Goblin Scout!'
      ), party)
      expect(result[0].name).toBe('Town Guard')
      expect(result[0].damageDealt).toBe(25)
    })

    it('tracks retaliation damage attributed to last hero actor', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin Scout for 30 damage!',
        'Goblin Scout takes 15 retaliation damage!'
      ), party)
      expect(result[0].damageDealt).toBe(45) // 30 + 15
    })

    it('tracks thorns damage attributed to last hero actor', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin Scout for 30 damage!',
        'Goblin Scout takes 10 thorns damage!'
      ), party)
      expect(result[0].damageDealt).toBe(40) // 30 + 10
    })
  })

  describe('healing tracking', () => {
    it('tracks self-healing', () => {
      const result = parseLogStats(entries(
        "Village Healer's turn",
        'Village Healer heals for 50'
      ), party)
      expect(result[0].name).toBe('Village Healer')
      expect(result[0].healingDone).toBe(50)
    })

    it('tracks lifesteal healing', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin for 100 damage!',
        'Aurora the Dawn heals 30 HP from lifesteal!'
      ), party)
      expect(result[0].healingDone).toBe(30)
    })

    it('tracks ally healing attributed to last hero actor', () => {
      const result = parseLogStats(entries(
        "Village Healer's turn",
        'Village Healer uses Healing Light on Town Guard for 0 damage!',
        'Town Guard is healed for 80'
      ), party)
      expect(result[0].name).toBe('Village Healer')
      expect(result[0].healingDone).toBe(80)
    })

    it('excludes Well Fed passive healing', () => {
      const result = parseLogStats(entries(
        "Village Healer's turn",
        'Town Guard is healed for 40 (Well Fed)'
      ), party)
      expect(result).toEqual([])
    })

    it('tracks HP regeneration', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn regenerates 30 HP!'
      ), party)
      expect(result[0].name).toBe('Aurora the Dawn')
      expect(result[0].healingDone).toBe(30)
    })

    it('tracks HP regeneration from equipment', () => {
      const result = parseLogStats(entries(
        "Town Guard's turn",
        'Town Guard regenerates 20 HP from equipment!'
      ), party)
      expect(result[0].healingDone).toBe(20)
    })

    it('tracks Divine Sacrifice self-healing', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Divine Sacrifice heals Aurora the Dawn for 45!'
      ), party)
      expect(result[0].name).toBe('Aurora the Dawn')
      expect(result[0].healingDone).toBe(45)
    })

    it('tracks on-kill healing', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin for 100 damage!',
        'Aurora the Dawn heals for 25 from the kill!'
      ), party)
      expect(result[0].healingDone).toBe(25)
    })

    it('tracks targeted heal skill', () => {
      const result = parseLogStats(entries(
        "Village Healer's turn",
        'Village Healer uses Healing Light on Town Guard, healing for 60 HP!'
      ), party)
      expect(result[0].name).toBe('Village Healer')
      expect(result[0].healingDone).toBe(60)
    })

    it('tracks riposte lifesteal healing', () => {
      const result = parseLogStats(entries(
        "Town Guard's turn",
        'Town Guard heals for 15 from riposte lifesteal!'
      ), party)
      expect(result[0].healingDone).toBe(15)
    })

    it('tracks environment healing attributed to hero', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn heals 20 HP from the environment!'
      ), party)
      expect(result[0].healingDone).toBe(20)
    })
  })

  describe('kill tracking', () => {
    it('attributes kills to last hero actor', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin Scout for 100 damage!',
        'Goblin Scout defeated!'
      ), party)
      expect(result[0].kills).toBe(1)
    })

    it('tracks executions', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin Scout for 100 damage!',
        'Goblin Scout executed!'
      ), party)
      expect(result[0].kills).toBe(1)
    })

    it('does not count hero deaths as kills', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin Scout for 100 damage!',
        'Aurora the Dawn defeated!'
      ), party)
      // Aurora falling is a death, not a kill
      const aurora = result.find(s => s.name === 'Aurora the Dawn')
      expect(aurora?.kills || 0).toBe(0)
    })
  })

  describe('death tracking', () => {
    it('tracks hero deaths', () => {
      const result = parseLogStats(entries(
        'Town Guard has fallen!'
      ), party)
      expect(result[0].name).toBe('Town Guard')
      expect(result[0].deaths).toBe(1)
    })
  })

  describe('damage intercepted tracking', () => {
    it('tracks killing blow interception', () => {
      const result = parseLogStats(entries(
        'Town Guard intercepts the killing blow on Village Healer, taking 80 damage!'
      ), party)
      expect(result[0].name).toBe('Town Guard')
      expect(result[0].damageIntercepted).toBe(80)
    })

    it('tracks Divine Sacrifice interception', () => {
      const result = parseLogStats(entries(
        'Aurora the Dawn intercepts 60 damage meant for Town Guard'
      ), party)
      expect(result[0].damageIntercepted).toBe(60)
    })

    it('tracks Guardian Link absorption', () => {
      const result = parseLogStats(entries(
        'Town Guard absorbs 40 damage for Village Healer'
      ), party)
      expect(result[0].damageIntercepted).toBe(40)
    })

    it('tracks guard redirect', () => {
      const result = parseLogStats(entries(
        'Town Guard takes 55 damage protecting Village Healer'
      ), party)
      expect(result[0].damageIntercepted).toBe(55)
    })

    it('tracks damage sharing', () => {
      const result = parseLogStats(entries(
        'Town Guard shares 30 damage for Village Healer'
      ), party)
      expect(result[0].damageIntercepted).toBe(30)
    })
  })

  describe('result shape and sorting', () => {
    it('includes rarity and isLeader from party data', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin for 50 damage!'
      ), party)
      expect(result[0].rarity).toBe(5)
      expect(result[0].isLeader).toBe(true)
    })

    it('sorts by damage dealt descending', () => {
      const result = parseLogStats(entries(
        "Town Guard's turn",
        'Town Guard attacks Goblin for 100 damage!',
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin for 50 damage!'
      ), party)
      expect(result[0].name).toBe('Town Guard')
      expect(result[1].name).toBe('Aurora the Dawn')
    })

    it('filters out heroes with no stats', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin for 50 damage!'
      ), party)
      // Only Aurora should appear, not Town Guard or Village Healer
      expect(result).toHaveLength(1)
    })
  })

  describe('actor tracking across turns', () => {
    it('switches actor on turn change', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin for 30 damage!',
        'Goblin defeated!',
        "Town Guard's turn",
        'Town Guard attacks Orc for 20 damage!',
        'Orc defeated!'
      ), party)
      const aurora = result.find(s => s.name === 'Aurora the Dawn')
      const guard = result.find(s => s.name === 'Town Guard')
      expect(aurora.kills).toBe(1)
      expect(guard.kills).toBe(1)
    })

    it('clears hero actor on enemy turn', () => {
      const result = parseLogStats(entries(
        "Aurora the Dawn's turn",
        'Aurora the Dawn attacks Goblin for 30 damage!',
        "Goblin Scout's turn",
        'Goblin Scout attacks Town Guard for 10 damage!',
        'Something defeated!'
      ), party)
      // Kill should NOT be attributed to Aurora since it was enemy turn
      const aurora = result.find(s => s.name === 'Aurora the Dawn')
      expect(aurora.kills).toBe(0)
    })
  })
})
