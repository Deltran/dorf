import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMapObject, getMapObject, downloadAsset, waitForCompletion } from '../pixellab.js'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper to create mock response with both text() and json() methods
function mockResponse(data, ok = true) {
  const text = JSON.stringify(data)
  return {
    ok,
    text: async () => text,
    json: async () => data
  }
}

describe('pixellab API client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PIXELLAB_TOKEN = 'test-token'
  })

  afterEach(() => {
    delete process.env.PIXELLAB_TOKEN
  })

  describe('createMapObject', () => {
    it('sends correct request to API', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        background_job_id: 'job-123',
        object_id: 'test-123',
        status: 'queued'
      }))

      const result = await createMapObject({
        prompt: 'A goblin. High fantasy.',
        width: 64,
        height: 64
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('pixellab'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )
      expect(result.object_id).toBe('test-123')
    })

    it('throws if no token configured', async () => {
      delete process.env.PIXELLAB_TOKEN

      await expect(createMapObject({ prompt: 'test', width: 64, height: 64 }))
        .rejects.toThrow('PIXELLAB_TOKEN')
    })
  })

  describe('getMapObject', () => {
    it('returns object status and download URL', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        status: 'completed',
        last_response: {
          image: { base64: 'abc123', type: 'base64' }
        }
      }))

      const result = await getMapObject('test-123')

      expect(result.status).toBe('completed')
      expect(result.last_response.image.base64).toBeDefined()
    })
  })

  describe('waitForCompletion', () => {
    it('polls until status is completed', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ status: 'processing' }))
        .mockResolvedValueOnce(mockResponse({ status: 'processing' }))
        .mockResolvedValueOnce(mockResponse({
          status: 'completed',
          last_response: { image: { base64: 'abc' } }
        }))

      const result = await waitForCompletion('test-123', { pollInterval: 10, maxAttempts: 5 })

      expect(result.status).toBe('completed')
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('throws after max attempts', async () => {
      mockFetch.mockResolvedValue(mockResponse({ status: 'processing' }))

      await expect(waitForCompletion('test-123', { pollInterval: 10, maxAttempts: 2 }))
        .rejects.toThrow('timed out')
    })
  })
})
