# Kensin Retaliation Knight Design

**Date:** 2026-01-27

## Problem

Kensin (3★ Knight, "Kensin, Squire") is a redundant copy of Sir Gallan. Both buff DEF, redirect damage, and protect allies. Sir Gallan does it with better numbers and Valor-scaling mechanics. Kensin's one differentiator — Riposte with a DEF comparison condition — undermines itself because tanks have high DEF, so the condition rarely fires against meaningful enemies.

## Solution

Redesign Kensin as the **Retaliation Knight** — the knight who punishes enemies for attacking. Sir Gallan *prevents* damage. Kensin *punishes* it.

### Name Change

"Kensin, Squire" → "Kensin" (the squire title doesn't fit the retaliation identity).

### Stats

Unchanged: `{ hp: 110, atk: 22, def: 35, spd: 8 }`

### Kit

| # | Skill | Unlock | Valor Req | Target | Type |
|---|-------|--------|-----------|--------|------|
| 1 | Stand and Fight | Lv 1 | 25 | self | Taunt 2 turns. At 50: 3 turns. At 75: also 15% DR |
| 2 | Retribution | Lv 1 | 0 | enemy | 100% ATK. At 25: 120%. At 50: 140%. At 75: 160%. At 100: 180% |
| 3 | Reinforce | Lv 3 | 50 | ally | Cleanse ATK/DEF debuffs + heal 10% of DEF. At 75: 15%. At 100: +SPD cleanse |
| 4 | Riposte | Lv 6 | 0 | self | Counter-attack 80% ATK when hit. No DEF check. At 50: 100%. At 75: 3 turns |
| 5 | Judgment of Steel | Lv 12 | 50 | enemy | Consume ALL Valor. 50% ATK + 2% per Valor consumed. 20% DEF debuff 2 turns |

### In-Fight Progression

1. **Early (0 Valor):** Retribution + Riposte — build Valor through combat
2. **At 25 Valor:** Stand and Fight unlocks — taunt draws fire, Valor accelerates
3. **At 50+ Valor:** Reinforce available for clutch support, Retribution hits 140%+
4. **At 100 Valor:** Choose — keep 180% Retribution scaling or cash out with 250% Judgment of Steel

### Knight Archetype Split

| Knight | Rarity | Identity | Verb |
|--------|--------|----------|------|
| Sir Gallan | 4★ | The Wall | Prevents damage — shields, DR, debuff immunity |
| Kensin | 3★ | The Punisher | Punishes damage — retaliates, scales off being hit |
| Sorju | 2★ | The Vanguard | Preempts damage — speed, initiative, strikes first |

### New Code Patterns Required

1. **Riposte without DEF check:** Add `noDefCheck: true` to Riposte effect. Modify battle.js riposte trigger to bypass DEF comparison when flag is set.
2. **Valor consumption:** Add `valorCost: 'all'` skill property. Mirror the existing `rageCost: 'all'` pattern from Shadow King. Add `damagePerValor` for finisher damage scaling.
