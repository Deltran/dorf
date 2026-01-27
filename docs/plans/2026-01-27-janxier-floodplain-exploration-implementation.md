# Janxier Floodplain Exploration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an exploration node to the Janxier Floodplain region, including a new token item and a new `uniqueClasses` party request condition.

**Architecture:** Three small data/logic changes: add a token item, add an exploration quest node, and extend the party request condition checker to support `uniqueClasses`.

**Tech Stack:** Vue 3, Pinia stores, JavaScript

---

### Task 1: Add Janxier Floodplain Token

**Files:**
- Modify: `src/data/items.js:170-178` (add new token before closing brace)

**Step 1: Add the token entry**

In `src/data/items.js`, add a new token after `token_gate_to_aquaria`:

```js
  token_gate_to_aquaria: {
    id: 'token_gate_to_aquaria',
    name: 'Gate to Aquaria Token',
    description: 'Instantly collect rewards from a completed Gate to Aquaria quest.',
    type: 'token',
    rarity: 3,
    region: 'Gate to Aquaria'
  },
  token_janxier_floodplain: {
    id: 'token_janxier_floodplain',
    name: 'Janxier Floodplain Token',
    description: 'Instantly collect rewards from a completed Janxier Floodplain quest.',
    type: 'token',
    rarity: 3,
    region: 'Janxier Floodplain'
  }
}
```

Note: Add a comma after the `token_gate_to_aquaria` closing brace.

**Step 2: Verify no syntax errors**

Run: `npx vite build --mode development 2>&1 | head -5`
Expected: No errors

**Step 3: Commit**

```bash
git add src/data/items.js
git commit -m "feat: add Janxier Floodplain token item"
```

---

### Task 2: Add Flood Exploration Quest Node

**Files:**
- Modify: `src/data/questNodes.js:1157-1158` (insert after flood_07, before Old Fort Calindash comment)

**Step 1: Add the exploration node**

In `src/data/questNodes.js`, insert between `flood_07` closing brace (line 1157) and the Old Fort Calindash comment (line 1159):

```js
  flood_exploration: {
    id: 'flood_exploration',
    name: 'Janxier Floodplain Exploration',
    region: 'Janxier Floodplain',
    x: 620,
    y: 450,
    type: 'exploration',
    unlockedBy: 'flood_03',
    backgroundId: 'flood_01',
    connections: [],
    explorationConfig: {
      requiredFights: 65,
      timeLimit: 300,
      rewards: { gold: 600, gems: 25, xp: 350 },
      requiredCrestId: 'pyroclast_crest',
      itemDrops: [
        { itemId: 'tome_large', chance: 0.4 },
        { itemId: 'token_blistering_cliffs', chance: 0.15 },
        { itemId: 'token_janxier_floodplain', chance: 0.15 }
      ],
      partyRequest: {
        description: 'Diverse scouts (3+ different classes)',
        conditions: [
          { uniqueClasses: 3 }
        ]
      }
    }
  },
```

**Step 2: Verify no syntax errors**

Run: `npx vite build --mode development 2>&1 | head -5`
Expected: No errors

**Step 3: Commit**

```bash
git add src/data/questNodes.js
git commit -m "feat: add Janxier Floodplain exploration node"
```

---

### Task 3: Add uniqueClasses Party Request Condition

**Files:**
- Modify: `src/stores/explorations.js:174-183` (add uniqueClasses check inside the condition loop)

**Step 1: Add the condition check**

In `src/stores/explorations.js`, inside the `checkPartyRequest` function, the `for (const condition of conditions)` loop currently checks `condition.role` and `condition.classId`. Add a third check for `condition.uniqueClasses` after the existing two:

```js
    for (const condition of conditions) {
      if (condition.role) {
        const count = heroData.filter(h => h.role === condition.role).length
        if (count < condition.count) return false
      }
      if (condition.classId) {
        const count = heroData.filter(h => h.classId === condition.classId).length
        if (count < condition.count) return false
      }
      if (condition.uniqueClasses) {
        const uniqueCount = new Set(heroData.map(h => h.classId)).size
        if (uniqueCount < condition.uniqueClasses) return false
      }
    }
```

**Step 2: Verify no syntax errors**

Run: `npx vite build --mode development 2>&1 | head -5`
Expected: No errors

**Step 3: Commit**

```bash
git add src/stores/explorations.js
git commit -m "feat: add uniqueClasses party request condition for explorations"
```
