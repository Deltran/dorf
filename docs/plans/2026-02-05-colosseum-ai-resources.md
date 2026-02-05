# Colosseum AI Resource Systems Implementation Plan

> **For Claude:** Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Enable all colosseum AI enemy classes to properly use their resource systems.

**Already Complete:** Alchemist (Essence) - implemented in previous commit.

---

## Resource Systems Overview

| Class | Resource | AI Approach |
|-------|----------|-------------|
| Paladin, Mage, Cleric, Druid | MP | Cooldown faking |
| Berserker | Rage | Full tracking |
| Knight | Valor | Damage-based gain + passive +10/turn |
| Ranger | Focus | Not-hit recovery |
| Bard | Verse | Full tracking + finale |

---

## Task 0: Filter Unusable Skills

**Problem:** Some hero skills don't work for AI enemies:
- **Taunt skills** - No logic to restrict player targeting
- **Ally-targeting skills** - AI has no allies

**Approach:** Filter these out in the skill selection logic.

**Files:**
- `src/stores/__tests__/battle-colosseum-ai.test.js` - Add tests
- `src/stores/battle.js` - Add skill filter

### Implementation

**Step 1: Add tests**

```javascript
describe('unusable skill filtering', () => {
  it('should filter out taunt skills for colosseum enemies', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentCooldowns: {},
      template: {
        skills: [
          {
            name: 'Challenge',
            targetType: 'self',
            effects: [{ type: 'taunt' }]
          },
          { name: 'Shield Bash', targetType: 'enemy', damagePercent: 80 }
        ]
      }
    }

    const readySkills = mockEnemy.template.skills.filter(s => {
      if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
      // Filter out taunt skills for AI
      if (mockEnemy.isColosseumEnemy && s.effects?.some(e => e.type === 'taunt')) return false
      return true
    })

    expect(readySkills.length).toBe(1)
    expect(readySkills[0].name).toBe('Shield Bash')
  })

  it('should filter out ally-targeting skills for colosseum enemies', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentCooldowns: {},
      template: {
        skills: [
          { name: 'Oath of Protection', targetType: 'ally', noDamage: true },
          { name: 'Shield Bash', targetType: 'enemy', damagePercent: 80 }
        ]
      }
    }

    const readySkills = mockEnemy.template.skills.filter(s => {
      if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
      // Filter out ally-targeting skills for AI
      if (mockEnemy.isColosseumEnemy && s.targetType === 'ally') return false
      return true
    })

    expect(readySkills.length).toBe(1)
    expect(readySkills[0].name).toBe('Shield Bash')
  })
})
```

**Step 2: Add filter in executeEnemyTurn**

In the `readySkills` filter:

```javascript
// Filter out unusable skills for colosseum enemies
if (enemy.isColosseumEnemy) {
  // No taunt (not implemented for enemies)
  if (s.effects?.some(e => e.type === 'taunt')) return false
  // No ally-targeting (AI has no allies)
  if (s.targetType === 'ally') return false
}
```

---

## Task 1: MP Classes - Cooldown Faking

**Classes:** Paladin, Mage, Cleric, Druid

**Approach:** Don't track MP. After using a skill, apply a cooldown (2-3 turns) to prevent spam.

**Files:**
- `src/stores/__tests__/battle-colosseum-ai.test.js` - Add tests
- `src/stores/battle.js` - Add cooldown assignment for MP skills

### Implementation

**Step 1: Add tests**

```javascript
describe('MP class cooldown faking', () => {
  it('should apply cooldown to MP skills after use for colosseum enemies', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentCooldowns: {},
      template: {
        skills: [
          { name: 'Holy Light', mpCost: 20, damagePercent: 100 }
        ]
      }
    }

    const skill = mockEnemy.template.skills[0]

    // Simulate cooldown assignment for MP skills
    if (skill.mpCost && mockEnemy.isColosseumEnemy) {
      mockEnemy.currentCooldowns[skill.name] = 3 // 3-turn cooldown
    }

    expect(mockEnemy.currentCooldowns['Holy Light']).toBe(3)
  })

  it('should not apply fake cooldown to non-colosseum enemies', () => {
    const mockEnemy = {
      id: 'enemy_0',
      isColosseumEnemy: false,
      currentCooldowns: {},
      template: {
        skills: [
          { name: 'Fireball', mpCost: 15, cooldown: 2 }
        ]
      }
    }

    const skill = mockEnemy.template.skills[0]

    // Regular enemies use their defined cooldown
    if (skill.mpCost && mockEnemy.isColosseumEnemy) {
      mockEnemy.currentCooldowns[skill.name] = 3
    } else if (skill.cooldown) {
      mockEnemy.currentCooldowns[skill.name] = skill.cooldown + 1
    }

    expect(mockEnemy.currentCooldowns['Fireball']).toBe(3) // Original cooldown + 1
  })
})
```

**Step 2: Modify battle.js**

In `executeEnemyTurn`, after skill execution, where cooldowns are set (around line 4631):

```javascript
// After skill use, set cooldown
if (skill.cooldown) {
  enemy.currentCooldowns[skill.name] = skill.cooldown + 1
}
// ADD: Fake cooldown for MP skills on colosseum enemies
else if (skill.mpCost && enemy.isColosseumEnemy) {
  enemy.currentCooldowns[skill.name] = 3 // 3-turn cooldown
}
```

This needs to be added in all places where cooldowns are set after skill use.

---

## Task 2: Berserker - Rage Tracking

**Approach:**
- Initialize `currentRage: 0`
- +10 rage when attacking (basic or skill)
- +10 rage when taking damage
- Check `rageCost` in skill filter
- Handle `rageCost: 'all'` (consume all, scale damage)

**Files:**
- `src/stores/__tests__/battle-colosseum-ai.test.js` - Add tests
- `src/stores/battle.js` - Add rage logic

### Implementation

**Step 1: Add tests**

```javascript
describe('Berserker rage tracking', () => {
  it('should filter out skills when not enough rage', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentRage: 20,
      currentCooldowns: {},
      class: { resourceType: 'rage' },
      template: {
        skills: [
          { name: 'Reckless Swing', rageCost: 30, damagePercent: 150 },
          { name: 'Battle Cry', rageCost: 10, targetType: 'self' }
        ]
      }
    }

    const readySkills = mockEnemy.template.skills.filter(s => {
      if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
      if (s.rageCost && mockEnemy.currentRage !== undefined) {
        if (s.rageCost !== 'all' && mockEnemy.currentRage < s.rageCost) return false
        if (s.rageCost === 'all' && mockEnemy.currentRage === 0) return false
      }
      return true
    })

    expect(readySkills.length).toBe(1)
    expect(readySkills[0].name).toBe('Battle Cry')
  })

  it('should gain rage when attacking', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentRage: 20,
      class: { resourceType: 'rage' }
    }

    // Simulate rage gain on attack
    if (mockEnemy.class?.resourceType === 'rage') {
      mockEnemy.currentRage = Math.min(100, mockEnemy.currentRage + 10)
    }

    expect(mockEnemy.currentRage).toBe(30)
  })

  it('should gain rage when taking damage', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentRage: 40,
      class: { resourceType: 'rage' }
    }

    // Simulate rage gain on damage
    if (mockEnemy.class?.resourceType === 'rage') {
      mockEnemy.currentRage = Math.min(100, mockEnemy.currentRage + 10)
    }

    expect(mockEnemy.currentRage).toBe(50)
  })

  it('should deduct rage when using skill', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentRage: 50,
      class: { resourceType: 'rage' }
    }

    const skill = { name: 'Reckless Swing', rageCost: 30 }

    if (skill.rageCost && mockEnemy.currentRage !== undefined) {
      if (skill.rageCost === 'all') {
        mockEnemy.currentRage = 0
      } else {
        mockEnemy.currentRage -= skill.rageCost
      }
    }

    expect(mockEnemy.currentRage).toBe(20)
  })

  it('should consume all rage for rageCost: all skills', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentRage: 80,
      class: { resourceType: 'rage' }
    }

    const skill = { name: 'Rampage', rageCost: 'all', damagePercent: 100 }

    const rageConsumed = mockEnemy.currentRage
    if (skill.rageCost === 'all') {
      mockEnemy.currentRage = 0
    }

    expect(mockEnemy.currentRage).toBe(0)
    expect(rageConsumed).toBe(80) // For damage scaling
  })
})
```

**Step 2: Initialize rage in createColosseumEnemies**

In `createColosseumEnemies`, add:

```javascript
currentRage: template.class?.resourceType === 'rage' ? 0 : undefined,
```

**Step 3: Add rage cost check in skill filter**

In `executeEnemyTurn` readySkills filter:

```javascript
// Check rage cost for colosseum berserkers
if (s.rageCost && enemy.currentRage !== undefined) {
  if (s.rageCost !== 'all' && enemy.currentRage < s.rageCost) return false
  if (s.rageCost === 'all' && enemy.currentRage === 0) return false
}
```

**Step 4: Add rage deduction when skill used**

After skill selection:

```javascript
// Deduct rage cost for colosseum berserkers
if (skill.rageCost && enemy.currentRage !== undefined) {
  if (skill.rageCost === 'all') {
    enemy.currentRage = 0
  } else {
    enemy.currentRage -= skill.rageCost
  }
}
```

**Step 5: Add rage gain on attack**

After enemy attacks (basic or skill):

```javascript
// Gain rage on attack for colosseum berserkers
if (enemy.isColosseumEnemy && enemy.class?.resourceType === 'rage') {
  enemy.currentRage = Math.min(100, enemy.currentRage + 10)
}
```

**Step 6: Add rage gain on damage**

In `applyDamage`, when a colosseum berserker takes damage:

```javascript
// Gain rage when hit for colosseum berserkers
if (target.isColosseumEnemy && target.class?.resourceType === 'rage') {
  target.currentRage = Math.min(100, (target.currentRage || 0) + 10)
}
```

---

## Task 3: Knight - Valor Tracking

**Approach:**
- Initialize `currentValor: 0`
- **+10 valor at turn start** (passive, emulates protecting allies)
- +5 valor when taking damage
- Check `valorRequired` in skill filter
- Cap at 100

**Files:**
- `src/stores/__tests__/battle-colosseum-ai.test.js` - Add tests
- `src/stores/battle.js` - Add valor logic

### Implementation

**Step 1: Add tests**

```javascript
describe('Knight valor tracking', () => {
  it('should filter out skills when not enough valor', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentValor: 15,
      currentCooldowns: {},
      class: { resourceType: 'valor' },
      template: {
        skills: [
          { name: 'Shield Bash', valorRequired: 25, damagePercent: 120 },
          { name: 'Defensive Stance', valorRequired: 0, targetType: 'self' }
        ]
      }
    }

    const readySkills = mockEnemy.template.skills.filter(s => {
      if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
      if (s.valorRequired !== undefined && mockEnemy.currentValor !== undefined) {
        if (mockEnemy.currentValor < s.valorRequired) return false
      }
      return true
    })

    expect(readySkills.length).toBe(1)
    expect(readySkills[0].name).toBe('Defensive Stance')
  })

  it('should gain valor when taking damage', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentValor: 20,
      class: { resourceType: 'valor' }
    }

    // Simulate valor gain on damage
    if (mockEnemy.class?.resourceType === 'valor') {
      mockEnemy.currentValor = Math.min(100, mockEnemy.currentValor + 5)
    }

    expect(mockEnemy.currentValor).toBe(25)
  })

  it('should gain passive valor at turn start', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentValor: 10,
      class: { resourceType: 'valor' }
    }

    // Simulate turn start passive gain
    if (mockEnemy.class?.resourceType === 'valor') {
      mockEnemy.currentValor = Math.min(100, mockEnemy.currentValor + 10)
    }

    expect(mockEnemy.currentValor).toBe(20)
  })

  it('should cap valor at 100', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentValor: 98,
      class: { resourceType: 'valor' }
    }

    if (mockEnemy.class?.resourceType === 'valor') {
      mockEnemy.currentValor = Math.min(100, mockEnemy.currentValor + 5)
    }

    expect(mockEnemy.currentValor).toBe(100)
  })
})
```

**Step 2: Initialize valor in createColosseumEnemies**

```javascript
currentValor: template.class?.resourceType === 'valor' ? 0 : undefined,
```

**Step 3: Add valor check in skill filter**

```javascript
// Check valor requirement for colosseum knights
if (s.valorRequired !== undefined && enemy.currentValor !== undefined) {
  if (enemy.currentValor < s.valorRequired) return false
}
```

**Step 4: Add valor gain on damage**

In `applyDamage`:

```javascript
// Gain valor when hit for colosseum knights
if (target.isColosseumEnemy && target.class?.resourceType === 'valor') {
  target.currentValor = Math.min(100, (target.currentValor || 0) + 5)
}
```

---

## Task 4: Ranger - Focus Tracking

**Approach:**
- Initialize `hasFocus: true`
- Lose focus when hit
- Regain focus at turn start if didn't take damage since last turn
- Track via `tookDamageSinceLastTurn` flag

**Files:**
- `src/stores/__tests__/battle-colosseum-ai.test.js` - Add tests
- `src/stores/battle.js` - Add focus logic

### Implementation

**Step 1: Add tests**

```javascript
describe('Ranger focus tracking', () => {
  it('should filter out skills when focus is lost', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      hasFocus: false,
      currentCooldowns: {},
      class: { resourceType: 'focus' },
      template: {
        skills: [
          { name: 'Precise Shot', damagePercent: 150 },
          { name: 'Evasive Roll', targetType: 'self' }
        ]
      }
    }

    const readySkills = mockEnemy.template.skills.filter(s => {
      if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
      // Rangers need focus to use skills
      if (mockEnemy.class?.resourceType === 'focus' && !mockEnemy.hasFocus) return false
      return true
    })

    expect(readySkills.length).toBe(0) // No skills without focus
  })

  it('should allow skills when focused', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      hasFocus: true,
      currentCooldowns: {},
      class: { resourceType: 'focus' },
      template: {
        skills: [
          { name: 'Precise Shot', damagePercent: 150 }
        ]
      }
    }

    const readySkills = mockEnemy.template.skills.filter(s => {
      if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
      if (mockEnemy.class?.resourceType === 'focus' && !mockEnemy.hasFocus) return false
      return true
    })

    expect(readySkills.length).toBe(1)
  })

  it('should lose focus when hit', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      hasFocus: true,
      tookDamageSinceLastTurn: false,
      class: { resourceType: 'focus' }
    }

    // Simulate taking damage
    if (mockEnemy.class?.resourceType === 'focus') {
      mockEnemy.hasFocus = false
      mockEnemy.tookDamageSinceLastTurn = true
    }

    expect(mockEnemy.hasFocus).toBe(false)
    expect(mockEnemy.tookDamageSinceLastTurn).toBe(true)
  })

  it('should regain focus at turn start if not hit', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      hasFocus: false,
      tookDamageSinceLastTurn: false,
      class: { resourceType: 'focus' }
    }

    // Turn start check
    if (mockEnemy.class?.resourceType === 'focus' && !mockEnemy.tookDamageSinceLastTurn) {
      mockEnemy.hasFocus = true
    }
    mockEnemy.tookDamageSinceLastTurn = false // Reset for next turn

    expect(mockEnemy.hasFocus).toBe(true)
  })

  it('should not regain focus if hit during round', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      hasFocus: false,
      tookDamageSinceLastTurn: true,
      class: { resourceType: 'focus' }
    }

    // Turn start check
    if (mockEnemy.class?.resourceType === 'focus' && !mockEnemy.tookDamageSinceLastTurn) {
      mockEnemy.hasFocus = true
    }
    mockEnemy.tookDamageSinceLastTurn = false // Reset for next turn

    expect(mockEnemy.hasFocus).toBe(false) // Still unfocused
  })
})
```

**Step 2: Initialize focus in createColosseumEnemies**

```javascript
hasFocus: template.class?.resourceType === 'focus' ? true : undefined,
tookDamageSinceLastTurn: template.class?.resourceType === 'focus' ? false : undefined,
```

**Step 3: Add focus check in skill filter**

```javascript
// Check focus for colosseum rangers
if (enemy.class?.resourceType === 'focus' && !enemy.hasFocus) return false
```

**Step 4: Lose focus on damage**

In `applyDamage`:

```javascript
// Lose focus when hit for colosseum rangers
if (target.isColosseumEnemy && target.class?.resourceType === 'focus') {
  target.hasFocus = false
  target.tookDamageSinceLastTurn = true
}
```

**Step 5: Regain focus at turn start**

In `startNextTurn`, for colosseum enemies:

```javascript
// Focus recovery for colosseum rangers
if (enemy.isColosseumEnemy && enemy.class?.resourceType === 'focus') {
  if (!enemy.tookDamageSinceLastTurn) {
    enemy.hasFocus = true
  }
  enemy.tookDamageSinceLastTurn = false // Reset for next round
}
```

---

## Task 5: Bard - Verse Tracking

**Approach:**
- Initialize `currentVerses: 0`, `lastSkillName: null`
- Can't repeat same skill (check `lastSkillName`)
- +1 verse per skill use
- At 3 verses → auto-trigger finale at turn start, then reset
- 1-skill bards: skip verse/repeat mechanics

**Files:**
- `src/stores/__tests__/battle-colosseum-ai.test.js` - Add tests
- `src/stores/battle.js` - Add verse logic

### Implementation

**Step 1: Add tests**

```javascript
describe('Bard verse tracking', () => {
  it('should not allow repeating the same skill', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentVerses: 1,
      lastSkillName: 'Inspiring Melody',
      currentCooldowns: {},
      class: { resourceType: 'verse' },
      template: {
        skills: [
          { name: 'Inspiring Melody', targetType: 'all_allies' },
          { name: 'Discordant Note', damagePercent: 80 }
        ]
      }
    }

    const readySkills = mockEnemy.template.skills.filter(s => {
      if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
      // Bards can't repeat skills
      if (mockEnemy.class?.resourceType === 'verse') {
        if (mockEnemy.template.skills.length > 1 && s.name === mockEnemy.lastSkillName) return false
      }
      return true
    })

    expect(readySkills.length).toBe(1)
    expect(readySkills[0].name).toBe('Discordant Note')
  })

  it('should gain verse when using skill', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentVerses: 1,
      lastSkillName: null,
      class: { resourceType: 'verse' },
      template: {
        skills: [
          { name: 'Inspiring Melody' },
          { name: 'Discordant Note' }
        ]
      }
    }

    const skill = { name: 'Discordant Note' }

    // Simulate verse gain
    if (mockEnemy.class?.resourceType === 'verse' && mockEnemy.template.skills.length > 1) {
      mockEnemy.currentVerses = Math.min(3, mockEnemy.currentVerses + 1)
      mockEnemy.lastSkillName = skill.name
    }

    expect(mockEnemy.currentVerses).toBe(2)
    expect(mockEnemy.lastSkillName).toBe('Discordant Note')
  })

  it('should trigger finale at 3 verses', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentVerses: 3,
      lastSkillName: 'Discordant Note',
      class: { resourceType: 'verse' },
      template: {
        name: 'Chroma',
        finale: {
          name: 'Chromatic Crescendo',
          target: 'all_enemies',
          effects: [{ type: 'damage', value: 50 }]
        }
      }
    }

    let finaleTriggered = false

    // Turn start check
    if (mockEnemy.class?.resourceType === 'verse' && mockEnemy.currentVerses >= 3) {
      finaleTriggered = true
      mockEnemy.currentVerses = 0
      mockEnemy.lastSkillName = null
    }

    expect(finaleTriggered).toBe(true)
    expect(mockEnemy.currentVerses).toBe(0)
    expect(mockEnemy.lastSkillName).toBe(null)
  })

  it('should skip verse mechanics for 1-skill bards', () => {
    const mockEnemy = {
      id: 'colosseum_0',
      isColosseumEnemy: true,
      currentVerses: 0,
      lastSkillName: 'Only Skill',
      currentCooldowns: {},
      class: { resourceType: 'verse' },
      template: {
        skills: [
          { name: 'Only Skill', damagePercent: 100 }
        ]
      }
    }

    // 1-skill bards can repeat their skill
    const readySkills = mockEnemy.template.skills.filter(s => {
      if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
      if (mockEnemy.class?.resourceType === 'verse') {
        if (mockEnemy.template.skills.length > 1 && s.name === mockEnemy.lastSkillName) return false
      }
      return true
    })

    expect(readySkills.length).toBe(1) // Can use the skill
  })
})
```

**Step 2: Initialize verse in createColosseumEnemies**

```javascript
currentVerses: template.class?.resourceType === 'verse' ? 0 : undefined,
lastSkillName: template.class?.resourceType === 'verse' ? null : undefined,
```

**Step 3: Add verse repeat check in skill filter**

```javascript
// Bards can't repeat skills (unless 1-skill bard)
if (enemy.class?.resourceType === 'verse') {
  const skillCount = enemy.template.skills?.length || 0
  if (skillCount > 1 && s.name === enemy.lastSkillName) return false
}
```

**Step 4: Add verse gain on skill use**

After skill use:

```javascript
// Gain verse for colosseum bards
if (enemy.isColosseumEnemy && enemy.class?.resourceType === 'verse') {
  const skillCount = enemy.template.skills?.length || 0
  if (skillCount > 1) {
    enemy.currentVerses = Math.min(3, (enemy.currentVerses || 0) + 1)
    enemy.lastSkillName = skill.name
  }
}
```

**Step 5: Trigger finale at turn start**

In `startNextTurn`, for colosseum enemies:

```javascript
// Finale trigger for colosseum bards
if (enemy.isColosseumEnemy && enemy.class?.resourceType === 'verse' && enemy.currentVerses >= 3) {
  // Execute finale
  if (enemy.template.finale) {
    executeFinale(enemy) // May need to implement or reuse existing finale logic
  }
  enemy.currentVerses = 0
  enemy.lastSkillName = null
}
```

---

## Summary of Changes by File

### `src/stores/battle.js`

| Location | Change |
|----------|--------|
| `createColosseumEnemies` | Initialize rage, valor, focus, verse properties |
| `executeEnemyTurn` skill filter | Add rage, valor, focus, verse checks |
| `executeEnemyTurn` after skill use | Deduct rage, gain verse, update lastSkillName, apply MP cooldown |
| `executeEnemyTurn` after attack | Gain rage on attack |
| `startNextTurn` enemy section | Focus recovery, finale trigger |
| `applyDamage` | Rage/valor gain on damage, focus loss on hit |

### `src/stores/__tests__/battle-colosseum-ai.test.js`

Add test suites for each resource type.

---

## Execution Order

1. **Task 1: MP cooldown faking** - Simplest, affects most classes
2. **Task 2: Berserker rage** - Medium complexity
3. **Task 3: Knight valor** - Similar to rage but simpler
4. **Task 4: Ranger focus** - Unique binary mechanic
5. **Task 5: Bard verse** - Most complex (finale integration)

---

## Post-Implementation

1. Run full test suite: `npx vitest run`
2. Manual test: Start colosseum battles with each class type
3. Verify skill usage patterns match expected behavior
