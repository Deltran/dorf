import { EffectType } from '../statusEffects.js'

export const enemies = {
  cave_bat: {
    id: 'cave_bat',
    name: 'Cave Bat',
    stats: { hp: 35, atk: 18, def: 3, spd: 20 },
    skill: {
      name: 'Sonic Screech',
      description: 'Deal 80% ATK damage to all heroes',
      cooldown: 4
    }
  },
  rock_golem: {
    id: 'rock_golem',
    name: 'Rock Golem',
    stats: { hp: 150, atk: 30, def: 35, spd: 4 },
    skill: {
      name: 'Boulder Smash',
      description: 'Deal 180% ATK damage',
      cooldown: 4
    }
  },
  dark_cultist: {
    id: 'dark_cultist',
    name: 'Dark Cultist',
    stats: { hp: 65, atk: 28, def: 10, spd: 11 },
    skill: {
      name: 'Shadow Bolt',
      description: 'Deal 120% ATK damage and poison for 40% ATK per turn for 2 turns',
      cooldown: 2,
      damagePercent: 120,
      effects: [
        { type: EffectType.POISON, target: 'hero', duration: 2, atkPercent: 40 }
      ]
    }
  },
  dark_caster: {
    id: 'dark_caster',
    name: 'Dark Caster',
    stats: { hp: 55, atk: 32, def: 8, spd: 12 },
    skill: {
      name: 'Curse of Weakness',
      description: 'Deal 140% ATK damage and reduce ATK by 40% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 40 }
      ]
    }
  },
  cave_troll: {
    id: 'cave_troll',
    name: 'Cave Troll',
    stats: { hp: 200, atk: 35, def: 20, spd: 5 },
    skill: {
      name: 'Crushing Blow',
      description: 'Deal 160% ATK damage and stun target for 1 turn',
      cooldown: 5,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
      ]
    }
  },
  cultist_ritualist: {
    id: 'cultist_ritualist',
    name: 'Cultist Ritualist',
    stats: { hp: 75, atk: 20, def: 12, spd: 10 },
    skill: {
      name: 'Dark Blessing',
      description: 'Heal all allies for 30% of max HP and increase ATK by 20% for 2 turns',
      cooldown: 4,
      noDamage: true,
      healAllAllies: 30,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 20 }
      ]
    }
  },
  corrupted_golem: {
    id: 'corrupted_golem',
    name: 'Corrupted Golem',
    stats: { hp: 180, atk: 35, def: 30, spd: 5 },
    skill: {
      name: 'Shadow Slam',
      description: 'Deal 160% ATK damage and reduce target DEF by 30% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  }
}
