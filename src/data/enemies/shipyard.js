import { EffectType } from '../statusEffects.js'

export const enemies = {
  wreck_scavenger: {
    id: 'wreck_scavenger',
    name: 'Wreck Scavenger',
    stats: { hp: 220, atk: 62, def: 28, spd: 18 },
    skill: {
      name: 'Plunder',
      description: '130% ATK and steal target buffs',
      cooldown: 3,
      damagePercent: 130,
      stealBuffs: true
    }
  },
  drowned_sailor: {
    id: 'drowned_sailor',
    name: 'Drowned Sailor',
    stats: { hp: 280, atk: 58, def: 35, spd: 10 },
    skill: {
      name: 'Ghostly Grasp',
      description: "Target can't heal for 2 turns.",
      cooldown: 3,
      damagePercent: 120,
      effects: [
        { type: EffectType.DEBUFF_IMMUNE, target: 'hero', duration: 2, blockHealing: true }
      ]
    }
  },
  barnacle_titan: {
    id: 'barnacle_titan',
    name: 'Barnacle Titan',
    stats: { hp: 380, atk: 55, def: 55, spd: 5 },
    skill: {
      name: 'Encrusted Shell',
      description: '30% DR for 2 turns. Reflect 20% damage.',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.DAMAGE_REDUCTION, target: 'self', duration: 2, value: 30 },
        { type: EffectType.REFLECT, target: 'self', duration: 2, value: 20 }
      ]
    }
  },
  shipwreck_siren: {
    id: 'shipwreck_siren',
    name: 'Shipwreck Siren',
    stats: { hp: 200, atk: 68, def: 22, spd: 16 },
    skill: {
      name: 'Luring Song',
      description: 'Force target to attack ally next turn',
      cooldown: 4,
      noDamage: true,
      charm: true
    }
  }
}
