import { EffectType } from '../../statusEffects.js'

export const beggar_monk = {
  id: 'beggar_monk',
  name: 'Vagrant Bil',
  rarity: 1,
  classId: 'cleric',
  baseStats: { hp: 60, atk: 12, def: 15, spd: 9, mp: 45 },
  skills: [
    {
      name: 'Minor Heal',
      description: 'Heal one ally. Heals more the lower their HP.',
      mpCost: 10,
      skillUnlockLevel: 1,
      targetType: 'ally',
      healPercent: 40,
      desperationHealBonus: 80
    },
    {
      name: 'Worthless Words',
      description: 'Weaken one enemy. Stronger when the party is struggling.',
      mpCost: 8,
      skillUnlockLevel: 3,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        {
          type: EffectType.ATK_DOWN,
          target: 'enemy',
          duration: 2,
          value: 10,
          desperationBonus: 15
        }
      ]
    },
    {
      name: "Nobody's Curse",
      description: "Curse one enemy's armor. Stronger when the party is struggling.",
      mpCost: 8,
      skillUnlockLevel: 6,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        {
          type: EffectType.DEF_DOWN,
          target: 'enemy',
          duration: 3,
          value: 10,
          desperationBonus: 15
        }
      ]
    },
    {
      name: "Beggar's Prayer",
      description: 'Heal all allies and weaken all enemies. Stronger when hope is fading.',
      mpCost: 16,
      skillUnlockLevel: 12,
      targetType: 'all_allies',
      healPercent: 25,
      desperationHealBonus: 50,
      effects: [
        {
          type: EffectType.ATK_DOWN,
          target: 'all_enemies',
          duration: 2,
          value: 10,
          desperationBonus: 15
        }
      ]
    }
  ],
  epithet: 'Wise Pauper',
  introQuote: 'You just need to see enough, young one, to understand.',
  lore: 'Vagrant Bil was once a scholar in a grand monastery before he gave away everything he owned to a family of refugees and walked out the door with nothing. He discovered that prayers spoken from the gutter carry more weight with the gods than those from gilded halls.'
}
