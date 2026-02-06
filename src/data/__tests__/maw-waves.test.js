// src/data/__tests__/maw-waves.test.js
import { describe, it, expect } from 'vitest'
import { getWaveConfig, TIER_CONFIG, WAVE_COUNT, BOSS_WAVE } from '../maw/waves.js'

describe('Maw Wave Configuration', () => {
  it('has 11 total waves (10 + boss)', () => {
    expect(WAVE_COUNT).toBe(11)
    expect(BOSS_WAVE).toBe(11)
  })

  it('has 5 difficulty tiers', () => {
    expect(Object.keys(TIER_CONFIG)).toHaveLength(5)
    for (let tier = 1; tier <= 5; tier++) {
      expect(TIER_CONFIG[tier]).toBeTruthy()
      expect(TIER_CONFIG[tier].rewardMultiplier).toBeGreaterThan(0)
      expect(TIER_CONFIG[tier].levelRange).toBeTruthy()
      expect(TIER_CONFIG[tier].levelRange.min).toBeLessThan(TIER_CONFIG[tier].levelRange.max)
    }
  })

  it('getWaveConfig returns config for each wave', () => {
    for (let wave = 1; wave <= 11; wave++) {
      const config = getWaveConfig(wave)
      expect(config).toBeTruthy()
      expect(config.phase).toBeTruthy()
      expect(config.enemyCount).toBeTruthy()
    }
  })

  it('wave phases progress correctly', () => {
    // 1-3: warmup, 4-7: pressure, 8-10: danger, 11: boss
    for (let w = 1; w <= 3; w++) expect(getWaveConfig(w).phase).toBe('warmup')
    for (let w = 4; w <= 7; w++) expect(getWaveConfig(w).phase).toBe('pressure')
    for (let w = 8; w <= 10; w++) expect(getWaveConfig(w).phase).toBe('danger')
    expect(getWaveConfig(11).phase).toBe('boss')
  })

  it('enemy count increases with phase', () => {
    const warmup = getWaveConfig(1).enemyCount
    const pressure = getWaveConfig(5).enemyCount
    const danger = getWaveConfig(9).enemyCount
    expect(warmup.max).toBeLessThanOrEqual(pressure.max)
    expect(pressure.max).toBeLessThanOrEqual(danger.max)
  })

  it('milestone waves identified correctly', () => {
    expect(getWaveConfig(5).isMilestone).toBe(true)
    expect(getWaveConfig(10).isMilestone).toBe(true)
    expect(getWaveConfig(11).isMilestone).toBe(true)
    expect(getWaveConfig(3).isMilestone).toBeFalsy()
  })

  it('dregs rewards scale superlinearly', () => {
    const dregs3 = getWaveConfig(3).dregsReward
    const dregs5 = getWaveConfig(5).dregsReward
    const dregs7 = getWaveConfig(7).dregsReward
    const dregs10 = getWaveConfig(10).dregsReward
    expect(dregs5).toBeGreaterThan(dregs3)
    expect(dregs7).toBeGreaterThan(dregs5)
    expect(dregs10).toBeGreaterThan(dregs7)
  })
})
