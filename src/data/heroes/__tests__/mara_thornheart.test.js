import { describe, it, expect } from 'vitest'
import { mara_thornheart } from '../5star/mara_thornheart'
import { EffectType } from '../../statusEffects'

describe('Mara Thornheart', () => {
  it('should have correct id and name', () => {
    expect(mara_thornheart.id).toBe('mara_thornheart')
    expect(mara_thornheart.name).toBe('Mara Thornheart')
  })

  it('should be a 5-star berserker', () => {
    expect(mara_thornheart.rarity).toBe(5)
    expect(mara_thornheart.classId).toBe('berserker')
  })

  it('should have correct base stats', () => {
    expect(mara_thornheart.baseStats).toEqual({
      hp: 105,
      atk: 52,
      def: 28,
      spd: 20
    })
  })

  it('should have 5 skills', () => {
    expect(mara_thornheart.skills).toHaveLength(5)
  })

  describe('heartbreakPassive', () => {
    it('should have correct stack configuration', () => {
      expect(mara_thornheart.heartbreakPassive.maxStacks).toBe(5)
      expect(mara_thornheart.heartbreakPassive.atkPerStack).toBe(4)
      expect(mara_thornheart.heartbreakPassive.lifestealPerStack).toBe(3)
    })

    it('should have correct trigger conditions', () => {
      const triggers = mara_thornheart.heartbreakPassive.triggers
      expect(triggers.allyBelowHalfHp).toBe(true)
      expect(triggers.allyDeath).toBe(true)
      expect(triggers.heavyDamagePercent).toBe(15)
    })
  })

  describe('skills', () => {
    it('should have Thorn Lash with Heartbreak lifesteal at level 1', () => {
      const thornLash = mara_thornheart.skills.find(s => s.name === 'Thorn Lash')
      expect(thornLash).toBeDefined()
      expect(thornLash.skillUnlockLevel).toBe(1)
      expect(thornLash.damagePercent).toBe(110)
      expect(thornLash.rageGain).toBe(10)
      expect(thornLash.usesHeartbreakLifesteal).toBe(true)
      expect(thornLash.targetType).toBe('enemy')
    })

    it('should have Bitter Embrace with Bleeding at level 1', () => {
      const bitterEmbrace = mara_thornheart.skills.find(s => s.name === 'Bitter Embrace')
      expect(bitterEmbrace).toBeDefined()
      expect(bitterEmbrace.skillUnlockLevel).toBe(1)
      expect(bitterEmbrace.targetType).toBe('enemy')
      expect(bitterEmbrace.damagePercent).toBe(150)
      expect(bitterEmbrace.rageCost).toBe(25)
      expect(bitterEmbrace.effects).toContainEqual(
        expect.objectContaining({
          type: EffectType.POISON,
          duration: 3,
          atkPercent: 8,
          displayName: 'Bleeding'
        })
      )
      expect(bitterEmbrace.conditionalEffects).toBeDefined()
      expect(bitterEmbrace.conditionalEffects.heartbreakThreshold).toBe(3)
      expect(bitterEmbrace.conditionalEffects.effects).toContainEqual(
        expect.objectContaining({
          type: EffectType.ATK_DOWN,
          duration: 2,
          value: 15,
          displayName: 'Weakened'
        })
      )
    })

    it('should have Scorned with Reflect at level 3', () => {
      const scorned = mara_thornheart.skills.find(s => s.name === 'Scorned')
      expect(scorned).toBeDefined()
      expect(scorned.skillUnlockLevel).toBe(3)
      expect(scorned.targetType).toBe('self')
      expect(scorned.noDamage).toBe(true)
      expect(scorned.rageCost).toBe(40)
      expect(scorned.cooldown).toBe(4)
      expect(scorned.grantHeartbreakStacks).toBe(1)
      expect(scorned.effects).toContainEqual(
        expect.objectContaining({
          type: EffectType.REFLECT,
          duration: 2,
          value: 30
        })
      )
    })

    it('should have Vengeance Garden AoE at level 6', () => {
      const vengeanceGarden = mara_thornheart.skills.find(s => s.name === 'Vengeance Garden')
      expect(vengeanceGarden).toBeDefined()
      expect(vengeanceGarden.skillUnlockLevel).toBe(6)
      expect(vengeanceGarden.damagePercent).toBe(90)
      expect(vengeanceGarden.damagePerHeartbreakStack).toBe(15)
      expect(vengeanceGarden.targetType).toBe('all_enemies')
      expect(vengeanceGarden.rageCost).toBe(60)
      expect(vengeanceGarden.cooldown).toBe(3)
      expect(vengeanceGarden.healSelfPercent).toBe(5)
    })

    it('should have Love\'s Final Thorn ultimate at level 12', () => {
      const finalThorn = mara_thornheart.skills.find(s => s.name === "Love's Final Thorn")
      expect(finalThorn).toBeDefined()
      expect(finalThorn.skillUnlockLevel).toBe(12)
      expect(finalThorn.damagePercent).toBe(200)
      expect(finalThorn.damagePerHeartbreakStackConsumed).toBe(25)
      expect(finalThorn.consumeAllHeartbreakStacks).toBe(true)
      expect(finalThorn.rageCost).toBe(80)
      expect(finalThorn.cooldown).toBe(5)
      expect(finalThorn.selfDamagePercentMaxHp).toBe(10)
      expect(finalThorn.onKillGrantHeartbreakStacks).toBe(2)
      expect(finalThorn.targetType).toBe('enemy')
    })
  })

  describe('leaderSkill', () => {
    it('should have "What Doesn\'t Kill Us" leader skill', () => {
      expect(mara_thornheart.leaderSkill.name).toBe("What Doesn't Kill Us")
    })

    it('should have passive_lifesteal effect', () => {
      const lifestealEffect = mara_thornheart.leaderSkill.effects.find(
        e => e.type === 'passive_lifesteal'
      )
      expect(lifestealEffect).toBeDefined()
      expect(lifestealEffect.value).toBe(5)
      expect(lifestealEffect.target).toBe('all_allies')
    })

    it('should have hp_threshold_triggered effect', () => {
      const thresholdEffect = mara_thornheart.leaderSkill.effects.find(
        e => e.type === 'hp_threshold_triggered'
      )
      expect(thresholdEffect).toBeDefined()
      expect(thresholdEffect.threshold).toBe(50)
      expect(thresholdEffect.triggerOnce).toBe(true)
      expect(thresholdEffect.apply.effectType).toBe('atk_up')
      expect(thresholdEffect.apply.value).toBe(15)
      expect(thresholdEffect.apply.duration).toBe(3)
    })
  })
})
