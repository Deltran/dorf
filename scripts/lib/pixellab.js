// Pixellab API client - uses v2 REST API
const API_BASE = 'https://api.pixellab.ai/v2'

function getToken() {
  const token = process.env.PIXELLAB_TOKEN
  if (!token) {
    throw new Error('PIXELLAB_TOKEN environment variable is not set')
  }
  return token
}

export async function createMapObject({ prompt, width, height }) {
  const token = getToken()

  const response = await fetch(`${API_BASE}/map-objects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: prompt,
      image_size: {
        width,
        height
      }
    })
  })

  const responseText = await response.text()

  // Debug: log raw response
  if (process.env.DEBUG_PIXELLAB) {
    console.log('Pixellab raw response:', responseText)
  }

  if (!response.ok) {
    throw new Error(`Pixellab API error: ${response.status} - ${responseText}`)
  }

  const jsonResponse = JSON.parse(responseText)

  if (jsonResponse.success === false) {
    throw new Error(`Pixellab API error: ${jsonResponse.error || JSON.stringify(jsonResponse)}`)
  }

  return jsonResponse.data || jsonResponse
}

export async function getBackgroundJob(jobId) {
  const token = getToken()

  const response = await fetch(`${API_BASE}/background-jobs/${jobId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  const responseText = await response.text()

  // Debug: log raw response
  if (process.env.DEBUG_PIXELLAB) {
    console.log('Background job response:', responseText.substring(0, 1000))
  }

  if (!response.ok) {
    throw new Error(`Pixellab API error: ${response.status} - ${responseText}`)
  }

  const jsonResponse = JSON.parse(responseText)

  if (jsonResponse.success === false) {
    throw new Error(`Pixellab API error: ${jsonResponse.error || JSON.stringify(jsonResponse)}`)
  }

  return jsonResponse.data || jsonResponse
}

// Keep for backwards compat with tests
export async function getMapObject(objectId) {
  return getBackgroundJob(objectId)
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
  // Start generation - returns background_job_id, object_id, and status: "queued"
  const result = await createMapObject({ prompt, width, height })

  // Debug log
  if (process.env.DEBUG_PIXELLAB) {
    console.log('Create result:', JSON.stringify(result, null, 2))
  }

  // Check if we got image data directly (base64)
  if (result.image) {
    const imageData = Buffer.from(result.image, 'base64')
    return { objectId: result.object_id || 'direct', imageData }
  }

  // v2 API returns background_job_id for polling
  const jobId = result.background_job_id
  const objectId = result.object_id

  if (jobId) {
    // Poll for completion using background job ID
    const completed = await waitForCompletion(jobId)

    if (process.env.DEBUG_PIXELLAB) {
      console.log('Completed result:', JSON.stringify(completed, null, 2))
    }

    // Check various ways the image might be returned
    // v2 API returns image in last_response.image.base64
    if (completed.last_response?.image?.base64) {
      const imageData = Buffer.from(completed.last_response.image.base64, 'base64')
      return { objectId, imageData }
    }

    if (completed.image?.base64) {
      const imageData = Buffer.from(completed.image.base64, 'base64')
      return { objectId, imageData }
    }

    if (completed.image && typeof completed.image === 'string') {
      const imageData = Buffer.from(completed.image, 'base64')
      return { objectId, imageData }
    }

    if (completed.download_url) {
      const imageData = await downloadAsset(completed.download_url)
      return { objectId, imageData: Buffer.from(imageData) }
    }

    throw new Error('No image in completed response: ' + JSON.stringify(completed))
  }

  // If we got a download URL directly
  if (result.download_url) {
    const imageData = await downloadAsset(result.download_url)
    return { objectId: result.object_id || 'direct', imageData: Buffer.from(imageData) }
  }

  throw new Error('Unexpected response format from Pixellab API: ' + JSON.stringify(result))
}
