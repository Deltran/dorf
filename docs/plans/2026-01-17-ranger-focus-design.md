# Ranger Focus System Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace MP with a Focus mechanic for Ranger class heroes.

**Architecture:** Focus is a boolean state tracked per-hero in battle. Rangers gain/lose Focus through specific triggers rather than spending a resource pool.

**Tech Stack:** Vue 3, Pinia stores, existing battle system

---

## Core Mechanics

### What Focus Is
- Boolean state (have it or don't) tracked per Ranger hero in battle
- Replaces MP entirely - Rangers have no MP bar or MP costs
- Required to use any skill; basic attack always available

### Gaining Focus
| Trigger | Description |
|---------|-------------|
| Battle start | All Rangers begin each battle with Focus (resets per battle in quest) |
| End of turn | If Ranger used basic attack (not a skill), regain Focus |
| Ally beneficial effect | When healed, buffed, or cleansed by an ally's skill |

### Losing Focus
| Trigger | Description |
|---------|-------------|
| Skill used | Immediately after using any skill |
| Debuff received | When targeted by any debuff (stat downs, DoTs, stun, etc.) |
| Damage taken | Any damage: attacks, DoT ticks, thorns, etc. |

### What Does NOT Grant Focus
- Leader skills (passive/automatic effects)
- Only direct ally skill actions grant Focus

---

## Technical Implementation

### Class Definition (`src/data/classes.js`)
- Add `resourceType: 'focus'` to Ranger class
- Set `resourceName: 'Focus'` for display
- Other classes default to `resourceType: 'mp'`

### Battle State (`src/stores/battle.js`)

**Hero initialization in `initBattle()`:**
- Add `hasFocus: true` for Rangers (checked via class resourceType)
- Rangers don't need `currentMp`/`maxMp` tracking
- Focus resets to `true` each battle (not persisted between battles)

**Focus state change hooks:**

| Location | Action |
|----------|--------|
| `initBattle()` | Grant Focus to all Rangers |
| `executePlayerAction()` | Remove Focus after skill use |
| `executePlayerAction()` (end) | Grant Focus if basic attack was used |
| `applyEffect()` | Grant Focus if beneficial effect (heal/buff/cleanse) from ally skill |
| `applyEffect()` | Remove Focus if debuff applied |
| All damage points | Remove Focus when Ranger takes damage |

**Skill availability:**
- For Rangers, check `hero.hasFocus` instead of MP cost
- Return early/disable if no Focus

---

## UI Changes

### Battle Screen Hero Cards
- For Rangers, replace MP bar with Focus indicator
- Focused: Filled/lit indicator (amber/gold color)
- Not Focused: Dimmed/empty indicator
- Same position as MP bar for consistency

### Action Buttons
- Skills check Focus instead of MP for Rangers
- Disabled state when no Focus
- No "not enough MP" message - just unavailable

### Hero Inspect Dialog
- Show Focus state instead of MP bar for Rangers
- "Focused" or "Not Focused" indicator

### StatBar Component
- Option A: Boolean variant (100% or 0%)
- Option B: Conditional rendering for Focus display

---

## Edge Cases

### Multiple effects in one action
- Ranger receives heal AND buff → gains Focus once (boolean)
- Ranger takes damage AND debuff → loses Focus once

### Self-targeting skills
- Ranger uses self-buff → loses Focus (skill) → gains Focus (buff received)
- Net result: keeps Focus - intentional design

### Thorns damage
- Ranger attacks enemy with Thorns → takes damage → loses Focus
- Consistent with "all damage removes Focus"

### Turn order
- Ranger can lose and regain Focus multiple times per round
- Example: loses Focus to debuff → uses basic attack → regains at end of turn

---

## Files to Modify

1. `src/data/classes.js` - Add resourceType to Ranger
2. `src/stores/battle.js` - Focus tracking and state changes
3. `src/screens/BattleScreen.vue` - Skill availability checks, UI display
4. `src/components/HeroCard.vue` - Focus indicator display
5. `src/components/StatBar.vue` - Possibly add Focus variant
