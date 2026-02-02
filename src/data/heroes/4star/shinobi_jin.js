import { EffectType } from '../../statusEffects.js'

export const shinobi_jin = {
  id: 'shinobi_jin',
  name: 'Shinobi Jin',
  rarity: 4,
  classId: 'ranger',
  baseStats: { hp: 85, atk: 40, def: 18, spd: 22, mp: 55 },
  skills: [
    {
      name: 'Kunai',
      description: 'Deal 70% ATK damage and apply Poison for 2 turns. If target is Marked, Poison lasts 3 turns.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 70,
      effects: [
        {
          type: EffectType.POISON,
          target: 'enemy',
          duration: 2,
          atkPercent: 20
        }
      ],
      ifMarked: { extendDuration: 1 }
    },
    {
      name: 'Shi no In',
      description: 'Mark target for 3 turns, taking +15% damage from Jin. On kill, Jin gains Stealth for 1 turn.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        {
          type: EffectType.MARKED,
          target: 'enemy',
          duration: 3,
          value: 15
        }
      ],
      onKill: { type: 'stealth', target: 'self', duration: 1 }
    },
    {
      name: 'Kusari Fundo',
      description: 'Deal 70% ATK damage to all enemies. Marked enemies take 90% ATK instead.',
      skillUnlockLevel: 3,
      targetType: 'all_enemies',
      damagePercent: 70,
      focusCost: 25,
      ifMarked: { damagePercent: 90 }
    },
    {
      name: 'Ansatsu',
      description: 'Deal 180% ATK damage. Execute enemies below 30% HP. Marked = 35% threshold. Execute Marked = cooldown reset.',
      skillUnlockLevel: 6,
      targetType: 'enemy',
      damagePercent: 180,
      focusCost: 35,
      cooldown: 4,
      executeThreshold: 30,
      ifMarked: {
        executeThreshold: 35,
        onExecute: { resetCooldown: true }
      }
    },
    {
      name: 'Kemuri Dama',
      description: 'All allies gain 40% Evasion for 2 turns. Jin gains Stealth for 2 turns.',
      skillUnlockLevel: 12,
      targetType: 'all_allies',
      noDamage: true,
      focusCost: 50,
      cooldown: 5,
      effects: [
        {
          type: EffectType.EVASION,
          target: 'all_allies',
          duration: 2,
          value: 40
        },
        {
          type: EffectType.STEALTH,
          target: 'self',
          duration: 2
        }
      ]
    }
  ],
  passive: {
    name: 'Kage no Mai',
    description: 'After using any skill, gain 10% Evasion for 1 turn (stacks to 30%)',
    onSkillUse: { type: 'evasion', value: 10, duration: 1, maxStacks: 30 }
  },
  epithet: 'Shadow Without a Master',
  introQuote: 'You saw me because I allowed it.'
}
