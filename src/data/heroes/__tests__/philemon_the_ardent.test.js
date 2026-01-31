import { describe, it, expect } from 'vitest'
import { philemon_the_ardent } from '../4star/philemon_the_ardent'
import { EffectType } from '../../statusEffects'

describe('Philemon the Ardent hero template', () => {
  it('exists with correct identity', () => {
    expect(philemon_the_ardent).toBeDefined()
    expect(philemon_the_ardent.id).toBe('philemon_the_ardent')
    expect(philemon_the_ardent.name).toBe('Philemon the Ardent')
    expect(philemon_the_ardent.rarity).toBe(4)
    expect(philemon_the_ardent.classId).toBe('knight')
  })

  it('has correct base stats for tank/support hybrid', () => {
    expect(philemon_the_ardent.baseStats).toEqual({
      hp: 120,
      atk: 32,
      def: 38,
      spd: 12,
      mp: 100
    })
  })

  it('has 5 skills', () => {
    expect(philemon_the_ardent.skills).toHaveLength(5)
  })

  it('does NOT have a leader skill (4-star)', () => {
    expect(philemon_the_ardent.leaderSkill).toBeUndefined()
  })
})
