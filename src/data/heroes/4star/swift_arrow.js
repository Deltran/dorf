import { EffectType } from '../../statusEffects.js'

export const swift_arrow = {
  id: 'swift_arrow',
  name: 'Swift Arrow',
  rarity: 4,
  classId: 'ranger',
  baseStats: { hp: 90, atk: 42, def: 22, spd: 20, mp: 55 },
  skills: [
    {
      name: 'Quick Shot',
      description: 'Deal 90% ATK damage to one enemy. Applies SPD Down for 2 turns.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 90,
      effects: [
        {
          type: EffectType.SPD_DOWN,
          target: 'enemy',
          duration: 2,
          value: 15
        }
      ]
    },
    {
      name: 'Pinning Volley',
      description: 'Deal 60% ATK damage to all enemies. Enemies already suffering a debuff also receive DEF Down for 2 turns.',
      skillUnlockLevel: 1,
      targetType: 'all_enemies',
      damagePercent: 60,
      conditionalEffects: [
        {
          condition: 'target_has_debuff',
          type: EffectType.DEF_DOWN,
          target: 'enemy',
          duration: 2,
          value: 15
        }
      ]
    },
    {
      name: 'Nimble Reposition',
      description: 'Become immune to debuffs for 1 turn and gain 20% SPD for 2 turns.',
      skillUnlockLevel: 3,
      targetType: 'self',
      noDamage: true,
      effects: [
        {
          type: EffectType.DEBUFF_IMMUNE,
          target: 'self',
          duration: 1
        },
        {
          type: EffectType.SPD_UP,
          target: 'self',
          duration: 2,
          value: 20
        }
      ]
    },
    {
      name: 'Precision Strike',
      description: 'Deal 140% ATK damage to one enemy. If target has DEF Down, ignore an additional 20% DEF. If target has SPD Down, deal 180% ATK instead.',
      skillUnlockLevel: 6,
      targetType: 'enemy',
      damagePercent: 140,
      bonusIfTargetHas: [
        {
          effectType: EffectType.DEF_DOWN,
          ignoreDef: 20
        },
        {
          effectType: EffectType.SPD_DOWN,
          damagePercent: 180
        }
      ]
    },
    {
      name: 'Flurry of Arrows',
      description: 'Deal 55% ATK damage three times to one enemy. Each hit against a debuffed target grants a stack of Momentum (+5% SPD, max 6 stacks).',
      skillUnlockLevel: 12,
      targetType: 'enemy',
      damagePercent: 55,
      multiHit: 3,
      onHitDebuffedTarget: {
        applyToSelf: {
          type: EffectType.SWIFT_MOMENTUM,
          value: 5,
          duration: 999
        }
      }
    }
  ],
  epithet: 'The Skirmisher',
  introQuote: 'Can\'t talk here. I need to focus.',
  lore: 'Exiled from the Verdant Court for a transgression she refuses to name, Swift Arrow wanders the lowlands picking off threats that most people never see coming. She speaks little, eats less, and has never once missed a shot she intended to land.'
}
