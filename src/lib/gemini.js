// Browser-side Gemini image generation client

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

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

/**
 * Generate a map image using the Gemini API.
 *
 * @param {Object} options
 * @param {string} options.prompt - Description of the map to generate
 * @param {number} [options.width=800] - Target image width in pixels
 * @param {number} [options.height=500] - Target image height in pixels
 * @returns {Promise<string>} Data URL of the generated image (data:image/png;base64,...)
 */
export async function generateMapImage({ prompt, width = 800, height = 500 }) {
  const apiKey = getApiKey()
  const model = 'gemini-2.5-flash-image'
  const aspectRatio = getAspectRatio(width, height)

  const response = await fetch(
    `${API_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          aspectRatio
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  // Extract base64 image from response parts
  const candidates = result.candidates || []
  for (const candidate of candidates) {
    const parts = candidate.content?.parts || []
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        // Resize to target dimensions
        return await resizeImage(dataUrl, width, height)
      }
    }
  }

  throw new Error('No image found in Gemini response')
}
