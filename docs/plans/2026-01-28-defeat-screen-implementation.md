# Defeat Screen Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use the dorf-vue-developer skill for Vue component work and dorf-javascript-developer skill for JS logic.

**Goal:** Replace the instant-popup defeat modal with a somber, full-viewport defeat experience featuring phased transitions, fallen hero display, and distinct Genus Loci treatment.

**Architecture:** All changes in `src/screens/BattleScreen.vue`. Replace `showDefeatModal` ref with a `defeatPhase` state machine (`null` -> `'fading'` -> `'reveal'` -> `'complete'`). Remove the old modal markup/styles and add a full-viewport defeat scene with CSS transitions. Genus Loci defeats additionally show the boss portrait.

**Tech Stack:** Vue 3 (Composition API), scoped CSS transitions, existing HeroCard component

**Design doc:** `docs/plans/2026-01-28-defeat-screen-design.md`

---

### Task 1: Replace state management (showDefeatModal -> defeatPhase)

**Files:**
- Modify: `src/screens/BattleScreen.vue:92` (state declaration)
- Modify: `src/screens/BattleScreen.vue:496-504` (handleDefeat function)

**Step 1: Replace the ref declaration**

At line 92, replace:
```js
const showDefeatModal = ref(false)
```

With:
```js
const defeatPhase = ref(null) // null | 'fading' | 'reveal' | 'complete'
const defeatFlavorText = ref('')

const DEFEAT_LINES = [
  'The darkness claims another party.',
  'Even legends fall.',
  'Silence where battle cries once echoed.',
  'The road ends here... for now.',
  'They gave everything. It wasn\'t enough.',
]
```

**Step 2: Replace the handleDefeat function**

At lines 496-504, replace the entire `handleDefeat()` function with:

```js
function handleDefeat() {
  if (!isGenusLociBattle.value) {
    questsStore.failRun()
  }

  // Pick random flavor text
  defeatFlavorText.value = DEFEAT_LINES[Math.floor(Math.random() * DEFEAT_LINES.length)]

  // Phase 1: Start battlefield fade
  defeatPhase.value = 'fading'

  // Phase 2: After fade completes, reveal defeat content
  setTimeout(() => {
    defeatPhase.value = 'reveal'

    // Phase 3: Mark complete after staggered reveals finish
    setTimeout(() => {
      defeatPhase.value = 'complete'
    }, 800)
  }, 1500)
}
```

**Step 3: Add Genus Loci portrait computed**

After line 108 (`isGenusLociBattle` computed), add:

```js
const currentGenusLociName = computed(() => {
  if (!isGenusLociBattle.value || !battleStore.genusLociMeta) return ''
  const id = battleStore.genusLociMeta.genusLociId
  // Get enemy name from the enemies array
  const enemy = battleStore.enemies?.[0]
  return enemy?.name || id
})

const genusLociPortraitUrl = computed(() => {
  if (!isGenusLociBattle.value || !battleStore.genusLociMeta) return null
  const bossId = battleStore.genusLociMeta.genusLociId
  const portraitPath = `../assets/enemies/${bossId}_portrait.png`
  return enemyPortraits[portraitPath] || null
})
```

Note: `enemyPortraits` is already declared at line 701 via glob import.

**Step 4: Verify the app still builds**

Run: `npm run dev` (check for compilation errors in terminal)
Expected: No errors. Defeat modal won't show anymore (old ref removed, new template not yet added).

**Step 5: Commit**

```
git add src/screens/BattleScreen.vue
git commit -m "refactor: replace showDefeatModal with phased defeatPhase state"
```

---

### Task 2: Add battle container fade class

**Files:**
- Modify: `src/screens/BattleScreen.vue:966` (template - battle-screen div)
- Modify: `src/screens/BattleScreen.vue` (styles section)

**Step 1: Add dynamic class to battle container**

At line 966, replace:
```html
<div class="battle-screen">
```

With:
```html
<div class="battle-screen" :class="{ 'battle-defeat-fading': defeatPhase }">
```

This applies the grayscale+dim filter as soon as defeat begins and keeps it applied through all phases.

**Step 2: Add the CSS transition style**

In the `<style scoped>` section, add after the existing `.battle-screen` styles:

```css
/* ===== Defeat Battlefield Fade ===== */
.battle-screen {
  transition: filter 1.5s ease-out;
}

.battle-defeat-fading {
  filter: grayscale(1) brightness(0.3);
}
```

Note: If `.battle-screen` already has a `transition` property, append `filter 1.5s ease-out` to the existing value rather than overriding.

**Step 3: Verify the fade works**

Run the app, enter a battle, and trigger a defeat. The battlefield should slowly drain of color over 1.5 seconds.

**Step 4: Commit**

```
git add src/screens/BattleScreen.vue
git commit -m "feat: add battlefield grayscale fade on defeat"
```

---

### Task 3: Replace defeat modal with full-viewport defeat scene

**Files:**
- Modify: `src/screens/BattleScreen.vue:1326-1337` (template - remove old modal)
- Modify: `src/screens/BattleScreen.vue` (template - add new defeat scene)

**Step 1: Remove the old defeat modal markup**

Delete lines 1326-1337 (the entire `<!-- Defeat Modal -->` block):

```html
<!-- Defeat Modal -->
<div v-if="showDefeatModal" class="modal-overlay">
  <div class="modal defeat-modal">
    <h2>Defeat</h2>
    <p>Your party has been wiped out...</p>

    <div class="modal-actions">
      <button class="btn-primary" @click="returnToMap">Try Again</button>
      <button class="btn-secondary" @click="returnHome">Home</button>
    </div>
  </div>
</div>
```

**Step 2: Add the new defeat scene in the same location**

Insert in place of the removed modal:

```html
<!-- Defeat Scene -->
<div v-if="defeatPhase" class="defeat-scene">
  <!-- Genus Loci: Boss portrait looming above -->
  <div v-if="isGenusLociBattle && genusLociPortraitUrl" class="defeat-boss-portrait"
       :class="{ visible: defeatPhase !== 'fading' }">
    <img :src="genusLociPortraitUrl" :alt="currentGenusLociName" />
  </div>

  <!-- Fallen party -->
  <div class="defeat-fallen-party" :class="{ visible: defeatPhase !== 'fading' }">
    <div
      v-for="(hero, index) in battleStore.heroes"
      :key="hero.instanceId"
      class="fallen-hero"
      :style="{ '--tilt': (index % 2 === 0 ? -2 : 2) + 'deg' }"
    >
      <HeroCard :hero="hero" compact />
    </div>
  </div>

  <!-- Defeat text -->
  <div class="defeat-text" :class="{ visible: defeatPhase === 'reveal' || defeatPhase === 'complete' }">
    <h2 class="defeat-heading">DEFEAT</h2>
    <p class="defeat-flavor">
      <template v-if="isGenusLociBattle">
        {{ currentGenusLociName }} stands victorious.
      </template>
      <template v-else>
        {{ defeatFlavorText }}
      </template>
    </p>
  </div>

  <!-- Actions -->
  <div class="defeat-actions" :class="{ visible: defeatPhase === 'complete' }">
    <button class="defeat-btn-primary" @click="returnToMap">Try Again</button>
    <button class="defeat-btn-secondary" @click="returnHome">Home</button>
  </div>
</div>
```

**Step 3: Commit**

```
git add src/screens/BattleScreen.vue
git commit -m "feat: replace defeat modal with full-viewport defeat scene"
```

---

### Task 4: Add defeat scene styles

**Files:**
- Modify: `src/screens/BattleScreen.vue` (styles section - remove old, add new)

**Step 1: Remove old defeat modal styles**

Remove these CSS rules:

```css
.defeat-modal h2 {
  color: #ef4444;
}
```

And:

```css
.defeat-modal p {
  color: #9ca3af;
  margin-bottom: 24px;
}
```

**Step 2: Add defeat scene styles**

Add the following styles in the `<style scoped>` section:

```css
/* ===== Defeat Scene ===== */
.defeat-scene {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 20px;
}

/* Genus Loci boss portrait */
.defeat-boss-portrait {
  opacity: 0;
  transition: opacity 0.6s ease-out;
}

.defeat-boss-portrait.visible {
  opacity: 1;
}

.defeat-boss-portrait img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  box-shadow: 0 0 40px rgba(153, 27, 27, 0.5);
}

/* Fallen heroes */
.defeat-fallen-party {
  display: flex;
  gap: 8px;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.6s ease-out;
}

.defeat-fallen-party.visible {
  opacity: 1;
}

.fallen-hero {
  filter: grayscale(1);
  opacity: 0.6;
  transform: rotate(var(--tilt, 0deg));
}

/* Defeat text */
.defeat-text {
  text-align: center;
  opacity: 0;
  transition: opacity 0.5s ease-out 0.2s;
}

.defeat-text.visible {
  opacity: 1;
}

.defeat-heading {
  color: #b91c1c;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 8px 0;
}

.defeat-flavor {
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 0;
}

/* Action buttons */
.defeat-actions {
  display: flex;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.5s ease-out 0.3s;
}

.defeat-actions.visible {
  opacity: 1;
}

.defeat-btn-primary {
  padding: 10px 24px;
  border: 1px solid #6b7280;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.defeat-btn-primary:hover {
  background: #374151;
  color: #f3f4f6;
  border-color: #9ca3af;
}

.defeat-btn-secondary {
  padding: 10px 24px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.defeat-btn-secondary:hover {
  background: #1f2937;
  color: #9ca3af;
}
```

**Step 3: Commit**

```
git add src/screens/BattleScreen.vue
git commit -m "feat: add defeat scene styles with staggered fade-in transitions"
```

---

### Task 5: Reset defeat state on battle end and verify

**Files:**
- Modify: `src/screens/BattleScreen.vue` (returnToMap and returnHome functions)

**Step 1: Reset defeatPhase in navigation functions**

In `returnToMap()` (line 647) and `returnHome()` (line 653), add `defeatPhase.value = null` before `battleStore.endBattle()`:

```js
function returnToMap() {
  defeatPhase.value = null
  explorationsStore.checkCompletions()
  battleStore.endBattle()
  emit('navigate', 'worldmap')
}

function returnHome() {
  defeatPhase.value = null
  explorationsStore.checkCompletions()
  battleStore.endBattle()
  emit('navigate', 'home')
}
```

**Step 2: Verify the full flow**

Run the app and test:
1. Enter a regular quest battle, lose on purpose. Verify:
   - Battlefield desaturates over ~1.5s
   - Fallen heroes appear (grayed, slightly tilted)
   - "DEFEAT" heading + random flavor text fades in
   - Buttons fade in last
   - "Try Again" returns to map
   - "Home" returns to home
2. If available, test a Genus Loci battle defeat. Verify:
   - Boss portrait appears above fallen party
   - Flavor text shows "{Boss Name} stands victorious."

**Step 3: Commit**

```
git add src/screens/BattleScreen.vue
git commit -m "feat: complete defeat screen redesign with state cleanup"
```
