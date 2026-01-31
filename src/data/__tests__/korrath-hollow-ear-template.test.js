import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroes/index.js'
import { EffectType } from '../statusEffects.js'

describe('Korrath of the Hollow Ear hero template', () => {
  const korrath = heroTemplates.korrath_hollow_ear

  it('exists with correct identity', () => {
    expect(korrath).toBeDefined()
    expect(korrath.id).toBe('korrath_hollow_ear')
    expect(korrath.name).toBe('Korrath of the Hollow Ear')
    expect(korrath.rarity).toBe(5)
    expect(korrath.classId).toBe('ranger')
  })

  describe('base stats', () => {
    it('has HP 95', () => { expect(korrath.baseStats.hp).toBe(95) })
    it('has ATK 48', () => { expect(korrath.baseStats.atk).toBe(48) })
    it('has DEF 20', () => { expect(korrath.baseStats.def).toBe(20) })
    it('has SPD 22', () => { expect(korrath.baseStats.spd).toBe(22) })
    it('has combat stat total of 185', () => {
      const { hp, atk, def, spd } = korrath.baseStats
      expect(hp + atk + def + spd).toBe(185)
    })
  })

  it('has 5 skills', () => { expect(korrath.skills).toHaveLength(5) })

  describe('Leader Skill: Blood Remembers', () => {
    it('has leader skill defined', () => {
      expect(korrath.leaderSkill).toBeDefined()
      expect(korrath.leaderSkill.name).toBe('Blood Remembers')
    })
    it('triggers on round 2', () => {
      const effect = korrath.leaderSkill.effects[0]
      expect(effect.type).toBe('timed')
      expect(effect.triggerRound).toBe(2)
      expect(effect.target).toBe('all_allies')
    })
    it('grants ATK and SPD buff', () => {
      const effect = korrath.leaderSkill.effects[0]
      expect(effect.apply).toContainEqual({ effectType: 'atk_up', duration: 3, value: 20 })
      expect(effect.apply).toContainEqual({ effectType: 'spd_up', duration: 3, value: 15 })
    })
  })

  describe('Whisper Shot (Level 1)', () => {
    const skill = () => korrath.skills.find(s => s.name === 'Whisper Shot')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(1)
      expect(skill().targetType).toBe('enemy')
    })
    it('has execute bonus', () => {
      expect(skill().damagePercent).toBe(110)
      expect(skill().executeBonus).toBeDefined()
      expect(skill().executeBonus.threshold).toBe(30)
      expect(skill().executeBonus.damagePercent).toBe(150)
    })
  })

  describe('Spirit Mark (Level 1)', () => {
    const skill = () => korrath.skills.find(s => s.name === 'Spirit Mark')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(1)
      expect(skill().targetType).toBe('enemy')
      expect(skill().noDamage).toBe(true)
    })
    it('applies MARKED effect', () => {
      const marked = skill().effects.find(e => e.type === EffectType.MARKED)
      expect(marked).toBeDefined()
      expect(marked.duration).toBe(3)
      expect(marked.value).toBe(25)
    })
  })

  describe('Deathecho Volley (Level 3)', () => {
    const skill = () => korrath.skills.find(s => s.name === 'Deathecho Volley')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(3)
      expect(skill().targetType).toBe('all_enemies')
    })
    it('has death-scaling bonus damage', () => {
      expect(skill().damagePercent).toBe(60)
      expect(skill().bonusDamagePerDeath).toBeDefined()
      expect(skill().bonusDamagePerDeath.perDeath).toBe(15)
      expect(skill().bonusDamagePerDeath.maxBonus).toBe(60)
    })
  })

  describe('Spirit Volley (Level 6)', () => {
    const skill = () => korrath.skills.find(s => s.name === 'Spirit Volley')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(6)
      expect(skill().targetType).toBe('random_enemies')
    })
    it('has multi-hit with marked priority', () => {
      expect(skill().multiHit).toBe(5)
      expect(skill().damagePercent).toBe(50)
      expect(skill().prioritizeMarked).toBe(true)
    })
  })

  describe('The Last Drumbeat (Level 12)', () => {
    const skill = () => korrath.skills.find(s => s.name === 'The Last Drumbeat')
    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(12)
      expect(skill().targetType).toBe('enemy')
    })
    it('has high damage with DEF ignore', () => {
      expect(skill().damagePercent).toBe(200)
      expect(skill().ignoreDef).toBe(75)
    })
    it('resets turn order on kill', () => {
      expect(skill().onKill).toBeDefined()
      expect(skill().onKill.resetTurnOrder).toBe(true)
    })
  })
})
