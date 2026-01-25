# Pixellab Asset Generation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Node.js CLI script that batch-generates missing enemy sprites and battle backgrounds using Pixellab's API.

**Architecture:** Modular library design with reusable API client, asset checker, and prompt builder. CLI entry point orchestrates the workflow. Manual prompt overrides via data file.

**Tech Stack:** Node.js, native fetch API, commander (CLI), dotenv (env vars)

---

## Task 1: Project Setup

**Files:**
- Create: `scripts/generate-assets.js`
- Create: `scripts/lib/pixellab.js`
- Create: `scripts/lib/asset-checker.js`
- Create: `scripts/lib/prompt-builder.js`
- Create: `src/data/assetPrompts.js`
- Modify: `package.json` (add script entry)
- Create: `.env.example`

**Step 1: Create directory structure**

```bash
mkdir -p scripts/lib
```

**Step 2: Create placeholder files**

Create `scripts/generate-assets.js`:
```js
#!/usr/bin/env node
// Pixellab Asset Generation CLI
// Usage: node scripts/generate-assets.js --help

console.log('Pixellab Asset Generator - setup complete')
```

Create `scripts/lib/pixellab.js`:
```js
// Pixellab API client
export async function createMapObject({ prompt, width, height }) {
  // TODO: implement
}

export async function getMapObject(objectId) {
  // TODO: implement
}

export async function downloadAsset(downloadUrl) {
  // TODO: implement
}
```

Create `scripts/lib/asset-checker.js`:
```js
// Asset checker - detects missing assets
export function getMissingEnemies() {
  // TODO: implement
  return []
}

export function getMissingBackgrounds() {
  // TODO: implement
  return []
}
```

Create `scripts/lib/prompt-builder.js`:
```js
// Prompt builder - generates prompts from game data
export function buildEnemyPrompt(enemyId, enemyData) {
  // TODO: implement
  return ''
}

export function buildBackgroundPrompt(nodeId, nodeData) {
  // TODO: implement
  return ''
}
```

Create `src/data/assetPrompts.js`:
```js
// Manual prompt overrides for asset generation
// If an asset has an entry here, this prompt is used instead of auto-generation

export const enemyPrompts = {
  // Example:
  // kraken: {
  //   prompt: "A kraken. Giant squid creature. Massive tentacles. Dark purple skin. Glowing yellow eyes. Menacing. High fantasy.",
  //   size: 128
  // }
}

export const backgroundPrompts = {
  // Example:
  // cliffs_01: {
  //   prompt: "Volcanic cliffs. Orange lava glow. Black rock. Ash in air. Ominous sky. Dark fantasy."
  // }
}
```

Create `.env.example`:
```
PIXELLAB_TOKEN=your_api_token_here
```

**Step 3: Add npm script to package.json**

Add to "scripts" section:
```json
"generate-assets": "node scripts/generate-assets.js"
```

**Step 4: Verify setup**

Run: `node scripts/generate-assets.js`
Expected: "Pixellab Asset Generator - setup complete"

**Step 5: Commit**

```bash
git add scripts/ src/data/assetPrompts.js .env.example package.json
git commit -m "feat(assets): scaffold pixellab asset generation scripts"
```

---

## Task 2: Asset Checker Implementation

**Files:**
- Modify: `scripts/lib/asset-checker.js`
- Create: `scripts/lib/__tests__/asset-checker.test.js`

**Step 1: Write failing tests for asset checker**

Create `scripts/lib/__tests__/asset-checker.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMissingEnemies, getMissingBackgrounds, getEnemySize } from '../asset-checker.js'

// Mock the file system checks
vi.mock('fs', () => ({
  existsSync: vi.fn()
}))

import fs from 'fs'

describe('asset-checker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMissingEnemies', () => {
    it('returns enemies that have no image file', () => {
      // Simulate: cave_leech.png does not exist, goblin_scout.png exists
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('goblin_scout')) return true
        if (path.includes('cave_leech')) return false
        return true
      })

      const missing = getMissingEnemies()

      expect(missing.some(e => e.id === 'cave_leech')).toBe(true)
      expect(missing.some(e => e.id === 'goblin_scout')).toBe(false)
    })
  })

  describe('getMissingBackgrounds', () => {
    it('returns quest nodes that have no background file', () => {
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('forest_01')) return true
        if (path.includes('cliffs_01')) return false
        return true
      })

      const missing = getMissingBackgrounds()

      expect(missing.some(b => b.id === 'cliffs_01')).toBe(true)
      expect(missing.some(b => b.id === 'forest_01')).toBe(false)
    })
  })

  describe('getEnemySize', () => {
    it('returns 128 for enemies with imageSize property', () => {
      const enemy = { id: 'goblin_commander', imageSize: 140 }
      expect(getEnemySize(enemy)).toBe(128)
    })

    it('returns 128 for enemies with size keywords in name', () => {
      expect(getEnemySize({ id: 'mountain_giant', name: 'Mountain Giant' })).toBe(128)
      expect(getEnemySize({ id: 'cave_troll', name: 'Cave Troll' })).toBe(128)
      expect(getEnemySize({ id: 'rock_golem', name: 'Rock Golem' })).toBe(128)
      expect(getEnemySize({ id: 'kraken', name: 'Kraken' })).toBe(128)
    })

    it('returns 64 for regular enemies', () => {
      expect(getEnemySize({ id: 'goblin_scout', name: 'Goblin Scout' })).toBe(64)
      expect(getEnemySize({ id: 'cave_bat', name: 'Cave Bat' })).toBe(64)
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test scripts/lib/__tests__/asset-checker.test.js`
Expected: FAIL - functions not properly implemented

**Step 3: Implement asset checker**

Update `scripts/lib/asset-checker.js`:
```js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { enemyTemplates } from '../../src/data/enemyTemplates.js'
import { questNodes } from '../../src/data/questNodes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../..')

const ENEMIES_DIR = path.join(projectRoot, 'src/assets/enemies')
const BACKGROUNDS_DIR = path.join(projectRoot, 'src/assets/battle_backgrounds')

// Keywords that indicate a large creature (128x128)
const SIZE_KEYWORDS = ['giant', 'dragon', 'troll', 'golem', 'hydra', 'kraken', 'titan', 'elemental']

export function getEnemySize(enemy) {
  // Has imageSize property = boss/large enemy
  if (enemy.imageSize) {
    return 128
  }

  // Check for size keywords in name
  const nameLower = (enemy.name || enemy.id).toLowerCase()
  if (SIZE_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
    return 128
  }

  return 64
}

export function getMissingEnemies() {
  const missing = []

  for (const [id, enemy] of Object.entries(enemyTemplates)) {
    const imagePath = path.join(ENEMIES_DIR, `${id}.png`)
    if (!fs.existsSync(imagePath)) {
      missing.push({
        id,
        name: enemy.name,
        size: getEnemySize(enemy),
        skill: enemy.skill || (enemy.skills && enemy.skills[0])
      })
    }
  }

  return missing
}

export function getMissingBackgrounds() {
  const missing = []

  for (const node of questNodes) {
    // Skip region nodes (they don't have battles)
    if (!node.battles || node.battles.length === 0) continue

    const bgPath = path.join(BACKGROUNDS_DIR, `${node.id}.png`)
    if (!fs.existsSync(bgPath)) {
      missing.push({
        id: node.id,
        name: node.name,
        region: node.region
      })
    }
  }

  return missing
}

export function listMissingAssets() {
  const enemies = getMissingEnemies()
  const backgrounds = getMissingBackgrounds()

  return { enemies, backgrounds }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test scripts/lib/__tests__/asset-checker.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/lib/asset-checker.js scripts/lib/__tests__/asset-checker.test.js
git commit -m "feat(assets): implement asset checker to detect missing images"
```

---

## Task 3: Prompt Builder Implementation

**Files:**
- Modify: `scripts/lib/prompt-builder.js`
- Create: `scripts/lib/__tests__/prompt-builder.test.js`

**Step 1: Write failing tests for prompt builder**

Create `scripts/lib/__tests__/prompt-builder.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { buildEnemyPrompt, buildBackgroundPrompt, REGION_THEMES } from '../prompt-builder.js'

describe('prompt-builder', () => {
  describe('buildEnemyPrompt', () => {
    it('builds prompt from enemy name and skill', () => {
      const enemy = {
        id: 'cave_leech',
        name: 'Cave Leech',
        skill: { name: 'Blood Drain' }
      }

      const prompt = buildEnemyPrompt(enemy)

      expect(prompt).toContain('A cave leech')
      expect(prompt).toContain('Blood drain')
      expect(prompt).toContain('High fantasy.')
    })

    it('ends with High fantasy.', () => {
      const enemy = { id: 'test', name: 'Test Enemy', skill: { name: 'Attack' } }
      const prompt = buildEnemyPrompt(enemy)

      expect(prompt.endsWith('High fantasy.')).toBe(true)
    })
  })

  describe('buildBackgroundPrompt', () => {
    it('builds prompt from node name and region', () => {
      const node = {
        id: 'cliffs_01',
        name: 'Lava Fields',
        region: 'Blistering Cliffsides'
      }

      const prompt = buildBackgroundPrompt(node)

      expect(prompt).toContain('Lava fields')
      expect(prompt).toContain('volcanic')
      expect(prompt).toContain('Dark fantasy.')
    })

    it('ends with Dark fantasy.', () => {
      const node = { id: 'test', name: 'Test', region: 'Unknown Region' }
      const prompt = buildBackgroundPrompt(node)

      expect(prompt.endsWith('Dark fantasy.')).toBe(true)
    })
  })

  describe('REGION_THEMES', () => {
    it('has themes for all expected regions', () => {
      const expectedRegions = [
        'Blistering Cliffsides',
        'Janxier Floodplain',
        'Old Fort Calindash',
        'Ancient Catacombs',
        'Underground Morass',
        'Gate to Aquaria',
        'Coral Depths'
      ]

      for (const region of expectedRegions) {
        expect(REGION_THEMES[region]).toBeDefined()
      }
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test scripts/lib/__tests__/prompt-builder.test.js`
Expected: FAIL - functions not properly implemented

**Step 3: Implement prompt builder**

Update `scripts/lib/prompt-builder.js`:
```js
import { enemyPrompts, backgroundPrompts } from '../../src/data/assetPrompts.js'

// Region to theme keywords mapping
export const REGION_THEMES = {
  'Blistering Cliffsides': 'Volcanic cliffs. Orange lava glow. Black rock. Ash in air.',
  'Janxier Floodplain': 'Flooded plains. Murky water. Dead trees. Overcast sky.',
  'Old Fort Calindash': 'Ruined fort. Crumbling stone walls. Overgrown with vines. Ghostly atmosphere.',
  'Ancient Catacombs': 'Underground tombs. Stone coffins. Flickering torches. Scattered bones.',
  'Underground Morass': 'Swamp cave. Glowing mushrooms. Murky water. Twisted roots.',
  'Gate to Aquaria': 'Underwater realm. Coral formations. Blue-green light. Bubbles rising.',
  'Coral Depths': 'Deep ocean. Coral reef. Bioluminescent creatures. Dark water.'
}

export function buildEnemyPrompt(enemy) {
  // Check for manual override first
  if (enemyPrompts[enemy.id]) {
    return enemyPrompts[enemy.id].prompt
  }

  const parts = []

  // Name (convert to lowercase for natural sentence)
  const name = enemy.name.toLowerCase()
  parts.push(`A ${name}.`)

  // Skill flavor if available
  if (enemy.skill?.name) {
    const skillName = enemy.skill.name.toLowerCase()
    parts.push(`${skillName.charAt(0).toUpperCase() + skillName.slice(1)} ability.`)
  }

  // Style suffix
  parts.push('High fantasy.')

  return parts.join(' ')
}

export function buildBackgroundPrompt(node) {
  // Check for manual override first
  if (backgroundPrompts[node.id]) {
    return backgroundPrompts[node.id].prompt
  }

  const parts = []

  // Node name
  const nodeName = node.name.toLowerCase()
  parts.push(`${nodeName.charAt(0).toUpperCase() + nodeName.slice(1)}.`)

  // Region theme
  const theme = REGION_THEMES[node.region]
  if (theme) {
    parts.push(theme)
  }

  // Style suffix
  parts.push('Dark fantasy.')

  return parts.join(' ')
}

export function getEnemyPromptWithOverride(enemy) {
  if (enemyPrompts[enemy.id]) {
    return {
      prompt: enemyPrompts[enemy.id].prompt,
      size: enemyPrompts[enemy.id].size || null,
      isOverride: true
    }
  }
  return {
    prompt: buildEnemyPrompt(enemy),
    size: null,
    isOverride: false
  }
}

export function getBackgroundPromptWithOverride(node) {
  if (backgroundPrompts[node.id]) {
    return {
      prompt: backgroundPrompts[node.id].prompt,
      isOverride: true
    }
  }
  return {
    prompt: buildBackgroundPrompt(node),
    isOverride: false
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test scripts/lib/__tests__/prompt-builder.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/lib/prompt-builder.js scripts/lib/__tests__/prompt-builder.test.js
git commit -m "feat(assets): implement prompt builder with region themes"
```

---

## Task 4: Pixellab API Client

**Files:**
- Modify: `scripts/lib/pixellab.js`
- Create: `scripts/lib/__tests__/pixellab.test.js`

**Step 1: Write tests for API client (mocked)**

Create `scripts/lib/__tests__/pixellab.test.js`:
```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMapObject, getMapObject, downloadAsset, waitForCompletion } from '../pixellab.js'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('pixellab API client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PIXELLAB_TOKEN = 'test-token'
  })

  afterEach(() => {
    delete process.env.PIXELLAB_TOKEN
  })

  describe('createMapObject', () => {
    it('sends correct request to API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object_id: 'test-123' })
      })

      const result = await createMapObject({
        prompt: 'A goblin. High fantasy.',
        width: 64,
        height: 64
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('pixellab'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )
      expect(result.object_id).toBe('test-123')
    })

    it('throws if no token configured', async () => {
      delete process.env.PIXELLAB_TOKEN

      await expect(createMapObject({ prompt: 'test', width: 64, height: 64 }))
        .rejects.toThrow('PIXELLAB_TOKEN')
    })
  })

  describe('getMapObject', () => {
    it('returns object status and download URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'completed',
          download_url: 'https://api.pixellab.ai/download/test-123'
        })
      })

      const result = await getMapObject('test-123')

      expect(result.status).toBe('completed')
      expect(result.download_url).toBeDefined()
    })
  })

  describe('waitForCompletion', () => {
    it('polls until status is completed', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'processing' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'processing' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'completed', download_url: 'http://example.com' })
        })

      const result = await waitForCompletion('test-123', { pollInterval: 10, maxAttempts: 5 })

      expect(result.status).toBe('completed')
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('throws after max attempts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'processing' })
      })

      await expect(waitForCompletion('test-123', { pollInterval: 10, maxAttempts: 2 }))
        .rejects.toThrow('timed out')
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test scripts/lib/__tests__/pixellab.test.js`
Expected: FAIL

**Step 3: Implement Pixellab API client**

Update `scripts/lib/pixellab.js`:
```js
const API_BASE = 'https://api.pixellab.ai'

function getToken() {
  const token = process.env.PIXELLAB_TOKEN
  if (!token) {
    throw new Error('PIXELLAB_TOKEN environment variable is not set')
  }
  return token
}

export async function createMapObject({ prompt, width, height }) {
  const token = getToken()

  const response = await fetch(`${API_BASE}/mcp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool: 'create_map_object',
      params: {
        description: prompt,
        width,
        height
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Pixellab API error: ${response.status} - ${error}`)
  }

  return response.json()
}

export async function getMapObject(objectId) {
  const token = getToken()

  const response = await fetch(`${API_BASE}/mcp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool: 'get_map_object',
      params: {
        object_id: objectId
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Pixellab API error: ${response.status} - ${error}`)
  }

  return response.json()
}

export async function downloadAsset(downloadUrl) {
  const response = await fetch(downloadUrl)

  if (!response.ok) {
    throw new Error(`Failed to download asset: ${response.status}`)
  }

  return response.arrayBuffer()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function waitForCompletion(objectId, options = {}) {
  const { pollInterval = 10000, maxAttempts = 60 } = options

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getMapObject(objectId)

    if (result.status === 'completed') {
      return result
    }

    if (result.status === 'failed') {
      throw new Error(`Generation failed: ${result.error || 'Unknown error'}`)
    }

    await sleep(pollInterval)
  }

  throw new Error(`Generation timed out after ${maxAttempts} attempts`)
}

export async function generateAndDownload({ prompt, width, height }) {
  // Start generation
  const { object_id } = await createMapObject({ prompt, width, height })

  // Wait for completion
  const result = await waitForCompletion(object_id)

  // Download the image
  const imageData = await downloadAsset(result.download_url)

  return {
    objectId: object_id,
    imageData: Buffer.from(imageData)
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test scripts/lib/__tests__/pixellab.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/lib/pixellab.js scripts/lib/__tests__/pixellab.test.js
git commit -m "feat(assets): implement Pixellab API client with polling"
```

---

## Task 5: CLI Entry Point

**Files:**
- Modify: `scripts/generate-assets.js`

**Step 1: Install CLI dependencies**

Run: `npm install commander dotenv --save-dev`

**Step 2: Implement CLI**

Update `scripts/generate-assets.js`:
```js
#!/usr/bin/env node
import 'dotenv/config'
import { program } from 'commander'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getMissingEnemies, getMissingBackgrounds, getEnemySize } from './lib/asset-checker.js'
import { buildEnemyPrompt, buildBackgroundPrompt, getEnemyPromptWithOverride, getBackgroundPromptWithOverride } from './lib/prompt-builder.js'
import { generateAndDownload } from './lib/pixellab.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const ENEMIES_DIR = path.join(projectRoot, 'src/assets/enemies')
const BACKGROUNDS_DIR = path.join(projectRoot, 'src/assets/battle_backgrounds')
const ERROR_LOG = path.join(__dirname, 'generation-errors.log')

program
  .name('generate-assets')
  .description('Generate missing game assets using Pixellab API')
  .version('1.0.0')

program
  .command('list')
  .description('List all missing assets')
  .action(() => {
    const enemies = getMissingEnemies()
    const backgrounds = getMissingBackgrounds()

    console.log('\n=== Missing Enemies ===')
    if (enemies.length === 0) {
      console.log('None!')
    } else {
      for (const enemy of enemies) {
        console.log(`  ${enemy.id} (${enemy.size}x${enemy.size}) - ${enemy.name}`)
      }
    }

    console.log('\n=== Missing Backgrounds ===')
    if (backgrounds.length === 0) {
      console.log('None!')
    } else {
      for (const bg of backgrounds) {
        console.log(`  ${bg.id} - ${bg.name} (${bg.region})`)
      }
    }

    console.log(`\nTotal: ${enemies.length} enemies, ${backgrounds.length} backgrounds`)
  })

program
  .command('enemies')
  .description('Generate missing enemy sprites')
  .option('--dry-run', 'Show what would be generated without calling API')
  .option('--id <id>', 'Generate specific enemy by ID (even if exists)')
  .action(async (options) => {
    await generateEnemies(options)
  })

program
  .command('backgrounds')
  .description('Generate missing battle backgrounds')
  .option('--dry-run', 'Show what would be generated without calling API')
  .option('--id <id>', 'Generate specific background by ID (even if exists)')
  .action(async (options) => {
    await generateBackgrounds(options)
  })

program
  .command('all')
  .description('Generate all missing assets')
  .option('--dry-run', 'Show what would be generated without calling API')
  .action(async (options) => {
    await generateEnemies(options)
    await generateBackgrounds(options)
  })

async function generateEnemies(options) {
  let enemies

  if (options.id) {
    // Import enemy templates to get specific enemy
    const { enemyTemplates } = await import('../src/data/enemyTemplates.js')
    const enemy = enemyTemplates[options.id]
    if (!enemy) {
      console.error(`Enemy not found: ${options.id}`)
      process.exit(1)
    }
    enemies = [{
      id: options.id,
      name: enemy.name,
      size: getEnemySize(enemy),
      skill: enemy.skill || (enemy.skills && enemy.skills[0])
    }]
  } else {
    enemies = getMissingEnemies()
  }

  if (enemies.length === 0) {
    console.log('No enemies to generate!')
    return
  }

  console.log(`\nGenerating ${enemies.length} enemies...`)

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i]
    const { prompt, isOverride } = getEnemyPromptWithOverride(enemy)
    const override = isOverride ? ' (override)' : ''

    console.log(`[${i + 1}/${enemies.length}] ${enemy.id} (${enemy.size}x${enemy.size})${override}`)
    console.log(`  Prompt: ${prompt}`)

    if (options.dryRun) {
      console.log('  [DRY RUN] Skipping generation')
      continue
    }

    try {
      console.log('  Generating...')
      const { imageData } = await generateAndDownload({
        prompt,
        width: enemy.size,
        height: enemy.size
      })

      const outputPath = path.join(ENEMIES_DIR, `${enemy.id}.png`)
      fs.writeFileSync(outputPath, imageData)
      console.log(`  ✓ Saved to ${outputPath}`)
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`)
      logError(enemy.id, 'enemy', error)
    }
  }
}

async function generateBackgrounds(options) {
  let backgrounds

  if (options.id) {
    // Import quest nodes to get specific node
    const { questNodes } = await import('../src/data/questNodes.js')
    const node = questNodes.find(n => n.id === options.id)
    if (!node) {
      console.error(`Quest node not found: ${options.id}`)
      process.exit(1)
    }
    backgrounds = [{
      id: node.id,
      name: node.name,
      region: node.region
    }]
  } else {
    backgrounds = getMissingBackgrounds()
  }

  if (backgrounds.length === 0) {
    console.log('No backgrounds to generate!')
    return
  }

  console.log(`\nGenerating ${backgrounds.length} backgrounds...`)

  for (let i = 0; i < backgrounds.length; i++) {
    const bg = backgrounds[i]
    const { prompt, isOverride } = getBackgroundPromptWithOverride(bg)
    const override = isOverride ? ' (override)' : ''

    console.log(`[${i + 1}/${backgrounds.length}] ${bg.id} (320x128)${override}`)
    console.log(`  Prompt: ${prompt}`)

    if (options.dryRun) {
      console.log('  [DRY RUN] Skipping generation')
      continue
    }

    try {
      console.log('  Generating...')
      const { imageData } = await generateAndDownload({
        prompt,
        width: 320,
        height: 128
      })

      const outputPath = path.join(BACKGROUNDS_DIR, `${bg.id}.png`)
      fs.writeFileSync(outputPath, imageData)
      console.log(`  ✓ Saved to ${outputPath}`)
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`)
      logError(bg.id, 'background', error)
    }
  }
}

function logError(assetId, type, error) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${type}:${assetId} - ${error.message}\n`
  fs.appendFileSync(ERROR_LOG, logEntry)
}

program.parse()
```

**Step 3: Verify CLI works**

Run: `node scripts/generate-assets.js list`
Expected: Lists missing enemies and backgrounds

Run: `node scripts/generate-assets.js enemies --dry-run`
Expected: Shows what would be generated without API calls

**Step 4: Commit**

```bash
git add scripts/generate-assets.js package.json package-lock.json
git commit -m "feat(assets): implement CLI for asset generation"
```

---

## Task 6: Integration Test

**Files:**
- None (manual testing)

**Step 1: Create .env file with real token**

```bash
cp .env.example .env
# Edit .env and add your PIXELLAB_TOKEN
```

**Step 2: Test with a single enemy**

Run: `node scripts/generate-assets.js enemies --id cave_leech`

Expected:
- Shows prompt being used
- Displays "Generating..."
- After 2-5 minutes, saves image to `src/assets/enemies/cave_leech.png`

**Step 3: Verify the generated image**

Open `src/assets/enemies/cave_leech.png` and check:
- Correct dimensions (64x64)
- Transparent background
- Looks like a cave leech

**Step 4: If successful, commit the generated asset**

```bash
git add src/assets/enemies/cave_leech.png
git commit -m "feat(assets): add cave_leech enemy sprite via Pixellab"
```

---

## Task 7: Batch Generation (Optional)

Once integration test passes, run full batch:

**Step 1: Generate all missing enemies**

Run: `node scripts/generate-assets.js enemies`

Note: This will take a while (2-5 minutes per enemy × 12 enemies = 24-60 minutes)

**Step 2: Generate all missing backgrounds**

Run: `node scripts/generate-assets.js backgrounds`

Note: This will take even longer (2-5 minutes × 43 backgrounds = 86-215 minutes)

**Step 3: Review and commit**

Review each generated asset, regenerate any that don't look good:

```bash
# Regenerate a specific asset with custom prompt override
# First, add entry to src/data/assetPrompts.js, then:
node scripts/generate-assets.js enemies --id <enemy_id>
```

Commit in batches by region:
```bash
git add src/assets/enemies/*.png
git commit -m "feat(assets): add missing enemy sprites via Pixellab"

git add src/assets/battle_backgrounds/*.png
git commit -m "feat(assets): add missing battle backgrounds via Pixellab"
```
