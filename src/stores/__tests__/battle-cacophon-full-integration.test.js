import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { cacophon } from '../../data/heroes/5star/cacophon.js'
import { EffectType } from '../../data/statusEffects.js'

describe('Cacophon full integration', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('Effect types', () => {
    it('should have all required effect types', () => {
      expect(EffectType.VICIOUS).toBe('vicious')
      expect(EffectType.SHATTERED_TEMPO).toBe('shattered_tempo')
      expect(EffectType.ECHOING).toBe('echoing')
      expect(EffectType.DISCORDANT_RESONANCE).toBe('discordant_resonance')
    })
  })

  describe('Hero data', () => {
    it('should have correct skills with allyHpCostPercent', () => {
      expect(cacophon.skills[0].allyHpCostPercent).toBe(5) // Discordant Anthem
      expect(cacophon.skills[1].allyHpCostPercent).toBe(5) // Vicious Verse
      expect(cacophon.skills[2].allyHpCostPercent).toBe(6) // Tempo Shatter
      expect(cacophon.skills[3].allyHpCostPercent).toBe(6) // Screaming Echo
      expect(cacophon.skills[4].allyHpCostPercent).toBe(5) // Warding Noise
    })

    it('should have Suffering\'s Crescendo finale', () => {
      expect(cacophon.finale.effects[0].type).toBe('suffering_crescendo')
      expect(cacophon.finale.effects[0].baseBuff).toBe(10)
      expect(cacophon.finale.effects[0].hpPerPercent).toBe(150)
      expect(cacophon.finale.effects[0].maxBonus).toBe(25)
    })

    it('should have Harmonic Bleeding leader skill', () => {
      expect(cacophon.leaderSkill.effects[0].type).toBe('battle_start_debuff')
      expect(cacophon.leaderSkill.effects[0].apply.damageBonus).toBe(15)
      expect(cacophon.leaderSkill.effects[0].apply.healingPenalty).toBe(30)
    })
  })

  describe('Battle mechanics', () => {
    it('should track HP lost across skill uses', () => {
      const ally = { instanceId: 'a1', templateId: 'shadow_king', currentHp: 1000, maxHp: 1000 }

      battleStore.applyAllyHpCost(ally, 5, true)
      battleStore.applyAllyHpCost(ally, 6, true)

      expect(battleStore.totalAllyHpLost).toBe(110)
    })

    it('should calculate VICIOUS bonus correctly', () => {
      const attacker = { statusEffects: [{ type: EffectType.VICIOUS, bonusDamagePercent: 30 }] }
      const target = { statusEffects: [{ type: EffectType.POISON, definition: { isBuff: false } }] }

      expect(battleStore.getViciousDamageMultiplier(attacker, target)).toBe(1.3)
    })

    it('should calculate DISCORDANT_RESONANCE bonuses correctly', () => {
      const hero = {
        statusEffects: [{
          type: EffectType.DISCORDANT_RESONANCE,
          damageBonus: 15,
          healingPenalty: 30
        }]
      }

      expect(battleStore.getDiscordantDamageBonus(hero)).toBe(1.15)
      expect(battleStore.getDiscordantHealingPenalty(hero)).toBe(0.7)
    })

    it('should calculate Finale buff based on HP lost', () => {
      battleStore.totalAllyHpLost = 2250 // 2250 / 150 = 15% bonus

      const bonus = battleStore.calculateSufferingCrescendoBonus(10, 150, 25)

      expect(bonus).toBe(25) // 10 base + 15 bonus
    })

    it('should cap Finale bonus at max', () => {
      battleStore.totalAllyHpLost = 6000 // Would be 40% bonus

      const bonus = battleStore.calculateSufferingCrescendoBonus(10, 150, 25)

      expect(bonus).toBe(35) // 10 base + 25 max bonus
    })
  })

  describe('Full skill rotation simulation', () => {
    it('should simulate a typical Cacophon rotation', () => {
      const cacophonUnit = {
        instanceId: 'cacophon1',
        templateId: 'cacophon',
        currentHp: 500,
        maxHp: 500,
        statusEffects: []
      }

      const ally1 = {
        instanceId: 'ally1',
        templateId: 'shadow_king',
        currentHp: 1000,
        maxHp: 1000,
        statusEffects: []
      }

      const ally2 = {
        instanceId: 'ally2',
        templateId: 'aurora',
        currentHp: 1200,
        maxHp: 1200,
        statusEffects: []
      }

      // Turn 1: Discordant Anthem (5% to all allies)
      battleStore.processAllyHpCostForSkill(cacophonUnit, cacophon.skills[0], [cacophonUnit, ally1, ally2])

      // Cacophon should be immune, allies should take damage
      expect(cacophonUnit.currentHp).toBe(500) // Immune
      expect(ally1.currentHp).toBe(950) // -50
      expect(ally2.currentHp).toBe(1140) // -60

      // Turn 2: Vicious Verse on ally1 (5%)
      battleStore.processAllyHpCostForSkill(cacophonUnit, cacophon.skills[1], [ally1])
      expect(ally1.currentHp).toBe(900) // -50 more

      // Turn 3: Tempo Shatter on ally1 (6%)
      battleStore.processAllyHpCostForSkill(cacophonUnit, cacophon.skills[2], [ally1])
      expect(ally1.currentHp).toBe(840) // -60 more

      // Total HP lost: 50 + 60 + 50 + 60 = 220
      expect(battleStore.totalAllyHpLost).toBe(220)

      // Finale triggers: 220 / 150 = 1% bonus
      // Total buff: 10 base + 1 bonus = 11%
      const bonus = battleStore.calculateSufferingCrescendoBonus(10, 150, 25)
      expect(bonus).toBe(11)
    })
  })
})
