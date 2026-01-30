import { EffectType } from '../statusEffects.js'

export const enemies = {
  wind_spirit: {
    id: 'wind_spirit',
    name: 'Wind Spirit',
    stats: { hp: 85, atk: 40, def: 15, spd: 24 },
    skill: {
      name: 'Gale Force',
      description: 'Deal 130% ATK damage and reduce target SPD by 25% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 25 }
      ]
    }
  },
  ice_wraith: {
    id: 'ice_wraith',
    name: 'Ice Wraith',
    stats: { hp: 95, atk: 42, def: 18, spd: 17 },
    skill: {
      name: 'Frozen Touch',
      description: 'Deal 140% ATK damage and reduce target ATK by 30% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  ancient_guardian: {
    id: 'ancient_guardian',
    name: 'Ancient Guardian',
    stats: { hp: 200, atk: 38, def: 40, spd: 6 },
    skill: {
      name: 'Sentinel Strike',
      description: 'Deal 150% ATK damage and increase own DEF by 30% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_UP, target: 'self', duration: 2, value: 30 }
      ]
    }
  },
  summit_giant: {
    id: 'summit_giant',
    name: 'Summit Giant',
    stats: { hp: 350, atk: 50, def: 35, spd: 4 },
    skill: {
      name: 'Avalanche',
      description: 'Deal 120% ATK damage to all heroes and reduce SPD by 20% for 2 turns',
      cooldown: 5,
      targetType: 'all_heroes',
      effects: [
        { type: EffectType.SPD_DOWN, target: 'all_heroes', duration: 2, value: 20 }
      ]
    }
  },
  ancient_titan: {
    id: 'ancient_titan',
    name: 'Ancient Titan',
    stats: { hp: 600, atk: 58, def: 45, spd: 8 },
    imageSize: 160,
    skills: [
      {
        name: 'Primordial Storm',
        description: 'Deal 130% ATK damage to all heroes and reduce ATK by 25% for 2 turns',
        cooldown: 5,
        targetType: 'all_heroes',
        effects: [
          { type: EffectType.ATK_DOWN, target: 'all_heroes', duration: 2, value: 25 }
        ]
      },
      {
        name: 'Titan\'s Wrath',
        description: 'Deal 200% ATK damage to lowest HP hero',
        cooldown: 4
      }
    ]
  }
}
