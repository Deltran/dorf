#!/usr/bin/env node
/**
 * Batch generate 600x1000 portrait battle backgrounds using Gemini API.
 * Run with: node --import ./scripts/lib/register-loader.js scripts/generate-battle-backgrounds.js
 *
 * Only generates for nodes that:
 * - Have battles (not exploration nodes)
 * - Don't have an existing 600x1000 image
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

// --- Import quest nodes ---
// Use dynamic import since it's ESM
async function loadQuestNodes() {
  const { questNodes } = await import('../src/data/quests/index.js')
  return questNodes
}

// --- Build prompt for a node ---
function buildPrompt(node) {
  return `${node.name}. ${node.region}. No labels. RPG battle background. No people. No animals. No monsters. Dark fantasy pixel art. Portrait orientation.`
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

// --- Resize image to exact dimensions using canvas ---
async function resizeImage(base64Data, targetWidth, targetHeight) {
  // For Node.js, use sharp or canvas package
  // Install: npm install sharp
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

  const bgDir = path.resolve(__dirname, '../src/assets/battle_backgrounds')
  const promptsPath = path.resolve(__dirname, '../src/data/assetPrompts.json')

  // Load existing prompts
  let prompts = {}
  if (fs.existsSync(promptsPath)) {
    prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'))
  }

  // Load quest nodes
  const questNodes = await loadQuestNodes()

  // Build queue of nodes needing backgrounds
  const queue = []
  let skippedExploration = 0
  let skippedNoBattles = 0
  let skippedCorrectSize = 0

  for (const [nodeId, node] of Object.entries(questNodes)) {
    // Skip exploration nodes
    if (node.type === 'exploration') {
      skippedExploration++
      continue
    }
    // Skip nodes without battles
    if (!node.battles || node.battles.length === 0) {
      skippedNoBattles++
      continue
    }

    const bgPath = path.join(bgDir, `${nodeId}.png`)

    if (fs.existsSync(bgPath)) {
      const dims = getPngDimensions(bgPath)
      if (dims && dims.width === TARGET_WIDTH && dims.height === TARGET_HEIGHT) {
        skippedCorrectSize++
        continue
      }
      // Wrong size - will regenerate
    }

    queue.push({ id: nodeId, name: node.name, region: node.region })
  }

  console.log(`\nBattle Background Generator`)
  console.log(`===========================`)
  console.log(`Target size: ${TARGET_WIDTH}x${TARGET_HEIGHT}`)
  console.log(`Skipped: ${skippedExploration} exploration, ${skippedNoBattles} no battles, ${skippedCorrectSize} correct size`)
  console.log(`To generate: ${queue.length} backgrounds\n`)

  if (queue.length === 0) {
    console.log('Nothing to do!')
    return
  }

  // Process queue
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i]
    const bgPath = path.join(bgDir, `${node.id}.png`)
    const prompt = buildPrompt(node)

    console.log(`[${i + 1}/${queue.length}] ${node.name} (${node.id})`)

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
        fs.writeFileSync(bgPath, resized)
        console.log(`  Saved: ${bgPath}`)

        // Save prompt
        prompts[`bg_${node.id}`] = prompt
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
