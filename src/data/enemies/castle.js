import { EffectType } from '../statusEffects.js'

export const enemies = {
  coralsworn_knight: {
    id: 'coralsworn_knight',
    name: 'Coralsworn Knight',
    lore: 'Clad in living coral that grows thicker with each battle, these fanatics serve the throne with zealous, unquestioning violence.',
    stats: { hp: 340, atk: 80, def: 48, spd: 13 },
    skill: {
      name: 'Marked for Death',
      description: 'Deal 140% ATK and mark target (+40% beast damage)',
      cooldown: 3,
      damagePercent: 140,
      effects: [
        { type: EffectType.MARKED, target: 'hero', duration: 2, value: 40, beastOnly: true }
      ]
    }
  },
  kings_hound: {
    id: 'kings_hound',
    name: "King's Hound",
    lore: 'Monstrous war-beasts bred in the castle depths, they are unleashed on marked prey and do not stop until flesh is torn.',
    stats: { hp: 280, atk: 88, def: 32, spd: 22 },
    isBeast: true,
    skill: {
      name: 'Savage Pursuit',
      description: '180% to marked (120% otherwise). Double attack below 30% HP.',
      cooldown: 3,
      damagePercent: 120,
      bonusToDebuffed: { type: 'marked', bonus: 60 },
      doubleAttackThreshold: 30
    }
  },
  castle_sentinel: {
    id: 'castle_sentinel',
    name: 'Castle Sentinel',
    lore: 'Massive and immovable, it binds intruders in chains of living coral at the cost of its own mobility.',
    stats: { hp: 420, atk: 65, def: 60, spd: 5 },
    skill: {
      name: 'Coral Chains',
      description: 'Stun target 1 turn. Self-stun 1 turn.',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1 },
        { type: EffectType.STUN, target: 'self', duration: 1 }
      ]
    }
  },
  royal_caster: {
    id: 'royal_caster',
    name: 'Royal Caster',
    lore: 'Chosen from the brightest minds of the deep court, they amplify the king\'s will into devastating arcane mandates.',
    stats: { hp: 250, atk: 82, def: 30, spd: 15 },
    skill: {
      name: "King's Mandate",
      description: 'All allies +20% ATK/SPD for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 20 },
        { type: EffectType.SPD_UP, target: 'all_allies', duration: 2, value: 20 }
      ]
    }
  },
  lord_coralhart: {
    id: 'lord_coralhart',
    name: 'Lord Coralhart',
    lore: 'A warlord fused with the reef itself, he summons knights from the coral and fights harder with every fallen vassal.',
    stats: { hp: 2400, atk: 95, def: 60, spd: 14 },
    imageSize: 160,
    skills: [
      {
        name: 'For the Crown!',
        description: 'Summon 2 Coralsworn Knights. If present, +50% ATK instead.',
        cooldown: 3,
        summon: { enemyId: 'coralsworn_knight', count: 2 },
        altIfSummonsPresent: { buffSelf: { type: EffectType.ATK_UP, value: 50, duration: 2 } }
      },
      {
        name: 'Oathbound Strike',
        description: '220% ATK. +30% per fallen ally (including summons).',
        cooldown: 4,
        damagePercent: 220,
        bonusPerDeadAlly: 30
      }
    ]
  }
}
