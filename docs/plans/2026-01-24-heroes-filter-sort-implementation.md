# Heroes Screen Filter & Sort Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add sorting and filtering controls to the Heroes screen to help players find and manage heroes.

**Architecture:** All changes contained in `HeroesScreen.vue`. Add a filter bar between header and hero grid with dropdown menus for sort/role/class and a toggle for expedition status. Filter logic uses AND across categories. Sort is always descending.

**Tech Stack:** Vue 3 Composition API, existing styling patterns

**Design Doc:** `docs/plans/2026-01-24-heroes-filter-sort-design.md`

---

### Task 1: Add Filter State and Basic Filter Bar Structure

**Files:**
- Modify: `src/screens/HeroesScreen.vue:28-36` (add new refs after existing refs)
- Modify: `src/screens/HeroesScreen.vue:453-454` (add filter bar between header and collection)

**Step 1: Add filter state refs**

Add after line 36 (after `const xpGainAnimation = ref(null)`):

```javascript
// Filter/Sort state
const sortBy = ref('default')
const selectedRoles = ref([])
const selectedClasses = ref([])
const hideOnExpedition = ref(false)

// Dropdown visibility state
const showSortDropdown = ref(false)
const showRoleDropdown = ref(false)
const showClassDropdown = ref(false)
```

**Step 2: Add filter bar template**

Add after the `</header>` closing tag (around line 451) and before `<!-- Collection -->`:

```html
<!-- Filter Bar -->
<section class="filter-bar">
  <div class="filter-controls">
    <!-- Sort Dropdown -->
    <div class="dropdown-container">
      <button
        class="filter-btn"
        :class="{ active: sortBy !== 'default' }"
        @click="showSortDropdown = !showSortDropdown"
      >
        <span>Sort: {{ sortOptions.find(o => o.value === sortBy)?.label || 'Default' }}</span>
        <span class="dropdown-arrow">▼</span>
      </button>
    </div>

    <!-- Role Dropdown -->
    <div class="dropdown-container">
      <button
        class="filter-btn"
        :class="{ active: selectedRoles.length > 0 }"
        @click="showRoleDropdown = !showRoleDropdown"
      >
        <span>Role{{ selectedRoles.length > 0 ? ` (${selectedRoles.length})` : '' }}</span>
        <span class="dropdown-arrow">▼</span>
      </button>
    </div>

    <!-- Class Dropdown -->
    <div class="dropdown-container">
      <button
        class="filter-btn"
        :class="{ active: selectedClasses.length > 0 }"
        @click="showClassDropdown = !showClassDropdown"
      >
        <span>Class{{ selectedClasses.length > 0 ? ` (${selectedClasses.length})` : '' }}</span>
        <span class="dropdown-arrow">▼</span>
      </button>
    </div>

    <!-- Expedition Toggle -->
    <button
      class="expedition-toggle"
      :class="{ active: hideOnExpedition }"
      @click="hideOnExpedition = !hideOnExpedition"
      title="Hide heroes on expedition"
    >
      <span class="toggle-icon">🧭</span>
      <span class="toggle-indicator">{{ hideOnExpedition ? '●' : '○' }}</span>
    </button>
  </div>
</section>
```

**Step 3: Add sortOptions data**

Add after the filter state refs:

```javascript
const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'level', label: 'Level' },
  { value: 'atk', label: 'ATK' },
  { value: 'def', label: 'DEF' },
  { value: 'spd', label: 'SPD' }
]
```

**Step 4: Add filter bar styles**

Add at the end of the `<style scoped>` section:

```css
/* ===== Filter Bar ===== */
.filter-bar {
  position: relative;
  z-index: 10;
  margin-bottom: 16px;
}

.filter-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.dropdown-container {
  position: relative;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: #4b5563;
  color: #f3f4f6;
}

.filter-btn.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.dropdown-arrow {
  font-size: 0.7rem;
  opacity: 0.7;
}

.expedition-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.expedition-toggle:hover {
  border-color: #4b5563;
  color: #f3f4f6;
}

.expedition-toggle.active {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
}

.toggle-icon {
  font-size: 1rem;
}

.toggle-indicator {
  font-size: 0.8rem;
}
```

**Step 5: Verify and commit**

Run: `npm run dev` and verify the filter bar appears between header and hero grid.

```bash
git add src/screens/HeroesScreen.vue
git commit -m "feat(heroes): add filter bar structure and state"
```

---

### Task 2: Implement Dropdown Menus

**Files:**
- Modify: `src/screens/HeroesScreen.vue` (template and styles)

**Step 1: Add sort dropdown menu to template**

Inside the sort dropdown-container, after the button, add:

```html
<div v-if="showSortDropdown" class="dropdown-menu">
  <div
    v-for="option in sortOptions"
    :key="option.value"
    class="dropdown-item"
    :class="{ selected: sortBy === option.value }"
    @click="sortBy = option.value; showSortDropdown = false"
  >
    <span class="check-mark">{{ sortBy === option.value ? '✓' : '' }}</span>
    <span>{{ option.label }}</span>
  </div>
</div>
```

**Step 2: Add role dropdown menu to template**

Inside the role dropdown-container, after the button, add:

```html
<div v-if="showRoleDropdown" class="dropdown-menu">
  <label
    v-for="role in roleOptions"
    :key="role.value"
    class="dropdown-checkbox"
  >
    <input
      type="checkbox"
      :checked="selectedRoles.includes(role.value)"
      @change="toggleRole(role.value)"
    />
    <span class="role-icon">{{ role.icon }}</span>
    <span>{{ role.label }}</span>
  </label>
</div>
```

**Step 3: Add class dropdown menu to template**

Inside the class dropdown-container, after the button, add:

```html
<div v-if="showClassDropdown" class="dropdown-menu class-dropdown">
  <label
    v-for="cls in classOptions"
    :key="cls.value"
    class="dropdown-checkbox"
  >
    <input
      type="checkbox"
      :checked="selectedClasses.includes(cls.value)"
      @change="toggleClass(cls.value)"
    />
    <span>{{ cls.label }}</span>
  </label>
</div>
```

**Step 4: Add roleOptions and classOptions data**

Add after sortOptions:

```javascript
const roleOptions = [
  { value: 'tank', label: 'Tank', icon: '🛡️' },
  { value: 'dps', label: 'DPS', icon: '⚔️' },
  { value: 'healer', label: 'Healer', icon: '💚' },
  { value: 'support', label: 'Support', icon: '✨' }
]

const classOptions = [
  { value: 'berserker', label: 'Berserker' },
  { value: 'ranger', label: 'Ranger' },
  { value: 'knight', label: 'Knight' },
  { value: 'paladin', label: 'Paladin' },
  { value: 'mage', label: 'Mage' },
  { value: 'cleric', label: 'Cleric' },
  { value: 'druid', label: 'Druid' },
  { value: 'bard', label: 'Bard' },
  { value: 'alchemist', label: 'Alchemist' }
]
```

**Step 5: Add toggle functions**

Add after the options data:

```javascript
function toggleRole(role) {
  const index = selectedRoles.value.indexOf(role)
  if (index === -1) {
    selectedRoles.value.push(role)
  } else {
    selectedRoles.value.splice(index, 1)
  }
}

function toggleClass(classId) {
  const index = selectedClasses.value.indexOf(classId)
  if (index === -1) {
    selectedClasses.value.push(classId)
  } else {
    selectedClasses.value.splice(index, 1)
  }
}
```

**Step 6: Add dropdown menu styles**

Add to styles:

```css
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 150px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 6px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dropdown-menu.class-dropdown {
  min-width: 140px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #9ca3af;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.dropdown-item:hover {
  background: rgba(55, 65, 81, 0.5);
  color: #f3f4f6;
}

.dropdown-item.selected {
  color: #60a5fa;
}

.check-mark {
  width: 16px;
  color: #60a5fa;
}

.dropdown-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #9ca3af;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.dropdown-checkbox:hover {
  background: rgba(55, 65, 81, 0.5);
  color: #f3f4f6;
}

.dropdown-checkbox input[type="checkbox"] {
  accent-color: #3b82f6;
  width: 16px;
  height: 16px;
}

.role-icon {
  font-size: 1rem;
}
```

**Step 7: Verify and commit**

Run: `npm run dev` and verify dropdowns open/close and selections work.

```bash
git add src/screens/HeroesScreen.vue
git commit -m "feat(heroes): add dropdown menus for sort, role, and class filters"
```

---

### Task 3: Implement Click-Outside to Close Dropdowns

**Files:**
- Modify: `src/screens/HeroesScreen.vue` (script and template)

**Step 1: Add click-outside handler**

Add after the toggle functions:

```javascript
function closeAllDropdowns() {
  showSortDropdown.value = false
  showRoleDropdown.value = false
  showClassDropdown.value = false
}

function handleClickOutside(event) {
  const filterBar = event.target.closest('.filter-bar')
  if (!filterBar) {
    closeAllDropdowns()
  }
}
```

**Step 2: Add event listeners in onMounted/onUnmounted**

Add import for `onUnmounted` at the top:

```javascript
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
```

Modify the existing `onMounted` to add the click listener, and add `onUnmounted`:

After the existing onMounted block, add:

```javascript
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
```

**Note:** Keep the existing onMounted for initialHeroId logic. You can combine them or have two separate onMounted calls (Vue 3 supports multiple).

**Step 3: Prevent dropdown buttons from triggering close**

Update the dropdown button click handlers to stop propagation. Modify each filter button:

```html
@click.stop="showSortDropdown = !showSortDropdown; showRoleDropdown = false; showClassDropdown = false"
```

```html
@click.stop="showRoleDropdown = !showRoleDropdown; showSortDropdown = false; showClassDropdown = false"
```

```html
@click.stop="showClassDropdown = !showClassDropdown; showSortDropdown = false; showRoleDropdown = false"
```

**Step 4: Verify and commit**

Run: `npm run dev` and verify clicking outside closes dropdowns.

```bash
git add src/screens/HeroesScreen.vue
git commit -m "feat(heroes): add click-outside handler for dropdowns"
```

---

### Task 4: Implement Filtering and Sorting Logic

**Files:**
- Modify: `src/screens/HeroesScreen.vue` (replace sortedHeroes computed)

**Step 1: Replace sortedHeroes with filteredAndSortedHeroes**

Replace the existing `sortedHeroes` computed (around lines 67-75) with:

```javascript
const filteredAndSortedHeroes = computed(() => {
  let heroes = [...heroesWithData.value]

  // Filter by expedition status
  if (hideOnExpedition.value) {
    heroes = heroes.filter(hero => {
      const heroData = heroesStore.collection.find(h => h.instanceId === hero.instanceId)
      return !heroData?.explorationNodeId
    })
  }

  // Filter by role
  if (selectedRoles.value.length > 0) {
    heroes = heroes.filter(hero => selectedRoles.value.includes(hero.class.role))
  }

  // Filter by class
  if (selectedClasses.value.length > 0) {
    heroes = heroes.filter(hero => selectedClasses.value.includes(hero.template.classId))
  }

  // Sort
  heroes.sort((a, b) => {
    let primary = 0
    let secondary = 0

    switch (sortBy.value) {
      case 'rarity':
        primary = b.template.rarity - a.template.rarity
        secondary = b.level - a.level
        break
      case 'level':
        primary = b.level - a.level
        secondary = b.template.rarity - a.template.rarity
        break
      case 'atk':
        primary = b.stats.atk - a.stats.atk
        secondary = b.template.rarity - a.template.rarity
        break
      case 'def':
        primary = b.stats.def - a.stats.def
        secondary = b.template.rarity - a.template.rarity
        break
      case 'spd':
        primary = b.stats.spd - a.stats.spd
        secondary = b.template.rarity - a.template.rarity
        break
      default: // 'default'
        primary = b.template.rarity - a.template.rarity
        secondary = b.level - a.level
    }

    return primary !== 0 ? primary : secondary
  })

  return heroes
})
```

**Step 2: Update template to use filteredAndSortedHeroes**

Find in template (around line 463-465):

```html
<div v-else class="hero-grid">
  <HeroCard
    v-for="hero in sortedHeroes"
```

Replace `sortedHeroes` with `filteredAndSortedHeroes`:

```html
<div v-else class="hero-grid">
  <HeroCard
    v-for="hero in filteredAndSortedHeroes"
```

**Step 3: Verify and commit**

Run: `npm run dev` and verify:
- Sorting changes hero order
- Role filter shows only selected roles
- Class filter shows only selected classes
- Expedition toggle hides heroes on expedition

```bash
git add src/screens/HeroesScreen.vue
git commit -m "feat(heroes): implement filtering and sorting logic"
```

---

### Task 5: Add Empty State and Clear Filters

**Files:**
- Modify: `src/screens/HeroesScreen.vue` (template and script)

**Step 1: Add hasActiveFilters computed**

Add after filteredAndSortedHeroes:

```javascript
const hasActiveFilters = computed(() => {
  return sortBy.value !== 'default' ||
    selectedRoles.value.length > 0 ||
    selectedClasses.value.length > 0 ||
    hideOnExpedition.value
})

function clearAllFilters() {
  sortBy.value = 'default'
  selectedRoles.value = []
  selectedClasses.value = []
  hideOnExpedition.value = false
}
```

**Step 2: Add filtered empty state to template**

Find the empty-collection div and add a new condition before it. The collection section should now be:

```html
<!-- Collection -->
<section class="collection-section">
  <div v-if="heroesStore.collection.length === 0" class="empty-collection">
    <div class="empty-icon">⚔️</div>
    <p>No heroes yet!</p>
    <button class="summon-cta" @click="emit('navigate', 'gacha')">
      <span>Summon Heroes</span>
    </button>
  </div>

  <div v-else-if="filteredAndSortedHeroes.length === 0" class="empty-filtered">
    <div class="empty-icon">🔍</div>
    <p>No heroes match filters</p>
    <button class="clear-filters-btn" @click="clearAllFilters">
      Clear Filters
    </button>
  </div>

  <div v-else class="hero-grid">
    <HeroCard
      v-for="hero in filteredAndSortedHeroes"
      :key="hero.instanceId"
      :hero="hero"
      :selected="selectedHero?.instanceId === hero.instanceId"
      showStats
      showExplorationStatus
      @click="selectHero(hero)"
    />
  </div>
</section>
```

**Step 3: Add empty filtered styles**

Add to styles:

```css
.empty-filtered {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border-radius: 16px;
  border: 1px solid #334155;
}

.empty-filtered .empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-filtered p {
  color: #9ca3af;
  margin-bottom: 20px;
  font-size: 1rem;
}

.clear-filters-btn {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-filters-btn:hover {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  transform: translateY(-1px);
}
```

**Step 4: Verify and commit**

Run: `npm run dev` and verify:
- When filters result in no heroes, the empty state shows
- Clear Filters button resets all filters

```bash
git add src/screens/HeroesScreen.vue
git commit -m "feat(heroes): add empty state and clear filters button"
```

---

### Task 6: Update Hero Count Badge to Show Filtered Count

**Files:**
- Modify: `src/screens/HeroesScreen.vue` (template)

**Step 1: Add filteredCount computed**

Add after hasActiveFilters:

```javascript
const filteredCount = computed(() => filteredAndSortedHeroes.value.length)
const totalCount = computed(() => heroesStore.heroCount)
```

**Step 2: Update hero count badge in header**

Find the hero-count-badge div (around line 447-450):

```html
<div class="hero-count-badge">
  <span class="count-value">{{ heroesStore.heroCount }}</span>
  <span class="count-label">owned</span>
</div>
```

Replace with:

```html
<div class="hero-count-badge">
  <span class="count-value">
    <template v-if="hasActiveFilters">{{ filteredCount }}/</template>{{ totalCount }}
  </span>
  <span class="count-label">{{ hasActiveFilters ? 'shown' : 'owned' }}</span>
</div>
```

**Step 3: Verify and commit**

Run: `npm run dev` and verify:
- No filters: shows "42 owned"
- With filters: shows "12/42 shown"

```bash
git add src/screens/HeroesScreen.vue
git commit -m "feat(heroes): update count badge to show filtered count"
```

---

### Task 7: Final Polish and Testing

**Files:**
- Modify: `src/screens/HeroesScreen.vue` (minor adjustments)

**Step 1: Test all combinations**

Manual testing checklist:
- [ ] Sort by Default - rarity desc, then level desc
- [ ] Sort by Rarity - rarity desc, then level desc
- [ ] Sort by Level - level desc, then rarity desc
- [ ] Sort by ATK - atk desc, then rarity desc
- [ ] Sort by DEF - def desc, then rarity desc
- [ ] Sort by SPD - spd desc, then rarity desc
- [ ] Filter by single role (Tank)
- [ ] Filter by multiple roles (Tank + DPS)
- [ ] Filter by single class (Knight)
- [ ] Filter by multiple classes (Knight + Mage)
- [ ] Filter by role AND class together
- [ ] Expedition toggle hides exploring heroes
- [ ] All filters combined
- [ ] Empty state appears when no matches
- [ ] Clear Filters resets everything
- [ ] Count badge updates correctly
- [ ] Dropdowns close when clicking outside
- [ ] Only one dropdown open at a time

**Step 2: Fix any issues found during testing**

Address any bugs discovered during manual testing.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(heroes): complete filter and sort implementation

- Sort by: Default, Rarity, Level, ATK, DEF, SPD
- Filter by: Role (multi-select), Class (multi-select)
- Expedition toggle to hide heroes on exploration
- AND logic across all filters
- Empty state with Clear Filters button
- Updated count badge shows filtered/total"
```

---

## Summary

| Task | Description | Commit Message |
|------|-------------|----------------|
| 1 | Filter bar structure and state | `feat(heroes): add filter bar structure and state` |
| 2 | Dropdown menus | `feat(heroes): add dropdown menus for sort, role, and class filters` |
| 3 | Click-outside handler | `feat(heroes): add click-outside handler for dropdowns` |
| 4 | Filtering and sorting logic | `feat(heroes): implement filtering and sorting logic` |
| 5 | Empty state and clear filters | `feat(heroes): add empty state and clear filters button` |
| 6 | Updated count badge | `feat(heroes): update count badge to show filtered count` |
| 7 | Final polish and testing | `feat(heroes): complete filter and sort implementation` |
