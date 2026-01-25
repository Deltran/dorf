// Browser-side PixelLab API client
// Mirrors scripts/lib/pixellab.js but uses browser fetch and Vite env vars

const API_BASE = 'https://api.pixellab.ai/v2'

function getToken() {
  const token = import.meta.env.VITE_PIXELLAB_TOKEN
  if (!token) {
    throw new Error(
      'VITE_PIXELLAB_TOKEN is not set. Add it to your .env file.'
    )
  }
  return token
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function createMapObject({ prompt, width, height }) {
  const token = getToken()

  const response = await fetch(`${API_BASE}/map-objects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: prompt,
      image_size: { width, height },
    }),
  })

  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(`PixelLab API error: ${response.status} - ${responseText}`)
  }

  const jsonResponse = JSON.parse(responseText)

  if (jsonResponse.success === false) {
    throw new Error(
      `PixelLab API error: ${jsonResponse.error || JSON.stringify(jsonResponse)}`
    )
  }

  return jsonResponse.data || jsonResponse
}

async function pollBackgroundJob(jobId) {
  const token = getToken()

  const response = await fetch(`${API_BASE}/background-jobs/${jobId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(`PixelLab API error: ${response.status} - ${responseText}`)
  }

  const jsonResponse = JSON.parse(responseText)

  if (jsonResponse.success === false) {
    throw new Error(
      `PixelLab API error: ${jsonResponse.error || JSON.stringify(jsonResponse)}`
    )
  }

  return jsonResponse.data || jsonResponse
}

function extractBase64DataUrl(completed) {
  // Check various ways the image might be returned
  // v2 API returns image in last_response.image.base64
  if (completed.last_response?.image?.base64) {
    return `data:image/png;base64,${completed.last_response.image.base64}`
  }

  if (completed.image?.base64) {
    return `data:image/png;base64,${completed.image.base64}`
  }

  if (completed.image && typeof completed.image === 'string') {
    return `data:image/png;base64,${completed.image}`
  }

  return null
}

/**
 * Generate a hero image using the PixelLab API.
 *
 * @param {Object} options
 * @param {string} options.prompt - Description of the image to generate
 * @param {number} [options.width=64] - Image width in pixels
 * @param {number} [options.height=64] - Image height in pixels
 * @returns {Promise<string>} Data URL of the generated image (data:image/png;base64,...)
 */
export async function generateHeroImage({ prompt, width = 64, height = 64 }) {
  const result = await createMapObject({ prompt, width, height })

  // Check if we got image data directly (base64 string)
  if (result.image && typeof result.image === 'string') {
    return `data:image/png;base64,${result.image}`
  }

  // v2 API returns background_job_id for async generation
  const jobId = result.background_job_id
  if (jobId) {
    const pollInterval = 10_000 // 10 seconds
    const maxAttempts = 60

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const completed = await pollBackgroundJob(jobId)

      if (completed.status === 'completed') {
        const dataUrl = extractBase64DataUrl(completed)
        if (dataUrl) {
          return dataUrl
        }
        throw new Error(
          'No image in completed response: ' + JSON.stringify(completed)
        )
      }

      if (completed.status === 'failed') {
        throw new Error(
          `Generation failed: ${completed.error || 'Unknown error'}`
        )
      }

      await sleep(pollInterval)
    }

    throw new Error('Generation timed out')
  }

  throw new Error(
    'Unexpected response format from PixelLab API: ' + JSON.stringify(result)
  )
}
