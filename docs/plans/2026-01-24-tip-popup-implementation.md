# Tip Popup System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a reusable one-time popup notification system for tutorial tips with speech bubble positioning and localStorage persistence.

**Architecture:** Create a Pinia store (`tips.js`) for state/persistence, a data file (`tips.js`) for tip definitions, and a global Vue component (`TipPopup.vue`) mounted in App.vue. Tips are shown via `showTip(id)` and dismissed by tap/click.

**Tech Stack:** Vue 3, Pinia, localStorage

---

### Task 1: Create Tip Definitions Data File

**Files:**
- Create: `src/data/tips.js`

**Step 1: Create the tips data file**

```js
// src/data/tips.js

export const tips = {
  genus_loci_intro: {
    title: 'Genus Loci',
    message: 'These tougher than normal boss fights require a key to access, but yield greater rewards for your merging and summoning needs.',
    anchor: 'genus-loci-list'
  },
  explorations_intro: {
    title: 'Explorations',
    message: 'Send heroes on expeditions to gather resources while you\'re away. Higher rank explorations yield better rewards.',
    anchor: 'exploration-panel'
  }
}

export function getTip(tipId) {
  return tips[tipId] || null
}
```

**Step 2: Commit**

```bash
git add src/data/tips.js
git commit -m "feat: add tip definitions data file"
```

---

### Task 2: Create Tips Pinia Store

**Files:**
- Create: `src/stores/tips.js`
- Modify: `src/stores/index.js`

**Step 1: Create the tips store**

```js
// src/stores/tips.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tips } from '../data/tips.js'

const STORAGE_KEY = 'dorf_seen_tips'

export const useTipsStore = defineStore('tips', () => {
  // Persisted state - Set of tip IDs the player has dismissed
  const seenTips = ref(new Set())

  // Transient state - currently displayed tip
  const activeTip = ref(null)
  const anchorElement = ref(null)

  /**
   * Show a tip if not already seen
   * @param {string} tipId - ID of the tip to show
   * @param {object} options - Optional overrides (e.g., { anchor: 'custom-id' })
   * @returns {boolean} - True if tip was shown, false if already seen
   */
  function showTip(tipId, options = {}) {
    if (seenTips.value.has(tipId)) return false

    const tipData = tips[tipId]
    if (!tipData) {
      console.warn(`Tip not found: ${tipId}`)
      return false
    }

    // If another tip is showing, don't interrupt
    if (activeTip.value) return false

    activeTip.value = { id: tipId, ...tipData, ...options }

    // Find anchor element if specified
    const anchorId = options.anchor || tipData.anchor
    if (anchorId) {
      // Use nextTick timing to ensure DOM is ready
      setTimeout(() => {
        anchorElement.value = document.getElementById(anchorId)
      }, 0)
    }

    return true
  }

  /**
   * Dismiss the current tip and mark it as seen
   */
  function dismissTip() {
    if (activeTip.value) {
      seenTips.value.add(activeTip.value.id)
      activeTip.value = null
      anchorElement.value = null
      saveTips()
    }
  }

  /**
   * Save seen tips to localStorage
   */
  function saveTips() {
    try {
      const data = Array.from(seenTips.value)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save tips:', e)
    }
  }

  /**
   * Load seen tips from localStorage
   */
  function loadTips() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        seenTips.value = new Set(data)
      }
    } catch (e) {
      console.error('Failed to load tips:', e)
    }
  }

  /**
   * Reset all tips (for testing/admin)
   */
  function resetTips() {
    seenTips.value = new Set()
    activeTip.value = null
    anchorElement.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    seenTips,
    activeTip,
    anchorElement,
    showTip,
    dismissTip,
    loadTips,
    saveTips,
    resetTips
  }
})
```

**Step 2: Export store from index**

In `src/stores/index.js`, add this line after the other exports:

```js
export { useTipsStore } from './tips.js'
```

**Step 3: Commit**

```bash
git add src/stores/tips.js src/stores/index.js
git commit -m "feat: add tips store with localStorage persistence"
```

---

### Task 3: Create TipPopup Component

**Files:**
- Create: `src/components/TipPopup.vue`
- Modify: `src/components/index.js`

**Step 1: Create the TipPopup component**

```vue
<!-- src/components/TipPopup.vue -->
<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useTipsStore } from '../stores/tips.js'

const tipsStore = useTipsStore()

const tip = computed(() => tipsStore.activeTip)
const anchorEl = computed(() => tipsStore.anchorElement)

// Position state
const cardStyle = ref({})
const pointerStyle = ref({})
const hasAnchor = ref(false)

function dismiss() {
  tipsStore.dismissTip()
}

function calculatePosition() {
  if (!tip.value) return

  const anchor = anchorEl.value
  if (!anchor) {
    // Center position (no anchor)
    hasAnchor.value = false
    cardStyle.value = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
    pointerStyle.value = {}
    return
  }

  hasAnchor.value = true
  const rect = anchor.getBoundingClientRect()
  const cardWidth = 320
  const cardHeight = 180 // Approximate
  const padding = 16
  const pointerSize = 12

  // Calculate horizontal position (centered on anchor)
  let left = rect.left + rect.width / 2 - cardWidth / 2
  left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding))

  // Calculate vertical position (prefer below)
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top

  let top
  let pointerTop
  let pointerDirection

  if (spaceBelow >= cardHeight + pointerSize + padding) {
    // Position below anchor
    top = rect.bottom + pointerSize
    pointerDirection = 'up'
    pointerTop = -pointerSize
  } else if (spaceAbove >= cardHeight + pointerSize + padding) {
    // Position above anchor
    top = rect.top - cardHeight - pointerSize
    pointerDirection = 'down'
    pointerTop = cardHeight
  } else {
    // Fallback to center
    hasAnchor.value = false
    cardStyle.value = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
    pointerStyle.value = {}
    return
  }

  cardStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`
  }

  // Position pointer to point at anchor center
  const pointerLeft = rect.left + rect.width / 2 - left - pointerSize / 2
  pointerStyle.value = {
    left: `${Math.max(padding, Math.min(pointerLeft, cardWidth - padding - pointerSize))}px`,
    top: pointerDirection === 'up' ? `${pointerTop}px` : `${pointerTop}px`,
    transform: pointerDirection === 'down' ? 'rotate(180deg)' : ''
  }
}

// Recalculate on anchor change or window resize
watch([tip, anchorEl], () => {
  if (tip.value) {
    // Small delay to ensure DOM is ready
    setTimeout(calculatePosition, 10)
  }
})

let resizeHandler = null
onMounted(() => {
  resizeHandler = () => {
    if (tip.value) calculatePosition()
  }
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="tip" class="tip-overlay" @click="dismiss">
      <div
        class="tip-card"
        :class="{ 'has-anchor': hasAnchor }"
        :style="cardStyle"
        @click.stop
      >
        <div v-if="hasAnchor" class="tip-pointer" :style="pointerStyle"></div>
        <h3 class="tip-title">{{ tip.title }}</h3>
        <p class="tip-message">{{ tip.message }}</p>
        <button class="tip-button" @click="dismiss">Got it</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tip-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
}

.tip-card {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 20px;
  max-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 1001;
}

.tip-card.has-anchor {
  position: fixed;
}

.tip-pointer {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 12px solid #1f2937;
}

.tip-title {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
}

.tip-message {
  margin: 0 0 20px 0;
  font-size: 0.95rem;
  color: #9ca3af;
  line-height: 1.5;
}

.tip-button {
  display: block;
  width: 100%;
  padding: 12px 24px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 8px;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tip-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}
</style>
```

**Step 2: Export component from index**

In `src/components/index.js`, add this line after the other exports:

```js
export { default as TipPopup } from './TipPopup.vue'
```

**Step 3: Commit**

```bash
git add src/components/TipPopup.vue src/components/index.js
git commit -m "feat: add TipPopup component with positioning logic"
```

---

### Task 4: Mount TipPopup in App.vue and Load Tips

**Files:**
- Modify: `src/App.vue`

**Step 1: Import TipPopup and tips store**

At the top of the `<script setup>` section, add imports. After the existing store imports line:

```js
import { useHeroesStore, useGachaStore, useQuestsStore, useInventoryStore, useShardsStore, useGenusLociStore, useExplorationsStore } from './stores'
```

Change it to:

```js
import { useHeroesStore, useGachaStore, useQuestsStore, useInventoryStore, useShardsStore, useGenusLociStore, useExplorationsStore, useTipsStore } from './stores'
```

After the component imports, add:

```js
import TipPopup from './components/TipPopup.vue'
```

**Step 2: Initialize tips store**

After the other store initializations (around line 31), add:

```js
const tipsStore = useTipsStore()
```

**Step 3: Load tips in onMounted**

In the `onMounted` callback, add this line right after `const hasData = hasSaveData()`:

```js
tipsStore.loadTips()
```

**Step 4: Add TipPopup to template**

In the template, after the `ExplorationCompletePopup` component (around line 318), add:

```vue
      <!-- Tip Popup (global) -->
      <TipPopup />
```

**Step 5: Commit**

```bash
git add src/App.vue
git commit -m "feat: mount TipPopup globally and load tips on startup"
```

---

### Task 5: Add Tip Trigger to GenusLociListScreen

**Files:**
- Modify: `src/screens/GenusLociListScreen.vue`

**Step 1: Import tips store and onMounted**

Change the script imports from:

```js
import { computed } from 'vue'
import { useGenusLociStore } from '../stores'
```

To:

```js
import { computed, onMounted } from 'vue'
import { useGenusLociStore, useTipsStore } from '../stores'
```

**Step 2: Initialize tips store and show tip**

After `const genusLociStore = useGenusLociStore()`, add:

```js
const tipsStore = useTipsStore()

onMounted(() => {
  tipsStore.showTip('genus_loci_intro')
})
```

**Step 3: Add anchor ID to boss section**

Change the boss section div from:

```html
<section class="boss-section">
```

To:

```html
<section id="genus-loci-list" class="boss-section">
```

**Step 4: Commit**

```bash
git add src/screens/GenusLociListScreen.vue
git commit -m "feat: add genus loci intro tip trigger"
```

---

### Task 6: Add Tip Trigger to ExplorationsScreen

**Files:**
- Modify: `src/screens/ExplorationsScreen.vue`

**Step 1: Import tips store**

Change the store import from:

```js
import { useExplorationsStore, useHeroesStore, useGachaStore, useInventoryStore } from '../stores'
```

To:

```js
import { useExplorationsStore, useHeroesStore, useGachaStore, useInventoryStore, useTipsStore } from '../stores'
```

**Step 2: Initialize tips store and show tip**

After `const heroesStore = useHeroesStore()`, add:

```js
const tipsStore = useTipsStore()
```

**Step 3: Show tip in onMounted**

Find the existing `onMounted` hook and add the tip trigger at the start of it:

```js
onMounted(() => {
  tipsStore.showTip('explorations_intro')
  timer = setInterval(() => {
    tick.value++
  }, 60000)
})
```

**Step 4: Add anchor ID to content section**

Change the explorations content div from:

```html
<div class="explorations-content">
```

To:

```html
<div id="exploration-panel" class="explorations-content">
```

**Step 5: Commit**

```bash
git add src/screens/ExplorationsScreen.vue
git commit -m "feat: add explorations intro tip trigger"
```

---

### Task 7: Test the Implementation

**Step 1: Run the dev server**

```bash
npm run dev
```

**Step 2: Manual testing checklist**

1. Open the app in browser
2. Navigate to Genus Loci List screen - tip should appear pointing at boss section
3. Dismiss by clicking overlay or "Got it" button
4. Navigate away and back - tip should NOT appear again
5. Navigate to Explorations screen - tip should appear pointing at content
6. Dismiss tip
7. Refresh page - neither tip should reappear (localStorage persisted)
8. Open DevTools > Application > Local Storage - verify `dorf_seen_tips` key exists

**Step 3: Run tests to ensure no regressions**

```bash
npm test
```

Expected: All 210 tests pass

**Step 4: Final commit**

```bash
git add -A
git commit -m "test: verify tip popup system works correctly"
```

---

### Task 8: Merge Feature Branch

**Step 1: Checkout main and merge**

```bash
cd /home/deltran/code/dorf
git checkout main
git merge feature/tip-popup --no-ff -m "feat: add tip popup notification system"
```

**Step 2: Clean up worktree**

```bash
git worktree remove .worktrees/tip-popup
git branch -d feature/tip-popup
```
