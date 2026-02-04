import { EffectType } from '../statusEffects.js'

export const enemies = {
  giant_frog: {
    id: 'giant_frog',
    name: 'Giant Frog',
    lore: 'Bloated and patient, it squats among the reeds until something warm comes close enough to snatch.',
    stats: { hp: 70, atk: 18, def: 8, spd: 11 },
    skill: {
      name: 'Tongue Lash',
      description: 'Deal 130% ATK damage and pull target to front position',
      cooldown: 3
    }
  },
  lake_serpent: {
    id: 'lake_serpent',
    name: 'Lake Serpent',
    lore: 'It coils beneath the murky shallows, mistaken for driftwood until its jaws close around a wading leg.',
    stats: { hp: 85, atk: 24, def: 10, spd: 15 },
    skill: {
      name: 'Constrict',
      description: 'Deal 110% ATK damage and reduce target SPD by 30% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  marsh_hag: {
    id: 'marsh_hag',
    name: 'Marsh Hag',
    lore: 'She was human once, or claims to be. Now she trades in curses, and the marsh answers to her crooked will.',
    stats: { hp: 180, atk: 30, def: 14, spd: 10 },
    imageSize: 130,
    skills: [
      {
        name: 'Murky Curse',
        description: 'Deal 100% ATK damage to all heroes and reduce their ATK by 25% for 2 turns',
        cooldown: 4,
        targetType: 'all_heroes',
        effects: [
          { type: EffectType.ATK_DOWN, target: 'all_heroes', duration: 2, value: 25 }
        ]
      },
      {
        name: 'Draining Touch',
        description: 'Deal 140% ATK damage and heal self for 50% of damage dealt',
        cooldown: 3,
        lifesteal: 50
      }
    ]
  }
}
