import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroes/index.js'
import { EffectType } from '../statusEffects.js'

describe('Vraxx the Thunderskin hero template', () => {
  const vraxx = heroTemplates.vraxx_thunderskin

  it('exists with correct identity', () => {
    expect(vraxx).toBeDefined()
    expect(vraxx.id).toBe('vraxx_thunderskin')
    expect(vraxx.name).toBe('Vraxx the Thunderskin')
    expect(vraxx.rarity).toBe(4)
    expect(vraxx.classId).toBe('bard')
  })

  describe('base stats', () => {
    it('has HP 85', () => { expect(vraxx.baseStats.hp).toBe(85) })
    it('has ATK 28', () => { expect(vraxx.baseStats.atk).toBe(28) })
    it('has DEF 24', () => { expect(vraxx.baseStats.def).toBe(24) })
    it('has SPD 18', () => { expect(vraxx.baseStats.spd).toBe(18) })
    it('has combat stat total of 155', () => {
      const { hp, atk, def, spd } = vraxx.baseStats
      expect(hp + atk + def + spd).toBe(155)
    })
  })

  it('has 5 skills', () => { expect(vraxx.skills).toHaveLength(5) })

  describe('Finale: Thunderclap Crescendo', () => {
    it('has finale defined', () => {
      expect(vraxx.finale).toBeDefined()
      expect(vraxx.finale.name).toBe('Thunderclap Crescendo')
    })
    it('has consume excess rage mechanic', () => {
      const effect = vraxx.finale.effects.find(e => e.type === 'consume_excess_rage')
      expect(effect).toBeDefined()
      expect(effect.rageThreshold).toBe(50)
      expect(effect.damagePerRagePercent).toBe(3)
    })
    it('has fallback buff when no rage consumed', () => {
      const effect = vraxx.finale.effects.find(e => e.type === 'consume_excess_rage')
      expect(effect.fallbackBuff).toBeDefined()
      expect(effect.fallbackBuff.type).toBe('atk_up')
      expect(effect.fallbackBuff.value).toBe(25)
      expect(effect.fallbackBuff.duration).toBe(2)
    })
  })

  describe('Battle Cadence (Level 1)', () => {
    const skill = () => vraxx.skills.find(s => s.name === 'Battle Cadence')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(1)
      expect(skill().targetType).toBe('all_allies')
      expect(skill().noDamage).toBe(true)
    })
    it('grants ATK buff to all allies', () => {
      const atkUp = skill().effects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.value).toBe(15)
      expect(atkUp.duration).toBe(2)
    })
  })

  describe('Fury Beat (Level 1)', () => {
    const skill = () => vraxx.skills.find(s => s.name === 'Fury Beat')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(1)
      expect(skill().targetType).toBe('all_allies')
      expect(skill().noDamage).toBe(true)
    })
    it('has conditional rage grant or buff', () => {
      const effect = skill().effects.find(e => e.type === 'conditional_resource_or_buff')
      expect(effect).toBeDefined()
      expect(effect.rageGrant.classCondition).toBe('berserker')
      expect(effect.rageGrant.amount).toBe(15)
      expect(effect.fallbackBuff.type).toBe(EffectType.ATK_UP)
      expect(effect.fallbackBuff.value).toBe(15)
    })
  })

  describe('Warsong Strike (Level 3)', () => {
    const skill = () => vraxx.skills.find(s => s.name === 'Warsong Strike')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(3)
      expect(skill().targetType).toBe('enemy')
      expect(skill().damagePercent).toBe(80)
    })
  })

  describe('Unbreaking Tempo (Level 6)', () => {
    const skill = () => vraxx.skills.find(s => s.name === 'Unbreaking Tempo')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(6)
      expect(skill().targetType).toBe('all_allies')
      expect(skill().noDamage).toBe(true)
    })
    it('grants DEF buff', () => {
      const defUp = skill().effects.find(e => e.type === EffectType.DEF_UP)
      expect(defUp).toBeDefined()
      expect(defUp.value).toBe(20)
      expect(defUp.duration).toBe(2)
    })
    it('grants conditional regen to wounded allies', () => {
      const regen = skill().effects.find(e => e.type === EffectType.REGEN)
      expect(regen).toBeDefined()
      expect(regen.atkPercent).toBe(15)
      expect(regen.condition).toBeDefined()
      expect(regen.condition.hpBelow).toBe(50)
    })
  })

  describe('Drums of the Old Blood (Level 12)', () => {
    const skill = () => vraxx.skills.find(s => s.name === 'Drums of the Old Blood')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(12)
      expect(skill().targetType).toBe('all_allies')
      expect(skill().noDamage).toBe(true)
    })
    it('has exactly 2 effects', () => {
      expect(skill().effects).toHaveLength(2)
    })
    it('grants ATK buff', () => {
      const atkUp = skill().effects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.value).toBe(25)
      expect(atkUp.duration).toBe(3)
    })
    it('does NOT grant DEF buff', () => {
      const defUp = skill().effects.find(e => e.type === EffectType.DEF_UP)
      expect(defUp).toBeUndefined()
    })
    it('does NOT grant debuff immunity', () => {
      const immune = skill().effects.find(e => e.type === EffectType.DEBUFF_IMMUNE)
      expect(immune).toBeUndefined()
    })
    it('grants rage to berserkers', () => {
      const rageGrant = skill().effects.find(e => e.type === 'rage_grant')
      expect(rageGrant).toBeDefined()
      expect(rageGrant.classCondition).toBe('berserker')
      expect(rageGrant.amount).toBe(25)
    })
  })
})
