# Stack System & Swift Arrow Redesign

**Date:** 2026-02-04

## Overview

Two linked changes: a new counter-based stack system for status effects, and a redesigned Swift Arrow kit that uses it.

## Part 1: Stack System

### Problem

The current effect system has two modes:
- `stackable: false` — Re-applying refreshes duration and takes the higher value. Self-applied and ally-applied stat buffs coexist separately.
- `stackable: true` — Each application pushes a new independent effect instance (Poison, Burn, Reluctance).

Neither supports "one effect, counter goes up" — a single icon with an incrementing stack count where effective value = `value × stacks`.

### Design

Add `maxStacks` to effect definitions. When present, `applyEffect` increments a `stacks` field on the existing effect instead of replacing or duplicating.

**Effect definition:**
```js
[EffectType.SWIFT_MOMENTUM]: {
  name: 'Momentum',
  icon: '🏹',
  color: '#f59e0b',
  isBuff: true,
  stat: 'spd',
  maxStacks: 6
}
```

**`applyEffect` behavior with `maxStacks`:**
1. No existing effect → create with `stacks: 1`
2. Existing, under max → increment `stacks`, refresh duration
3. Existing, at max → refresh duration only

```js
if (definition.maxStacks) {
  const existingIndex = unit.statusEffects.findIndex(e => e.type === effectType)

  if (existingIndex !== -1) {
    unit.statusEffects = unit.statusEffects.map((effect, index) => {
      if (index === existingIndex) {
        const newStacks = Math.min(effect.stacks + 1, definition.maxStacks)
        return {
          ...effect,
          stacks: newStacks,
          duration: Math.max(effect.duration, duration)
        }
      }
      return effect
    })
  } else {
    newEffect.stacks = 1
    unit.statusEffects = [...unit.statusEffects, newEffect]
  }
  return
}
```

**Stat calculation change in `getEffectiveStat`:**
```js
// Current:
modifier += effect.value
// Becomes:
modifier += effect.value * (effect.stacks || 1)
```

Same for `_down` effects. Fallback of `1` means zero migration — existing effects have no `stacks` property and behave identically.

**New helper:**
```js
function getStacks(unit, effectType) {
  const effect = (unit.statusEffects || []).find(e => e.type === effectType)
  return effect?.stacks || 0
}
```

**Cleanses/dispels:** Remove the entire effect (all stacks gone at once). A future equipment item could modify this to strip one stack instead.

### Skill Stack Conditions

Skills can reference stack counts via a `stackBonus` property:

```js
{
  name: 'Split the Wind',
  damagePercent: 55,
  stackBonus: {
    effectType: 'swift_momentum',
    minStacks: 2,
    damagePercent: 80  // replaces base damagePercent when condition met
  }
}
```

Battle execution checks `getStacks(hero, stackBonus.effectType) >= stackBonus.minStacks` before damage calculation. Per-stack linear scaling (e.g., "+X% per stack") is not included — will be added when a hero needs it.

### UI Display

Effects with `maxStacks` always show a numeric badge, even at 1 stack:

```
🏹 1    🏹 3    🏹 6
```

No "×" prefix. Effects without `maxStacks` render as today (icon only, no badge).

---

## Part 2: Swift Arrow Redesign — "Tempo Archer"

### Identity

The Skirmisher. Controls battle pace with debuffs that enable the whole team, then cashes in with precision strikes. The only Ranger who makes teammates better.

**Epithet:** The Skirmisher

### Stats (unchanged)

HP: 90, ATK: 42, DEF: 22, SPD: 20, MP: 55

### New Effect Type

```js
SWIFT_MOMENTUM: 'swift_momentum'
// maxStacks: 6, stat: 'spd', value: 5 per stack (max +30% SPD)
```

### Skills

**Skill 1 (Lv1): Quick Shot**
- Target: enemy
- Damage: 90% ATK
- Effect: Applies SPD_DOWN (15%, 2 turns) to target

**Skill 2 (Lv1): Pinning Volley**
- Target: all_enemies
- Damage: 60% ATK
- Effect: Applies DEF_DOWN (15%, 2 turns) to any enemy already suffering a debuff

**Skill 3 (Lv3): Nimble Reposition**
- Target: self
- Damage: none (noDamage: true)
- Effect: Grants DEBUFF_IMMUNE (1 turn) + SPD_UP (20%, 2 turns)
- Purpose: Proactive Focus protection — prevents debuffs from stripping Focus next turn

**Skill 4 (Lv6): Precision Strike**
- Target: enemy
- Damage: 140% ATK
- Conditional: If target has DEF_DOWN, ignore additional 20% DEF. If target has SPD_DOWN, deal 180% ATK instead.

**Skill 5 (Lv12): Flurry of Arrows**
- Target: enemy (3-hit)
- Damage: 55% ATK per hit
- Effect: Each hit against a debuffed target grants Swift Arrow +1 stack of SWIFT_MOMENTUM (permanent duration, +5% SPD per stack, max 6 stacks = +30%)

### Kit Loop

Quick Shot (SPD_DOWN) → Pinning Volley (DEF_DOWN spreads to debuffed enemies) → Precision Strike (exploits both debuffs for 180% ATK through shredded armor). Nimble Reposition before dangerous turns. Flurry for sustained fights where permanent SPD matters.

### Focus Interaction

All skills require Focus (standard Ranger behavior). Nimble Reposition's DEBUFF_IMMUNE prevents debuffs from stripping Focus but doesn't protect against raw damage. If Focus breaks, she basic attacks until an ally buffs her back — standard Ranger tension.

### Roster Fit

| Ranger | Archetype | Niche |
|--------|-----------|-------|
| Korrath (5★) | Death Hunter | MARKED, execute chains, turn resets |
| Shinobi Jin (4★) | Shadow Assassin | STEALTH, evasion stacking, poison |
| **Swift Arrow (4★)** | **Tempo Skirmisher** | **Team-enabling debuffs, momentum stacking** |
| Fennick (2★) | Dodge Tank | TAUNT + evasion |
| Street Urchin (1★) | Scrappy Survivor | Extra turns, UNTARGETABLE |
