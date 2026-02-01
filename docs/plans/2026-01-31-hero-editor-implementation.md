# Hero Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a guided hero data editor to AdminScreen with form-based editing, validation, and raw code view.

**Architecture:** Extend AdminScreen with a categorized sidebar menu (DATA/ASSETS sections). Hero Editor provides tabbed form editing with dropdowns for valid values, inline effects editing, and a toggle to raw JS code view. Saves directly to hero files via new Vite plugin endpoint.

**Tech Stack:** Vue 3 Composition API, existing Vite admin plugin pattern, component-scoped CSS.

---

## Task 1: Hero Validator Utility

Create validation logic that can be tested independently before building UI.

**Files:**
- Create: `src/utils/heroValidator.js`
- Create: `src/utils/__tests__/heroValidator.test.js`

**Step 1: Write failing tests for hero validation**

```js
// src/utils/__tests__/heroValidator.test.js
import { describe, it, expect } from 'vitest'
import { validateHero, validateSkill, validateEffect } from '../heroValidator.js'

describe('heroValidator', () => {
  describe('validateHero', () => {
    it('returns no errors for valid hero', () => {
      const hero = {
        id: 'test_hero',
        name: 'Test Hero',
        rarity: 3,
        classId: 'knight',
        baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
        skills: [
          { name: 'Slash', description: 'Basic attack', skillUnlockLevel: 1, targetType: 'enemy', damagePercent: 100 }
        ]
      }
      const errors = validateHero(hero)
      expect(errors).toEqual([])
    })

    it('returns error for missing required field', () => {
      const hero = { id: 'test', rarity: 3 }
      const errors = validateHero(hero)
      expect(errors.some(e => e.includes('name'))).toBe(true)
      expect(errors.some(e => e.includes('classId'))).toBe(true)
    })

    it('returns error for invalid rarity', () => {
      const hero = {
        id: 'test', name: 'Test', rarity: 6, classId: 'knight',
        baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
        skills: [{ name: 'Slash', description: 'x', skillUnlockLevel: 1, targetType: 'enemy', damagePercent: 100 }]
      }
      const errors = validateHero(hero)
      expect(errors.some(e => e.includes('rarity'))).toBe(true)
    })

    it('returns error for invalid classId', () => {
      const hero = {
        id: 'test', name: 'Test', rarity: 3, classId: 'wizard',
        baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
        skills: [{ name: 'Slash', description: 'x', skillUnlockLevel: 1, targetType: 'enemy', damagePercent: 100 }]
      }
      const errors = validateHero(hero)
      expect(errors.some(e => e.includes('classId'))).toBe(true)
    })

    it('returns error for missing baseStats fields', () => {
      const hero = {
        id: 'test', name: 'Test', rarity: 3, classId: 'knight',
        baseStats: { hp: 100, atk: 20 },
        skills: [{ name: 'Slash', description: 'x', skillUnlockLevel: 1, targetType: 'enemy', damagePercent: 100 }]
      }
      const errors = validateHero(hero)
      expect(errors.some(e => e.includes('def'))).toBe(true)
      expect(errors.some(e => e.includes('spd'))).toBe(true)
    })

    it('returns error for no skills', () => {
      const hero = {
        id: 'test', name: 'Test', rarity: 3, classId: 'knight',
        baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
        skills: []
      }
      const errors = validateHero(hero)
      expect(errors.some(e => e.includes('skill'))).toBe(true)
    })
  })

  describe('validateSkill', () => {
    it('returns no errors for valid skill', () => {
      const skill = { name: 'Strike', description: 'Hits enemy', skillUnlockLevel: 1, targetType: 'enemy', damagePercent: 100 }
      const errors = validateSkill(skill, 0)
      expect(errors).toEqual([])
    })

    it('returns error for invalid targetType', () => {
      const skill = { name: 'Strike', description: 'x', skillUnlockLevel: 1, targetType: 'foe', damagePercent: 100 }
      const errors = validateSkill(skill, 0)
      expect(errors.some(e => e.includes('targetType'))).toBe(true)
    })

    it('returns error for invalid skillUnlockLevel', () => {
      const skill = { name: 'Strike', description: 'x', skillUnlockLevel: 5, targetType: 'enemy', damagePercent: 100 }
      const errors = validateSkill(skill, 0)
      expect(errors.some(e => e.includes('skillUnlockLevel'))).toBe(true)
    })
  })

  describe('validateEffect', () => {
    it('returns no errors for valid stat effect', () => {
      const effect = { type: 'atk_up', target: 'self', duration: 2, value: 20 }
      const errors = validateEffect(effect, 'skills[0]')
      expect(errors).toEqual([])
    })

    it('returns error for missing duration', () => {
      const effect = { type: 'atk_up', target: 'self', value: 20 }
      const errors = validateEffect(effect, 'skills[0]')
      expect(errors.some(e => e.includes('duration'))).toBe(true)
    })

    it('returns error for invalid effect type', () => {
      const effect = { type: 'mega_buff', target: 'self', duration: 2 }
      const errors = validateEffect(effect, 'skills[0]')
      expect(errors.some(e => e.includes('type'))).toBe(true)
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/deltran/code/dorf/.worktrees/hero-editor && npm test -- src/utils/__tests__/heroValidator.test.js`
Expected: FAIL - module not found

**Step 3: Implement heroValidator**

```js
// src/utils/heroValidator.js
import { classes } from '../data/classes.js'
import { EffectType } from '../data/statusEffects.js'

const VALID_RARITIES = [1, 2, 3, 4, 5]
const VALID_CLASS_IDS = Object.keys(classes)
const VALID_TARGET_TYPES = ['enemy', 'ally', 'self', 'all_enemies', 'all_allies', 'random_enemies']
const VALID_EFFECT_TARGETS = ['enemy', 'ally', 'self', 'all_enemies', 'all_allies']
const VALID_SKILL_UNLOCK_LEVELS = [1, 3, 6, 12]
const VALID_EFFECT_TYPES = Object.values(EffectType)
const REQUIRED_BASE_STATS = ['hp', 'atk', 'def', 'spd', 'mp']

export function validateHero(hero) {
  const errors = []

  // Required string fields
  if (!hero.id || typeof hero.id !== 'string') {
    errors.push('id: Required field')
  }
  if (!hero.name || typeof hero.name !== 'string') {
    errors.push('name: Required field')
  }

  // Rarity
  if (!VALID_RARITIES.includes(hero.rarity)) {
    errors.push(`rarity: Must be one of ${VALID_RARITIES.join(', ')}`)
  }

  // Class
  if (!VALID_CLASS_IDS.includes(hero.classId)) {
    errors.push(`classId: Must be one of ${VALID_CLASS_IDS.join(', ')}`)
  }

  // Base stats
  if (!hero.baseStats || typeof hero.baseStats !== 'object') {
    errors.push('baseStats: Required object')
  } else {
    for (const stat of REQUIRED_BASE_STATS) {
      if (typeof hero.baseStats[stat] !== 'number' || hero.baseStats[stat] < 0) {
        errors.push(`baseStats.${stat}: Required positive number`)
      }
    }
  }

  // Skills
  if (!Array.isArray(hero.skills) || hero.skills.length === 0) {
    errors.push('skills: Must have at least one skill')
  } else {
    hero.skills.forEach((skill, i) => {
      errors.push(...validateSkill(skill, i))
    })
  }

  // Leader skill (optional, but validate if present)
  if (hero.leaderSkill) {
    errors.push(...validateLeaderSkill(hero.leaderSkill))
  }

  // Finale (optional, bards only)
  if (hero.finale) {
    errors.push(...validateFinale(hero.finale))
  }

  return errors
}

export function validateSkill(skill, index) {
  const errors = []
  const prefix = `skills[${index}]`

  if (!skill.name || typeof skill.name !== 'string') {
    errors.push(`${prefix}: name is required`)
  }
  if (!skill.description || typeof skill.description !== 'string') {
    errors.push(`${prefix}: description is required`)
  }
  if (!VALID_SKILL_UNLOCK_LEVELS.includes(skill.skillUnlockLevel)) {
    errors.push(`${prefix}: skillUnlockLevel must be one of ${VALID_SKILL_UNLOCK_LEVELS.join(', ')}`)
  }
  if (!VALID_TARGET_TYPES.includes(skill.targetType)) {
    errors.push(`${prefix}: targetType must be one of ${VALID_TARGET_TYPES.join(', ')}`)
  }

  // Validate effects if present
  if (skill.effects && Array.isArray(skill.effects)) {
    skill.effects.forEach((effect, i) => {
      errors.push(...validateEffect(effect, `${prefix}.effects[${i}]`))
    })
  }

  return errors
}

export function validateEffect(effect, prefix) {
  const errors = []

  if (!VALID_EFFECT_TYPES.includes(effect.type)) {
    errors.push(`${prefix}: type "${effect.type}" is not a valid EffectType`)
  }
  if (effect.target && !VALID_EFFECT_TARGETS.includes(effect.target)) {
    errors.push(`${prefix}: target must be one of ${VALID_EFFECT_TARGETS.join(', ')}`)
  }
  if (typeof effect.duration !== 'number' && typeof effect.duration !== 'object') {
    errors.push(`${prefix}: duration is required`)
  }

  return errors
}

export function validateLeaderSkill(leaderSkill) {
  const errors = []

  if (!leaderSkill.name || typeof leaderSkill.name !== 'string') {
    errors.push('leaderSkill.name: Required field')
  }
  if (!leaderSkill.description || typeof leaderSkill.description !== 'string') {
    errors.push('leaderSkill.description: Required field')
  }
  if (!Array.isArray(leaderSkill.effects) || leaderSkill.effects.length === 0) {
    errors.push('leaderSkill.effects: Must have at least one effect')
  }

  return errors
}

export function validateFinale(finale) {
  const errors = []

  if (!finale.name || typeof finale.name !== 'string') {
    errors.push('finale.name: Required field')
  }
  if (!finale.description || typeof finale.description !== 'string') {
    errors.push('finale.description: Required field')
  }
  if (!['all_allies', 'all_enemies'].includes(finale.target)) {
    errors.push('finale.target: Must be all_allies or all_enemies')
  }

  return errors
}

// Export constants for UI dropdowns
export const DROPDOWN_OPTIONS = {
  rarities: VALID_RARITIES,
  classIds: VALID_CLASS_IDS,
  targetTypes: VALID_TARGET_TYPES,
  effectTargets: VALID_EFFECT_TARGETS,
  skillUnlockLevels: VALID_SKILL_UNLOCK_LEVELS,
  effectTypes: VALID_EFFECT_TYPES
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/deltran/code/dorf/.worktrees/hero-editor && npm test -- src/utils/__tests__/heroValidator.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/heroValidator.js src/utils/__tests__/heroValidator.test.js
git commit -m "feat(admin): add hero validator utility with tests"
```

---

## Task 2: Hero Serializer Utility

Convert between hero objects and JS file strings.

**Files:**
- Create: `src/utils/heroSerializer.js`
- Create: `src/utils/__tests__/heroSerializer.test.js`

**Step 1: Write failing tests**

```js
// src/utils/__tests__/heroSerializer.test.js
import { describe, it, expect } from 'vitest'
import { serializeHero, parseHeroFile } from '../heroSerializer.js'

describe('heroSerializer', () => {
  const sampleHero = {
    id: 'test_hero',
    name: 'Test Hero',
    rarity: 3,
    classId: 'knight',
    baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
    skills: [
      {
        name: 'Shield Bash',
        description: 'Bash enemy with shield',
        skillUnlockLevel: 1,
        targetType: 'enemy',
        damagePercent: 80,
        effects: [
          { type: 'stun', target: 'enemy', duration: 1 }
        ]
      }
    ]
  }

  describe('serializeHero', () => {
    it('generates valid JS file content', () => {
      const result = serializeHero(sampleHero)
      expect(result).toContain("import { EffectType } from '../../statusEffects.js'")
      expect(result).toContain('export const test_hero')
      expect(result).toContain("id: 'test_hero'")
      expect(result).toContain("name: 'Test Hero'")
      expect(result).toContain('rarity: 3')
    })

    it('uses EffectType constants for effect types', () => {
      const result = serializeHero(sampleHero)
      expect(result).toContain('type: EffectType.STUN')
      expect(result).not.toContain("type: 'stun'")
    })

    it('handles heroes without effects', () => {
      const heroNoEffects = {
        ...sampleHero,
        skills: [{ name: 'Slash', description: 'x', skillUnlockLevel: 1, targetType: 'enemy', damagePercent: 100 }]
      }
      const result = serializeHero(heroNoEffects)
      expect(result).not.toContain('EffectType')
    })
  })

  describe('parseHeroFile', () => {
    it('parses serialized hero back to object', () => {
      const serialized = serializeHero(sampleHero)
      const parsed = parseHeroFile(serialized)
      expect(parsed.id).toBe('test_hero')
      expect(parsed.name).toBe('Test Hero')
      expect(parsed.rarity).toBe(3)
      expect(parsed.baseStats.hp).toBe(100)
    })

    it('converts EffectType constants back to string values', () => {
      const serialized = serializeHero(sampleHero)
      const parsed = parseHeroFile(serialized)
      expect(parsed.skills[0].effects[0].type).toBe('stun')
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/deltran/code/dorf/.worktrees/hero-editor && npm test -- src/utils/__tests__/heroSerializer.test.js`
Expected: FAIL

**Step 3: Implement heroSerializer**

```js
// src/utils/heroSerializer.js
import { EffectType } from '../data/statusEffects.js'

// Reverse mapping: 'stun' -> 'STUN'
const effectTypeToKey = Object.fromEntries(
  Object.entries(EffectType).map(([key, val]) => [val, key])
)

/**
 * Serialize a hero object to JS file content
 */
export function serializeHero(hero) {
  const hasEffects = heroHasEffects(hero)
  const lines = []

  // Import statement only if hero uses effects
  if (hasEffects) {
    lines.push("import { EffectType } from '../../statusEffects.js'")
    lines.push('')
  }

  lines.push(`export const ${hero.id} = ${stringifyHero(hero, hasEffects)}`)
  lines.push('')

  return lines.join('\n')
}

function heroHasEffects(hero) {
  // Check skills for effects
  if (hero.skills?.some(s => s.effects?.length > 0)) return true
  // Check leader skill
  if (hero.leaderSkill?.effects?.length > 0) return true
  // Check finale
  if (hero.finale?.effects?.length > 0) return true
  return false
}

function stringifyHero(hero, useEffectType) {
  return stringifyObject(hero, 0, useEffectType)
}

function stringifyObject(obj, indent, useEffectType) {
  const spaces = '  '.repeat(indent)
  const innerSpaces = '  '.repeat(indent + 1)

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    const items = obj.map(item => {
      if (typeof item === 'object' && item !== null) {
        return `${innerSpaces}${stringifyObject(item, indent + 1, useEffectType)}`
      }
      return `${innerSpaces}${stringifyValue(item, useEffectType)}`
    })
    return `[\n${items.join(',\n')}\n${spaces}]`
  }

  if (typeof obj === 'object' && obj !== null) {
    const entries = Object.entries(obj)
    if (entries.length === 0) return '{}'

    const props = entries.map(([key, val]) => {
      // Special handling for effect type field
      if (key === 'type' && useEffectType && effectTypeToKey[val]) {
        return `${innerSpaces}${key}: EffectType.${effectTypeToKey[val]}`
      }
      if (typeof val === 'object' && val !== null) {
        return `${innerSpaces}${key}: ${stringifyObject(val, indent + 1, useEffectType)}`
      }
      return `${innerSpaces}${key}: ${stringifyValue(val, useEffectType)}`
    })
    return `{\n${props.join(',\n')}\n${spaces}}`
  }

  return stringifyValue(obj, useEffectType)
}

function stringifyValue(val, useEffectType) {
  if (typeof val === 'string') return `'${val.replace(/'/g, "\\'")}'`
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  return String(val)
}

/**
 * Parse a hero JS file string back to object
 */
export function parseHeroFile(content) {
  // Extract the object literal from "export const xxx = { ... }"
  const match = content.match(/export\s+const\s+\w+\s*=\s*(\{[\s\S]*\})\s*$/)
  if (!match) {
    throw new Error('Could not find hero export in file content')
  }

  const objectStr = match[1]

  // Replace EffectType.XXX with string values
  const withStrings = objectStr.replace(/EffectType\.(\w+)/g, (_, key) => {
    const val = EffectType[key]
    return val ? `'${val}'` : `'${key.toLowerCase()}'`
  })

  // Use Function constructor to parse (safe since we control input)
  try {
    return new Function(`return ${withStrings}`)()
  } catch (e) {
    throw new Error(`Failed to parse hero object: ${e.message}`)
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/deltran/code/dorf/.worktrees/hero-editor && npm test -- src/utils/__tests__/heroSerializer.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/heroSerializer.js src/utils/__tests__/heroSerializer.test.js
git commit -m "feat(admin): add hero serializer utility with tests"
```

---

## Task 3: Vite Plugin Hero Endpoint

Add API endpoints for reading/writing individual hero files.

**Files:**
- Modify: `vite-plugin-admin.js`
- Create: `src/utils/__tests__/heroApiIntegration.test.js` (manual test file, not automated)

**Step 1: Add hero file endpoints to vite plugin**

Add these endpoints to `vite-plugin-admin.js` inside `configureServer(server)`:

```js
// Add after the existing middleware, before the closing brace of configureServer

// GET /__admin/hero/:heroId - read a specific hero file
server.middlewares.use(async (req, res, next) => {
  const match = req.url?.match(/^\/__admin\/hero\/(.+)$/)
  if (req.method === 'GET' && match) {
    const heroId = decodeURIComponent(match[1])

    try {
      const heroPath = findHeroFile(heroId)
      if (!heroPath) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: `Hero file not found: ${heroId}` }))
        return
      }

      const content = fs.readFileSync(heroPath, 'utf-8')
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ path: heroPath, content }))
    } catch (e) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }
  next()
})

// PUT /__admin/hero/:heroId - write to a specific hero file
server.middlewares.use(async (req, res, next) => {
  const match = req.url?.match(/^\/__admin\/hero\/(.+)$/)
  if (req.method === 'PUT' && match) {
    const heroId = decodeURIComponent(match[1])

    let body = ''
    for await (const chunk of req) {
      body += chunk
    }

    try {
      const { content } = JSON.parse(body)
      if (!content || typeof content !== 'string') {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'content string is required' }))
        return
      }

      const heroPath = findHeroFile(heroId)
      if (!heroPath) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: `Hero file not found: ${heroId}` }))
        return
      }

      fs.writeFileSync(heroPath, content, 'utf-8')

      // Invalidate module cache for hot reload
      const moduleGraph = server.moduleGraph
      for (const [id, mod] of moduleGraph.idToModuleMap) {
        if (id.includes('/src/data/heroes/')) {
          moduleGraph.invalidateModule(mod)
        }
      }

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: true }))
    } catch (e) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }
  next()
})

// Helper: find hero file by ID across rarity folders
function findHeroFile(heroId) {
  const heroesDir = path.resolve(process.cwd(), 'src/data/heroes')
  const rarityFolders = ['1star', '2star', '3star', '4star', '5star']

  for (const rarity of rarityFolders) {
    const filePath = path.join(heroesDir, rarity, `${heroId}.js`)
    if (fs.existsSync(filePath)) {
      return filePath
    }
  }
  return null
}
```

**Step 2: Test manually**

Start dev server and test with curl:
```bash
curl http://localhost:5173/__admin/hero/aurora_the_dawn
```

**Step 3: Commit**

```bash
git add vite-plugin-admin.js
git commit -m "feat(admin): add hero file read/write API endpoints"
```

---

## Task 4: AdminScreen Sidebar Refactor

Refactor AdminScreen to use categorized sidebar (DATA/ASSETS).

**Files:**
- Modify: `src/screens/AdminScreen.vue`

**Step 1: Update AdminScreen with categorized sections**

```vue
<!-- src/screens/AdminScreen.vue -->
<script setup>
import { ref, watch } from 'vue'
import AssetViewerHeroes from './admin/AssetViewerHeroes.vue'
import AssetViewerEnemies from './admin/AssetViewerEnemies.vue'
import AssetViewerBackgrounds from './admin/AssetViewerBackgrounds.vue'
import AssetViewerMaps from './admin/AssetViewerMaps.vue'

const activeSection = ref(
  import.meta.env.DEV ? (sessionStorage.getItem('dorf_dev_admin_section') || 'hero-editor') : 'hero-editor'
)

if (import.meta.env.DEV) {
  watch(activeSection, (val) => sessionStorage.setItem('dorf_dev_admin_section', val))
}

const menuSections = [
  {
    label: 'Data',
    items: [
      { id: 'hero-editor', label: 'Heroes' },
      { id: 'enemy-editor', label: 'Enemies', disabled: true }
    ]
  },
  {
    label: 'Assets',
    items: [
      { id: 'heroes', label: 'Hero Art' },
      { id: 'enemies', label: 'Enemy Art' },
      { id: 'backgrounds', label: 'Battle BG' },
      { id: 'maps', label: 'Map Art' }
    ]
  }
]

const emit = defineEmits(['navigate'])

function exitAdmin() {
  emit('navigate', 'home')
}

function getSectionLabel(sectionId) {
  for (const section of menuSections) {
    const item = section.items.find(i => i.id === sectionId)
    if (item) return item.label
  }
  return sectionId
}
</script>

<template>
  <div class="admin-screen">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Admin</h2>
        <button class="exit-btn" @click="exitAdmin">Exit</button>
      </div>
      <nav class="sidebar-nav">
        <div v-for="section in menuSections" :key="section.label" class="menu-section">
          <div class="menu-section-label">{{ section.label }}</div>
          <button
            v-for="item in section.items"
            :key="item.id"
            :class="['nav-item', { active: activeSection === item.id, disabled: item.disabled }]"
            :disabled="item.disabled"
            @click="!item.disabled && (activeSection = item.id)"
          >
            {{ item.label }}
          </button>
        </div>
      </nav>
    </aside>

    <main class="content">
      <div class="content-header">
        <h1>{{ getSectionLabel(activeSection) }}</h1>
      </div>

      <div class="content-body">
        <!-- Data editors -->
        <div v-if="activeSection === 'hero-editor'" class="placeholder">
          Hero Editor coming next...
        </div>
        <div v-else-if="activeSection === 'enemy-editor'" class="placeholder">
          Enemy Editor (coming soon)
        </div>

        <!-- Asset viewers -->
        <AssetViewerHeroes v-else-if="activeSection === 'heroes'" />
        <AssetViewerEnemies v-else-if="activeSection === 'enemies'" />
        <AssetViewerBackgrounds v-else-if="activeSection === 'backgrounds'" />
        <AssetViewerMaps v-else-if="activeSection === 'maps'" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-screen {
  display: flex;
  min-height: 100vh;
  background: #111827;
}

.sidebar {
  width: 200px;
  background: #1f2937;
  border-right: 1px solid #374151;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: #f3f4f6;
}

.exit-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
}

.exit-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
}

.menu-section {
  margin-bottom: 8px;
}

.menu-section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  padding: 8px 12px 4px;
  letter-spacing: 0.05em;
}

.nav-item {
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #9ca3af;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  width: 100%;
}

.nav-item:hover:not(.disabled) {
  background: #374151;
  color: #f3f4f6;
}

.nav-item.active {
  background: #3b82f6;
  color: white;
}

.nav-item.disabled {
  color: #4b5563;
  cursor: not-allowed;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: none;
}

.content-header {
  padding: 16px 24px;
  border-bottom: 1px solid #374151;
}

.content-header h1 {
  margin: 0;
  font-size: 24px;
  color: #f3f4f6;
}

.content-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.placeholder {
  color: #6b7280;
  font-style: italic;
}
</style>
```

**Step 2: Verify it renders**

Run dev server, open admin (Ctrl+Shift+A), verify:
- Sidebar shows DATA and ASSETS sections
- "Enemies" in DATA is disabled/grayed
- Clicking items switches content area

**Step 3: Commit**

```bash
git add src/screens/AdminScreen.vue
git commit -m "feat(admin): refactor sidebar with DATA/ASSETS categories"
```

---

## Task 5: Hero Picker Component

Grid of hero cards with search and rarity filter.

**Files:**
- Create: `src/screens/admin/HeroPicker.vue`

**Step 1: Create HeroPicker component**

```vue
<!-- src/screens/admin/HeroPicker.vue -->
<script setup>
import { ref, computed } from 'vue'
import { getAllHeroTemplates } from '../../data/heroes/index.js'
import HeroCard from '../../components/HeroCard.vue'

const emit = defineEmits(['select'])

const searchQuery = ref('')
const rarityFilter = ref(0) // 0 = all

const allHeroes = getAllHeroTemplates()

const filteredHeroes = computed(() => {
  let heroes = allHeroes

  // Filter by rarity
  if (rarityFilter.value > 0) {
    heroes = heroes.filter(h => h.rarity === rarityFilter.value)
  }

  // Filter by search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    heroes = heroes.filter(h =>
      h.name.toLowerCase().includes(query) ||
      h.id.toLowerCase().includes(query)
    )
  }

  // Sort by rarity (desc) then name
  return heroes.sort((a, b) => {
    if (b.rarity !== a.rarity) return b.rarity - a.rarity
    return a.name.localeCompare(b.name)
  })
})

const rarityOptions = [
  { value: 0, label: 'All' },
  { value: 5, label: '5' },
  { value: 4, label: '4' },
  { value: 3, label: '3' },
  { value: 2, label: '2' },
  { value: 1, label: '1' }
]

function selectHero(hero) {
  emit('select', hero)
}
</script>

<template>
  <div class="hero-picker">
    <div class="filters">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search heroes..."
        class="search-input"
      />
      <select v-model="rarityFilter" class="rarity-select">
        <option v-for="opt in rarityOptions" :key="opt.value" :value="opt.value">
          {{ opt.value === 0 ? 'All ★' : '★'.repeat(opt.value) }}
        </option>
      </select>
    </div>

    <div class="hero-grid">
      <div
        v-for="hero in filteredHeroes"
        :key="hero.id"
        class="hero-item"
        @click="selectHero(hero)"
      >
        <HeroCard
          :hero="{ templateId: hero.id, level: 1, starLevel: hero.rarity }"
          :compact="true"
          :showStats="false"
        />
        <div class="hero-name">{{ hero.name }}</div>
      </div>
    </div>

    <div v-if="filteredHeroes.length === 0" class="no-results">
      No heroes found
    </div>
  </div>
</template>

<style scoped>
.hero-picker {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filters {
  display: flex;
  gap: 12px;
}

.search-input {
  flex: 1;
  padding: 10px 14px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 14px;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.rarity-select {
  padding: 10px 14px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 14px;
  cursor: pointer;
}

.rarity-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.hero-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.15s;
}

.hero-item:hover {
  background: #374151;
}

.hero-name {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-results {
  color: #6b7280;
  text-align: center;
  padding: 40px;
}
</style>
```

**Step 2: Verify it renders**

Import into AdminScreen temporarily to test.

**Step 3: Commit**

```bash
git add src/screens/admin/HeroPicker.vue
git commit -m "feat(admin): add hero picker component with search and filter"
```

---

## Task 6: Hero Editor Shell Component

Main editor container with back button, mode toggle, tabs, and save.

**Files:**
- Create: `src/screens/admin/HeroEditor.vue`

**Step 1: Create HeroEditor component**

```vue
<!-- src/screens/admin/HeroEditor.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { validateHero } from '../../utils/heroValidator.js'
import { serializeHero, parseHeroFile } from '../../utils/heroSerializer.js'
import HeroEditorBasicInfo from './HeroEditorBasicInfo.vue'
import HeroEditorStats from './HeroEditorStats.vue'
import HeroEditorSkills from './HeroEditorSkills.vue'
import HeroEditorLeaderSkill from './HeroEditorLeaderSkill.vue'
import HeroEditorFinale from './HeroEditorFinale.vue'
import HeroEditorRawCode from './HeroEditorRawCode.vue'

const props = defineProps({
  heroId: { type: String, required: true }
})

const emit = defineEmits(['back'])

// State
const hero = ref(null)
const originalContent = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const saveMessage = ref(null)
const validationErrors = ref([])

const mode = ref('guided') // 'guided' or 'raw'
const activeTab = ref('basic')
const rawCode = ref('')

// Tabs
const tabs = computed(() => {
  const base = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'stats', label: 'Stats' },
    { id: 'skills', label: 'Skills' },
    { id: 'leader', label: 'Leader Skill' }
  ]
  if (hero.value?.classId === 'bard') {
    base.push({ id: 'finale', label: 'Finale' })
  }
  return base
})

// Load hero on mount
async function loadHero() {
  loading.value = true
  error.value = null

  try {
    const res = await fetch(`/__admin/hero/${props.heroId}`)
    if (!res.ok) {
      throw new Error(`Failed to load hero: ${res.statusText}`)
    }
    const data = await res.json()
    originalContent.value = data.content
    hero.value = parseHeroFile(data.content)
    rawCode.value = data.content
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

loadHero()

// Sync raw code when hero changes (guided mode edits)
watch(hero, (newHero) => {
  if (newHero && mode.value === 'guided') {
    rawCode.value = serializeHero(newHero)
  }
}, { deep: true })

// Sync hero when raw code changes (raw mode edits)
function onRawCodeChange(newCode) {
  rawCode.value = newCode
  try {
    hero.value = parseHeroFile(newCode)
  } catch (e) {
    // Invalid code - don't update hero
  }
}

// Save
async function save() {
  // Validate
  const errors = validateHero(hero.value)
  validationErrors.value = errors

  if (errors.length > 0) {
    saveMessage.value = { type: 'error', text: `Cannot save - ${errors.length} error(s)` }
    return
  }

  saving.value = true
  saveMessage.value = null

  try {
    const content = serializeHero(hero.value)
    const res = await fetch(`/__admin/hero/${props.heroId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })

    if (!res.ok) {
      throw new Error(`Failed to save: ${res.statusText}`)
    }

    saveMessage.value = { type: 'success', text: `Saved ${props.heroId}.js` }
    originalContent.value = content

    // Clear message after 3s
    setTimeout(() => {
      if (saveMessage.value?.type === 'success') {
        saveMessage.value = null
      }
    }, 3000)
  } catch (e) {
    saveMessage.value = { type: 'error', text: e.message }
  } finally {
    saving.value = false
  }
}

function goBack() {
  emit('back')
}
</script>

<template>
  <div class="hero-editor">
    <!-- Header -->
    <div class="editor-header">
      <button class="back-btn" @click="goBack">← Back</button>
      <h2 v-if="hero">{{ hero.name }}</h2>
      <div class="header-actions">
        <span v-if="saveMessage" :class="['save-message', saveMessage.type]">
          {{ saveMessage.type === 'success' ? '✓' : '✕' }} {{ saveMessage.text }}
        </span>
        <button class="save-btn" :disabled="saving" @click="save">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Loading/Error -->
    <div v-if="loading" class="loading">Loading hero...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- Editor -->
    <template v-else-if="hero">
      <!-- Mode toggle -->
      <div class="mode-toggle">
        <label :class="{ active: mode === 'guided' }">
          <input type="radio" v-model="mode" value="guided" />
          Guided
        </label>
        <label :class="{ active: mode === 'raw' }">
          <input type="radio" v-model="mode" value="raw" />
          Raw Code
        </label>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Validation errors -->
      <div v-if="validationErrors.length > 0" class="validation-errors">
        <div class="error-header">{{ validationErrors.length }} validation error(s):</div>
        <ul>
          <li v-for="(err, i) in validationErrors" :key="i">{{ err }}</li>
        </ul>
      </div>

      <!-- Tab content: Guided mode -->
      <div v-if="mode === 'guided'" class="tab-content">
        <HeroEditorBasicInfo v-if="activeTab === 'basic'" v-model="hero" />
        <HeroEditorStats v-if="activeTab === 'stats'" v-model="hero" />
        <HeroEditorSkills v-if="activeTab === 'skills'" v-model="hero" />
        <HeroEditorLeaderSkill v-if="activeTab === 'leader'" v-model="hero" />
        <HeroEditorFinale v-if="activeTab === 'finale'" v-model="hero" />
      </div>

      <!-- Tab content: Raw code mode -->
      <div v-else class="tab-content">
        <HeroEditorRawCode
          :code="rawCode"
          @update:code="onRawCodeChange"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.hero-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #374151;
  margin-bottom: 16px;
}

.back-btn {
  padding: 8px 12px;
  background: #374151;
  border: none;
  border-radius: 6px;
  color: #f3f4f6;
  cursor: pointer;
  font-size: 14px;
}

.back-btn:hover {
  background: #4b5563;
}

.editor-header h2 {
  margin: 0;
  flex: 1;
  font-size: 20px;
  color: #f3f4f6;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-message {
  font-size: 13px;
}

.save-message.success {
  color: #22c55e;
}

.save-message.error {
  color: #ef4444;
}

.save-btn {
  padding: 8px 16px;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.save-btn:hover:not(:disabled) {
  background: #2563eb;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading, .error {
  padding: 40px;
  text-align: center;
}

.loading {
  color: #9ca3af;
}

.error {
  color: #ef4444;
}

.mode-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: #374151;
  padding: 4px;
  border-radius: 8px;
  width: fit-content;
}

.mode-toggle label {
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #9ca3af;
  transition: all 0.15s;
}

.mode-toggle label.active {
  background: #1f2937;
  color: #f3f4f6;
}

.mode-toggle input {
  display: none;
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #374151;
  margin-bottom: 16px;
}

.tab {
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #9ca3af;
  cursor: pointer;
  font-size: 14px;
}

.tab:hover {
  color: #f3f4f6;
}

.tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.validation-errors {
  background: #451a1a;
  border: 1px solid #dc2626;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.error-header {
  color: #fca5a5;
  font-weight: 600;
  margin-bottom: 8px;
}

.validation-errors ul {
  margin: 0;
  padding-left: 20px;
  color: #fca5a5;
  font-size: 13px;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}
</style>
```

**Step 2: Create placeholder tab components**

Create minimal placeholder files for each tab component so HeroEditor compiles:

```vue
<!-- src/screens/admin/HeroEditorBasicInfo.vue -->
<script setup>
const model = defineModel()
</script>
<template>
  <div>Basic Info placeholder - {{ model?.name }}</div>
</template>
```

(Repeat pattern for HeroEditorStats.vue, HeroEditorSkills.vue, HeroEditorLeaderSkill.vue, HeroEditorFinale.vue, HeroEditorRawCode.vue)

**Step 3: Wire into AdminScreen**

Update AdminScreen to use HeroPicker and HeroEditor:

```vue
<!-- In AdminScreen.vue script setup, add: -->
import HeroPicker from './admin/HeroPicker.vue'
import HeroEditor from './admin/HeroEditor.vue'

const editingHeroId = ref(null)

function selectHeroToEdit(hero) {
  editingHeroId.value = hero.id
}

function backToHeroPicker() {
  editingHeroId.value = null
}
```

```vue
<!-- In AdminScreen.vue template, replace hero-editor placeholder: -->
<template v-if="activeSection === 'hero-editor'">
  <HeroEditor
    v-if="editingHeroId"
    :heroId="editingHeroId"
    @back="backToHeroPicker"
  />
  <HeroPicker v-else @select="selectHeroToEdit" />
</template>
```

**Step 4: Commit**

```bash
git add src/screens/admin/HeroEditor.vue src/screens/admin/HeroEditorBasicInfo.vue src/screens/admin/HeroEditorStats.vue src/screens/admin/HeroEditorSkills.vue src/screens/admin/HeroEditorLeaderSkill.vue src/screens/admin/HeroEditorFinale.vue src/screens/admin/HeroEditorRawCode.vue src/screens/AdminScreen.vue
git commit -m "feat(admin): add hero editor shell with mode toggle and tabs"
```

---

## Task 7: Basic Info Tab

Form fields for name, epithet, introQuote, rarity, classId.

**Files:**
- Modify: `src/screens/admin/HeroEditorBasicInfo.vue`

**Step 1: Implement Basic Info tab**

```vue
<!-- src/screens/admin/HeroEditorBasicInfo.vue -->
<script setup>
import { DROPDOWN_OPTIONS } from '../../utils/heroValidator.js'
import { classes } from '../../data/classes.js'

const model = defineModel()

const rarityLabels = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Epic',
  5: 'Legendary'
}
</script>

<template>
  <div class="basic-info-tab">
    <div class="form-group">
      <label>ID</label>
      <input type="text" :value="model.id" disabled class="disabled" />
      <span class="hint">Cannot be changed (would require file rename)</span>
    </div>

    <div class="form-group">
      <label>Name</label>
      <input type="text" v-model="model.name" />
    </div>

    <div class="form-group">
      <label>Epithet</label>
      <input type="text" v-model="model.epithet" placeholder="e.g., The Radiant Protector" />
      <span class="hint">Optional subtitle shown under hero name</span>
    </div>

    <div class="form-group">
      <label>Intro Quote</label>
      <input type="text" v-model="model.introQuote" placeholder="e.g., Light shall prevail!" />
      <span class="hint">Optional quote displayed when hero is summoned</span>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Rarity</label>
        <select v-model.number="model.rarity">
          <option v-for="r in DROPDOWN_OPTIONS.rarities" :key="r" :value="r">
            {{ '★'.repeat(r) }} {{ rarityLabels[r] }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Class</label>
        <select v-model="model.classId">
          <option v-for="classId in DROPDOWN_OPTIONS.classIds" :key="classId" :value="classId">
            {{ classes[classId].title }}
          </option>
        </select>
        <span class="hint">Resource: {{ classes[model.classId]?.resourceName }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.basic-info-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 500px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #d1d5db;
}

input, select {
  padding: 10px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 14px;
}

input:focus, select:focus {
  outline: none;
  border-color: #3b82f6;
}

input.disabled {
  background: #1f2937;
  color: #6b7280;
  cursor: not-allowed;
}

.hint {
  font-size: 11px;
  color: #6b7280;
}
</style>
```

**Step 2: Test in browser**

Open admin, select a hero, verify Basic Info tab shows all fields.

**Step 3: Commit**

```bash
git add src/screens/admin/HeroEditorBasicInfo.vue
git commit -m "feat(admin): implement Basic Info tab with form fields"
```

---

## Task 8: Stats Tab

Number inputs for HP, ATK, DEF, SPD, MP with class context.

**Files:**
- Modify: `src/screens/admin/HeroEditorStats.vue`

**Step 1: Implement Stats tab**

```vue
<!-- src/screens/admin/HeroEditorStats.vue -->
<script setup>
import { computed } from 'vue'
import { classes } from '../../data/classes.js'

const model = defineModel()

const classInfo = computed(() => classes[model.value?.classId])

const resourceNote = computed(() => {
  const cls = classInfo.value
  if (!cls) return ''
  return `MP is used for ${cls.resourceName} resource (${cls.title})`
})
</script>

<template>
  <div class="stats-tab">
    <h3>Base Stats (Level 1)</h3>

    <div class="stats-grid">
      <div class="form-group">
        <label>HP</label>
        <input type="number" v-model.number="model.baseStats.hp" min="1" />
      </div>

      <div class="form-group">
        <label>ATK</label>
        <input type="number" v-model.number="model.baseStats.atk" min="1" />
      </div>

      <div class="form-group">
        <label>DEF</label>
        <input type="number" v-model.number="model.baseStats.def" min="0" />
      </div>

      <div class="form-group">
        <label>SPD</label>
        <input type="number" v-model.number="model.baseStats.spd" min="1" />
      </div>

      <div class="form-group">
        <label>MP</label>
        <input type="number" v-model.number="model.baseStats.mp" min="0" />
      </div>
    </div>

    <div class="resource-note">
      <span class="icon">ℹ️</span>
      {{ resourceNote }}
    </div>
  </div>
</template>

<style scoped>
.stats-tab {
  max-width: 400px;
}

h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #f3f4f6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #d1d5db;
}

input {
  padding: 10px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
}

.resource-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #1f2937;
  border-radius: 6px;
  font-size: 13px;
  color: #9ca3af;
}

.icon {
  font-size: 16px;
}
</style>
```

**Step 2: Commit**

```bash
git add src/screens/admin/HeroEditorStats.vue
git commit -m "feat(admin): implement Stats tab with number inputs"
```

---

## Task 9: Skills Tab - List and Detail Panel

List of skills on left, detail form on right.

**Files:**
- Modify: `src/screens/admin/HeroEditorSkills.vue`
- Create: `src/screens/admin/SkillEffectEditor.vue`

**Step 1: Implement Skills tab with list + detail**

```vue
<!-- src/screens/admin/HeroEditorSkills.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { DROPDOWN_OPTIONS } from '../../utils/heroValidator.js'
import { classes } from '../../data/classes.js'
import { effectDefinitions } from '../../data/statusEffects.js'
import SkillEffectEditor from './SkillEffectEditor.vue'

const model = defineModel()

const selectedIndex = ref(0)
const selectedSkill = computed(() => model.value?.skills?.[selectedIndex.value])

// Reset selection if skills array changes
watch(() => model.value?.skills?.length, (len) => {
  if (selectedIndex.value >= len) {
    selectedIndex.value = Math.max(0, len - 1)
  }
})

const classInfo = computed(() => classes[model.value?.classId])

// Determine which cost field to show based on class
const costField = computed(() => {
  const resourceType = classInfo.value?.resourceType
  switch (resourceType) {
    case 'rage': return { key: 'rageCost', label: 'Rage Cost' }
    case 'valor': return { key: 'valorRequired', label: 'Valor Required' }
    case 'essence': return { key: 'essenceCost', label: 'Essence Cost' }
    case 'verse': return null // Bards have free skills
    case 'focus': return null // Rangers have free skills
    default: return { key: 'mpCost', label: 'MP Cost' }
  }
})

function selectSkill(index) {
  selectedIndex.value = index
}

function addEffect() {
  if (!selectedSkill.value.effects) {
    selectedSkill.value.effects = []
  }
  selectedSkill.value.effects.push({
    type: 'atk_up',
    target: 'self',
    duration: 2,
    value: 10
  })
}

function removeEffect(index) {
  selectedSkill.value.effects.splice(index, 1)
}
</script>

<template>
  <div class="skills-tab">
    <!-- Skill list -->
    <div class="skill-list">
      <div
        v-for="(skill, i) in model.skills"
        :key="i"
        :class="['skill-item', { active: selectedIndex === i }]"
        @click="selectSkill(i)"
      >
        <span class="skill-num">{{ i + 1 }}.</span>
        <span class="skill-name">{{ skill.name || '(unnamed)' }}</span>
      </div>
    </div>

    <!-- Skill detail -->
    <div v-if="selectedSkill" class="skill-detail">
      <div class="form-group">
        <label>Name</label>
        <input type="text" v-model="selectedSkill.name" />
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea v-model="selectedSkill.description" rows="2"></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Unlock Level</label>
          <select v-model.number="selectedSkill.skillUnlockLevel">
            <option v-for="lvl in DROPDOWN_OPTIONS.skillUnlockLevels" :key="lvl" :value="lvl">
              {{ lvl }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Target</label>
          <select v-model="selectedSkill.targetType">
            <option v-for="t in DROPDOWN_OPTIONS.targetTypes" :key="t" :value="t">
              {{ t }}
            </option>
          </select>
        </div>
      </div>

      <!-- Damage section -->
      <div class="section-header">Damage</div>
      <div class="form-row">
        <div class="form-group">
          <label>Damage %</label>
          <input type="number" v-model.number="selectedSkill.damagePercent" min="0" />
        </div>
        <div class="form-group">
          <label>Ignore DEF %</label>
          <input type="number" v-model.number="selectedSkill.ignoreDef" min="0" max="100" />
        </div>
      </div>

      <!-- Cost section -->
      <div v-if="costField" class="section-header">Cost</div>
      <div v-if="costField" class="form-row">
        <div class="form-group">
          <label>{{ costField.label }}</label>
          <input type="number" v-model.number="selectedSkill[costField.key]" min="0" />
        </div>
      </div>
      <div v-else class="no-cost-note">
        {{ classInfo?.title }} skills have no cost
      </div>

      <!-- Effects section -->
      <div class="section-header">
        Effects
        <button class="add-btn" @click="addEffect">+ Add</button>
      </div>

      <div v-if="selectedSkill.effects?.length" class="effects-list">
        <SkillEffectEditor
          v-for="(effect, i) in selectedSkill.effects"
          :key="i"
          v-model="selectedSkill.effects[i]"
          @remove="removeEffect(i)"
        />
      </div>
      <div v-else class="no-effects">No effects</div>
    </div>
  </div>
</template>

<style scoped>
.skills-tab {
  display: flex;
  gap: 24px;
  height: 100%;
}

.skill-list {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-item {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #1f2937;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.skill-item:hover {
  background: #374151;
}

.skill-item.active {
  background: #3b82f6;
}

.skill-num {
  color: #6b7280;
  font-size: 13px;
}

.skill-item.active .skill-num {
  color: rgba(255,255,255,0.7);
}

.skill-name {
  color: #f3f4f6;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #d1d5db;
}

input, select, textarea {
  padding: 10px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 14px;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

textarea {
  resize: vertical;
  font-family: inherit;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  padding-top: 12px;
  border-top: 1px solid #374151;
  margin-top: 4px;
}

.add-btn {
  padding: 4px 8px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
}

.add-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.no-effects, .no-cost-note {
  color: #6b7280;
  font-size: 13px;
  font-style: italic;
}
</style>
```

**Step 2: Implement SkillEffectEditor**

```vue
<!-- src/screens/admin/SkillEffectEditor.vue -->
<script setup>
import { computed } from 'vue'
import { DROPDOWN_OPTIONS } from '../../utils/heroValidator.js'
import { effectDefinitions } from '../../data/statusEffects.js'

const model = defineModel()
const emit = defineEmits(['remove'])

const effectDef = computed(() => effectDefinitions[model.value?.type])

// Determine which extra fields to show based on effect type
const extraFields = computed(() => {
  const type = model.value?.type
  if (!type) return []

  const fields = []

  // Most effects need value
  if (['atk_up', 'atk_down', 'def_up', 'def_down', 'spd_up', 'spd_down', 'damage_reduction', 'evasion', 'thorns', 'marked'].includes(type)) {
    fields.push({ key: 'value', label: 'Value %', type: 'number' })
  }

  // DoTs need damage value
  if (['burn', 'poison'].includes(type)) {
    fields.push({ key: 'value', label: 'Damage (% ATK)', type: 'number' })
  }

  // Shield needs shieldHp
  if (type === 'shield') {
    fields.push({ key: 'shieldHp', label: 'Shield HP', type: 'number' })
  }

  // Guardian link needs redirect percent
  if (type === 'guardian_link') {
    fields.push({ key: 'redirectPercent', label: 'Redirect %', type: 'number' })
  }

  // Divine sacrifice needs DR and heal
  if (type === 'divine_sacrifice') {
    fields.push({ key: 'damageReduction', label: 'DR %', type: 'number' })
    fields.push({ key: 'healPerTurn', label: 'Heal/Turn %', type: 'number' })
  }

  return fields
})
</script>

<template>
  <div class="effect-card">
    <div class="effect-header">
      <span class="effect-icon">{{ effectDef?.icon || '?' }}</span>
      <select v-model="model.type" class="effect-type-select">
        <option v-for="t in DROPDOWN_OPTIONS.effectTypes" :key="t" :value="t">
          {{ effectDefinitions[t]?.name || t }}
        </option>
      </select>
      <button class="remove-btn" @click="emit('remove')">×</button>
    </div>

    <div class="effect-fields">
      <div class="form-group">
        <label>Target</label>
        <select v-model="model.target">
          <option v-for="t in DROPDOWN_OPTIONS.effectTargets" :key="t" :value="t">
            {{ t }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Duration</label>
        <input type="number" v-model.number="model.duration" min="1" />
      </div>

      <div v-for="field in extraFields" :key="field.key" class="form-group">
        <label>{{ field.label }}</label>
        <input
          v-if="field.type === 'number'"
          type="number"
          v-model.number="model[field.key]"
        />
        <input
          v-else
          type="text"
          v-model="model[field.key]"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.effect-card {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 12px;
}

.effect-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.effect-icon {
  font-size: 18px;
}

.effect-type-select {
  flex: 1;
  padding: 6px 10px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 13px;
}

.remove-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #dc2626;
  color: white;
}

.effect-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

label {
  font-size: 11px;
  color: #9ca3af;
}

input, select {
  padding: 6px 8px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 13px;
}

input:focus, select:focus {
  outline: none;
  border-color: #3b82f6;
}
</style>
```

**Step 3: Commit**

```bash
git add src/screens/admin/HeroEditorSkills.vue src/screens/admin/SkillEffectEditor.vue
git commit -m "feat(admin): implement Skills tab with list/detail and effects editor"
```

---

## Task 10: Leader Skill Tab

Form for 5-star leader skills with type-specific fields.

**Files:**
- Modify: `src/screens/admin/HeroEditorLeaderSkill.vue`

**Step 1: Implement Leader Skill tab**

```vue
<!-- src/screens/admin/HeroEditorLeaderSkill.vue -->
<script setup>
import { computed } from 'vue'
import { DROPDOWN_OPTIONS } from '../../utils/heroValidator.js'
import { classes } from '../../data/classes.js'

const model = defineModel()

const isLegendary = computed(() => model.value?.rarity === 5)

const leaderSkillTypes = ['passive', 'timed', 'passive_regen']
const stats = ['atk', 'def', 'spd']

function initLeaderSkill() {
  if (!model.value.leaderSkill) {
    model.value.leaderSkill = {
      name: '',
      description: '',
      effects: [{
        type: 'passive',
        stat: 'atk',
        value: 10
      }]
    }
  }
}

function addEffect() {
  if (!model.value.leaderSkill.effects) {
    model.value.leaderSkill.effects = []
  }
  model.value.leaderSkill.effects.push({
    type: 'passive',
    stat: 'atk',
    value: 10
  })
}

function removeEffect(index) {
  model.value.leaderSkill.effects.splice(index, 1)
}
</script>

<template>
  <div class="leader-skill-tab">
    <template v-if="isLegendary">
      <div v-if="!model.leaderSkill" class="no-leader-skill">
        <p>This hero has no leader skill defined.</p>
        <button @click="initLeaderSkill" class="init-btn">Add Leader Skill</button>
      </div>

      <template v-else>
        <div class="form-group">
          <label>Name</label>
          <input type="text" v-model="model.leaderSkill.name" />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="model.leaderSkill.description" rows="2"></textarea>
        </div>

        <div class="section-header">
          Effects
          <button class="add-btn" @click="addEffect">+ Add</button>
        </div>

        <div class="effects-list">
          <div v-for="(effect, i) in model.leaderSkill.effects" :key="i" class="effect-card">
            <div class="effect-header">
              <select v-model="effect.type">
                <option v-for="t in leaderSkillTypes" :key="t" :value="t">
                  {{ t }}
                </option>
              </select>
              <button class="remove-btn" @click="removeEffect(i)">×</button>
            </div>

            <!-- Passive type fields -->
            <template v-if="effect.type === 'passive'">
              <div class="form-row">
                <div class="form-group">
                  <label>Stat</label>
                  <select v-model="effect.stat">
                    <option v-for="s in stats" :key="s" :value="s">{{ s.toUpperCase() }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Value %</label>
                  <input type="number" v-model.number="effect.value" />
                </div>
              </div>

              <div class="form-group">
                <label>Condition (optional)</label>
                <div class="condition-row">
                  <select v-model="effect.condition">
                    <option :value="undefined">No condition</option>
                    <option value="classId">Filter by Class</option>
                    <option value="role">Filter by Role</option>
                  </select>
                </div>
              </div>
            </template>

            <!-- Timed type fields -->
            <template v-else-if="effect.type === 'timed'">
              <div class="form-row">
                <div class="form-group">
                  <label>Trigger Round</label>
                  <input type="number" v-model.number="effect.triggerRound" min="1" />
                </div>
                <div class="form-group">
                  <label>Target</label>
                  <select v-model="effect.target">
                    <option value="all_allies">All Allies</option>
                    <option value="all_enemies">All Enemies</option>
                  </select>
                </div>
              </div>
            </template>

            <!-- Passive regen fields -->
            <template v-else-if="effect.type === 'passive_regen'">
              <div class="form-row">
                <div class="form-group">
                  <label>Target</label>
                  <select v-model="effect.target">
                    <option value="all_allies">All Allies</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>% Max HP</label>
                  <input type="number" v-model.number="effect.percentMaxHp" />
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </template>

    <div v-else class="not-legendary">
      <span class="icon">ℹ️</span>
      Leader skills are only available for 5-star (Legendary) heroes.
    </div>
  </div>
</template>

<style scoped>
.leader-skill-tab {
  max-width: 500px;
}

.not-legendary, .no-leader-skill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  background: #1f2937;
  border-radius: 8px;
  color: #9ca3af;
  text-align: center;
}

.icon {
  font-size: 24px;
}

.init-btn {
  padding: 10px 20px;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #d1d5db;
}

input, select, textarea {
  padding: 10px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 14px;
}

textarea {
  resize: vertical;
  font-family: inherit;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  padding: 12px 0;
  border-top: 1px solid #374151;
  margin-top: 8px;
}

.add-btn {
  padding: 4px 8px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.effect-card {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 12px;
}

.effect-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.effect-header select {
  flex: 1;
}

.remove-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
}

.remove-btn:hover {
  background: #dc2626;
  color: white;
}

.condition-row {
  display: flex;
  gap: 8px;
}
</style>
```

**Step 2: Commit**

```bash
git add src/screens/admin/HeroEditorLeaderSkill.vue
git commit -m "feat(admin): implement Leader Skill tab"
```

---

## Task 11: Finale Tab (Bards)

Form for Bard finale with target and effects.

**Files:**
- Modify: `src/screens/admin/HeroEditorFinale.vue`

**Step 1: Implement Finale tab**

```vue
<!-- src/screens/admin/HeroEditorFinale.vue -->
<script setup>
const model = defineModel()

function initFinale() {
  if (!model.value.finale) {
    model.value.finale = {
      name: '',
      description: '',
      target: 'all_allies',
      effects: []
    }
  }
}

function addEffect() {
  if (!model.value.finale.effects) {
    model.value.finale.effects = []
  }
  model.value.finale.effects.push({ type: 'heal', value: 10 })
}

function removeEffect(index) {
  model.value.finale.effects.splice(index, 1)
}
</script>

<template>
  <div class="finale-tab">
    <div v-if="!model.finale" class="no-finale">
      <p>This Bard has no Finale defined.</p>
      <button @click="initFinale" class="init-btn">Add Finale</button>
    </div>

    <template v-else>
      <div class="form-group">
        <label>Name</label>
        <input type="text" v-model="model.finale.name" />
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea v-model="model.finale.description" rows="2"></textarea>
      </div>

      <div class="form-group">
        <label>Target</label>
        <select v-model="model.finale.target">
          <option value="all_allies">All Allies</option>
          <option value="all_enemies">All Enemies</option>
        </select>
      </div>

      <div class="section-header">
        Effects
        <button class="add-btn" @click="addEffect">+ Add</button>
      </div>

      <div class="effects-list">
        <div v-for="(effect, i) in model.finale.effects" :key="i" class="effect-card">
          <div class="effect-header">
            <select v-model="effect.type">
              <option value="heal">Heal</option>
              <option value="resource_grant">Resource Grant</option>
              <option value="buff">Buff</option>
            </select>
            <button class="remove-btn" @click="removeEffect(i)">×</button>
          </div>

          <template v-if="effect.type === 'heal'">
            <div class="form-group">
              <label>Heal % (of ATK)</label>
              <input type="number" v-model.number="effect.value" />
            </div>
          </template>

          <template v-else-if="effect.type === 'resource_grant'">
            <div class="form-row">
              <div class="form-group">
                <label>MP Amount</label>
                <input type="number" v-model.number="effect.mpAmount" />
              </div>
              <div class="form-group">
                <label>Valor Amount</label>
                <input type="number" v-model.number="effect.valorAmount" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Verse Amount</label>
                <input type="number" v-model.number="effect.verseAmount" />
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" v-model="effect.focusGrant" />
                  Grant Focus
                </label>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.finale-tab {
  max-width: 500px;
}

.no-finale {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  background: #1f2937;
  border-radius: 8px;
  color: #9ca3af;
  text-align: center;
}

.init-btn {
  padding: 10px 20px;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #d1d5db;
}

input[type="text"], input[type="number"], select, textarea {
  padding: 10px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 14px;
}

input[type="checkbox"] {
  margin-right: 8px;
}

textarea {
  resize: vertical;
  font-family: inherit;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  padding: 12px 0;
  border-top: 1px solid #374151;
  margin-top: 8px;
}

.add-btn {
  padding: 4px 8px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.effect-card {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 12px;
}

.effect-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.effect-header select {
  flex: 1;
}

.remove-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
}

.remove-btn:hover {
  background: #dc2626;
  color: white;
}
</style>
```

**Step 2: Commit**

```bash
git add src/screens/admin/HeroEditorFinale.vue
git commit -m "feat(admin): implement Finale tab for Bards"
```

---

## Task 12: Raw Code Tab

Editable text area with syntax highlighting fallback.

**Files:**
- Modify: `src/screens/admin/HeroEditorRawCode.vue`

**Step 1: Implement Raw Code tab**

```vue
<!-- src/screens/admin/HeroEditorRawCode.vue -->
<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  code: { type: String, required: true }
})

const emit = defineEmits(['update:code'])

const localCode = ref(props.code)
const parseError = ref(null)

watch(() => props.code, (newCode) => {
  localCode.value = newCode
})

function onInput(event) {
  localCode.value = event.target.value
  emit('update:code', localCode.value)

  // Try to parse to detect errors
  try {
    const match = localCode.value.match(/export\s+const\s+\w+\s*=\s*(\{[\s\S]*\})\s*$/)
    if (match) {
      // Replace EffectType refs with strings for parsing
      const withStrings = match[1].replace(/EffectType\.\w+/g, "'placeholder'")
      new Function(`return ${withStrings}`)()
      parseError.value = null
    }
  } catch (e) {
    parseError.value = e.message
  }
}

const lineNumbers = computed(() => {
  const lines = localCode.value.split('\n').length
  return Array.from({ length: lines }, (_, i) => i + 1)
})
</script>

<template>
  <div class="raw-code-tab">
    <div class="code-editor">
      <div class="line-numbers">
        <div v-for="n in lineNumbers" :key="n" class="line-num">{{ n }}</div>
      </div>
      <textarea
        :value="localCode"
        @input="onInput"
        spellcheck="false"
        class="code-textarea"
      ></textarea>
    </div>

    <div v-if="parseError" class="parse-error">
      <span class="error-icon">⚠️</span>
      Syntax error: {{ parseError }}
    </div>
  </div>
</template>

<style scoped>
.raw-code-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.code-editor {
  flex: 1;
  display: flex;
  background: #1e1e1e;
  border: 1px solid #374151;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'SF Mono', 'Fira Code', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.line-numbers {
  padding: 12px 8px;
  background: #252526;
  color: #858585;
  text-align: right;
  user-select: none;
  border-right: 1px solid #374151;
}

.line-num {
  padding: 0 8px;
}

.code-textarea {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  color: #d4d4d4;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  resize: none;
  outline: none;
  white-space: pre;
  overflow-x: auto;
}

.parse-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #451a1a;
  border: 1px solid #dc2626;
  border-radius: 6px;
  color: #fca5a5;
  font-size: 13px;
}

.error-icon {
  font-size: 16px;
}
</style>
```

**Step 2: Commit**

```bash
git add src/screens/admin/HeroEditorRawCode.vue
git commit -m "feat(admin): implement Raw Code tab with line numbers"
```

---

## Task 13: Integration Testing

Manually test the full flow end-to-end.

**Files:**
- None (manual testing)

**Step 1: Start dev server**

```bash
cd /home/deltran/code/dorf/.worktrees/hero-editor && npm run dev
```

**Step 2: Test hero picker**

- Open admin (Ctrl+Shift+A)
- Verify "Heroes" is selected in DATA section
- Search for "Aurora" - should filter
- Filter by 5-star - should show only legendaries
- Click a hero - should open editor

**Step 3: Test guided editing**

- Verify all tabs load without errors
- Edit name, save, refresh - should persist
- Edit stats, save, refresh - should persist
- Edit a skill effect, save, refresh - should persist
- Toggle to Raw Code - should show serialized JS
- Edit in Raw Code, toggle back to Guided - should sync

**Step 4: Test validation**

- Clear a required field (name)
- Click Save - should show validation error
- Fix the field, Save - should succeed

**Step 5: Run automated tests**

```bash
cd /home/deltran/code/dorf/.worktrees/hero-editor && npm test
```

Expected: All tests pass

**Step 6: Commit final state**

```bash
git add -A
git commit -m "feat(admin): complete hero editor implementation"
```

---

## Summary

This plan creates 12 implementation tasks:

1. **Hero Validator** - Validation logic with tests
2. **Hero Serializer** - JS serialization with tests
3. **Vite Plugin Endpoint** - Hero file read/write API
4. **AdminScreen Refactor** - Categorized sidebar
5. **Hero Picker** - Grid with search/filter
6. **Hero Editor Shell** - Tabs, mode toggle, save
7. **Basic Info Tab** - Identity fields form
8. **Stats Tab** - Stat number inputs
9. **Skills Tab** - List + detail with effects
10. **Leader Skill Tab** - 5-star leader skill form
11. **Finale Tab** - Bard finale form
12. **Raw Code Tab** - Text editor
13. **Integration Testing** - Manual verification

Each task follows TDD where applicable (utilities) and includes explicit commit points.
