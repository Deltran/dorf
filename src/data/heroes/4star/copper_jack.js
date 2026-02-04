export const copper_jack = {
  id: 'copper_jack',
  name: 'Copper Jack',
  rarity: 4,
  classId: 'berserker',
  baseStats: { hp: 95, atk: 45, def: 20, spd: 14 },
  skills: [
    {
      name: 'Weighted Toss',
      description: 'Deal 120% ATK damage. If coin was flipped this turn, +40% bonus damage regardless of result',
      skillUnlockLevel: 1,
      rageCost: 20,
      targetType: 'enemy',
      damagePercent: 120,
      coinFlipBonus: 40
    },
    {
      name: 'All In',
      description: 'Deal 90% ATK damage twice. Each hit flips independently: Heads doubles, Tails halves',
      skillUnlockLevel: 1,
      rageCost: 35,
      targetType: 'enemy',
      damagePercent: 90,
      multiHit: 2,
      perHitCoinFlip: true,
      headsMultiplier: 2,
      tailsMultiplier: 0.5
    },
    {
      name: "Copper's Curse",
      description: 'Consume all Rage. Gain +8% ATK (stacking, 3 turns) per 10 Rage consumed',
      skillUnlockLevel: 3,
      rageCost: 'all',
      targetType: 'self',
      noDamage: true,
      atkPerRage: 8,
      ragePerStack: 10,
      stackDuration: 3
    },
    {
      name: 'Double Down',
      description: 'Deal 150% ATK damage. If you took self-damage this turn (Tails), deal 250% instead',
      skillUnlockLevel: 6,
      rageCost: 40,
      targetType: 'enemy',
      damagePercent: 150,
      selfDamageBonusPercent: 250
    },
    {
      name: 'Jackpot',
      description: 'Flip 5 coins. Deal 60% ATK per Heads. Per Tails: +15 Rage, +5% ATK (3 turns)',
      skillUnlockLevel: 12,
      rageCost: 50,
      targetType: 'enemy',
      jackpotFlips: 5,
      damagePerHeads: 60,
      ragePerTails: 15,
      atkPerTails: 5,
      atkDuration: 3
    }
  ],
  hasCoinFlip: true,
  coinFlipEffects: {
    heads: { damageMultiplier: 2.5, firstHitOnly: true },
    tails: { selfDamagePercent: 15, rageGain: 25 }
  },
  epithet: 'The Lucky Bastard',
  introQuote: 'Heads I win, tails you lose. House rules.',
  lore: 'Copper Jack won his cursed coin in a dockside card game against a one-eyed witch. The coin always comes back to him, no matter how far he throws it, and every flip feeds his rage like kindling. He\'s tried to lose it a hundred times. Lady Luck won\'t let him.'
}
