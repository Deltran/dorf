#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateAndDownload } from './lib/pixellab.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const OUTPUT_DIR = path.join(projectRoot, 'src/assets/action_backgrounds/classes')

// Class definitions with colors and thematic elements
const classes = {
  paladin: {
    color: '#fbbf24',
    theme: 'holy golden light, divine radiance, sacred symbols, warm yellows and golds'
  },
  knight: {
    color: '#3b82f6',
    theme: 'steel blue metal, noble heraldry, shield patterns, cold blue steel'
  },
  mage: {
    color: '#a855f7',
    theme: 'arcane purple energy, mystical runes, magical sparkles, deep violet swirls'
  },
  berserker: {
    color: '#ef4444',
    theme: 'blood red rage, fierce flames, battle scars, crimson fury'
  },
  ranger: {
    color: '#f59e0b',
    theme: 'autumn forest, amber leaves, wooden textures, warm orange nature'
  },
  cleric: {
    color: '#22c55e',
    theme: 'healing green light, life energy, gentle glow, emerald restoration'
  },
  druid: {
    color: '#10b981',
    theme: 'deep forest teal, vines and roots, natural growth, verdant wilderness'
  },
  bard: {
    color: '#ec4899',
    theme: 'vibrant pink performance, musical notes, theatrical flair, magenta melody'
  },
  alchemist: {
    color: '#06b6d4',
    theme: 'cyan bubbling potions, chemical swirls, laboratory essence, teal experiments'
  }
}

function buildPrompt(classId, classData) {
  return `Pixel art textured background banner for a ${classId} class in a dark fantasy RPG. ${classData.theme}. Horizontal strip format, dark moody atmosphere, subtle texture, no characters or text. Primary color: ${classData.color}. Style: 16-bit pixel art, seamless edges.`
}

async function generateClassBackground(classId, classData, options = {}) {
  const outputPath = path.join(OUTPUT_DIR, `${classId}.png`)

  if (fs.existsSync(outputPath) && !options.force) {
    console.log(`  ⏭️  ${classId} - already exists (use --force to regenerate)`)
    return
  }

  const prompt = buildPrompt(classId, classData)

  if (options.dryRun) {
    console.log(`  🔍 ${classId}:`)
    console.log(`      Prompt: ${prompt}`)
    console.log(`      Size: 400x50`)
    return
  }

  console.log(`  ⏳ ${classId} - generating...`)

  try {
    const { imageData } = await generateAndDownload({
      prompt,
      width: 400,
      height: 50
    })

    fs.writeFileSync(outputPath, imageData)
    console.log(`  ✅ ${classId} - saved to ${outputPath}`)
  } catch (error) {
    console.error(`  ❌ ${classId} - failed: ${error.message}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const specificClass = args.find(a => !a.startsWith('--'))

  console.log('\n🎨 Generating Action Bar Class Backgrounds\n')

  if (dryRun) {
    console.log('(Dry run - no API calls will be made)\n')
  }

  // Ensure output directory exists
  if (!dryRun) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  if (specificClass) {
    if (!classes[specificClass]) {
      console.error(`Unknown class: ${specificClass}`)
      console.log(`Available classes: ${Object.keys(classes).join(', ')}`)
      process.exit(1)
    }
    await generateClassBackground(specificClass, classes[specificClass], { dryRun, force })
  } else {
    for (const [classId, classData] of Object.entries(classes)) {
      await generateClassBackground(classId, classData, { dryRun, force })
    }
  }

  console.log('\nDone!')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
