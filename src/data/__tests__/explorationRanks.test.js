// src/data/__tests__/explorationRanks.test.js
import { describe, it, expect } from 'vitest'
import {
  RANK_BONUS_PER_LEVEL,
  EXPLORATION_RANKS,
  RANK_UPGRADE_COSTS
} from '../explorationRanks.js'

describe('explorationRanks', () => {
  it('exports RANK_BONUS_PER_LEVEL as 100', () => {
    expect(RANK_BONUS_PER_LEVEL).toBe(100)
  })

  it('exports EXPLORATION_RANKS in order E to S', () => {
    expect(EXPLORATION_RANKS).toEqual(['E', 'D', 'C', 'B', 'A', 'S'])
  })

  it('exports upgrade costs for E through A', () => {
    expect(RANK_UPGRADE_COSTS.E).toEqual({ crests: 1, gold: 1000 })
    expect(RANK_UPGRADE_COSTS.D).toEqual({ crests: 5, gold: 1500 })
    expect(RANK_UPGRADE_COSTS.C).toEqual({ crests: 15, gold: 2250 })
    expect(RANK_UPGRADE_COSTS.B).toEqual({ crests: 50, gold: 3375 })
    expect(RANK_UPGRADE_COSTS.A).toEqual({ crests: 100, gold: 5000 })
  })

  it('does not have upgrade cost for S (max rank)', () => {
    expect(RANK_UPGRADE_COSTS.S).toBeUndefined()
  })
})
