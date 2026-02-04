import { EffectType } from '../../statusEffects.js'

export const village_healer = {
  id: 'village_healer',
  name: 'Grandma Helga',
  rarity: 3,
  classId: 'cleric',
  baseStats: { hp: 80, atk: 18, def: 25, spd: 9, mp: 65 },
  skills: [
    {
      name: 'Healing Touch',
      description: 'Heal one ally for 120% ATK',
      mpCost: 15,
      skillUnlockLevel: 1,
      targetType: 'ally',
      healPercent: 120
    },
    {
      name: 'Cup of Tea',
      description: 'Grant an ally regeneration (25% ATK per turn for 3 turns)',
      mpCost: 12,
      skillUnlockLevel: 1,
      targetType: 'ally',
      noDamage: true,
      effects: [
        {
          type: EffectType.REGEN,
          target: 'ally',
          duration: 3,
          atkPercent: 25
        }
      ]
    },
    {
      name: 'Mana Spring',
      description: 'Grant an ally MP regeneration (5 MP per turn for 3 turns)',
      mpCost: 10,
      skillUnlockLevel: 3,
      targetType: 'ally',
      noDamage: true,
      effects: [
        {
          type: EffectType.MP_REGEN,
          target: 'ally',
          duration: 3,
          value: 5
        }
      ]
    },
    {
      name: 'There There, Dear',
      description: 'Heal ally for 90% ATK and grant +15% ATK for 2 turns',
      mpCost: 18,
      skillUnlockLevel: 6,
      targetType: 'ally',
      healPercent: 90,
      effects: [
        {
          type: EffectType.ATK_UP,
          target: 'ally',
          duration: 2,
          value: 15
        }
      ]
    },
    {
      name: 'Second Helping',
      description: 'Heal all allies for 80% ATK. Grant "Well Fed" for 3 turns - auto-heals for 100% ATK if HP drops below 30%.',
      mpCost: 28,
      skillUnlockLevel: 12,
      targetType: 'all_allies',
      healPercent: 80,
      wellFedEffect: { duration: 3, atkPercent: 100, threshold: 30 }
    }
  ],
  epithet: 'Keeper of the Kettle',
  introQuote: 'Sit down, dear. Tea first, then we talk about your troubles.',
  lore: 'Grandma Helga has buried three husbands, raised eleven children, and healed every ailment from plague to heartbreak with the same pot of tea. The village built a statue of her once, but she made them take it down \u2014 said it blocked her herb garden\'s sunlight.'
}
