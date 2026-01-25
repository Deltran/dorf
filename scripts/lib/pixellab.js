// Pixellab API client
const API_BASE = 'https://api.pixellab.ai'

function getToken() {
  const token = process.env.PIXELLAB_TOKEN
  if (!token) {
    throw new Error('PIXELLAB_TOKEN environment variable is not set')
  }
  return token
}

export async function createMapObject({ prompt, width, height }) {
  const token = getToken()

  const response = await fetch(`${API_BASE}/mcp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool: 'create_map_object',
      params: {
        description: prompt,
        width,
        height
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Pixellab API error: ${response.status} - ${error}`)
  }

  return response.json()
}

export async function getMapObject(objectId) {
  const token = getToken()

  const response = await fetch(`${API_BASE}/mcp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool: 'get_map_object',
      params: {
        object_id: objectId
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Pixellab API error: ${response.status} - ${error}`)
  }

  return response.json()
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
  // Start generation
  const { object_id } = await createMapObject({ prompt, width, height })

  // Wait for completion
  const result = await waitForCompletion(object_id)

  // Download the image
  const imageData = await downloadAsset(result.download_url)

  return {
    objectId: object_id,
    imageData: Buffer.from(imageData)
  }
}
