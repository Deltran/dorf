#!/usr/bin/env node
/**
 * Batch generate 600x1000 portrait region maps using Gemini API.
 * Run with: node --import ./scripts/lib/register-loader.js scripts/generate-region-maps.js
 *
 * Only generates for regions that don't have an existing 600x1000 image.
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
const MODEL = 'gemini-2.5-flash-image'  // Free tier with image gen

const TARGET_WIDTH = 600
const TARGET_HEIGHT = 1000

// --- PNG dimension reading (from IHDR chunk) ---
function getPngDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath)
    // PNG signature is 8 bytes, then IHDR chunk
    // IHDR: 4 bytes length + 4 bytes "IHDR" + 4 bytes width + 4 bytes height
    if (buffer.length < 24) return null
    // Check PNG signature
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50) return null
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    return { width, height }
  } catch {
    return null
  }
}

// --- Import quest data ---
async function loadQuestData() {
  const { regions, getNodesByRegion } = await import('../src/data/quests/index.js')
  return { regions, getNodesByRegion }
}

// --- Build prompt for a region ---
function buildPrompt(region, nodes) {
  const nodeDescriptions = nodes.map(n => 'a ' + n.name.toLowerCase())
  const nodeList = nodeDescriptions.length > 1
    ? nodeDescriptions.slice(0, -1).join(', ') + ', and ' + nodeDescriptions.at(-1)
    : nodeDescriptions[0] || ''
  return `No text. ${region.name}. Ariel view. Distinct areas that have no label that look like ${nodeList}. NEVER ADD TEXT TO THE IMAGE. No people. No monsters. No animals. Dark Fantasy. Pixel Art.`
}

// --- Gemini API call ---
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
          imageConfig: { aspectRatio: '9:16' }  // Portrait, closest to 3:5
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
        return { imageData: part.inlineData.data }
      }
    }
  }
  throw new Error('No image in response')
}

// --- Resize image to exact dimensions using sharp ---
async function resizeImage(base64Data, targetWidth, targetHeight) {
  const sharp = (await import('sharp')).default
  const inputBuffer = Buffer.from(base64Data, 'base64')
  const outputBuffer = await sharp(inputBuffer)
    .resize(targetWidth, targetHeight, { fit: 'cover' })
    .png()
    .toBuffer()
  return outputBuffer
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// --- Main ---
async function main() {
  const apiKey = process.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    console.error('Error: VITE_GEMINI_API_KEY not found in .env')
    process.exit(1)
  }

  const mapDir = path.resolve(__dirname, '../src/assets/maps')
  const promptsPath = path.resolve(__dirname, '../src/data/assetPrompts.json')

  // Load existing prompts
  let prompts = {}
  if (fs.existsSync(promptsPath)) {
    prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'))
  }

  // Load quest data
  const { regions, getNodesByRegion } = await loadQuestData()

  // Build queue of regions needing maps
  const queue = []
  let skippedCorrectSize = 0

  for (const region of regions) {
    const mapPath = path.join(mapDir, `${region.id}.png`)

    if (fs.existsSync(mapPath)) {
      const dims = getPngDimensions(mapPath)
      if (dims && dims.width === TARGET_WIDTH && dims.height === TARGET_HEIGHT) {
        skippedCorrectSize++
        continue
      }
      // Wrong size - will regenerate
    }

    const nodes = getNodesByRegion(region.name)
    queue.push({ region, nodes })
  }

  console.log(`\nRegion Map Generator`)
  console.log(`====================`)
  console.log(`Target size: ${TARGET_WIDTH}x${TARGET_HEIGHT}`)
  console.log(`Skipped: ${skippedCorrectSize} correct size`)
  console.log(`To generate: ${queue.length} maps\n`)

  if (queue.length === 0) {
    console.log('Nothing to do!')
    return
  }

  // Process queue
  for (let i = 0; i < queue.length; i++) {
    const { region, nodes } = queue[i]
    const mapPath = path.join(mapDir, `${region.id}.png`)
    const prompt = buildPrompt(region, nodes)

    console.log(`[${i + 1}/${queue.length}] ${region.name} (${region.id})`)
    console.log(`  Nodes: ${nodes.map(n => n.name).join(', ')}`)

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

        // Resize to exact dimensions
        const resized = await resizeImage(result.imageData, TARGET_WIDTH, TARGET_HEIGHT)
        fs.writeFileSync(mapPath, resized)
        console.log(`  Saved: ${mapPath}`)

        // Save prompt
        prompts[`map_${region.id}`] = prompt
        fs.writeFileSync(promptsPath, JSON.stringify(prompts, null, 2) + '\n')

        // Wait between generations
        if (i < queue.length - 1) {
          console.log('  Waiting 3s...')
          await sleep(3000)
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
