# Leader Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add leader skills to legendary heroes that buff the party when designated as leader.

**Architecture:** Leader skills are defined on hero templates. The heroes store tracks which party member is leader. The battle store applies passive bonuses at init and timed effects at round triggers.

**Tech Stack:** Vue 3, Pinia stores, existing status effect system

---

## Task 1: Add Leader Skills to Hero Templates

**Files:**
- Modify: `src/data/heroTemplates.js:16-43`

**Step 1: Add leaderSkill to shadow_king**

In `heroTemplates.js`, add `leaderSkill` property to `shadow_king`:

```js
shadow_king: {
  id: 'shadow_king',
  name: 'The Shadow King',
  rarity: 5,
  classId: 'berserker',
  baseStats: { hp: 110, atk: 55, def: 25, spd: 18, mp: 50 },
  skill: {
    name: 'Void Strike',
    description: 'Deal 200% ATK damage to one enemy, ignoring 50% of their DEF',
    mpCost: 25,
    targetType: 'enemy'
  },
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
},
```

**Step 2: Add leaderSkill to aurora_the_dawn**

Add `leaderSkill` property to `aurora_the_dawn`:

```js
aurora_the_dawn: {
  id: 'aurora_the_dawn',
  name: 'Aurora the Dawn',
  rarity: 5,
  classId: 'paladin',
  baseStats: { hp: 150, atk: 35, def: 50, spd: 12, mp: 60 },
  skill: {
    name: 'Divine Radiance',
    description: 'Deal 150% ATK damage to all enemies and heal all allies for 20% of damage dealt',
    mpCost: 30,
    targetType: 'all_enemies'
  },
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
},
```

**Step 3: Verify changes**

Open the app, navigate to Heroes screen, and confirm the two legendary heroes still display correctly.

**Step 4: Commit**

```bash
git add src/data/heroTemplates.js
git commit -m "feat: add leader skills to legendary heroes"
```

---

## Task 2: Add Party Leader State to Heroes Store

**Files:**
- Modify: `src/stores/heroes.js`

**Step 1: Add partyLeader ref**

After line 9 (`const party = ref([null, null, null, null])`), add:

```js
const partyLeader = ref(null) // instanceId of the party leader
```

**Step 2: Add leaderHero computed**

After the `availableForParty` computed (around line 28), add:

```js
const leaderHero = computed(() => {
  if (!partyLeader.value) return null
  return collection.value.find(h => h.instanceId === partyLeader.value) || null
})
```

**Step 3: Add setPartyLeader action**

After the `clearPartySlot` function, add:

```js
function setPartyLeader(instanceId) {
  // Allow null to clear leader, or valid party member
  if (instanceId && !party.value.includes(instanceId)) {
    return false
  }
  partyLeader.value = instanceId
  return true
}
```

**Step 4: Update clearPartySlot to clear leader if removed**

Modify `clearPartySlot`:

```js
function clearPartySlot(slotIndex) {
  if (slotIndex < 0 || slotIndex > 3) return false
  const removedId = party.value[slotIndex]
  if (removedId === partyLeader.value) {
    partyLeader.value = null
  }
  party.value[slotIndex] = null
  return true
}
```

**Step 5: Update removeHero to clear leader**

Modify `removeHero`:

```js
function removeHero(instanceId) {
  // Clear leader if this hero was leader
  if (instanceId === partyLeader.value) {
    partyLeader.value = null
  }
  // Remove from party if present
  party.value = party.value.map(id => id === instanceId ? null : id)
  // Remove from collection
  collection.value = collection.value.filter(h => h.instanceId !== instanceId)
}
```

**Step 6: Update saveState**

Modify `saveState`:

```js
function saveState() {
  return {
    collection: collection.value,
    party: party.value,
    partyLeader: partyLeader.value
  }
}
```

**Step 7: Update loadState**

Modify `loadState`:

```js
function loadState(savedState) {
  if (savedState.collection) collection.value = savedState.collection
  if (savedState.party) party.value = savedState.party
  if (savedState.partyLeader !== undefined) partyLeader.value = savedState.partyLeader
}
```

**Step 8: Update return statement**

Add to return object:

```js
return {
  // State
  collection,
  party,
  partyLeader,
  // Getters
  heroCount,
  partyHeroes,
  partyIsFull,
  availableForParty,
  leaderHero,
  // Actions
  addHero,
  removeHero,
  setPartySlot,
  clearPartySlot,
  setPartyLeader,
  autoFillParty,
  // ... rest unchanged
}
```

**Step 9: Verify changes**

Open the app, open browser console, and verify no errors. The store now tracks leader state.

**Step 10: Commit**

```bash
git add src/stores/heroes.js
git commit -m "feat: add partyLeader state to heroes store"
```

---

## Task 3: Add Condition Matching Helper to Battle Store

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add getClass import**

At the top of the file, update imports:

```js
import { getClass } from '../data/classes.js'
```

**Step 2: Add matchesCondition helper**

After the `getEffectDefinition` import area (around line 6), add this helper function inside the store definition, after `getSkillByIndex`:

```js
// Check if a unit matches a leader skill condition
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

**Step 3: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat: add matchesCondition helper for leader skills"
```

---

## Task 4: Add Leader Skill Application Functions

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add getActiveLeaderSkill helper**

After `matchesCondition`, add:

```js
// Get the active leader skill from the party leader
function getActiveLeaderSkill() {
  const heroesStore = useHeroesStore()
  const leaderId = heroesStore.partyLeader
  if (!leaderId) return null

  const leader = heroes.value.find(h => h.instanceId === leaderId)
  if (!leader) return null

  return leader.template?.leaderSkill || null
}
```

**Step 2: Add getLeaderEffectTargets helper**

After `getActiveLeaderSkill`, add:

```js
// Get targets for a leader skill effect
function getLeaderEffectTargets(targetType, condition) {
  let targets = []

  if (targetType === 'all_allies') {
    targets = [...aliveHeroes.value]
  } else if (targetType === 'all_enemies') {
    targets = [...aliveEnemies.value]
  }

  if (condition) {
    targets = targets.filter(t => matchesCondition(t, condition))
  }

  return targets
}
```

**Step 3: Add applyPassiveLeaderEffects function**

After `getLeaderEffectTargets`, add:

```js
// Apply passive leader skill effects at battle start
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

  addLog(`Leader skill: ${leaderSkill.name} is active!`)
}
```

**Step 4: Add applyTimedLeaderEffects function**

After `applyPassiveLeaderEffects`, add:

```js
// Apply timed leader skill effects at round start
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

    addLog(`Leader skill: ${leaderSkill.name} activates!`)
  }
}
```

**Step 5: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat: add leader skill application functions"
```

---

## Task 5: Integrate Leader Skills into Battle Flow

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Call applyPassiveLeaderEffects in initBattle**

In `initBattle`, after the enemy initialization loop and before `calculateTurnOrder()`, add:

```js
// Apply passive leader skill effects
applyPassiveLeaderEffects()
```

The section should look like:

```js
// ... enemy initialization loop ends ...

// Apply passive leader skill effects
applyPassiveLeaderEffects()

calculateTurnOrder()

state.value = BattleState.STARTING
addLog(`Battle start! Round ${roundNumber.value}`)
```

**Step 2: Call applyTimedLeaderEffects in advanceTurnIndex**

In `advanceTurnIndex`, after incrementing `roundNumber` and the log, add the timed effects call:

```js
function advanceTurnIndex() {
  currentTurnIndex.value++
  if (currentTurnIndex.value >= turnOrder.value.length) {
    currentTurnIndex.value = 0
    roundNumber.value++
    addLog(`--- Round ${roundNumber.value} ---`)

    // Check for round-triggered leader effects
    applyTimedLeaderEffects(roundNumber.value)

    // MP recovery at start of round
    for (const hero of heroes.value) {
      // ... existing code
    }
```

**Step 3: Also apply timed effects for round 1**

In `initBattle`, after calling `applyPassiveLeaderEffects()`, add:

```js
// Apply passive leader skill effects
applyPassiveLeaderEffects()

// Apply round 1 timed effects
applyTimedLeaderEffects(1)
```

**Step 4: Update getEffectiveStat to include leader bonuses**

Modify `getEffectiveStat` to include leader bonuses:

```js
function getEffectiveStat(unit, statName) {
  const baseStat = unit.stats[statName] || 0
  let modifier = 0

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

**Step 5: Verify by starting a battle**

Set a legendary as leader, start a battle, and check the battle log for leader skill messages.

**Step 6: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat: integrate leader skills into battle flow"
```

---

## Task 6: Add Leader UI to HeroesScreen - Detail Panel

**Files:**
- Modify: `src/screens/HeroesScreen.vue`

**Step 1: Add isLeader helper function**

In the `<script setup>` section, add:

```js
function isLeader(instanceId) {
  return heroesStore.partyLeader === instanceId
}

function toggleLeader(hero) {
  if (isLeader(hero.instanceId)) {
    heroesStore.setPartyLeader(null)
  } else {
    heroesStore.setPartyLeader(hero.instanceId)
  }
}
```

**Step 2: Add Leader Skill section to detail panel**

In the template, after the Skills section (around line 330) and before `<div class="detail-actions">`, add:

```html
<!-- Leader Skill Section (5-star only) -->
<template v-if="selectedHero.template.rarity === 5 && selectedHero.template.leaderSkill">
  <div class="section-header leader-header">
    <div class="section-line"></div>
    <h4>Leader Skill</h4>
    <div class="section-line"></div>
  </div>
  <div class="leader-skill-info">
    <div class="leader-skill-name">{{ selectedHero.template.leaderSkill.name }}</div>
    <div class="leader-skill-desc">{{ selectedHero.template.leaderSkill.description }}</div>
  </div>
</template>
```

**Step 3: Update detail-actions to include leader button**

Replace the existing `<div class="detail-actions">` section with:

```html
<div class="detail-actions">
  <template v-if="isInParty(selectedHero.instanceId)">
    <button
      v-if="selectedHero.template.rarity === 5 && selectedHero.template.leaderSkill"
      :class="['leader-btn', { active: isLeader(selectedHero.instanceId) }]"
      @click="toggleLeader(selectedHero)"
    >
      <span class="leader-icon">👑</span>
      <span>{{ isLeader(selectedHero.instanceId) ? 'Leader' : 'Set as Leader' }}</span>
    </button>
    <span v-else class="in-party-badge">
      <span class="badge-icon">✓</span>
      <span>In Party</span>
    </span>
  </template>
  <button
    v-else
    class="add-to-party-btn"
    @click="startPlacing(selectedHero)"
  >
    <span>Add to Party</span>
  </button>
</div>
```

**Step 4: Add styles for leader skill section**

Add to `<style scoped>`:

```css
/* ===== Leader Skill ===== */
.leader-header {
  margin-top: 20px;
}

.leader-skill-info {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(55, 65, 81, 0.3) 100%);
  padding: 14px;
  border-radius: 12px;
  border-left: 3px solid #f59e0b;
}

.leader-skill-name {
  font-weight: 600;
  color: #fbbf24;
  font-size: 0.95rem;
  margin-bottom: 6px;
}

.leader-skill-desc {
  font-size: 0.85rem;
  color: #9ca3af;
  line-height: 1.4;
}

.leader-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 2px solid #4b5563;
  color: #f3f4f6;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.leader-btn:hover {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
}

.leader-btn.active {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-color: #f59e0b;
  color: #0f172a;
}

.leader-icon {
  font-size: 1rem;
}
```

**Step 5: Verify UI**

Open Heroes screen, select a 5-star hero, and verify the Leader Skill section appears with the Set as Leader button.

**Step 6: Commit**

```bash
git add src/screens/HeroesScreen.vue
git commit -m "feat: add leader skill display and toggle to detail panel"
```

---

## Task 7: Add Leader Crown to Party Slots

**Files:**
- Modify: `src/screens/HeroesScreen.vue`

**Step 1: Update party slot template**

In the party-slots section, update the filled slot template to show a crown for the leader:

Replace the `<template v-if="slot.hero">` section with:

```html
<template v-if="slot.hero">
  <div class="party-slot-content">
    <div v-if="isLeader(slot.hero.instanceId)" class="leader-crown">👑</div>
    <HeroCard
      :hero="slot.hero"
      showStats
      @click="selectHero(slot.hero)"
    />
  </div>
  <button
    class="remove-btn"
    @click.stop="removeFromParty(slot.index)"
  >
    <span>Remove</span>
  </button>
</template>
```

**Step 2: Add styles for leader crown**

Add to `<style scoped>`:

```css
/* ===== Party Slot Leader Crown ===== */
.party-slot-content {
  position: relative;
  flex: 1;
}

.leader-crown {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 1.5rem;
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  animation: crownBob 2s ease-in-out infinite;
}

@keyframes crownBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
```

**Step 3: Verify crown displays**

Set a legendary as leader, view the Party tab, and confirm the crown appears on the leader's slot.

**Step 4: Commit**

```bash
git add src/screens/HeroesScreen.vue
git commit -m "feat: add leader crown indicator to party slots"
```

---

## Task 8: Final Integration Test

**Step 1: Full flow test**

1. Open the app
2. Navigate to Heroes screen
3. Add Shadow King to party
4. Set Shadow King as leader (tap, then "Set as Leader")
5. Verify crown appears on party slot
6. Start a battle from Quests
7. Verify battle log shows "Leader skill: Lord of Shadows is active!" at battle start
8. Verify "Leader skill: Lord of Shadows activates!" appears on round 1
9. Check that party members have ATK Up buff

**Step 2: Test Aurora passive**

1. Set Aurora the Dawn as leader instead
2. Start a battle
3. Verify non-knight heroes have boosted DEF (visible in stats if you add inspection UI, or via battle calculations)

**Step 3: Test leader removal**

1. Remove the leader from party
2. Verify crown disappears
3. Verify `partyLeader` is cleared (check store in Vue devtools)

**Step 4: Test save/load**

1. Set a leader
2. Refresh the page
3. Verify leader persists after reload

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: address any issues found during integration testing"
```

---

## Task 9: Merge to Main

**Step 1: Review all changes**

```bash
git log --oneline main..HEAD
git diff main..HEAD --stat
```

**Step 2: Merge to main**

```bash
git checkout main
git merge feature/leader-skill --no-ff -m "feat: add leader skill system for legendary heroes"
```

**Step 3: Clean up worktree**

```bash
cd /home/deltran/code/dorf
git worktree remove .worktrees/leader-skill
git branch -d feature/leader-skill
```
