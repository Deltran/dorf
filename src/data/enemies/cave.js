import { EffectType } from '../statusEffects.js'

export const enemies = {
  cave_bat: {
    id: 'cave_bat',
    name: 'Cave Bat',
    lore: 'They cling to the ceilings in writhing masses, descending in shrieking clouds when the torchlight disturbs them.',
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
    lore: 'Carved by hands long since turned to dust, it still follows its last command: let nothing pass.',
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
    lore: 'Hollow-eyed and muttering, they traded their names for a scrap of forbidden power and haven\'t looked back since.',
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
    lore: 'Where cultists beg for power, casters seize it. The shadows coil around their fingers like obedient serpents.',
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
    lore: 'It fills the tunnel from wall to wall, all muscle and bad temper. The bones littering its den are not all animal.',
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
    lore: 'They carve sigils into their own flesh to channel dark blessings, healing the faithful at the cost of their dwindling sanity.',
    stats: { hp: 75, atk: 20, def: 12, spd: 10 },
    skill: {
      name: 'Dark Blessing',
      description: 'Heal all allies for 20% of max HP',
      cooldown: 4,
      noDamage: true,
      healAllAllies: 20,
      effects: []
    }
  },
  cult_warden: {
    id: 'cult_warden',
    name: 'Cult Warden',
    lore: 'Wrapped in shadow-etched robes, they channel protective wards that drink the force from every blow aimed at the faithful.',
    stats: { hp: 100, atk: 22, def: 20, spd: 8 },
    skill: {
      name: 'Shadow Ward',
      description: 'Reduce all allies damage taken by 25% for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.DAMAGE_REDUCTION, target: 'all_allies', duration: 2, value: 25 }
      ]
    }
  }
}
