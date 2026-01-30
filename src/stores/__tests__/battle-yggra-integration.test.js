import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { heroTemplates } from '../../data/heroes/index.js'

describe('Yggra skills integration', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  it('Yggra template has all required skills', () => {
    const yggra = heroTemplates.yggra_world_root
    expect(yggra.skills).toHaveLength(5)

    const skillNames = yggra.skills.map(s => s.name)
    expect(skillNames).toContain('Blessing of the World Root')
    expect(skillNames).toContain('Grasping Roots')
    expect(skillNames).toContain('Bark Shield')
    expect(skillNames).toContain("Nature's Reclamation")
    expect(skillNames).toContain("World Root's Embrace")
  })

  it("Nature's Reclamation has healAlliesPercent property", () => {
    const yggra = heroTemplates.yggra_world_root
    const skill = yggra.skills.find(s => s.name === "Nature's Reclamation")
    expect(skill.healAlliesPercent).toBe(35)
  })
})

describe('Yggra leader skill - passive regen', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  it('applyPassiveRegenLeaderEffects heals alive heroes for 3% max HP', () => {
    store.heroes = [
      {
        instanceId: 'yggra1',
        template: { name: 'Yggra', leaderSkill: heroTemplates.yggra_world_root.leaderSkill },
        currentHp: 800,
        maxHp: 1000,
        stats: { hp: 1000 },
        statusEffects: [],
        leaderBonuses: {}
      },
      {
        instanceId: 'mage1',
        template: { name: 'Mage' },
        currentHp: 150,
        maxHp: 400,
        stats: { hp: 400 },
        statusEffects: [],
        leaderBonuses: {}
      }
    ]
    store.enemies = [
      { id: 'e1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, statusEffects: [] }
    ]

    const heroesStore = useHeroesStore()
    heroesStore.partyLeader = 'yggra1'

    store.applyPassiveRegenLeaderEffects()

    // Yggra: 3% of 1000 = 30 HP healed -> 800 + 30 = 830
    expect(store.heroes[0].currentHp).toBe(830)
    // Mage: 3% of 400 = 12 HP healed -> 150 + 12 = 162
    expect(store.heroes[1].currentHp).toBe(162)
  })

  it('does not heal dead heroes', () => {
    store.heroes = [
      {
        instanceId: 'yggra1',
        template: { name: 'Yggra', leaderSkill: heroTemplates.yggra_world_root.leaderSkill },
        currentHp: 500,
        maxHp: 1000,
        stats: { hp: 1000 },
        statusEffects: [],
        leaderBonuses: {}
      },
      {
        instanceId: 'dead1',
        template: { name: 'Dead Hero' },
        currentHp: 0,
        maxHp: 400,
        stats: { hp: 400 },
        statusEffects: [],
        leaderBonuses: {}
      }
    ]
    store.enemies = [
      { id: 'e1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, statusEffects: [] }
    ]

    const heroesStore = useHeroesStore()
    heroesStore.partyLeader = 'yggra1'

    store.applyPassiveRegenLeaderEffects()

    expect(store.heroes[0].currentHp).toBe(530) // 3% of 1000 = 30
    expect(store.heroes[1].currentHp).toBe(0)   // Dead, not healed
  })

  it('does not overheal past max HP', () => {
    store.heroes = [
      {
        instanceId: 'yggra1',
        template: { name: 'Yggra', leaderSkill: heroTemplates.yggra_world_root.leaderSkill },
        currentHp: 995,
        maxHp: 1000,
        stats: { hp: 1000 },
        statusEffects: [],
        leaderBonuses: {}
      }
    ]
    store.enemies = [
      { id: 'e1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, statusEffects: [] }
    ]

    const heroesStore = useHeroesStore()
    heroesStore.partyLeader = 'yggra1'

    store.applyPassiveRegenLeaderEffects()

    // 3% of 1000 = 30, but 995 + 30 = 1025 > 1000, capped at 1000
    expect(store.heroes[0].currentHp).toBe(1000)
  })

  it('does nothing when leader has no passive_regen effects', () => {
    store.heroes = [
      {
        instanceId: 'aurora1',
        template: {
          name: 'Aurora',
          leaderSkill: {
            name: "Dawn's Protection",
            effects: [{ type: 'passive', stat: 'def', value: 15 }]
          }
        },
        currentHp: 100,
        maxHp: 150,
        stats: { hp: 150 },
        statusEffects: [],
        leaderBonuses: {}
      }
    ]
    store.enemies = [
      { id: 'e1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, statusEffects: [] }
    ]

    const heroesStore = useHeroesStore()
    heroesStore.partyLeader = 'aurora1'

    store.applyPassiveRegenLeaderEffects()

    expect(store.heroes[0].currentHp).toBe(100) // No change
  })
})
