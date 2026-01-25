import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMapObject, getMapObject, downloadAsset, waitForCompletion } from '../pixellab.js'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object_id: 'test-123' })
      })

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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'completed',
          download_url: 'https://api.pixellab.ai/download/test-123'
        })
      })

      const result = await getMapObject('test-123')

      expect(result.status).toBe('completed')
      expect(result.download_url).toBeDefined()
    })
  })

  describe('waitForCompletion', () => {
    it('polls until status is completed', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'processing' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'processing' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'completed', download_url: 'http://example.com' })
        })

      const result = await waitForCompletion('test-123', { pollInterval: 10, maxAttempts: 5 })

      expect(result.status).toBe('completed')
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('throws after max attempts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'processing' })
      })

      await expect(waitForCompletion('test-123', { pollInterval: 10, maxAttempts: 2 }))
        .rejects.toThrow('timed out')
    })
  })
})
