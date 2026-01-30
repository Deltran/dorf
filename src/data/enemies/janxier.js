import { EffectType } from '../statusEffects.js'

export const enemies = {
  swamp_lurker: {
    id: 'swamp_lurker',
    name: 'Swamp Lurker',
    stats: { hp: 120, atk: 46, def: 18, spd: 16 },
    skill: {
      name: 'Ambush Strike',
      description: 'Deal 180% ATK damage to lowest HP hero',
      cooldown: 4
    }
  },
  mud_elemental: {
    id: 'mud_elemental',
    name: 'Mud Elemental',
    stats: { hp: 180, atk: 38, def: 32, spd: 7 },
    skill: {
      name: 'Mire Grasp',
      description: 'Deal 120% ATK damage and reduce target SPD by 40% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 40 }
      ]
    }
  },
  water_naga: {
    id: 'water_naga',
    name: 'Water Naga',
    stats: { hp: 140, atk: 50, def: 20, spd: 15 },
    skill: {
      name: 'Tidal Curse',
      description: 'Deal 130% ATK damage and reduce target ATK by 35% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 35 }
      ]
    }
  },
  giant_crocodile: {
    id: 'giant_crocodile',
    name: 'Giant Crocodile',
    stats: { hp: 200, atk: 55, def: 25, spd: 9 },
    skill: {
      name: 'Death Roll',
      description: 'Deal 170% ATK damage and stun target for 1 turn',
      cooldown: 5,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
      ]
    }
  },
  hydra: {
    id: 'hydra',
    name: 'Hydra',
    stats: { hp: 650, atk: 55, def: 38, spd: 10 },
    imageSize: 160,
    skills: [
      {
        name: 'Multi-Head Strike',
        description: 'Deal 80% ATK damage to all heroes',
        cooldown: 3,
        targetType: 'all_heroes'
      },
      {
        name: 'Regeneration',
        description: 'Heal self for 15% of max HP and increase ATK by 20% for 2 turns',
        cooldown: 4,
        noDamage: true,
        healSelf: 15,
        effects: [
          { type: EffectType.ATK_UP, target: 'self', duration: 2, value: 20 }
        ]
      }
    ]
  }
}
