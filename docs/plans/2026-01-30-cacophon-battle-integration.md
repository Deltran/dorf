# Cacophon Battle Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Cacophon's mechanics into battle.js to make her fully playable.

**Architecture:** Add processing for VICIOUS damage bonus, SHATTERED_TEMPO turn order, ECHOING AoE conversion, DISCORDANT_RESONANCE leader skill, ally HP cost application, shieldPercentMaxHp, and Finale triggering.

**Tech Stack:** Vue 3, Pinia stores, Vitest for testing

---

## Task Overview (Parallelizable Groups)

| Group | Tasks | Can Run In Parallel |
|-------|-------|---------------------|
| A | 1, 2, 3 | Yes (independent damage/turn mechanics) |
| B | 4, 5 | Yes (leader skill + shield calculation) |
| C | 6, 7 | After A (skill execution integration) |
| D | 8 | After all (full integration test) |

---

## Task 1: Implement VICIOUS Damage Bonus

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-vicious.test.js`

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-vicious.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('VICIOUS damage bonus', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have getViciousDamageMultiplier function', () => {
    expect(typeof battleStore.getViciousDamageMultiplier).toBe('function')
  })

  it('should return 1.0 when attacker has no VICIOUS effect', () => {
    const attacker = { statusEffects: [] }
    const target = { statusEffects: [{ type: EffectType.POISON }] }

    expect(battleStore.getViciousDamageMultiplier(attacker, target)).toBe(1.0)
  })

  it('should return 1.0 when target has no debuffs', () => {
    const attacker = {
      statusEffects: [{ type: EffectType.VICIOUS, bonusDamagePercent: 30 }]
    }
    const target = { statusEffects: [] }

    expect(battleStore.getViciousDamageMultiplier(attacker, target)).toBe(1.0)
  })

  it('should return bonus multiplier when attacker has VICIOUS and target has debuffs', () => {
    const attacker = {
      statusEffects: [{ type: EffectType.VICIOUS, bonusDamagePercent: 30 }]
    }
    const target = {
      statusEffects: [{ type: EffectType.POISON, definition: { isBuff: false } }]
    }

    expect(battleStore.getViciousDamageMultiplier(attacker, target)).toBe(1.3)
  })

  it('should work with any debuff type', () => {
    const attacker = {
      statusEffects: [{ type: EffectType.VICIOUS, bonusDamagePercent: 30 }]
    }
    const target = {
      statusEffects: [{ type: EffectType.DEF_DOWN, definition: { isBuff: false } }]
    }

    expect(battleStore.getViciousDamageMultiplier(attacker, target)).toBe(1.3)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-vicious.test.js`
Expected: FAIL

**Step 3: Implement getViciousDamageMultiplier in battle.js**

Add near other damage multiplier functions (around line 3613):

```javascript
  function getViciousDamageMultiplier(attacker, target) {
    const viciousEffect = attacker?.statusEffects?.find(e => e.type === EffectType.VICIOUS)
    if (!viciousEffect) return 1.0

    // Check if target has any debuffs
    const hasDebuff = target?.statusEffects?.some(e => {
      const def = e.definition || effectDefinitions[e.type]
      return def && !def.isBuff
    })

    if (!hasDebuff) return 1.0

    return 1 + (viciousEffect.bonusDamagePercent || 0) / 100
  }
```

Add to exports:

```javascript
    getViciousDamageMultiplier,
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-vicious.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-vicious.test.js
git commit -m "feat: implement VICIOUS damage bonus multiplier"
```

---

## Task 2: Implement SHATTERED_TEMPO Turn Order

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-shattered-tempo.test.js`

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-shattered-tempo.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('SHATTERED_TEMPO turn order', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should prioritize units with SHATTERED_TEMPO in turn order', () => {
    // Setup: hero with 10 SPD but SHATTERED_TEMPO should act before enemy with 100 SPD
    battleStore.heroes.value = [
      {
        instanceId: 'slow_hero',
        currentHp: 100,
        template: { baseStats: { spd: 10 } },
        statusEffects: [{ type: EffectType.SHATTERED_TEMPO, turnOrderPriority: 2 }]
      },
      {
        instanceId: 'normal_hero',
        currentHp: 100,
        template: { baseStats: { spd: 50 } },
        statusEffects: []
      }
    ]
    battleStore.enemies.value = [
      {
        id: 'fast_enemy',
        currentHp: 100,
        stats: { spd: 100 },
        statusEffects: []
      }
    ]

    battleStore.calculateTurnOrder()

    // slow_hero should be in top 2 due to SHATTERED_TEMPO
    const order = battleStore.turnOrder.value
    const slowHeroIndex = order.findIndex(u => u.id === 'slow_hero')
    expect(slowHeroIndex).toBeLessThan(2)
  })

  it('should sort multiple SHATTERED_TEMPO units by their actual SPD', () => {
    battleStore.heroes.value = [
      {
        instanceId: 'hero_a',
        currentHp: 100,
        template: { baseStats: { spd: 20 } },
        statusEffects: [{ type: EffectType.SHATTERED_TEMPO, turnOrderPriority: 2 }]
      },
      {
        instanceId: 'hero_b',
        currentHp: 100,
        template: { baseStats: { spd: 30 } },
        statusEffects: [{ type: EffectType.SHATTERED_TEMPO, turnOrderPriority: 2 }]
      }
    ]
    battleStore.enemies.value = []

    battleStore.calculateTurnOrder()

    const order = battleStore.turnOrder.value
    // hero_b (30 SPD) should be before hero_a (20 SPD) among priority units
    expect(order[0].id).toBe('hero_b')
    expect(order[1].id).toBe('hero_a')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-shattered-tempo.test.js`
Expected: FAIL

**Step 3: Modify calculateTurnOrder in battle.js**

Find the `calculateTurnOrder` function (around line 1914) and replace it:

```javascript
  function calculateTurnOrder() {
    const units = []

    for (const hero of heroes.value) {
      if (hero.currentHp > 0) {
        const effectiveSpd = getEffectiveStat(hero, 'spd')
        const tempoEffect = hero.statusEffects?.find(e => e.type === EffectType.SHATTERED_TEMPO)
        units.push({
          type: 'hero',
          id: hero.instanceId,
          spd: effectiveSpd,
          turnOrderPriority: tempoEffect?.turnOrderPriority || 999
        })
      }
    }

    for (const enemy of enemies.value) {
      if (enemy.currentHp > 0) {
        const effectiveSpd = getEffectiveStat(enemy, 'spd')
        units.push({
          type: 'enemy',
          id: enemy.id,
          spd: effectiveSpd,
          turnOrderPriority: 999
        })
      }
    }

    // Sort by priority first (lower = acts sooner), then by SPD
    units.sort((a, b) => {
      if (a.turnOrderPriority !== b.turnOrderPriority) {
        return a.turnOrderPriority - b.turnOrderPriority
      }
      return b.spd - a.spd
    })

    turnOrder.value = units.map(u => ({ type: u.type, id: u.id }))
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-shattered-tempo.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-shattered-tempo.test.js
git commit -m "feat: implement SHATTERED_TEMPO turn order priority"
```

---

## Task 3: Implement ECHOING AoE Conversion

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-echoing.test.js`

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-echoing.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('ECHOING AoE conversion', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have checkAndApplyEchoing function', () => {
    expect(typeof battleStore.checkAndApplyEchoing).toBe('function')
  })

  it('should return false when hero has no ECHOING effect', () => {
    const hero = { statusEffects: [] }
    const skill = { damagePercent: 100 }

    expect(battleStore.checkAndApplyEchoing(hero, skill)).toBe(false)
  })

  it('should return false for multi-hit skills', () => {
    const hero = {
      statusEffects: [{ type: EffectType.ECHOING, splashPercent: 50 }]
    }
    const skill = { damagePercent: 100, multiHit: 3 }

    expect(battleStore.checkAndApplyEchoing(hero, skill)).toBe(false)
  })

  it('should return true for single-hit damaging skills with ECHOING', () => {
    const hero = {
      statusEffects: [{ type: EffectType.ECHOING, splashPercent: 50 }]
    }
    const skill = { damagePercent: 100 }

    expect(battleStore.checkAndApplyEchoing(hero, skill)).toBe(true)
  })

  it('should return splash percent from effect', () => {
    const hero = {
      statusEffects: [{ type: EffectType.ECHOING, splashPercent: 50 }]
    }

    expect(battleStore.getEchoingSplashPercent(hero)).toBe(50)
  })

  it('should consume ECHOING effect after use', () => {
    const hero = {
      statusEffects: [{ type: EffectType.ECHOING, splashPercent: 50 }]
    }

    battleStore.consumeEchoingEffect(hero)

    expect(hero.statusEffects.find(e => e.type === EffectType.ECHOING)).toBeUndefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-echoing.test.js`
Expected: FAIL

**Step 3: Implement ECHOING functions in battle.js**

Add near other effect processing functions:

```javascript
  function checkAndApplyEchoing(hero, skill) {
    const echoingEffect = hero?.statusEffects?.find(e => e.type === EffectType.ECHOING)
    if (!echoingEffect) return false

    // Only works on single-hit damaging skills
    if (skill.multiHit) return false
    if (skill.noDamage) return false
    if (!skill.damagePercent && !skill.damageMultiplier) return false

    return true
  }

  function getEchoingSplashPercent(hero) {
    const echoingEffect = hero?.statusEffects?.find(e => e.type === EffectType.ECHOING)
    return echoingEffect?.splashPercent || 0
  }

  function consumeEchoingEffect(hero) {
    if (hero?.statusEffects) {
      hero.statusEffects = hero.statusEffects.filter(e => e.type !== EffectType.ECHOING)
    }
  }
```

Add to exports:

```javascript
    checkAndApplyEchoing,
    getEchoingSplashPercent,
    consumeEchoingEffect,
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-echoing.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-echoing.test.js
git commit -m "feat: implement ECHOING AoE conversion helpers"
```

---

## Task 4: Implement DISCORDANT_RESONANCE Leader Skill

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-discordant-resonance.test.js`

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-discordant-resonance.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('DISCORDANT_RESONANCE leader skill', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have applyBattleStartDebuffLeaderEffect function', () => {
    expect(typeof battleStore.applyBattleStartDebuffLeaderEffect).toBe('function')
  })

  it('should apply DISCORDANT_RESONANCE to all allies', () => {
    const heroes = [
      { instanceId: 'h1', statusEffects: [] },
      { instanceId: 'h2', statusEffects: [] }
    ]

    const effect = {
      type: 'battle_start_debuff',
      target: 'all_allies',
      apply: {
        effectType: 'discordant_resonance',
        damageBonus: 15,
        healingPenalty: 30
      }
    }

    battleStore.applyBattleStartDebuffLeaderEffect(heroes, effect)

    expect(heroes[0].statusEffects).toHaveLength(1)
    expect(heroes[0].statusEffects[0].type).toBe(EffectType.DISCORDANT_RESONANCE)
    expect(heroes[0].statusEffects[0].damageBonus).toBe(15)
    expect(heroes[0].statusEffects[0].healingPenalty).toBe(30)

    expect(heroes[1].statusEffects).toHaveLength(1)
  })

  it('should have getDiscordantDamageBonus function', () => {
    const hero = {
      statusEffects: [{
        type: EffectType.DISCORDANT_RESONANCE,
        damageBonus: 15
      }]
    }

    expect(battleStore.getDiscordantDamageBonus(hero)).toBe(1.15)
  })

  it('should have getDiscordantHealingPenalty function', () => {
    const hero = {
      statusEffects: [{
        type: EffectType.DISCORDANT_RESONANCE,
        healingPenalty: 30
      }]
    }

    expect(battleStore.getDiscordantHealingPenalty(hero)).toBe(0.7)
  })

  it('should return 1.0 for damage bonus when no effect', () => {
    const hero = { statusEffects: [] }
    expect(battleStore.getDiscordantDamageBonus(hero)).toBe(1.0)
  })

  it('should return 1.0 for healing penalty when no effect', () => {
    const hero = { statusEffects: [] }
    expect(battleStore.getDiscordantHealingPenalty(hero)).toBe(1.0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-discordant-resonance.test.js`
Expected: FAIL

**Step 3: Implement DISCORDANT_RESONANCE functions in battle.js**

Add near other leader skill functions:

```javascript
  function applyBattleStartDebuffLeaderEffect(heroList, effect) {
    if (effect.type !== 'battle_start_debuff') return
    if (effect.target !== 'all_allies') return

    const { effectType, damageBonus, healingPenalty } = effect.apply

    for (const hero of heroList) {
      if (hero.currentHp > 0) {
        hero.statusEffects.push({
          type: EffectType.DISCORDANT_RESONANCE,
          duration: 999, // Lasts entire battle
          damageBonus: damageBonus || 0,
          healingPenalty: healingPenalty || 0,
          sourceId: 'leader_skill',
          definition: effectDefinitions[EffectType.DISCORDANT_RESONANCE]
        })
      }
    }
  }

  function getDiscordantDamageBonus(hero) {
    const effect = hero?.statusEffects?.find(e => e.type === EffectType.DISCORDANT_RESONANCE)
    if (!effect) return 1.0
    return 1 + (effect.damageBonus || 0) / 100
  }

  function getDiscordantHealingPenalty(hero) {
    const effect = hero?.statusEffects?.find(e => e.type === EffectType.DISCORDANT_RESONANCE)
    if (!effect) return 1.0
    return 1 - (effect.healingPenalty || 0) / 100
  }
```

Add to exports:

```javascript
    applyBattleStartDebuffLeaderEffect,
    getDiscordantDamageBonus,
    getDiscordantHealingPenalty,
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-discordant-resonance.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-discordant-resonance.test.js
git commit -m "feat: implement DISCORDANT_RESONANCE leader skill helpers"
```

---

## Task 5: Implement shieldPercentMaxHp Shield Calculation

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-shield-percent.test.js`

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-shield-percent.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('shieldPercentMaxHp calculation', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have calculateShieldFromPercentMaxHp function', () => {
    expect(typeof battleStore.calculateShieldFromPercentMaxHp).toBe('function')
  })

  it('should calculate shield as percentage of max HP', () => {
    const target = { maxHp: 1000 }
    const effect = { shieldPercentMaxHp: 25 }

    const shieldHp = battleStore.calculateShieldFromPercentMaxHp(target, effect)

    expect(shieldHp).toBe(250) // 25% of 1000
  })

  it('should return 0 if no shieldPercentMaxHp', () => {
    const target = { maxHp: 1000 }
    const effect = {}

    const shieldHp = battleStore.calculateShieldFromPercentMaxHp(target, effect)

    expect(shieldHp).toBe(0)
  })

  it('should floor the result', () => {
    const target = { maxHp: 333 }
    const effect = { shieldPercentMaxHp: 25 }

    const shieldHp = battleStore.calculateShieldFromPercentMaxHp(target, effect)

    expect(shieldHp).toBe(83) // floor(333 * 0.25)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-shield-percent.test.js`
Expected: FAIL

**Step 3: Implement calculateShieldFromPercentMaxHp in battle.js**

Add near other shield-related functions:

```javascript
  function calculateShieldFromPercentMaxHp(target, effect) {
    if (!effect.shieldPercentMaxHp) return 0
    const maxHp = target.maxHp || target.currentHp
    return Math.floor(maxHp * (effect.shieldPercentMaxHp / 100))
  }
```

Add to exports:

```javascript
    calculateShieldFromPercentMaxHp,
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-shield-percent.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-shield-percent.test.js
git commit -m "feat: implement shieldPercentMaxHp calculation"
```

---

## Task 6: Integrate Ally HP Cost Into Skill Execution

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-cacophon-skill-execution.test.js`

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-cacophon-skill-execution.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'

describe('Cacophon skill execution with HP cost', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have processAllyHpCostForSkill function', () => {
    expect(typeof battleStore.processAllyHpCostForSkill).toBe('function')
  })

  it('should apply HP cost to single target', () => {
    const caster = { instanceId: 'cacophon', templateId: 'cacophon' }
    const target = { instanceId: 'ally1', templateId: 'shadow_king', currentHp: 1000, maxHp: 1000 }
    const skill = { allyHpCostPercent: 5, targetType: 'ally' }

    battleStore.processAllyHpCostForSkill(caster, skill, [target])

    expect(target.currentHp).toBe(950)
    expect(battleStore.totalAllyHpLost).toBe(50)
  })

  it('should apply HP cost to all allies for all_allies skills', () => {
    const caster = { instanceId: 'cacophon', templateId: 'cacophon' }
    const allies = [
      { instanceId: 'ally1', templateId: 'shadow_king', currentHp: 1000, maxHp: 1000 },
      { instanceId: 'ally2', templateId: 'aurora', currentHp: 800, maxHp: 800 }
    ]
    const skill = { allyHpCostPercent: 5, targetType: 'all_allies' }

    battleStore.processAllyHpCostForSkill(caster, skill, allies)

    expect(allies[0].currentHp).toBe(950) // -50
    expect(allies[1].currentHp).toBe(760) // -40
    expect(battleStore.totalAllyHpLost).toBe(90) // 50 + 40
  })

  it('should skip Cacophon when applying HP cost', () => {
    const caster = { instanceId: 'cacophon', templateId: 'cacophon', currentHp: 500, maxHp: 500 }
    const allies = [
      caster,
      { instanceId: 'ally1', templateId: 'shadow_king', currentHp: 1000, maxHp: 1000 }
    ]
    const skill = { allyHpCostPercent: 5, targetType: 'all_allies' }

    battleStore.processAllyHpCostForSkill(caster, skill, allies)

    expect(caster.currentHp).toBe(500) // Unchanged
    expect(allies[1].currentHp).toBe(950) // -50
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-cacophon-skill-execution.test.js`
Expected: FAIL

**Step 3: Implement processAllyHpCostForSkill in battle.js**

Add near applyAllyHpCost:

```javascript
  function processAllyHpCostForSkill(caster, skill, targets) {
    if (!skill.allyHpCostPercent) return

    const isCacophonSkill = caster.templateId === 'cacophon'

    for (const target of targets) {
      applyAllyHpCost(target, skill.allyHpCostPercent, isCacophonSkill)
    }
  }
```

Add to exports:

```javascript
    processAllyHpCostForSkill,
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-cacophon-skill-execution.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-cacophon-skill-execution.test.js
git commit -m "feat: integrate ally HP cost into skill execution"
```

---

## Task 7: Integrate Suffering's Crescendo Into Finale Processing

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-cacophon-finale-integration.test.js`

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-cacophon-finale-integration.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('Cacophon Finale integration', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have processFinaleEffects function', () => {
    expect(typeof battleStore.processFinaleEffects).toBe('function')
  })

  it('should process suffering_crescendo finale effect', () => {
    // Simulate some HP lost
    battleStore.totalAllyHpLost = 1500

    const heroes = [
      { instanceId: 'h1', currentHp: 500, statusEffects: [] },
      { instanceId: 'h2', currentHp: 500, statusEffects: [] }
    ]

    const finaleEffect = {
      type: 'suffering_crescendo',
      baseBuff: 10,
      hpPerPercent: 150,
      maxBonus: 25,
      duration: 3
    }

    battleStore.processFinaleEffects(heroes, [finaleEffect])

    // 1500 / 150 = 10% bonus, 10 base + 10 = 20%
    expect(heroes[0].statusEffects).toHaveLength(2)
    expect(heroes[0].statusEffects[0].type).toBe(EffectType.ATK_UP)
    expect(heroes[0].statusEffects[0].value).toBe(20)
    expect(heroes[0].statusEffects[1].type).toBe(EffectType.DEF_UP)
    expect(heroes[0].statusEffects[1].value).toBe(20)
  })

  it('should reset HP tracking after processing finale', () => {
    battleStore.totalAllyHpLost = 1500

    const heroes = [{ instanceId: 'h1', currentHp: 500, statusEffects: [] }]
    const finaleEffect = {
      type: 'suffering_crescendo',
      baseBuff: 10,
      hpPerPercent: 150,
      maxBonus: 25,
      duration: 3
    }

    battleStore.processFinaleEffects(heroes, [finaleEffect])

    expect(battleStore.totalAllyHpLost).toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-cacophon-finale-integration.test.js`
Expected: FAIL

**Step 3: Implement processFinaleEffects in battle.js**

Add near other finale processing:

```javascript
  function processFinaleEffects(heroList, effects) {
    for (const effect of effects) {
      if (effect.type === 'suffering_crescendo') {
        processSufferingCrescendoFinale(heroList, effect)
      }
      // Add other finale effect types here as needed
    }
  }
```

Add to exports:

```javascript
    processFinaleEffects,
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-cacophon-finale-integration.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-cacophon-finale-integration.test.js
git commit -m "feat: integrate Suffering's Crescendo into Finale processing"
```

---

## Task 8: Full Integration Test

**Files:**
- Test: `src/stores/__tests__/battle-cacophon-full-integration.test.js`

**Step 1: Write comprehensive integration test**

Create `src/stores/__tests__/battle-cacophon-full-integration.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { cacophon } from '../../data/heroes/5star/cacophon.js'
import { EffectType } from '../../data/statusEffects.js'

describe('Cacophon full integration', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('Effect types', () => {
    it('should have all required effect types', () => {
      expect(EffectType.VICIOUS).toBe('vicious')
      expect(EffectType.SHATTERED_TEMPO).toBe('shattered_tempo')
      expect(EffectType.ECHOING).toBe('echoing')
      expect(EffectType.DISCORDANT_RESONANCE).toBe('discordant_resonance')
    })
  })

  describe('Hero data', () => {
    it('should have correct skills with allyHpCostPercent', () => {
      expect(cacophon.skills[0].allyHpCostPercent).toBe(5) // Discordant Anthem
      expect(cacophon.skills[1].allyHpCostPercent).toBe(5) // Vicious Verse
      expect(cacophon.skills[2].allyHpCostPercent).toBe(6) // Tempo Shatter
      expect(cacophon.skills[3].allyHpCostPercent).toBe(6) // Screaming Echo
      expect(cacophon.skills[4].allyHpCostPercent).toBe(5) // Warding Noise
    })

    it('should have Suffering\'s Crescendo finale', () => {
      expect(cacophon.finale.effects[0].type).toBe('suffering_crescendo')
      expect(cacophon.finale.effects[0].baseBuff).toBe(10)
      expect(cacophon.finale.effects[0].hpPerPercent).toBe(150)
      expect(cacophon.finale.effects[0].maxBonus).toBe(25)
    })

    it('should have Harmonic Bleeding leader skill', () => {
      expect(cacophon.leaderSkill.effects[0].type).toBe('battle_start_debuff')
      expect(cacophon.leaderSkill.effects[0].apply.damageBonus).toBe(15)
      expect(cacophon.leaderSkill.effects[0].apply.healingPenalty).toBe(30)
    })
  })

  describe('Battle mechanics', () => {
    it('should track HP lost across skill uses', () => {
      const ally = { instanceId: 'a1', templateId: 'shadow_king', currentHp: 1000, maxHp: 1000 }

      battleStore.applyAllyHpCost(ally, 5, true)
      battleStore.applyAllyHpCost(ally, 6, true)

      expect(battleStore.totalAllyHpLost).toBe(110)
    })

    it('should calculate VICIOUS bonus correctly', () => {
      const attacker = { statusEffects: [{ type: EffectType.VICIOUS, bonusDamagePercent: 30 }] }
      const target = { statusEffects: [{ type: EffectType.POISON, definition: { isBuff: false } }] }

      expect(battleStore.getViciousDamageMultiplier(attacker, target)).toBe(1.3)
    })

    it('should calculate DISCORDANT_RESONANCE bonuses correctly', () => {
      const hero = {
        statusEffects: [{
          type: EffectType.DISCORDANT_RESONANCE,
          damageBonus: 15,
          healingPenalty: 30
        }]
      }

      expect(battleStore.getDiscordantDamageBonus(hero)).toBe(1.15)
      expect(battleStore.getDiscordantHealingPenalty(hero)).toBe(0.7)
    })

    it('should calculate Finale buff based on HP lost', () => {
      battleStore.totalAllyHpLost = 2250 // 2250 / 150 = 15% bonus

      const bonus = battleStore.calculateSufferingCrescendoBonus(10, 150, 25)

      expect(bonus).toBe(25) // 10 base + 15 bonus
    })

    it('should cap Finale bonus at max', () => {
      battleStore.totalAllyHpLost = 6000 // Would be 40% bonus

      const bonus = battleStore.calculateSufferingCrescendoBonus(10, 150, 25)

      expect(bonus).toBe(35) // 10 base + 25 max bonus
    })
  })

  describe('Full skill rotation simulation', () => {
    it('should simulate a typical Cacophon rotation', () => {
      const cacophonUnit = {
        instanceId: 'cacophon1',
        templateId: 'cacophon',
        currentHp: 500,
        maxHp: 500,
        statusEffects: []
      }

      const ally1 = {
        instanceId: 'ally1',
        templateId: 'shadow_king',
        currentHp: 1000,
        maxHp: 1000,
        statusEffects: []
      }

      const ally2 = {
        instanceId: 'ally2',
        templateId: 'aurora',
        currentHp: 1200,
        maxHp: 1200,
        statusEffects: []
      }

      // Turn 1: Discordant Anthem (5% to all allies)
      battleStore.processAllyHpCostForSkill(cacophonUnit, cacophon.skills[0], [cacophonUnit, ally1, ally2])

      // Cacophon should be immune, allies should take damage
      expect(cacophonUnit.currentHp).toBe(500) // Immune
      expect(ally1.currentHp).toBe(950) // -50
      expect(ally2.currentHp).toBe(1140) // -60

      // Turn 2: Vicious Verse on ally1 (5%)
      battleStore.processAllyHpCostForSkill(cacophonUnit, cacophon.skills[1], [ally1])
      expect(ally1.currentHp).toBe(900) // -50 more

      // Turn 3: Tempo Shatter on ally1 (6%)
      battleStore.processAllyHpCostForSkill(cacophonUnit, cacophon.skills[2], [ally1])
      expect(ally1.currentHp).toBe(840) // -60 more

      // Total HP lost: 50 + 60 + 50 + 60 = 220
      expect(battleStore.totalAllyHpLost).toBe(220)

      // Finale triggers: 220 / 150 = 1% bonus
      // Total buff: 10 base + 1 bonus = 11%
      const bonus = battleStore.calculateSufferingCrescendoBonus(10, 150, 25)
      expect(bonus).toBe(11)
    })
  })
})
```

**Step 2: Run the full test suite**

Run: `npm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/stores/__tests__/battle-cacophon-full-integration.test.js
git commit -m "test: add comprehensive Cacophon integration tests"
```

---

## Summary

**Parallelization Strategy:**

```
Group A (Tasks 1-3): Damage/Turn mechanics — Run in parallel
    ↓
Group B (Tasks 4-5): Leader skill + shield — Run in parallel
    ↓
Group C (Tasks 6-7): Skill execution integration — Run in parallel
    ↓
Group D (Task 8): Full integration test
```

**Total new commits:** 8
**Total tests added:** ~40

**After completion, Cacophon will be fully playable with:**
- VICIOUS damage bonus vs debuffed enemies
- SHATTERED_TEMPO turn order priority
- ECHOING AoE conversion (helper functions ready for skill execution hookup)
- DISCORDANT_RESONANCE leader skill application
- Ally HP cost on all her skills
- shieldPercentMaxHp for Warding Noise
- Suffering's Crescendo Finale with HP tracking
