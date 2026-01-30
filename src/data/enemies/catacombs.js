import { EffectType } from '../statusEffects.js'

export const enemies = {
  skeleton_warrior: {
    id: 'skeleton_warrior',
    name: 'Skeleton Warrior',
    stats: { hp: 120, atk: 44, def: 24, spd: 11 },
    skill: {
      name: 'Bone Cleave',
      description: 'Deal 150% ATK damage',
      cooldown: 3
    }
  },
  mummy: {
    id: 'mummy',
    name: 'Mummy',
    stats: { hp: 180, atk: 40, def: 30, spd: 6 },
    skill: {
      name: 'Cursed Wrappings',
      description: 'Deal 120% ATK damage and reduce target ATK and DEF by 20% for 3 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 3, value: 20 },
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 3, value: 20 }
      ]
    }
  },
  tomb_guardian: {
    id: 'tomb_guardian',
    name: 'Tomb Guardian',
    stats: { hp: 240, atk: 45, def: 38, spd: 7 },
    skill: {
      name: 'Ancient Defense',
      description: 'Deal 130% ATK damage and increase all allies DEF by 25% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_UP, target: 'all_allies', duration: 2, value: 25 }
      ]
    }
  },
  tomb_wraith: {
    id: 'tomb_wraith',
    name: 'Tomb Wraith',
    stats: { hp: 140, atk: 52, def: 16, spd: 18 },
    skill: {
      name: 'Soul Drain',
      description: 'Deal 140% ATK damage and heal self for 50% of damage dealt',
      cooldown: 3,
      lifesteal: 50
    }
  },
  necromancer: {
    id: 'necromancer',
    name: 'Necromancer',
    stats: { hp: 130, atk: 48, def: 18, spd: 14 },
    skill: {
      name: 'Dark Ritual',
      description: 'Heal all allies for 25% of max HP and increase ATK by 25% for 2 turns',
      cooldown: 5,
      noDamage: true,
      healAllAllies: 25,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 25 }
      ]
    }
  },
  lich_king: {
    id: 'lich_king',
    name: 'Lich King',
    stats: { hp: 700, atk: 60, def: 40, spd: 12 },
    imageSize: 160,
    skills: [
      {
        name: 'Death Nova',
        description: 'Deal 120% ATK damage to all heroes and deal 25 damage at end of turn for 2 turns',
        cooldown: 4,
        targetType: 'all_heroes',
        effects: [
          { type: EffectType.POISON, target: 'all_heroes', duration: 2, value: 25 }
        ]
      },
      {
        name: 'Soul Harvest',
        description: 'Deal 180% ATK damage and heal self for 100% of damage dealt',
        cooldown: 5,
        lifesteal: 100
      }
    ]
  }
}
