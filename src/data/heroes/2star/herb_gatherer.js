import { EffectType } from '../../statusEffects.js'

export const herb_gatherer = {
  id: 'herb_gatherer',
  name: 'Bertan the Gatherer',
  rarity: 2,
  classId: 'druid',
  baseStats: { hp: 65, atk: 15, def: 18, spd: 10, mp: 55 },
  skills: [
    {
      name: 'Herbal Remedy',
      description: 'Heal one ally for 120% ATK',
      mpCost: 12,
      skillUnlockLevel: 1,
      targetType: 'ally',
      healPercent: 120
    },
    {
      name: 'Antidote',
      description: 'Remove poison, burn, and bleed from one ally',
      mpCost: 10,
      skillUnlockLevel: 3,
      targetType: 'ally',
      noDamage: true,
      cleanse: 'dots'
    },
    {
      name: 'Herbal Tonic',
      description: 'Apply regeneration to one ally (45% ATK heal per turn for 3 turns)',
      mpCost: 14,
      skillUnlockLevel: 6,
      targetType: 'ally',
      noDamage: true,
      effects: [
        {
          type: EffectType.REGEN,
          target: 'ally',
          duration: 3,
          atkPercent: 45
        }
      ]
    },
    {
      name: "Nature's Bounty",
      description: 'Heal one ally for 150% ATK and restore 15 MP. Rangers regain Focus.',
      mpCost: 18,
      skillUnlockLevel: 12,
      targetType: 'ally',
      healPercent: 150,
      mpRestore: 15,
      grantsFocus: true
    }
  ],
  epithet: 'Root and Remedy',
  introQuote: 'Nature provides. You just have to know where to look.',
  lore: 'Bertan has spent more years in the forest than in any town, learning the language of roots and leaves from the earth itself. He\'s no warrior and makes no pretense of being one \u2014 but a well-timed poultice has saved more lives than most swords.'
}
