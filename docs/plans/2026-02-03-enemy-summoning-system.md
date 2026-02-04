# Enemy Summoning System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow enemies to summon new enemies mid-battle, with a hard cap of 6 total enemies on screen.

**Architecture:** Add a `summon` property to enemy skills that spawns new enemies from templates. When the battlefield is full (6 enemies), the skill executes a designer-defined `fallbackSkill` instead (or passes). Summoned enemies join the turn order next round (existing `calculateTurnOrder()` at round wrap handles this). Summoned enemies are flagged `isSummoned: true` and give no rewards.

**Tech Stack:** Vue 3, Pinia stores, Vitest

---

## Design Decisions

| Decision | Answer |
|----------|--------|
| Hard cap | 6 **total** enemies on battlefield (alive) |
| Cap reached | Skill defines `fallbackSkill` (`null` = pass turn) |
| Summoned stats | Own enemy template with own SPD/HP/ATK/DEF |
| First action | Next round (turn order recalculates at round wrap — line 2676 of battle.js) |
| Summoner dies | Summons persist by default |
| Rewards | Summoned enemies give no XP/gold/drops |
| Recursion | Engine allows it (designer's responsibility) |

---

## Task 1: Add MAX_ENEMIES constant and summonEnemy() helper

**Files:**
- Modify: `src/stores/battle.js` (add constant, counter ref, helper function)
- Test: `src/stores/__tests__/battle-summoning.test.js`

### Step 1: Write failing tests

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { useHeroesStore } from '../heroes.js'

// Minimal hero template for battle init
const mockHeroTemplate = {
  id: 'test_hero',
  name: 'Test Hero',
  classId: 'knight',
  rarity: 1,
  baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 30 }
}

describe('Enemy Summoning System', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('MAX_ENEMIES constant', () => {
    it('should export MAX_ENEMIES as 6', () => {
      expect(battleStore.MAX_ENEMIES).toBe(6)
    })
  })

  describe('summonEnemy()', () => {
    beforeEach(() => {
      // Init a battle with 2 enemies (harpy exists in mountain.js)
      const heroesStore = useHeroesStore()
      // Add a hero to collection and party so battle can init
      heroesStore.collection.push({
        instanceId: 'hero_1',
        templateId: 'test_hero',
        level: 1,
        exp: 0,
        template: mockHeroTemplate
      })
      heroesStore.party[0] = 'hero_1'

      battleStore.initBattle(['harpy', 'harpy'])
    })

    it('should add a new enemy to the enemies array', () => {
      const before = battleStore.enemies.length
      battleStore.summonEnemy('harpy')
      expect(battleStore.enemies.length).toBe(before + 1)
    })

    it('should create enemy with correct template data', () => {
      battleStore.summonEnemy('harpy')
      const summoned = battleStore.enemies[battleStore.enemies.length - 1]
      expect(summoned.templateId).toBe('harpy')
      expect(summoned.currentHp).toBe(summoned.maxHp)
      expect(summoned.stats.atk).toBe(28) // Harpy's ATK after rework
    })

    it('should assign a unique enemy ID', () => {
      battleStore.summonEnemy('harpy')
      const ids = battleStore.enemies.map(e => e.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should flag summoned enemy with isSummoned: true', () => {
      battleStore.summonEnemy('harpy')
      const summoned = battleStore.enemies[battleStore.enemies.length - 1]
      expect(summoned.isSummoned).toBe(true)
    })

    it('should initialize cooldowns from template', () => {
      battleStore.summonEnemy('harpy')
      const summoned = battleStore.enemies[battleStore.enemies.length - 1]
      expect(summoned.currentCooldowns).toBeDefined()
      expect(summoned.currentCooldowns['Diving Talon']).toBeDefined()
    })

    it('should initialize empty statusEffects', () => {
      battleStore.summonEnemy('harpy')
      const summoned = battleStore.enemies[battleStore.enemies.length - 1]
      expect(summoned.statusEffects).toEqual([])
    })

    it('should NOT summon when alive enemies >= MAX_ENEMIES', () => {
      // Fill to cap (already have 2, add 4 more)
      battleStore.summonEnemy('harpy')
      battleStore.summonEnemy('harpy')
      battleStore.summonEnemy('harpy')
      battleStore.summonEnemy('harpy')
      // Now at 6 alive
      const countBefore = battleStore.enemies.length
      const result = battleStore.summonEnemy('harpy')
      expect(result).toBe(false)
      expect(battleStore.enemies.length).toBe(countBefore)
    })

    it('should return true on successful summon', () => {
      const result = battleStore.summonEnemy('harpy')
      expect(result).toBe(true)
    })

    it('should NOT include summoned enemy in current round turn order', () => {
      const turnOrderBefore = [...battleStore.turnOrder]
      battleStore.summonEnemy('harpy')
      const summoned = battleStore.enemies[battleStore.enemies.length - 1]
      // Summoned enemy should NOT be in current turn order
      const inTurnOrder = battleStore.turnOrder.some(t => t.id === summoned.id)
      expect(inTurnOrder).toBe(false)
    })
  })
})
```

### Step 2: Run tests to verify they fail

Run: `npx vitest run src/stores/__tests__/battle-summoning.test.js`
Expected: Multiple failures — `MAX_ENEMIES` undefined, `summonEnemy` not a function

### Step 3: Implement

In `src/stores/battle.js`:

1. Add constant near top of store:
```js
const MAX_ENEMIES = 6
```

2. Add a persistent enemy ID counter (inside the store, alongside other refs):
```js
const nextEnemyId = ref(0)
```

3. Reset counter in `initBattle` — after the existing enemy creation loop, set:
```js
nextEnemyId.value = enemies.value.length
```

4. Add `summonEnemy` function (after `calculateTurnOrder`):
```js
function summonEnemy(templateId) {
  const aliveCount = enemies.value.filter(e => e.currentHp > 0).length
  if (aliveCount >= MAX_ENEMIES) return false

  const template = getEnemyTemplate(templateId)
  if (!template) return false

  const cooldowns = {}
  if (template.skills) {
    for (const skill of template.skills) {
      cooldowns[skill.name] = skill.initialCooldown || 0
    }
  } else if (template.skill) {
    cooldowns[template.skill.name] = template.skill.initialCooldown || 0
  }

  enemies.value.push({
    id: `enemy_${nextEnemyId.value++}`,
    templateId,
    currentHp: template.stats.hp,
    maxHp: template.stats.hp,
    stats: { ...template.stats },
    template,
    currentCooldowns: cooldowns,
    statusEffects: [],
    isSummoned: true
  })

  const enemyName = template.name || templateId
  addLog(`${enemyName} has been summoned!`)

  return true
}
```

5. Expose in store return: add `summonEnemy`, `MAX_ENEMIES`, `nextEnemyId` (for testing)

### Step 4: Run tests to verify they pass

Run: `npx vitest run src/stores/__tests__/battle-summoning.test.js`
Expected: All PASS

### Step 5: Run full test suite

Run: `npx vitest run`
Expected: All pass, no regressions

### Step 6: Commit

```bash
git add src/stores/battle.js src/stores/__tests__/battle-summoning.test.js
git commit -m "feat(battle): add MAX_ENEMIES constant and summonEnemy() helper"
```

---

## Task 2: Handle summon skills in executeEnemyTurn

**Files:**
- Modify: `src/stores/battle.js` (in `executeEnemyTurn`, lines ~4278+)
- Test: `src/stores/__tests__/battle-summoning.test.js` (append new describe block)

### Step 1: Write failing tests

Append to the existing test file:

```js
describe('Summon skill execution in enemy turn', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()

    const heroesStore = useHeroesStore()
    heroesStore.collection.push({
      instanceId: 'hero_1',
      templateId: 'test_hero',
      level: 1,
      exp: 0,
      template: mockHeroTemplate
    })
    heroesStore.party[0] = 'hero_1'
  })

  it('should summon an enemy when skill has summon property and room on field', async () => {
    // Init with 1 enemy, then manually give it a summon skill
    battleStore.initBattle(['harpy'])
    const enemy = battleStore.enemies[0]
    enemy.template = {
      ...enemy.template,
      skill: {
        name: 'Test Summon',
        cooldown: 3,
        noDamage: true,
        summon: { templateId: 'harpy', count: 1 },
        effects: []
      }
    }
    enemy.currentCooldowns = { 'Test Summon': 0 }

    const before = battleStore.enemies.length
    battleStore.executeEnemyTurn(enemy)

    // Wait for async turn processing
    await new Promise(r => setTimeout(r, 800))

    expect(battleStore.enemies.length).toBe(before + 1)
    expect(battleStore.enemies[battleStore.enemies.length - 1].isSummoned).toBe(true)
  })

  it('should execute fallbackSkill when field is full', async () => {
    // Init with 6 enemies (at cap)
    battleStore.initBattle(['harpy', 'harpy', 'harpy', 'harpy', 'harpy', 'harpy'])

    const enemy = battleStore.enemies[0]
    enemy.template = {
      ...enemy.template,
      skill: {
        name: 'Test Summon',
        cooldown: 3,
        noDamage: true,
        summon: { templateId: 'harpy', count: 1 },
        fallbackSkill: {
          name: 'Defensive Posture',
          noDamage: true,
          effects: [
            { type: 'def_up', target: 'self', duration: 2, value: 20 }
          ]
        },
        effects: []
      }
    }
    enemy.currentCooldowns = { 'Test Summon': 0 }

    const countBefore = battleStore.enemies.length
    battleStore.executeEnemyTurn(enemy)

    await new Promise(r => setTimeout(r, 800))

    // Should NOT have added an enemy
    expect(battleStore.enemies.length).toBe(countBefore)
    // Should have applied DEF_UP to self from fallback
    const defUp = enemy.statusEffects.find(e => e.type === 'def_up')
    expect(defUp).toBeDefined()
  })

  it('should pass turn when field is full and fallbackSkill is null', async () => {
    battleStore.initBattle(['harpy', 'harpy', 'harpy', 'harpy', 'harpy', 'harpy'])

    const enemy = battleStore.enemies[0]
    enemy.template = {
      ...enemy.template,
      skill: {
        name: 'Test Summon',
        cooldown: 3,
        noDamage: true,
        summon: { templateId: 'harpy', count: 1 },
        fallbackSkill: null,
        effects: []
      }
    }
    enemy.currentCooldowns = { 'Test Summon': 0 }

    const countBefore = battleStore.enemies.length
    battleStore.executeEnemyTurn(enemy)

    await new Promise(r => setTimeout(r, 800))

    // No enemies added, no crash
    expect(battleStore.enemies.length).toBe(countBefore)
  })

  it('should apply skill effects alongside summon (e.g. DEF Up on self)', async () => {
    battleStore.initBattle(['harpy'])

    const enemy = battleStore.enemies[0]
    enemy.template = {
      ...enemy.template,
      skill: {
        name: 'Brood Call',
        cooldown: 3,
        noDamage: true,
        summon: { templateId: 'harpy', count: 1 },
        effects: [
          { type: 'def_up', target: 'self', duration: 2, value: 20 }
        ]
      }
    }
    enemy.currentCooldowns = { 'Brood Call': 0 }

    battleStore.executeEnemyTurn(enemy)
    await new Promise(r => setTimeout(r, 800))

    // Both summon and self-buff should happen
    expect(battleStore.enemies.length).toBe(2)
    const defUp = enemy.statusEffects.find(e => e.type === 'def_up')
    expect(defUp).toBeDefined()
  })
})
```

### Step 2: Run tests to verify they fail

Run: `npx vitest run src/stores/__tests__/battle-summoning.test.js`
Expected: Failures — summon logic not handled in `executeEnemyTurn`

### Step 3: Implement

In `executeEnemyTurn`, after skill is selected (around line 4278 `if (skill) {`), add summon handling before the existing damage/effect logic:

```js
if (skill) {
  // --- NEW: Handle summon skills ---
  if (skill.summon) {
    const aliveCount = enemies.value.filter(e => e.currentHp > 0).length

    if (aliveCount < MAX_ENEMIES) {
      // Room on field — execute summon
      currentEffectSource = `${enemy.template?.name || enemy.name}'s ${skill.name}`
      enemySkillActivation.value = { enemyId: enemy.id, skillName: skill.name }

      for (let i = 0; i < (skill.summon.count || 1); i++) {
        if (enemies.value.filter(e => e.currentHp > 0).length >= MAX_ENEMIES) break
        summonEnemy(skill.summon.templateId)
      }

      // Apply self/ally effects from the skill (e.g., DEF Up)
      if (skill.effects?.length > 0) {
        for (const effect of skill.effects) {
          if (effect.target === 'self') {
            applyEffect(enemy, effect, enemy)
          }
        }
      }

      // Set cooldown
      if (enemy.currentCooldowns[skill.name] !== undefined) {
        enemy.currentCooldowns[skill.name] = skill.cooldown
      }

      processEndOfTurnEffects(enemy)
      setTimeout(() => {
        advanceTurnIndex()
        startNextTurn()
      }, 600)
      return
    } else {
      // Field full — use fallback skill or pass
      if (skill.fallbackSkill) {
        const fallback = skill.fallbackSkill
        currentEffectSource = `${enemy.template?.name || enemy.name}'s ${fallback.name}`
        enemySkillActivation.value = { enemyId: enemy.id, skillName: fallback.name }

        if (fallback.effects?.length > 0) {
          for (const effect of fallback.effects) {
            if (effect.target === 'self') {
              applyEffect(enemy, effect, enemy)
            }
            // Could add other target types here if needed
          }
        }

        if (enemy.currentCooldowns[skill.name] !== undefined) {
          enemy.currentCooldowns[skill.name] = skill.cooldown
        }

        processEndOfTurnEffects(enemy)
        setTimeout(() => {
          advanceTurnIndex()
          startNextTurn()
        }, 600)
        return
      } else {
        // fallbackSkill is null — pass turn
        addLog(`${enemy.template?.name || 'Enemy'} cannot summon — field is full.`)
        processEndOfTurnEffects(enemy)
        setTimeout(() => {
          advanceTurnIndex()
          startNextTurn()
        }, 600)
        return
      }
    }
  }
  // --- END summon handling ---

  // ... existing skill logic continues ...
```

### Step 4: Run tests to verify they pass

Run: `npx vitest run src/stores/__tests__/battle-summoning.test.js`
Expected: All PASS

### Step 5: Run full test suite

Run: `npx vitest run`
Expected: All pass, no regressions

### Step 6: Commit

```bash
git add src/stores/battle.js src/stores/__tests__/battle-summoning.test.js
git commit -m "feat(battle): handle summon skills in enemy turn execution"
```

---

## Task 3: Add Nesting Roc and Harpy Chick enemy templates

**Files:**
- Modify: `src/data/enemies/mountain.js`
- Test: `src/data/enemies/__tests__/mountain.test.js` (append new describe blocks)

### Step 1: Write failing tests

Append to the existing `mountain.test.js`:

```js
describe('Harpy Chick (summonable)', () => {
  const chick = enemies.harpy_chick

  it('should exist', () => {
    expect(chick).toBeDefined()
  })

  it('should have correct stats', () => {
    expect(chick.stats).toEqual({ hp: 30, atk: 15, def: 3, spd: 16 })
  })

  it('should have no skill', () => {
    expect(chick.skill).toBeUndefined()
    expect(chick.skills).toBeUndefined()
  })
})

describe('Nesting Roc', () => {
  const roc = enemies.nesting_roc

  it('should exist', () => {
    expect(roc).toBeDefined()
  })

  it('should have correct stats', () => {
    expect(roc.stats).toEqual({ hp: 120, atk: 15, def: 20, spd: 8 })
  })

  it('should have Brood Call skill', () => {
    expect(roc.skill.name).toBe('Brood Call')
  })

  it('should summon a harpy_chick', () => {
    expect(roc.skill.summon).toBeDefined()
    expect(roc.skill.summon.templateId).toBe('harpy_chick')
    expect(roc.skill.summon.count).toBe(1)
  })

  it('should grant self DEF Up 20% for 2 turns', () => {
    const defUp = roc.skill.effects.find(e => e.type === EffectType.DEF_UP)
    expect(defUp).toBeDefined()
    expect(defUp.target).toBe('self')
    expect(defUp.value).toBe(20)
    expect(defUp.duration).toBe(2)
  })

  it('should have a fallbackSkill for when field is full', () => {
    expect(roc.skill.fallbackSkill).toBeDefined()
    expect(roc.skill.fallbackSkill.name).toBe('Protective Roost')
  })

  it('should have fallbackSkill that buffs DEF', () => {
    const defUp = roc.skill.fallbackSkill.effects.find(e => e.type === EffectType.DEF_UP)
    expect(defUp).toBeDefined()
    expect(defUp.target).toBe('self')
  })

  it('should have cooldown 3', () => {
    expect(roc.skill.cooldown).toBe(3)
  })
})
```

### Step 2: Run tests to verify they fail

Run: `npx vitest run src/data/enemies/__tests__/mountain.test.js`
Expected: Failures — `harpy_chick` and `nesting_roc` not defined

### Step 3: Implement

In `src/data/enemies/mountain.js`, add after the `mountain_giant` entry:

```js
harpy_chick: {
  id: 'harpy_chick',
  name: 'Harpy Chick',
  stats: { hp: 30, atk: 15, def: 3, spd: 16 }
},
nesting_roc: {
  id: 'nesting_roc',
  name: 'Nesting Roc',
  stats: { hp: 120, atk: 15, def: 20, spd: 8 },
  skill: {
    name: 'Brood Call',
    description: 'Summon a Harpy Chick and gain +20% DEF for 2 turns.',
    cooldown: 3,
    noDamage: true,
    summon: { templateId: 'harpy_chick', count: 1 },
    effects: [
      { type: EffectType.DEF_UP, target: 'self', duration: 2, value: 20 }
    ],
    fallbackSkill: {
      name: 'Protective Roost',
      description: 'Hunker down. Gain +20% DEF for 2 turns.',
      noDamage: true,
      effects: [
        { type: EffectType.DEF_UP, target: 'self', duration: 2, value: 20 }
      ]
    }
  }
}
```

### Step 4: Run tests to verify they pass

Run: `npx vitest run src/data/enemies/__tests__/mountain.test.js`
Expected: All PASS

### Step 5: Commit

```bash
git add src/data/enemies/mountain.js src/data/enemies/__tests__/mountain.test.js
git commit -m "feat(enemies): add Nesting Roc and Harpy Chick templates"
```

---

## Task 4: Update Stormwind Peaks quest nodes

**Files:**
- Modify: `src/data/quests/stormwind_peaks.js`

### Step 1: Update select quest nodes

Replace some encounters with Nesting Roc to add variety. Good candidates:

**mountain_03 (Giant's Path)** — Replace the 4-harpy wave with a Roc + harpies:
```js
// Before: { enemies: ['harpy', 'harpy', 'harpy', 'harpy'] }
// After:
{ enemies: ['nesting_roc', 'harpy', 'harpy'] }
```

**mountain_07 (Howling Cliffs)** — Add a Roc to one wave:
```js
// Before: { enemies: ['frost_elemental', 'frost_elemental', 'thunder_hawk', 'thunder_hawk'] }
// After:
{ enemies: ['nesting_roc', 'frost_elemental', 'thunder_hawk', 'thunder_hawk'] }
```

Keep Roc usage to 2-3 nodes max so it doesn't become monotonous.

### Step 2: Run full test suite

Run: `npx vitest run`
Expected: All pass

### Step 3: Commit

```bash
git add src/data/quests/stormwind_peaks.js
git commit -m "feat(quests): add Nesting Roc encounters to Stormwind Peaks"
```

---

## Task 5: Verify UI handles 5-6 enemies

**Files:**
- Possibly modify: `src/components/EnemyCard.vue` (reduce min-width for crowded battles)
- Possibly modify: `src/screens/BattleScreen.vue` (enemy-area gap/sizing)

### Step 1: Manual test

Start a battle with a Nesting Roc and let it summon. Verify:
- Cards wrap correctly in the flex container
- No overflow or clipping
- Cards are still readable with 5-6 enemies

### Step 2: If cards are too large for 5-6 enemies

Add a dynamic class to the enemy area when there are many enemies:

In `BattleScreen.vue` template:
```html
<section class="enemy-area" :class="{ 'crowded': battleStore.aliveEnemies.length > 4 }">
```

In styles:
```css
.enemy-area.crowded {
  gap: 8px;
}

.enemy-area.crowded .enemy-wrapper {
  transform: scale(0.9);
}
```

### Step 3: Commit if changes needed

```bash
git add src/screens/BattleScreen.vue src/components/EnemyCard.vue
git commit -m "ui(battle): adjust enemy layout for 5-6 enemies"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | MAX_ENEMIES + summonEnemy() | battle.js, battle-summoning.test.js |
| 2 | Summon handling in executeEnemyTurn | battle.js, battle-summoning.test.js |
| 3 | Nesting Roc + Harpy Chick templates | mountain.js, mountain.test.js |
| 4 | Quest node updates | stormwind_peaks.js |
| 5 | UI verification | BattleScreen.vue, EnemyCard.vue |
