import { EffectType } from '../statusEffects.js'

export const enemies = {
  fire_elemental: {
    id: 'fire_elemental',
    name: 'Fire Elemental',
    stats: { hp: 110, atk: 45, def: 20, spd: 14 },
    skill: {
      name: 'Flame Burst',
      description: 'Deal 140% ATK damage and deal 15 damage at end of turn for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.POISON, target: 'hero', duration: 2, value: 15 }
      ]
    }
  },
  magma_golem: {
    id: 'magma_golem',
    name: 'Magma Golem',
    stats: { hp: 220, atk: 42, def: 35, spd: 5 },
    skill: {
      name: 'Molten Slam',
      description: 'Deal 160% ATK damage and reduce target DEF by 25% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 25 }
      ]
    }
  },
  ash_crawler: {
    id: 'ash_crawler',
    name: 'Ash Crawler',
    stats: { hp: 70, atk: 35, def: 12, spd: 20 },
    skill: {
      name: 'Ember Swarm',
      description: 'Deal 100% ATK damage to all heroes',
      cooldown: 4,
      targetType: 'all_heroes'
    }
  },
  flame_salamander: {
    id: 'flame_salamander',
    name: 'Flame Salamander',
    stats: { hp: 130, atk: 48, def: 22, spd: 13 },
    skill: {
      name: 'Searing Breath',
      description: 'Deal 150% ATK damage and deal 20 damage at end of turn for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.POISON, target: 'hero', duration: 2, value: 20 }
      ]
    }
  },
  volcanic_drake: {
    id: 'volcanic_drake',
    name: 'Volcanic Drake',
    stats: { hp: 280, atk: 52, def: 28, spd: 11 },
    skill: {
      name: 'Lava Breath',
      description: 'Deal 130% ATK damage to all heroes',
      cooldown: 5,
      targetType: 'all_heroes'
    }
  }
}
