import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { EffectType } from '../../data/statusEffects.js'

describe('self-targeted effects in ally targetType path', () => {
  let battleStore, heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  it('applies self-buff from ally-targeting skill (Vashek Brothers in Arms)', () => {
    // Need two heroes: Vashek + an ally target
    const vashek = heroesStore.addHero('vashek_the_unrelenting')
    const ally = heroesStore.addHero('town_guard')
    heroesStore.setPartySlot(0, vashek.instanceId)
    heroesStore.setPartySlot(1, ally.instanceId)
    battleStore.initBattle(null, ['forest_imp'])

    const battleVashek = battleStore.heroes.find(h => h.templateId === 'vashek_the_unrelenting')
    const battleAlly = battleStore.heroes.find(h => h.templateId === 'town_guard')

    // Force Vashek to be current unit
    const vashekTurnIndex = battleStore.turnOrder.findIndex(t => t.id === battleVashek.instanceId)
    battleStore.currentTurnIndex = vashekTurnIndex >= 0 ? vashekTurnIndex : 0
    battleStore.state = 'player_turn'

    // Brothers in Arms: targetType 'ally', effects include both ally DEF_UP and self ATK_UP
    const brothersInArms = battleVashek.template.skills.find(s => s.name === 'Brothers in Arms')
    expect(brothersInArms).toBeDefined()

    const selfEffect = brothersInArms.effects.find(e => e.target === 'self')
    expect(selfEffect).toBeDefined()
    expect(selfEffect.type).toBe(EffectType.ATK_UP)

    const allyEffect = brothersInArms.effects.find(e => e.target === 'ally')
    expect(allyEffect).toBeDefined()
    expect(allyEffect.type).toBe(EffectType.DEF_UP)

    // Select the skill and target the ally
    const skillIndex = battleVashek.template.skills.findIndex(s => s.name === 'Brothers in Arms')
    battleStore.selectAction(`skill_${skillIndex}`)
    battleStore.selectTarget(battleAlly.instanceId, 'hero')

    // Ally should have DEF_UP
    expect(battleStore.hasEffect(battleAlly, EffectType.DEF_UP)).toBe(true)

    // Caster (Vashek) should have ATK_UP from the self-targeted effect
    expect(battleStore.hasEffect(battleVashek, EffectType.ATK_UP)).toBe(true)
  })
})
