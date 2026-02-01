// src/data/__tests__/torga-bloodbeat-template.test.js
import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroes/index.js'
import { EffectType } from '../statusEffects.js'

describe('Torga Bloodbeat hero template', () => {
  const torga = heroTemplates.torga_bloodbeat

  it('exists with correct identity', () => {
    expect(torga).toBeDefined()
    expect(torga.id).toBe('torga_bloodbeat')
    expect(torga.name).toBe('Torga Bloodbeat')
    expect(torga.rarity).toBe(3)
    expect(torga.classId).toBe('berserker')
  })

  describe('base stats', () => {
    it('has HP 85', () => { expect(torga.baseStats.hp).toBe(85) })
    it('has ATK 35', () => { expect(torga.baseStats.atk).toBe(35) })
    it('has DEF 15', () => { expect(torga.baseStats.def).toBe(15) })
    it('has SPD 12', () => { expect(torga.baseStats.spd).toBe(12) })
    it('has combat stat total of 147', () => {
      const { hp, atk, def, spd } = torga.baseStats
      expect(hp + atk + def + spd).toBe(147)
    })
  })

  it('has 5 skills', () => { expect(torga.skills).toHaveLength(5) })

  describe('Rhythm Strike (Level 1)', () => {
    const skill = () => torga.skills.find(s => s.name === 'Rhythm Strike')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(1)
      expect(skill().targetType).toBe('enemy')
    })
    it('has zero rage cost and grants rage', () => {
      expect(skill().rageCost).toBe(0)
      expect(skill().rageGain).toBe(10)
    })
    it('deals 100% ATK damage', () => { expect(skill().damagePercent).toBe(100) })
  })

  describe('Blood Tempo (Level 1)', () => {
    const skill = () => torga.skills.find(s => s.name === 'Blood Tempo')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(1)
      expect(skill().targetType).toBe('self')
      expect(skill().noDamage).toBe(true)
    })
    it('costs HP for rage', () => {
      expect(skill().rageCost).toBe(0)
      expect(skill().selfDamagePercentMaxHp).toBe(15)
      expect(skill().rageGain).toBe(30)
    })
    it('grants ATK buff', () => {
      const atkUp = skill().effects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.value).toBe(20)
      expect(atkUp.duration).toBe(2)
    })
  })

  describe('Blood Echo (Level 3)', () => {
    const skill = () => torga.skills.find(s => s.name === 'Blood Echo')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(3)
      expect(skill().rageCost).toBe(20)
      expect(skill().targetType).toBe('enemy')
    })
    it('has Blood Tempo-scaling damage', () => {
      expect(skill().damagePercent).toBe(90)
      expect(skill().bonusDamagePerBloodTempo).toBe(30)
      expect(skill().maxBloodTempoBonus).toBe(90)
    })
  })

  describe('Death Knell (Level 6)', () => {
    const skill = () => torga.skills.find(s => s.name === 'Death Knell')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(6)
      expect(skill().rageCost).toBe(40)
      expect(skill().targetType).toBe('enemy')
    })
    it('has execute bonus with healing', () => {
      expect(skill().damagePercent).toBe(150)
      expect(skill().executeBonus).toBeDefined()
      expect(skill().executeBonus.threshold).toBe(30)
      expect(skill().executeBonus.damagePercent).toBe(250)
      expect(skill().executeBonus.healSelfPercent).toBe(20)
    })
  })

  describe('Finale of Fury (Level 12)', () => {
    const skill = () => torga.skills.find(s => s.name === 'Finale of Fury')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(12)
      expect(skill().targetType).toBe('enemy')
    })
    it('consumes all rage', () => { expect(skill().rageCost).toBe('all') })
    it('has rage-scaling damage', () => {
      expect(skill().baseDamagePercent).toBe(50)
      expect(skill().damagePerRage).toBe(2)
    })
    it('grants rage on kill', () => {
      expect(skill().onKill).toBeDefined()
      expect(skill().onKill.rageGain).toBe(50)
    })
  })
})
