#!/usr/bin/env node
/**
 * Batch generate missing map images for underwater regions using Gemini API.
 * Run with: node scripts/generate-missing-maps.js
 *
 * Requires VITE_GEMINI_API_KEY in .env file.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const MODEL = 'gemini-2.5-flash-image'

const MISSING_REGIONS = [
  {
    id: 'outer_currents',
    name: 'Outer Currents',
    nodes: ['Patrol Crossing', 'Propaganda Plaza', 'Checkpoint Wreckage', 'The Whisper Tunnels', 'Barracks Perimeter', 'Shipyard Junction']
  },
  {
    id: 'the_murk',
    name: 'The Murk',
    nodes: ['Dimlight Passage', 'Outcast Hollow', 'The Silt Beds', 'Faded Lantern Row', 'The Drop-Off']
  },
  {
    id: 'beggars_reef',
    name: "Beggar's Reef",
    nodes: ['Shanty Sprawl', 'The Sick Ward', 'Drainage Tunnels']
  },
  {
    id: 'sunken_shipyard',
    name: 'Sunken Shipyard',
    nodes: ['Hull Graveyard', 'The Dry Dock', 'Cargo Hold Maze', 'The Flagship Wreck']
  },
  {
    id: 'blackfin_den',
    name: 'Blackfin Den',
    nodes: ['The Blind Eye', 'Contraband Corridor', 'The Betting Pits']
  },
  {
    id: 'scalding_traverse',
    name: 'Scalding Traverse',
    nodes: ['Boiling Gates', 'Vent Field Crossing', 'Obsidian Labyrinth', 'The Scorched Beds', 'Abyssal Threshold']
  },
  {
    id: 'drowned_prison',
    name: 'Drowned Prison',
    nodes: ['Prisoner Intake', 'Chain Gang Tunnels', 'The Flooded Cells', 'The Oubliette']
  },
  {
    id: 'forbidden_archives',
    name: 'Forbidden Archives',
    nodes: ['The Sealed Stacks', 'Hall of Heresy', 'Drowned Scriptorium', 'Vault of Minds', 'The Index']
  },
  {
    id: 'primordial_nursery',
    name: 'Primordial Nursery',
    nodes: ['The Spawn Pools', 'Incubation Vents', 'Juvenile Feeding Grounds', 'Genesis Core']
  },
  {
    id: 'pearlgate_plaza',
    name: 'Pearlgate Plaza',
    nodes: ['Pearlgate Approach', 'Credential Check', 'Castle Forecourt']
  },
  {
    id: 'coral_castle_halls',
    name: 'Coral Castle Halls',
    nodes: ['Grand Foyer', 'Gallery of Tides', 'Abandoned Banquet', 'Elite Barracks', 'Archive Wing', 'Inner Sanctum Gate']
  },
  {
    id: 'throne_approach',
    name: 'Throne Approach',
    nodes: ['Royal Antechamber', 'Chapel of Tides', 'Privy Council Chamber', 'Throne Room Vestibule', 'The Coral Throne']
  },
  {
    id: 'the_abyssal_maw',
    name: 'The Abyssal Maw',
    nodes: ['The Sunless Depths', 'Boneyard Trench', 'The Whispering Dark', 'Idol of the Deep', 'The Rift Beyond']
  }
]

function buildPrompt(region) {
  const nodeNames = region.nodes.join(', ')
  return `A totally textless underwater image of ${region.name}. Aerial view. Remove all text from the image. Distinct areas that have no label, like ${nodeNames}. NEVER ADD TEXT TO THE IMAGE. No people. No monsters. No animals. Dark Fantasy. Pixel Art.`
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateImage(prompt, apiKey) {
  const response = await fetch(
    `${API_BASE}/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '16:9' }
        }
      })
    }
  )

  if (response.status === 429) {
    const errorBody = await response.text()
    const retryMatch = errorBody.match(/"retryDelay":\s*"(\d+)s"/)
    const delaySec = retryMatch ? parseInt(retryMatch[1], 10) : 60
    return { rateLimited: true, delaySec }
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error ${response.status}: ${errorText}`)
  }

  const result = await response.json()
  const candidates = result.candidates || []
  for (const candidate of candidates) {
    const parts = candidate.content?.parts || []
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return { imageData: part.inlineData.data, mimeType: part.inlineData.mimeType }
      }
    }
  }
  throw new Error('No image in response')
}

async function main() {
  const apiKey = process.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    console.error('Error: VITE_GEMINI_API_KEY not found in .env')
    process.exit(1)
  }

  const mapsDir = path.resolve(__dirname, '../src/assets/maps')
  const promptsPath = path.resolve(__dirname, '../src/data/assetPrompts.json')

  // Load existing prompts
  let prompts = {}
  if (fs.existsSync(promptsPath)) {
    prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'))
  }

  console.log(`\nGenerating ${MISSING_REGIONS.length} missing map images...\n`)

  for (let i = 0; i < MISSING_REGIONS.length; i++) {
    const region = MISSING_REGIONS[i]
    const outputPath = path.join(mapsDir, `${region.id}.png`)

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`[${i + 1}/${MISSING_REGIONS.length}] ${region.name} - already exists, skipping`)
      continue
    }

    const prompt = buildPrompt(region)
    console.log(`[${i + 1}/${MISSING_REGIONS.length}] ${region.name}`)
    console.log(`  Prompt: ${prompt.substring(0, 80)}...`)

    let attempts = 0
    while (attempts < 3) {
      try {
        const result = await generateImage(prompt, apiKey)

        if (result.rateLimited) {
          console.log(`  Rate limited. Waiting ${result.delaySec}s...`)
          await sleep(result.delaySec * 1000)
          attempts++
          continue
        }

        // Save the image (Gemini returns PNG)
        const buffer = Buffer.from(result.imageData, 'base64')
        fs.writeFileSync(outputPath, buffer)
        console.log(`  Saved: ${outputPath}`)

        // Save the prompt
        prompts[`map_${region.id}`] = prompt
        fs.writeFileSync(promptsPath, JSON.stringify(prompts, null, 2) + '\n')

        // Wait between successful generations to avoid rate limits
        if (i < MISSING_REGIONS.length - 1) {
          console.log('  Waiting 5s before next generation...')
          await sleep(5000)
        }
        break
      } catch (err) {
        console.error(`  Error: ${err.message}`)
        attempts++
        if (attempts < 3) {
          console.log(`  Retrying in 10s...`)
          await sleep(10000)
        }
      }
    }
  }

  console.log('\nDone!')
}

main().catch(console.error)
