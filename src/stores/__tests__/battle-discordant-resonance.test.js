import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('DISCORDANT_RESONANCE leader skill', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have applyBattleStartDebuffLeaderEffect function', () => {
    expect(typeof battleStore.applyBattleStartDebuffLeaderEffect).toBe('function')
  })

  it('should apply DISCORDANT_RESONANCE to all allies', () => {
    const heroes = [
      { instanceId: 'h1', statusEffects: [] },
      { instanceId: 'h2', statusEffects: [] }
    ]

    const effect = {
      type: 'battle_start_debuff',
      target: 'all_allies',
      apply: {
        effectType: 'discordant_resonance',
        damageBonus: 15,
        healingPenalty: 30
      }
    }

    battleStore.applyBattleStartDebuffLeaderEffect(heroes, effect)

    expect(heroes[0].statusEffects).toHaveLength(1)
    expect(heroes[0].statusEffects[0].type).toBe(EffectType.DISCORDANT_RESONANCE)
    expect(heroes[0].statusEffects[0].damageBonus).toBe(15)
    expect(heroes[0].statusEffects[0].healingPenalty).toBe(30)

    expect(heroes[1].statusEffects).toHaveLength(1)
  })

  it('should have getDiscordantDamageBonus function', () => {
    const hero = {
      statusEffects: [{
        type: EffectType.DISCORDANT_RESONANCE,
        damageBonus: 15
      }]
    }

    expect(battleStore.getDiscordantDamageBonus(hero)).toBe(1.15)
  })

  it('should have getDiscordantHealingPenalty function', () => {
    const hero = {
      statusEffects: [{
        type: EffectType.DISCORDANT_RESONANCE,
        healingPenalty: 30
      }]
    }

    expect(battleStore.getDiscordantHealingPenalty(hero)).toBe(0.7)
  })

  it('should return 1.0 for damage bonus when no effect', () => {
    const hero = { statusEffects: [] }
    expect(battleStore.getDiscordantDamageBonus(hero)).toBe(1.0)
  })

  it('should return 1.0 for healing penalty when no effect', () => {
    const hero = { statusEffects: [] }
    expect(battleStore.getDiscordantHealingPenalty(hero)).toBe(1.0)
  })
})
