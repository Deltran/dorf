# Knight Valor System Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace MP with a Valor mechanic for Knight class heroes.

**Architecture:** Valor is a 0-100 gauge with thresholds at 25/50/75/100. Knights build Valor through passive accumulation and protective actions. Skills can require minimum Valor and have values that scale per threshold.

**Tech Stack:** Vue 3, Pinia stores, existing battle system

---

## Core Mechanics

### What Valor Is
- A 0-100 gauge tracked per Knight hero
- Threshold-based: 25 / 50 / 75 / 100
- Starts at 0 at the beginning of each battle
- Resets each battle (does not persist across battles in a quest)
- Not spent when using skills - just checked against requirements
- Basic attack always available regardless of Valor

### The Fantasy
Knights inspire their allies and grow more powerful the longer they keep the team alive. A Knight who holds the line unlocks increasingly powerful abilities. Their power curve is predictable - the longer the fight, the stronger they become.

### Comparison to Other Resources

| Resource | Class | Structure | Spent on Use? |
|----------|-------|-----------|---------------|
| MP | Most classes | Pool (0-max) | Yes |
| Focus | Ranger | Boolean | Consumed on skill use |
| Rage | Berserker | 0-100 gauge | Yes |
| Valor | Knight | 0-100 thresholds | No - just checked |

---

## Gaining Valor

### Passive Gain (Round End)
| Trigger | Amount |
|---------|--------|
| Base passive | +5 per round |
| Per living ally | +5 each |
| Below 50% HP | +10 |

### On-Action Gain
| Trigger | Amount |
|---------|--------|
| Using a defensive skill | +5 immediately |

A skill is defensive if it has `defensive: true` in its definition.

### Example Rounds

**Round with 3 allies, Knight uses taunt, above 50% HP:**
- Uses taunt: +5 (defensive skill)
- Round ends: +5 (passive) + 15 (3 allies) = +20
- Total: +25 Valor

**Round with 2 allies, Knight below 50% HP, basic attacks:**
- Round ends: +5 (passive) + 10 (2 allies) + 10 (low HP) = +25 Valor

### Typical Progression
- 25 Valor: Round 1-2
- 50 Valor: Round 2-3
- 75 Valor: Round 3-4
- 100 Valor: Round 4-6

---

## Losing Valor

Valor does not decrease during battle. Once earned, it stays.

**Battle Reset:**
- Valor resets to 0 at the start of each new battle
- Knights must rebuild each fight

**What Does NOT Reduce Valor:**
- Using skills
- Taking damage
- Ally deaths
- Debuffs
- Knight death (if revived, keeps current Valor)

---

## Skill Valor Requirements & Scaling

### Valor Requirement
Skills can require a minimum Valor threshold to be usable:

```js
{
  name: 'Rallying Cry',
  valorRequired: 50,  // Must have 50+ Valor to use
  // ...
}
```

### Valor Scaling
Skill values can define overrides at each threshold:

```js
{
  name: 'Shield Bash',
  damage: { base: 20, at25: 25, at50: 30, at75: 40, at100: 50 },
  stunChance: { base: 10, at50: 25, at100: 50 },
  // ...
}
```

### Resolution Logic
The system uses the highest threshold the Knight has reached:
- 0-24 Valor: Uses `base` values
- 25-49 Valor: Uses `at25` if defined, else `base`
- 50-74 Valor: Uses `at50` if defined, else falls back to lower tier
- 75-99 Valor: Uses `at75` if defined, else falls back
- 100 Valor: Uses `at100` if defined, else falls back

### Defensive Skill Tag
Skills marked `defensive: true` grant +5 Valor when used:

```js
{
  name: 'Iron Guard',
  type: 'buff',
  defensive: true,  // Using this skill grants +5 Valor
  // ...
}
```

### What Can Scale
- Damage values
- Healing amounts
- Buff/debuff durations
- Effect chances (stun, taunt duration, etc.)
- Shield absorption amounts

---

## UI Changes

### Battle Screen Hero Cards
- Replace MP bar with Valor bar for Knights
- Color: Blue/silver gradient (noble/stalwart theme)
- Show threshold markers at 25/50/75 on the bar
- Display current Valor number (e.g., "67/100")

### Threshold Indicator
- Visual feedback when crossing a threshold (brief flash or glow)
- Optional: Show tiers as pips that fill in
- Example: ◇ ◇ ◇ ◇ at 0 → ◆ ◇ ◇ ◇ at 25 → ◆ ◆ ◇ ◇ at 50

### Action Buttons
- Skills with `valorRequired` show the requirement (e.g., "50 Valor")
- Disabled state when Valor is below requirement
- Optionally show current scaled values

### Skill Tooltips
- Show current scaled values based on Valor tier
- Optionally show values at next threshold

### Outside of Battle
- No Valor display (resets each battle anyway)
- Hero detail screen shows skills with base values and scaling info

---

## Technical Implementation

### Class Definition (`src/data/classes.js`)
- Add `resourceType: 'valor'` to Knight class
- Set `resourceName: 'Valor'` for display

### Battle State (`src/stores/battle.js`)

**Hero initialization in `initBattle()`:**
- For Knights, initialize `currentValor: 0`
- Always starts at 0 (no persistence)

**New helpers:**
- `isKnight(hero)` - Check if hero's class uses Valor
- `gainValor(heroInstanceId, amount)` - Add Valor, clamp to 100
- `getValorTier(hero)` - Returns current tier (0, 25, 50, 75, or 100)
- `resolveValorScaling(skill, valorTier)` - Returns scaled skill values

**Round end processing:**
- After all actions resolve, before next round:
- +5 passive to all Knights
- +5 per living ally to all Knights
- +10 to Knights below 50% HP

**On defensive skill use:**
- +5 Valor immediately when Knight uses a skill with `defensive: true`

### Hero Templates (`src/data/heroTemplates.js`)
- Knight skills can use `valorRequired: X`
- Knight skills can use `defensive: true`
- Skill values use scaling object: `{ base: X, at25: Y, at50: Z, ... }`

---

## Edge Cases

### Multiple Knights in party
- Each Knight tracks their own Valor independently
- Living ally count includes other Knights

### Below 50% HP bonus
- +10 bonus applies once per round end (not cumulative)
- Checked at round end, not when crossing threshold mid-round

### Multiple defensive skills in one turn
- Each use grants +5 Valor separately

### Skill scaling value fallback
- If a tier isn't defined, use the highest defined tier below current
- Example: `{ base: 10, at50: 20 }` at 75 Valor → uses 20 (at50 value)

### Death and revival
- If Knight dies and is revived, Valor stays at whatever it was
- Valor only resets at battle start

### No allies (solo Knight)
- Living ally count is 0, so no ally bonus
- Still gets +5 passive and low HP bonus if applicable

---

## Files to Modify

1. `src/data/classes.js` - Add resourceType to Knight
2. `src/stores/battle.js` - Valor tracking, gains, tier resolution
3. `src/data/heroTemplates.js` - Update Knight skills with Valor properties
4. `src/screens/BattleScreen.vue` - Skill availability, Valor gain triggers
5. `src/components/HeroCard.vue` - Valor bar display
6. `src/components/StatBar.vue` - Valor color variant with threshold markers
