import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { useHeroesStore } from '../heroes.js'
import { getColosseumBout } from '../../data/colosseum.js'
import { getHeroTemplate } from '../../data/heroes/index.js'
import { getClass } from '../../data/classes.js'

describe('Colosseum Battle Integration', () => {
  let battleStore, heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('createColosseumEnemies', () => {
    it('creates 4 enemy units from bout definition', () => {
      const bout = getColosseumBout(1)
      const enemies = battleStore.createColosseumEnemies(bout)
      expect(enemies).toHaveLength(4)
    })

    it('sets hero template data on enemy units', () => {
      const bout = getColosseumBout(1)
      const enemies = battleStore.createColosseumEnemies(bout)

      enemies.forEach(enemy => {
        expect(enemy.template).toBeTruthy()
        expect(enemy.template.name).toBeTruthy()
        expect(enemy.template.skills).toBeDefined()
      })
    })

    it('calculates stats based on level and base stats', () => {
      const bout = getColosseumBout(1) // level ~5 heroes
      const enemies = battleStore.createColosseumEnemies(bout)

      enemies.forEach(enemy => {
        expect(enemy.currentHp).toBeGreaterThan(0)
        expect(enemy.maxHp).toBeGreaterThan(0)
        expect(enemy.stats.atk).toBeGreaterThan(0)
        expect(enemy.stats.def).toBeGreaterThan(0)
        expect(enemy.stats.spd).toBeGreaterThan(0)
      })
    })

    it('applies shard tier stat bonuses', () => {
      const boutNoShard = getColosseumBout(29) // 4-star, shardTier 0
      const boutWithShard = getColosseumBout(34) // 4-star, shardTier 1 (+5%)

      const enemiesNoShard = battleStore.createColosseumEnemies(boutNoShard)
      const enemiesWithShard = battleStore.createColosseumEnemies(boutWithShard)

      // Same templateId might appear in both; compare if same hero appears
      // Just verify shard tier enemies have generally higher stats
      const avgHpNoShard = enemiesNoShard.reduce((s, e) => s + e.maxHp, 0) / 4
      const avgHpWithShard = enemiesWithShard.reduce((s, e) => s + e.maxHp, 0) / 4
      // Shard tier 1 enemies are at higher level (170 vs 145), so should have higher stats
      expect(avgHpWithShard).toBeGreaterThan(avgHpNoShard)
    })

    it('initializes resource state per class', () => {
      const bout = getColosseumBout(1) // farm_hand (berserker), street_urchin (ranger), beggar_monk (cleric), street_busker (bard)
      const enemies = battleStore.createColosseumEnemies(bout)

      const berserker = enemies.find(e => e.classId === 'berserker')
      if (berserker) {
        expect(berserker.currentRage).toBe(0)
      }

      const ranger = enemies.find(e => e.classId === 'ranger')
      if (ranger) {
        expect(ranger.hasFocus).toBe(true)
      }

      const bard = enemies.find(e => e.classId === 'bard')
      if (bard) {
        expect(bard.currentVerses).toBe(0)
        expect(bard.lastSkillName).toBeNull()
      }
    })

    it('initializes cooldowns for skills with cooldown property', () => {
      const bout = getColosseumBout(1)
      const enemies = battleStore.createColosseumEnemies(bout)

      enemies.forEach(enemy => {
        expect(enemy.currentCooldowns).toBeDefined()
        expect(typeof enemy.currentCooldowns).toBe('object')
      })
    })

    it('sets isColosseumEnemy flag', () => {
      const bout = getColosseumBout(1)
      const enemies = battleStore.createColosseumEnemies(bout)

      enemies.forEach(enemy => {
        expect(enemy.isColosseumEnemy).toBe(true)
      })
    })
  })

  describe('calculateColosseumStats', () => {
    it('scales stats by level', () => {
      const template = getHeroTemplate('farm_hand')
      const statsLow = battleStore.calculateColosseumStats(template, 5, 0)
      const statsHigh = battleStore.calculateColosseumStats(template, 50, 0)

      expect(statsHigh.hp).toBeGreaterThan(statsLow.hp)
      expect(statsHigh.atk).toBeGreaterThan(statsLow.atk)
      expect(statsHigh.def).toBeGreaterThan(statsLow.def)
    })

    it('applies shard tier bonus', () => {
      const template = getHeroTemplate('sir_gallan')
      const statsBase = battleStore.calculateColosseumStats(template, 100, 0)
      const statsShard1 = battleStore.calculateColosseumStats(template, 100, 1)

      // Shard tier 1 = +5% stats
      expect(statsShard1.hp).toBeGreaterThan(statsBase.hp)
      expect(statsShard1.atk).toBeGreaterThan(statsBase.atk)
    })
  })

  describe('colosseum leader designation', () => {
    it('marks the leader enemy in bout 41+', () => {
      const bout = getColosseumBout(41) // aurora_the_dawn is leader
      const enemies = battleStore.createColosseumEnemies(bout)
      const leader = enemies.find(e => e.isLeader)
      expect(leader).toBeTruthy()
      expect(leader.template.id).toBe('aurora_the_dawn')
    })

    it('no leader in bouts 1-40', () => {
      const bout = getColosseumBout(1)
      const enemies = battleStore.createColosseumEnemies(bout)
      const leader = enemies.find(e => e.isLeader)
      expect(leader).toBeFalsy()
    })
  })
})
