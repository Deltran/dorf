# Lady Moonwhisper Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Silver Mist (evasion) and Full Moon's Embrace (revive) skills to Lady Moonwhisper

**Architecture:** Add EVASION effect type with evasion check in applyDamage before damage is dealt. Add dead_ally target type for revive skills. Update heroTemplates with new skills.

**Tech Stack:** Vue 3, Pinia, Vitest

---

## Task 1: Add EVASION Effect Type

**Files:**
- Modify: `src/data/statusEffects.js:23-39` (EffectType enum)
- Modify: `src/data/statusEffects.js:162-169` (effectDefinitions)

**Step 1: Write the failing test**

Create file `src/stores/__tests__/battle-evasion.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - evasion effect', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('hasEffect', () => {
    it('detects evasion effect on unit', () => {
      const unit = {
        statusEffects: [
          { type: EffectType.EVASION, duration: 3, value: 40 }
        ]
      }
      expect(store.hasEffect(unit, EffectType.EVASION)).toBe(true)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `/usr/local/bin/npx vitest run src/stores/__tests__/battle-evasion.test.js`
Expected: FAIL - EffectType.EVASION is undefined

**Step 3: Add EVASION to EffectType enum**

In `src/data/statusEffects.js`, add after line 28 (after UNTARGETABLE):

```js
  EVASION: 'evasion', // Chance to completely avoid attacks
```

**Step 4: Add EVASION to effectDefinitions**

In `src/data/statusEffects.js`, add after the UNTARGETABLE definition (around line 169):

```js
  [EffectType.EVASION]: {
    name: 'Evasion',
    icon: '💨',
    color: '#a78bfa',
    isBuff: true,
    isEvasion: true,
    stackable: false
  },
```

**Step 5: Run test to verify it passes**

Run: `/usr/local/bin/npx vitest run src/stores/__tests__/battle-evasion.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/data/statusEffects.js src/stores/__tests__/battle-evasion.test.js
git commit -m "feat: add EVASION effect type"
```

---

## Task 2: Implement Evasion Check in applyDamage

**Files:**
- Modify: `src/stores/battle.js:606` (applyDamage function)
- Modify: `src/stores/__tests__/battle-evasion.test.js`

**Step 1: Write the failing test**

Add to `src/stores/__tests__/battle-evasion.test.js`:

```js
  describe('applyDamage with evasion', () => {
    it('can evade damage when evasion check succeeds', () => {
      // Mock Math.random to always return 0 (will be < 0.4 evasion chance)
      const originalRandom = Math.random
      Math.random = () => 0

      const unit = {
        currentHp: 100,
        maxHp: 100,
        statusEffects: [
          { type: EffectType.EVASION, duration: 3, value: 40 }
        ],
        template: { name: 'Test Hero' }
      }

      const result = store.applyDamage(unit, 50, 'attack')

      expect(result).toBe(0) // No damage dealt
      expect(unit.currentHp).toBe(100) // HP unchanged

      Math.random = originalRandom
    })

    it('takes damage when evasion check fails', () => {
      // Mock Math.random to always return 0.5 (will be >= 0.4 evasion chance)
      const originalRandom = Math.random
      Math.random = () => 0.5

      const unit = {
        currentHp: 100,
        maxHp: 100,
        statusEffects: [
          { type: EffectType.EVASION, duration: 3, value: 40 }
        ],
        template: { name: 'Test Hero' }
      }

      const result = store.applyDamage(unit, 50, 'attack')

      expect(result).toBe(50) // Full damage dealt
      expect(unit.currentHp).toBe(50) // HP reduced

      Math.random = originalRandom
    })
  })
```

**Step 2: Run test to verify it fails**

Run: `/usr/local/bin/npx vitest run src/stores/__tests__/battle-evasion.test.js`
Expected: FAIL - evasion check not implemented

**Step 3: Implement evasion check in applyDamage**

In `src/stores/battle.js`, at the beginning of `applyDamage` function (after line 607 `if (damage <= 0) return 0`), add:

```js
    // Check for EVASION effect
    const evasionEffect = (unit.statusEffects || []).find(e => e.type === EffectType.EVASION)
    if (evasionEffect && source === 'attack') {
      const evasionChance = evasionEffect.value / 100
      if (Math.random() < evasionChance) {
        const unitName = unit.template?.name || 'Unknown'
        addLog(`${unitName} evades the attack!`)
        emitCombatEffect(unit.instanceId || unit.id, unit.instanceId ? 'hero' : 'enemy', 'miss', 0)

        // Handle onEvade effects (e.g., MP restore to caster)
        if (evasionEffect.onEvade?.restoreMp && evasionEffect.sourceId) {
          const caster = heroes.value.find(h => h.instanceId === evasionEffect.sourceId)
          if (caster && caster.currentHp > 0) {
            const mpToRestore = evasionEffect.onEvade.restoreMp
            caster.currentMp = Math.min(caster.maxMp, caster.currentMp + mpToRestore)
            addLog(`${caster.template.name} recovers ${mpToRestore} MP!`)
          }
        }

        return 0 // No damage dealt
      }
    }
```

**Step 4: Run test to verify it passes**

Run: `/usr/local/bin/npx vitest run src/stores/__tests__/battle-evasion.test.js`
Expected: PASS

**Step 5: Run all tests**

Run: `/usr/local/bin/npx vitest run`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-evasion.test.js
git commit -m "feat: implement evasion check in applyDamage"
```

---

## Task 3: Add 'miss' Combat Effect Display

**Files:**
- Modify: `src/components/CombatEffects.vue` (if it exists, otherwise in BattleScreen.vue)

**Step 1: Search for combat effect display**

Run: `grep -r "effectType.*damage\|combatEffects" src/components/`

**Step 2: Add 'miss' effect type handling**

Find where damage/heal floating text is rendered and add a case for 'miss' that displays "Miss!" in a distinct color (e.g., gray or white).

The exact change depends on the current implementation. Look for a pattern like:
```vue
<span v-if="effect.effectType === 'damage'" class="damage">-{{ effect.value }}</span>
```

Add:
```vue
<span v-else-if="effect.effectType === 'miss'" class="miss">Miss!</span>
```

With CSS:
```css
.miss {
  color: #9ca3af;
  font-style: italic;
}
```

**Step 3: Test manually**

Run: `/usr/local/bin/npx vite` and test in browser

**Step 4: Commit**

```bash
git add src/components/
git commit -m "feat: add Miss! floating text for evasion"
```

---

## Task 4: Add dead_ally Target Type

**Files:**
- Modify: `src/stores/battle.js` (needsTargetSelection computed, skill execution)

**Step 1: Write the failing test**

Add to `src/stores/__tests__/battle-evasion.test.js` (rename to `battle-moonwhisper.test.js` first):

```js
describe('dead_ally targeting', () => {
  it('needsTargetSelection returns true for dead_ally', () => {
    // This test will need the store to have currentTargetType exposed
    // For now, we'll test the revive functionality directly
    expect(true).toBe(true) // Placeholder - will test revive in Task 5
  })
})
```

**Step 2: Update needsTargetSelection computed**

In `src/stores/battle.js`, find `needsTargetSelection` computed (around line 226-228) and update:

```js
  const needsTargetSelection = computed(() => {
    const targetType = currentTargetType.value
    return targetType === 'enemy' || targetType === 'ally' || targetType === 'dead_ally'
  })
```

**Step 3: Add deadHeroes computed**

In `src/stores/battle.js`, after `aliveHeroes` computed (around line 54-56), add:

```js
  const deadHeroes = computed(() => {
    return heroes.value.filter(h => h.currentHp <= 0)
  })
```

**Step 4: Export deadHeroes**

Add `deadHeroes` to the return statement of the store (around line 2220+).

**Step 5: Run all tests**

Run: `/usr/local/bin/npx vitest run`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat: add dead_ally target type and deadHeroes computed"
```

---

## Task 5: Implement Revive Skill Execution

**Files:**
- Modify: `src/stores/battle.js` (skill execution switch statement)

**Step 1: Write the failing test**

Add to test file:

```js
describe('revive skill execution', () => {
  it('revives dead hero to specified HP percentage', () => {
    store.startBattle([
      { instanceId: 'hero1', template: { name: 'Hero 1' }, currentHp: 0, maxHp: 100, statusEffects: [] },
      { instanceId: 'hero2', template: { name: 'Healer' }, currentHp: 50, maxHp: 100, currentMp: 50, maxMp: 80, statusEffects: [] }
    ], [
      { id: 'enemy1', template: { name: 'Enemy' }, currentHp: 100, maxHp: 100, statusEffects: [] }
    ])

    // Simulate revive at 40%
    const deadHero = store.heroes.find(h => h.instanceId === 'hero1')
    store.reviveUnit(deadHero, 40)

    expect(deadHero.currentHp).toBe(40) // 40% of 100
  })
})
```

**Step 2: Run test to verify it fails**

Run: `/usr/local/bin/npx vitest run`
Expected: FAIL - reviveUnit not defined

**Step 3: Add reviveUnit function**

In `src/stores/battle.js`, add new function (near other unit manipulation functions):

```js
  function reviveUnit(unit, hpPercent) {
    if (!unit || unit.currentHp > 0) return false

    const newHp = Math.floor(unit.maxHp * hpPercent / 100)
    unit.currentHp = newHp

    addLog(`${unit.template.name} has been revived with ${newHp} HP!`)
    emitCombatEffect(unit.instanceId, 'hero', 'heal', newHp)

    return true
  }
```

Export `reviveUnit` in the return statement.

**Step 4: Add dead_ally case to skill execution**

In `src/stores/battle.js`, in the skill execution switch statement (after the 'ally' case, around line 1600), add:

```js
        case 'dead_ally': {
          const target = heroes.value.find(h => h.instanceId === selectedTarget.value?.id)
          if (!target || target.currentHp > 0) {
            addLog('Invalid target - must target a fallen ally')
            // Refund MP
            hero.currentMp += skill.mpCost
            state.value = BattleState.PLAYER_TURN
            return
          }

          // Revive the target
          if (skill.revive) {
            reviveUnit(target, skill.revive.hpPercent)
          }

          addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}!`)

          // Apply post-revive effects (like untargetable)
          if (skill.effects) {
            for (const effect of skill.effects) {
              if (effect.target === 'ally') {
                const newEffect = createEffect(effect.type, {
                  duration: effect.duration,
                  value: effect.value || 0,
                  sourceId: hero.instanceId
                })
                if (newEffect) {
                  target.statusEffects = target.statusEffects || []
                  target.statusEffects.push(newEffect)
                  addLog(`${target.template.name} gains ${newEffect.definition.name}!`)
                }
              }
            }
          }
          break
        }
```

**Step 5: Run test to verify it passes**

Run: `/usr/local/bin/npx vitest run`
Expected: PASS

**Step 6: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat: implement revive skill execution for dead_ally target"
```

---

## Task 6: Add Silver Mist Skill to Lady Moonwhisper

**Files:**
- Modify: `src/data/heroTemplates.js:248-284` (lady_moonwhisper)

**Step 1: Update Lady Moonwhisper's skills array**

In `src/data/heroTemplates.js`, replace the `lady_moonwhisper` entry skills array. After Purifying Light (skillUnlockLevel: 3), add:

```js
      {
        name: 'Silver Mist',
        description: 'Grant ally 40% evasion for 3 turns. Missed attacks restore 5 MP to Lady Moonwhisper.',
        mpCost: 18,
        skillUnlockLevel: 6,
        targetType: 'ally',
        noDamage: true,
        effects: [
          {
            type: EffectType.EVASION,
            target: 'ally',
            duration: 3,
            value: 40,
            onEvade: { restoreMp: 5, to: 'caster' }
          }
        ]
      }
```

**Step 2: Verify skill unlock level order**

Ensure skills are in order: 1, 1, 3, 6 (Lunar Blessing, Moonveil, Purifying Light, Silver Mist)

**Step 3: Add skillUnlockLevel to existing skills if missing**

Check that Lunar Blessing and Moonveil have `skillUnlockLevel: 1`.

**Step 4: Run all tests**

Run: `/usr/local/bin/npx vitest run`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/data/heroTemplates.js
git commit -m "feat: add Silver Mist skill to Lady Moonwhisper"
```

---

## Task 7: Add Full Moon's Embrace Skill to Lady Moonwhisper

**Files:**
- Modify: `src/data/heroTemplates.js:248-284` (lady_moonwhisper)

**Step 1: Add Full Moon's Embrace skill**

After Silver Mist, add:

```js
      {
        name: "Full Moon's Embrace",
        description: 'Revive a fallen ally at 40% HP with untargetable for 1 turn.',
        mpCost: 35,
        skillUnlockLevel: 12,
        targetType: 'dead_ally',
        noDamage: true,
        revive: { hpPercent: 40 },
        effects: [
          { type: EffectType.UNTARGETABLE, target: 'ally', duration: 1 }
        ]
      }
```

**Step 2: Run all tests**

Run: `/usr/local/bin/npx vitest run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/data/heroTemplates.js
git commit -m "feat: add Full Moon's Embrace revive skill to Lady Moonwhisper"
```

---

## Task 8: Update UI for dead_ally Targeting

**Files:**
- Modify: `src/components/BattleScreen.vue` (or wherever hero targeting UI is)

**Step 1: Search for ally targeting UI**

Run: `grep -r "selectTarget\|aliveHeroes" src/components/`

**Step 2: Add dead hero targeting**

Find where ally heroes are rendered as clickable targets. Add a section for dead heroes when `currentTargetType === 'dead_ally'`:

```vue
<!-- Dead ally targeting for revive skills -->
<template v-if="currentTargetType === 'dead_ally'">
  <div v-for="hero in deadHeroes" :key="hero.instanceId"
       class="dead-hero-target"
       @click="selectTarget(hero.instanceId, 'dead_ally')">
    <!-- Render dead hero card with grayed out style -->
  </div>
</template>
```

**Step 3: Add visual distinction for dead heroes**

Add CSS for `.dead-hero-target` with opacity/grayscale to indicate fallen state.

**Step 4: Test manually**

Run: `/usr/local/bin/npx vite` and test the full flow in browser

**Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add dead ally targeting UI for revive skills"
```

---

## Task 9: Final Integration Test

**Step 1: Run all tests**

Run: `/usr/local/bin/npx vitest run`
Expected: All tests pass

**Step 2: Manual testing checklist**

- [ ] Silver Mist applies evasion buff to ally
- [ ] Evasion shows "Miss!" when attack evaded
- [ ] Lady Moonwhisper gains 5 MP when ally evades
- [ ] Full Moon's Embrace only targetable when ally is dead
- [ ] Revived ally has 40% HP
- [ ] Revived ally gains untargetable for 1 turn

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Lady Moonwhisper skill implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add EVASION effect type | statusEffects.js |
| 2 | Implement evasion check | battle.js |
| 3 | Add Miss! display | BattleScreen/CombatEffects |
| 4 | Add dead_ally target type | battle.js |
| 5 | Implement revive execution | battle.js |
| 6 | Add Silver Mist skill | heroTemplates.js |
| 7 | Add Full Moon's Embrace | heroTemplates.js |
| 8 | Update UI for dead targeting | BattleScreen.vue |
| 9 | Integration testing | - |
