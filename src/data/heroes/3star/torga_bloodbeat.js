import { EffectType } from '../../statusEffects.js'

export const torga_bloodbeat = {
  id: 'torga_bloodbeat',
  name: 'Torga Bloodbeat',
  rarity: 3,
  classId: 'berserker',
  baseStats: { hp: 85, atk: 35, def: 15, spd: 12 },
  skills: [
    {
      name: 'Rhythm Strike',
      description: 'Deal 100% ATK damage to one enemy. Gain 10 Rage.',
      skillUnlockLevel: 1,
      rageCost: 0,
      targetType: 'enemy',
      damagePercent: 100,
      rageGain: 10
    },
    {
      name: 'Blood Tempo',
      description: 'Sacrifice 15% max HP to gain 30 Rage and +20% ATK for 2 turns.',
      skillUnlockLevel: 1,
      rageCost: 0,
      targetType: 'self',
      noDamage: true,
      selfDamagePercentMaxHp: 15,
      rageGain: 30,
      effects: [
        {
          type: EffectType.ATK_UP,
          target: 'self',
          duration: 2,
          value: 20
        }
      ]
    },
    {
      name: 'Blood Echo',
      description: 'Deal 90% ATK damage to one enemy. Deal +30% bonus damage for each time Blood Tempo was used this battle (max +90%).',
      skillUnlockLevel: 3,
      rageCost: 20,
      targetType: 'enemy',
      damagePercent: 90,
      bonusDamagePerBloodTempo: 30,
      maxBloodTempoBonus: 90
    },
    {
      name: 'Death Knell',
      description: 'Deal 150% ATK damage to one enemy. If target is below 30% HP, deal 250% instead and heal for 20% of damage dealt.',
      skillUnlockLevel: 6,
      rageCost: 40,
      targetType: 'enemy',
      damagePercent: 150,
      executeBonus: { threshold: 30, damagePercent: 250, healSelfPercent: 20 }
    },
    {
      name: 'Finale of Fury',
      description: 'Consume ALL Rage. Deal 50% ATK damage + 2% per Rage consumed to one enemy. If this kills the target, gain 50 Rage.',
      skillUnlockLevel: 12,
      rageCost: 'all',
      targetType: 'enemy',
      baseDamagePercent: 50,
      damagePerRage: 2,
      onKill: { rageGain: 50 }
    }
  ],
  epithet: 'The Rhythm of War',
  introQuote: 'My warband fell silent. I carry their heartbeat now.',
  lore: 'Torga was the drummer of a warband that was ambushed in a mountain pass. She was the sole survivor, and she swore she\'d never let the rhythm die. She fights to the cadence of fallen comrades, each strike a drumbeat, each kill a verse in their unfinished song.'
}
