# Calisus Skills Design

## Overview

Calisus is a 2-star Mage with a lightning theme specializing in chain damage with one crowd control skill.

**Design Goals:**
- Lightning-themed identity distinct from fire (Shasha) and utility (Knarly Zeek)
- Primary mechanic: chain/bounce damage rewarding multi-enemy fights
- Secondary mechanic: single stun for clutch utility
- 4 skills at unlock levels 1, 3, 6, 12 (standard for 1-2 star heroes)

## Hero Stats

```js
{
  id: 'apprentice_mage',
  name: 'Calisus',
  rarity: 2,
  classId: 'mage',
  baseStats: { hp: 55, atk: 28, def: 10, spd: 11, mp: 50 }
}
```

## Skills

### Spark (Level 1)
- **Cost:** 10 MP
- **Target:** Single enemy
- **Effect:** Deal 120% ATK damage to one enemy

Basic single-target damage spell. Efficient MP cost, reliable damage.

### Chain Lightning (Level 3)
- **Cost:** 16 MP
- **Target:** Single enemy (chains automatically)
- **Effect:** Deal 70% ATK damage to target, then bounce to up to 2 additional enemies for 50% ATK each

Signature skill. Maximum 170% ATK total against 3+ enemies. Against fewer targets, Spark is more MP-efficient.

### Jolt (Level 6)
- **Cost:** 18 MP
- **Target:** Single enemy
- **Effect:** Deal 70% ATK damage and stun the target for 1 turn

Lower damage than Spark but provides crucial crowd control. Use to interrupt dangerous enemies or buy time.

### Tempest (Level 12)
- **Cost:** 26 MP
- **Target:** All enemies
- **Effect:** Deal 130% ATK damage to all enemies

Capstone ability. High MP cost but strong AoE burst. No additional effects - pure storm damage.

## Balance Comparison

| Skill | Calisus | Comparable |
|-------|---------|------------|
| Spark (120%) | Single target | Higher than Sorju/Zeek 100% baseline - fits damage mage role |
| Chain Lightning (170% max) | Multi-target | Below Darl's 120% splits when hitting fewer than 3 |
| Jolt (70% + stun) | CC utility | Trades damage for control |
| Tempest (130% AoE) | Capstone | Above Darl's Burndown (110%) but no DoT |

## Implementation Notes

### Chain Lightning Bounce Logic
- Primary target takes 70% ATK damage
- Up to 2 additional enemies are selected (random or nearest)
- Each bounce deals 50% ATK damage
- If fewer than 3 enemies exist, only available targets are hit
- Cannot bounce to same target twice

### Stun Effect
- Uses existing status effect system
- Stunned unit skips their next turn
- Visual: lightning crackling effect on stunned enemy
