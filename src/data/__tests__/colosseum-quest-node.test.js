import { describe, it, expect } from 'vitest'
import { nodes } from '../quests/whisper_lake.js'

describe('Colosseum Quest Node', () => {
  it('has lake_colosseum node', () => {
    expect(nodes.lake_colosseum).toBeDefined()
  })

  it('has correct region', () => {
    expect(nodes.lake_colosseum.region).toBe('Whisper Lake')
  })

  it('has the unlocks: colosseum property', () => {
    expect(nodes.lake_colosseum.unlocks).toBe('colosseum')
  })

  it('has battles defined', () => {
    expect(nodes.lake_colosseum.battles).toBeDefined()
    expect(nodes.lake_colosseum.battles.length).toBeGreaterThan(0)
  })

  it('has rewards', () => {
    expect(nodes.lake_colosseum.rewards).toBeDefined()
    expect(nodes.lake_colosseum.rewards.gems).toBe(100)
    expect(nodes.lake_colosseum.rewards.gold).toBe(500)
  })

  it('has position on map', () => {
    expect(typeof nodes.lake_colosseum.x).toBe('number')
    expect(typeof nodes.lake_colosseum.y).toBe('number')
  })

  it('is connected from an existing lake node', () => {
    // Either lake_01 or lake_02 should connect to lake_colosseum
    const connectedFromLake01 = nodes.lake_01.connections.includes('lake_colosseum')
    const connectedFromLake02 = nodes.lake_02.connections.includes('lake_colosseum')
    expect(connectedFromLake01 || connectedFromLake02).toBe(true)
  })

  it('has a name', () => {
    expect(nodes.lake_colosseum.name).toBe('The Colosseum Gate')
  })
})
