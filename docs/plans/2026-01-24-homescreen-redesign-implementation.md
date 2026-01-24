# Homescreen Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize the homescreen into three category hubs (Fellowship Hall, Map Room, Store Room) to group related features together.

**Architecture:** Create two new hub screens (FellowshipHallScreen, MapRoomScreen) that serve as navigation centers. Extract PartyScreen from HeroesScreen. Create GenusLociListScreen from existing home code. Update all back-button routing to point to parent hubs.

**Tech Stack:** Vue 3 Composition API, existing store system, existing CSS patterns

---

## Task 1: Create FellowshipHallScreen

**Files:**
- Create: `src/screens/FellowshipHallScreen.vue`

**Step 1: Create the hub screen**

```vue
<script setup>
const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="fellowship-hall-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Fellowship Hall</h1>
      <div class="header-spacer"></div>
    </header>

    <nav class="hub-nav">
      <button class="nav-button" @click="emit('navigate', 'heroes')">
        <div class="nav-icon-wrapper heroes">
          <span class="nav-icon">⚔️</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Heroes</span>
          <span class="nav-hint">View your collection</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <button class="nav-button" @click="emit('navigate', 'party')">
        <div class="nav-icon-wrapper party">
          <span class="nav-icon">🛡️</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Party</span>
          <span class="nav-hint">Manage your team</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <button class="nav-button" @click="emit('navigate', 'merge')">
        <div class="nav-icon-wrapper fusion">
          <span class="nav-icon">⭐</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Fusion</span>
          <span class="nav-hint">Upgrade stars</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <button class="nav-button" @click="emit('navigate', 'shards')">
        <div class="nav-icon-wrapper shards">
          <span class="nav-icon">💎</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Shards</span>
          <span class="nav-hint">Hero fragments</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.fellowship-hall-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  overflow: hidden;
}

/* Animated Background - same as other screens */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-gradient {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e1b4b 25%,
    #7f1d1d 50%,
    #1e1b4b 75%,
    #0f172a 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  opacity: 0.03;
  background-image:
    radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  z-index: -1;
}

/* Header */
.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.screen-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.header-spacer {
  width: 70px;
}

/* Navigation */
.hub-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  position: relative;
  overflow: hidden;
}

.nav-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  transition: left 0.5s ease;
}

.nav-button:hover::before {
  left: 100%;
}

.nav-button:hover {
  border-color: #4b5563;
  transform: translateX(6px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.nav-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon-wrapper.heroes {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.nav-icon-wrapper.party {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.nav-icon-wrapper.fusion {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.nav-icon-wrapper.shards {
  background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%);
  box-shadow: 0 4px 12px rgba(192, 38, 211, 0.4);
}

.nav-icon {
  font-size: 1.5rem;
}

.nav-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.nav-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.nav-hint {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 2px;
}

.nav-arrow {
  font-size: 1.5rem;
  color: #4b5563;
  transition: transform 0.3s ease, color 0.3s ease;
}

.nav-button:hover .nav-arrow {
  transform: translateX(4px);
  color: #6b7280;
}
</style>
```

**Step 2: Register in App.vue**

Add import at top of `src/App.vue`:
```js
import FellowshipHallScreen from './screens/FellowshipHallScreen.vue'
```

Add to template after HomeScreen block:
```vue
<FellowshipHallScreen
  v-else-if="currentScreen === 'fellowship-hall'"
  @navigate="navigate"
/>
```

**Step 3: Test manually**

Run: `npm run dev`
- Navigate to home, verify app loads
- Manually change `currentScreen` to `'fellowship-hall'` in Vue devtools
- Verify hub screen renders with 4 buttons
- Click each button, verify navigation works

**Step 4: Commit**

```bash
git add src/screens/FellowshipHallScreen.vue src/App.vue
git commit -m "feat: add FellowshipHallScreen hub"
```

---

## Task 2: Create MapRoomScreen

**Files:**
- Create: `src/screens/MapRoomScreen.vue`
- Modify: `src/App.vue`

**Step 1: Create the hub screen**

```vue
<script setup>
const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="map-room-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Map Room</h1>
      <div class="header-spacer"></div>
    </header>

    <nav class="hub-nav">
      <button class="nav-button" @click="emit('navigate', 'worldmap')">
        <div class="nav-icon-wrapper quests">
          <span class="nav-icon">🗺️</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Quests</span>
          <span class="nav-hint">Explore the world</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <button class="nav-button" @click="emit('navigate', 'explorations')">
        <div class="nav-icon-wrapper explorations">
          <span class="nav-icon">🧭</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Explorations</span>
          <span class="nav-hint">Send heroes on expeditions</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <button class="nav-button" @click="emit('navigate', 'genus-loci-list')">
        <div class="nav-icon-wrapper genus-loci">
          <span class="nav-icon">👹</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Genus Loci</span>
          <span class="nav-hint">Challenge powerful bosses</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.map-room-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  overflow: hidden;
}

/* Animated Background */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-gradient {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e3a2f 25%,
    #172554 50%,
    #1e3a2f 75%,
    #0f172a 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  opacity: 0.03;
  background-image:
    radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  z-index: -1;
}

/* Header */
.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.screen-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.header-spacer {
  width: 70px;
}

/* Navigation */
.hub-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  position: relative;
  overflow: hidden;
}

.nav-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  transition: left 0.5s ease;
}

.nav-button:hover::before {
  left: 100%;
}

.nav-button:hover {
  border-color: #4b5563;
  transform: translateX(6px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.nav-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon-wrapper.quests {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.nav-icon-wrapper.explorations {
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
}

.nav-icon-wrapper.genus-loci {
  background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%);
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
}

.nav-icon {
  font-size: 1.5rem;
}

.nav-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.nav-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.nav-hint {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 2px;
}

.nav-arrow {
  font-size: 1.5rem;
  color: #4b5563;
  transition: transform 0.3s ease, color 0.3s ease;
}

.nav-button:hover .nav-arrow {
  transform: translateX(4px);
  color: #6b7280;
}
</style>
```

**Step 2: Register in App.vue**

Add import:
```js
import MapRoomScreen from './screens/MapRoomScreen.vue'
```

Add to template:
```vue
<MapRoomScreen
  v-else-if="currentScreen === 'map-room'"
  @navigate="navigate"
/>
```

**Step 3: Test manually**

Run: `npm run dev`
- Navigate using Vue devtools to `'map-room'`
- Verify 3 buttons render
- Click buttons, verify navigation

**Step 4: Commit**

```bash
git add src/screens/MapRoomScreen.vue src/App.vue
git commit -m "feat: add MapRoomScreen hub"
```

---

## Task 3: Create GenusLociListScreen

**Files:**
- Create: `src/screens/GenusLociListScreen.vue`
- Modify: `src/App.vue`

**Step 1: Create the list screen**

Extract the Genus Loci grid from HomeScreen into its own screen:

```vue
<script setup>
import { computed } from 'vue'
import { useGenusLociStore } from '../stores'

const emit = defineEmits(['navigate'])

const genusLociStore = useGenusLociStore()

// Enemy portraits for genus loci
const enemyPortraits = import.meta.glob('../assets/enemies/*_portrait.png', { eager: true, import: 'default' })

function getBossPortraitUrl(bossId) {
  const portraitPath = `../assets/enemies/${bossId}_portrait.png`
  return enemyPortraits[portraitPath] || null
}

const unlockedGenusLoci = computed(() => genusLociStore.unlockedBosses)
const hasAnyGenusLoci = computed(() => unlockedGenusLoci.value.length > 0)

function selectBoss(bossId) {
  emit('navigate', 'genusLoci', bossId)
}
</script>

<template>
  <div class="genus-loci-list-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'map-room')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Genus Loci</h1>
      <div class="header-spacer"></div>
    </header>

    <section class="boss-section">
      <div v-if="hasAnyGenusLoci" class="boss-grid">
        <div
          v-for="boss in unlockedGenusLoci"
          :key="boss.id"
          class="boss-card"
          @click="selectBoss(boss.id)"
        >
          <div class="boss-icon">
            <img
              v-if="getBossPortraitUrl(boss.id)"
              :src="getBossPortraitUrl(boss.id)"
              :alt="boss.name"
              class="boss-portrait"
            />
            <span v-else>👹</span>
          </div>
          <div class="boss-info">
            <span class="boss-name">{{ boss.name }}</span>
            <span class="boss-level">Highest: Lv.{{ boss.highestCleared }}</span>
          </div>
          <div class="boss-arrow">›</div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🏰</div>
        <p class="empty-text">No Genus Loci discovered yet.</p>
        <p class="empty-hint">Powerful guardians await in the world. Seek them out on your quest.</p>
        <button class="quest-btn" @click="emit('navigate', 'worldmap')">
          <span>Explore Quests</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.genus-loci-list-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  overflow: hidden;
}

/* Animated Background */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-gradient {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #2a1f3d 25%,
    #1e1b4b 50%,
    #2a1f3d 75%,
    #0f172a 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  opacity: 0.03;
  background-image:
    radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  z-index: -1;
}

/* Header */
.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.screen-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.header-spacer {
  width: 70px;
}

/* Boss Section */
.boss-section {
  position: relative;
  z-index: 1;
  flex: 1;
}

.boss-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.boss-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #2a1f3d 0%, #1f2937 100%);
  border: 1px solid #6b21a8;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.boss-card:hover {
  transform: translateX(6px);
  border-color: #9333ea;
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.3);
}

.boss-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(147, 51, 234, 0.2);
  border-radius: 12px;
  font-size: 2rem;
  overflow: hidden;
}

.boss-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.boss-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
}

.boss-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.boss-level {
  font-size: 0.85rem;
  color: #9ca3af;
}

.boss-arrow {
  font-size: 1.5rem;
  color: #6b21a8;
  transition: transform 0.3s ease;
}

.boss-card:hover .boss-arrow {
  transform: translateX(4px);
  color: #9333ea;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px dashed #374151;
  border-radius: 16px;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  color: #f3f4f6;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.empty-hint {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0 0 24px 0;
}

.quest-btn {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.quest-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}
</style>
```

**Step 2: Register in App.vue**

Add import:
```js
import GenusLociListScreen from './screens/GenusLociListScreen.vue'
```

Add to template:
```vue
<GenusLociListScreen
  v-else-if="currentScreen === 'genus-loci-list'"
  @navigate="navigate"
/>
```

**Step 3: Test manually**

- Navigate to `'genus-loci-list'`
- Verify boss cards show if any unlocked
- Verify empty state shows if none unlocked
- Click boss card, verify navigation to genusLoci screen

**Step 4: Commit**

```bash
git add src/screens/GenusLociListScreen.vue src/App.vue
git commit -m "feat: add GenusLociListScreen"
```

---

## Task 4: Create PartyScreen

**Files:**
- Create: `src/screens/PartyScreen.vue`
- Modify: `src/App.vue`

**Step 1: Create PartyScreen by extracting from HeroesScreen**

```vue
<script setup>
import { ref, computed } from 'vue'
import { useHeroesStore } from '../stores'
import HeroCard from '../components/HeroCard.vue'

const props = defineProps({
  placingHeroId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['navigate'])

const heroesStore = useHeroesStore()

const placingHero = ref(null)

// If a hero ID was passed for placement, load it
if (props.placingHeroId) {
  placingHero.value = heroesStore.getHeroFull(props.placingHeroId)
}

const partySlots = computed(() => {
  return heroesStore.party.map((instanceId, index) => {
    if (!instanceId) return { index, hero: null }
    return { index, hero: heroesStore.getHeroFull(instanceId) }
  })
})

function addToParty(slotIndex) {
  const heroToPlace = placingHero.value
  if (!heroToPlace) return
  heroesStore.setPartySlot(slotIndex, heroToPlace.instanceId)
  placingHero.value = null
}

function removeFromParty(slotIndex) {
  heroesStore.clearPartySlot(slotIndex)
}

function isInParty(instanceId) {
  return heroesStore.party.includes(instanceId)
}

function cancelPlacing() {
  placingHero.value = null
}

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
</script>

<template>
  <div class="party-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'fellowship-hall')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Party</h1>
      <div class="header-spacer"></div>
    </header>

    <!-- Placement Bar -->
    <div v-if="placingHero" class="placement-bar">
      <div class="placement-info">
        <span class="placement-label">Placing:</span>
        <span class="placement-name">{{ placingHero.template.name }}</span>
      </div>
      <button class="cancel-btn" @click="cancelPlacing">Cancel</button>
    </div>

    <section class="party-section">
      <div class="party-slots">
        <div
          v-for="slot in partySlots"
          :key="slot.index"
          :class="['party-slot', { filled: slot.hero }]"
        >
          <template v-if="slot.hero">
            <div class="party-slot-content">
              <div v-if="isLeader(slot.hero.instanceId)" class="leader-crown">👑</div>
              <HeroCard
                :hero="slot.hero"
                showStats
                @click="toggleLeader(slot.hero)"
              />
            </div>
            <button
              class="remove-btn"
              @click.stop="removeFromParty(slot.index)"
            >
              <span>Remove</span>
            </button>
          </template>
          <template v-else>
            <div
              :class="['empty-slot', { clickable: placingHero && !isInParty(placingHero.instanceId) }]"
              @click="placingHero && !isInParty(placingHero.instanceId) && addToParty(slot.index)"
            >
              <span class="slot-number">{{ slot.index + 1 }}</span>
              <span class="slot-label">Empty Slot</span>
              <p v-if="placingHero && !isInParty(placingHero.instanceId)" class="slot-hint">Tap to add</p>
            </div>
          </template>
        </div>
      </div>

      <button class="auto-fill-btn" @click="heroesStore.autoFillParty">
        <span class="btn-icon">✨</span>
        <span>Auto-Fill Party</span>
      </button>

      <button class="browse-btn" @click="emit('navigate', 'heroes')">
        <span class="btn-icon">⚔️</span>
        <span>Browse Heroes</span>
      </button>
    </section>
  </div>
</template>

<style scoped>
.party-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

/* Animated Background */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-gradient {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e1b4b 25%,
    #064e3b 50%,
    #1e1b4b 75%,
    #0f172a 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  opacity: 0.03;
  background-image:
    radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  z-index: -1;
}

/* Header */
.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.screen-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.header-spacer {
  width: 70px;
}

/* Placement Bar */
.placement-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 41, 59, 0.8) 100%);
  border: 1px solid #3b82f6;
  border-radius: 12px;
  position: relative;
  z-index: 1;
}

.placement-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.placement-label {
  color: #9ca3af;
}

.placement-name {
  color: #f3f4f6;
  font-weight: 600;
}

.cancel-btn {
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 1px solid #4b5563;
  color: #f3f4f6;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
}

/* Party Section */
.party-section {
  position: relative;
  z-index: 1;
}

.party-slots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.party-slot {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  padding: 12px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.party-slot.filled {
  border-color: #4b5563;
}

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

.party-slot .empty-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #334155;
  border-radius: 10px;
  color: #6b7280;
  transition: all 0.3s ease;
  gap: 4px;
}

.party-slot .empty-slot.clickable {
  cursor: pointer;
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.party-slot .empty-slot.clickable:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #60a5fa;
}

.slot-number {
  font-size: 2rem;
  font-weight: 700;
  color: #334155;
}

.slot-label {
  font-size: 0.8rem;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.slot-hint {
  margin: 8px 0 0 0;
  font-size: 0.75rem;
  color: #60a5fa;
}

.remove-btn {
  margin-top: 10px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

.auto-fill-btn,
.browse-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 1px solid #4b5563;
  border-radius: 12px;
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 12px;
}

.auto-fill-btn:hover,
.browse-btn:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.1rem;
}
</style>
```

**Step 2: Register in App.vue**

Add import:
```js
import PartyScreen from './screens/PartyScreen.vue'
```

Add state variable for placing hero:
```js
const placingHeroId = ref(null)
```

Update navigate function to handle party with placing hero:
```js
} else if (screen === 'party') {
  placingHeroId.value = param  // param is heroId to place, or null
}
```

Add to template:
```vue
<PartyScreen
  v-else-if="currentScreen === 'party'"
  :placing-hero-id="placingHeroId"
  @navigate="navigate"
/>
```

**Step 3: Test manually**

- Navigate to `'party'`
- Verify 4 slots display
- Remove/add heroes
- Test auto-fill
- Test leader toggle

**Step 4: Commit**

```bash
git add src/screens/PartyScreen.vue src/App.vue
git commit -m "feat: add PartyScreen"
```

---

## Task 5: Update HeroesScreen - Remove Tabs

**Files:**
- Modify: `src/screens/HeroesScreen.vue`

**Step 1: Remove tab bar and party/fusion tabs**

In `<script setup>`:
- Remove `viewMode` ref (no longer needed)
- Remove party-related computed properties that are now in PartyScreen
- Keep `placingHero` for the "Add to Party" flow

Remove from template:
- The entire `.view-tabs` section
- The entire `<!-- Party View -->` section (`v-if="viewMode === 'party'"`)
- Change back button to go to `'fellowship-hall'`

**Step 2: Update "Add to Party" to navigate to PartyScreen**

Change the `startPlacing` function:
```js
function startPlacing(hero) {
  emit('navigate', 'party', hero.instanceId)
}
```

Remove `placingHero` ref and `cancelPlacing` function (no longer needed here).

**Step 3: Update back button**

Change:
```vue
<button class="back-button" @click="emit('navigate', 'home')">
```
To:
```vue
<button class="back-button" @click="emit('navigate', 'fellowship-hall')">
```

**Step 4: Remove party-related styles**

Remove CSS for:
- `.view-tabs`, `.tab`, `.tab.active`, `.tab.merge-tab`
- `.party-section`, `.party-slots`, `.party-slot`
- `.placement-bar`

**Step 5: Test manually**

- Navigate to heroes screen
- Verify no tabs appear
- Verify collection grid shows
- Click "Add to Party" on a hero, verify navigates to party screen
- Verify back goes to fellowship hall

**Step 6: Commit**

```bash
git add src/screens/HeroesScreen.vue
git commit -m "refactor: remove tabs from HeroesScreen, collection only"
```

---

## Task 6: Update Back Button Targets

**Files:**
- Modify: `src/screens/MergeScreen.vue`
- Modify: `src/screens/ShardsScreen.vue`
- Modify: `src/screens/WorldMapScreen.vue`
- Modify: `src/screens/ExplorationsScreen.vue`
- Modify: `src/screens/GenusLociScreen.vue`

**Step 1: Update MergeScreen**

Change back button from `'heroes'` to `'fellowship-hall'`:
```vue
<button class="back-btn" @click="emit('navigate', 'fellowship-hall')">
```

**Step 2: Update ShardsScreen**

Change back button from `'home'` to `'fellowship-hall'`:
```vue
<button class="back-btn" @click="emit('navigate', 'fellowship-hall')">Back</button>
```

**Step 3: Update WorldMapScreen**

Change back button from `'home'` to `'map-room'`:
```vue
<button class="back-btn" @click="emit('navigate', 'map-room')">
```

**Step 4: Update ExplorationsScreen**

Change the `@back` emit handler in App.vue:
```js
function handleExplorationBack() {
  currentScreen.value = 'map-room'
}
```

Or update ExplorationsScreen directly if it has a back button.

**Step 5: Update GenusLociScreen**

Change `goBack` function from `'home'` to `'map-room'`:
```js
function goBack() {
  emit('navigate', 'map-room')
}
```

**Step 6: Test all back buttons**

- Heroes → Fellowship Hall ✓
- Party → Fellowship Hall ✓
- Fusion → Fellowship Hall ✓
- Shards → Fellowship Hall ✓
- Quests → Map Room ✓
- Explorations → Map Room ✓
- Genus Loci → Map Room ✓
- Inventory → Home ✓

**Step 7: Commit**

```bash
git add src/screens/MergeScreen.vue src/screens/ShardsScreen.vue src/screens/WorldMapScreen.vue src/screens/ExplorationsScreen.vue src/screens/GenusLociScreen.vue src/App.vue
git commit -m "fix: update back button targets for new hub structure"
```

---

## Task 7: Redesign HomeScreen

**Files:**
- Modify: `src/screens/HomeScreen.vue`

**Step 1: Remove old nav buttons**

Remove from template:
- All individual nav buttons (Summon, Heroes, Quests, Inventory, Shards, Explorations)
- The entire Genus Loci section

**Step 2: Add room buttons**

Replace the `<nav class="main-nav">` section with:

```vue
<nav class="main-nav">
  <button
    class="nav-button summon-button"
    :style="{ backgroundImage: `url(${summoningBg})` }"
    @click="emit('navigate', 'gacha')"
  >
    <div class="nav-icon-wrapper summon">
      <span class="nav-icon">✨</span>
    </div>
    <div class="nav-content">
      <span class="nav-label">Summon</span>
      <span class="nav-hint">Get new heroes</span>
    </div>
    <div class="nav-arrow">›</div>
  </button>

  <div class="room-buttons">
    <button class="room-button" @click="emit('navigate', 'fellowship-hall')">
      <div class="room-icon-wrapper fellowship">
        <span class="room-icon">🏰</span>
      </div>
      <span class="room-label">Fellowship Hall</span>
      <span class="room-hint">Manage heroes</span>
    </button>

    <button class="room-button" @click="emit('navigate', 'map-room')">
      <div class="room-icon-wrapper map">
        <span class="room-icon">🗺️</span>
      </div>
      <span class="room-label">Map Room</span>
      <span class="room-hint">Explore world</span>
    </button>

    <button class="room-button" @click="emit('navigate', 'inventory')">
      <div class="room-icon-wrapper store">
        <span class="room-icon">📦</span>
      </div>
      <span class="room-label">Store Room</span>
      <span class="room-hint">Items</span>
    </button>
  </div>
</nav>
```

**Step 3: Add room button styles**

```css
.room-buttons {
  display: flex;
  gap: 12px;
}

.room-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.room-button:hover {
  border-color: #4b5563;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

.room-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-icon-wrapper.fellowship {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.room-icon-wrapper.map {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.room-icon-wrapper.store {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.room-icon {
  font-size: 1.8rem;
}

.room-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f3f4f6;
}

.room-hint {
  font-size: 0.7rem;
  color: #6b7280;
}
```

**Step 4: Remove unused code**

Remove from `<script setup>`:
- `uniqueHeroCount` computed (no longer shown)
- `unlockedGenusLoci`, `hasAnyGenusLoci` computeds
- `getBossPortraitUrl` function
- `enemyPortraits` glob import

Remove from `<style scoped>`:
- All `.genus-loci-*` styles
- Old `.nav-button.heroes-button`, `.quests-button`, etc. specific styles (keep the base `.nav-button` for Summon)

**Step 5: Test manually**

- Verify homescreen shows party preview
- Verify Summon button works
- Verify 3 room buttons display in a row
- Click each room button, verify navigation
- Verify Genus Loci section is gone

**Step 6: Commit**

```bash
git add src/screens/HomeScreen.vue
git commit -m "feat: redesign homescreen with room buttons"
```

---

## Task 8: Final Testing & Cleanup

**Step 1: Full navigation flow test**

Test each path:
- Home → Summon → Back → Home ✓
- Home → Fellowship Hall → Heroes → Back → Fellowship Hall → Back → Home ✓
- Home → Fellowship Hall → Party → Back → Fellowship Hall ✓
- Home → Fellowship Hall → Fusion → Back → Fellowship Hall ✓
- Home → Fellowship Hall → Shards → Back → Fellowship Hall ✓
- Home → Map Room → Quests → Back → Map Room → Back → Home ✓
- Home → Map Room → Explorations → Back → Map Room ✓
- Home → Map Room → Genus Loci → (select boss) → Back → Map Room ✓
- Home → Store Room → Back → Home ✓

**Step 2: Test Add to Party flow**

- Go to Heroes screen
- Select a hero not in party
- Click "Add to Party"
- Verify navigates to Party screen with hero ready to place
- Place hero in slot
- Verify hero appears in party

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: navigation flow refinements"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Create FellowshipHallScreen | New: FellowshipHallScreen.vue, Modify: App.vue |
| 2 | Create MapRoomScreen | New: MapRoomScreen.vue, Modify: App.vue |
| 3 | Create GenusLociListScreen | New: GenusLociListScreen.vue, Modify: App.vue |
| 4 | Create PartyScreen | New: PartyScreen.vue, Modify: App.vue |
| 5 | Update HeroesScreen (remove tabs) | Modify: HeroesScreen.vue |
| 6 | Update back button targets | Modify: 5 screens + App.vue |
| 7 | Redesign HomeScreen | Modify: HomeScreen.vue |
| 8 | Final testing & cleanup | Various |
