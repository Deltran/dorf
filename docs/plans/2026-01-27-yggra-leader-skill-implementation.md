# Yggra Leader Skill Rework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Yggra's leader skill from a one-shot round-1 heal (10% of Yggra's ATK) to a passive per-round regen (3% of each ally's max HP), creating a three-way leader decision: burst (Shadow King) vs protection (Aurora) vs endurance (Yggra).

**Architecture:** New leader skill effect type `passive_regen` in the data layer, with a new `applyPassiveRegenLeaderEffects()` function in `battle.js` called at each round start. Follows existing patterns: `getLeaderEffectTargets()` for targeting, `emitCombatEffect()` for heal visuals, `addLog()` for battle log.

**Tech Stack:** Vue 3, Vitest, Pinia

**Design Reference:** `~/dorf-evaluation-session-1.md`, Solution 3 (lines 372-409)

---

### Task 1: Write failing leader skill data test

**Files:**
- Modify: `src/data/__tests__/heroTemplates-yggra.test.js`

**Step 1: Add leader skill test block**

Add the following `describe` block at the end of the existing test file, inside the outer `describe('Yggra hero template')` block (before the closing `})`):

```js
  describe('leader skill', () => {
    it('is Ancient Awakening — passive regen for all allies', () => {
      expect(yggra.leaderSkill).toBeDefined()
      expect(yggra.leaderSkill.name).toBe('Ancient Awakening')
    })

    it('has passive_regen effect targeting all allies at 3% max HP', () => {
      const effect = yggra.leaderSkill.effects[0]
      expect(effect.type).toBe('passive_regen')
      expect(effect.target).toBe('all_allies')
      expect(effect.percentMaxHp).toBe(3)
    })
  })
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/heroTemplates-yggra.test.js`
Expected: The 2 new leader skill tests FAIL. The first may pass (name matches), but the second will fail because current effect type is `'timed'` not `'passive_regen'`, and there is no `percentMaxHp` property.

---

### Task 2: Update Yggra leader skill definition

**Files:**
- Modify: `src/data/heroTemplates.js:220-234`

**Step 1: Replace the leader skill**

Change lines 220-234 from:
```js
    leaderSkill: {
      name: 'Ancient Awakening',
      description: "On round 1, all allies are healed for 10% of Yggra's ATK",
      effects: [
        {
          type: 'timed',
          triggerRound: 1,
          target: 'all_allies',
          apply: {
            effectType: 'heal',
            value: 10
          }
        }
      ]
    }
```

to:
```js
    leaderSkill: {
      name: 'Ancient Awakening',
      description: 'All allies regenerate 3% of their max HP at the start of each round',
      effects: [
        {
          type: 'passive_regen',
          target: 'all_allies',
          percentMaxHp: 3
        }
      ]
    }
```

**Step 2: Run Yggra data test**

Run: `npx vitest run src/data/__tests__/heroTemplates-yggra.test.js`
Expected: All tests PASS (including the 2 new leader skill tests).

---

### Task 3: Write failing battle regen test

**Files:**
- Modify: `src/stores/__tests__/battle-yggra-integration.test.js`

**Step 1: Add passive regen test block**

Add the following `describe` block to the existing test file, after the existing tests:

```js
describe('Yggra leader skill - passive regen', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  it('applyPassiveRegenLeaderEffects heals alive heroes for 3% max HP', () => {
    // Set up mock heroes as if Yggra is leader
    store.heroes = [
      {
        instanceId: 'yggra1',
        template: { name: 'Yggra', leaderSkill: heroTemplates.yggra_world_root.leaderSkill },
        currentHp: 800,
        maxHp: 1000,
        stats: { hp: 1000 },
        statusEffects: [],
        leaderBonuses: {}
      },
      {
        instanceId: 'mage1',
        template: { name: 'Mage' },
        currentHp: 150,
        maxHp: 400,
        stats: { hp: 400 },
        statusEffects: [],
        leaderBonuses: {}
      }
    ]
    store.enemies = [
      { id: 'e1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, statusEffects: [] }
    ]

    // Mock the heroes store to identify Yggra as party leader
    const heroesStore = useHeroesStore()
    heroesStore.partyLeader = 'yggra1'

    store.applyPassiveRegenLeaderEffects()

    // Yggra: 3% of 1000 = 30 HP healed → 800 + 30 = 830
    expect(store.heroes[0].currentHp).toBe(830)
    // Mage: 3% of 400 = 12 HP healed → 150 + 12 = 162
    expect(store.heroes[1].currentHp).toBe(162)
  })

  it('does not heal dead heroes', () => {
    store.heroes = [
      {
        instanceId: 'yggra1',
        template: { name: 'Yggra', leaderSkill: heroTemplates.yggra_world_root.leaderSkill },
        currentHp: 500,
        maxHp: 1000,
        stats: { hp: 1000 },
        statusEffects: [],
        leaderBonuses: {}
      },
      {
        instanceId: 'dead1',
        template: { name: 'Dead Hero' },
        currentHp: 0,
        maxHp: 400,
        stats: { hp: 400 },
        statusEffects: [],
        leaderBonuses: {}
      }
    ]
    store.enemies = [
      { id: 'e1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, statusEffects: [] }
    ]

    const heroesStore = useHeroesStore()
    heroesStore.partyLeader = 'yggra1'

    store.applyPassiveRegenLeaderEffects()

    expect(store.heroes[0].currentHp).toBe(530) // 3% of 1000 = 30
    expect(store.heroes[1].currentHp).toBe(0)   // Dead, not healed
  })

  it('does not overheal past max HP', () => {
    store.heroes = [
      {
        instanceId: 'yggra1',
        template: { name: 'Yggra', leaderSkill: heroTemplates.yggra_world_root.leaderSkill },
        currentHp: 995,
        maxHp: 1000,
        stats: { hp: 1000 },
        statusEffects: [],
        leaderBonuses: {}
      }
    ]
    store.enemies = [
      { id: 'e1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, statusEffects: [] }
    ]

    const heroesStore = useHeroesStore()
    heroesStore.partyLeader = 'yggra1'

    store.applyPassiveRegenLeaderEffects()

    // 3% of 1000 = 30, but 995 + 30 = 1025 > 1000, capped at 1000
    expect(store.heroes[0].currentHp).toBe(1000)
  })

  it('does nothing when leader has no passive_regen effects', () => {
    store.heroes = [
      {
        instanceId: 'aurora1',
        template: {
          name: 'Aurora',
          leaderSkill: {
            name: "Dawn's Protection",
            effects: [{ type: 'passive', stat: 'def', value: 15 }]
          }
        },
        currentHp: 100,
        maxHp: 150,
        stats: { hp: 150 },
        statusEffects: [],
        leaderBonuses: {}
      }
    ]
    store.enemies = [
      { id: 'e1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, statusEffects: [] }
    ]

    const heroesStore = useHeroesStore()
    heroesStore.partyLeader = 'aurora1'

    store.applyPassiveRegenLeaderEffects()

    expect(store.heroes[0].currentHp).toBe(100) // No change
  })
})
```

Note: The test file already imports `heroTemplates` and `useHeroesStore` will need to be added to imports. Update the import block at the top of the file:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { heroTemplates } from '../../data/heroTemplates'
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/battle-yggra-integration.test.js`
Expected: FAIL — `store.applyPassiveRegenLeaderEffects is not a function`

---

### Task 4: Implement passive regen in battle.js

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add the `applyPassiveRegenLeaderEffects` function**

Add this function after `applyTimedLeaderEffects` (after line 219):

```js
  // Apply passive regen leader skill effects each round
  function applyPassiveRegenLeaderEffects() {
    const leaderSkill = getActiveLeaderSkill()
    if (!leaderSkill) return

    for (const effect of leaderSkill.effects) {
      if (effect.type !== 'passive_regen') continue

      const targets = getLeaderEffectTargets(effect.target, effect.condition)

      for (const target of targets) {
        const maxHp = target.maxHp
        const healAmount = Math.floor(maxHp * effect.percentMaxHp / 100)
        const oldHp = target.currentHp
        target.currentHp = Math.min(maxHp, target.currentHp + healAmount)
        const actualHeal = target.currentHp - oldHp
        if (actualHeal > 0) {
          emitCombatEffect(target.instanceId, 'hero', 'heal', actualHeal)
          addLog(`${target.template.name} regenerates ${actualHeal} HP!`)
        }
      }
    }
  }
```

**Step 2: Call it at each round start**

Add after line 1528 (`applyTimedLeaderEffects(roundNumber.value)`):
```js
      applyPassiveRegenLeaderEffects()
```

Add after line 1391 (`applyTimedLeaderEffects(1)`):
```js
    applyPassiveRegenLeaderEffects()
```

**Step 3: Export the function**

Add `applyPassiveRegenLeaderEffects` to the store's return object so tests can call it directly. Find the return object and add it alongside the other exported functions.

**Step 4: Run the battle regen tests**

Run: `npx vitest run src/stores/__tests__/battle-yggra-integration.test.js`
Expected: All tests PASS.

**Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS. No regressions — the old timed heal code path in `applyTimedLeaderEffects` is unchanged; Yggra's leader skill simply no longer uses it.

---

### Task 5: Commit

**Step 1: Commit all changes**

```bash
git add src/data/heroTemplates.js src/data/__tests__/heroTemplates-yggra.test.js src/stores/battle.js src/stores/__tests__/battle-yggra-integration.test.js
git commit -m "$(cat <<'EOF'
feat: rework Yggra leader skill to passive 3% max HP regen per round

Replace Ancient Awakening from a one-shot round-1 heal (10% of Yggra's
ATK) to passive regeneration (3% of each ally's max HP per round).

Creates a three-way leader decision:
- Shadow King: +25% ATK burst for 2 turns (fast clears)
- Aurora: +15% DEF passive (surviving spike damage)
- Yggra: 3% max HP regen per round (long fights, Genus Loci)

New passive_regen leader skill effect type with dedicated processing
function called at each round start.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```
