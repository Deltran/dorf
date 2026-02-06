import { describe, it, expect } from 'vitest'
import { getCropSize, getDefaultCropPosition, clampCropPosition } from '../portraitCrop.js'

describe('portraitCrop utilities', () => {
  describe('getCropSize', () => {
    it('returns 1/4 of source dimensions for 64x64', () => {
      expect(getCropSize(64, 64)).toEqual({ width: 32, height: 32 })
    })

    it('returns 1/4 of source dimensions for 128x128', () => {
      expect(getCropSize(128, 128)).toEqual({ width: 64, height: 64 })
    })

    it('returns 1/4 of source dimensions for non-square', () => {
      expect(getCropSize(128, 64)).toEqual({ width: 64, height: 32 })
    })

    it('floors fractional results', () => {
      expect(getCropSize(100, 100)).toEqual({ width: 50, height: 50 })
      expect(getCropSize(65, 65)).toEqual({ width: 32, height: 32 })
    })
  })

  describe('getDefaultCropPosition', () => {
    it('centers horizontally and places at upper-third vertically for 64x64 source', () => {
      const pos = getDefaultCropPosition(64, 64, 32, 32)
      expect(pos.x).toBe(16)
      expect(pos.y).toBe(5)
    })

    it('centers horizontally and places at upper-third vertically for 128x128 source', () => {
      const pos = getDefaultCropPosition(128, 128, 64, 64)
      expect(pos.x).toBe(32)
      expect(pos.y).toBe(10)
    })

    it('clamps to 0 when crop is larger than upper-third allows', () => {
      const pos = getDefaultCropPosition(32, 32, 16, 16)
      expect(pos.y).toBeGreaterThanOrEqual(0)
    })
  })

  describe('clampCropPosition', () => {
    it('returns position unchanged when within bounds', () => {
      expect(clampCropPosition(10, 10, 32, 32, 64, 64)).toEqual({ x: 10, y: 10 })
    })

    it('clamps negative x to 0', () => {
      expect(clampCropPosition(-5, 10, 32, 32, 64, 64)).toEqual({ x: 0, y: 10 })
    })

    it('clamps negative y to 0', () => {
      expect(clampCropPosition(10, -5, 32, 32, 64, 64)).toEqual({ x: 10, y: 0 })
    })

    it('clamps x when crop box would exceed right edge', () => {
      expect(clampCropPosition(40, 10, 32, 32, 64, 64)).toEqual({ x: 32, y: 10 })
    })

    it('clamps y when crop box would exceed bottom edge', () => {
      expect(clampCropPosition(10, 40, 32, 32, 64, 64)).toEqual({ x: 10, y: 32 })
    })

    it('clamps both axes simultaneously', () => {
      expect(clampCropPosition(-5, 100, 32, 32, 64, 64)).toEqual({ x: 0, y: 32 })
    })

    it('works with 128x128 source and 64x64 crop', () => {
      expect(clampCropPosition(70, 70, 64, 64, 128, 128)).toEqual({ x: 64, y: 64 })
    })
  })
})
