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
    const node = questNodes[options.id]
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
