# Salia Kit Cleanup Design

Modernize Salia's skill definitions from `damageMultiplier` to `damagePercent`.

## Salia Overview

- **Rarity:** 1-star
- **Class:** Ranger (Focus resource)
- **Role:** DPS (default Ranger role)
- **Fantasy:** Scrappy street urchin — hits hard, takes risks, dodges into the crowd

## Changes

Replace `damageMultiplier` with `damagePercent` on three skills. No mechanical changes.

### Skill 1: Quick Throw (unchanged behavior)

- `damageMultiplier: 0.8` → `damagePercent: 80`
- Keep `grantsExtraTurn: true`

### Skill 2: Desperation (unchanged behavior)

- `damageMultiplier: 1.5` → `damagePercent: 150`
- Keep DEF_DOWN self-debuff

### Skill 3: But Not Out (no change)

- No damage property to fix
- Keep `conditionalSelfBuff` as-is

### Skill 4: In The Crowd (unchanged behavior)

- `damageMultiplier: 1.2` → `damagePercent: 120`
- Keep UNTARGETABLE effect

## Files to Change

| File | Change |
|------|--------|
| `src/data/heroTemplates.js` | Replace `damageMultiplier` with `damagePercent` on 3 Salia skills |
