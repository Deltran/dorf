import { EffectType } from '../statusEffects.js'

export const enemies = {
  pearl_guard: {
    id: 'pearl_guard',
    name: 'Pearl Guard',
    stats: { hp: 300, atk: 72, def: 42, spd: 14 },
    skill: {
      name: 'Ceremonial Strike',
      description: 'Deal 150% ATK. +50% if an ally died this battle.',
      cooldown: 3,
      damagePercent: 150,
      bonusIfAllyDied: 50
    }
  },
  nobles_bodyguard: {
    id: 'nobles_bodyguard',
    name: "Noble's Bodyguard",
    stats: { hp: 380, atk: 60, def: 55, spd: 12 },
    skill: {
      name: 'Intercept',
      description: 'Guard lowest HP ally for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.GUARDING, target: 'lowest_hp_ally', duration: 2 }
      ]
    }
  },
  court_mage: {
    id: 'court_mage',
    name: 'Court Mage',
    stats: { hp: 220, atk: 78, def: 28, spd: 16 },
    skill: {
      name: 'Tidal Blessing',
      description: 'Heal ally 20% max HP and +30% DEF for 2 turns',
      cooldown: 4,
      noDamage: true,
      healAlly: 20,
      effects: [
        { type: EffectType.DEF_UP, target: 'ally', duration: 2, value: 30 }
      ]
    }
  },
  gilded_construct: {
    id: 'gilded_construct',
    name: 'Gilded Construct',
    stats: { hp: 350, atk: 68, def: 50, spd: 6 },
    skill: {
      name: 'Gilded Slam',
      description: 'Deal 170% ATK to all heroes',
      cooldown: 4,
      initialCooldown: 4,
      damagePercent: 170,
      targetType: 'all_heroes'
    }
  }
}
