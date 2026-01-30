import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { enemyTemplates } from '../../src/data/enemies/index.js'
import { questNodes } from '../../src/data/quests/index.js'

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

  for (const [nodeId, node] of Object.entries(questNodes)) {
    // Skip exploration nodes and region nodes (they don't need unique backgrounds)
    if (node.type === 'exploration') continue
    // Skip nodes without battles
    if (!node.battles || node.battles.length === 0) continue

    const bgPath = path.join(BACKGROUNDS_DIR, `${nodeId}.png`)
    if (!fs.existsSync(bgPath)) {
      missing.push({
        id: nodeId,
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
