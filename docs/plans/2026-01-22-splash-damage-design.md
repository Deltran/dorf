# Splash Damage Design

## Overview

Add a reusable splash damage mechanic that allows skills to hit random secondary targets after hitting a primary target. Initial use case is fixing Shasha's Fireball skill.

## Skill Properties

Two new optional properties for any skill:

```js
{
  name: 'Fireball',
  damagePercent: 130,        // Primary target damage
  splashCount: 2,            // Max random other enemies to hit
  splashDamagePercent: 50,   // Damage % ATK to splash targets
  targetType: 'enemy',
  mpCost: 20,
  skillUnlockLevel: 1
}
```

**Behavior:**
- Player selects a primary target as normal
- Primary target takes `damagePercent` damage
- Up to `splashCount` other alive enemies are randomly selected
- Each splash target takes `splashDamagePercent` damage
- If fewer enemies remain than `splashCount`, hit what's available
- If only the primary target exists, no splash occurs

**Updated Fireball description:**
> "Deal 130% ATK damage to one enemy and 50% ATK damage to up to 2 other random enemies."

## Implementation

### battle.js Changes

Add splash logic in `executePlayerAction`, inside the `case 'enemy'` block, after primary damage:

```js
// After primary damage calculation and applyDamage call...

if (skill.splashCount && skill.splashDamagePercent) {
  const otherEnemies = aliveEnemies.value.filter(e => e.id !== target.id)
  const splashTargets = pickRandom(otherEnemies, skill.splashCount)
  const splashMultiplier = skill.splashDamagePercent / 100

  for (const splashTarget of splashTargets) {
    const splashDef = getEffectiveStat(splashTarget, 'def')
    const splashDamage = calculateDamage(effectiveAtk, splashMultiplier, splashDef)
    applyDamage(splashTarget, splashDamage, 'attack', hero)
    emitCombatEffect(splashTarget.id, 'enemy', 'damage', splashDamage)
  }
}
```

### Helper Function

```js
function pickRandom(array, count) {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
```

Splash damage goes through normal `applyDamage`, respecting shields, damage reduction, evasion, etc.

### heroTemplates.js Changes

Update Fireball skill:

```js
{
  name: 'Fireball',
  description: 'Deal 130% ATK damage to one enemy and 50% ATK damage to up to 2 other random enemies.',
  mpCost: 20,
  skillUnlockLevel: 1,
  targetType: 'enemy',
  damagePercent: 130,
  splashCount: 2,
  splashDamagePercent: 50
}
```

## Testing

New file: `src/stores/__tests__/battle-splash.test.js`

**Test scenarios:**
1. Splash hits 2 enemies when 3+ enemies alive
2. Splash hits 1 when only 2 enemies exist
3. No splash when only 1 enemy remains
4. Splash damage respects target defense
5. Splash targets can evade

## Future Use Cases

This system can be reused for:
- Chain lightning (could chain to more targets)
- Piercing arrows
- Cleave attacks
- Any skill needing primary + secondary target damage
