# Dead Code Heroes Audit

Three heroes have entire custom combat systems that were designed and partially implemented in `battle.js` as helper functions, but **never wired into the main skill execution flow**. The helpers exist, tests call them directly, but the actual `switch(targetType)` at line 3283 never routes to them. All three heroes are effectively broken in live play.

---

## Copper Jack (4-star Berserker)

**File:** `src/data/heroes/4star/copper_jack.js`

### The System: Coin Flips

Copper Jack's kit revolves around coin flips that determine skill outcomes (heads = good, tails = bad/risky).

### Helper Functions (battle.js ~5654-5744)

- `flipCoin()` — returns 'heads' or 'tails'
- `calculateCoinFlipSkillDamage(hero, skill)` — reads `skill.headsEffect`/`skill.tailsEffect` to determine damage
- Additional coin-flip-aware logic for buff/debuff application

### What Actually Happens In Battle

The `switch(targetType)` at line 3283 enters the standard `enemy`/`ally`/`self` paths. None of these paths check for `isFlipSkill`, `headsEffect`, `tailsEffect`, or call any coin flip helpers.

**Result:** All 10+ coin-flip-specific properties are dead code. Skills either do nothing (if `noDamage: true`) or deal flat damage ignoring the entire coin mechanic.

### Issue Count: ~10

| Property | Status |
|----------|--------|
| `isFlipSkill` | Never checked |
| `headsEffect` | Never read |
| `tailsEffect` | Never read |
| `flipCount` | Never read |
| `onAllHeads` | Never read |
| `onAllTails` | Never read |
| `flipCoin()` | Exists but never called from main flow |
| `calculateCoinFlipSkillDamage()` | Exists but never called from main flow |
| Passive coin-flip triggers | Not wired |
| Rage interactions with flip outcomes | Not wired |

---

## Bones McCready (3-star Druid)

**File:** `src/data/heroes/3star/bones_mccready.js`

### The System: Dice Rolls

Bones McCready's kit uses dice rolls (2d6) with tier-based outcomes. Roll total determines heal amount, effect strength, or triggers special mechanics on doubles.

### Helper Functions (battle.js ~1626-1680)

- `executeDiceHeal(caster, target, skill)` — rolls 2d6, maps to `diceTiers` for heal amount
- `executeDiceEffect(caster, target, skill)` — rolls 2d6, applies effects based on tier, checks `onDoubles`
- `checkLoadedDice(unit)` — checks for LOADED_DICE buff to modify rolls

### What Actually Happens In Battle

The `switch(targetType)` at line 3283 enters standard paths. No path checks `isDiceHeal` or `isDiceEffect`.

**Per-skill breakdown:**

| Skill | Expected | Actual |
|-------|----------|--------|
| **Roll the Bones** (`isDiceHeal`, ally, noDamage) | Roll 2d6, heal based on tier | Does nothing — ally+noDamage path has no effects to apply |
| **Snake Eyes** (`isDiceEffect`, enemy, noDamage) | Roll 2d6, poison with doubles bonus | Applies flat poison via normal effect path; doubles mechanic ignored |
| **Fortune Teller** (self, `fortune_teller` effect) | Apply fortune_teller buff for dice manipulation | Silently fails — `fortune_teller` not in effectDefinitions |
| **Loaded Bones** (ally, noDamage, `healPercent: 80`) | Heal ally + apply LOADED_DICE buff | LOADED_DICE buff applies, but heal is gated out by `noDamage: true` |
| **Bones Never Lie** (`isDiceHeal`, all_allies, noDamage) | Roll 2d6, heal all allies by tier | Falls through to description-based heal parsing, always heals at 40% ATK |

### Additional Bug

Even if `executeDiceEffect`/`executeDiceHeal` were called, they push raw effect objects without the `definition` property, which would cause `TypeError` crashes at line 856 (`effect.definition.isDot`).

### Issue Count: 5

| Property/System | Status |
|----------------|--------|
| `isDiceHeal` flag | Never checked in main flow |
| `isDiceEffect` flag | Never checked in main flow |
| `diceTiers` | Never read in main flow |
| `onDoubles` | Never read in main flow |
| `fortune_teller` effect type | Not in effectDefinitions |
| `healPercent` + `noDamage` conflict | healPercent gated out |
| `executeDiceHeal()` | Exists, never called, would crash if called |
| `executeDiceEffect()` | Exists, never called, would crash if called |
| `LOADED_DICE` buff | Can be applied but never consumed |

---

## Fortuna Inversus (5-star Bard)

**File:** `src/data/heroes/5star/fortuna_inversus.js`

### The System: Fortune/Misfortune Duality

Fortuna's kit revolves around a fortune/misfortune mechanic — skills can buff allies or debuff enemies with random effects, and her Finale swaps all buffs/debuffs on the field.

### Helper Functions (battle.js ~5827)

- `executeFortunaFinale()` — exists but is never called from the Bard Finale auto-trigger system

### What Actually Happens In Battle

The Bard Finale auto-trigger system at turn start dispatches based on the `finale.target` property. Fortuna's Finale uses properties and effect types the dispatch doesn't recognize.

**Per-issue breakdown:**

| Property | Status |
|----------|--------|
| `randomDebuff` | Not implemented — engine has no random debuff picker |
| `bonusChance` | Not read — intended to modify random outcome odds |
| `selfDamagePercent` | Name mismatch — engine reads `selfDamagePercentMaxHp` |
| `removeRandomBuff` | Not implemented — engine can't strip a random buff |
| `atkStackPerBuff` | Not implemented — intended to gain ATK stacks per buff removed |
| `stackDuration` | Not read |
| `debuffBonusPercent` | Not implemented — bonus damage based on target debuff count |
| `extendDebuffs` | Not implemented — engine can't extend existing debuff durations |
| `executeFortunaFinale()` | Exists but never called from Finale dispatch |
| Finale dispatch for Fortuna | Not wired — Bard Finale system doesn't route to Fortuna's handler |

### Issue Count: 6+ (CRITICAL)

Almost the entire kit is non-functional. Only basic Bard mechanics work (Verse building, skill rotation restriction). The fortune/misfortune identity is completely absent from live play.

---

## Common Pattern

All three heroes share the same failure mode:

1. **Hero data** defines novel skill properties for a unique combat system
2. **Helper functions** were written in battle.js to process those properties
3. **The main execution path** (`switch(targetType)` at line 3283) was never updated to check for the hero-specific flags and route to those helpers
4. **Tests** call the helpers directly, so they pass — but integration is never tested

### Root Cause Theory

These heroes were likely designed and partially implemented in a batch. The helper functions were written and tested in isolation, but the final wiring step — adding routing checks before/within the `switch(targetType)` — was never completed. The existing tests validate the helpers work in isolation but don't test the actual player-facing flow.

### What Would Be Needed To Fix

For each hero, the fix requires:
1. Adding a check before or within the `switch(targetType)` for the hero-specific flag (`isFlipSkill`, `isDiceHeal`/`isDiceEffect`, Fortuna's finale dispatch)
2. Routing to the existing helper functions
3. Fixing any bugs in the helpers themselves (e.g., Bones' missing `definition` property)
4. Adding any missing effect types to `statusEffects.js` (e.g., `fortune_teller`)
5. Writing integration tests that exercise the full player-facing flow, not just the helpers

Alternatively, these heroes could be redesigned to use properties the engine already understands, trading design uniqueness for reliability.
