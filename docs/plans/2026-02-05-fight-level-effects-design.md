# Fight-Level Effects — Encounter Modifier System

## Overview

Fight-Level Effects are modifiers that belong to the **encounter**, not to individual units. They represent environmental conditions, arena rules, curses, boons, or any modifier that applies because of *where you're fighting*, not *who you are*.

They are **not** status effects. They cannot be cleansed, dispelled, or removed by abilities. They persist for the duration of the encounter (or longer, depending on the source system).

## Design Principles

### Outcome-Based, Not Stat-Based

Fight-Level Effects modify **outcomes** (damage dealt, damage taken, healing done) not **stats** (ATK, DEF, SPD). This keeps them cleanly separated from the status effect system, which already handles stat modification via `getEffectiveStat`.

| Approach | Example | Why |
|----------|---------|-----|
| Outcome-based (correct) | "Deal 15% more damage" | Applied as multiplier after all stat calcs and interception |
| Outcome-based (correct) | "10% damage reduction" | Applied in damage pipeline as its own step |
| Outcome-based (correct) | "Heal 5% max HP on kill" | Triggered at hook, uses final game state |
| Stat-based (avoid) | "+15% ATK" | Collides with ATK_UP, ambiguous stacking |
| Stat-based (avoid) | "+10% DEF" | Collides with DEF_UP, ambiguous stacking |

**Exception:** Effects that create new behaviors (burn on hit, shield at wave start) don't modify stats either — they trigger actions at hooks. These are fine.

### Separate from Status Effects

Fight-Level Effects and status effects are two different systems:

| | Status Effects | Fight-Level Effects |
|---|---|---|
| Lives on | Individual unit | The encounter |
| Duration | Ticks down per turn | Entire encounter (or source-defined) |
| Removable | Cleanse, dispel, expiry | No — persists unconditionally |
| Stacking | Per-effect rules (maxStacks, refresh) | Additive within same type, then applied once |
| Applied by | Skills, abilities | Source system (quest node, Maw boon, etc.) |
| Processed in | `getEffectiveStat`, `applyEffect` | Hook callbacks in battle flow |

## Scopes

Each effect targets one of three scopes:

| Scope | Affects | Use case |
|-------|---------|----------|
| `heroes` | Player's party only | Boons, friendly arena effects |
| `enemies` | Enemies only | Curses, hostile arena effects |
| `all` | All combatants | Environmental conditions |

The scope is checked at each hook — when an effect fires, only units matching the scope are affected.

### Scope Resolution

`matchesScope` identifies heroes vs enemies by checking `!!unit.instanceId` — heroes have instanceIds (assigned by the heroes store on creation), enemies do not.

```js
function matchesScope(scope, unit) {
  if (scope === 'all') return true
  const isHero = !!unit.instanceId
  if (scope === 'heroes') return isHero
  if (scope === 'enemies') return !isHero
  return false
}
```

### Effect Type Perspective

Each effect type has an **inherent perspective** that determines which unit's scope is checked:

| Effect type | Perspective | Scope checks against | Example |
|-------------|-------------|---------------------|---------|
| `damage_multiplier` | Attacker | The unit dealing damage | `scope: 'heroes'` = heroes deal more damage |
| `damage_reduction` | Target | The unit receiving damage | `scope: 'heroes'` = heroes take less damage |
| `apply_status` | Varies by hook | Depends on context | `on_post_damage` checks attacker |
| `heal_percent_max_hp` | Unit being healed | The unit receiving healing | `scope: 'heroes'` = heroes heal |

This means a `scope: 'enemies'` + `damage_multiplier` effect makes *enemies* deal more damage (not heroes dealing more to enemies). The perspective is baked into the type, not configurable.

**Enemy-sourced effects work the same way.** An enemy ability that curses the battlefield with `{ scope: 'heroes', effect: { type: 'damage_reduction', value: -15 } }` makes heroes take 15% *more* damage (negative reduction = amplification).

## Hook System

Effects activate at specific moments in the battle flow. Each hook is a point where fight-level effects are checked and applied.

### Hook Definitions

| Hook | When it fires | Location in battle flow | Example effect |
|------|--------------|------------------------|----------------|
| `on_battle_start` | Once when battle begins | After `initBattle`, before first turn | "All heroes gain Shield (10% max HP)" |
| `on_turn_start` | Start of a unit's turn | In `processStartOfTurnEffects`, after existing effect processing | "Enemies take 3% max HP damage per turn" |
| `on_pre_damage` | After damage is calculated, before interception chain | In `applyDamage`, before Evasion check (~line 1561) | "Heroes deal 15% more damage" |
| `on_post_damage` | After interception chain, after HP reduction, before death checks | In `applyDamage`, after HP reduction (~line 1783), before death check (~line 1870) | "On hit, 5% chance to apply burn" |
| `on_kill` | When a unit's HP reaches 0 | In `applyDamage`, after death check | "Heal 5% max HP on kill" |
| `on_wave_start` | Between waves (Maw-specific, but generalizable) | Before battle init for next wave | "Restore 5% MP at wave start" |
| `on_resource_spend` | When MP/Rage/Essence is consumed | In skill execution, after resource deduction | "Spending MP burns the caster for 3% HP" |

**Removed:** `on_damage_taken` — folded into `on_pre_damage`. The `damage_reduction` effect type inherently checks from the target's perspective, so a separate target-perspective hook is unnecessary.

### Where Effects Apply in the Damage Pipeline

The existing `applyDamage` interception chain is:

```
1. Evasion check
2. Divine Sacrifice redirect
3. Guardian Link split
4. Guarded By redirect
5. Damage Reduction (status effect)
6. thick_hide passive
7. Equipment ally_damage_reduction
8. Shield absorption
9. Marked amplification
10. Normal HP damage
```

Fight-Level Effects **bracket** the chain at two points:

```
→ on_pre_damage (FLE damage_multiplier + damage_reduction applied here)
  1. Evasion check
  2. Divine Sacrifice redirect
  3. Guardian Link split
  4. Guarded By redirect
  5. Damage Reduction (status effect)
  6. thick_hide passive
  7. Equipment ally_damage_reduction
  8. Shield absorption
  9. Marked amplification
  10. Normal HP damage
→ on_post_damage (FLE reactive effects fire here)
  11. Death checks
```

This avoids threading fight-level logic through the interception chain itself. The chain is untouched — effects bracket it.

### Interaction with Existing DR

FLE `damage_reduction` at `on_pre_damage` and the chain's own DR mechanisms (status effect, thick_hide, equipment) stack **multiplicatively across layers**:

```
Raw damage: 1000
  → FLE damage_reduction (20%):     1000 × 0.80 = 800
    → Status effect DR (50%):         800 × 0.50 = 400
    → thick_hide passive (15%):       400 × 0.85 = 340
    → Equipment ally_DR (10%):        340 × 0.90 = 306
```

Each layer caps independently — FLE caps at 80%, the existing chain has its own rules. Multiplicative stacking across layers means total DR can never reach 100%.

**Note:** FLE DR also reduces damage that feeds into `DAMAGE_STORE` (Judgment's Echo), since damage_store accumulates from the post-chain number. A boon giving 20% FLE DR effectively weakens damage-store builds by the same proportion. This is an intentional consequence of the bracketing approach.

## Effect Data Shape

```js
{
  id: 'searing_ground',
  name: 'Searing Ground',
  description: 'All combatants take 2% max HP fire damage at the start of their turn.',
  scope: 'all',              // 'heroes' | 'enemies' | 'all'
  hook: 'on_turn_start',     // When this effect fires
  effect: {
    type: 'damage_percent_max_hp',
    value: 2
  }
}
```

### Effect Types

| Type | Parameters | Description |
|------|-----------|-------------|
| `damage_multiplier` | `value` (percent) | Multiply outgoing damage: 15 = +15% |
| `damage_reduction` | `value` (percent) | Reduce incoming damage: 10 = -10%. Negative values = amplification. |
| `damage_percent_max_hp` | `value` (percent) | Deal damage as % of target's max HP |
| `heal_percent_max_hp` | `value` (percent) | Heal as % of unit's max HP |
| `heal_percent_damage` | `value` (percent) | Heal for % of damage dealt (lifesteal) |
| `apply_status` | `statusType`, `duration`, `value`, `chance` | Apply a status effect (e.g., burn) |
| `grant_shield` | `value` (% max HP) | Grant shield HP |
| `grant_resource` | `resource`, `value` | Grant MP/Rage/Essence/etc |
| `visual` | `animation` | Visual-only (screen shake, flash) |

This is an extensible list — new types can be added as needed without changing the hook system.

## Integration with battle.js

### Minimal Touch Points

The goal is to integrate with minimal changes to existing code:

1. **New ref:** `fightLevelEffects` — array of active effects for the current encounter
2. **New function:** `processFightLevelEffects(hook, context)` — iterates active effects matching the hook, filters by scope, applies each effect
3. **Two insertion points in `applyDamage`:** One call before the interception chain (`on_pre_damage` at ~line 1561), one after (`on_post_damage` at ~line 1783, before death checks at ~line 1870)
4. **One insertion point in turn processing:** Call at start of turn (`on_turn_start`)
5. **One insertion point in skill execution:** Call on resource spend (`on_resource_spend`)

### Core Processor

The `processFightLevelEffects` function receives a context object with the relevant units, damage values, etc. It returns modified values where applicable (e.g., `on_pre_damage` returns adjusted damage).

```js
function processFightLevelEffects(hook, context) {
  let result = { ...context }

  for (const fle of fightLevelEffects.value) {
    if (fle.hook !== hook) continue
    if (!matchesScope(fle.scope, context.unit)) continue

    result = applyFightLevelEffect(fle, result)
  }

  return result
}
```

For `on_pre_damage`, the processor handles both perspectives in a single pass:

```js
// on_pre_damage processing
function processPreDamage(attacker, target, damage) {
  let multiplierSum = 0
  let reductionSum = 0

  for (const fle of fightLevelEffects.value) {
    if (fle.hook !== 'on_pre_damage') continue

    if (fle.effect.type === 'damage_multiplier' && matchesScope(fle.scope, attacker)) {
      multiplierSum += fle.effect.value
    }
    if (fle.effect.type === 'damage_reduction' && matchesScope(fle.scope, target)) {
      reductionSum += fle.effect.value
    }
  }

  reductionSum = Math.min(reductionSum, 80) // Cap at 80%
  return Math.round(damage * (1 + multiplierSum / 100) * (1 - reductionSum / 100))
}
```

### Setting Effects

Source systems set fight-level effects before or during battle:

```js
// From a source system (quest node, Maw, etc.)
battleStore.setFightLevelEffects([
  { id: 'burning_forest', scope: 'all', hook: 'on_turn_start', effect: { type: 'damage_percent_max_hp', value: 2 } },
  { id: 'home_advantage', scope: 'heroes', hook: 'on_pre_damage', effect: { type: 'damage_multiplier', value: 10 } }
])
```

Effects are cleared on `endBattle()` alongside other battle state.

### Adding Effects Mid-Battle

For systems like The Maw where boons are added between waves:

```js
battleStore.addFightLevelEffect({
  id: 'iron_skin',
  scope: 'heroes',
  hook: 'on_pre_damage',
  effect: { type: 'damage_reduction', value: 10 }
})
```

New effects stack with existing ones additively within their type.

### Source System Persistence

The battle store does **not** persist fight-level effects across encounters. `endBattle()` clears them unconditionally.

Source systems that need boons to accumulate across multiple encounters (e.g., The Maw) are responsible for:

1. Maintaining their own list of accumulated boons
2. Re-applying them after each `initBattle()` via `setFightLevelEffects()`
3. Clearing their own list when the run ends

```
Wave 3 ends → endBattle() → all FLEs cleared
Player drafts boon → mawStore.activeBoons.push(newBoon)
Wave 4 starts → initBattle() → mawStore re-applies boons
  → battleStore.setFightLevelEffects(mawStore.activeBoons)
```

This keeps the battle store stateless regarding boon lifecycle.

## Stacking Rules

When multiple effects of the same type fire at the same hook, values are summed **additively within type**, then applied as a single operation.

### `on_pre_damage` Stacking

At `on_pre_damage`, all matching effects are collected in one pass, then applied:

1. Sum all `damage_multiplier` values matching the **attacker's** scope
2. Sum all `damage_reduction` values matching the **target's** scope, cap at 80%
3. Apply: `damage = damage * (1 + multiplierSum/100) * (1 - reductionSum/100)`

**Order:** Multiplier applies first, then reduction. A +30% multiplier and 20% reduction on 1000 damage = `1000 * 1.30 * 0.80 = 1040`.

### All Effect Types

| Type | Stacking rule | Cap | Example |
|------|--------------|-----|---------|
| `damage_multiplier` | Additive sum, applied as one multiplier | None | Two +15% = +30% total |
| `damage_reduction` | Additive sum, capped | 80% max | Two 10% = 20% reduction |
| `damage_percent_max_hp` | Additive sum | None | Two 2% = 4% max HP damage |
| `heal_percent_max_hp` | Additive sum | None | Two 3% = 6% heal |
| `heal_percent_damage` | Additive sum | None | Two 10% = 20% lifesteal |
| `apply_status` | Each rolls independently | None | Two "5% burn" = two separate rolls |
| `grant_shield` | Additive sum | None | Two 5% = 10% max HP shield |
| `grant_resource` | Additive sum | None | Two +5 MP = +10 MP |
| `visual` | All fire independently | None | Shake + flash both happen |

## Composed Examples

### Resource-Spend Curse

```js
{
  id: 'mana_burn_curse',
  name: 'Mana Burn',
  description: 'Spending MP burns the caster for 3% max HP.',
  scope: 'heroes',
  hook: 'on_resource_spend',
  effect: {
    type: 'damage_percent_max_hp',
    value: 3
  }
}
```

Context passed to processor:
```js
processFightLevelEffects('on_resource_spend', {
  unit: castingHero,
  resourceType: 'mp',
  amount: 20
})
```

### Enemy Damage Amplification

```js
{
  id: 'bloodlust_arena',
  name: 'Bloodlust Arena',
  description: 'Enemies deal 20% more damage.',
  scope: 'enemies',
  hook: 'on_pre_damage',
  effect: {
    type: 'damage_multiplier',
    value: 20
  }
}
```

Scope checks the **attacker** (because `damage_multiplier` perspective = attacker). If the attacker is an enemy, the +20% applies.

### Stacked Boons (Maw example)

After drafting three boons across waves:

```js
[
  { id: 'sharp_edge_1', scope: 'heroes', hook: 'on_pre_damage', effect: { type: 'damage_multiplier', value: 10 } },
  { id: 'iron_skin_1', scope: 'heroes', hook: 'on_pre_damage', effect: { type: 'damage_reduction', value: 15 } },
  { id: 'sharp_edge_2', scope: 'heroes', hook: 'on_pre_damage', effect: { type: 'damage_multiplier', value: 10 } }
]
```

At `on_pre_damage` with hero attacking for 500 raw damage:
- `multiplierSum` = 10 + 10 = 20 (both sharp_edge effects match hero attacker)
- `reductionSum` = 0 (iron_skin checks target, attacker is a hero but target is enemy)
- Result: `500 * 1.20 = 600`

If an enemy attacks a hero for 500:
- `multiplierSum` = 0 (sharp_edge checks attacker, attacker is enemy, scope is `heroes`)
- `reductionSum` = 15 (iron_skin checks target, target is hero, scope matches)
- Result: `500 * 1.00 * 0.85 = 425`

## UI Indicators (Phase 2)

Active fight-level effects display as a **compact banner strip** above the turn tracker on BattleScreen:

- Small pill badges, one per active effect
- Each pill shows abbreviated name + scope icon (sword for `heroes`, skull for `enemies`, globe for `all`)
- Tappable to show tooltip with full description
- Visually distinct from status effects: muted/environmental styling (darker tones, ground/weather feel) vs. bright status badges
- No duration indicator needed — effects last the entire encounter

## Source Systems (Consumers)

Fight-Level Effects are a general system. Known and potential consumers:

| Source | How it uses effects | When effects are set |
|--------|-------------------|---------------------|
| **The Maw** | Boons drafted between waves | Maw store accumulates boons, re-applies via `setFightLevelEffects` after each `initBattle` |
| **Quest nodes** | Environmental modifiers on specific nodes | Set via `setFightLevelEffects` at battle init |
| **Genus Loci** | Arena conditions for boss fights | Set at battle init, could unlock at power level thresholds |
| **Colosseum** | Weekly modifiers for bout variety | Set at battle init, rotated weekly |
| **Enemy abilities** | Enemies that curse the battlefield | Added mid-battle via `addFightLevelEffect` from enemy skill |

Each source system manages its own effect definitions and persistence. The battle engine just processes whatever effects are active.

## What This System Does NOT Do

- **Modify stats directly** — use status effects for ATK_UP, DEF_DOWN, etc.
- **Replace status effects** — the two systems coexist
- **Interact with cleanse/dispel** — fight-level effects are unconditional
- **Persist beyond the encounter** — cleared on `endBattle()` (source systems like The Maw re-apply them on next wave init)
- **Thread through the interception chain** — effects bracket the chain, never modify its internal logic

## Implementation Scope

**Phase 1 (Minimum viable):**
- `fightLevelEffects` ref in battle store
- `setFightLevelEffects`, `addFightLevelEffect`, clear on `endBattle`
- `processFightLevelEffects` with scope filtering and perspective-aware matching
- `on_pre_damage` hook in `applyDamage` (~line 1561, before evasion)
- `on_post_damage` hook in `applyDamage` (~line 1783, after HP reduction, before death checks)
- `on_turn_start` hook in turn processing
- Effect types: `damage_multiplier`, `damage_reduction`, `apply_status`, `heal_percent_max_hp`

**Phase 2 (Extended):**
- `on_kill`, `on_battle_start`, `on_wave_start`, `on_resource_spend` hooks
- Effect types: `grant_shield`, `grant_resource`, `heal_percent_damage`, `visual`
- UI banner strip showing active fight-level effects on BattleScreen

**Phase 3 (Content):**
- Quest node environmental effects
- Genus Loci arena conditions
- Colosseum weekly modifiers
