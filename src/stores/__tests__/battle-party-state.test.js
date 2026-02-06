// src/stores/__tests__/battle-party-state.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { useHeroesStore } from '../heroes.js'

describe('getPartyState — full resource carryover', () => {
  let battleStore, heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function setupHero(templateId) {
    const instance = heroesStore.addHero(templateId)
    heroesStore.setPartySlot(0, instance.instanceId)
    return instance
  }

  it('saves HP, MP, and Rage (existing behavior)', () => {
    const instance = setupHero('farm_hand') // berserker
    battleStore.initBattle(null, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    hero.currentHp = 50
    hero.currentMp = 10
    hero.currentRage = 75

    const state = battleStore.getPartyState()
    expect(state[instance.instanceId].currentHp).toBe(50)
    expect(state[instance.instanceId].currentMp).toBe(10)
    expect(state[instance.instanceId].currentRage).toBe(75)
  })

  it('saves currentEssence for alchemists', () => {
    const instance = setupHero('penny_dreadful') // alchemist
    battleStore.initBattle(null, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    hero.currentEssence = 42

    const state = battleStore.getPartyState()
    expect(state[instance.instanceId].currentEssence).toBe(42)
  })

  it('saves currentValor for knights', () => {
    const instance = setupHero('town_guard') // knight
    battleStore.initBattle(null, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    hero.currentValor = 60

    const state = battleStore.getPartyState()
    expect(state[instance.instanceId].currentValor).toBe(60)
  })

  it('saves currentVerses and lastSkillName for bards', () => {
    const instance = setupHero('street_busker') // bard
    battleStore.initBattle(null, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    hero.currentVerses = 2
    hero.lastSkillName = 'Bardic Tune'

    const state = battleStore.getPartyState()
    expect(state[instance.instanceId].currentVerses).toBe(2)
    expect(state[instance.instanceId].lastSkillName).toBe('Bardic Tune')
  })

  it('saves hasFocus for rangers', () => {
    const instance = setupHero('street_urchin') // ranger
    battleStore.initBattle(null, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    hero.hasFocus = false

    const state = battleStore.getPartyState()
    expect(state[instance.instanceId].hasFocus).toBe(false)
  })

  it('restores full resources when initBattle receives savedState', () => {
    const instance = setupHero('town_guard') // knight
    const savedState = {
      [instance.instanceId]: {
        currentHp: 80,
        currentMp: 15,
        currentValor: 50
      }
    }
    battleStore.initBattle(savedState, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    expect(hero.currentHp).toBe(80)
    expect(hero.currentMp).toBe(15)
    expect(hero.currentValor).toBe(50)
  })

  it('restores hasFocus from savedState for rangers', () => {
    const instance = setupHero('street_urchin') // ranger
    const savedState = {
      [instance.instanceId]: {
        currentHp: 60,
        hasFocus: false
      }
    }
    battleStore.initBattle(savedState, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    expect(hero.currentHp).toBe(60)
    expect(hero.hasFocus).toBe(false)
  })

  it('restores currentVerses and lastSkillName from savedState for bards', () => {
    const instance = setupHero('street_busker') // bard
    const savedState = {
      [instance.instanceId]: {
        currentHp: 70,
        currentVerses: 2,
        lastSkillName: 'Ditty'
      }
    }
    battleStore.initBattle(savedState, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    expect(hero.currentHp).toBe(70)
    expect(hero.currentVerses).toBe(2)
    expect(hero.lastSkillName).toBe('Ditty')
  })

  it('restores currentEssence from savedState for alchemists', () => {
    const instance = setupHero('penny_dreadful') // alchemist
    const savedState = {
      [instance.instanceId]: {
        currentHp: 90,
        currentEssence: 35
      }
    }
    battleStore.initBattle(savedState, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    expect(hero.currentHp).toBe(90)
    expect(hero.currentEssence).toBe(35)
  })

  it('uses defaults when savedState has no resource values', () => {
    const instance = setupHero('town_guard') // knight
    const savedState = {
      [instance.instanceId]: {
        currentHp: 80
      }
    }
    battleStore.initBattle(savedState, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    expect(hero.currentHp).toBe(80)
    expect(hero.currentValor).toBe(0) // default for knight
  })
})
