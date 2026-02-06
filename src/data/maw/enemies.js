// src/data/maw/enemies.js
import { getAllEnemyTemplates } from '../enemies/index.js'
import { getWaveConfig, TIER_CONFIG } from './waves.js'

// Enemy pool for The Maw — draw from existing templates
// Exclude summoned enemies and Genus Loci bosses
function getEnemyPool() {
  return getAllEnemyTemplates().filter(e =>
    !e.isSummon && !e.isGenusLoci
  )
}

export function generateWaveEnemies(rng, wave, tier) {
  const config = getWaveConfig(wave)
  const tierConfig = TIER_CONFIG[tier]
  const pool = getEnemyPool()

  if (pool.length === 0) return []

  const enemyCount = rng.int(config.enemyCount.min, config.enemyCount.max)
  const levelRange = tierConfig.levelRange
  // Scale level within tier range based on wave progression
  const waveProgress = wave / 11
  const baseLevel = Math.floor(levelRange.min + (levelRange.max - levelRange.min) * waveProgress)

  const enemies = []
  for (let i = 0; i < enemyCount; i++) {
    const template = rng.pick(pool)
    const level = baseLevel + rng.int(-2, 2)
    enemies.push({
      templateId: template.id,
      level: Math.max(1, level)
    })
  }

  return enemies
}
