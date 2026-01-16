# Leader Skill System - Design Document

## Overview

Add leader skills to legendary (5-star) heroes. When a hero is designated as the party leader, their leader skill affects the entire team during battle. Any party member can be designated leader, but only legendaries provide a gameplay benefit.

## Goals

- Give legendary heroes additional value beyond stats/skills
- Add strategic depth to party composition
- Flexible system that can be extended with new effect types later

## Data Model

### Leader Skill Definition

Added to hero templates for 5-star heroes in `heroTemplates.js`:

```js
shadow_king: {
  id: 'shadow_king',
  name: 'The Shadow King',
  rarity: 5,
  classId: 'berserker',
  baseStats: { ... },
  skill: { ... },
  leaderSkill: {
    name: 'Lord of Shadows',
    description: 'On round 1, all allies gain +25% ATK for 2 turns',
    effects: [
      {
        type: 'timed',
        triggerRound: 1,
        target: 'all_allies',
        apply: {
          effectType: 'atk_up',
          duration: 2,
          value: 25
        }
      }
    ]
  }
}

aurora_the_dawn: {
  id: 'aurora_the_dawn',
  name: 'Aurora the Dawn',
  rarity: 5,
  classId: 'paladin',
  baseStats: { ... },
  skill: { ... },
  leaderSkill: {
    name: "Dawn's Protection",
    description: 'Non-knight allies gain +15% DEF',
    effects: [
      {
        type: 'passive',
        stat: 'def',
        value: 15,
        condition: { classId: { not: 'knight' } }
      }
    ]
  }
}
```

### Effect Types

**Passive effects** - Always active during battle, not shown as status icons:

```js
{
  type: 'passive',
  stat: 'atk' | 'def' | 'spd',
  value: 15,  // percentage
  condition: { ... } | null
}
```

**Timed effects** - Trigger at specific round, use existing status effect system:

```js
{
  type: 'timed',
  triggerRound: 1,
  target: 'all_allies' | 'all_enemies',
  apply: {
    effectType: 'atk_up',  // any EffectType from statusEffects.js
    duration: 2,
    value: 25
  },
  condition: { ... } | null
}
```

### Condition Format

Conditions filter which units are affected:

| Condition | Meaning |
|-----------|---------|
| `null` or omitted | Applies to all |
| `{ classId: 'knight' }` | Only knights |
| `{ classId: { not: 'knight' } }` | Everyone except knights |
| `{ role: 'dps' }` | Only DPS role (mage, berserker, ranger) |
| `{ role: { not: 'tank' } }` | Everyone except tanks |

## Party Leader Storage

### heroes.js Store Changes

**New state:**

```js
const partyLeader = ref(null)  // instanceId of the leader
```

**New getter:**

```js
const leaderHero = computed(() => {
  if (!partyLeader.value) return null
  return collection.value.find(h => h.instanceId === partyLeader.value) || null
})
```

**New action:**

```js
function setPartyLeader(instanceId) {
  // Only allow setting leader if hero is in party (or null to clear)
  if (instanceId && !party.value.includes(instanceId)) {
    return false
  }
  partyLeader.value = instanceId
  return true
}
```

**Updated clearPartySlot:**

```js
function clearPartySlot(slotIndex) {
  const removedId = party.value[slotIndex]
  if (removedId === partyLeader.value) {
    partyLeader.value = null
  }
  party.value[slotIndex] = null
  return true
}
```

**Updated persistence:**

```js
function saveState() {
  return {
    collection: collection.value,
    party: party.value,
    partyLeader: partyLeader.value
  }
}

function loadState(savedState) {
  if (savedState.collection) collection.value = savedState.collection
  if (savedState.party) party.value = savedState.party
  if (savedState.partyLeader !== undefined) partyLeader.value = savedState.partyLeader
}
```

## Battle Integration

### battle.js Changes

**New helper to get active leader skill:**

```js
function getActiveLeaderSkill() {
  const heroesStore = useHeroesStore()
  const leaderId = heroesStore.partyLeader
  if (!leaderId) return null

  const leader = heroes.value.find(h => h.instanceId === leaderId)
  if (!leader) return null

  return leader.template?.leaderSkill || null
}
```

**Condition matcher:**

```js
function matchesCondition(unit, condition) {
  if (!condition) return true

  const template = unit.template
  if (!template) return false

  // Class-based conditions
  if (condition.classId) {
    if (typeof condition.classId === 'string') {
      if (template.classId !== condition.classId) return false
    } else if (condition.classId.not) {
      if (template.classId === condition.classId.not) return false
    }
  }

  // Role-based conditions
  if (condition.role) {
    const heroClass = getClass(template.classId)
    if (!heroClass) return false

    if (typeof condition.role === 'string') {
      if (heroClass.role !== condition.role) return false
    } else if (condition.role.not) {
      if (heroClass.role === condition.role.not) return false
    }
  }

  return true
}
```

**Target resolver:**

```js
function getLeaderEffectTargets(targetType, condition) {
  let targets = []

  if (targetType === 'all_allies') {
    targets = aliveHeroes.value
  } else if (targetType === 'all_enemies') {
    targets = aliveEnemies.value
  }

  if (condition) {
    targets = targets.filter(t => matchesCondition(t, condition))
  }

  return targets
}
```

**Apply passive effects at battle init:**

```js
function initBattle(partyState, enemyTemplateIds) {
  // ... existing hero/enemy setup ...

  // Apply passive leader skill effects
  applyPassiveLeaderEffects()

  calculateTurnOrder()
  // ... rest of init ...
}

function applyPassiveLeaderEffects() {
  const leaderSkill = getActiveLeaderSkill()
  if (!leaderSkill) return

  for (const effect of leaderSkill.effects) {
    if (effect.type !== 'passive') continue

    for (const hero of heroes.value) {
      if (matchesCondition(hero, effect.condition)) {
        if (!hero.leaderBonuses) hero.leaderBonuses = {}
        hero.leaderBonuses[effect.stat] = (hero.leaderBonuses[effect.stat] || 0) + effect.value
      }
    }
  }
}
```

**Apply timed effects at round start:**

```js
function advanceTurnIndex() {
  currentTurnIndex.value++
  if (currentTurnIndex.value >= turnOrder.value.length) {
    currentTurnIndex.value = 0
    roundNumber.value++

    // Check for round-triggered leader effects
    applyTimedLeaderEffects(roundNumber.value)

    // ... existing MP recovery, cooldown reduction, etc. ...
  }
}

function applyTimedLeaderEffects(round) {
  const leaderSkill = getActiveLeaderSkill()
  if (!leaderSkill) return

  for (const effect of leaderSkill.effects) {
    if (effect.type !== 'timed') continue
    if (effect.triggerRound !== round) continue

    const targets = getLeaderEffectTargets(effect.target, effect.condition)

    for (const target of targets) {
      applyEffect(target, effect.apply.effectType, {
        duration: effect.apply.duration,
        value: effect.apply.value,
        sourceId: 'leader_skill'
      })
    }

    // Log the leader skill activation
    addLog(`Leader skill: ${leaderSkill.name} activates!`)
  }
}
```

**Update getEffectiveStat to include leader bonuses:**

```js
function getEffectiveStat(unit, statName) {
  const baseStat = unit.stats[statName] || 0
  let modifier = 0

  // Existing status effect modifiers
  for (const effect of unit.statusEffects || []) {
    const def = effect.definition
    if (def.stat === statName) {
      if (effect.type.includes('_up')) {
        modifier += effect.value
      } else if (effect.type.includes('_down')) {
        modifier -= effect.value
      }
    }
  }

  // Add passive leader bonuses
  if (unit.leaderBonuses?.[statName]) {
    modifier += unit.leaderBonuses[statName]
  }

  return Math.max(1, Math.floor(baseStat * (1 + modifier / 100)))
}
```

## UI Changes

### Party Screen (HeroesScreen.vue)

**Leader indicator on party slots:**

- Small crown icon on the party slot if that hero is the leader
- Crown only shows if a leader is set and matches that slot

**Hero detail panel:**

- For 5-star heroes, show "Leader Skill" section with name and description
- "Set as Leader" button (or "Leader" indicator if already set)
- Button disabled/hidden if hero is not in party

### Battle Stats Display

When inspecting a hero during battle, show leader bonus breakdown:

```
ATK: 45 (+7 from leader)  → 52
DEF: 30                   → 30
SPD: 18                   → 18
```

Only show the bonus notation for stats that have a leader bonus applied.

## Files Changed

- `src/data/heroTemplates.js` - Add leaderSkill to legendary heroes
- `src/stores/heroes.js` - Add partyLeader state, getter, actions, persistence
- `src/stores/battle.js` - Add leader skill application logic
- `src/components/HeroesScreen.vue` - Leader toggle button, crown indicator
- `src/components/HeroDetailPanel.vue` - Leader skill display (if separate component)
- `src/components/BattleScreen.vue` - Leader bonus in stats inspection (if shown)

## Future Extensions

The system is designed to support additional effect types later:

- **Triggered effects**: `type: 'on_ally_death'`, `type: 'on_kill'`
- **Resource modifiers**: `type: 'passive'` with `stat: 'mp'` or `mpRegen`
- **Scaling effects**: condition with `{ partyCount: { classId: 'knight' } }` for "+2% ATK per knight"
- **Battle start heals**: `type: 'timed'` with `triggerRound: 1` and `effectType: 'regen'`
