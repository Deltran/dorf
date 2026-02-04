import { EffectType } from '../statusEffects.js'

export const enemies = {
  goblin_scout: {
    id: 'goblin_scout',
    name: 'Goblin Scout',
    lore: 'Quick-footed and cunning, these runts range far ahead of the warband, marking prey with crude claw-signs on trees.',
    stats: { hp: 50, atk: 15, def: 5, spd: 12 },
    skill: {
      name: 'Quick Stab',
      description: 'Deal 120% ATK damage',
      cooldown: 2
    }
  },
  goblin_warrior: {
    id: 'goblin_warrior',
    name: 'Goblin Warrior',
    lore: 'Scarred veterans of a hundred petty raids, they fight with a feral discipline that belies their wretched origins.',
    stats: { hp: 70, atk: 18, def: 10, spd: 9 },
    skill: {
      name: 'Savage Swing',
      description: 'Deal 130% ATK damage',
      cooldown: 3
    }
  },
  goblin_thrower: {
    id: 'goblin_thrower',
    name: 'Goblin Thrower',
    lore: 'Too cowardly for the front line, they hurl jagged stones from the shadows with surprising and spiteful accuracy.',
    stats: { hp: 55, atk: 16, def: 7, spd: 20 },
    skill: {
      name: 'Rock Toss',
      description: 'Deal 110% ATK damage',
      cooldown: 2
    }
  },
  goblin_runt: {
    id: 'goblin_runt',
    name: 'Goblin Runt',
    lore: 'Barely armed and barely willing, these wretches were shoved to the front by something meaner than them.',
    stats: { hp: 30, atk: 10, def: 3, spd: 8 }
  },
  goblin_shaman: {
    id: 'goblin_shaman',
    name: 'Goblin Shaman',
    lore: 'Their war-paint is mixed with blood and grave dirt. The chants they mutter are older than any goblin tongue.',
    stats: { hp: 60, atk: 12, def: 6, spd: 11 },
    skill: {
      name: 'Spite Totem',
      description: 'Heal all allies for 15% of max HP and grant REGEN for 2 turns',
      cooldown: 4,
      noDamage: true,
      healAllAllies: 15,
      effects: [
        { type: EffectType.REGEN, target: 'all_allies', duration: 2, value: 5 }
      ]
    }
  },
  goblin_trapper: {
    id: 'goblin_trapper',
    name: 'Goblin Trapper',
    lore: 'They seed the undergrowth with cruel iron teeth and wait in the canopy, giggling as something steps wrong.',
    stats: { hp: 65, atk: 14, def: 12, spd: 10 },
    skill: {
      name: 'Spike Trap',
      description: 'Set up traps that deal 100% ATK damage to attackers for 3 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.THORNS, target: 'self', duration: 3, value: 100 }
      ]
    }
  },
  goblin_bulwark: {
    id: 'goblin_bulwark',
    name: 'Goblin Bulwark',
    lore: 'Lashed-together shields of bone and bark form a crude but stubborn wall. What it lacks in craft, it makes up in spite.',
    stats: { hp: 80, atk: 10, def: 8, spd: 7 },
    skill: {
      name: 'Shield Wall',
      description: 'Increase all other allies DEF by 50% for 3 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.DEF_UP, target: 'all_allies', duration: 3, value: 50, excludeSelf: true }
      ]
    }
  },
  goblin_commander: {
    id: 'goblin_commander',
    name: 'Goblin Commander',
    lore: 'Risen through murder rather than merit, the Commander holds power by keeping every subordinate more afraid of him than of the enemy.',
    stats: { hp: 220, atk: 32, def: 18, spd: 12 },
    imageSize: 140,
    skills: [
      {
        name: 'Press Gang',
        description: 'Call a Goblin Runt to the fight',
        cooldown: 3,
        noDamage: true,
        summon: { templateId: 'goblin_runt', count: 1 },
        effects: [],
        fallbackSkill: {
          name: 'Crack the Whip',
          description: 'Mark a hero for death, increasing damage taken by 25% for 2 turns',
          noDamage: true,
          effects: [
            { type: EffectType.MARKED, target: 'hero', duration: 2, value: 25 }
          ]
        }
      },
      {
        name: 'Commanding Strike',
        description: 'Deal 150% ATK damage and reduce target DEF by 25% for 2 turns',
        cooldown: 3,
        effects: [
          { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 25 }
        ]
      }
    ]
  },
  forest_wolf: {
    id: 'forest_wolf',
    name: 'Forest Wolf',
    lore: 'Lean and hungry, these wolves have learned that travelers bleed easier than deer.',
    stats: { hp: 60, atk: 20, def: 8, spd: 14 },
    skill: {
      name: 'Pounce',
      description: 'Deal 140% ATK damage to the lowest HP hero',
      cooldown: 3
    }
  },
  dire_wolf: {
    id: 'dire_wolf',
    name: 'Dire Wolf',
    lore: 'Twice the size of its lesser kin, with fangs that can shear through chainmail. The old woods breed them wrong.',
    stats: { hp: 90, atk: 25, def: 12, spd: 13 },
    skill: {
      name: 'Rending Bite',
      description: 'Deal 150% ATK damage and reduce target DEF by 20% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 20 }
      ]
    }
  },
  forest_spider: {
    id: 'forest_spider',
    name: 'Forest Spider',
    lore: 'Their webs glisten with paralytic venom. By the time you feel the bite, you\'re already wrapped tight.',
    stats: { hp: 40, atk: 22, def: 5, spd: 16 },
    skill: {
      name: 'Venomous Bite',
      description: 'Deal 100% ATK damage and deal 10 damage at end of turn for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.POISON, target: 'hero', duration: 2, value: 10 }
      ]
    }
  }
}
