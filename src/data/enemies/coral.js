import { EffectType } from '../statusEffects.js'

export const enemies = {
  cave_crab: {
    id: 'cave_crab',
    name: 'Cave Crab',
    stats: { hp: 280, atk: 42, def: 45, spd: 5 },
    skill: {
      name: 'Shell Slam',
      description: 'Deal 140% ATK damage and stun target for 1 turn',
      cooldown: 4,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
      ]
    }
  },
  moray_eel: {
    id: 'moray_eel',
    name: 'Moray Eel',
    stats: { hp: 160, atk: 58, def: 16, spd: 20 },
    skill: {
      name: 'Lunge',
      description: 'Deal 170% ATK damage to one target',
      cooldown: 3
    }
  },
  barnacle_cluster: {
    id: 'barnacle_cluster',
    name: 'Barnacle Cluster',
    stats: { hp: 140, atk: 40, def: 30, spd: 8 },
    skill: {
      name: 'Encrust',
      description: 'Reduce all heroes DEF by 35% for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'all_heroes', duration: 2, value: 35 }
      ]
    }
  },
  reef_warden: {
    id: 'reef_warden',
    name: 'Reef Warden',
    stats: { hp: 200, atk: 44, def: 28, spd: 12 },
    skill: {
      name: 'Coral Armor',
      description: 'Increase one ally DEF by 40% for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.DEF_UP, target: 'ally', duration: 2, value: 40 }
      ]
    }
  }
}
