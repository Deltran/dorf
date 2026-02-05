# Multiple Party System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow players to create and switch between 3 preset party configurations with per-party leaders.

**Architecture:** Transform the single `party` array into a `parties` array of 3 party objects. Add backward-compat computed aliases so existing code continues to work. Add swipe carousel on HomeScreen, tabs on PartyScreen, and arrow buttons on quest details.

**Tech Stack:** Vue 3, Pinia, CSS scroll-snap, IntersectionObserver

---

## Task 1: Heroes Store — Data Model

**Files:**
- Modify: `src/stores/heroes.js`
- Test: `src/stores/__tests__/heroes-parties.test.js` (new)

**Step 1: Write the failing test for multi-party structure**

Create `src/stores/__tests__/heroes-parties.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHeroesStore } from '../heroes.js'

describe('Multiple Parties', () => {
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    heroesStore = useHeroesStore()
  })

  describe('data structure', () => {
    it('has 3 parties with default names', () => {
      expect(heroesStore.parties).toHaveLength(3)
      expect(heroesStore.parties[0].name).toBe('Party 1')
      expect(heroesStore.parties[1].name).toBe('Party 2')
      expect(heroesStore.parties[2].name).toBe('Party 3')
    })

    it('each party has 4 slots and a leader', () => {
      for (const party of heroesStore.parties) {
        expect(party.slots).toHaveLength(4)
        expect(party.slots.every(s => s === null)).toBe(true)
        expect(party.leader).toBe(null)
      }
    })

    it('starts with party 1 active', () => {
      expect(heroesStore.activePartyId).toBe(1)
    })
  })

  describe('backward compatibility', () => {
    it('party computed returns active party slots', () => {
      expect(heroesStore.party).toEqual([null, null, null, null])
    })

    it('partyLeader computed returns active party leader', () => {
      expect(heroesStore.partyLeader).toBe(null)
    })
  })

  describe('setActiveParty', () => {
    it('switches active party', () => {
      heroesStore.setActiveParty(2)
      expect(heroesStore.activePartyId).toBe(2)
    })

    it('ignores invalid party ids', () => {
      heroesStore.setActiveParty(99)
      expect(heroesStore.activePartyId).toBe(1)
    })
  })

  describe('renameParty', () => {
    it('renames a party', () => {
      heroesStore.renameParty(1, 'Boss Team')
      expect(heroesStore.parties[0].name).toBe('Boss Team')
    })

    it('ignores invalid party ids', () => {
      heroesStore.renameParty(99, 'Invalid')
      // No error thrown
    })
  })

  describe('party operations affect active party only', () => {
    it('setPartySlot adds hero to active party', () => {
      const hero = heroesStore.addHero('town_guard')
      heroesStore.setPartySlot(0, hero.instanceId)

      expect(heroesStore.parties[0].slots[0]).toBe(hero.instanceId)
      expect(heroesStore.parties[1].slots[0]).toBe(null)
    })

    it('setPartyLeader sets leader for active party', () => {
      const hero = heroesStore.addHero('town_guard')
      heroesStore.setPartySlot(0, hero.instanceId)
      heroesStore.setPartyLeader(hero.instanceId)

      expect(heroesStore.parties[0].leader).toBe(hero.instanceId)
      expect(heroesStore.parties[1].leader).toBe(null)
    })

    it('switching parties shows different heroes', () => {
      const hero1 = heroesStore.addHero('town_guard')
      const hero2 = heroesStore.addHero('hedge_wizard')

      heroesStore.setPartySlot(0, hero1.instanceId)
      heroesStore.setActiveParty(2)
      heroesStore.setPartySlot(0, hero2.instanceId)

      expect(heroesStore.party[0]).toBe(hero2.instanceId)
      heroesStore.setActiveParty(1)
      expect(heroesStore.party[0]).toBe(hero1.instanceId)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/heroes-parties.test.js`
Expected: FAIL — `parties` is undefined

**Step 3: Implement the multi-party data model**

In `src/stores/heroes.js`, replace:

```js
const party = ref([null, null, null, null])
const partyLeader = ref(null)
```

With:

```js
const parties = ref([
  { id: 1, name: 'Party 1', slots: [null, null, null, null], leader: null },
  { id: 2, name: 'Party 2', slots: [null, null, null, null], leader: null },
  { id: 3, name: 'Party 3', slots: [null, null, null, null], leader: null }
])
const activePartyId = ref(1)

// Computed: active party object
const activeParty = computed(() => {
  return parties.value.find(p => p.id === activePartyId.value) || parties.value[0]
})

// Backward-compat aliases
const party = computed({
  get: () => activeParty.value.slots,
  set: (val) => { activeParty.value.slots = val }
})

const partyLeader = computed({
  get: () => activeParty.value.leader,
  set: (val) => { activeParty.value.leader = val }
})
```

Add new actions:

```js
function setActiveParty(id) {
  if (parties.value.some(p => p.id === id)) {
    activePartyId.value = id
  }
}

function renameParty(id, name) {
  const party = parties.value.find(p => p.id === id)
  if (party) {
    party.name = name
  }
}
```

Update `setPartySlot` to use `activeParty.value.slots` instead of `party.value`:

```js
function setPartySlot(slotIndex, instanceId) {
  if (slotIndex < 0 || slotIndex > 3) return false
  if (isHeroLocked(instanceId)) return false

  const hero = collection.value.find(h => h.instanceId === instanceId)
  if (!hero) return false

  const slots = activeParty.value.slots
  const existingSlot = slots.findIndex(id => id === instanceId)
  if (existingSlot !== -1 && existingSlot !== slotIndex) {
    slots[existingSlot] = slots[slotIndex]
  } else if (existingSlot === -1) {
    const partyTemplateIds = slots
      .filter((id, idx) => id && idx !== slotIndex)
      .map(id => collection.value.find(h => h.instanceId === id)?.templateId)
      .filter(Boolean)
    if (partyTemplateIds.includes(hero.templateId)) return false
  }

  slots[slotIndex] = instanceId
  return true
}
```

Update `clearPartySlot`:

```js
function clearPartySlot(slotIndex) {
  if (slotIndex < 0 || slotIndex > 3) return false
  const slots = activeParty.value.slots
  const removedId = slots[slotIndex]
  if (removedId === activeParty.value.leader) {
    activeParty.value.leader = null
  }
  slots[slotIndex] = null
  return true
}
```

Update `setPartyLeader`:

```js
function setPartyLeader(instanceId) {
  if (instanceId && !activeParty.value.slots.includes(instanceId)) {
    return false
  }
  activeParty.value.leader = instanceId
  return true
}
```

Update `autoFillParty` to use `activeParty.value.slots`.

Update `removeHero` to clear from ALL parties:

```js
function removeHero(instanceId) {
  // Clear leader and slot from ALL parties
  for (const party of parties.value) {
    if (instanceId === party.leader) {
      party.leader = null
    }
    party.slots = party.slots.map(id => id === instanceId ? null : id)
  }
  collection.value = collection.value.filter(h => h.instanceId !== instanceId)
}
```

Update exports:

```js
return {
  // State
  collection,
  parties,           // NEW
  activePartyId,     // NEW
  // Computed
  activeParty,       // NEW
  party,             // Now computed
  partyLeader,       // Now computed
  // ... rest unchanged
  // Actions
  setActiveParty,    // NEW
  renameParty,       // NEW
  // ... rest unchanged
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/stores/__tests__/heroes-parties.test.js`
Expected: PASS

**Step 5: Run all existing tests to verify backward compat**

Run: `npx vitest run`
Expected: All tests pass (except the pre-existing SummonInfoSheet failure)

**Step 6: Commit**

```bash
git add src/stores/heroes.js src/stores/__tests__/heroes-parties.test.js
git commit -m "feat(heroes): add multi-party data model with backward compat"
```

---

## Task 2: Persistence and Migration

**Files:**
- Modify: `src/stores/heroes.js` (saveState/loadState)
- Modify: `src/utils/storage.js` (bump version)
- Test: `src/stores/__tests__/heroes-parties.test.js` (add persistence tests)

**Step 1: Add persistence tests**

Append to `src/stores/__tests__/heroes-parties.test.js`:

```js
describe('persistence', () => {
  it('saveState includes parties and activePartyId', () => {
    const hero = heroesStore.addHero('town_guard')
    heroesStore.setPartySlot(0, hero.instanceId)
    heroesStore.renameParty(1, 'Main Team')
    heroesStore.setActiveParty(2)

    const saved = heroesStore.saveState()

    expect(saved.parties).toHaveLength(3)
    expect(saved.parties[0].name).toBe('Main Team')
    expect(saved.parties[0].slots[0]).toBe(hero.instanceId)
    expect(saved.activePartyId).toBe(2)
  })

  it('loadState restores parties and activePartyId', () => {
    const savedState = {
      collection: [{ instanceId: 'hero-1', templateId: 'town_guard', level: 1, exp: 0, starLevel: 3 }],
      parties: [
        { id: 1, name: 'Boss Team', slots: ['hero-1', null, null, null], leader: 'hero-1' },
        { id: 2, name: 'Party 2', slots: [null, null, null, null], leader: null },
        { id: 3, name: 'Farm Team', slots: [null, null, null, null], leader: null }
      ],
      activePartyId: 1
    }

    heroesStore.loadState(savedState)

    expect(heroesStore.parties[0].name).toBe('Boss Team')
    expect(heroesStore.parties[2].name).toBe('Farm Team')
    expect(heroesStore.party[0]).toBe('hero-1')
    expect(heroesStore.partyLeader).toBe('hero-1')
  })

  it('migrates old single-party format to new multi-party format', () => {
    const oldSavedState = {
      collection: [{ instanceId: 'hero-1', templateId: 'town_guard', level: 5, exp: 100, starLevel: 3 }],
      party: ['hero-1', null, null, null],
      partyLeader: 'hero-1'
    }

    heroesStore.loadState(oldSavedState)

    // Old party should be in Party 1
    expect(heroesStore.parties[0].slots[0]).toBe('hero-1')
    expect(heroesStore.parties[0].leader).toBe('hero-1')
    // Other parties should be empty
    expect(heroesStore.parties[1].slots.every(s => s === null)).toBe(true)
    expect(heroesStore.parties[2].slots.every(s => s === null)).toBe(true)
    // Active party should be 1
    expect(heroesStore.activePartyId).toBe(1)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/heroes-parties.test.js`
Expected: FAIL — saveState doesn't include parties

**Step 3: Update saveState in heroes.js**

```js
function saveState() {
  return {
    collection: collection.value,
    parties: parties.value,
    activePartyId: activePartyId.value
  }
}
```

**Step 4: Update loadState with migration in heroes.js**

```js
function loadState(savedState) {
  if (savedState.collection) {
    collection.value = savedState.collection.map(hero => ({
      ...hero,
      starLevel: hero.starLevel || getHeroTemplate(hero.templateId)?.rarity || 1,
      shards: hero.shards ?? 0,
      shardTier: hero.shardTier ?? 0,
      explorationNodeId: hero.explorationNodeId ?? null
    }))
  }

  // New format: parties array
  if (savedState.parties) {
    parties.value = savedState.parties
    activePartyId.value = savedState.activePartyId ?? 1
  }
  // Migration: old format with single party
  else if (savedState.party) {
    parties.value = [
      { id: 1, name: 'Party 1', slots: savedState.party, leader: savedState.partyLeader ?? null },
      { id: 2, name: 'Party 2', slots: [null, null, null, null], leader: null },
      { id: 3, name: 'Party 3', slots: [null, null, null, null], leader: null }
    ]
    activePartyId.value = 1
  }
}
```

**Step 5: Bump save version in storage.js**

In `src/utils/storage.js`, change:

```js
const SAVE_VERSION = 9
```

To:

```js
const SAVE_VERSION = 10  // Multi-party system
```

**Step 6: Run tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/heroes-parties.test.js`
Expected: PASS

**Step 7: Commit**

```bash
git add src/stores/heroes.js src/stores/__tests__/heroes-parties.test.js src/utils/storage.js
git commit -m "feat(heroes): add persistence and migration for multi-party"
```

---

## Task 3: HomeScreen Swipe Carousel

**Files:**
- Modify: `src/screens/HomeScreen.vue`

**Step 1: Add parties import and carousel state**

In the `<script setup>` section, after the existing imports:

```js
// Add to existing heroesStore usage
const parties = computed(() => heroesStore.parties)
const activePartyId = computed(() => heroesStore.activePartyId)

// Carousel refs
const carouselRef = ref(null)
const currentVisibleParty = ref(1)
```

**Step 2: Replace partyPreview computed to support all parties**

Replace the existing `partyPreview` computed:

```js
function getPartyPreview(partyIndex) {
  const party = heroesStore.parties[partyIndex]
  if (!party) return []
  return party.slots.map(instanceId => {
    if (!instanceId) return null
    return heroesStore.getHeroFull(instanceId)
  })
}
```

**Step 3: Add scroll handling for syncing active party**

```js
let scrollTimeout = null

function handleCarouselScroll() {
  if (!carouselRef.value) return

  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    const container = carouselRef.value
    const scrollLeft = container.scrollLeft
    const pageWidth = container.offsetWidth
    const newPartyIndex = Math.round(scrollLeft / pageWidth)
    const newPartyId = newPartyIndex + 1

    if (newPartyId !== currentVisibleParty.value && newPartyId >= 1 && newPartyId <= 3) {
      currentVisibleParty.value = newPartyId
      heroesStore.setActiveParty(newPartyId)
    }
  }, 50)
}

// Sync carousel position when activePartyId changes externally
watch(activePartyId, (newId) => {
  if (newId !== currentVisibleParty.value && carouselRef.value) {
    const pageWidth = carouselRef.value.offsetWidth
    carouselRef.value.scrollTo({
      left: (newId - 1) * pageWidth,
      behavior: 'smooth'
    })
    currentVisibleParty.value = newId
  }
}, { immediate: true })
```

**Step 4: Update template party-preview section**

Replace the existing `<section class="party-preview">` with:

```html
<section class="party-preview">
  <div class="party-container">
    <div class="party-title">Your Party</div>
    <div
      ref="carouselRef"
      class="party-carousel"
      @scroll="handleCarouselScroll"
    >
      <div
        v-for="(party, pIndex) in parties"
        :key="party.id"
        class="party-page"
      >
        <div v-if="getPartyPreview(pIndex).some(h => h)" class="party-grid">
          <template v-for="(hero, index) in getPartyPreview(pIndex)" :key="index">
            <div class="party-slot" :class="{ filled: hero }" @click="emit('navigate', 'heroes', hero?.instanceId)">
              <img
                v-if="hero"
                :src="getHeroImageUrl(hero.templateId)"
                :alt="hero.template?.name"
                class="hero-portrait"
              />
              <div v-else class="empty-slot">
                <span class="slot-number">{{ index + 1 }}</span>
              </div>
            </div>
          </template>
        </div>
        <div v-else class="no-party">
          <div class="no-party-icon">⚔️</div>
          <p>No heroes in {{ party.name }}!</p>
        </div>
      </div>
    </div>
    <!-- Dot indicators -->
    <div class="carousel-dots">
      <span
        v-for="party in parties"
        :key="party.id"
        :class="['dot', { active: party.id === currentVisibleParty }]"
      ></span>
    </div>
  </div>
</section>
```

**Step 5: Add carousel styles**

Add to the `<style scoped>` section:

```css
.party-carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.party-carousel::-webkit-scrollbar {
  display: none;
}

.party-page {
  flex: 0 0 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #374151;
  transition: all 0.2s ease;
}

.dot.active {
  background: #f59e0b;
  transform: scale(1.2);
}
```

**Step 6: Update hasParty computed**

Replace:
```js
const hasParty = computed(() => {
  return heroesStore.party.some(id => id !== null)
})
```

With (remove it — we no longer need it since each party page handles its own empty state).

**Step 7: Verify the change works**

Run: `npm run dev`
- Open the app
- Verify 3 party pages are swipeable
- Verify dot indicators update
- Verify switching parties syncs with the store

**Step 8: Commit**

```bash
git add src/screens/HomeScreen.vue
git commit -m "feat(home): add swipe carousel for party switching"
```

---

## Task 4: PartyScreen Tabs

**Files:**
- Modify: `src/screens/PartyScreen.vue`

**Step 1: Add party switching state**

In the `<script setup>` section, add:

```js
const parties = computed(() => heroesStore.parties)
const activePartyId = computed(() => heroesStore.activePartyId)

// Long-press rename state
const renamingPartyId = ref(null)
const renameInput = ref('')
const renameInputRef = ref(null)
let longPressTimer = null

function switchToParty(partyId) {
  heroesStore.setActiveParty(partyId)
}

function startLongPress(partyId) {
  longPressTimer = setTimeout(() => {
    startRename(partyId)
  }, 500)
}

function cancelLongPress() {
  clearTimeout(longPressTimer)
}

function startRename(partyId) {
  const party = parties.value.find(p => p.id === partyId)
  if (!party) return
  renamingPartyId.value = partyId
  renameInput.value = party.name
  nextTick(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  })
}

function finishRename() {
  if (renamingPartyId.value && renameInput.value.trim()) {
    heroesStore.renameParty(renamingPartyId.value, renameInput.value.trim())
  }
  renamingPartyId.value = null
  renameInput.value = ''
}

function cancelRename() {
  renamingPartyId.value = null
  renameInput.value = ''
}
```

Add `nextTick` to imports if not present.

**Step 2: Add party tabs to template**

After the placement bar and before the synergy bar, add:

```html
<!-- Party Tabs -->
<div v-if="!placingHero" class="party-tabs">
  <button
    v-for="party in parties"
    :key="party.id"
    :class="['party-tab', { active: party.id === activePartyId }]"
    @click="switchToParty(party.id)"
    @pointerdown="startLongPress(party.id)"
    @pointerup="cancelLongPress"
    @pointerleave="cancelLongPress"
  >
    <template v-if="renamingPartyId === party.id">
      <input
        ref="renameInputRef"
        v-model="renameInput"
        class="rename-input"
        maxlength="20"
        @blur="finishRename"
        @keyup.enter="finishRename"
        @keyup.escape="cancelRename"
        @click.stop
      />
    </template>
    <template v-else>
      {{ party.name }}
    </template>
  </button>
</div>
```

**Step 3: Add tab styles**

Add to `<style scoped>`:

```css
/* Party Tabs */
.party-tabs {
  display: flex;
  gap: 4px;
  background: #1a1f2e;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid #252b3b;
}

.party-tab {
  flex: 1;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.party-tab:hover {
  color: #9ca3af;
}

.party-tab.active {
  background: #252b3b;
  color: #f3f4f6;
}

.party-tab.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #f59e0b;
  border-radius: 1px;
}

.rename-input {
  width: 100%;
  background: #1f2937;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 2px 6px;
  text-align: center;
}

.rename-input:focus {
  outline: none;
  border-color: #f59e0b;
}
```

**Step 4: Test manually**

Run: `npm run dev`
- Navigate to Party screen
- Verify tabs appear and switch parties
- Verify long-press triggers rename mode
- Verify rename saves on blur/enter

**Step 5: Commit**

```bash
git add src/screens/PartyScreen.vue
git commit -m "feat(party): add tabs for party switching with long-press rename"
```

---

## Task 5: Quest Details Arrow Carousel

**Files:**
- Modify: `src/screens/WorldMapScreen.vue`

**Step 1: Add party switching helpers**

In the `<script setup>` section, add:

```js
const parties = computed(() => heroesStore.parties)
const activePartyId = computed(() => heroesStore.activePartyId)
const activeParty = computed(() => heroesStore.activeParty)

// Check if current party has heroes
const partyHasHeroes = computed(() => {
  return activeParty.value?.slots.some(s => s !== null) ?? false
})

function switchToPrevParty() {
  const currentIndex = parties.value.findIndex(p => p.id === activePartyId.value)
  const prevIndex = currentIndex <= 0 ? parties.value.length - 1 : currentIndex - 1
  heroesStore.setActiveParty(parties.value[prevIndex].id)
}

function switchToNextParty() {
  const currentIndex = parties.value.findIndex(p => p.id === activePartyId.value)
  const nextIndex = currentIndex >= parties.value.length - 1 ? 0 : currentIndex + 1
  heroesStore.setActiveParty(parties.value[nextIndex].id)
}

// Mini party preview for quest details
function getActivePartyPreview() {
  if (!activeParty.value) return []
  return activeParty.value.slots.map(instanceId => {
    if (!instanceId) return null
    return heroesStore.getHeroFull(instanceId)
  })
}
```

**Step 2: Add hero image helper (if not already present)**

```js
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })
const heroPortraits = import.meta.glob('../assets/heroes/*_portrait.png', { eager: true, import: 'default' })

function getHeroPortraitUrl(heroId) {
  const portraitPath = `../assets/heroes/${heroId}_portrait.png`
  if (heroPortraits[portraitPath]) return heroPortraits[portraitPath]
  const gifPath = `../assets/heroes/${heroId}.gif`
  if (heroGifs[gifPath]) return heroGifs[gifPath]
  const pngPath = `../assets/heroes/${heroId}.png`
  return heroImages[pngPath] || null
}
```

**Step 3: Add party selector to quest preview template**

Find the regular quest preview section (around line 774, inside `<div v-else class="preview-body quest-preview">`).

Before the `<div :class="['quest-buttons', ...]">` element, add:

```html
<!-- Party Selector -->
<div class="party-selector">
  <button class="party-arrow" @click.stop="switchToPrevParty">‹</button>
  <div class="party-info">
    <span class="party-name">{{ activeParty?.name }}</span>
    <div class="party-mini-preview">
      <template v-for="(hero, idx) in getActivePartyPreview()" :key="idx">
        <div v-if="hero" class="mini-hero">
          <img
            v-if="getHeroPortraitUrl(hero.templateId)"
            :src="getHeroPortraitUrl(hero.templateId)"
            :alt="hero.template?.name"
          />
          <span v-else class="mini-hero-placeholder">{{ hero.template?.name?.[0] || '?' }}</span>
        </div>
        <div v-else class="mini-hero empty"></div>
      </template>
    </div>
  </div>
  <button class="party-arrow" @click.stop="switchToNextParty">›</button>
</div>
```

**Step 4: Disable start button when party is empty**

Update the start-quest-btn to be disabled when party is empty:

```html
<button
  class="start-quest-btn"
  :disabled="!partyHasHeroes"
  @click="startQuest"
>
```

**Step 5: Add party selector styles**

Add to `<style scoped>`:

```css
/* Party Selector */
.party-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #1a1f2e;
  border-radius: 10px;
  border: 1px solid #252b3b;
  margin-bottom: 12px;
}

.party-arrow {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #252b3b;
  border: 1px solid #374151;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.party-arrow:hover {
  background: #374151;
  color: #f3f4f6;
}

.party-arrow:active {
  transform: scale(0.95);
}

.party-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.party-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f3f4f6;
}

.party-mini-preview {
  display: flex;
  gap: 6px;
}

.mini-hero {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  overflow: hidden;
  background: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-hero.empty {
  border: 1px dashed #4b5563;
  background: transparent;
}

.mini-hero-placeholder {
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 600;
}

.start-quest-btn:disabled {
  background: #374151;
  color: #6b7280;
  cursor: not-allowed;
  box-shadow: none;
}

.start-quest-btn:disabled:hover {
  transform: none;
}
```

**Step 6: Test manually**

Run: `npm run dev`
- Navigate to world map
- Select a quest node
- Verify party selector appears with arrows
- Verify arrows cycle through parties
- Verify empty party disables Start button

**Step 7: Commit**

```bash
git add src/screens/WorldMapScreen.vue
git commit -m "feat(worldmap): add party selector arrows to quest details"
```

---

## Task 6: Fix Pre-existing SummonInfoSheet Test

**Files:**
- Modify: `src/components/__tests__/SummonInfoSheet.test.js`

**Step 1: Investigate the failing test**

The test at line 358 expects `wrapper.emitted('close')` to be truthy after a swipe gesture, but it's undefined. This is likely a timing issue with the touch simulation.

**Step 2: Fix the test**

Read the test file to understand the issue, then fix the touch event simulation or assertion timing.

**Step 3: Run the test**

Run: `npx vitest run src/components/__tests__/SummonInfoSheet.test.js`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/__tests__/SummonInfoSheet.test.js
git commit -m "fix(tests): fix SummonInfoSheet swipe-to-close test timing"
```

---

## Task 7: Final Integration Test

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 2: Manual smoke test**

- [ ] Fresh start: 3 empty parties, Party 1 active
- [ ] Intro flow: gifted heroes go into Party 1
- [ ] HomeScreen: swipe between parties, dots update
- [ ] PartyScreen: tabs switch parties, long-press renames
- [ ] Quest details: arrows switch parties, empty party disables Start
- [ ] Persistence: refresh page, parties preserved

**Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for multi-party feature"
```
