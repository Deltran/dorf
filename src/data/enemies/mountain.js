import { EffectType } from '../statusEffects.js'

export const enemies = {
  harpy: {
    id: 'harpy',
    name: 'Harpy',
    lore: 'Half-woman, half-raptor, and wholly vicious. Their talons can open a man from throat to navel in a single dive.',
    stats: { hp: 80, atk: 28, def: 12, spd: 18 },
    skill: {
      name: 'Diving Talon',
      description: 'Deal 150% ATK damage, +50% if target HP is below 50%. Gain 40% Evasion for 1 turn.',
      cooldown: 3,
      effects: [
        { type: EffectType.EVASION, target: 'self', duration: 1, value: 40 }
      ]
    }
  },
  frost_elemental: {
    id: 'frost_elemental',
    name: 'Frost Elemental',
    lore: 'Born from the mountain\'s bitter cold, it moves with glacial patience and kills with a touch that freezes blood in the vein.',
    stats: { hp: 100, atk: 35, def: 25, spd: 10 },
    skill: {
      name: 'Glacial Grip',
      description: 'Deal 130% ATK damage. Reduce SPD by 30% and DEF by 20% for 2 turns.',
      cooldown: 4,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 30 },
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 20 }
      ]
    }
  },
  storm_elemental: {
    id: 'storm_elemental',
    name: 'Storm Elemental',
    lore: 'A living thunderhead crackling with fury. It does not speak; it simply strikes, and the air smells of ozone and ruin.',
    stats: { hp: 90, atk: 38, def: 18, spd: 16 },
    skill: {
      name: 'Chain Lightning',
      description: 'Deal 100% ATK damage to all heroes',
      cooldown: 3,
      targetType: 'all_heroes'
    }
  },
  thunder_hawk: {
    id: 'thunder_hawk',
    name: 'Thunder Hawk',
    lore: 'Its wingspan blots out the sun. Lightning dances along its feathers as it plummets toward its prey.',
    stats: { hp: 70, atk: 35, def: 10, spd: 22 },
    skill: {
      name: 'Lightning Dive',
      description: 'Deal 180% ATK damage and reduce target SPD by 40% for 1 turn',
      cooldown: 3,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 1, value: 40 }
      ]
    }
  },
  mountain_giant: {
    id: 'mountain_giant',
    name: 'Mountain Giant',
    lore: 'Ancient as the peaks themselves, it wakes only when trespassers disturb its stony slumber. By then, it is far too late to run.',
    stats: { hp: 300, atk: 45, def: 30, spd: 3 },
    skill: {
      name: 'Landslide',
      description: 'Deal 200% ATK damage and stun target for 1 turn.',
      cooldown: 5,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
      ]
    }
  },
  harpy_chick: {
    id: 'harpy_chick',
    name: 'Harpy Chick',
    lore: 'All beak and fury, these fledglings peck and screech with a malice that promises worse things to come.',
    stats: { hp: 30, atk: 15, def: 3, spd: 16 }
  },
  nesting_roc: {
    id: 'nesting_roc',
    name: 'Nesting Roc',
    lore: 'A mother roc is the most dangerous thing on the mountain. Threaten her brood and she\'ll bury you in stone.',
    stats: { hp: 120, atk: 15, def: 20, spd: 8 },
    skill: {
      name: 'Brood Call',
      description: 'Summon a Harpy Chick and gain +20% DEF for 2 turns.',
      cooldown: 3,
      noDamage: true,
      summon: { templateId: 'harpy_chick', count: 1 },
      effects: [
        { type: EffectType.DEF_UP, target: 'self', duration: 2, value: 20 }
      ],
      fallbackSkill: {
        name: 'Protective Roost',
        description: 'Hunker down. Gain +20% DEF for 2 turns.',
        noDamage: true,
        effects: [
          { type: EffectType.DEF_UP, target: 'self', duration: 2, value: 20 }
        ]
      }
    }
  }
}
