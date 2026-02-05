# Quest Node Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full CRUD admin editor for quest regions and nodes that reads/writes the split region source files.

**Architecture:** Vite plugin REST API endpoints call a quest serializer utility to parse/write region JS files. A new `QuestNodeEditor.vue` component replaces the existing `QuestNodeList.vue` with a two-panel layout (region list + editor). Reusable `SearchableDropdown.vue` handles enemy/item/connection picking.

**Tech Stack:** Vue 3 Composition API, Vite dev server middleware, Node.js fs, Vitest

---

### Task 1: Quest Serializer — parseRegionFile

Create the utility that reads a region JS file and extracts structured data.

**Files:**
- Create: `src/utils/questSerializer.js`
- Test: `src/utils/__tests__/questSerializer.test.js`

**Step 1: Write the failing test for parseRegionFile**

```js
// src/utils/__tests__/questSerializer.test.js
import { describe, it, expect } from 'vitest'
import { parseRegionFile } from '../questSerializer.js'

describe('questSerializer', () => {
  describe('parseRegionFile', () => {
    it('parses a region file string into regionMeta and nodes', () => {
      const fileContent = `import mapImg from '../../assets/maps/test_region.png'

export const regionMeta = {
  id: 'test_region',
  name: 'Test Region',
  description: 'A test region',
  superRegion: 'western_veros',
  startNode: 'test_01',
  width: 600,
  height: 1000,
  backgroundColor: '#1a2f1a',
  backgroundImage: mapImg
}

export const nodes = {
  test_01: {
    id: 'test_01',
    name: 'Test Node',
    region: 'Test Region',
    x: 100,
    y: 200,
    battles: [
      { enemies: ['goblin_scout', 'goblin_scout'] }
    ],
    connections: ['test_02'],
    rewards: { gems: 50, gold: 100, exp: 80 },
    firstClearBonus: { gems: 30 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 1, chance: 0.8 }
    ]
  },
  test_02: {
    id: 'test_02',
    name: 'Second Node',
    region: 'Test Region',
    x: 300,
    y: 400,
    battles: [
      { enemies: ['forest_wolf'] }
    ],
    connections: [],
    rewards: { gems: 60, gold: 120, exp: 90 }
  }
}
`

      const result = parseRegionFile(fileContent)

      expect(result.importLines).toEqual(["import mapImg from '../../assets/maps/test_region.png'"])
      expect(result.regionMeta.id).toBe('test_region')
      expect(result.regionMeta.name).toBe('Test Region')
      expect(result.regionMeta.width).toBe(600)
      // backgroundImage is an import reference — should be stripped from parsed data
      expect(result.regionMeta.backgroundImage).toBeUndefined()
      expect(Object.keys(result.nodes)).toEqual(['test_01', 'test_02'])
      expect(result.nodes.test_01.name).toBe('Test Node')
      expect(result.nodes.test_01.battles).toHaveLength(1)
      expect(result.nodes.test_01.rewards.gems).toBe(50)
      expect(result.nodes.test_02.connections).toEqual([])
    })

    it('parses a genus loci node', () => {
      const fileContent = `export const regionMeta = {
  id: 'boss_area',
  name: 'Boss Area',
  superRegion: 'western_veros',
  startNode: 'boss_01',
  width: 600,
  height: 500,
  backgroundColor: '#2a1a1a'
}

export const nodes = {
  boss_01: {
    id: 'boss_01',
    name: 'Boss Fight',
    region: 'Boss Area',
    x: 200,
    y: 100,
    type: 'genusLoci',
    genusLociId: 'great_troll',
    connections: []
  }
}
`

      const result = parseRegionFile(fileContent)

      expect(result.importLines).toEqual([])
      expect(result.nodes.boss_01.type).toBe('genusLoci')
      expect(result.nodes.boss_01.genusLociId).toBe('great_troll')
    })

    it('parses a file with no imports', () => {
      const fileContent = `export const regionMeta = {
  id: 'simple',
  name: 'Simple',
  superRegion: 'western_veros',
  startNode: 'sim_01',
  width: 600,
  height: 500,
  backgroundColor: '#1a1a1a'
}

export const nodes = {
  sim_01: {
    id: 'sim_01',
    name: 'Only Node',
    region: 'Simple',
    x: 50,
    y: 50,
    battles: [{ enemies: ['goblin_scout'] }],
    connections: [],
    rewards: { gems: 10, gold: 20, exp: 10 }
  }
}
`
      const result = parseRegionFile(fileContent)
      expect(result.importLines).toEqual([])
      expect(result.regionMeta.id).toBe('simple')
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/__tests__/questSerializer.test.js`
Expected: FAIL — module not found

**Step 3: Write minimal parseRegionFile implementation**

```js
// src/utils/questSerializer.js

/**
 * Parse a region file's content string into structured data.
 * Extracts import lines (preserved verbatim), regionMeta, and nodes.
 * backgroundImage is stripped from regionMeta since it's an import reference.
 */
export function parseRegionFile(fileContent) {
  const lines = fileContent.split('\n')

  // Extract import lines (everything before first export)
  const importLines = []
  for (const line of lines) {
    if (line.startsWith('import ')) {
      importLines.push(line)
    }
  }

  // Parse regionMeta using brace-counting
  const regionMeta = parseExportObject(fileContent, 'regionMeta')
  // Strip backgroundImage — it's an import reference, not serializable data
  delete regionMeta.backgroundImage

  // Parse nodes object
  const nodes = parseExportObject(fileContent, 'nodes')

  return { importLines, regionMeta, nodes }
}

/**
 * Extract and evaluate an exported object from file content by its export name.
 * Uses brace-counting to find the object boundaries, then Function constructor to evaluate.
 */
function parseExportObject(content, exportName) {
  const pattern = new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*\\{`)
  const match = content.match(pattern)
  if (!match) {
    throw new Error(`Could not find export "${exportName}" in file content`)
  }

  const startIndex = content.indexOf('{', match.index)
  let braceCount = 0
  let endIndex = startIndex

  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') braceCount++
    else if (content[i] === '}') {
      braceCount--
      if (braceCount === 0) {
        endIndex = i
        break
      }
    }
  }

  const objectStr = content.slice(startIndex, endIndex + 1)

  try {
    return new Function(`return ${objectStr}`)()
  } catch (e) {
    throw new Error(`Failed to parse "${exportName}": ${e.message}`)
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/__tests__/questSerializer.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/questSerializer.js src/utils/__tests__/questSerializer.test.js
git commit -m "feat: add parseRegionFile for quest serializer"
```

---

### Task 2: Quest Serializer — serializeRegionFile

**Files:**
- Modify: `src/utils/questSerializer.js`
- Modify: `src/utils/__tests__/questSerializer.test.js`

**Step 1: Write the failing test for serializeRegionFile**

Add to the test file:

```js
  describe('serializeRegionFile', () => {
    it('serializes regionMeta and nodes back to valid JS', () => {
      const importLines = ["import mapImg from '../../assets/maps/test_region.png'"]
      const regionMeta = {
        id: 'test_region',
        name: 'Test Region',
        description: 'A test',
        superRegion: 'western_veros',
        startNode: 'test_01',
        width: 600,
        height: 1000,
        backgroundColor: '#1a2f1a'
      }
      const nodes = {
        test_01: {
          id: 'test_01',
          name: 'Test Node',
          region: 'Test Region',
          x: 100,
          y: 200,
          battles: [{ enemies: ['goblin_scout'] }],
          connections: ['test_02'],
          rewards: { gems: 50, gold: 100, exp: 80 }
        }
      }

      const result = serializeRegionFile(regionMeta, nodes, importLines)

      // Should contain the import line
      expect(result).toContain("import mapImg from '../../assets/maps/test_region.png'")
      // Should have regionMeta export with backgroundImage reference restored
      expect(result).toContain('export const regionMeta')
      expect(result).toContain("id: 'test_region'")
      expect(result).toContain('backgroundImage: mapImg')
      // Should have nodes export
      expect(result).toContain('export const nodes')
      expect(result).toContain("id: 'test_01'")
      // Round-trip: parsing the output should produce the same data
      const parsed = parseRegionFile(result)
      expect(parsed.regionMeta.id).toBe('test_region')
      expect(parsed.nodes.test_01.name).toBe('Test Node')
    })

    it('serializes without imports when there are none', () => {
      const regionMeta = {
        id: 'simple',
        name: 'Simple',
        superRegion: 'western_veros',
        startNode: 'sim_01',
        width: 600,
        height: 500,
        backgroundColor: '#1a1a1a'
      }
      const nodes = {
        sim_01: {
          id: 'sim_01',
          name: 'Only Node',
          region: 'Simple',
          x: 50,
          y: 50,
          battles: [{ enemies: ['goblin_scout'] }],
          connections: [],
          rewards: { gems: 10, gold: 20, exp: 10 }
        }
      }

      const result = serializeRegionFile(regionMeta, nodes, [])

      expect(result).not.toContain('import ')
      expect(result).toContain('export const regionMeta')
      // Should NOT have backgroundImage line when no imports
      expect(result).not.toContain('backgroundImage')
    })

    it('round-trips a complex file preserving all data', () => {
      const original = `import whisperingWoodsMap from '../../assets/maps/whispering_woods.png'

export const regionMeta = {
  id: 'whispering_woods',
  name: 'Whispering Woods',
  description: 'Ancient trees whisper forgotten warnings.',
  superRegion: 'western_veros',
  startNode: 'forest_01',
  width: 600,
  height: 1000,
  backgroundColor: '#1a2f1a',
  backgroundImage: whisperingWoodsMap
}

export const nodes = {
  forest_01: {
    id: 'forest_01',
    name: 'Dark Thicket',
    region: 'Whispering Woods',
    x: 41,
    y: 45,
    battles: [
      { enemies: ['goblin_scout', 'goblin_scout'] },
      { enemies: ['goblin_scout', 'forest_wolf'] }
    ],
    connections: ['forest_02'],
    rewards: { gems: 50, gold: 100, exp: 80 },
    firstClearBonus: { gems: 30 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 1, chance: 0.8 },
      { itemId: 'useless_rock', min: 1, max: 1, chance: 0.3 }
    ]
  },
  forest_02: {
    id: 'forest_02',
    name: 'Wolf Den',
    region: 'Whispering Woods',
    x: 182,
    y: 413,
    regionLinkPosition: { x: 553, y: 429 },
    battles: [
      { enemies: ['forest_wolf', 'forest_wolf'] }
    ],
    connections: ['forest_03'],
    rewards: { gems: 60, gold: 150, exp: 120 }
  }
}
`
      const parsed = parseRegionFile(original)
      const serialized = serializeRegionFile(parsed.regionMeta, parsed.nodes, parsed.importLines)
      const reparsed = parseRegionFile(serialized)

      expect(reparsed.regionMeta.id).toBe('whispering_woods')
      expect(reparsed.regionMeta.name).toBe('Whispering Woods')
      expect(reparsed.regionMeta.width).toBe(600)
      expect(reparsed.nodes.forest_01.name).toBe('Dark Thicket')
      expect(reparsed.nodes.forest_01.battles).toHaveLength(2)
      expect(reparsed.nodes.forest_01.itemDrops).toHaveLength(2)
      expect(reparsed.nodes.forest_02.regionLinkPosition).toEqual({ x: 553, y: 429 })
    })
  })
```

Also add the import at top of the test file:
```js
import { parseRegionFile, serializeRegionFile } from '../questSerializer.js'
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/__tests__/questSerializer.test.js`
Expected: FAIL — serializeRegionFile not exported

**Step 3: Write serializeRegionFile implementation**

Add to `src/utils/questSerializer.js`:

```js
/**
 * Convert snake_case to camelCase.
 * 'whispering_woods' → 'whisperingWoods'
 */
export function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

/**
 * Serialize a JS value with proper indentation for source code output.
 * Similar to JSON.stringify but uses single quotes for strings and no quotes on keys.
 */
function serializeValue(value, indent = 0) {
  const pad = '  '.repeat(indent)
  const innerPad = '  '.repeat(indent + 1)

  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return value.toString()
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    // Check if it's a simple array (all primitives)
    const allPrimitive = value.every(v => typeof v !== 'object' || v === null)
    if (allPrimitive) {
      return `[${value.map(v => serializeValue(v, 0)).join(', ')}]`
    }
    const items = value.map(v => `${innerPad}${serializeValue(v, indent + 1)}`)
    return `[\n${items.join(',\n')}\n${pad}]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) return '{}'
    // Check if it's a simple flat object (all primitive values)
    const allPrimitive = entries.every(([, v]) => typeof v !== 'object' || v === null)
    if (allPrimitive && entries.length <= 5) {
      const inner = entries.map(([k, v]) => `${k}: ${serializeValue(v, 0)}`).join(', ')
      return `{ ${inner} }`
    }
    const items = entries.map(([k, v]) => `${innerPad}${k}: ${serializeValue(v, indent + 1)}`)
    return `{\n${items.join(',\n')}\n${pad}}`
  }

  return String(value)
}

/**
 * Serialize regionMeta and nodes back to a valid region JS file string.
 * Preserves import lines verbatim.
 * If import lines exist, restores backgroundImage reference using the import variable name.
 */
export function serializeRegionFile(regionMeta, nodes, importLines = []) {
  const parts = []

  // Import lines
  if (importLines.length > 0) {
    parts.push(importLines.join('\n'))
    parts.push('')
  }

  // Build regionMeta with backgroundImage restored if there's a map import
  const metaToSerialize = { ...regionMeta }
  const mapImport = importLines.find(line => line.includes('/assets/maps/'))
  if (mapImport) {
    // Extract variable name: "import varName from '...'" → varName
    const varMatch = mapImport.match(/import\s+(\w+)\s+from/)
    if (varMatch) {
      metaToSerialize.backgroundImage = `__REF__${varMatch[1]}__`
    }
  }

  // Serialize regionMeta
  let metaStr = serializeValue(metaToSerialize, 0)
  // Replace the quoted reference placeholder with bare variable name
  metaStr = metaStr.replace(/'__REF__(\w+)__'/g, '$1')
  parts.push(`export const regionMeta = ${metaStr}`)
  parts.push('')

  // Serialize nodes
  const nodeEntries = Object.entries(nodes)
  if (nodeEntries.length === 0) {
    parts.push('export const nodes = {}')
  } else {
    const innerPad = '  '
    const nodeStrs = nodeEntries.map(([key, node]) => {
      const nodeStr = serializeValue(node, 1)
      return `${innerPad}${key}: ${nodeStr}`
    })
    parts.push(`export const nodes = {\n${nodeStrs.join(',\n')}\n}`)
  }

  parts.push('')

  return parts.join('\n')
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/__tests__/questSerializer.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/questSerializer.js src/utils/__tests__/questSerializer.test.js
git commit -m "feat: add serializeRegionFile for quest serializer"
```

---

### Task 3: Quest Serializer — toCamelCase and index/regions file helpers

Helpers to update `index.js` and `regions.js` when creating/deleting regions.

**Files:**
- Modify: `src/utils/questSerializer.js`
- Modify: `src/utils/__tests__/questSerializer.test.js`

**Step 1: Write failing tests for toCamelCase and file update helpers**

```js
  describe('toCamelCase', () => {
    it('converts snake_case to camelCase', () => {
      expect(toCamelCase('whispering_woods')).toBe('whisperingWoods')
      expect(toCamelCase('the_summit')).toBe('theSummit')
      expect(toCamelCase('coral_castle_halls')).toBe('coralCastleHalls')
      expect(toCamelCase('simple')).toBe('simple')
    })
  })

  describe('addRegionToIndex', () => {
    it('adds import and spread to index.js content', () => {
      const indexContent = `import { nodes as whisperingWoodsNodes } from './whispering_woods.js'

export { regions, superRegions } from './regions.js'
import { regions, superRegions } from './regions.js'

export const questNodes = {
  // Western Veros
  ...whisperingWoodsNodes
}

export function getQuestNode(nodeId) {
  return questNodes[nodeId] || null
}
`
      const result = addRegionToIndex(indexContent, 'new_area', 'western_veros')

      expect(result).toContain("import { nodes as newAreaNodes } from './new_area.js'")
      expect(result).toContain('...newAreaNodes')
    })
  })

  describe('removeRegionFromIndex', () => {
    it('removes import and spread from index.js content', () => {
      const indexContent = `import { nodes as whisperingWoodsNodes } from './whispering_woods.js'
import { nodes as newAreaNodes } from './new_area.js'

export { regions, superRegions } from './regions.js'
import { regions, superRegions } from './regions.js'

export const questNodes = {
  // Western Veros
  ...whisperingWoodsNodes,
  ...newAreaNodes
}

export function getQuestNode(nodeId) {
  return questNodes[nodeId] || null
}
`
      const result = removeRegionFromIndex(indexContent, 'new_area')

      expect(result).not.toContain('newAreaNodes')
      expect(result).toContain('whisperingWoodsNodes')
    })
  })

  describe('addRegionToRegions', () => {
    it('adds import and entry to regions.js content', () => {
      const regionsContent = `import { regionMeta as whisperingWoods } from './whispering_woods.js'

export const superRegions = [
  {
    id: 'western_veros',
    name: 'Western Veros',
    description: 'The familiar lands',
    unlockedByDefault: true
  }
]

export const regions = [
  // Western Veros
  whisperingWoods
]
`
      const result = addRegionToRegions(regionsContent, 'new_area', 'western_veros')

      expect(result).toContain("import { regionMeta as newArea } from './new_area.js'")
      expect(result).toContain('newArea')
    })
  })

  describe('removeRegionFromRegions', () => {
    it('removes import and entry from regions.js content', () => {
      const regionsContent = `import { regionMeta as whisperingWoods } from './whispering_woods.js'
import { regionMeta as newArea } from './new_area.js'

export const superRegions = [
  {
    id: 'western_veros',
    name: 'Western Veros',
    description: 'The familiar lands',
    unlockedByDefault: true
  }
]

export const regions = [
  // Western Veros
  whisperingWoods,
  newArea
]
`
      const result = removeRegionFromRegions(regionsContent, 'new_area')

      expect(result).not.toContain('newArea')
      expect(result).toContain('whisperingWoods')
    })
  })
```

Update import at top:
```js
import { parseRegionFile, serializeRegionFile, toCamelCase, addRegionToIndex, removeRegionFromIndex, addRegionToRegions, removeRegionFromRegions } from '../questSerializer.js'
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/__tests__/questSerializer.test.js`
Expected: FAIL — functions not exported

**Step 3: Write implementation**

Add to `src/utils/questSerializer.js`:

```js
/**
 * Add a region's import and spread to index.js file content.
 * Inserts import line before the regions.js imports.
 * Inserts spread into the questNodes object.
 */
export function addRegionToIndex(content, regionId, superRegion) {
  const varName = toCamelCase(regionId) + 'Nodes'
  const importLine = `import { nodes as ${varName} } from './${regionId}.js'`

  // Add import before the regions.js import line
  const regionsImportIndex = content.indexOf("export { regions, superRegions }")
  const insertedImport = content.slice(0, regionsImportIndex) + importLine + '\n' + content.slice(regionsImportIndex)

  // Add spread to questNodes object — insert before closing brace
  const closingBrace = insertedImport.lastIndexOf('}', insertedImport.indexOf('export function'))
  // Find the last spread line before the closing brace
  const beforeClose = insertedImport.slice(0, closingBrace)
  const lastSpreadIndex = beforeClose.lastIndexOf('...')
  const lineEnd = insertedImport.indexOf('\n', lastSpreadIndex)

  // Check if last line has a comma — if not, add one
  const lastLine = insertedImport.slice(lastSpreadIndex, lineEnd).trim()
  const needsComma = !lastLine.endsWith(',')
  const commaFix = needsComma ? insertedImport.slice(0, lineEnd) + ',' + insertedImport.slice(lineEnd) : insertedImport
  const updatedLineEnd = needsComma ? lineEnd + 1 : lineEnd

  const spreadLine = `  ...${varName}`
  const result = commaFix.slice(0, updatedLineEnd + 1) + spreadLine + '\n' + commaFix.slice(updatedLineEnd + 1)

  return result
}

/**
 * Remove a region's import and spread from index.js file content.
 */
export function removeRegionFromIndex(content, regionId) {
  const varName = toCamelCase(regionId) + 'Nodes'

  // Remove the import line
  let result = content.replace(new RegExp(`import \\{ nodes as ${varName} \\} from '\\.\\/${regionId}\\.js'\\n?`), '')

  // Remove the spread line (with optional trailing comma and whitespace)
  result = result.replace(new RegExp(`\\s*\\.\\.\\.${varName},?\\n?`), '\n')

  // Clean up any doubled blank lines
  result = result.replace(/\n{3,}/g, '\n\n')

  return result
}

/**
 * Add a region's import and entry to regions.js file content.
 */
export function addRegionToRegions(content, regionId, superRegion) {
  const varName = toCamelCase(regionId)
  const importLine = `import { regionMeta as ${varName} } from './${regionId}.js'`

  // Add import before the first blank line (before superRegions export)
  const firstBlankLine = content.indexOf('\n\n')
  const insertedImport = content.slice(0, firstBlankLine) + '\n' + importLine + content.slice(firstBlankLine)

  // Add entry to the regions array — find the closing bracket
  // Find the last entry before the closing bracket of the regions array
  const regionsArrayMatch = insertedImport.match(/export const regions = \[/)
  if (!regionsArrayMatch) return insertedImport

  // Find the last ] that closes the regions array
  const regionsStart = regionsArrayMatch.index + regionsArrayMatch[0].length
  let bracketCount = 1
  let regionsEnd = regionsStart
  for (let i = regionsStart; i < insertedImport.length; i++) {
    if (insertedImport[i] === '[') bracketCount++
    else if (insertedImport[i] === ']') {
      bracketCount--
      if (bracketCount === 0) {
        regionsEnd = i
        break
      }
    }
  }

  // Insert before the closing bracket
  const beforeClose = insertedImport.slice(0, regionsEnd).trimEnd()
  const needsComma = !beforeClose.endsWith(',')
  const result = beforeClose + (needsComma ? ',' : '') + `\n  ${varName}\n` + insertedImport.slice(regionsEnd)

  return result
}

/**
 * Remove a region's import and entry from regions.js file content.
 */
export function removeRegionFromRegions(content, regionId) {
  const varName = toCamelCase(regionId)

  // Remove the import line
  let result = content.replace(new RegExp(`import \\{ regionMeta as ${varName} \\} from '\\.\\/${regionId}\\.js'\\n?`), '')

  // Remove the entry from the regions array (with optional trailing comma)
  result = result.replace(new RegExp(`\\s*${varName},?\\n?`), '\n')

  // Clean up doubled blank lines
  result = result.replace(/\n{3,}/g, '\n\n')

  return result
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/__tests__/questSerializer.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/questSerializer.js src/utils/__tests__/questSerializer.test.js
git commit -m "feat: add index/regions file helpers to quest serializer"
```

---

### Task 4: Vite Plugin — GET quest-regions endpoint

**Files:**
- Modify: `vite-plugin-admin.js`

**Step 1: Add the GET endpoint**

Add inside `configureServer(server)`, after the existing `invalidateQuestModules` function (after line 118). This endpoint reads all region files and returns their parsed data.

```js
      // Helper: find quest region file by regionId
      function findQuestRegionFile(regionId) {
        const questsDir = path.resolve(process.cwd(), 'src/data/quests')
        const filePath = path.join(questsDir, `${regionId}.js`)
        return fs.existsSync(filePath) ? filePath : null
      }

      // Helper: get all quest region files (exclude index.js, regions.js)
      function getQuestRegionFiles() {
        const questsDir = path.resolve(process.cwd(), 'src/data/quests')
        return fs.readdirSync(questsDir)
          .filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'regions.js')
          .map(f => ({
            regionId: f.replace('.js', ''),
            filePath: path.join(questsDir, f)
          }))
      }

      // Helper: parse a region file using quest serializer approach
      function parseQuestRegionFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')

        // Extract import lines
        const importLines = content.split('\n').filter(line => line.startsWith('import '))

        // Parse regionMeta
        const metaMatch = content.match(/export\s+const\s+regionMeta\s*=\s*\{/)
        if (!metaMatch) return null

        const metaStart = content.indexOf('{', metaMatch.index)
        let braceCount = 0
        let metaEnd = metaStart
        for (let i = metaStart; i < content.length; i++) {
          if (content[i] === '{') braceCount++
          else if (content[i] === '}') {
            braceCount--
            if (braceCount === 0) { metaEnd = i; break }
          }
        }
        const metaStr = content.slice(metaStart, metaEnd + 1)
        const regionMeta = new Function(`return ${metaStr}`)()
        delete regionMeta.backgroundImage

        // Parse nodes
        const nodesMatch = content.match(/export\s+const\s+nodes\s*=\s*\{/)
        let nodes = {}
        if (nodesMatch) {
          const nodesStart = content.indexOf('{', nodesMatch.index)
          braceCount = 0
          let nodesEnd = nodesStart
          for (let i = nodesStart; i < content.length; i++) {
            if (content[i] === '{') braceCount++
            else if (content[i] === '}') {
              braceCount--
              if (braceCount === 0) { nodesEnd = i; break }
            }
          }
          const nodesStr = content.slice(nodesStart, nodesEnd + 1)
          nodes = new Function(`return ${nodesStr}`)()
        }

        return { regionMeta, nodes, importLines }
      }

      // GET /__admin/quest-regions — fetch all regions with their nodes
      server.middlewares.use((req, res, next) => {
        if (req.method === 'GET' && req.url === '/__admin/quest-regions') {
          try {
            const regionFiles = getQuestRegionFiles()
            const regions = []

            for (const { regionId, filePath } of regionFiles) {
              const parsed = parseQuestRegionFile(filePath)
              if (parsed) {
                regions.push({
                  regionId,
                  regionMeta: parsed.regionMeta,
                  nodes: parsed.nodes,
                  importLines: parsed.importLines
                })
              }
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(regions))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })
```

**Step 2: Manual test**

Run: `npx vite dev` then `curl http://localhost:5173/__admin/quest-regions | head -c 500`
Expected: JSON array of regions with regionMeta and nodes

**Step 3: Commit**

```bash
git add vite-plugin-admin.js
git commit -m "feat: add GET /__admin/quest-regions endpoint"
```

---

### Task 5: Vite Plugin — Region CRUD endpoints (POST, PUT, DELETE)

**Files:**
- Modify: `vite-plugin-admin.js`

**Step 1: Add region CRUD endpoints**

Add after the GET endpoint. Import the serializer helpers at the top of the function (or inline them). Since the vite plugin is a Node ES module and the serializer is also ESM, we can use dynamic import.

```js
      // POST /__admin/quest-regions — create a new region
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/__admin/quest-regions') {
          let body = ''
          for await (const chunk of req) body += chunk

          try {
            const { regionMeta } = JSON.parse(body)
            if (!regionMeta || !regionMeta.id) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'regionMeta with id is required' }))
              return
            }

            const questsDir = path.resolve(process.cwd(), 'src/data/quests')
            const filePath = path.join(questsDir, `${regionMeta.id}.js`)

            if (fs.existsSync(filePath)) {
              res.statusCode = 409
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region file ${regionMeta.id}.js already exists` }))
              return
            }

            // Import serializer dynamically
            const { serializeRegionFile, toCamelCase, addRegionToIndex, addRegionToRegions } = await import('./src/utils/questSerializer.js')

            // Create region file
            const fileContent = serializeRegionFile(regionMeta, {}, [])
            fs.writeFileSync(filePath, fileContent, 'utf-8')

            // Update index.js
            const indexPath = path.join(questsDir, 'index.js')
            const indexContent = fs.readFileSync(indexPath, 'utf-8')
            const updatedIndex = addRegionToIndex(indexContent, regionMeta.id, regionMeta.superRegion)
            fs.writeFileSync(indexPath, updatedIndex, 'utf-8')

            // Update regions.js
            const regionsPath = path.join(questsDir, 'regions.js')
            const regionsContent = fs.readFileSync(regionsPath, 'utf-8')
            const updatedRegions = addRegionToRegions(regionsContent, regionMeta.id, regionMeta.superRegion)
            fs.writeFileSync(regionsPath, updatedRegions, 'utf-8')

            invalidateQuestModules()

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, regionId: regionMeta.id }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // PUT /__admin/quest-regions/:regionId — update region metadata
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/__admin\/quest-regions\/([^/]+)$/)
        if (req.method === 'PUT' && match) {
          const regionId = decodeURIComponent(match[1])
          let body = ''
          for await (const chunk of req) body += chunk

          try {
            const { regionMeta } = JSON.parse(body)
            const filePath = findQuestRegionFile(regionId)
            if (!filePath) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region ${regionId} not found` }))
              return
            }

            const { serializeRegionFile } = await import('./src/utils/questSerializer.js')
            const parsed = parseQuestRegionFile(filePath)

            const fileContent = serializeRegionFile(regionMeta, parsed.nodes, parsed.importLines)
            fs.writeFileSync(filePath, fileContent, 'utf-8')

            invalidateQuestModules()

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

      // DELETE /__admin/quest-regions/:regionId — delete region and clean up imports
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/__admin\/quest-regions\/([^/]+)$/)
        if (req.method === 'DELETE' && match) {
          const regionId = decodeURIComponent(match[1])

          try {
            const questsDir = path.resolve(process.cwd(), 'src/data/quests')
            const filePath = path.join(questsDir, `${regionId}.js`)

            if (!fs.existsSync(filePath)) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region ${regionId} not found` }))
              return
            }

            const { removeRegionFromIndex, removeRegionFromRegions } = await import('./src/utils/questSerializer.js')

            // Remove from index.js
            const indexPath = path.join(questsDir, 'index.js')
            const indexContent = fs.readFileSync(indexPath, 'utf-8')
            fs.writeFileSync(indexPath, removeRegionFromIndex(indexContent, regionId), 'utf-8')

            // Remove from regions.js
            const regionsPath = path.join(questsDir, 'regions.js')
            const regionsContent = fs.readFileSync(regionsPath, 'utf-8')
            fs.writeFileSync(regionsPath, removeRegionFromRegions(regionsContent, regionId), 'utf-8')

            // Delete the region file
            fs.unlinkSync(filePath)

            invalidateQuestModules()

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
```

**Step 2: Manual test**

Start dev server. Test with curl:
- `curl -X POST http://localhost:5173/__admin/quest-regions -H 'Content-Type: application/json' -d '{"regionMeta":{"id":"test_zone","name":"Test Zone","superRegion":"western_veros","startNode":"tz_01","width":600,"height":500,"backgroundColor":"#1a1a2f"}}'`
- Verify `src/data/quests/test_zone.js` was created
- Verify `index.js` and `regions.js` were updated
- `curl -X DELETE http://localhost:5173/__admin/quest-regions/test_zone`
- Verify cleanup

**Step 3: Commit**

```bash
git add vite-plugin-admin.js
git commit -m "feat: add region CRUD endpoints to admin plugin"
```

---

### Task 6: Vite Plugin — Node CRUD endpoints (POST, PUT, DELETE)

**Files:**
- Modify: `vite-plugin-admin.js`

**Step 1: Add node CRUD endpoints**

```js
      // POST /__admin/quest-regions/:regionId/nodes — add node to region
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/__admin\/quest-regions\/([^/]+)\/nodes$/)
        if (req.method === 'POST' && match) {
          const regionId = decodeURIComponent(match[1])
          let body = ''
          for await (const chunk of req) body += chunk

          try {
            const node = JSON.parse(body)
            if (!node.id) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Node must have an id' }))
              return
            }

            const filePath = findQuestRegionFile(regionId)
            if (!filePath) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region ${regionId} not found` }))
              return
            }

            const { serializeRegionFile } = await import('./src/utils/questSerializer.js')
            const parsed = parseQuestRegionFile(filePath)

            if (parsed.nodes[node.id]) {
              res.statusCode = 409
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Node ${node.id} already exists` }))
              return
            }

            parsed.nodes[node.id] = node
            const fileContent = serializeRegionFile(parsed.regionMeta, parsed.nodes, parsed.importLines)
            fs.writeFileSync(filePath, fileContent, 'utf-8')

            invalidateQuestModules()

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

      // PUT /__admin/quest-regions/:regionId/nodes/:nodeId — update node
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/__admin\/quest-regions\/([^/]+)\/nodes\/([^/]+)$/)
        if (req.method === 'PUT' && match) {
          const regionId = decodeURIComponent(match[1])
          const nodeId = decodeURIComponent(match[2])
          let body = ''
          for await (const chunk of req) body += chunk

          try {
            const node = JSON.parse(body)
            const filePath = findQuestRegionFile(regionId)
            if (!filePath) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region ${regionId} not found` }))
              return
            }

            const { serializeRegionFile } = await import('./src/utils/questSerializer.js')
            const parsed = parseQuestRegionFile(filePath)

            if (!parsed.nodes[nodeId]) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Node ${nodeId} not found in region ${regionId}` }))
              return
            }

            // Handle ID change
            if (node.id !== nodeId) {
              delete parsed.nodes[nodeId]
            }
            parsed.nodes[node.id] = node

            const fileContent = serializeRegionFile(parsed.regionMeta, parsed.nodes, parsed.importLines)
            fs.writeFileSync(filePath, fileContent, 'utf-8')

            invalidateQuestModules()

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

      // DELETE /__admin/quest-regions/:regionId/nodes/:nodeId — delete node
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/__admin\/quest-regions\/([^/]+)\/nodes\/([^/]+)$/)
        if (req.method === 'DELETE' && match) {
          const regionId = decodeURIComponent(match[1])
          const nodeId = decodeURIComponent(match[2])

          try {
            const filePath = findQuestRegionFile(regionId)
            if (!filePath) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region ${regionId} not found` }))
              return
            }

            const { serializeRegionFile } = await import('./src/utils/questSerializer.js')
            const parsed = parseQuestRegionFile(filePath)

            if (!parsed.nodes[nodeId]) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Node ${nodeId} not found` }))
              return
            }

            delete parsed.nodes[nodeId]

            const fileContent = serializeRegionFile(parsed.regionMeta, parsed.nodes, parsed.importLines)
            fs.writeFileSync(filePath, fileContent, 'utf-8')

            invalidateQuestModules()

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
```

**Step 2: Manual test with curl**

**Step 3: Commit**

```bash
git add vite-plugin-admin.js
git commit -m "feat: add node CRUD endpoints to admin plugin"
```

---

### Task 7: SearchableDropdown component

Reusable dropdown with search/filter for selecting from large lists. Used for enemies, items, and connections.

**Files:**
- Create: `src/components/admin/SearchableDropdown.vue`

**Step 1: Build the component**

```vue
<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  options: { type: Array, required: true },
  // Each option: { id: string, label: string, sublabel?: string }
  placeholder: { type: String, default: 'Search...' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['select'])

const searchQuery = ref('')
const isOpen = ref(false)
const dropdownRef = ref(null)

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options.slice(0, 50)
  const q = searchQuery.value.toLowerCase()
  return props.options
    .filter(o => o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
    .slice(0, 50)
})

function selectOption(option) {
  emit('select', option)
  searchQuery.value = ''
  isOpen.value = false
}

function handleFocus() {
  isOpen.value = true
}

function handleBlur() {
  // Delay to allow click on option
  setTimeout(() => { isOpen.value = false }, 200)
}
</script>

<template>
  <div class="searchable-dropdown" ref="dropdownRef">
    <input
      v-model="searchQuery"
      :placeholder="placeholder"
      :disabled="disabled"
      class="search-input"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <div v-if="isOpen && filteredOptions.length > 0" class="dropdown-list">
      <div
        v-for="option in filteredOptions"
        :key="option.id"
        class="dropdown-option"
        @mousedown.prevent="selectOption(option)"
      >
        <span class="option-label">{{ option.label }}</span>
        <span v-if="option.sublabel" class="option-sublabel">{{ option.sublabel }}</span>
      </div>
    </div>
    <div v-else-if="isOpen && searchQuery && filteredOptions.length === 0" class="dropdown-list">
      <div class="dropdown-empty">No matches</div>
    </div>
  </div>
</template>

<style scoped>
.searchable-dropdown {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 0.85rem;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 4px;
  margin-top: 2px;
  z-index: 100;
}

.dropdown-option {
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-option:hover {
  background: #374151;
}

.option-label {
  font-size: 0.85rem;
  color: #f3f4f6;
}

.option-sublabel {
  font-size: 0.7rem;
  color: #6b7280;
  font-family: monospace;
}

.dropdown-empty {
  padding: 8px 10px;
  font-size: 0.8rem;
  color: #6b7280;
  text-align: center;
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/admin/SearchableDropdown.vue
git commit -m "feat: add SearchableDropdown component for admin editors"
```

---

### Task 8: QuestNodeEditor — Shell component with region list

Replace QuestNodeList with the new two-panel editor.

**Files:**
- Create: `src/screens/admin/QuestNodeEditor.vue`
- Modify: `src/screens/AdminScreen.vue` (lines 9, 110)

**Step 1: Build the shell component with region list**

```vue
<!-- src/screens/admin/QuestNodeEditor.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuestsStore } from '../../stores/quests.js'
import { getNodesByRegion } from '../../data/quests/index.js'

const questsStore = useQuestsStore()

// State
const allRegions = ref([])
const selectedRegionId = ref(null)
const editingNodeId = ref(null)
const loading = ref(false)
const error = ref(null)
const showRegionMeta = ref(true)
const showCreateRegion = ref(false)
const showDeleteConfirm = ref(false)
const deleteTarget = ref(null) // { type: 'region'|'node', id, name }

// Fetch all regions from API
async function fetchRegions() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('/__admin/quest-regions')
    if (!res.ok) throw new Error(await res.text())
    allRegions.value = await res.json()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchRegions)

// Computed
const superRegionGroups = computed(() => {
  const groups = { western_veros: [], aquarias: [] }
  for (const region of allRegions.value) {
    const sr = region.regionMeta.superRegion || 'western_veros'
    if (!groups[sr]) groups[sr] = []
    groups[sr].push(region)
  }
  return groups
})

const selectedRegion = computed(() =>
  allRegions.value.find(r => r.regionId === selectedRegionId.value) || null
)

const selectedRegionNodes = computed(() => {
  if (!selectedRegion.value) return []
  return Object.values(selectedRegion.value.nodes).map(node => ({
    ...node,
    type: node.type || 'battle',
    unlocked: questsStore.unlockedNodes.includes(node.id),
    completed: questsStore.completedNodes.includes(node.id)
  }))
})

// Actions
function selectRegion(regionId) {
  selectedRegionId.value = regionId
  editingNodeId.value = null
}

function editNode(nodeId) {
  editingNodeId.value = nodeId
}

function backToNodeList() {
  editingNodeId.value = null
}

// Unlock/lock (preserved from QuestNodeList)
function toggleUnlock(nodeId, currentlyUnlocked) {
  if (currentlyUnlocked) {
    const idx = questsStore.unlockedNodes.indexOf(nodeId)
    if (idx !== -1) questsStore.unlockedNodes.splice(idx, 1)
    const compIdx = questsStore.completedNodes.indexOf(nodeId)
    if (compIdx !== -1) questsStore.completedNodes.splice(compIdx, 1)
  } else {
    questsStore.unlockedNodes.push(nodeId)
  }
}

function unlockAllInRegion() {
  if (!selectedRegion.value) return
  const nodes = Object.values(selectedRegion.value.nodes)
  for (const node of nodes) {
    if (!questsStore.unlockedNodes.includes(node.id)) {
      questsStore.unlockedNodes.push(node.id)
    }
  }
}

function lockAllInRegion() {
  if (!selectedRegion.value) return
  const nodeIds = new Set(Object.keys(selectedRegion.value.nodes))
  questsStore.unlockedNodes = questsStore.unlockedNodes.filter(id => !nodeIds.has(id))
  questsStore.completedNodes = questsStore.completedNodes.filter(id => !nodeIds.has(id))
}

// Delete confirmation
function confirmDelete(type, id, name) {
  deleteTarget.value = { type, id, name }
  showDeleteConfirm.value = true
}

function cancelDelete() {
  showDeleteConfirm.value = false
  deleteTarget.value = null
}

async function executeDelete() {
  if (!deleteTarget.value) return
  const { type, id } = deleteTarget.value

  try {
    let url
    if (type === 'region') {
      url = `/__admin/quest-regions/${id}`
    } else {
      url = `/__admin/quest-regions/${selectedRegionId.value}/nodes/${id}`
    }

    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())

    if (type === 'region' && selectedRegionId.value === id) {
      selectedRegionId.value = null
    }
    if (type === 'node' && editingNodeId.value === id) {
      editingNodeId.value = null
    }

    await fetchRegions()
  } catch (e) {
    error.value = e.message
  } finally {
    showDeleteConfirm.value = false
    deleteTarget.value = null
  }
}

// Expose for child components
function onRegionSaved() {
  fetchRegions()
}

function onNodeSaved() {
  fetchRegions()
}
</script>

<template>
  <div class="quest-editor">
    <!-- Left Panel: Region List -->
    <aside class="region-list-panel">
      <div class="panel-header">
        <span class="panel-title">Regions</span>
        <button class="create-btn" @click="showCreateRegion = true">+ New</button>
      </div>

      <div v-if="loading" class="loading">Loading...</div>

      <div v-for="(regions, superRegionId) in superRegionGroups" :key="superRegionId" class="super-region-group">
        <div class="super-region-label">{{ superRegionId === 'western_veros' ? 'Western Veros' : 'Aquarias' }}</div>
        <button
          v-for="region in regions"
          :key="region.regionId"
          :class="['region-item', { active: selectedRegionId === region.regionId }]"
          @click="selectRegion(region.regionId)"
        >
          <span class="region-item-name">{{ region.regionMeta.name }}</span>
          <span class="region-item-count">{{ Object.keys(region.nodes).length }}</span>
        </button>
      </div>
    </aside>

    <!-- Right Panel: Region Detail + Nodes -->
    <main class="detail-panel">
      <template v-if="!selectedRegion && !showCreateRegion">
        <div class="empty-state">Select a region or create a new one</div>
      </template>

      <!-- Region metadata editor (collapsible) — Task 9 will add form here -->
      <template v-if="selectedRegion && !editingNodeId">
        <div class="region-meta-section">
          <div class="section-header" @click="showRegionMeta = !showRegionMeta">
            <span>Region: {{ selectedRegion.regionMeta.name }}</span>
            <span class="collapse-icon">{{ showRegionMeta ? '▼' : '▶' }}</span>
          </div>
          <div v-if="showRegionMeta" class="section-body">
            <!-- Region form will be inserted by Task 9 -->
            <p class="placeholder-text">Region metadata form (Task 9)</p>
          </div>
          <div class="region-actions-bar">
            <button class="action-btn danger" @click="confirmDelete('region', selectedRegion.regionId, selectedRegion.regionMeta.name)">Delete Region</button>
          </div>
        </div>

        <!-- Node List -->
        <div class="node-list-section">
          <div class="section-header">
            <span>Nodes ({{ selectedRegionNodes.length }})</span>
            <div class="node-list-actions">
              <button class="small-btn" @click="unlockAllInRegion">Unlock All</button>
              <button class="small-btn muted" @click="lockAllInRegion">Lock All</button>
              <!-- Add Node button — Task 10 will implement -->
            </div>
          </div>
          <div class="node-rows">
            <div
              v-for="node in selectedRegionNodes"
              :key="node.id"
              :class="['node-row', { unlocked: node.unlocked, completed: node.completed }]"
            >
              <div class="node-info" @click="editNode(node.id)">
                <span class="node-name">{{ node.name }}</span>
                <span class="node-id">{{ node.id }}</span>
                <span v-if="node.type !== 'battle'" class="node-type-badge">{{ node.type }}</span>
              </div>
              <div class="node-actions">
                <span v-if="node.completed" class="status-badge completed-badge">Done</span>
                <button
                  :class="['toggle-btn', node.unlocked ? 'is-unlocked' : 'is-locked']"
                  @click.stop="toggleUnlock(node.id, node.unlocked)"
                >
                  {{ node.unlocked ? 'Lock' : 'Unlock' }}
                </button>
                <button class="edit-btn" @click.stop="editNode(node.id)">Edit</button>
                <button class="delete-node-btn" @click.stop="confirmDelete('node', node.id, node.name)">✕</button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Node Editor — Task 10 will build this -->
      <template v-if="editingNodeId">
        <div class="node-editor-header">
          <button class="back-btn" @click="backToNodeList">← Back</button>
          <span>Editing: {{ editingNodeId }}</span>
        </div>
        <p class="placeholder-text">Node editor form (Task 10)</p>
      </template>
    </main>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteConfirm" class="confirm-overlay" @click.self="cancelDelete">
      <div class="confirm-dialog">
        <p class="confirm-message">
          Delete {{ deleteTarget?.type }} <strong>{{ deleteTarget?.name }}</strong>?
          <template v-if="deleteTarget?.type === 'region'">
            <br /><span class="confirm-warning">This will delete the region file and all its nodes.</span>
          </template>
        </p>
        <div class="confirm-actions">
          <button class="confirm-cancel" @click="cancelDelete">Cancel</button>
          <button class="confirm-delete" @click="executeDelete">Delete</button>
        </div>
      </div>
    </div>

    <!-- Error display -->
    <div v-if="error" class="error-banner" @click="error = null">{{ error }}</div>
  </div>
</template>

<style scoped>
.quest-editor {
  display: flex;
  height: calc(100vh - 80px);
  gap: 0;
}

.region-list-panel {
  width: 240px;
  background: #1f2937;
  border-right: 1px solid #374151;
  overflow-y: auto;
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #374151;
  background: #111827;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f3f4f6;
}

.create-btn {
  padding: 3px 10px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.create-btn:hover {
  background: #2563eb;
}

.super-region-group {
  padding: 4px 0;
}

.super-region-label {
  padding: 8px 14px 4px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.region-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 0.8rem;
  cursor: pointer;
  text-align: left;
}

.region-item:hover {
  background: #374151;
  color: #f3f4f6;
}

.region-item.active {
  background: #3b82f6;
  color: white;
}

.region-item-count {
  font-size: 0.7rem;
  opacity: 0.6;
}

.detail-panel {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
  font-size: 0.9rem;
}

.region-meta-section {
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #111827;
  cursor: pointer;
  font-size: 0.9rem;
  color: #f3f4f6;
  font-weight: 600;
  user-select: none;
}

.collapse-icon {
  font-size: 0.7rem;
  color: #6b7280;
}

.section-body {
  padding: 16px;
}

.region-actions-bar {
  padding: 8px 16px;
  border-top: 1px solid #374151;
  display: flex;
  justify-content: flex-end;
}

.action-btn.danger {
  padding: 4px 12px;
  background: #7f1d1d;
  border: none;
  border-radius: 4px;
  color: #fca5a5;
  font-size: 0.75rem;
  cursor: pointer;
}

.action-btn.danger:hover {
  background: #991b1b;
}

.node-list-section {
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.node-list-actions {
  display: flex;
  gap: 6px;
}

.small-btn {
  padding: 3px 10px;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  background: #22c55e;
  color: #111827;
}

.small-btn:hover {
  background: #16a34a;
}

.small-btn.muted {
  background: #374151;
  color: #9ca3af;
}

.small-btn.muted:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.node-rows {
  display: flex;
  flex-direction: column;
}

.node-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #1a2332;
}

.node-row:last-child {
  border-bottom: none;
}

.node-row.unlocked {
  background: rgba(34, 197, 94, 0.04);
}

.node-row.completed {
  background: rgba(59, 130, 246, 0.04);
}

.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.node-info:hover .node-name {
  color: #f3f4f6;
}

.node-name {
  font-size: 0.85rem;
  color: #d1d5db;
}

.node-id {
  font-size: 0.7rem;
  color: #4b5563;
  font-family: monospace;
}

.node-type-badge {
  font-size: 0.65rem;
  padding: 1px 6px;
  background: #374151;
  border-radius: 3px;
  color: #9ca3af;
  text-transform: uppercase;
}

.node-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.status-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
}

.completed-badge {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.toggle-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
}

.is-locked { background: #22c55e; color: #111827; }
.is-locked:hover { background: #16a34a; }
.is-unlocked { background: #374151; color: #9ca3af; }
.is-unlocked:hover { background: #4b5563; color: #f3f4f6; }

.edit-btn {
  padding: 4px 10px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 0.7rem;
  cursor: pointer;
}

.edit-btn:hover {
  background: #3b82f6;
  color: white;
}

.delete-node-btn {
  padding: 2px 6px;
  background: transparent;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #6b7280;
  font-size: 0.7rem;
  cursor: pointer;
}

.delete-node-btn:hover {
  background: #7f1d1d;
  border-color: #991b1b;
  color: #fca5a5;
}

.node-editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #f3f4f6;
}

.back-btn {
  padding: 4px 10px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 0.8rem;
  cursor: pointer;
}

.back-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.placeholder-text {
  color: #6b7280;
  font-size: 0.85rem;
  padding: 16px;
}

/* Delete confirmation dialog */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 20px;
  max-width: 400px;
  width: 90%;
}

.confirm-message {
  color: #f3f4f6;
  font-size: 0.9rem;
  margin: 0 0 16px 0;
}

.confirm-warning {
  color: #fca5a5;
  font-size: 0.8rem;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirm-cancel {
  padding: 6px 16px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
}

.confirm-delete {
  padding: 6px 16px;
  background: #dc2626;
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.confirm-delete:hover {
  background: #b91c1c;
}

.error-banner {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #7f1d1d;
  color: #fca5a5;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  z-index: 1000;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #6b7280;
}
</style>
```

**Step 2: Update AdminScreen.vue**

In `AdminScreen.vue`:
- Line 9: change `import QuestNodeList from './admin/QuestNodeList.vue'` to `import QuestNodeEditor from './admin/QuestNodeEditor.vue'`
- Line 110: change `<QuestNodeList v-else-if="activeSection === 'quest-nodes'" />` to `<QuestNodeEditor v-else-if="activeSection === 'quest-nodes'" />`

**Step 3: Manual test**

Open admin (Ctrl+Shift+A), go to Quest Nodes. Verify:
- Region list loads in left panel
- Clicking a region shows node list
- Unlock/lock buttons work
- Delete confirmation dialog appears

**Step 4: Commit**

```bash
git add src/screens/admin/QuestNodeEditor.vue src/screens/AdminScreen.vue
git commit -m "feat: add QuestNodeEditor shell with region list and node list"
```

---

### Task 9: QuestNodeEditor — Region metadata form

Add the collapsible region metadata editing form.

**Files:**
- Modify: `src/screens/admin/QuestNodeEditor.vue`

**Step 1: Add region form state and save function**

In the `<script setup>`, add:

```js
// Region form state
const regionForm = ref({})

// Watch selectedRegion to populate form
watch(selectedRegion, (region) => {
  if (region) {
    regionForm.value = { ...region.regionMeta }
  }
}, { immediate: true })

// Also import watch
// At top: import { ref, computed, onMounted, watch } from 'vue'

async function saveRegionMeta() {
  if (!selectedRegion.value) return
  try {
    const res = await fetch(`/__admin/quest-regions/${selectedRegion.value.regionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regionMeta: regionForm.value })
    })
    if (!res.ok) throw new Error(await res.text())
    await fetchRegions()
  } catch (e) {
    error.value = e.message
  }
}

// Create region
const newRegionForm = ref({
  id: '', name: '', description: '', superRegion: 'western_veros',
  startNode: '', width: 600, height: 1000, backgroundColor: '#1f2937'
})

async function createRegion() {
  try {
    const res = await fetch('/__admin/quest-regions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regionMeta: newRegionForm.value })
    })
    if (!res.ok) throw new Error(await res.text())
    await fetchRegions()
    selectedRegionId.value = newRegionForm.value.id
    showCreateRegion.value = false
    newRegionForm.value = {
      id: '', name: '', description: '', superRegion: 'western_veros',
      startNode: '', width: 600, height: 1000, backgroundColor: '#1f2937'
    }
  } catch (e) {
    error.value = e.message
  }
}
```

**Step 2: Replace the placeholder in the region meta section body**

Replace `<p class="placeholder-text">Region metadata form (Task 9)</p>` with:

```html
        <div class="form-grid">
          <label class="form-field">
            <span class="field-label">ID</span>
            <input v-model="regionForm.id" class="field-input" />
          </label>
          <label class="form-field">
            <span class="field-label">Name</span>
            <input v-model="regionForm.name" class="field-input" />
          </label>
          <label class="form-field full-width">
            <span class="field-label">Description</span>
            <textarea v-model="regionForm.description" class="field-textarea" rows="2" />
          </label>
          <label class="form-field">
            <span class="field-label">Super Region</span>
            <select v-model="regionForm.superRegion" class="field-select">
              <option value="western_veros">Western Veros</option>
              <option value="aquarias">Aquarias</option>
            </select>
          </label>
          <label class="form-field">
            <span class="field-label">Start Node</span>
            <select v-model="regionForm.startNode" class="field-select">
              <option v-for="node in selectedRegionNodes" :key="node.id" :value="node.id">{{ node.name }} ({{ node.id }})</option>
            </select>
          </label>
          <label class="form-field">
            <span class="field-label">Width</span>
            <input v-model.number="regionForm.width" type="number" class="field-input" />
          </label>
          <label class="form-field">
            <span class="field-label">Height</span>
            <input v-model.number="regionForm.height" type="number" class="field-input" />
          </label>
          <label class="form-field">
            <span class="field-label">Background Color</span>
            <div class="color-field">
              <input v-model="regionForm.backgroundColor" type="color" class="field-color" />
              <input v-model="regionForm.backgroundColor" class="field-input color-text" />
            </div>
          </label>
        </div>
        <div class="form-actions">
          <button class="save-btn" @click="saveRegionMeta">Save Region</button>
        </div>
```

Also add a create region form template (shown when `showCreateRegion` is true), using the same form pattern but with `newRegionForm` and `createRegion()`.

**Step 3: Add form styles**

```css
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.field-input, .field-textarea, .field-select {
  padding: 6px 10px;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 0.85rem;
}

.field-input:focus, .field-textarea:focus, .field-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.field-textarea {
  resize: vertical;
  font-family: inherit;
}

.field-select {
  cursor: pointer;
}

.color-field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.field-color {
  width: 36px;
  height: 30px;
  border: 1px solid #374151;
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
}

.color-text {
  flex: 1;
}

.form-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  padding: 6px 20px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.save-btn:hover {
  background: #2563eb;
}
```

**Step 4: Manual test**

Edit a region's metadata, save, verify file is updated.

**Step 5: Commit**

```bash
git add src/screens/admin/QuestNodeEditor.vue
git commit -m "feat: add region metadata form to quest editor"
```

---

### Task 10: QuestNodeEditor — Node editor form

Build the full node editing form with all field types.

**Files:**
- Modify: `src/screens/admin/QuestNodeEditor.vue`

**Step 1: Add node form state and save logic**

In `<script setup>`, add:

```js
import SearchableDropdown from '../../components/admin/SearchableDropdown.vue'

// Node form state
const nodeForm = ref({})

// Populate form when editing node
watch(editingNodeId, (nodeId) => {
  if (nodeId && selectedRegion.value) {
    nodeForm.value = JSON.parse(JSON.stringify(selectedRegion.value.nodes[nodeId]))
  }
})

// Save node
async function saveNode() {
  if (!selectedRegion.value || !editingNodeId.value) return
  try {
    const res = await fetch(
      `/__admin/quest-regions/${selectedRegion.value.regionId}/nodes/${editingNodeId.value}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeForm.value)
      }
    )
    if (!res.ok) throw new Error(await res.text())
    // Update editingNodeId if ID changed
    if (nodeForm.value.id !== editingNodeId.value) {
      editingNodeId.value = nodeForm.value.id
    }
    await fetchRegions()
  } catch (e) {
    error.value = e.message
  }
}

// Create node
async function createNode() {
  if (!selectedRegion.value) return
  const nodeId = `${selectedRegion.value.regionId.split('_')[0]}_${String(Object.keys(selectedRegion.value.nodes).length + 1).padStart(2, '0')}`
  const newNode = {
    id: nodeId,
    name: 'New Node',
    region: selectedRegion.value.regionMeta.name,
    x: 100,
    y: 100,
    battles: [{ enemies: [] }],
    connections: [],
    rewards: { gems: 0, gold: 0, exp: 0 }
  }
  try {
    const res = await fetch(
      `/__admin/quest-regions/${selectedRegion.value.regionId}/nodes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNode)
      }
    )
    if (!res.ok) throw new Error(await res.text())
    await fetchRegions()
    editingNodeId.value = nodeId
  } catch (e) {
    error.value = e.message
  }
}

// Battle wave helpers
function addBattleWave() {
  if (!nodeForm.value.battles) nodeForm.value.battles = []
  nodeForm.value.battles.push({ enemies: [] })
}

function removeBattleWave(index) {
  nodeForm.value.battles.splice(index, 1)
}

function moveBattleWave(index, direction) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= nodeForm.value.battles.length) return
  const temp = nodeForm.value.battles[index]
  nodeForm.value.battles[index] = nodeForm.value.battles[newIndex]
  nodeForm.value.battles[newIndex] = temp
}

function addEnemyToBattle(battleIndex, option) {
  nodeForm.value.battles[battleIndex].enemies.push(option.id)
}

function removeEnemyFromBattle(battleIndex, enemyIndex) {
  nodeForm.value.battles[battleIndex].enemies.splice(enemyIndex, 1)
}

// Connection helpers
function addConnection(option) {
  if (!nodeForm.value.connections) nodeForm.value.connections = []
  if (!nodeForm.value.connections.includes(option.id)) {
    nodeForm.value.connections.push(option.id)
  }
}

function removeConnection(index) {
  nodeForm.value.connections.splice(index, 1)
}

// Item drop helpers
function addItemDrop(option) {
  if (!nodeForm.value.itemDrops) nodeForm.value.itemDrops = []
  nodeForm.value.itemDrops.push({ itemId: option.id, min: 1, max: 1, chance: 0.5 })
}

function removeItemDrop(index) {
  nodeForm.value.itemDrops.splice(index, 1)
}

// Toggle showing all regions for connections
const showAllRegionConnections = ref(false)
```

The component also needs to fetch enemy templates and items for the dropdowns. Add:

```js
const enemyOptions = ref([])
const itemOptions = ref([])
const genusLociOptions = ref([])

onMounted(async () => {
  await fetchRegions()

  // Fetch enemy templates
  try {
    const res = await fetch('/api/admin/enemies')
    if (res.ok) {
      const data = await res.json()
      enemyOptions.value = Object.values(data).map(e => ({
        id: e.id,
        label: e.name,
        sublabel: e.id
      }))
    }
  } catch (e) { /* ignore */ }

  // Fetch items
  try {
    const res = await fetch('/api/admin/items')
    if (res.ok) {
      const data = await res.json()
      itemOptions.value = Object.values(data).map(i => ({
        id: i.id,
        label: i.name,
        sublabel: i.id
      }))
    }
  } catch (e) { /* ignore */ }
})

// Connection options (nodes in same region, or all)
const connectionOptions = computed(() => {
  if (showAllRegionConnections.value) {
    return allRegions.value.flatMap(r =>
      Object.values(r.nodes).map(n => ({
        id: n.id,
        label: n.name,
        sublabel: `${r.regionMeta.name} / ${n.id}`
      }))
    )
  }
  if (!selectedRegion.value) return []
  return Object.values(selectedRegion.value.nodes)
    .filter(n => n.id !== editingNodeId.value)
    .map(n => ({ id: n.id, label: n.name, sublabel: n.id }))
})
```

**Step 2: Replace the node editor placeholder**

Replace `<p class="placeholder-text">Node editor form (Task 10)</p>` with the full node editor form template. This is the largest template section — it includes:

- Identity fields (id, name, type dropdown, region read-only)
- Position fields (x, y)
- Battles section (shown for type=battle): wave list with enemy pickers
- Connections section: tags with searchable dropdown
- Rewards section: gems/gold/exp inputs
- firstClearBonus section: collapsible
- Item drops section: with item picker and chance/min/max inputs
- Genus Loci fields (shown for type=genusLoci)
- Exploration fields (shown for type=exploration)
- Special fields (unlocks, unlockedBy, backgroundId)
- Save button

The template uses `SearchableDropdown` for enemy, item, and connection selection. All conditional sections use `v-if` on `nodeForm.type`.

**Step 3: Add node editor styles**

Reuse `.form-grid`, `.form-field`, `.field-input` etc. from Task 9. Add:

```css
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #374151;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #d1d5db;
}

.tag-remove {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0 2px;
}

.tag-remove:hover {
  color: #ef4444;
}

.battle-wave {
  background: #111827;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
}

.wave-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.8rem;
  color: #9ca3af;
}

.wave-actions {
  display: flex;
  gap: 4px;
}

.wave-btn {
  padding: 2px 6px;
  background: #374151;
  border: none;
  border-radius: 3px;
  color: #9ca3af;
  font-size: 0.7rem;
  cursor: pointer;
}

.wave-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.wave-btn.danger:hover {
  background: #7f1d1d;
  color: #fca5a5;
}

.item-drop-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #1a2332;
}

.item-drop-row:last-child {
  border-bottom: none;
}

.drop-field {
  width: 60px;
}

.drop-label {
  font-size: 0.65rem;
  color: #6b7280;
}
```

**Step 4: Wire up the "Add Node" button in the node list section header**

Add next to the unlock/lock buttons:
```html
<button class="small-btn" @click="createNode">+ Node</button>
```

**Step 5: Manual test**

Open admin, select a region, click Edit on a node. Verify:
- All fields populated correctly
- Can edit and save
- Enemy picker works
- Connection picker works
- Item drop picker works
- Battle wave add/remove/reorder works

**Step 6: Commit**

```bash
git add src/screens/admin/QuestNodeEditor.vue
git commit -m "feat: add node editor form with enemy/item/connection pickers"
```

---

### Task 11: Integration test — Round-trip serialization of real files

Verify the serializer works correctly against actual region files in the codebase.

**Files:**
- Modify: `src/utils/__tests__/questSerializer.test.js`

**Step 1: Add round-trip test using real file content**

```js
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('real file round-trip', () => {
  it('round-trips whispering_woods.js preserving all data', () => {
    const filePath = resolve(process.cwd(), 'src/data/quests/whispering_woods.js')
    const content = readFileSync(filePath, 'utf-8')

    const parsed = parseRegionFile(content)
    const serialized = serializeRegionFile(parsed.regionMeta, parsed.nodes, parsed.importLines)
    const reparsed = parseRegionFile(serialized)

    // Same region meta (minus backgroundImage)
    expect(reparsed.regionMeta.id).toBe(parsed.regionMeta.id)
    expect(reparsed.regionMeta.name).toBe(parsed.regionMeta.name)
    expect(reparsed.regionMeta.width).toBe(parsed.regionMeta.width)
    expect(reparsed.regionMeta.height).toBe(parsed.regionMeta.height)

    // Same node count
    expect(Object.keys(reparsed.nodes)).toEqual(Object.keys(parsed.nodes))

    // Same node data
    for (const [nodeId, node] of Object.entries(parsed.nodes)) {
      expect(reparsed.nodes[nodeId].name).toBe(node.name)
      expect(reparsed.nodes[nodeId].x).toBe(node.x)
      expect(reparsed.nodes[nodeId].y).toBe(node.y)
      expect(reparsed.nodes[nodeId].battles).toEqual(node.battles)
      expect(reparsed.nodes[nodeId].connections).toEqual(node.connections)
      expect(reparsed.nodes[nodeId].rewards).toEqual(node.rewards)
    }
  })

  it('round-trips hibernation_den.js with genus loci node', () => {
    const filePath = resolve(process.cwd(), 'src/data/quests/hibernation_den.js')
    const content = readFileSync(filePath, 'utf-8')

    const parsed = parseRegionFile(content)
    const serialized = serializeRegionFile(parsed.regionMeta, parsed.nodes, parsed.importLines)
    const reparsed = parseRegionFile(serialized)

    // Find the genus loci node
    const glNode = Object.values(reparsed.nodes).find(n => n.type === 'genusLoci')
    expect(glNode).toBeDefined()
    expect(glNode.genusLociId).toBe('great_troll')
  })
})
```

**Step 2: Run all tests**

Run: `npx vitest run src/utils/__tests__/questSerializer.test.js`
Expected: PASS

**Step 3: Commit**

```bash
git add src/utils/__tests__/questSerializer.test.js
git commit -m "test: add real file round-trip tests for quest serializer"
```

---

### Task 12: Final cleanup and manual verification

**Step 1: Remove old QuestNodeList.vue**

The old `QuestNodeList.vue` is no longer referenced. Delete it:
```bash
git rm src/screens/admin/QuestNodeList.vue
```

**Step 2: Run all tests**

```bash
npx vitest run
```
Expected: All tests pass

**Step 3: Manual end-to-end verification**

Open admin (Ctrl+Shift+A) → Quest Nodes. Verify:
- [ ] Region list loads with all regions grouped by super-region
- [ ] Clicking a region shows its metadata and nodes
- [ ] Region metadata can be edited and saved (check file on disk)
- [ ] New region can be created (check file, index.js, regions.js)
- [ ] Region can be deleted with confirmation (check cleanup)
- [ ] Node editor opens when clicking Edit
- [ ] All node fields editable (id, name, type, position, battles, connections, rewards, item drops)
- [ ] Enemy picker searches and adds enemies
- [ ] Connection picker works with same-region and all-region toggle
- [ ] Item drop picker works with chance/min/max
- [ ] Node can be saved (check file on disk)
- [ ] New node can be created
- [ ] Node can be deleted with confirmation
- [ ] Unlock/lock buttons still work for testing
- [ ] HMR reloads data after saves

**Step 4: Final commit**

```bash
git rm src/screens/admin/QuestNodeList.vue
git add -A
git commit -m "feat: complete quest node editor admin feature"
```
