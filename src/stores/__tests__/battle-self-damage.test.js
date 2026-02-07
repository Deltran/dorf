import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'

describe('selfDamagePercentMaxHp in self and all_allies paths', () => {
  let battleStore, heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function setupBattleWithHero(heroId) {
    const hero = heroesStore.addHero(heroId)
    heroesStore.setPartySlot(0, hero.instanceId)
    battleStore.initBattle(null, ['forest_imp'])

    const battleHero = battleStore.heroes[0]

    // Force the hero to be the current unit
    const heroTurnIndex = battleStore.turnOrder.findIndex(t => t.id === battleHero.instanceId)
    battleStore.currentTurnIndex = heroTurnIndex >= 0 ? heroTurnIndex : 0
    battleStore.state = 'player_turn'

    return battleHero
  }

  it('applies self-damage in self targetType path (Torga Blood Tempo)', () => {
    const hero = setupBattleWithHero('torga_bloodbeat')
    const maxHp = hero.maxHp
    const initialHp = hero.currentHp

    const bloodTempo = hero.template.skills.find(s => s.name === 'Blood Tempo')
    expect(bloodTempo).toBeDefined()
    expect(bloodTempo.selfDamagePercentMaxHp).toBe(15)

    hero.currentRage = 50

    const skillIndex = hero.template.skills.findIndex(s => s.name === 'Blood Tempo')
    battleStore.selectAction(`skill_${skillIndex}`)

    const expectedDamage = Math.floor(maxHp * 15 / 100)
    expect(hero.currentHp).toBe(initialHp - expectedDamage)
  })

  it('applies self-damage in all_allies targetType path (Vashek Forward Together)', () => {
    const hero = setupBattleWithHero('vashek_the_unrelenting')
    const maxHp = hero.maxHp
    const initialHp = hero.currentHp

    const forwardTogether = hero.template.skills.find(s => s.name === 'Forward, Together')
    expect(forwardTogether).toBeDefined()
    expect(forwardTogether.selfDamagePercentMaxHp).toBe(10)

    hero.currentValor = 25

    const skillIndex = hero.template.skills.findIndex(s => s.name === 'Forward, Together')
    battleStore.selectAction(`skill_${skillIndex}`)

    const expectedDamage = Math.floor(maxHp * 10 / 100)
    expect(hero.currentHp).toBe(initialHp - expectedDamage)
  })

  it('self-damage does not reduce below 1 HP', () => {
    const hero = setupBattleWithHero('torga_bloodbeat')
    hero.currentHp = 1
    hero.currentRage = 50

    const skillIndex = hero.template.skills.findIndex(s => s.name === 'Blood Tempo')
    battleStore.selectAction(`skill_${skillIndex}`)

    expect(hero.currentHp).toBe(1)
  })
})
