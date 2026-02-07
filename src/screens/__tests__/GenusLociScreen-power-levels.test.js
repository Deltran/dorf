/**
 * @vitest-environment happy-dom
 *
 * Acceptance tests for Genus Loci power level row layout.
 * Power level nodes must break into rows of max 5.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GenusLociScreen from '../GenusLociScreen.vue'
import { useGenusLociStore } from '../../stores'

// Mock asset imports
vi.mock('../../assets/enemies/*_portrait.png', () => ({}))
vi.mock('../../assets/battle_backgrounds/*.png', () => ({}))

// Mock quest data to avoid import issues
vi.mock('../../data/quests/index.js', () => ({
  getAllQuestNodes: () => []
}))

const LEVELS_PER_ROW = 5

describe('GenusLociScreen - Power Level Row Layout', () => {
  let pinia
  let genusLociStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    genusLociStore = useGenusLociStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function mountScreen(bossId) {
    return mount(GenusLociScreen, {
      global: {
        plugins: [pinia],
        stubs: {
          Teleport: true
        }
      },
      props: {
        selectedBossId: bossId
      }
    })
  }

  describe('Row chunking logic', () => {
    it('should show 1 row when there are 1-5 levels', () => {
      // Level 1 is always available (highest cleared = 0 means level 1 available)
      const wrapper = mountScreen('great_troll')

      const rows = wrapper.findAll('.level-row')
      expect(rows).toHaveLength(1)

      const nodes = wrapper.findAll('.level-node')
      expect(nodes).toHaveLength(1)
    })

    it('should show 1 row with exactly 5 nodes when 5 levels are available', () => {
      // Clear levels 1-4 so levels 1-5 are available
      genusLociStore.progress = {
        great_troll: { unlocked: true, highestCleared: 4, firstClearClaimed: true }
      }

      const wrapper = mountScreen('great_troll')

      const rows = wrapper.findAll('.level-row')
      expect(rows).toHaveLength(1)

      const nodes = wrapper.findAll('.level-node')
      expect(nodes).toHaveLength(5)
    })

    it('should break into 2 rows when there are 6 levels', () => {
      genusLociStore.progress = {
        great_troll: { unlocked: true, highestCleared: 5, firstClearClaimed: true }
      }

      const wrapper = mountScreen('great_troll')

      const rows = wrapper.findAll('.level-row')
      expect(rows).toHaveLength(2)

      // First row should have 5 nodes
      const firstRowNodes = rows[0].findAll('.level-node')
      expect(firstRowNodes).toHaveLength(5)

      // Second row should have 1 node
      const secondRowNodes = rows[1].findAll('.level-node')
      expect(secondRowNodes).toHaveLength(1)
    })

    it('should break into 2 rows when there are 10 levels', () => {
      genusLociStore.progress = {
        great_troll: { unlocked: true, highestCleared: 9, firstClearClaimed: true }
      }

      const wrapper = mountScreen('great_troll')

      const rows = wrapper.findAll('.level-row')
      expect(rows).toHaveLength(2)

      // Both rows should have exactly 5 nodes
      expect(rows[0].findAll('.level-node')).toHaveLength(5)
      expect(rows[1].findAll('.level-node')).toHaveLength(5)
    })

    it('should break into 4 rows when all 20 levels are available', () => {
      genusLociStore.progress = {
        great_troll: { unlocked: true, highestCleared: 19, firstClearClaimed: true }
      }

      const wrapper = mountScreen('great_troll')

      const rows = wrapper.findAll('.level-row')
      expect(rows).toHaveLength(4)

      // All rows should have exactly 5 nodes
      rows.forEach(row => {
        expect(row.findAll('.level-node')).toHaveLength(5)
      })
    })

    it('should never have more than 5 nodes in a single row', () => {
      // Test with 13 levels (should be 5, 5, 3)
      genusLociStore.progress = {
        great_troll: { unlocked: true, highestCleared: 12, firstClearClaimed: true }
      }

      const wrapper = mountScreen('great_troll')

      const rows = wrapper.findAll('.level-row')
      rows.forEach(row => {
        const nodeCount = row.findAll('.level-node').length
        expect(nodeCount).toBeLessThanOrEqual(LEVELS_PER_ROW)
      })
    })

    it('should have the last row with fewer nodes when levels dont divide evenly', () => {
      // 7 levels → rows of 5 and 2
      genusLociStore.progress = {
        great_troll: { unlocked: true, highestCleared: 6, firstClearClaimed: true }
      }

      const wrapper = mountScreen('great_troll')

      const rows = wrapper.findAll('.level-row')
      expect(rows).toHaveLength(2)
      expect(rows[0].findAll('.level-node')).toHaveLength(5)
      expect(rows[1].findAll('.level-node')).toHaveLength(2)
    })
  })

  describe('Level ordering across rows', () => {
    it('should place levels in sequential order left-to-right, top-to-bottom', () => {
      genusLociStore.progress = {
        great_troll: { unlocked: true, highestCleared: 11, firstClearClaimed: true }
      }

      const wrapper = mountScreen('great_troll')

      const allNodes = wrapper.findAll('.level-node .node-number')
      const levelNumbers = allNodes.map(n => parseInt(n.text()))

      // Should be 1, 2, 3, ..., 12 in order
      expect(levelNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    })

    it('should have levels 1-5 in first row and 6-10 in second row', () => {
      genusLociStore.progress = {
        great_troll: { unlocked: true, highestCleared: 9, firstClearClaimed: true }
      }

      const wrapper = mountScreen('great_troll')

      const rows = wrapper.findAll('.level-row')

      const firstRowLevels = rows[0].findAll('.node-number').map(n => parseInt(n.text()))
      expect(firstRowLevels).toEqual([1, 2, 3, 4, 5])

      const secondRowLevels = rows[1].findAll('.node-number').map(n => parseInt(n.text()))
      expect(secondRowLevels).toEqual([6, 7, 8, 9, 10])
    })
  })

  describe('All levels are rendered', () => {
    it('should render every available level exactly once', () => {
      genusLociStore.progress = {
        great_troll: { unlocked: true, highestCleared: 14, firstClearClaimed: true }
      }

      const wrapper = mountScreen('great_troll')

      const allNodes = wrapper.findAll('.level-node')
      expect(allNodes).toHaveLength(15) // levels 1-15

      const levelNumbers = allNodes.map(n => parseInt(n.find('.node-number').text()))
      const expectedLevels = Array.from({ length: 15 }, (_, i) => i + 1)
      expect(levelNumbers).toEqual(expectedLevels)
    })
  })

  describe('Node interaction still works across rows', () => {
    it('should select a node in the second row', async () => {
      genusLociStore.progress = {
        great_troll: { unlocked: true, highestCleared: 7, firstClearClaimed: true }
      }

      const wrapper = mountScreen('great_troll')

      // Click level 7 (in second row)
      const rows = wrapper.findAll('.level-row')
      const secondRowNodes = rows[1].findAll('.level-node')
      await secondRowNodes[1].trigger('click') // level 7

      // Should show as selected
      expect(secondRowNodes[1].classes()).toContain('selected')
    })

    it('should show level detail card when selecting a node in any row', async () => {
      genusLociStore.progress = {
        great_troll: { unlocked: true, highestCleared: 9, firstClearClaimed: true }
      }

      const wrapper = mountScreen('great_troll')

      // Click level 8 (in second row)
      const allNodes = wrapper.findAll('.level-node')
      await allNodes[7].trigger('click') // 0-indexed, so index 7 = level 8

      const levelDetail = wrapper.find('.level-detail')
      expect(levelDetail.exists()).toBe(true)
      expect(levelDetail.text()).toContain('Lv.8')
    })
  })
})
