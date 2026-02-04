import { EffectType } from '../statusEffects.js'

export const enemies = {
  throne_guardian: {
    id: 'throne_guardian',
    name: 'Throne Guardian',
    lore: 'The last line of defense before the throne, it endures punishment that would shatter lesser constructs without yielding an inch.',
    stats: { hp: 480, atk: 75, def: 65, spd: 8 },
    skill: {
      name: 'Unbreaking Vigil',
      description: 'Taunt all for 2 turns. -25% damage taken.',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.TAUNT, target: 'self', duration: 2 },
        { type: EffectType.DAMAGE_REDUCTION, target: 'self', duration: 2, value: 25 }
      ]
    }
  },
  mind_touched_advisor: {
    id: 'mind_touched_advisor',
    name: 'Mind-Touched Advisor',
    lore: 'Something from the abyss whispers through these courtiers now, unraveling the minds of any who stand against the crown.',
    stats: { hp: 280, atk: 85, def: 35, spd: 14 },
    skill: {
      name: 'Psychic Fray',
      description: 'Target ATK/DEF -30% for 2 turns',
      cooldown: 3,
      noDamage: true,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 30 },
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  fanatical_zealot: {
    id: 'fanatical_zealot',
    name: 'Fanatical Zealot',
    lore: 'Driven mad by devotion, they throw themselves at the enemy in ecstatic fury, caring nothing for their own destruction.',
    stats: { hp: 300, atk: 105, def: 28, spd: 18 },
    skill: {
      name: 'Ecstatic Strike',
      description: '200% to debuffed (130% otherwise). 15% recoil.',
      cooldown: 3,
      damagePercent: 130,
      bonusToDebuffed: { type: 'any', bonus: 70 },
      recoilPercent: 15
    }
  },
  the_corrupted: {
    id: 'the_corrupted',
    name: 'The Corrupted',
    lore: 'Once noble warriors twisted beyond recognition, their dying curse lashes out at whoever delivers the killing blow.',
    stats: { hp: 350, atk: 90, def: 40, spd: 12 },
    skill: {
      name: 'Dying Curse',
      description: 'On death, curse killer (-25% all stats, 3 turns)',
      cooldown: 0,
      isPassive: true,
      onDeath: {
        effects: [
          { type: EffectType.ATK_DOWN, target: 'killer', duration: 3, value: 25 },
          { type: EffectType.DEF_DOWN, target: 'killer', duration: 3, value: 25 },
          { type: EffectType.SPD_DOWN, target: 'killer', duration: 3, value: 25 }
        ]
      }
    }
  },
  king_meridius: {
    id: 'king_meridius',
    name: 'King Meridius the Hollow',
    lore: 'The puppet king, hollowed out by the abyss that controls his strings. His crown weighs heavy with borrowed power and borrowed madness.',
    stats: { hp: 2800, atk: 100, def: 55, spd: 15 },
    imageSize: 180,
    skills: [
      {
        name: "Crown's Burden",
        description: '150% ATK to all heroes. 10% max HP recoil.',
        cooldown: 3,
        damagePercent: 150,
        targetType: 'all_heroes',
        recoilPercentMaxHp: 10
      },
      {
        name: "Puppet's Fury",
        description: '250% ATK to one target.',
        cooldown: 4,
        damagePercent: 250
      }
    ]
  }
}
