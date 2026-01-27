# Penny Whistler Kit Rework — Debuff Payoff

## Problem

Penny Whistler (1-star Bard) deals zero damage across her entire kit. Every skill is `noDamage: true` with -10% to -20% debuffs. Her Finale (Discordant Shriek) is also pure debuff (-10% ATK/-10% DEF). The debuff values are too small to justify a party slot, and she has no payoff moment for the debuffs she applies.

## Solution

Rework Street Racket into a single-target damage skill that scales with debuffs on the target. Reshuffle skill unlock order. Add damage to the Finale.

## New Skill Layout

| Lv | Skill | Target | Effect |
|----|-------|--------|--------|
| 1 | Jarring Whistle | Single enemy | -15% DEF, 2 turns (unchanged) |
| 3 | **Street Racket** (reworked) | Single enemy | 90% ATK damage + 25% bonus ATK per debuff on target |
| 6 | Distracting Jingle (moved from lv 3) | Single enemy | -15% SPD, 2 turns (unchanged) |
| 12 | Ear-Splitting Crescendo | Single enemy | -20% SPD, 2 turns. Stun if debuffed (unchanged) |

### Finale — Discordant Shriek (reworked)

- Target: All enemies
- Damage: 80% ATK
- Effect: -15% ATK to all enemies, 2 turns (was -10% ATK/-10% DEF)

## Gameplay Loop

Penny follows a 3-turn cycle via the Bard Verse system (can't repeat consecutive skills, Finale at 3/3 Verses):

1. **Turn 1:** Jarring Whistle (DEF down on priority target) — 1 Verse
2. **Turn 2:** Street Racket (hit the debuffed target for bonus damage) — 2 Verses
3. **Turn 3:** Distracting Jingle or Crescendo (add debuff / stun) — 3 Verses
4. **Turn 4:** Discordant Shriek auto-fires (AoE damage + ATK down, free action), then normal turn starts new cycle

The no-repeat rule naturally alternates setup and payoff. She can't spam Street Racket — she has to debuff between hits, which feeds the bonus.

### Key Decisions Per Turn

- Debuff the Street Racket target for more payoff, or spread debuffs to other enemies?
- Use Crescendo for the stun lock, or keep stacking debuffs for Street Racket damage?
- Which target gets the focused punishment?

## Street Racket Math

Base ATK: 15 (1-star).

| Debuffs on target | Effective multiplier | Raw damage |
|-------------------|---------------------|------------|
| 0 | 90% | 13.5 |
| 1 | 115% | 17.25 |
| 2 | 140% | 21 |
| 3 | 165% | 24.75 |

Meh on its own, solid payoff with setup. Appropriate for 1-star.

## Implementation

### 1. heroTemplates.js — Update Penny's template

Rework Street Racket — remove `noDamage`, add `damagePercent` and new `bonusDamagePerDebuff` property:

```js
{
  name: 'Street Racket',
  description: 'A cacophony of noise that hits harder against weakened foes',
  skillUnlockLevel: 3,
  targetType: 'enemy',
  damagePercent: 90,
  bonusDamagePerDebuff: 25
}
```

Move Distracting Jingle to `skillUnlockLevel: 6`.

Rework Finale — add damage, update debuff:

```js
finale: {
  name: 'Discordant Shriek',
  description: 'A piercing wave of sound that damages and weakens all enemies.',
  target: 'all_enemies',
  damagePercent: 80,
  effects: [
    { type: EffectType.ATK_DOWN, duration: 2, value: 15 }
  ]
}
```

### 2. battle.js — Support bonusDamagePerDebuff

In the damage calculation path, when a skill has `bonusDamagePerDebuff`:
1. Count active debuff-type status effects on the target
2. Add `bonusDamagePerDebuff * debuffCount` to the skill's effective `damagePercent`

Needs a helper to identify debuff effect types (ATK_DOWN, DEF_DOWN, SPD_DOWN, POISON, BURN, STUN, etc.).

### 3. battle.js — Finale damage support

Verify the Finale execution path supports `damagePercent`. If Finales currently only apply effects, extend the path to calculate and apply damage when `damagePercent` is present.
