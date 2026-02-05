import { describe, it, expect } from 'vitest'
import {
  parseRegionFile,
  serializeRegionFile,
  toCamelCase,
  addRegionToIndex,
  removeRegionFromIndex,
  addRegionToRegions,
  removeRegionFromRegions
} from '../questSerializer.js'

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

  describe('toCamelCase', () => {
    it('converts simple snake_case to camelCase', () => {
      expect(toCamelCase('whispering_woods')).toBe('whisperingWoods')
    })

    it('converts multi-segment snake_case', () => {
      expect(toCamelCase('old_fort_calindash')).toBe('oldFortCalindash')
    })

    it('handles single word (no underscores)', () => {
      expect(toCamelCase('summit')).toBe('summit')
    })

    it('converts the_summit correctly', () => {
      expect(toCamelCase('the_summit')).toBe('theSummit')
    })

    it('converts gate_to_aquaria correctly', () => {
      expect(toCamelCase('gate_to_aquaria')).toBe('gateToAquaria')
    })

    it('handles already camelCase input by returning it unchanged', () => {
      expect(toCamelCase('whisperingWoods')).toBe('whisperingWoods')
    })
  })

  describe('addRegionToIndex', () => {
    const minimalIndex = `import { nodes as whisperingWoodsNodes } from './whispering_woods.js'
import { nodes as echoingCavernsNodes } from './echoing_caverns.js'

export { regions, superRegions } from './regions.js'
import { regions, superRegions } from './regions.js'

export const questNodes = {
  // Western Veros
  ...whisperingWoodsNodes,
  ...echoingCavernsNodes
}

export function getQuestNode(nodeId) {
  return questNodes[nodeId] || null
}
`

    it('adds import and spread for a new region', () => {
      const result = addRegionToIndex(minimalIndex, 'whisper_lake', 'western_veros')

      // Should have the new import line before the export/import of regions.js
      expect(result).toContain("import { nodes as whisperLakeNodes } from './whisper_lake.js'")

      // Should have the spread in questNodes
      expect(result).toContain('...whisperLakeNodes')
    })

    it('places import before the regions.js export line', () => {
      const result = addRegionToIndex(minimalIndex, 'whisper_lake', 'western_veros')
      const importPos = result.indexOf("import { nodes as whisperLakeNodes }")
      const regionsExportPos = result.indexOf("export { regions, superRegions } from './regions.js'")
      expect(importPos).toBeLessThan(regionsExportPos)
    })

    it('places spread before the closing brace of questNodes', () => {
      const result = addRegionToIndex(minimalIndex, 'whisper_lake', 'western_veros')
      const spreadPos = result.indexOf('...whisperLakeNodes')
      expect(spreadPos).toBeGreaterThan(-1)

      // The spread should appear after the last existing spread
      const lastExistingSpread = result.lastIndexOf('...echoingCavernsNodes')
      expect(spreadPos).toBeGreaterThan(lastExistingSpread)
    })

    it('preserves existing content', () => {
      const result = addRegionToIndex(minimalIndex, 'whisper_lake', 'western_veros')
      expect(result).toContain("import { nodes as whisperingWoodsNodes } from './whispering_woods.js'")
      expect(result).toContain("import { nodes as echoingCavernsNodes } from './echoing_caverns.js'")
      expect(result).toContain('...whisperingWoodsNodes')
      expect(result).toContain('...echoingCavernsNodes')
      expect(result).toContain('export function getQuestNode(nodeId)')
    })

    it('handles multi-word region IDs', () => {
      const result = addRegionToIndex(minimalIndex, 'old_fort_calindash', 'western_veros')
      expect(result).toContain("import { nodes as oldFortCalindashNodes } from './old_fort_calindash.js'")
      expect(result).toContain('...oldFortCalindashNodes')
    })
  })

  describe('removeRegionFromIndex', () => {
    const indexWithThreeRegions = `import { nodes as whisperingWoodsNodes } from './whispering_woods.js'
import { nodes as echoingCavernsNodes } from './echoing_caverns.js'
import { nodes as whisperLakeNodes } from './whisper_lake.js'

export { regions, superRegions } from './regions.js'
import { regions, superRegions } from './regions.js'

export const questNodes = {
  // Western Veros
  ...whisperingWoodsNodes,
  ...echoingCavernsNodes,
  ...whisperLakeNodes
}

export function getQuestNode(nodeId) {
  return questNodes[nodeId] || null
}
`

    it('removes the import line for a region', () => {
      const result = removeRegionFromIndex(indexWithThreeRegions, 'whisper_lake')
      expect(result).not.toContain("import { nodes as whisperLakeNodes }")
    })

    it('removes the spread line for a region', () => {
      const result = removeRegionFromIndex(indexWithThreeRegions, 'whisper_lake')
      expect(result).not.toContain('...whisperLakeNodes')
    })

    it('preserves other regions', () => {
      const result = removeRegionFromIndex(indexWithThreeRegions, 'whisper_lake')
      expect(result).toContain("import { nodes as whisperingWoodsNodes } from './whispering_woods.js'")
      expect(result).toContain("import { nodes as echoingCavernsNodes } from './echoing_caverns.js'")
      expect(result).toContain('...whisperingWoodsNodes')
      expect(result).toContain('...echoingCavernsNodes')
    })

    it('removes a middle region cleanly', () => {
      const result = removeRegionFromIndex(indexWithThreeRegions, 'echoing_caverns')
      expect(result).not.toContain('echoingCaverns')
      expect(result).toContain('whisperingWoodsNodes')
      expect(result).toContain('whisperLakeNodes')
    })

    it('preserves helper functions', () => {
      const result = removeRegionFromIndex(indexWithThreeRegions, 'whisper_lake')
      expect(result).toContain('export function getQuestNode(nodeId)')
    })
  })

  describe('addRegionToRegions', () => {
    const minimalRegions = `import { regionMeta as whisperingWoods } from './whispering_woods.js'
import { regionMeta as echoingCaverns } from './echoing_caverns.js'

export const superRegions = [
  { id: 'western_veros', name: 'Western Veros', description: 'The familiar lands', unlockedByDefault: true }
]

export const regions = [
  // Western Veros
  whisperingWoods,
  echoingCaverns
]
`

    it('adds import for a new region', () => {
      const result = addRegionToRegions(minimalRegions, 'whisper_lake', 'western_veros')
      expect(result).toContain("import { regionMeta as whisperLake } from './whisper_lake.js'")
    })

    it('adds the region variable to the regions array', () => {
      const result = addRegionToRegions(minimalRegions, 'whisper_lake', 'western_veros')
      expect(result).toContain('whisperLake')
      // Should be in the regions array, after the existing entries
      const regionArrayStart = result.indexOf('export const regions = [')
      const whisperLakePos = result.indexOf('whisperLake', regionArrayStart)
      expect(whisperLakePos).toBeGreaterThan(regionArrayStart)
    })

    it('places import before superRegions declaration', () => {
      const result = addRegionToRegions(minimalRegions, 'whisper_lake', 'western_veros')
      const importPos = result.indexOf("import { regionMeta as whisperLake }")
      const superRegionsPos = result.indexOf('export const superRegions')
      expect(importPos).toBeLessThan(superRegionsPos)
    })

    it('preserves existing content', () => {
      const result = addRegionToRegions(minimalRegions, 'whisper_lake', 'western_veros')
      expect(result).toContain("import { regionMeta as whisperingWoods } from './whispering_woods.js'")
      expect(result).toContain("import { regionMeta as echoingCaverns } from './echoing_caverns.js'")
      expect(result).toContain('whisperingWoods,')
      expect(result).toContain('echoingCaverns')
      expect(result).toContain('export const superRegions')
    })

    it('handles multi-word region IDs', () => {
      const result = addRegionToRegions(minimalRegions, 'old_fort_calindash', 'western_veros')
      expect(result).toContain("import { regionMeta as oldFortCalindash } from './old_fort_calindash.js'")
      expect(result).toContain('oldFortCalindash')
    })
  })

  describe('removeRegionFromRegions', () => {
    const regionsWithThree = `import { regionMeta as whisperingWoods } from './whispering_woods.js'
import { regionMeta as echoingCaverns } from './echoing_caverns.js'
import { regionMeta as whisperLake } from './whisper_lake.js'

export const superRegions = [
  { id: 'western_veros', name: 'Western Veros', description: 'The familiar lands', unlockedByDefault: true }
]

export const regions = [
  // Western Veros
  whisperingWoods,
  echoingCaverns,
  whisperLake
]
`

    it('removes the import line for a region', () => {
      const result = removeRegionFromRegions(regionsWithThree, 'whisper_lake')
      expect(result).not.toContain("import { regionMeta as whisperLake }")
    })

    it('removes the entry from the regions array', () => {
      const result = removeRegionFromRegions(regionsWithThree, 'whisper_lake')
      // Should not contain whisperLake as a standalone entry
      // But we need to be careful: whisperingWoods contains 'whisper' too
      const lines = result.split('\n')
      const regionEntryLines = lines.filter(l => l.trim() === 'whisperLake' || l.trim() === 'whisperLake,')
      expect(regionEntryLines).toHaveLength(0)
    })

    it('preserves other regions', () => {
      const result = removeRegionFromRegions(regionsWithThree, 'whisper_lake')
      expect(result).toContain("import { regionMeta as whisperingWoods } from './whispering_woods.js'")
      expect(result).toContain("import { regionMeta as echoingCaverns } from './echoing_caverns.js'")
      expect(result).toContain('whisperingWoods')
      expect(result).toContain('echoingCaverns')
    })

    it('removes a middle region cleanly', () => {
      const result = removeRegionFromRegions(regionsWithThree, 'echoing_caverns')
      expect(result).not.toContain("import { regionMeta as echoingCaverns }")
      const lines = result.split('\n')
      const echoingLines = lines.filter(l => l.trim() === 'echoingCaverns' || l.trim() === 'echoingCaverns,')
      expect(echoingLines).toHaveLength(0)
      expect(result).toContain('whisperingWoods')
      expect(result).toContain('whisperLake')
    })

    it('preserves superRegions', () => {
      const result = removeRegionFromRegions(regionsWithThree, 'whisper_lake')
      expect(result).toContain('export const superRegions')
      expect(result).toContain('western_veros')
    })
  })
})
