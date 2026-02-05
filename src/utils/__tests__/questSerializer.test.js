import { describe, it, expect } from 'vitest'
import { parseRegionFile } from '../questSerializer.js'

describe('questSerializer', () => {
  describe('parseRegionFile', () => {
    it('parses a region file with imports, regionMeta, and multiple nodes', () => {
      const fileContent = `import testRegionMap from '../../assets/maps/test_region.png'

export const regionMeta = {
  id: 'test_region',
  name: 'Test Region',
  description: 'A test region for unit tests.',
  superRegion: 'western_veros',
  startNode: 'test_01',
  width: 600,
  height: 1000,
  backgroundColor: '#1a2f1a',
  backgroundImage: testRegionMap
}

export const nodes = {
  test_01: {
    id: 'test_01',
    name: 'First Node',
    region: 'Test Region',
    x: 100,
    y: 200,
    battles: [
      { enemies: ['goblin_scout', 'goblin_scout'] },
      { enemies: ['forest_wolf'] }
    ],
    connections: ['test_02'],
    rewards: { gems: 50, gold: 100, exp: 80 },
    firstClearBonus: { gems: 30 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 1, chance: 0.8 }
    ]
  },
  test_02: {
    id: 'test_02',
    name: 'Second Node',
    region: 'Test Region',
    x: 300,
    y: 400,
    battles: [
      { enemies: ['dire_wolf'] }
    ],
    connections: [],
    rewards: { gems: 80, gold: 200, exp: 150 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.5 }
    ]
  }
}
`

      const result = parseRegionFile(fileContent)

      // importLines extracted
      expect(result.importLines).toEqual([
        "import testRegionMap from '../../assets/maps/test_region.png'"
      ])

      // regionMeta fields correct
      expect(result.regionMeta.id).toBe('test_region')
      expect(result.regionMeta.name).toBe('Test Region')
      expect(result.regionMeta.description).toBe('A test region for unit tests.')
      expect(result.regionMeta.superRegion).toBe('western_veros')
      expect(result.regionMeta.startNode).toBe('test_01')
      expect(result.regionMeta.width).toBe(600)
      expect(result.regionMeta.height).toBe(1000)
      expect(result.regionMeta.backgroundColor).toBe('#1a2f1a')

      // backgroundImage stripped (it's an import reference, not a real value)
      expect(result.regionMeta.backgroundImage).toBeUndefined()

      // nodes parsed with correct structure
      expect(Object.keys(result.nodes)).toEqual(['test_01', 'test_02'])

      const node1 = result.nodes.test_01
      expect(node1.id).toBe('test_01')
      expect(node1.name).toBe('First Node')
      expect(node1.region).toBe('Test Region')
      expect(node1.x).toBe(100)
      expect(node1.y).toBe(200)
      expect(node1.battles).toHaveLength(2)
      expect(node1.battles[0].enemies).toEqual(['goblin_scout', 'goblin_scout'])
      expect(node1.connections).toEqual(['test_02'])
      expect(node1.rewards).toEqual({ gems: 50, gold: 100, exp: 80 })
      expect(node1.firstClearBonus).toEqual({ gems: 30 })
      expect(node1.itemDrops).toHaveLength(1)
      expect(node1.itemDrops[0]).toEqual({ itemId: 'tome_small', min: 1, max: 1, chance: 0.8 })

      const node2 = result.nodes.test_02
      expect(node2.id).toBe('test_02')
      expect(node2.name).toBe('Second Node')
      expect(node2.connections).toEqual([])
      expect(node2.rewards.gems).toBe(80)
    })

    it('parses a genus loci node', () => {
      const fileContent = `import denMap from '../../assets/maps/den.png'

export const regionMeta = {
  id: 'den_region',
  name: 'Den Region',
  description: 'A den with a boss.',
  superRegion: 'western_veros',
  startNode: 'den_01',
  width: 600,
  height: 1000,
  backgroundColor: '#2a3a2a',
  backgroundImage: denMap
}

export const nodes = {
  den_01: {
    id: 'den_01',
    name: 'Entrance',
    region: 'Den Region',
    x: 150,
    y: 800,
    battles: [
      { enemies: ['mountain_giant', 'harpy'] }
    ],
    connections: ['den_boss'],
    rewards: { gems: 95, gold: 420, exp: 360 },
    firstClearBonus: { gems: 100 },
    itemDrops: []
  },
  den_boss: {
    id: 'den_boss',
    name: 'The Boss Lair',
    region: 'Den Region',
    x: 220,
    y: 120,
    type: 'genusLoci',
    genusLociId: 'great_troll',
    connections: []
  }
}
`

      const result = parseRegionFile(fileContent)

      const bossNode = result.nodes.den_boss
      expect(bossNode.type).toBe('genusLoci')
      expect(bossNode.genusLociId).toBe('great_troll')
      expect(bossNode.id).toBe('den_boss')
      expect(bossNode.name).toBe('The Boss Lair')
      expect(bossNode.x).toBe(220)
      expect(bossNode.y).toBe(120)
      expect(bossNode.connections).toEqual([])

      // Regular node should not have genusLoci fields
      const regularNode = result.nodes.den_01
      expect(regularNode.type).toBeUndefined()
      expect(regularNode.genusLociId).toBeUndefined()
      expect(regularNode.battles).toHaveLength(1)
    })

    it('parses a file with no imports', () => {
      const fileContent = `export const regionMeta = {
  id: 'simple_region',
  name: 'Simple Region',
  description: 'No imports here.',
  superRegion: 'eastern_veros',
  startNode: 'simple_01',
  width: 400,
  height: 600,
  backgroundColor: '#1a1a2f'
}

export const nodes = {
  simple_01: {
    id: 'simple_01',
    name: 'Only Node',
    region: 'Simple Region',
    x: 200,
    y: 300,
    battles: [
      { enemies: ['goblin_scout'] }
    ],
    connections: [],
    rewards: { gems: 30, gold: 50, exp: 40 },
    firstClearBonus: { gems: 20 },
    itemDrops: []
  }
}
`

      const result = parseRegionFile(fileContent)

      // importLines should be empty array
      expect(result.importLines).toEqual([])

      // regionMeta should still parse correctly
      expect(result.regionMeta.id).toBe('simple_region')
      expect(result.regionMeta.name).toBe('Simple Region')
      expect(result.regionMeta.width).toBe(400)
      expect(result.regionMeta.height).toBe(600)

      // backgroundImage should not exist (no import, no backgroundImage line)
      expect(result.regionMeta.backgroundImage).toBeUndefined()

      // nodes should parse correctly
      expect(Object.keys(result.nodes)).toEqual(['simple_01'])
      expect(result.nodes.simple_01.name).toBe('Only Node')
    })
  })
})
