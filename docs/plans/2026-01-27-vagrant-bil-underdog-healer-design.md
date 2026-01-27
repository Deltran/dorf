# Vagrant Bil — Underdog Healer Rework

## Problem

Vagrant Bil (1-star Cleric) applies -10% to things and heals for tiny amounts. Every skill is a small stat modification with no mechanical hook, no decision point, no moment. His thematic identity (beggar monk, nobody, outcast) has no mechanical expression.

## Solution

Desperation scaling. Bil's skills scale with how badly the fight is going. Heals scale with the target's missing HP. Debuffs scale with the party's average missing HP. He's weak when things are fine, invaluable when things are dire.

## Scaling Formulas

**Heals** scale with target's missing HP%:
- `healPercent = base + desperationHealBonus * targetMissingHP%`
- Single-target (Minor Heal): target is one ally
- AoE (Beggar's Prayer): uses party average missing HP%

**Debuffs** scale with party average missing HP%:
- `effectValue = base + floor(desperationBonus * partyAvgMissingHP%)`
- Same formula for all debuff skills

## Skill Details

### Minor Heal (Lv 1, single ally)
- Formula: `(40 + 80 * targetMissingHP%) % ATK`
- Target full HP (0% missing): 40% ATK heal (weak)
- Target 50% missing: 80% ATK (same as current)
- Target 90% missing: 112% ATK (strong emergency heal)
- MP cost: 10 (unchanged)

### Worthless Words (Lv 3, single enemy)
- Debuff: ATK_DOWN for 2 turns
- Value: `10 + floor(15 * partyAvgMissingHP%)`
- Party healthy: -10% ATK (same as current)
- Party 50% avg missing: -17% ATK
- Party 75% avg missing: -21% ATK
- MP cost: 8 (unchanged)

### Nobody's Curse (Lv 6, single enemy)
- Debuff: DEF_DOWN for 3 turns
- Value: `10 + floor(15 * partyAvgMissingHP%)`
- Same scaling curve as Worthless Words
- MP cost: 8 (unchanged)

### Beggar's Prayer (Lv 12, all allies + all enemies)
- Heal: `(25 + 50 * partyAvgMissingHP%) % ATK` to all allies
- Debuff: ATK_DOWN to all enemies, value `10 + floor(15 * partyAvgMissingHP%)`
- Party healthy: 25% ATK heal, -10% ATK debuff (weak)
- Party 50% avg missing: 50% ATK heal (same as current), -17% ATK
- Party 75% avg missing: 62.5% ATK heal, -21% ATK
- MP cost: 16 (unchanged)

## Crossover Point

All skills break even with current values at ~50% party/target missing HP. Below 50%, Bil is weaker than his current kit. Above 50%, he's stronger. He's useless when winning, invaluable when losing.

## Implementation

### New skill properties

```js
// Heal skills
healPercent: 40,            // Base heal percent (replaces description parsing)
desperationHealBonus: 80,   // Bonus scaled by missing HP

// Effect property
desperationBonus: 15        // Added to effect.value, scaled by party avg missing HP
```

### battle.js changes

1. **Ally heal path** (~line 2125): Check for `desperationHealBonus`, calculate heal using target's missing HP%.
2. **All-allies heal path** (~line 2562): Same check, use party average missing HP%.
3. **resolveEffectValue** (~line 858): Check for `desperationBonus` on effect, scale by party average missing HP%.
