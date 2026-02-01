import { EffectType } from '../../statusEffects.js'

export const sir_gallan = {
  id: 'sir_gallan',
  name: 'Sir Gallan',
  rarity: 4,
  classId: 'knight',
  epithet: 'Shield of the Realm',
  introQuote: 'My blade stands ready.',
  baseStats: { hp: 130, atk: 30, def: 45, spd: 10, mp: 50 },
  skills: [
    {
      name: 'Challenge',
      description: 'Force all enemies to target Sir Gallan for 1 turn. At 50 Valor, also gain +10% DEF. At 100 Valor, duration extends to 2 turns. 1 turn cooldown.',
      skillUnlockLevel: 1,
      valorRequired: 0,
      targetType: 'self',
      noDamage: true,
      defensive: true,
      cooldown: 1,
      effects: [
        { type: EffectType.TAUNT, target: 'self', duration: { base: 2, at100: 3 } },
        { type: EffectType.DEF_UP, target: 'self', duration: { base: 2, at100: 3 }, value: 10, valorThreshold: 50 }
      ]
    },
    {
      name: 'Shield Bash',
      description: 'Deal 80% ATK damage and debuff enemy ATK. Debuff strength and duration scale with Valor.',
      skillUnlockLevel: 1,
      valorRequired: 25,
      targetType: 'enemy',
      effects: [
        {
          type: EffectType.ATK_DOWN,
          target: 'enemy',
          duration: { base: 2, at50: 3 },
          value: { base: 20, at25: 25 }
        }
      ]
    },
    {
      name: 'Oath of Protection',
      description: 'Link to an ally for 2 turns, taking 30% of damage dealt to them. Gain 5 Valor when damage is redirected. Redirect amount and duration scale with Valor.',
      skillUnlockLevel: 3,
      valorRequired: 25,
      targetType: 'ally',
      excludeSelf: true,
      noDamage: true,
      defensive: true,
      effects: [
        {
          type: EffectType.GUARDIAN_LINK,
          target: 'ally',
          duration: { base: 2, at75: 3 },
          redirectPercent: { base: 30, at50: 40, at100: 50 },
          valorOnRedirect: 5
        }
      ]
    },
    {
      name: 'Defensive Footwork',
      description: 'Deal 100% DEF damage. If attacked since last turn, gain DEF buff first (scales with Valor).',
      skillUnlockLevel: 6,
      valorRequired: 25,
      targetType: 'enemy',
      useStat: 'def',
      conditionalPreBuff: {
        condition: 'wasAttacked',
        effect: {
          type: EffectType.DEF_UP,
          target: 'self',
          duration: 2,
          value: { base: 10, at50: 15, at75: 20, at100: 25 }
        }
      }
    },
    {
      name: 'Fortress Stance',
      description: 'Reduce damage taken by 50% and reflect 30% back to attackers for 2 turns. At 100 Valor: also immune to debuffs.',
      skillUnlockLevel: 12,
      valorRequired: 50,
      targetType: 'self',
      noDamage: true,
      defensive: true,
      effects: [
        { type: EffectType.DAMAGE_REDUCTION, target: 'self', duration: 2, value: 50 },
        { type: EffectType.REFLECT, target: 'self', duration: 2, value: 30 },
        { type: EffectType.DEBUFF_IMMUNE, target: 'self', duration: 2, valorThreshold: 100 }
      ]
    }
  ]
}
