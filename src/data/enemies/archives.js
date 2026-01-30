import { EffectType } from '../statusEffects.js'

export const enemies = {
  archive_construct: {
    id: 'archive_construct',
    name: 'Archive Construct',
    stats: { hp: 380, atk: 75, def: 55, spd: 8 },
    skill: {
      name: 'Restricted Access',
      description: '140% ATK. Silence 2 turns.',
      cooldown: 4,
      damagePercent: 140,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 2, isSilence: true }
      ]
    }
  },
  ink_specter: {
    id: 'ink_specter',
    name: 'Ink Specter',
    stats: { hp: 280, atk: 85, def: 30, spd: 18 },
    skill: {
      name: 'Redacted',
      description: '160% ATK. If Silenced, also Blind 1 turn.',
      cooldown: 3,
      damagePercent: 160,
      bonusEffectIfDebuffed: {
        type: 'silence',
        apply: { type: EffectType.EVASION, duration: 1, value: -50, isBlind: true }
      }
    }
  },
  tome_mimic: {
    id: 'tome_mimic',
    name: 'Tome Mimic',
    stats: { hp: 300, atk: 80, def: 40, spd: 14 },
    skill: {
      name: 'Forbidden Page',
      description: 'Copy last hero skill. Use against them.',
      cooldown: 4,
      copyLastHeroSkill: true
    }
  },
  knowledge_warden: {
    id: 'knowledge_warden',
    name: 'Knowledge Warden',
    stats: { hp: 350, atk: 78, def: 48, spd: 12 },
    skill: {
      name: 'Mind Seal',
      description: 'All heroes lose 20% current MP. +10% ATK per MP drained.',
      cooldown: 4,
      drainMpPercent: 20,
      targetType: 'all_heroes',
      bonusAtkPerMpDrained: 10
    }
  }
}
