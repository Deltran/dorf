import { EffectType } from '../../statusEffects.js'

export const ember_witch = {
  id: 'ember_witch',
  name: 'Shasha Ember Witch',
  rarity: 4,
  classId: 'mage',
  baseStats: { hp: 85, atk: 45, def: 20, spd: 14, mp: 70 },
  skills: [
    {
      name: 'Fireball',
      description: 'Deal 130% ATK damage to one enemy and 50% ATK damage to up to 2 other random enemies.',
      mpCost: 20,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 130,
      splashCount: 2,
      splashDamagePercent: 50
    },
    {
      name: 'Flame Shield',
      description: 'Surround yourself with protective flames for 3 turns. Enemies who attack you are burned for 2 turns.',
      mpCost: 18,
      skillUnlockLevel: 1,
      targetType: 'self',
      noDamage: true,
      effects: [
        {
          type: EffectType.FLAME_SHIELD,
          target: 'self',
          duration: 3,
          burnDuration: 2
        }
      ]
    },
    {
      name: 'Ignite',
      description: 'Set an enemy ablaze for 3 turns, dealing 50% ATK per turn.',
      mpCost: 15,
      skillUnlockLevel: 3,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        {
          type: EffectType.BURN,
          target: 'enemy',
          duration: 3,
          atkPercent: 50
        }
      ]
    },
    {
      name: 'Spreading Flames',
      description: 'Deal 80% ATK damage to one enemy. If the target is burning, spread their burn to all other enemies.',
      mpCost: 22,
      skillUnlockLevel: 6,
      targetType: 'enemy',
      spreadBurn: true
    },
    {
      name: 'Conflagration',
      description: 'Consume all burns on all enemies. Deal instant damage equal to the remaining burn damage plus 10% ATK per burn consumed.',
      mpCost: 30,
      skillUnlockLevel: 12,
      targetType: 'all_enemies',
      noDamage: true,
      consumeBurns: true,
      consumeBurnAtkBonus: 10
    }
  ],
  epithet: 'Flame-Touched Prodigy',
  introQuote: "Fire doesn't ask permission. Neither do I."
}
