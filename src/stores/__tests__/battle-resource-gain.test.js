import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'

describe('skill rageGain and valorGain', () => {
  let battleStore, heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function setupBattle(heroId) {
    const hero = heroesStore.addHero(heroId)
    heroesStore.setPartySlot(0, hero.instanceId)
    battleStore.initBattle(null, ['goblin_scout'])

    const battleHero = battleStore.heroes[0]
    const heroTurnIndex = battleStore.turnOrder.findIndex(t => t.id === battleHero.instanceId)
    battleStore.currentTurnIndex = heroTurnIndex >= 0 ? heroTurnIndex : 0
    battleStore.state = 'player_turn'

    return battleHero
  }

  it('grants rage from rageGain on enemy-targeting skill (Torga Rhythm Strike)', () => {
    const hero = setupBattle('torga_bloodbeat')

    // Rhythm Strike: targetType 'enemy', rageGain: 10
    const rhythmStrike = hero.template.skills.find(s => s.name === 'Rhythm Strike')
    expect(rhythmStrike).toBeDefined()
    expect(rhythmStrike.rageGain).toBe(10)

    hero.currentRage = 0
    const enemy = battleStore.enemies[0]

    const skillIndex = hero.template.skills.findIndex(s => s.name === 'Rhythm Strike')
    battleStore.selectAction(`skill_${skillIndex}`)
    battleStore.selectTarget(enemy.id, 'enemy')

    expect(hero.currentRage).toBeGreaterThanOrEqual(10)
  })

  it('grants rage from rageGain on self-targeting skill (Torga Blood Tempo)', () => {
    const hero = setupBattle('torga_bloodbeat')

    // Blood Tempo: targetType 'self', rageGain: 30
    const bloodTempo = hero.template.skills.find(s => s.name === 'Blood Tempo')
    expect(bloodTempo).toBeDefined()
    expect(bloodTempo.rageGain).toBe(30)

    hero.currentRage = 0

    const skillIndex = hero.template.skills.findIndex(s => s.name === 'Blood Tempo')
    battleStore.selectAction(`skill_${skillIndex}`)

    expect(hero.currentRage).toBe(30)
  })

  it('caps rage at 100', () => {
    const hero = setupBattle('torga_bloodbeat')
    hero.currentRage = 90

    const bloodTempo = hero.template.skills.find(s => s.name === 'Blood Tempo')
    const skillIndex = hero.template.skills.findIndex(s => s.name === 'Blood Tempo')
    battleStore.selectAction(`skill_${skillIndex}`)

    expect(hero.currentRage).toBe(100)
  })

  it('grants valor from valorGain on enemy-targeting skill (Grateful Dead Grave Tap)', () => {
    const hero = setupBattle('the_grateful_dead')

    // Grave Tap: targetType 'enemy', valorGain: 10
    const graveTap = hero.template.skills.find(s => s.name === 'Grave Tap')
    expect(graveTap).toBeDefined()
    expect(graveTap.valorGain).toBe(10)

    hero.currentValor = 0
    const enemy = battleStore.enemies[0]

    const skillIndex = hero.template.skills.findIndex(s => s.name === 'Grave Tap')
    battleStore.selectAction(`skill_${skillIndex}`)
    battleStore.selectTarget(enemy.id, 'enemy')

    expect(hero.currentValor).toBeGreaterThanOrEqual(10)
  })

  it('caps valor at 100', () => {
    const hero = setupBattle('the_grateful_dead')
    hero.currentValor = 95
    const enemy = battleStore.enemies[0]

    const skillIndex = hero.template.skills.findIndex(s => s.name === 'Grave Tap')
    battleStore.selectAction(`skill_${skillIndex}`)
    battleStore.selectTarget(enemy.id, 'enemy')

    expect(hero.currentValor).toBe(100)
  })
})
