import { EffectType } from '../statusEffects.js'

export const enemies = {
  ruin_scavenger: {
    id: 'ruin_scavenger',
    name: 'Ruin Scavenger',
    stats: { hp: 180, atk: 52, def: 20, spd: 22 },
    skill: {
      name: 'Opportunist',
      description: 'Deal 150% ATK damage. +50% damage to DEF down targets.',
      cooldown: 3,
      damagePercent: 150,
      bonusToDebuffed: { type: 'def_down', bonus: 50 }
    }
  },
  decay_jelly: {
    id: 'decay_jelly',
    name: 'Decay Jelly',
    stats: { hp: 150, atk: 45, def: 18, spd: 8 },
    skill: {
      name: 'Corrosive Touch',
      description: 'Reduce target DEF by 25% for 3 turns',
      cooldown: 3,
      noDamage: true,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 3, value: 25 }
      ]
    }
  },
  corroded_sentinel: {
    id: 'corroded_sentinel',
    name: 'Corroded Sentinel',
    stats: { hp: 320, atk: 48, def: 50, spd: 4 },
    skill: {
      name: 'Rusted Slam',
      description: 'Deal 120% ATK damage and taunt for 2 turns',
      cooldown: 4,
      damagePercent: 120,
      effects: [
        { type: EffectType.TAUNT, target: 'self', duration: 2 }
      ]
    }
  },
  tide_lurker: {
    id: 'tide_lurker',
    name: 'Tide Lurker',
    stats: { hp: 200, atk: 55, def: 22, spd: 18 },
    skill: {
      name: 'Ambush',
      description: 'Deal 180% ATK damage on first attack',
      cooldown: 0,
      damagePercent: 180,
      firstAttackOnly: true
    }
  }
}
