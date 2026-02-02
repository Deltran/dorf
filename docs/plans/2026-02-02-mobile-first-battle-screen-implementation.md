# Mobile-First Battle Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the battle screen to fit properly on mobile devices by creating compact hero/enemy info displays, fixing the action bar, and improving the combat log.

**Architecture:** Component-based refactoring. Create new compact variants of existing components rather than modifying the originals in-place, allowing gradual rollout and easy rollback. Status icons will be moved to sprite overlays, info panels will be reduced to bars-only, and the skill panel will use a 2-column grid layout.

**Tech Stack:** Vue 3 Composition API, scoped CSS, existing StatBar/resource bar components.

**Reference Design:** See `docs/plans/2026-02-02-mobile-first-battle-screen.md`

---

## Task 1: Create Compact Hero Info Component

Create a new `HeroBattleInfo.vue` component that shows only HP bar and resource bar (no labels, no numbers). This replaces the current `HeroCard` with `showBars` in battle context.

**Files:**
- Create: `src/components/HeroBattleInfo.vue`
- Test: Manual testing on device (visual component)

**Step 1: Create the component file**

```vue
<script setup>
import { computed } from 'vue'
import StatBar from './StatBar.vue'
import FocusIndicator from './FocusIndicator.vue'
import ValorBar from './ValorBar.vue'
import RageBar from './RageBar.vue'
import VerseIndicator from './VerseIndicator.vue'
import EssenceBar from './EssenceBar.vue'
import { getClass } from '../data/classes.js'

const props = defineProps({
  hero: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  hitEffect: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['click'])

const heroClass = computed(() => {
  if (props.hero.class) return props.hero.class
  return getClass(props.hero.template?.classId)
})

const isRanger = computed(() => heroClass.value?.resourceType === 'focus')
const isKnight = computed(() => heroClass.value?.resourceType === 'valor')
const isBerserker = computed(() => heroClass.value?.resourceType === 'rage')
const isBard = computed(() => heroClass.value?.resourceType === 'verse')
const isAlchemist = computed(() => heroClass.value?.resourceType === 'essence')

const isDead = computed(() => props.hero.currentHp !== undefined && props.hero.currentHp <= 0)
</script>

<template>
  <div
    :class="[
      'hero-battle-info',
      { active, dead: isDead },
      hitEffect ? `hit-${hitEffect}` : ''
    ]"
    @click="emit('click', hero)"
  >
    <StatBar
      :current="hero.currentHp"
      :max="hero.maxHp"
      color="green"
      size="sm"
      :showLabel="false"
      :showNumbers="false"
    />
    <FocusIndicator
      v-if="isRanger"
      :hasFocus="hero.hasFocus"
      size="xs"
    />
    <ValorBar
      v-else-if="isKnight"
      :currentValor="hero.currentValor || 0"
      size="xs"
    />
    <RageBar
      v-else-if="isBerserker"
      :currentRage="hero.currentRage || 0"
      size="xs"
    />
    <VerseIndicator
      v-else-if="isBard"
      :currentVerses="hero.currentVerses || 0"
      size="xs"
    />
    <EssenceBar
      v-else-if="isAlchemist"
      :currentEssence="hero.currentEssence || 0"
      :maxEssence="hero.maxEssence || 60"
      size="xs"
    />
    <StatBar
      v-else
      :current="hero.currentMp"
      :max="hero.maxMp"
      color="blue"
      size="xs"
      :showLabel="false"
      :showNumbers="false"
    />
  </div>
</template>

<style scoped>
.hero-battle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 6px;
  background: rgba(17, 24, 39, 0.8);
  border-radius: 4px;
  min-width: 60px;
  user-select: none;
}

.hero-battle-info.active {
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
}

.hero-battle-info.dead {
  opacity: 0.5;
}

/* Hit effects - same as HeroCard */
.hero-battle-info.hit-damage {
  animation: hitDamage 0.3s ease-out;
}

.hero-battle-info.hit-heal {
  animation: hitHeal 0.4s ease-out;
}

.hero-battle-info.hit-buff {
  animation: hitBuff 0.4s ease-out;
}

.hero-battle-info.hit-debuff {
  animation: hitDebuff 0.3s ease-out;
}

@keyframes hitDamage {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(-4px); background-color: rgba(239, 68, 68, 0.3); }
  30% { transform: translateX(4px); }
  50% { transform: translateX(-3px); }
  70% { transform: translateX(2px); }
  90% { transform: translateX(-1px); }
}

@keyframes hitHeal {
  0% { box-shadow: inset 0 0 0 rgba(34, 197, 94, 0); }
  50% { box-shadow: inset 0 0 20px rgba(34, 197, 94, 0.4); }
  100% { box-shadow: inset 0 0 0 rgba(34, 197, 94, 0); }
}

@keyframes hitBuff {
  0% { box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
  50% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.6); }
  100% { box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
}

@keyframes hitDebuff {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(168, 85, 247, 0.3); }
}
</style>
```

**Step 2: Update StatBar to support hiding label/numbers**

Modify `src/components/StatBar.vue` to accept `showLabel` and `showNumbers` props (defaulting to true for backwards compatibility).

**Step 3: Commit**

```bash
git add src/components/HeroBattleInfo.vue src/components/StatBar.vue
git commit -m "feat(battle): add compact HeroBattleInfo component for mobile"
```

---

## Task 2: Update StatBar Component

Add props to StatBar for hiding labels and numbers.

**Files:**
- Modify: `src/components/StatBar.vue`

**Step 1: Read current StatBar implementation**

Run: Read `src/components/StatBar.vue` to understand current props.

**Step 2: Add showLabel and showNumbers props**

Add to props:
```js
showLabel: {
  type: Boolean,
  default: true
},
showNumbers: {
  type: Boolean,
  default: true
}
```

**Step 3: Conditionally render label and numbers in template**

Wrap label in `v-if="showLabel"` and numbers in `v-if="showNumbers"`.

**Step 4: Add size="xs" support**

Add CSS for `.stat-bar.xs` with smaller height (~6px bar, tighter padding).

**Step 5: Commit**

```bash
git add src/components/StatBar.vue
git commit -m "feat(StatBar): add showLabel, showNumbers props and xs size"
```

---

## Task 3: Create Status Overlay Component

Create `StatusOverlay.vue` that displays status effect icons as an overlay for sprites.

**Files:**
- Create: `src/components/StatusOverlay.vue`

**Step 1: Create the component**

```vue
<script setup>
import { computed } from 'vue'
import { useTooltip } from '../composables/useTooltip.js'

const props = defineProps({
  effects: {
    type: Array,
    default: () => []
  },
  position: {
    type: String,
    default: 'top-right' // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  },
  maxVisible: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['click'])

const { onClick: showTooltip } = useTooltip()

const visibleEffects = computed(() => props.effects.slice(0, props.maxVisible))
const overflowCount = computed(() => Math.max(0, props.effects.length - props.maxVisible))

function handleEffectClick(effect, event) {
  event.stopPropagation()
  emit('click', effect)
}
</script>

<template>
  <div :class="['status-overlay', position]" v-if="effects.length > 0">
    <div
      v-for="(effect, index) in visibleEffects"
      :key="index"
      class="overlay-icon"
      :class="{ buff: effect.definition?.isBuff, debuff: !effect.definition?.isBuff }"
      :title="effect.definition?.name"
      @click="handleEffectClick(effect, $event)"
    >
      {{ effect.definition?.icon }}
    </div>
    <div v-if="overflowCount > 0" class="overflow-badge">
      +{{ overflowCount }}
    </div>
  </div>
</template>

<style scoped>
.status-overlay {
  position: absolute;
  display: flex;
  gap: 2px;
  z-index: 10;
  pointer-events: auto;
}

.status-overlay.top-right {
  top: 2px;
  right: 2px;
}

.status-overlay.top-left {
  top: 2px;
  left: 2px;
}

.status-overlay.bottom-right {
  bottom: 2px;
  right: 2px;
}

.status-overlay.bottom-left {
  bottom: 2px;
  left: 2px;
}

.overlay-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.7);
  cursor: pointer;
}

.overlay-icon.buff {
  border: 1px solid rgba(34, 197, 94, 0.6);
}

.overlay-icon.debuff {
  border: 1px solid rgba(239, 68, 68, 0.6);
}

.overflow-badge {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  color: #9ca3af;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 3px;
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/StatusOverlay.vue
git commit -m "feat(battle): add StatusOverlay component for sprite status icons"
```

---

## Task 4: Create Hero Detail Sheet Component

Create `HeroDetailSheet.vue` - a bottom drawer showing full hero stats when tapped.

**Files:**
- Create: `src/components/HeroDetailSheet.vue`

**Step 1: Create the component**

```vue
<script setup>
import { computed } from 'vue'
import StatBar from './StatBar.vue'
import FocusIndicator from './FocusIndicator.vue'
import ValorBar from './ValorBar.vue'
import RageBar from './RageBar.vue'
import VerseIndicator from './VerseIndicator.vue'
import EssenceBar from './EssenceBar.vue'
import { getClass } from '../data/classes.js'

const props = defineProps({
  hero: {
    type: Object,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const heroClass = computed(() => {
  if (!props.hero) return null
  if (props.hero.class) return props.hero.class
  return getClass(props.hero.template?.classId)
})

const isRanger = computed(() => heroClass.value?.resourceType === 'focus')
const isKnight = computed(() => heroClass.value?.resourceType === 'valor')
const isBerserker = computed(() => heroClass.value?.resourceType === 'rage')
const isBard = computed(() => heroClass.value?.resourceType === 'verse')
const isAlchemist = computed(() => heroClass.value?.resourceType === 'essence')

function getEffectDescription(effect) {
  const lines = []
  if (effect.sourceName) lines.push(`From: ${effect.sourceName}`)
  if (effect.definition?.name) lines.push(effect.definition.name)
  lines.push(`${effect.duration} turn${effect.duration !== 1 ? 's' : ''} remaining`)
  return lines.join(' · ')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="isOpen"
        class="sheet-backdrop"
        @click="emit('close')"
      />
    </Transition>
  </Teleport>

  <Transition name="sheet">
    <div v-if="isOpen && hero" class="hero-detail-sheet">
      <div class="sheet-handle" @click="emit('close')">
        <div class="handle-bar"></div>
      </div>

      <div class="sheet-header">
        <span class="hero-name">{{ hero.template?.name }}</span>
        <span class="hero-level">Lv. {{ hero.level }}</span>
      </div>

      <div class="sheet-bars">
        <StatBar
          :current="hero.currentHp"
          :max="hero.maxHp"
          label="HP"
          color="green"
          size="md"
        />
        <FocusIndicator v-if="isRanger" :hasFocus="hero.hasFocus" size="md" />
        <ValorBar v-else-if="isKnight" :currentValor="hero.currentValor || 0" size="md" />
        <RageBar v-else-if="isBerserker" :currentRage="hero.currentRage || 0" size="md" />
        <VerseIndicator v-else-if="isBard" :currentVerses="hero.currentVerses || 0" size="md" />
        <EssenceBar v-else-if="isAlchemist" :currentEssence="hero.currentEssence || 0" :maxEssence="hero.maxEssence || 60" size="md" />
        <StatBar v-else :current="hero.currentMp" :max="hero.maxMp" :label="heroClass?.resourceName || 'MP'" color="blue" size="md" />
      </div>

      <div class="sheet-stats">
        <div class="stat"><span class="stat-label">ATK</span><span class="stat-value">{{ hero.atk }}</span></div>
        <div class="stat"><span class="stat-label">DEF</span><span class="stat-value">{{ hero.def }}</span></div>
        <div class="stat"><span class="stat-label">SPD</span><span class="stat-value">{{ hero.spd }}</span></div>
      </div>

      <div v-if="hero.statusEffects?.length > 0" class="sheet-effects">
        <div class="effects-label">Status Effects</div>
        <div
          v-for="(effect, index) in hero.statusEffects"
          :key="index"
          class="effect-row"
          :class="{ buff: effect.definition?.isBuff, debuff: !effect.definition?.isBuff }"
        >
          <span class="effect-icon">{{ effect.definition?.icon }}</span>
          <span class="effect-text">{{ getEffectDescription(effect) }}</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.hero-detail-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1f2937;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  padding: 8px 16px 24px;
  z-index: 101;
  max-height: 60vh;
  overflow-y: auto;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}

.sheet-handle {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  cursor: pointer;
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: #4b5563;
  border-radius: 2px;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.hero-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.hero-level {
  font-size: 0.85rem;
  color: #9ca3af;
}

.sheet-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.sheet-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  padding: 12px;
  background: #111827;
  border-radius: 8px;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.7rem;
  color: #6b7280;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.sheet-effects {
  margin-top: 12px;
}

.effects-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.effect-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #111827;
  border-radius: 4px;
  margin-bottom: 4px;
}

.effect-row.buff {
  border-left: 2px solid #22c55e;
}

.effect-row.debuff {
  border-left: 2px solid #ef4444;
}

.effect-icon {
  font-size: 1rem;
}

.effect-text {
  font-size: 0.8rem;
  color: #d1d5db;
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/HeroDetailSheet.vue
git commit -m "feat(battle): add HeroDetailSheet bottom drawer for hero details"
```

---

## Task 5: Update Resource Indicator Components for xs Size

Add `size="xs"` support to FocusIndicator, ValorBar, RageBar, VerseIndicator, and EssenceBar.

**Files:**
- Modify: `src/components/FocusIndicator.vue`
- Modify: `src/components/ValorBar.vue`
- Modify: `src/components/RageBar.vue`
- Modify: `src/components/VerseIndicator.vue`
- Modify: `src/components/EssenceBar.vue`

**Step 1: Read each component to understand current structure**

**Step 2: Add xs size CSS to each**

For bar-style components, xs should be ~6px height with no text. For indicators like FocusIndicator and VerseIndicator, xs should be smaller icons/dots.

**Step 3: Commit**

```bash
git add src/components/FocusIndicator.vue src/components/ValorBar.vue src/components/RageBar.vue src/components/VerseIndicator.vue src/components/EssenceBar.vue
git commit -m "feat(resources): add xs size to all resource indicator components"
```

---

## Task 6: Refactor SkillPanel to 2-Column Grid Layout

Update SkillPanel.vue to use a 2-column grid for skills with larger touch targets.

**Files:**
- Modify: `src/components/SkillPanel.vue`

**Step 1: Change skills layout from column to grid**

Replace `.skills-list` column layout with a 2-column grid:

```css
.skills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.skill-btn {
  padding: 16px 12px;
  min-height: 56px;
  /* ... existing button styles ... */
}
```

**Step 2: Update template to use grid class**

Change `<div class="skills-list">` to `<div class="skills-grid">` and update button class.

**Step 3: Move description to floating tooltip**

Instead of the side panel, show skill description as a floating tooltip above the button on long-press/hover. Use absolute positioning so it never shifts button layout.

**Step 4: Commit**

```bash
git add src/components/SkillPanel.vue
git commit -m "feat(SkillPanel): switch to 2-column grid with larger touch targets"
```

---

## Task 7: Update ActionBar - Remove Hint Text

Simplify ActionBar.vue by removing the "tap enemy to attack" hint.

**Files:**
- Modify: `src/components/ActionBar.vue`

**Step 1: Remove the hint span**

Delete: `<span class="hint">tap enemy to attack</span>`

**Step 2: Adjust padding if needed**

The hero-card section may need slight padding adjustment without the hint.

**Step 3: Commit**

```bash
git add src/components/ActionBar.vue
git commit -m "feat(ActionBar): remove hint text for cleaner mobile display"
```

---

## Task 8: Update BattleScreen - Hero Area with New Components

Integrate the new compact components into BattleScreen.vue hero area.

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Import new components**

Add imports:
```js
import HeroBattleInfo from '../components/HeroBattleInfo.vue'
import StatusOverlay from '../components/StatusOverlay.vue'
import HeroDetailSheet from '../components/HeroDetailSheet.vue'
```

**Step 2: Add state for detail sheet**

```js
const detailSheetHero = ref(null)

function openHeroDetail(hero) {
  detailSheetHero.value = hero
}

function closeHeroDetail() {
  detailSheetHero.value = null
}
```

**Step 3: Update hero-wrapper template**

Replace `<HeroCard ... showBars compact />` with:
```vue
<div class="hero-image-container">
  <StatusOverlay
    :effects="hero.statusEffects"
    position="top-right"
    @click="openHeroDetail(hero)"
  />
  <img ... />
</div>
<HeroBattleInfo
  :hero="hero"
  :active="battleStore.currentUnit?.instanceId === hero.instanceId"
  :hitEffect="getHeroHitEffect(hero.instanceId)"
  @click="handleHeroClick(hero)"
/>
```

**Step 4: Add HeroDetailSheet at end of template**

```vue
<HeroDetailSheet
  :hero="detailSheetHero"
  :isOpen="!!detailSheetHero"
  @close="closeHeroDetail"
/>
```

**Step 5: Update hero click handler for tap-to-inspect**

Modify `handleHeroClick` to open detail sheet when not in targeting mode.

**Step 6: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat(BattleScreen): integrate compact hero components and detail sheet"
```

---

## Task 9: Update BattleScreen - Enemy Status Overlay

Add StatusOverlay to enemy display in BattleScreen.

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Add StatusOverlay to enemy-wrapper**

In the enemy display section, add StatusOverlay to enemy sprite containers.

**Step 2: Remove status effects from EnemyCard display**

If EnemyCard still shows status effects, consider hiding them since they're now on the overlay.

**Step 3: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat(BattleScreen): add status overlay to enemy sprites"
```

---

## Task 10: Update Combat Log - Collapsible Single Line

Make combat log show single line by default, expandable on tap.

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Add state for log expansion**

```js
const combatLogExpanded = ref(false)

function toggleCombatLog() {
  combatLogExpanded.value = !combatLogExpanded.value
}
```

**Step 2: Update battle-log template**

```vue
<section class="battle-log" :class="{ expanded: combatLogExpanded }" @click="toggleCombatLog">
  <div class="log-entries">
    <p v-if="!combatLogExpanded && battleStore.battleLog.length > 0">
      {{ battleStore.battleLog[battleStore.battleLog.length - 1].message }}
    </p>
    <template v-else>
      <p v-for="(entry, index) in battleStore.battleLog.slice(-15)" :key="index">
        {{ entry.message }}
      </p>
    </template>
  </div>
  <div class="log-expand-hint">{{ combatLogExpanded ? 'tap to collapse' : 'tap for history' }}</div>
</section>
```

**Step 3: Add CSS for collapsed/expanded states**

```css
.battle-log {
  cursor: pointer;
  max-height: 32px;
  overflow: hidden;
  transition: max-height 0.2s ease;
}

.battle-log.expanded {
  max-height: 200px;
  overflow-y: auto;
}

.log-expand-hint {
  font-size: 0.65rem;
  color: #6b7280;
  text-align: center;
}
```

**Step 4: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat(BattleScreen): make combat log collapsible with single-line default"
```

---

## Task 11: Update Hero Area CSS for Mobile Fit

Update .hero-area and .hero-wrapper CSS to ensure 4 heroes fit without overflow.

**Files:**
- Modify: `src/screens/BattleScreen.vue` (style section)

**Step 1: Update .hero-area CSS**

```css
.hero-area {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 0 4px;
  width: 100%;
  box-sizing: border-box;
}
```

**Step 2: Update .hero-wrapper CSS**

```css
.hero-wrapper {
  flex: 1;
  max-width: 24%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
```

**Step 3: Adjust hero image sizing if needed**

Ensure hero images scale appropriately within the narrower wrappers.

**Step 4: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "style(BattleScreen): update hero-area CSS for mobile 4-across fit"
```

---

## Task 12: Manual Testing and Polish

Test on physical Android device and adjust spacing/sizing as needed.

**Files:**
- Various - based on testing results

**Step 1: Build and deploy to device**

```bash
npm run build
npm run cap:sync
cd android && ./gradlew assembleDebug
```

**Step 2: Install APK and test**

- Verify 4 heroes fit without overflow
- Test tap on hero sprite opens detail sheet
- Test skill panel grid layout and touch targets
- Test combat log collapse/expand
- Verify status overlays appear correctly

**Step 3: Make adjustments as needed**

Document any issues and fix iteratively.

**Step 4: Final commit**

```bash
git add -A
git commit -m "polish(battle): mobile testing fixes and adjustments"
```

---

## Summary

| Task | Component/File | Purpose |
|------|---------------|---------|
| 1 | HeroBattleInfo.vue | Compact HP/resource bars only |
| 2 | StatBar.vue | Add showLabel/showNumbers props |
| 3 | StatusOverlay.vue | Status icons on sprites |
| 4 | HeroDetailSheet.vue | Bottom drawer for full stats |
| 5 | Resource indicators | Add xs size support |
| 6 | SkillPanel.vue | 2-column grid, larger buttons |
| 7 | ActionBar.vue | Remove hint text |
| 8 | BattleScreen.vue | Integrate hero components |
| 9 | BattleScreen.vue | Enemy status overlays |
| 10 | BattleScreen.vue | Collapsible combat log |
| 11 | BattleScreen.vue CSS | Mobile-fit hero area |
| 12 | Testing | Device testing and polish |
