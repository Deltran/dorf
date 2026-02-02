// Browser-side Gemini image generation client

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

// Model for image generation
const IMAGE_MODELS = [
  'gemini-2.5-flash-image'
]

function getApiKey() {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) {
    throw new Error('VITE_GEMINI_API_KEY is not set. Add it to your .env file.')
  }
  return key
}

/**
 * Pick the closest Gemini aspect ratio for target dimensions.
 */
function getAspectRatio(width, height) {
  const ratio = width / height
  // Gemini supports: 1:1, 16:9, 9:16, 4:3, 3:4
  if (Math.abs(ratio - 1) < 0.1) return '1:1'
  if (ratio > 1.5) return '16:9'
  if (ratio < 0.67) return '9:16'
  if (ratio > 1) return '4:3'
  return '3:4'
}

/**
 * Resize an image data URL to exact target dimensions using canvas.
 */
function resizeImage(dataUrl, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
        resolve(canvas.toDataURL('image/png'))
      } catch (e) {
        reject(new Error('Failed to resize image: ' + e.message))
      }
    }
    img.onerror = () => reject(new Error('Failed to load image for resize'))
    img.src = dataUrl
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Try a single generateContent call. Returns the response or throws.
 */
async function callGenerateContent(model, apiKey, prompt, aspectRatio) {
  const response = await fetch(
    `${API_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: prompt }] }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio }
        }
      })
    }
  )

  if (response.status === 429) {
    // Parse retry delay from response if available
    const errorBody = await response.text()
    const retryMatch = errorBody.match(/"retryDelay":\s*"(\d+)s"/)
    const delaySec = retryMatch ? parseInt(retryMatch[1], 10) : 60
    throw { status: 429, delaySec, errorBody, model }
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw { status: response.status, errorBody: errorText, model }
  }

  return response.json()
}

/**
 * Generate a map image using the Gemini API.
 * Tries multiple models with retry logic for rate limits.
 *
 * @param {Object} options
 * @param {string} options.prompt - Description of the map to generate
 * @param {number} [options.width=800] - Target image width in pixels
 * @param {number} [options.height=500] - Target image height in pixels
 * @param {function} [options.onStatus] - Optional callback for status messages
 * @returns {Promise<string>} Data URL of the generated image (data:image/png;base64,...)
 */
export async function generateMapImage({ prompt, width = 800, height = 500, onStatus }) {
  const apiKey = getApiKey()
  const aspectRatio = getAspectRatio(width, height)
  const errors = []

  for (const model of IMAGE_MODELS) {
    // Try each model with one retry for 429
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) {
          onStatus?.(`Retrying ${model}...`)
        } else if (errors.length > 0) {
          onStatus?.(`Trying ${model}...`)
        }

        const result = await callGenerateContent(model, apiKey, prompt, aspectRatio)

        // Extract base64 image from response parts
        const candidates = result.candidates || []
        for (const candidate of candidates) {
          const parts = candidate.content?.parts || []
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
              const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
              return await resizeImage(dataUrl, width, height)
            }
          }
        }

        throw { status: 0, errorBody: 'No image found in response', model }
      } catch (err) {
        if (err.status === 429 && attempt === 0) {
          const waitSec = Math.min(err.delaySec || 60, 90)
          onStatus?.(`Rate limited on ${model}. Waiting ${waitSec}s...`)
          await sleep(waitSec * 1000)
          continue
        }
        errors.push(err)
        break // Try next model
      }
    }
  }

  // All models failed
  const lastErr = errors[errors.length - 1]
  const details = lastErr?.errorBody || 'Unknown error'
  throw new Error(
    `Image generation failed on all models. Last error (${lastErr?.model}): ${details}`
  )
}
