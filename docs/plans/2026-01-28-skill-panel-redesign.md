# Skill Panel Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 2x2 action button grid with a compact action bar + slide-up skill panel for cleaner combat UI with progressive disclosure.

**Architecture:** Create a new `SkillPanel.vue` component that slides up from bottom when "Skills" is tapped. The default state shows a thin action bar with hero name and a Skills button. Tapping enemies directly triggers basic attack (implicit). Panel stays open until target confirmed or dismissed.

**Tech Stack:** Vue 3 Composition API, CSS transforms for animation (no height animation), existing resource display components (StatBar, VerseIndicator, etc.)

---

## Task 1: Create SkillPanel Component Shell

**Files:**
- Create: `src/components/SkillPanel.vue`

**Step 1: Create the component with props and basic structure**

```vue
<script setup>
import { ref, computed } from 'vue'
import StatBar from './StatBar.vue'
import VerseIndicator from './VerseIndicator.vue'
import ValorBar from './ValorBar.vue'
import RageBar from './RageBar.vue'
import FocusIndicator from './FocusIndicator.vue'

const props = defineProps({
  hero: {
    type: Object,
    required: true
  },
  skills: {
    type: Array,
    default: () => []
  },
  selectedSkillIndex: {
    type: Number,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-skill', 'select-attack', 'close'])

// Resource type detection
const resourceType = computed(() => props.hero?.class?.resourceType || 'mp')
const resourceName = computed(() => props.hero?.class?.resourceName || 'MP')
</script>

<template>
  <div class="skill-panel-container">
    <!-- Backdrop -->
    <Transition name="backdrop">
      <div
        v-if="isOpen"
        class="skill-panel-backdrop"
        @click="emit('close')"
      ></div>
    </Transition>

    <!-- Slide-up Panel -->
    <Transition name="slide-up">
      <div v-if="isOpen" class="skill-panel">
        <div class="skill-panel-header">
          <button class="close-btn" @click="emit('close')">✕</button>
          <span class="panel-title">Skills</span>
        </div>

        <!-- Resource Display -->
        <div class="resource-display">
          <span class="resource-label">{{ resourceName }}</span>
          <!-- Will add resource-specific displays -->
        </div>

        <!-- Skills List -->
        <div class="skills-list">
          <button
            v-for="(skill, index) in skills"
            :key="skill.name"
            :class="['skill-row', {
              selected: selectedSkillIndex === index,
              disabled: skill.disabled
            }]"
            :disabled="skill.disabled"
            @click="emit('select-skill', index)"
          >
            <span class="skill-name">{{ skill.name }}</span>
            <span v-if="skill.cost !== null" class="skill-cost">
              {{ skill.cost }} {{ skill.costLabel }}
            </span>
            <span v-if="skill.disabled && skill.disabledReason" class="skill-disabled-reason">
              {{ skill.disabledReason }}
            </span>
          </button>
        </div>

        <!-- Basic Attack fallback -->
        <button class="attack-fallback" @click="emit('select-attack')">
          Basic Attack
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.skill-panel-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  pointer-events: none;
}

.skill-panel-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  pointer-events: auto;
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.skill-panel {
  position: relative;
  background: #1f2937;
  border-radius: 16px 16px 0 0;
  padding: 16px;
  pointer-events: auto;
  max-height: 60vh;
  overflow-y: auto;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.skill-panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover {
  color: #f3f4f6;
}

.panel-title {
  font-weight: 600;
  color: #f3f4f6;
}

.resource-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 12px;
}

.resource-label {
  font-size: 0.8rem;
  color: #9ca3af;
  min-width: 50px;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.skill-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #374151;
  border: 2px solid transparent;
  border-radius: 8px;
  color: #f3f4f6;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.skill-row:hover:not(.disabled) {
  background: #4b5563;
  border-color: #6b7280;
}

.skill-row.selected {
  border-color: #3b82f6;
  background: #1e3a5f;
}

.skill-row.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.skill-cost {
  font-size: 0.8rem;
  color: #60a5fa;
  background: #1e3a5f;
  padding: 4px 8px;
  border-radius: 4px;
}

.skill-disabled-reason {
  font-size: 0.75rem;
  color: #f87171;
}

.attack-fallback {
  width: 100%;
  padding: 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.attack-fallback:hover {
  background: #4b5563;
  color: #f3f4f6;
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/SkillPanel.vue
git commit -m "feat: add SkillPanel component shell"
```

---

## Task 2: Add Resource-Specific Displays to SkillPanel

**Files:**
- Modify: `src/components/SkillPanel.vue`

**Step 1: Add resource-specific computed properties and template**

Update the `<script setup>` to add:

```javascript
// Add after existing computed properties

const currentMp = computed(() => props.hero?.currentMp || 0)
const maxMp = computed(() => props.hero?.maxMp || 0)
const currentRage = computed(() => props.hero?.currentRage || 0)
const currentValor = computed(() => props.hero?.currentValor || 0)
const currentVerses = computed(() => props.hero?.currentVerses || 0)
const hasFocus = computed(() => props.hero?.hasFocus || false)
const lastSkillName = computed(() => props.hero?.lastSkillName || null)
```

Update the resource-display section in template:

```vue
<!-- Resource Display -->
<div class="resource-display">
  <!-- MP-based classes -->
  <template v-if="resourceType === 'mp'">
    <span class="resource-label">{{ resourceName }}</span>
    <StatBar :current="currentMp" :max="maxMp" color="blue" size="sm" />
    <span class="resource-numbers">{{ currentMp }}/{{ maxMp }}</span>
  </template>

  <!-- Ranger Focus -->
  <template v-else-if="resourceType === 'focus'">
    <span class="resource-label">Focus</span>
    <FocusIndicator :hasFocus="hasFocus" size="sm" />
  </template>

  <!-- Knight Valor -->
  <template v-else-if="resourceType === 'valor'">
    <span class="resource-label">Valor</span>
    <ValorBar :currentValor="currentValor" size="sm" />
  </template>

  <!-- Berserker Rage -->
  <template v-else-if="resourceType === 'rage'">
    <span class="resource-label">Rage</span>
    <RageBar :currentRage="currentRage" size="sm" />
  </template>

  <!-- Bard Verses -->
  <template v-else-if="resourceType === 'verse'">
    <span class="resource-label">Verses</span>
    <VerseIndicator :currentVerses="currentVerses" size="sm" />
    <span v-if="lastSkillName" class="last-skill-note">Last: {{ lastSkillName }}</span>
  </template>
</div>
```

Add to styles:

```css
.resource-numbers {
  font-size: 0.8rem;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
}

.last-skill-note {
  font-size: 0.7rem;
  color: #9ca3af;
  font-style: italic;
}
```

**Step 2: Commit**

```bash
git add src/components/SkillPanel.vue
git commit -m "feat: add resource-specific displays to SkillPanel"
```

---

## Task 3: Create ActionBar Component

**Files:**
- Create: `src/components/ActionBar.vue`

**Step 1: Create the thin action bar component**

```vue
<script setup>
defineProps({
  heroName: {
    type: String,
    required: true
  },
  hasSkills: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['open-skills'])
</script>

<template>
  <div class="action-bar">
    <div class="turn-indicator">
      <span class="hero-name">{{ heroName }}'s turn</span>
      <span class="hint">Tap enemy to attack</span>
    </div>
    <button
      v-if="hasSkills"
      class="skills-btn"
      @click="emit('open-skills')"
    >
      Skills
    </button>
  </div>
</template>

<style scoped>
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #1f2937;
  border-radius: 12px;
}

.turn-indicator {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-name {
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.95rem;
}

.hint {
  font-size: 0.75rem;
  color: #6b7280;
}

.skills-btn {
  padding: 10px 20px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.skills-btn:hover {
  background: #2563eb;
}

.skills-btn:active {
  transform: scale(0.98);
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/ActionBar.vue
git commit -m "feat: add ActionBar component for compact turn display"
```

---

## Task 4: Integrate SkillPanel and ActionBar into BattleScreen

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Import new components**

Add to imports section (around line 20):

```javascript
import SkillPanel from '../components/SkillPanel.vue'
import ActionBar from '../components/ActionBar.vue'
```

**Step 2: Add skill panel state**

Add after `const showXpFloaters = ref(false)` (around line 109):

```javascript
const skillPanelOpen = ref(false)
```

**Step 3: Create computed for skill panel data**

Add after `canUseSkill` function (around line 310):

```javascript
// Prepare skills data for SkillPanel component
const skillsForPanel = computed(() => {
  return availableSkills.value.map((skill, index) => ({
    name: skill.name,
    cost: getSkillCost(skill),
    costLabel: getSkillCostLabel(skill),
    disabled: !canUseSkill(skill),
    disabledReason: !canUseSkill(skill) ? getSkillDescription(skill) : null
  }))
})

// Get selected skill index from battleStore.selectedAction
const selectedSkillIndexForPanel = computed(() => {
  const action = battleStore.selectedAction
  if (!action || !action.startsWith('skill_')) return null
  return parseInt(action.replace('skill_', ''), 10)
})
```

**Step 4: Add skill panel handlers**

Add after `selectAction` function (around line 655):

```javascript
function openSkillPanel() {
  skillPanelOpen.value = true
}

function closeSkillPanel() {
  skillPanelOpen.value = false
}

function handleSkillSelect(index) {
  selectAction(`skill_${index}`)
  // Don't close panel - wait for target selection
}

function handleAttackFromPanel() {
  selectAction('attack')
  closeSkillPanel()
}
```

**Step 5: Modify selectEnemyTarget to close panel**

Update `selectEnemyTarget` function (around line 657) - add at the end before closing brace:

```javascript
// Close skill panel when target is selected
if (skillPanelOpen.value) {
  skillPanelOpen.value = false
}
```

Also update `selectAllyTarget` similarly if it exists.

**Step 6: Replace action-area template**

Replace the entire `<!-- Action Area -->` section (around lines 1226-1253) with:

```vue
<!-- Action Area -->
<section v-if="battleStore.isPlayerTurn && currentHero" class="action-area">
  <ActionBar
    :heroName="currentHero.template.name"
    :hasSkills="availableSkills.length > 0"
    @open-skills="openSkillPanel"
  />
</section>

<!-- Skill Panel (outside action-area for proper z-index) -->
<SkillPanel
  v-if="currentHero"
  :hero="currentHero"
  :skills="skillsForPanel"
  :selectedSkillIndex="selectedSkillIndexForPanel"
  :isOpen="skillPanelOpen"
  @select-skill="handleSkillSelect"
  @select-attack="handleAttackFromPanel"
  @close="closeSkillPanel"
/>
```

**Step 7: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat: integrate SkillPanel and ActionBar into BattleScreen"
```

---

## Task 5: Handle Implicit Attack (Tap Enemy Without Skill)

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Update selectEnemyTarget for implicit attack**

The function already has this behavior (around line 660-664):

```javascript
// If no action selected yet, clicking enemy selects attack
if (battleStore.isPlayerTurn && !battleStore.selectedAction) {
  selectAction('attack')
  return
}
```

This needs to be updated to also execute immediately when no skill is selected:

```javascript
// If no action selected yet, clicking enemy executes basic attack immediately
if (battleStore.isPlayerTurn && !battleStore.selectedAction) {
  selectAction('attack')
  // Target is this enemy, so also set target and execute
  battleStore.selectTarget(enemy)
  return
}
```

**Step 2: Verify enemy targetability when no action selected**

Check that enemies show targetable state even when no action is selected. This is already handled by:

```javascript
{ targetable: enemiesTargetable || (battleStore.isPlayerTurn && !battleStore.selectedAction) }
```

**Step 3: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat: enable implicit basic attack by tapping enemy"
```

---

## Task 6: Add Long-Press Tooltip for Skill Descriptions

**Files:**
- Modify: `src/components/SkillPanel.vue`

**Step 1: Add tooltip state and handlers**

Update `<script setup>`:

```javascript
import { ref, computed } from 'vue'

// ... existing code ...

const tooltipSkill = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })
let longPressTimer = null

function startLongPress(skill, event) {
  longPressTimer = setTimeout(() => {
    tooltipSkill.value = skill
    // Position tooltip above the touch point
    const rect = event.target.getBoundingClientRect()
    tooltipPosition.value = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    }
  }, 500) // 500ms long press
}

function endLongPress() {
  clearTimeout(longPressTimer)
  longPressTimer = null
}

function closeTooltip() {
  tooltipSkill.value = null
}
```

**Step 2: Update skill row with touch/mouse handlers**

```vue
<button
  v-for="(skill, index) in skills"
  :key="skill.name"
  :class="['skill-row', {
    selected: selectedSkillIndex === index,
    disabled: skill.disabled
  }]"
  :disabled="skill.disabled"
  @click="emit('select-skill', index)"
  @mousedown="startLongPress(skills[index], $event)"
  @mouseup="endLongPress"
  @mouseleave="endLongPress"
  @touchstart.passive="startLongPress(skills[index], $event)"
  @touchend="endLongPress"
  @touchcancel="endLongPress"
>
  <!-- ... existing content ... -->
</button>
```

**Step 3: Add tooltip element**

Add after the skills-list div:

```vue
<!-- Skill Tooltip -->
<Teleport to="body">
  <Transition name="tooltip">
    <div
      v-if="tooltipSkill"
      class="skill-tooltip"
      :style="{
        left: tooltipPosition.x + 'px',
        top: tooltipPosition.y + 'px'
      }"
      @click="closeTooltip"
    >
      <div class="tooltip-content">
        <strong>{{ tooltipSkill.name }}</strong>
        <p>{{ tooltipSkill.fullDescription || 'No description available.' }}</p>
      </div>
    </div>
  </Transition>
</Teleport>
```

**Step 4: Add tooltip styles**

```css
.skill-tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  z-index: 1000;
  pointer-events: auto;
}

.tooltip-content {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 12px;
  max-width: 250px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.tooltip-content strong {
  display: block;
  color: #f3f4f6;
  margin-bottom: 4px;
}

.tooltip-content p {
  color: #9ca3af;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.4;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
```

**Step 5: Update skillsForPanel in BattleScreen to include full description**

In `src/screens/BattleScreen.vue`, update the `skillsForPanel` computed:

```javascript
const skillsForPanel = computed(() => {
  return availableSkills.value.map((skill, index) => ({
    name: skill.name,
    cost: getSkillCost(skill),
    costLabel: getSkillCostLabel(skill),
    disabled: !canUseSkill(skill),
    disabledReason: !canUseSkill(skill) ? getSkillDescription(skill) : null,
    fullDescription: skill.description // Add full description for tooltip
  }))
})
```

**Step 6: Commit**

```bash
git add src/components/SkillPanel.vue src/screens/BattleScreen.vue
git commit -m "feat: add long-press tooltip for skill descriptions"
```

---

## Task 7: Add Reduced Motion Support

**Files:**
- Modify: `src/components/SkillPanel.vue`

**Step 1: Add reduced motion media query**

Add to the end of `<style scoped>`:

```css
/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .backdrop-enter-active,
  .backdrop-leave-active,
  .slide-up-enter-active,
  .slide-up-leave-active,
  .tooltip-enter-active,
  .tooltip-leave-active {
    transition: none;
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: none;
  }
}
```

**Step 2: Commit**

```bash
git add src/components/SkillPanel.vue
git commit -m "feat: add reduced motion support to SkillPanel"
```

---

## Task 8: Clean Up Old ActionButton Usage

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Remove ActionButton import if no longer used elsewhere**

Check if ActionButton is used elsewhere in BattleScreen. If it's only used in the old action-area, remove the import:

```javascript
// Remove this line if ActionButton is no longer used:
import ActionButton from '../components/ActionButton.vue'
```

**Step 2: Remove old action-buttons styles**

Remove these styles from BattleScreen (around lines 2129-2138):

```css
/* REMOVE THESE */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.action-buttons > * {
  flex: 1 1 calc(50% - 6px);
  max-width: calc(50% - 6px);
}
```

**Step 3: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "refactor: remove old action button grid styles"
```

---

## Task 9: Manual Testing Checklist

**Test these scenarios:**

1. **Basic attack (implicit):**
   - [ ] Tap enemy when no skill selected → basic attack executes immediately
   - [ ] Enemy shows targetable state when it's player turn

2. **Skill panel open/close:**
   - [ ] Tap "Skills" button → panel slides up
   - [ ] Tap backdrop → panel closes
   - [ ] Tap X button → panel closes

3. **Skill selection:**
   - [ ] Tap a skill → skill highlights, panel stays open
   - [ ] Tap a different skill → selection changes
   - [ ] Tap target → action executes, panel closes

4. **Resource display:**
   - [ ] MP-based heroes show MP bar
   - [ ] Rangers show Focus indicator
   - [ ] Knights show Valor bar
   - [ ] Berserkers show Rage bar
   - [ ] Bards show Verse indicator + last skill name

5. **Disabled skills:**
   - [ ] Skills with insufficient resources are grayed
   - [ ] Bard's last-used skill is disabled
   - [ ] Cooldown skills show disabled

6. **Long-press tooltip:**
   - [ ] Long-press (500ms) on skill → tooltip appears
   - [ ] Release → tooltip stays until tapped
   - [ ] Shows full skill description

7. **Reduced motion:**
   - [ ] Enable prefers-reduced-motion → no animations

8. **Edge cases:**
   - [ ] Hero with no skills → "Skills" button hidden
   - [ ] All skills disabled → can still use Basic Attack
   - [ ] Turn changes → panel closes automatically

---

## Task 10: Final Polish and Commit

**Files:**
- Modify: Various

**Step 1: Run build to verify no errors**

```bash
npm run build
```

**Step 2: Test in browser**

```bash
npm run dev
```

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete skill panel redesign with progressive disclosure"
```

---

## Summary of Changes

| Component | Purpose |
|-----------|---------|
| `SkillPanel.vue` | Slide-up panel with skills list, resource display, tooltip |
| `ActionBar.vue` | Thin bar showing turn + "Skills" button |
| `BattleScreen.vue` | Integration, implicit attack handling, state management |

**Key UX improvements:**
- Basic attack is zero taps (tap enemy directly)
- Skills are progressive disclosure (tap to reveal)
- Panel stays open for mind-changing
- Long-press for descriptions (tooltip)
- Resource-specific displays in panel
- Proper reduced motion support
