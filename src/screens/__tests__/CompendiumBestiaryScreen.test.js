import { describe, it, expect } from 'vitest'
import { getAllEnemyTemplates, getEnemyTemplate, getSummonedEnemyIds } from '../../data/enemies/index.js'
import { getNodesByRegion } from '../../data/quests/index.js'
import { regions } from '../../data/quests/regions.js'

/**
 * Replicates the bestiary's region-mapping logic (with summon fix)
 * so we can test it matches CompendiumBestiaryScreen's enemiesByRegion.
 */
function buildEnemyRegionMap() {
  const all = getAllEnemyTemplates()
  const enemyRegionMap = {}

  for (const region of regions) {
    const nodes = getNodesByRegion(region.name)
    for (const node of nodes) {
      if (!node.battles) continue
      for (const battle of node.battles) {
        for (const enemyId of (battle.enemies || [])) {
          if (!enemyRegionMap[enemyId]) {
            enemyRegionMap[enemyId] = region.name
          }
          // Also map any enemies this one can summon to the same region
          const template = getEnemyTemplate(enemyId)
          if (template) {
            for (const summonId of getSummonedEnemyIds(template)) {
              if (!enemyRegionMap[summonId]) {
                enemyRegionMap[summonId] = region.name
              }
            }
          }
        }
      }
    }
  }

  return { all, enemyRegionMap }
}

/**
 * Returns only enemies that appear in a known region.
 */
function getVisibleEnemies() {
  const { all, enemyRegionMap } = buildEnemyRegionMap()
  const regionNames = new Set(regions.map(r => r.name))
  return all.filter(e => regionNames.has(enemyRegionMap[e.id]))
}

// Known summonable enemies that must appear in the bestiary
const SUMMONABLE_ENEMIES = [
  'goblin_runt',
  'harpy_chick',
  'skeletal_shard',
  'mire_sprite',
  'coralsworn_knight',
  'juvenile_horror',
  'spawn_of_the_maw'
]

describe('CompendiumBestiaryScreen - enemy region mapping', () => {
  it('should include all enemy templates in some region (no orphans)', () => {
    const { all, enemyRegionMap } = buildEnemyRegionMap()
    const regionNames = new Set(regions.map(r => r.name))

    const orphans = all.filter(e => !regionNames.has(enemyRegionMap[e.id]))

    expect(orphans.map(e => e.id)).toEqual([])
  })

  describe('summonable enemies', () => {
    for (const enemyId of SUMMONABLE_ENEMIES) {
      it(`should map "${enemyId}" to a known region`, () => {
        const { enemyRegionMap } = buildEnemyRegionMap()
        const regionNames = new Set(regions.map(r => r.name))

        expect(regionNames.has(enemyRegionMap[enemyId])).toBe(true)
      })
    }
  })

  it('should have every summonable enemy visible in the bestiary list', () => {
    const visible = getVisibleEnemies()
    const visibleIds = new Set(visible.map(e => e.id))

    for (const enemyId of SUMMONABLE_ENEMIES) {
      expect(visibleIds.has(enemyId), `${enemyId} should be visible`).toBe(true)
    }
  })
})

describe('getSummonedEnemyIds', () => {
  it('should extract templateId from skill.summon', () => {
    const ids = getSummonedEnemyIds(getEnemyTemplate('goblin_commander'))
    expect(ids).toContain('goblin_runt')
  })

  it('should extract enemyId from skill.summon', () => {
    const ids = getSummonedEnemyIds(getEnemyTemplate('lord_coralhart'))
    expect(ids).toContain('coralsworn_knight')
  })

  it('should extract from skill.onKill.summon', () => {
    const ids = getSummonedEnemyIds(getEnemyTemplate('spawn_of_the_maw'))
    expect(ids).toContain('spawn_of_the_maw')
  })

  it('should extract from skill.startOfTurn.summon', () => {
    const ids = getSummonedEnemyIds(getEnemyTemplate('egg_cluster'))
    expect(ids).toContain('juvenile_horror')
  })

  it('should return empty array for enemies with no summons', () => {
    const ids = getSummonedEnemyIds(getEnemyTemplate('forest_wolf'))
    expect(ids).toEqual([])
  })
})
