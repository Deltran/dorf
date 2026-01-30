import { EffectType } from '../../statusEffects.js'

export const lady_moonwhisper = {
  id: 'lady_moonwhisper',
  name: 'Lady Moonwhisper',
  rarity: 4,
  classId: 'cleric',
  baseStats: { hp: 95, atk: 25, def: 30, spd: 11, mp: 80 },
  skills: [
    {
      name: 'Lunar Blessing',
      description: 'Heal one ally for 150% ATK and grant them 20% DEF boost for 2 turns',
      mpCost: 22,
      skillUnlockLevel: 1,
      targetType: 'ally',
      effects: [
        { type: EffectType.DEF_UP, target: 'ally', duration: 2, value: 20 }
      ]
    },
    {
      name: 'Moonveil',
      description: 'Shroud an ally in moonlight, making them untargetable for 2 turns',
      mpCost: 20,
      skillUnlockLevel: 1,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.UNTARGETABLE, target: 'ally', duration: 2 }
      ]
    },
    {
      name: 'Purifying Light',
      description: 'Remove all stat debuffs from one ally',
      mpCost: 18,
      skillUnlockLevel: 3,
      targetType: 'ally',
      noDamage: true,
      cleanse: 'debuffs'
    },
    {
      name: 'Silver Mist',
      description: 'Grant ally 40% evasion for 3 turns. Missed attacks restore 5 MP to Lady Moonwhisper.',
      mpCost: 18,
      skillUnlockLevel: 6,
      targetType: 'ally',
      noDamage: true,
      effects: [
        {
          type: EffectType.EVASION,
          target: 'ally',
          duration: 3,
          value: 40,
          onEvade: { restoreMp: 5, to: 'caster' }
        }
      ]
    },
    {
      name: "Full Moon's Embrace",
      description: 'Revive a fallen ally at 40% HP with untargetable for 1 turn.',
      mpCost: 35,
      skillUnlockLevel: 12,
      targetType: 'dead_ally',
      noDamage: true,
      revive: { hpPercent: 40 },
      effects: [
        { type: EffectType.UNTARGETABLE, target: 'ally', duration: 1 }
      ]
    }
  ]
}
