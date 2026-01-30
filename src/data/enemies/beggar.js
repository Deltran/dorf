import { EffectType } from '../statusEffects.js'

export const enemies = {
  plague_bearer: {
    id: 'plague_bearer',
    name: 'Plague Bearer',
    stats: { hp: 240, atk: 58, def: 30, spd: 11 },
    skill: {
      name: 'Spreading Sickness',
      description: 'Plague target + adjacent (5% max HP/turn, 3 turns)',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.POISON, target: 'hero_and_adjacent', duration: 3, value: 5, isPlague: true }
      ]
    }
  },
  desperate_vagrant: {
    id: 'desperate_vagrant',
    name: 'Desperate Vagrant',
    stats: { hp: 180, atk: 65, def: 22, spd: 15 },
    skill: {
      name: 'Nothing to Lose',
      description: 'On death, deal 80% ATK to random hero',
      cooldown: 0,
      isPassive: true,
      onDeath: { damagePercent: 80, targetType: 'random_hero' }
    }
  },
  slum_enforcer: {
    id: 'slum_enforcer',
    name: 'Slum Enforcer',
    stats: { hp: 320, atk: 62, def: 40, spd: 8 },
    skill: {
      name: 'Shakedown',
      description: 'Deal 130% ATK and steal target shield',
      cooldown: 4,
      damagePercent: 130,
      stealShield: true
    }
  },
  reef_rat_swarm: {
    id: 'reef_rat_swarm',
    name: 'Reef Rat Swarm',
    stats: { hp: 160, atk: 50, def: 15, spd: 20 },
    skill: {
      name: 'Gnawing Frenzy',
      description: '4x40% ATK hits. Each hit on Plagued extends duration +1',
      cooldown: 4,
      multiHit: 4,
      damagePercent: 40,
      extendDebuff: { type: 'poison', turns: 1 }
    }
  },
  the_blightmother: {
    id: 'the_blightmother',
    name: 'The Blightmother',
    stats: { hp: 2000, atk: 78, def: 42, spd: 12 },
    imageSize: 160,
    skills: [
      {
        name: 'Epidemic',
        description: 'Plague ALL heroes (5% max HP/turn, 3 turns). Heal self 10% per infected.',
        cooldown: 3,
        noDamage: true,
        targetType: 'all_heroes',
        effects: [
          { type: EffectType.POISON, target: 'all_heroes', duration: 3, value: 5, isPlague: true }
        ],
        healPerTarget: 10
      },
      {
        name: "Mercy's End",
        description: '180% ATK. +50% and reset duration if target Plagued.',
        cooldown: 4,
        damagePercent: 180,
        bonusToDebuffed: { type: 'poison', bonus: 50, resetDuration: true }
      }
    ]
  }
}
