import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { EffectType } from '../../data/statusEffects'

describe('Engine fixes batch 6 — Onibaba doubleIfAttacksCaster + leader skill', () => {
  let battleStore, heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function setupBattle(heroId, enemyId = 'goblin_scout') {
    const hero = heroesStore.addHero(heroId)
    heroesStore.setPartySlot(0, hero.instanceId)
    battleStore.initBattle(null, [enemyId])

    const battleHero = battleStore.heroes[0]
    const heroTurnIndex = battleStore.turnOrder.findIndex(t => t.id === battleHero.instanceId)
    battleStore.currentTurnIndex = heroTurnIndex >= 0 ? heroTurnIndex : 0
    battleStore.state = 'player_turn'

    return battleHero
  }

  function setupMultiHeroBattle(heroIds, enemyId = 'goblin_scout') {
    const heroes = heroIds.map((id, i) => {
      const hero = heroesStore.addHero(id)
      heroesStore.setPartySlot(i, hero.instanceId)
      return hero
    })
    battleStore.initBattle(null, [enemyId])

    const battleHeroes = heroIds.map(id =>
      battleStore.heroes.find(h => h.templateId === id)
    )
    const heroTurnIndex = battleStore.turnOrder.findIndex(t => t.id === battleHeroes[0].instanceId)
    battleStore.currentTurnIndex = heroTurnIndex >= 0 ? heroTurnIndex : 0
    battleStore.state = 'player_turn'

    return battleHeroes
  }

  // === DOUBLE IF ATTACKS CASTER (Grudge Hex) ===

  describe('doubleIfAttacksCaster (Onibaba Grudge Hex)', () => {
    it('doubles poison DoT when enemy attacks the caster', () => {
      const hero = setupBattle('onibaba')

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      // Apply poison with doubleIfAttacksCaster
      const poisonDamage = 20
      battleStore.applyEffect(enemy, EffectType.POISON, {
        duration: 3,
        value: poisonDamage,
        sourceId: hero.instanceId,
        doubleIfAttacksCaster: true
      })

      // Record HP before enemy turn
      const enemyHpBefore = enemy.currentHp

      // Enemy turn — only hero is Onibaba, so enemy MUST attack her
      const enemyTurnIndex = battleStore.turnOrder.findIndex(t => t.id === enemy.id)
      battleStore.currentTurnIndex = enemyTurnIndex >= 0 ? enemyTurnIndex : 0
      battleStore.state = 'enemy_turn'
      battleStore.executeEnemyTurn(enemy)

      // Poison should have ticked for DOUBLE damage during end-of-turn
      const hpLoss = enemyHpBefore - enemy.currentHp
      expect(hpLoss).toBe(poisonDamage * 2)
    })

    it('does NOT double when enemy attacks someone other than the caster', () => {
      const hero = setupBattle('onibaba')

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      // Apply poison with doubleIfAttacksCaster, but sourceId = someone else
      const poisonDamage = 20
      battleStore.applyEffect(enemy, EffectType.POISON, {
        duration: 3,
        value: poisonDamage,
        sourceId: 'some_other_hero', // Not the hero being attacked
        doubleIfAttacksCaster: true
      })

      const enemyHpBefore = enemy.currentHp

      // Enemy attacks Onibaba, but poison source is 'some_other_hero'
      const enemyTurnIndex = battleStore.turnOrder.findIndex(t => t.id === enemy.id)
      battleStore.currentTurnIndex = enemyTurnIndex >= 0 ? enemyTurnIndex : 0
      battleStore.state = 'enemy_turn'
      battleStore.executeEnemyTurn(enemy)

      // Poison should tick for normal (NOT doubled) damage
      const hpLoss = enemyHpBefore - enemy.currentHp
      expect(hpLoss).toBe(poisonDamage)
    })

    it('stores doubleIfAttacksCaster when Grudge Hex is used via skill execution', () => {
      const hero = setupBattle('onibaba')
      hero.currentMp = 15

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      // Use Grudge Hex skill
      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Grudge Hex')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      // Check the poison effect has doubleIfAttacksCaster
      const poison = enemy.statusEffects.find(e => e.type === EffectType.POISON)
      expect(poison).toBeDefined()
      expect(poison.doubleIfAttacksCaster).toBe(true)
    })
  })

  // === ALLY LOW HP AUTO ATTACK (Grandmother's Vigil leader skill) ===

  describe('ally_low_hp_auto_attack (Onibaba Grandmother\'s Vigil)', () => {
    it('auto-attacks lowest HP enemy when ally drops below 30% HP', () => {
      const [onibaba, ally] = setupMultiHeroBattle(['onibaba', 'town_guard'])
      // Set Onibaba as party leader
      heroesStore.setPartyLeader(onibaba.instanceId)

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999
      const enemyHpBefore = enemy.currentHp

      // Set ally just above 30% threshold
      const battleAlly = battleStore.heroes.find(h => h.templateId === 'town_guard')
      battleAlly.currentHp = Math.floor(battleAlly.maxHp * 0.35)

      // Damage ally to push below 30% (must cross threshold)
      const damageAmount = Math.floor(battleAlly.maxHp * 0.10)
      battleStore.applyDamage(battleAlly, damageAmount, 'attack', enemy)

      // Enemy should have taken damage from Onibaba's auto Soul Siphon
      expect(enemy.currentHp).toBeLessThan(enemyHpBefore)
    })

    it('only triggers once per ally per battle', () => {
      const [onibaba, ally] = setupMultiHeroBattle(['onibaba', 'town_guard'])
      heroesStore.setPartyLeader(onibaba.instanceId)

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      const battleAlly = battleStore.heroes.find(h => h.templateId === 'town_guard')

      // First trigger — drop below 30%
      battleAlly.currentHp = Math.floor(battleAlly.maxHp * 0.35)
      battleStore.applyDamage(battleAlly, Math.floor(battleAlly.maxHp * 0.10), 'attack', enemy)
      const enemyHpAfterFirst = enemy.currentHp
      expect(enemyHpAfterFirst).toBeLessThan(9999) // First trigger fired

      // Heal ally back above threshold, then damage again
      battleAlly.currentHp = Math.floor(battleAlly.maxHp * 0.35)
      battleStore.applyDamage(battleAlly, Math.floor(battleAlly.maxHp * 0.10), 'attack', enemy)

      // Should NOT have triggered again (once per ally)
      expect(enemy.currentHp).toBe(enemyHpAfterFirst)
    })

    it('does NOT trigger when Onibaba is dead', () => {
      const [onibaba, ally] = setupMultiHeroBattle(['onibaba', 'town_guard'])
      heroesStore.setPartyLeader(onibaba.instanceId)

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999
      const enemyHpBefore = enemy.currentHp

      // Kill Onibaba
      onibaba.currentHp = 0

      const battleAlly = battleStore.heroes.find(h => h.templateId === 'town_guard')
      battleAlly.currentHp = Math.floor(battleAlly.maxHp * 0.35)
      battleStore.applyDamage(battleAlly, Math.floor(battleAlly.maxHp * 0.10), 'attack', enemy)

      // No auto-attack because Onibaba is dead
      expect(enemy.currentHp).toBe(enemyHpBefore)
    })

    it('does NOT trigger for the leader herself', () => {
      const [onibaba, ally] = setupMultiHeroBattle(['onibaba', 'town_guard'])
      heroesStore.setPartyLeader(onibaba.instanceId)

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999
      const enemyHpBefore = enemy.currentHp

      // Damage Onibaba herself below threshold
      onibaba.currentHp = Math.floor(onibaba.maxHp * 0.35)
      battleStore.applyDamage(onibaba, Math.floor(onibaba.maxHp * 0.10), 'attack', enemy)

      // Should NOT trigger (it's for allies, not the leader herself)
      expect(enemy.currentHp).toBe(enemyHpBefore)
    })
  })
})
