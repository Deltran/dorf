import { EffectType } from '../../statusEffects.js'

export const vashek_the_unrelenting = {
  id: 'vashek_the_unrelenting',
  name: 'Vashek',
  rarity: 3,
  classId: 'knight',
  baseStats: { hp: 110, atk: 22, def: 28, spd: 10 },
  skills: [
    {
      name: 'Hold the Line',
      description: 'Deal damage. If any ally is below 50% HP, deal bonus damage. Scales with Valor.',
      skillUnlockLevel: 1,
      valorRequired: 0,
      targetType: 'enemy',
      damagePercent: { base: 80, at25: 90, at50: 100, at75: 110, at100: 120 },
      conditionalBonusDamage: {
        condition: 'anyAllyBelowHalfHp',
        bonusPercent: { base: 20, at50: 25, at75: 30, at100: 35 }
      }
    },
    {
      name: 'Brothers in Arms',
      description: 'Grant ally DEF buff, gain ATK buff. Scales with Valor.',
      skillUnlockLevel: 1,
      valorRequired: 0,
      targetType: 'ally',
      excludeSelf: true,
      noDamage: true,
      effects: [
        {
          type: EffectType.DEF_UP,
          target: 'ally',
          duration: 2,
          value: { base: 10, at25: 15, at50: 20, at75: 25, at100: 30 }
        },
        {
          type: EffectType.ATK_UP,
          target: 'self',
          duration: 2,
          value: { base: 5, at50: 10, at75: 15, at100: 20 }
        }
      ]
    },
    {
      name: 'Forward, Together',
      description: 'All allies gain ATK buff. Vashek takes 10% max HP self-damage. Scales with Valor.',
      skillUnlockLevel: 3,
      valorRequired: 25,
      targetType: 'all_allies',
      noDamage: true,
      selfDamagePercentMaxHp: 10,
      effects: [
        {
          type: EffectType.ATK_UP,
          target: 'all_allies',
          duration: { base: 2, at100: 3 },
          value: { base: 10, at50: 15, at75: 20, at100: 25 }
        }
      ]
    },
    {
      name: 'Unyielding',
      description: 'Passive: Once per battle, when an ally would die and Vashek is above 50% HP, he takes 50% of the killing blow and the ally survives at 1 HP.',
      skillUnlockLevel: 6,
      isPassive: true,
      passiveType: 'allySaveOnce',
      saveAllyOnDeath: { vashekMinHpPercent: 50, damageSharePercent: 50, oncePerBattle: true }
    },
    {
      name: 'Shoulder to Shoulder',
      description: 'All allies gain ATK/DEF per surviving ally. Scales with Valor.',
      skillUnlockLevel: 12,
      valorRequired: 50,
      targetType: 'all_allies',
      noDamage: true,
      effects: [
        {
          type: EffectType.ATK_UP,
          target: 'all_allies',
          duration: { base: 2, at100: 3 },
          valuePerAlly: { base: 5, at75: 7, at100: 8 }
        },
        {
          type: EffectType.DEF_UP,
          target: 'all_allies',
          duration: { base: 2, at100: 3 },
          valuePerAlly: { base: 5, at75: 7, at100: 8 }
        }
      ]
    }
  ],
  epithet: 'Unrelenting Defender',
  introQuote: "Don't wait for the enemy to set up their strategy. Push forward, comrades!"
}
