import { EffectType } from '../statusEffects.js'

export const enemies = {
  merfolk_warrior: {
    id: 'merfolk_warrior',
    name: 'Merfolk Warrior',
    lore: 'Scaled and silent, they guard the drowned gates with coral-tipped tridents and the cold fury of the deep.',
    stats: { hp: 140, atk: 48, def: 24, spd: 14 },
    skill: {
      name: 'Trident Thrust',
      description: 'Deal 160% ATK damage',
      cooldown: 3
    }
  },
  merfolk_mage: {
    id: 'merfolk_mage',
    name: 'Merfolk Mage',
    lore: 'They weave the tides into weapons, drowning enemies in air with walls of crushing water summoned from nothing.',
    stats: { hp: 120, atk: 52, def: 18, spd: 16 },
    skill: {
      name: 'Tidal Wave',
      description: 'Deal 110% ATK damage to all heroes and reduce SPD by 25% for 2 turns',
      cooldown: 4,
      targetType: 'all_heroes',
      effects: [
        { type: EffectType.SPD_DOWN, target: 'all_heroes', duration: 2, value: 25 }
      ]
    }
  },
  coral_golem: {
    id: 'coral_golem',
    name: 'Coral Golem',
    lore: 'Centuries of reef growth shaped by merfolk sorcery into a lumbering enforcer. Its fists hit like breaking waves.',
    stats: { hp: 260, atk: 45, def: 40, spd: 6 },
    skill: {
      name: 'Reef Crush',
      description: 'Deal 150% ATK damage and reduce target DEF by 30% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  abyssal_lurker: {
    id: 'abyssal_lurker',
    name: 'Abyssal Lurker',
    lore: 'It rises from the crushing dark where no light reaches, dragging the terror of the deep with it.',
    stats: { hp: 170, atk: 55, def: 22, spd: 13 },
    skill: {
      name: 'Deep Terror',
      description: 'Deal 150% ATK damage and reduce target ATK by 40% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 40 }
      ]
    }
  },
  sea_serpent: {
    id: 'sea_serpent',
    name: 'Sea Serpent',
    lore: 'Its coils can crush a galleon\'s hull. In these shallow waters, there is nowhere to flee its constricting embrace.',
    stats: { hp: 200, atk: 50, def: 26, spd: 15 },
    skill: {
      name: 'Crushing Coil',
      description: 'Deal 160% ATK damage and stun target for 1 turn',
      cooldown: 5,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
      ]
    }
  },
  tide_priest: {
    id: 'tide_priest',
    name: 'Tide Priest',
    lore: 'Devoted to the drowned gods, they chant in bubbling tongues and mend their warriors with blessings drawn from the ocean\'s heart.',
    stats: { hp: 140, atk: 46, def: 20, spd: 14 },
    skill: {
      name: 'Ocean\'s Blessing',
      description: 'Heal all allies for 20% of max HP and increase DEF by 25% for 2 turns',
      cooldown: 4,
      noDamage: true,
      healAllAllies: 20,
      effects: [
        { type: EffectType.DEF_UP, target: 'all_allies', duration: 2, value: 25 }
      ]
    }
  },
  kraken: {
    id: 'kraken',
    name: 'Kraken',
    lore: 'The sea\'s oldest nightmare, it drags ships and heroes alike into the black depths with tentacles thick as ancient oaks.',
    stats: { hp: 800, atk: 62, def: 42, spd: 10 },
    imageSize: 180,
    skills: [
      {
        name: 'Tentacle Swarm',
        description: 'Deal 90% ATK damage to all heroes and reduce SPD by 30% for 2 turns',
        cooldown: 4,
        targetType: 'all_heroes',
        effects: [
          { type: EffectType.SPD_DOWN, target: 'all_heroes', duration: 2, value: 30 }
        ]
      },
      {
        name: 'Crushing Depths',
        description: 'Deal 220% ATK damage to one hero and stun for 1 turn',
        cooldown: 5,
        effects: [
          { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
        ]
      }
    ]
  }
}
