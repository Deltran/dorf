import { EffectType } from '../statusEffects.js'

export const enemies = {
  murk_stalker: {
    id: 'murk_stalker',
    name: 'Murk Stalker',
    lore: 'In the lightless depths where it hunts, even sound is swallowed. You only know it\'s there when the pain starts.',
    stats: { hp: 220, atk: 68, def: 24, spd: 24 },
    skill: {
      name: 'Shadowstrike',
      description: 'Deal 200% ATK to Blinded targets, 130% otherwise',
      cooldown: 3,
      damagePercent: 130,
      bonusToDebuffed: { type: 'blind', bonus: 70 }
    }
  },
  blind_angler: {
    id: 'blind_angler',
    name: 'Blind Angler',
    lore: 'Its bioluminescent lure is the last light many ever see. The blinding flash leaves victims helpless in the dark.',
    stats: { hp: 200, atk: 55, def: 28, spd: 12 },
    skill: {
      name: 'Lure Light',
      description: 'Blind target for 2 turns (50% miss chance)',
      cooldown: 3,
      noDamage: true,
      effects: [
        { type: EffectType.EVASION, target: 'hero', duration: 2, value: -50, isBlind: true }
      ]
    }
  },
  outcast_thug: {
    id: 'outcast_thug',
    name: 'Outcast Thug',
    lore: 'Exiled to the murk for crimes even the merfolk found repulsive, desperation has made them deadlier than ever.',
    stats: { hp: 280, atk: 60, def: 35, spd: 10 },
    skill: {
      name: 'Desperate Swing',
      description: 'Deal 140% ATK. +40% ATK when below 50% HP.',
      cooldown: 3,
      damagePercent: 140,
      desperateBonus: { threshold: 50, atkBonus: 40 }
    }
  },
  shadow_eel: {
    id: 'shadow_eel',
    name: 'Shadow Eel',
    lore: 'Black as the void and fast as thought, it slithers between strikes with uncanny grace, impossible to pin down.',
    stats: { hp: 190, atk: 72, def: 18, spd: 26 },
    skill: {
      name: 'Darting Strike',
      description: 'Deal 160% ATK and gain 30% Evasion for 1 turn',
      cooldown: 3,
      damagePercent: 160,
      effects: [
        { type: EffectType.EVASION, target: 'self', duration: 1, value: 30 }
      ]
    }
  }
}
