# Salia Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update Salia (street_urchin) with 4 skills that unlock at different levels, introducing two new battle mechanics: extra turns and HP-conditional buffs.

**Architecture:** Add `grantsExtraTurn` property to skills and check it after action execution. Add `conditionalSelfBuff` structure with generalized condition evaluator supporting HP percentage checks. Both mechanics integrate into existing battle flow.

**Tech Stack:** Vue 3, Pinia stores, existing status effects system

---

## Task 1: Update Salia's Hero Template

**Files:**
- Modify: `src/data/heroTemplates.js`

**Step 1: Read heroTemplates.js to find street_urchin**

Read the file to locate the current street_urchin definition.

**Step 2: Replace street_urchin's skill with skills array**

Replace the single `skill` property with a `skills` array containing all 4 skills:

```js
street_urchin: {
  id: 'street_urchin',
  name: 'Salia',
  rarity: 1,
  classId: 'ranger',
  baseStats: { hp: 50, atk: 18, def: 8, spd: 14, mp: 30 },
  skills: [
    {
      name: 'Quick Throw',
      description: 'Deal 80% ATK damage to one enemy. Get an extra turn.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damageMultiplier: 0.8,
      grantsExtraTurn: true
    },
    {
      name: 'Desperation',
      description: 'Deal 150% ATK damage to one enemy. Receive a -15% DEF debuff.',
      skillUnlockLevel: 3,
      targetType: 'enemy',
      damageMultiplier: 1.5,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'self', duration: 2, value: 15 }
      ]
    },
    {
      name: 'But Not Out',
      description: 'Gain a 20% ATK buff for 2 turns. If below 50% health, instead gain a 30% ATK buff for 3 turns.',
      skillUnlockLevel: 6,
      targetType: 'self',
      noDamage: true,
      conditionalSelfBuff: {
        default: { type: EffectType.ATK_UP, duration: 2, value: 20 },
        conditional: {
          condition: { stat: 'hpPercent', below: 50 },
          effect: { type: EffectType.ATK_UP, duration: 3, value: 30 }
        }
      }
    },
    {
      name: 'In The Crowd',
      description: 'Deal 120% ATK damage to target enemy. Become untargetable until the end of next round.',
      skillUnlockLevel: 12,
      targetType: 'enemy',
      damageMultiplier: 1.2,
      effects: [
        { type: EffectType.UNTARGETABLE, target: 'self', duration: 2, value: 0 }
      ]
    }
  ]
}
```

**Step 3: Verify EffectType imports are present**

Check that `EffectType` is imported at the top of the file. If not, add the import.

**Step 4: Commit**

```bash
git add src/data/heroTemplates.js
git commit -m "feat: update Salia with 4-skill progression system"
```

---

## Task 2: Add evaluateCondition Helper Function

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Read battle.js to understand structure**

Read the file to find where helper functions are defined and understand the hero object structure.

**Step 2: Add evaluateCondition function**

Add near other helper functions:

```js
function evaluateCondition(condition, hero) {
  if (condition.stat === 'hpPercent') {
    const hpPercent = (hero.currentHp / hero.maxHp) * 100
    if (condition.below !== undefined) return hpPercent < condition.below
    if (condition.above !== undefined) return hpPercent > condition.above
  }
  return false
}
```

**Step 3: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat: add evaluateCondition helper for HP-based skill conditions"
```

---

## Task 3: Add conditionalSelfBuff Processing

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Find the self-target skill processing block**

Search for where `targetType: 'self'` or `case 'self':` is handled in `executePlayerAction`.

**Step 2: Add conditionalSelfBuff processing**

In the self-target handling section, add processing for `conditionalSelfBuff`:

```js
if (skill.conditionalSelfBuff) {
  const { default: defaultBuff, conditional } = skill.conditionalSelfBuff
  const buff = evaluateCondition(conditional.condition, hero)
    ? conditional.effect
    : defaultBuff

  applyEffect(hero, buff.type, {
    duration: buff.duration,
    value: buff.value,
    sourceId: hero.instanceId
  })

  addLog(`${hero.template.name} gains ${buff.value}% ATK for ${buff.duration} turns!`)
}
```

**Step 3: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat: add conditionalSelfBuff processing for HP-conditional buffs"
```

---

## Task 4: Add grantsExtraTurn Mechanic

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Find end of executePlayerAction**

Locate where `advanceTurnIndex()` and `startNextTurn()` are called after action execution.

**Step 2: Add extra turn check before advancing**

Wrap the turn advancement in a conditional:

```js
if (skill?.grantsExtraTurn && hero.currentHp > 0) {
  addLog(`${hero.template.name} gets an extra turn!`)
  setTimeout(() => {
    selectedAction.value = null
    selectedTarget.value = null
    state.value = BattleState.PLAYER_TURN
  }, 600)
} else {
  setTimeout(() => {
    advanceTurnIndex()
    startNextTurn()
  }, 600)
}
```

**Step 3: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat: add grantsExtraTurn mechanic for extra turn skills"
```

---

## Task 5: Manual Testing

**Files:**
- None (testing only)

**Step 1: Run the dev server**

```bash
npm run dev
```

**Step 2: Test Quick Throw (Level 1)**

1. Add Salia to party
2. Enter a battle
3. Use Quick Throw skill
4. Verify: 80% damage dealt, extra turn granted, log shows "gets an extra turn!"

**Step 3: Test But Not Out at full HP**

1. Ensure Salia is above 50% HP
2. Use But Not Out skill
3. Verify: Receives 20% ATK buff for 2 turns

**Step 4: Test But Not Out at low HP**

1. Let Salia take damage to below 50% HP
2. Use But Not Out skill
3. Verify: Receives 30% ATK buff for 3 turns instead

**Step 5: Test Desperation (requires Level 3)**

If testing with leveled hero:
1. Use Desperation skill
2. Verify: 150% damage dealt, self receives DEF_DOWN debuff

**Step 6: Test In The Crowd (requires Level 12)**

If testing with leveled hero:
1. Use In The Crowd skill
2. Verify: 120% damage dealt, self receives UNTARGETABLE status

**Step 7: Commit any fixes**

If bugs found, fix and commit each fix separately.

---

## Task 6: Final Verification and Cleanup

**Step 1: Run linter if available**

```bash
npm run lint
```

**Step 2: Verify no console errors in browser**

Check browser dev tools for any JavaScript errors.

**Step 3: Final commit if needed**

```bash
git status
# If any uncommitted changes:
git add -A
git commit -m "fix: address linting and cleanup issues"
```

---

## Notes

- UNTARGETABLE and DEF_DOWN effects already exist in statusEffects.js - no changes needed there
- Rangers lose Focus on skill use; extra turn doesn't restore it (existing behavior)
- Extra turn only granted if hero survives the action (checked via `hero.currentHp > 0`)
- The condition system is generalized to support future conditions beyond just HP
