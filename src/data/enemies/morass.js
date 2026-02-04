import { EffectType } from '../statusEffects.js'

export const enemies = {
  cave_leech: {
    id: 'cave_leech',
    name: 'Cave Leech',
    lore: 'Fat and slick, they drop from the dripping ceiling onto bare skin, drinking deep before the pain even registers.',
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
    lore: 'The spores took root in a corpse and gave it terrible new purpose. It shambles forward, exhaling clouds of choking rot.',
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
    lore: 'It hunts by sound alone in the lightless deep, pouncing with razor claws before its prey even knows it\'s there.',
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
    lore: 'Eyeless and enormous, it feels the vibrations of your heartbeat through the stone and comes crashing toward it.',
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
    lore: 'She brews her hexes in a cauldron of black water and bone. Those she curses wither slowly, their strength draining into the mire.',
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
