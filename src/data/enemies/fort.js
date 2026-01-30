import { EffectType } from '../statusEffects.js'

export const enemies = {
  bandit_scout: {
    id: 'bandit_scout',
    name: 'Bandit Scout',
    stats: { hp: 100, atk: 42, def: 16, spd: 18 },
    skill: {
      name: 'Cheap Shot',
      description: 'Deal 150% ATK damage to lowest HP hero',
      cooldown: 3
    }
  },
  bandit_brute: {
    id: 'bandit_brute',
    name: 'Bandit Brute',
    stats: { hp: 160, atk: 52, def: 24, spd: 8 },
    skill: {
      name: 'Crushing Blow',
      description: 'Deal 170% ATK damage and reduce target DEF by 30% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  skeletal_soldier: {
    id: 'skeletal_soldier',
    name: 'Skeletal Soldier',
    stats: { hp: 110, atk: 40, def: 22, spd: 12 },
    skill: {
      name: 'Bone Slash',
      description: 'Deal 140% ATK damage',
      cooldown: 3
    }
  },
  ghostly_knight: {
    id: 'ghostly_knight',
    name: 'Ghostly Knight',
    stats: { hp: 150, atk: 48, def: 30, spd: 11 },
    skill: {
      name: 'Spectral Strike',
      description: 'Deal 140% ATK damage and reduce target ATK by 25% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 25 }
      ]
    }
  },
  deserter_captain: {
    id: 'deserter_captain',
    name: 'Deserter Captain',
    stats: { hp: 200, atk: 50, def: 28, spd: 13 },
    skills: [
      {
        name: 'Rally Bandits',
        description: 'Increase all allies ATK by 30% for 2 turns',
        cooldown: 4,
        noDamage: true,
        effects: [
          { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 30 }
        ]
      },
      {
        name: 'Execution',
        description: 'Deal 200% ATK damage to lowest HP hero',
        cooldown: 4
      }
    ]
  },
  fort_specter: {
    id: 'fort_specter',
    name: 'Fort Specter',
    stats: { hp: 130, atk: 45, def: 18, spd: 16 },
    skill: {
      name: 'Haunting Wail',
      description: 'Deal 100% ATK damage to all heroes and reduce SPD by 20% for 2 turns',
      cooldown: 4,
      targetType: 'all_heroes',
      effects: [
        { type: EffectType.SPD_DOWN, target: 'all_heroes', duration: 2, value: 20 }
      ]
    }
  }
}
