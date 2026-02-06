// src/data/maw/waves.js

export const WAVE_COUNT = 11
export const BOSS_WAVE = 11

export const TIER_CONFIG = {
  1: { levelRange: { min: 10, max: 30 }, rewardMultiplier: 1, unlockCondition: null },
  2: { levelRange: { min: 25, max: 55 }, rewardMultiplier: 1.5, unlockCondition: { tier: 1, cleared: true } },
  3: { levelRange: { min: 50, max: 90 }, rewardMultiplier: 2, unlockCondition: { tier: 2, cleared: true } },
  4: { levelRange: { min: 80, max: 140 }, rewardMultiplier: 3, unlockCondition: { tier: 3, cleared: true } },
  5: { levelRange: { min: 130, max: 200 }, rewardMultiplier: 4, unlockCondition: { tier: 4, cleared: true } }
}

const waveConfigs = {
  1:  { phase: 'warmup',   enemyCount: { min: 1, max: 2 }, dregsReward: 2,  goldReward: 20 },
  2:  { phase: 'warmup',   enemyCount: { min: 1, max: 2 }, dregsReward: 3,  goldReward: 25 },
  3:  { phase: 'warmup',   enemyCount: { min: 1, max: 2 }, dregsReward: 5,  goldReward: 30 },
  4:  { phase: 'pressure', enemyCount: { min: 2, max: 3 }, dregsReward: 7,  goldReward: 30 },
  5:  { phase: 'pressure', enemyCount: { min: 2, max: 3 }, dregsReward: 10, goldReward: 35, isMilestone: true },
  6:  { phase: 'pressure', enemyCount: { min: 2, max: 3 }, dregsReward: 12, goldReward: 35 },
  7:  { phase: 'pressure', enemyCount: { min: 2, max: 3 }, dregsReward: 18, goldReward: 40 },
  8:  { phase: 'danger',   enemyCount: { min: 3, max: 4 }, dregsReward: 22, goldReward: 40 },
  9:  { phase: 'danger',   enemyCount: { min: 3, max: 4 }, dregsReward: 26, goldReward: 45 },
  10: { phase: 'danger',   enemyCount: { min: 3, max: 4 }, dregsReward: 30, goldReward: 50, isMilestone: true },
  11: { phase: 'boss',     enemyCount: { min: 1, max: 1 }, dregsReward: 50, goldReward: 100, isMilestone: true }
}

export function getWaveConfig(wave) {
  return waveConfigs[wave] || null
}
