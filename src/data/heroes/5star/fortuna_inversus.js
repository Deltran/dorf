import { EffectType } from '../../statusEffects'

export const fortuna_inversus = {
  id: 'fortuna_inversus',
  name: 'Fortuna Inversus',
  rarity: 5,
  classId: 'bard',
  baseStats: { hp: 90, atk: 26, def: 24, spd: 14, mp: 65 },

  leaderSkill: {
    name: 'Fortune Favors the Bold',
    description: 'Allies below 50% HP gain +20% ATK',
    effects: [{
      type: 'passive',
      stat: 'atk',
      value: 20,
      condition: { hpBelow: 50 }
    }]
  },

  finale: {
    name: 'Wheel of Reversal',
    description: 'Swap all swappable buffs and debuffs between allies and enemies. Effects that cannot swap are dispelled instead.',
    isFortuneSwap: true,
    swapPairs: {
      [EffectType.ATK_UP]: EffectType.ATK_DOWN,
      [EffectType.ATK_DOWN]: EffectType.ATK_UP,
      [EffectType.DEF_UP]: EffectType.DEF_DOWN,
      [EffectType.DEF_DOWN]: EffectType.DEF_UP,
      [EffectType.SPD_UP]: EffectType.SPD_DOWN,
      [EffectType.SPD_DOWN]: EffectType.SPD_UP,
      [EffectType.REGEN]: EffectType.POISON,
      [EffectType.POISON]: EffectType.REGEN,
      [EffectType.BURN]: EffectType.REGEN
    },
    dispelList: [
      EffectType.STUN, EffectType.SLEEP, EffectType.SHIELD,
      EffectType.TAUNT, EffectType.UNTARGETABLE,
      EffectType.GUARDIAN_LINK, EffectType.GUARDING, EffectType.DIVINE_SACRIFICE,
      EffectType.DAMAGE_STORE, EffectType.DAMAGE_REDUCTION, EffectType.DEATH_PREVENTION,
      EffectType.MARKED, EffectType.EVASION, EffectType.BLIND,
      EffectType.THORNS, EffectType.RIPOSTE, EffectType.FLAME_SHIELD,
      EffectType.WELL_FED, EffectType.VICIOUS, EffectType.ECHOING,
      EffectType.SHATTERED_TEMPO, EffectType.DEBUFF_IMMUNE, EffectType.SEATED
    ],
    emptyFallback: {
      message: 'The wheel spins... but fate holds steady',
      randomEffect: true,
      options: [
        { type: EffectType.ATK_UP, value: 15, duration: 2 },
        { type: EffectType.ATK_DOWN, value: 15, duration: 2 },
        { type: EffectType.REGEN, value: 25, duration: 2 },
        { type: EffectType.POISON, value: 25, duration: 2 }
      ]
    }
  },

  skills: [
    {
      name: 'Fickle Fortune',
      description: 'Deal 110% ATK damage. 50% chance ATK_DOWN 15%, 50% chance SPD_DOWN 15% (2 turns)',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 110,
      randomDebuff: {
        chance: 1.0,
        options: [
          { type: EffectType.ATK_DOWN, value: 15, duration: 2 },
          { type: EffectType.SPD_DOWN, value: 15, duration: 2 }
        ]
      }
    },
    {
      name: 'Double or Nothing',
      description: 'Grant ally +20% ATK (2 turns). 50% chance to also grant +20% DEF',
      skillUnlockLevel: 1,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.ATK_UP, target: 'ally', duration: 2, value: 20 }
      ],
      bonusChance: {
        chance: 0.5,
        effect: { type: EffectType.DEF_UP, target: 'ally', duration: 2, value: 20 }
      }
    },
    {
      name: 'Loaded Dice',
      description: 'Grant ally 25% Evasion (3 turns). Fortuna takes 10% max HP self-damage',
      skillUnlockLevel: 3,
      targetType: 'ally',
      noDamage: true,
      selfDamagePercent: 10,
      effects: [
        { type: EffectType.EVASION, target: 'ally', duration: 3, value: 25 }
      ]
    },
    {
      name: 'House Always Wins',
      description: 'Remove 1 random buff from each enemy. Fortuna gains +5% ATK (stacking, 3 turns) per buff removed',
      skillUnlockLevel: 6,
      targetType: 'all_enemies',
      noDamage: true,
      removeRandomBuff: 1,
      atkStackPerBuff: 5,
      stackDuration: 3
    },
    {
      name: "Gambler's Ruin",
      description: 'Deal 150% ATK damage. If target has debuffs: 200% ATK and extend debuffs by 1 turn',
      skillUnlockLevel: 12,
      targetType: 'enemy',
      damagePercent: 150,
      debuffBonusPercent: 200,
      extendDebuffs: 1
    }
  ]
}
