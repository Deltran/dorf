import { EffectType } from '../statusEffects.js'

export const enemies = {
  cave_leech: {
    id: 'cave_leech',
    name: 'Cave Leech',
    stats: { hp: 90, atk: 38, def: 14, spd: 15 },
    skill: {
      name: 'Blood Drain',
      description: 'Deal 130% ATK damage and heal self for 75% of damage dealt',
      cooldown: 3,
      lifesteal: 75
    }
  },
  fungal_zombie: {
    id: 'fungal_zombie',
    name: 'Fungal Zombie',
    stats: { hp: 160, atk: 42, def: 20, spd: 5 },
    skill: {
      name: 'Spore Cloud',
      description: 'Deal 100% ATK damage to all heroes and deal 12 damage at end of turn for 3 turns',
      cooldown: 5,
      targetType: 'all_heroes',
      effects: [
        { type: EffectType.POISON, target: 'all_heroes', duration: 3, value: 12 }
      ]
    }
  },
  gloom_stalker: {
    id: 'gloom_stalker',
    name: 'Gloom Stalker',
    stats: { hp: 110, atk: 50, def: 16, spd: 22 },
    skill: {
      name: 'Shadow Pounce',
      description: 'Deal 170% ATK damage to lowest HP hero',
      cooldown: 3
    }
  },
  blind_horror: {
    id: 'blind_horror',
    name: 'Blind Horror',
    stats: { hp: 220, atk: 55, def: 28, spd: 8 },
    skill: {
      name: 'Tremor Sense',
      description: 'Deal 140% ATK damage and reduce target SPD by 50% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 50 }
      ]
    }
  },
  swamp_hag: {
    id: 'swamp_hag',
    name: 'Swamp Hag',
    stats: { hp: 150, atk: 48, def: 20, spd: 12 },
    skill: {
      name: 'Bog Curse',
      description: 'Deal 120% ATK damage to all heroes and reduce ATK by 20% for 2 turns',
      cooldown: 4,
      targetType: 'all_heroes',
      effects: [
        { type: EffectType.ATK_DOWN, target: 'all_heroes', duration: 2, value: 20 }
      ]
    }
  }
}
