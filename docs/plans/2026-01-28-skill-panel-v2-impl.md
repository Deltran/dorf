# Skill Panel V2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace bottom-sheet skill panel with right-aligned overlay featuring integrated hover description and Dorf-authentic aesthetic.

**Architecture:** Complete rewrite of SkillPanel.vue and ActionBar.vue. SkillPanel becomes a right-aligned overlay (50% content width) with description panel that slides in from left on hover. ActionBar simplifies to hero name as clickable trigger. BattleScreen passes class color for accent theming.

**Tech Stack:** Vue 3 Composition API, CSS transforms only (no height animation), CSS custom properties for class colors, noise texture via inline SVG data URI.

---

## Task 1: Add Class Colors to classes.js

**Files:**
- Modify: `src/data/classes.js`

**Step 1: Add color property to each class**

```javascript
export const classes = {
  paladin: {
    id: 'paladin',
    title: 'Paladin',
    role: 'tank',
    resourceName: 'Faith',
    color: '#fbbf24'
  },
  knight: {
    id: 'knight',
    title: 'Knight',
    role: 'tank',
    resourceName: 'Valor',
    resourceType: 'valor',
    color: '#3b82f6'
  },
  mage: {
    id: 'mage',
    title: 'Mage',
    role: 'dps',
    resourceName: 'Mana',
    color: '#a855f7'
  },
  berserker: {
    id: 'berserker',
    title: 'Berserker',
    role: 'dps',
    resourceName: 'Rage',
    resourceType: 'rage',
    color: '#ef4444'
  },
  ranger: {
    id: 'ranger',
    title: 'Ranger',
    role: 'dps',
    resourceName: 'Focus',
    resourceType: 'focus',
    color: '#f59e0b'
  },
  cleric: {
    id: 'cleric',
    title: 'Cleric',
    role: 'healer',
    resourceName: 'Devotion',
    color: '#22c55e'
  },
  druid: {
    id: 'druid',
    title: 'Druid',
    role: 'healer',
    resourceName: 'Nature',
    color: '#10b981'
  },
  bard: {
    id: 'bard',
    title: 'Bard',
    role: 'support',
    resourceName: 'Verse',
    resourceType: 'verse',
    color: '#ec4899'
  },
  alchemist: {
    id: 'alchemist',
    title: 'Alchemist',
    role: 'support',
    resourceName: 'Essence',
    color: '#06b6d4'
  }
}
```

**Step 2: Run build to verify**

```bash
npx vite build
```

**Step 3: Commit**

```bash
git add src/data/classes.js
git commit -m "feat: add color property to class definitions"
```

---

## Task 2: Rewrite ActionBar Component

**Files:**
- Modify: `src/components/ActionBar.vue`

**Step 1: Replace entire file with new implementation**

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  heroName: {
    type: String,
    required: true
  },
  classColor: {
    type: String,
    default: '#3b82f6'
  },
  role: {
    type: String,
    default: 'dps'
  },
  hasSkills: {
    type: Boolean,
    default: true
  },
  isStunned: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-skills'])

const roleIcon = computed(() => {
  const icons = {
    tank: '🛡️',
    dps: '⚔️',
    healer: '💚',
    support: '✨'
  }
  return icons[props.role] || '⚔️'
})

function handleClick() {
  if (!props.isStunned && props.hasSkills) {
    emit('open-skills')
  }
}
</script>

<template>
  <div class="action-bar">
    <button
      :class="['hero-trigger', { stunned: isStunned, disabled: !hasSkills }]"
      :style="{ '--class-color': classColor }"
      :disabled="isStunned || !hasSkills"
      @click="handleClick"
    >
      <span class="role-icon">{{ roleIcon }}</span>
      <span class="hero-name">{{ heroName }}</span>
    </button>
    <span class="hint">tap to select skill</span>
  </div>
</template>

<style scoped>
.action-bar {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.hero-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #111827;
  border: none;
  border-left: 3px solid var(--class-color);
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s ease, border-color 0.1s ease;
  text-align: left;
}

.hero-trigger:hover:not(:disabled) {
  transform: translateX(4px);
}

.hero-trigger:active:not(:disabled) {
  transform: translateX(2px);
}

.hero-trigger.stunned .hero-name {
  text-decoration: line-through;
  color: #6b7280;
}

.hero-trigger.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.role-icon {
  font-size: 1.1rem;
}

.hero-name {
  letter-spacing: 0.02em;
}

.hint {
  font-size: 0.7rem;
  color: #6b7280;
  padding-left: 19px;
  text-transform: lowercase;
}
</style>
```

**Step 2: Run build to verify**

```bash
npx vite build
```

**Step 3: Commit**

```bash
git add src/components/ActionBar.vue
git commit -m "feat: redesign ActionBar as hero name trigger"
```

---

## Task 3: Rewrite SkillPanel Component - Structure

**Files:**
- Modify: `src/components/SkillPanel.vue`

**Step 1: Replace script setup and template**

```vue
<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  hero: {
    type: Object,
    required: true
  },
  skills: {
    type: Array,
    default: () => []
  },
  isOpen: {
    type: Boolean,
    default: false
  },
  classColor: {
    type: String,
    default: '#3b82f6'
  }
})

const emit = defineEmits(['select-skill', 'close'])

// Hovered skill for description panel
const hoveredSkill = ref(null)
const hoveredIndex = ref(null)

// Touch handling - keep description visible until panel closes or another skill touched
let isTouchDevice = false

function handleSkillEnter(skill, index, event) {
  if (event.type === 'touchstart') {
    isTouchDevice = true
  }
  hoveredSkill.value = skill
  hoveredIndex.value = index
}

function handleSkillLeave() {
  // On touch devices, don't hide on leave - only on panel close or new touch
  if (!isTouchDevice) {
    hoveredSkill.value = null
    hoveredIndex.value = null
  }
}

function handleSkillSelect(index) {
  emit('select-skill', index)
}

// Clear hover state when panel closes
watch(() => props.isOpen, (open) => {
  if (!open) {
    hoveredSkill.value = null
    hoveredIndex.value = null
    isTouchDevice = false
  }
})

// Resource display
const resourceType = computed(() => props.hero?.class?.resourceType || 'mp')

const resourceDisplay = computed(() => {
  const h = props.hero
  if (!h) return null

  switch (resourceType.value) {
    case 'rage':
      return { icon: '🔥', value: h.currentRage || 0, max: 100 }
    case 'focus':
      return { icon: '🎯', value: h.hasFocus ? 'Ready' : '—', max: null }
    case 'valor':
      return { icon: '⚜️', value: h.currentValor || 0, max: 3 }
    case 'verse':
      return { icon: '🎵', value: `${h.currentVerses || 0}/3`, max: null }
    default:
      return { icon: '⚡', value: h.currentMp || 0, max: h.maxMp || 0 }
  }
})

// Cost formatting
function formatCost(skill) {
  if (skill.cost === null || skill.cost === undefined) return 'Free'
  if (skill.cost === 0) return 'Free'
  return `${skill.cost} ${skill.costLabel || ''}`
}

// Target type formatting
function formatTargetType(skill) {
  const types = {
    'enemy': 'Single Enemy',
    'all_enemies': 'All Enemies',
    'ally': 'Single Ally',
    'all_allies': 'All Allies',
    'self': 'Self'
  }
  return types[skill.targetType] || ''
}
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="isOpen"
        class="skill-panel-backdrop"
        @click="emit('close')"
      />
    </Transition>
  </Teleport>

  <div
    :class="['skill-panel-container', { open: isOpen }]"
    :style="{ '--class-color': classColor }"
  >
    <Transition name="panel">
      <div v-if="isOpen" class="skill-panel">
        <!-- Description Panel (left) -->
        <Transition name="description">
          <div v-if="hoveredSkill" class="description-panel">
            <div class="description-content">
              <h3 class="skill-title" :style="{ color: classColor }">
                {{ hoveredSkill.name }}
              </h3>
              <p class="skill-cost">{{ formatCost(hoveredSkill) }}</p>
              <p class="skill-desc">
                {{ hoveredSkill.fullDescription || 'No description available.' }}
              </p>
              <span v-if="formatTargetType(hoveredSkill)" class="target-tag">
                {{ formatTargetType(hoveredSkill) }}
              </span>
            </div>
          </div>
        </Transition>

        <!-- Skills Column (right) -->
        <div class="skills-column">
          <!-- Resource indicator -->
          <div v-if="resourceDisplay" class="resource-line">
            <span class="resource-icon">{{ resourceDisplay.icon }}</span>
            <span class="resource-value">
              {{ resourceDisplay.value }}
              <template v-if="resourceDisplay.max && typeof resourceDisplay.value === 'number'">
                /{{ resourceDisplay.max }}
              </template>
            </span>
          </div>

          <!-- Skill rows -->
          <div class="skills-list">
            <button
              v-for="(skill, index) in skills"
              :key="skill.name"
              :class="['skill-row', {
                disabled: skill.disabled,
                hovered: hoveredIndex === index
              }]"
              :disabled="skill.disabled"
              @mouseenter="handleSkillEnter(skill, index, $event)"
              @mouseleave="handleSkillLeave"
              @touchstart.passive="handleSkillEnter(skill, index, $event)"
              @click="handleSkillSelect(index)"
            >
              <span class="skill-name">{{ skill.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
```

**Step 2: Continue to Task 4 for styles**

---

## Task 4: SkillPanel Component - Styles

**Files:**
- Modify: `src/components/SkillPanel.vue`

**Step 1: Add style section after template**

```vue
<style scoped>
/* Noise texture as data URI */
.skill-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  border-radius: inherit;
}

.skill-panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 40;
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.skill-panel-container {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  z-index: 50;
  pointer-events: none;
  padding: 0 16px;
  box-sizing: border-box;
}

.skill-panel {
  position: relative;
  display: flex;
  justify-content: flex-end;
  pointer-events: auto;
}

.panel-enter-active,
.panel-leave-active {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-enter-from,
.panel-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* Skills Column (right side) */
.skills-column {
  width: 50%;
  background: #111827;
  border-left: 3px solid var(--class-color);
  border-top: 1px solid #374151;
  border-bottom: 1px solid #374151;
  border-right: 1px solid #374151;
  clip-path: polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px);
  position: relative;
  padding: 12px;
}

/* Chamfered corner effect */
.skills-column::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, transparent 50%, #111827 50%);
  border-top: 1px solid #374151;
  transform: rotate(0deg);
}

.resource-line {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #374151;
  font-size: 0.85rem;
}

.resource-icon {
  font-size: 0.9rem;
}

.resource-value {
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
}

.skills-list {
  display: flex;
  flex-direction: column;
}

.skill-row {
  display: block;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-left: 2px solid transparent;
  border-bottom: 1px solid #374151;
  color: #f3f4f6;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: transform 0.1s ease, border-color 0.1s ease;
}

.skill-row:last-child {
  border-bottom: none;
}

.skill-row:hover:not(.disabled),
.skill-row.hovered:not(.disabled) {
  transform: translateX(4px);
  border-left-color: var(--class-color);
}

.skill-row.disabled {
  cursor: not-allowed;
}

.skill-row.disabled .skill-name {
  text-decoration: line-through;
  color: #6b7280;
}

.skill-name {
  display: block;
}

/* Description Panel (left side) */
.description-panel {
  width: 50%;
  padding-right: 8px;
}

.description-content {
  background: #111827;
  border: 1px solid #374151;
  border-right: none;
  padding: 12px;
  height: 100%;
  position: relative;
}

/* Left edge gradient */
.description-content::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to right, rgba(55, 65, 81, 0.5), transparent);
}

.description-enter-active,
.description-leave-active {
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.description-enter-from,
.description-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}

.skill-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.skill-cost {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0 0 8px 0;
}

.skill-desc {
  font-size: 0.85rem;
  color: #9ca3af;
  line-height: 1.5;
  margin: 0 0 8px 0;
}

.target-tag {
  display: inline-block;
  font-size: 0.7rem;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .backdrop-enter-active,
  .backdrop-leave-active,
  .panel-enter-active,
  .panel-leave-active,
  .description-enter-active,
  .description-leave-active {
    transition: none;
  }

  .panel-enter-from,
  .panel-leave-to,
  .description-enter-from,
  .description-leave-to {
    transform: none;
  }

  .skill-row {
    transition: none;
  }
}
</style>
```

**Step 2: Run build to verify**

```bash
npx vite build
```

**Step 3: Commit**

```bash
git add src/components/SkillPanel.vue
git commit -m "feat: rewrite SkillPanel with right-aligned design and hover descriptions"
```

---

## Task 5: Update BattleScreen Integration

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Add classColor computed property**

Find the `skillsForPanel` computed (around line 313) and add this computed after it:

```javascript
// Get class color for skill panel theming
const heroClassColor = computed(() => {
  if (!currentHero.value) return '#3b82f6'
  return currentHero.value.class?.color || '#3b82f6'
})

// Get hero role for ActionBar
const heroRole = computed(() => {
  if (!currentHero.value) return 'dps'
  return currentHero.value.class?.role || 'dps'
})

// Check if hero is stunned
const heroIsStunned = computed(() => {
  if (!currentHero.value) return false
  return currentHero.value.effects?.some(e => e.type === 'stun') || false
})
```

**Step 2: Update skillsForPanel to include targetType**

Find the existing `skillsForPanel` computed and add targetType:

```javascript
const skillsForPanel = computed(() => {
  return availableSkills.value.map((skill, index) => ({
    name: skill.name,
    cost: getSkillCost(skill),
    costLabel: getSkillCostLabel(skill),
    disabled: !canUseSkill(skill),
    disabledReason: !canUseSkill(skill) ? getSkillDescription(skill) : null,
    fullDescription: skill.description,
    targetType: skill.targetType || 'enemy'
  }))
})
```

**Step 3: Update ActionBar usage in template**

Find the ActionBar component (around line 1284) and update:

```vue
<ActionBar
  :heroName="currentHero.template.name"
  :classColor="heroClassColor"
  :role="heroRole"
  :hasSkills="availableSkills.length > 0"
  :isStunned="heroIsStunned"
  @open-skills="openSkillPanel"
/>
```

**Step 4: Update SkillPanel usage in template**

Find the SkillPanel component (around line 1292) and update:

```vue
<SkillPanel
  v-if="currentHero"
  :hero="currentHero"
  :skills="skillsForPanel"
  :isOpen="skillPanelOpen"
  :classColor="heroClassColor"
  @select-skill="handleSkillSelect"
  @close="closeSkillPanel"
/>
```

**Step 5: Remove unused props/events**

The SkillPanel no longer emits `select-attack` or uses `selectedSkillIndex`. Remove:
- The `handleAttackFromPanel` function if no longer needed
- The `selectedSkillIndexForPanel` computed if no longer used

**Step 6: Run build to verify**

```bash
npx vite build
```

**Step 7: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat: integrate redesigned SkillPanel and ActionBar with class colors"
```

---

## Task 6: Visual Polish and Testing

**Files:**
- Modify: `src/components/SkillPanel.vue` (if needed)
- Modify: `src/components/ActionBar.vue` (if needed)

**Step 1: Run dev server and test**

```bash
npm run dev
```

**Manual testing checklist:**
- [ ] ActionBar shows hero name with role icon and class-colored border
- [ ] Tapping ActionBar opens skill panel
- [ ] Skill panel appears on right side (50% width)
- [ ] Hovering/touching a skill shows description on left
- [ ] Description slides in smoothly
- [ ] Skill row shifts right on hover with class-colored border
- [ ] Disabled skills show strikethrough
- [ ] Selecting a skill closes panel
- [ ] Tapping backdrop closes panel
- [ ] Resource line shows correct resource type
- [ ] Panel has chamfered top-left corner
- [ ] Noise texture visible on close inspection
- [ ] No scrolling required for 6 skills
- [ ] Works on mobile (touch events)

**Step 2: Fix any issues found**

Make targeted fixes based on testing.

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: skill panel v2 polish and refinements"
```

---

## Summary

| Task | Component | Purpose |
|------|-----------|---------|
| 1 | classes.js | Add color property for theming |
| 2 | ActionBar.vue | Hero name trigger with class accent |
| 3-4 | SkillPanel.vue | Right-aligned panel with hover descriptions |
| 5 | BattleScreen.vue | Pass class color, update integration |
| 6 | All | Visual testing and polish |

**Key changes from v1:**
- Panel position: bottom-sheet → right-aligned overlay
- Width: full → 50% of content area
- Description: tooltip on long-press → inline panel on hover
- ActionBar: separate Skills button → hero name is the trigger
- Scrolling: allowed → eliminated
- Aesthetic: generic → Dorf-authentic with chamfered corner, noise texture, class colors
