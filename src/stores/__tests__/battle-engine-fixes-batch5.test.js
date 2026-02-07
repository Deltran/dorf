import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { EffectType } from '../../data/statusEffects'

describe('Engine fixes batch 5 — Onibaba + Vraxx', () => {
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

  // === ONIBABA ===

  describe('healLowestAllyPercent (Onibaba Soul Siphon)', () => {
    it('heals lowest HP ally for percentage of damage dealt', () => {
      const [onibaba, ally] = setupMultiHeroBattle(['onibaba', 'town_guard'])

      const battleAlly = battleStore.heroes.find(h => h.templateId === 'town_guard')
      // Damage ally so they're the lowest HP
      battleAlly.currentHp = Math.floor(battleAlly.maxHp * 0.3)
      const allyHpBefore = battleAlly.currentHp

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      const skillIndex = onibaba.template.skills.findIndex(s => s.name === 'Soul Siphon')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      // Ally should have been healed (100% of damage dealt)
      expect(battleAlly.currentHp).toBeGreaterThan(allyHpBefore)
    })
  })

  describe('selfHpCostPercent (Onibaba Wailing Mask)', () => {
    it('sacrifices current HP as cost before dealing damage', () => {
      const hero = setupBattle('onibaba')
      hero.currentMp = 40

      const hpBefore = hero.currentHp
      const expectedCost = Math.floor(hpBefore * 20 / 100)

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Wailing Mask')
      battleStore.selectAction(`skill_${skillIndex}`)

      // Hero should have lost 20% of current HP
      expect(hero.currentHp).toBeLessThan(hpBefore)
    })
  })

  describe('dealHpCostAsDamage + ignoresDef (Onibaba Wailing Mask)', () => {
    it('deals HP cost as true damage to all enemies', () => {
      const hero = setupBattle('onibaba')
      hero.currentMp = 40
      hero.currentHp = hero.maxHp // Full HP for consistent test

      const hpCost = Math.floor(hero.currentHp * 20 / 100)

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999
      const enemyHpBefore = enemy.currentHp

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Wailing Mask')
      battleStore.selectAction(`skill_${skillIndex}`)

      // Enemy should have taken damage equal to HP cost (true damage, ignoring DEF)
      const damageDealt = enemyHpBefore - enemy.currentHp
      expect(damageDealt).toBe(hpCost)
    })
  })

  describe('casterMaxHpPercent shield (Onibaba Spirit Ward)', () => {
    it('creates shield based on caster max HP', () => {
      const [onibaba, ally] = setupMultiHeroBattle(['onibaba', 'town_guard'])
      onibaba.currentMp = 30

      const battleAlly = battleStore.heroes.find(h => h.templateId === 'town_guard')

      const skillIndex = onibaba.template.skills.findIndex(s => s.name === 'Spirit Ward')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(battleAlly.instanceId, 'hero')

      const shield = battleAlly.statusEffects.find(e => e.type === EffectType.SHIELD)
      expect(shield).toBeDefined()

      // Shield should be 20% of Onibaba's max HP
      const expectedShieldHp = Math.floor(onibaba.maxHp * 20 / 100)
      expect(shield.shieldHp).toBe(expectedShieldHp)
    })
  })

  describe('selfHpCostPercent on ally skill (Onibaba Crone\'s Gift)', () => {
    it('sacrifices HP when casting buff on ally', () => {
      const [onibaba, ally] = setupMultiHeroBattle(['onibaba', 'town_guard'])
      onibaba.currentMp = 45

      const hpBefore = onibaba.currentHp

      const battleAlly = battleStore.heroes.find(h => h.templateId === 'town_guard')

      const skillIndex = onibaba.template.skills.findIndex(s => s.name === "The Crone's Gift")
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(battleAlly.instanceId, 'hero')

      // Onibaba should lose 30% of current HP
      const expectedLoss = Math.floor(hpBefore * 30 / 100)
      expect(onibaba.currentHp).toBe(Math.max(1, hpBefore - expectedLoss))
    })
  })

  describe('healAlliesPercent in AoE (Onibaba Wailing Mask)', () => {
    it('heals all allies for percentage of damage dealt', () => {
      const [onibaba, ally] = setupMultiHeroBattle(['onibaba', 'town_guard'])
      onibaba.currentMp = 40

      const battleAlly = battleStore.heroes.find(h => h.templateId === 'town_guard')
      // Damage both heroes
      onibaba.currentHp = Math.floor(onibaba.maxHp * 0.5)
      battleAlly.currentHp = Math.floor(battleAlly.maxHp * 0.5)
      const allyHpBefore = battleAlly.currentHp

      const skillIndex = onibaba.template.skills.findIndex(s => s.name === 'Wailing Mask')
      battleStore.selectAction(`skill_${skillIndex}`)

      // Ally should have been healed (50% of damage dealt)
      expect(battleAlly.currentHp).toBeGreaterThan(allyHpBefore)
    })
  })

  // === VRAXX THUNDERSKIN ===

  describe('rage_grant effect (Vraxx Drums of the Old Blood)', () => {
    it('grants Rage to Berserker allies', () => {
      const [vraxx, berserker] = setupMultiHeroBattle(['vraxx_thunderskin', 'matsuda'])

      const battleBerserker = battleStore.heroes.find(h => h.templateId === 'matsuda')
      const rageBefore = battleBerserker.currentRage || 0

      const skillIndex = vraxx.template.skills.findIndex(s => s.name === 'Drums of the Old Blood')
      battleStore.selectAction(`skill_${skillIndex}`)

      // Berserker should have gained 25 Rage
      expect(battleBerserker.currentRage).toBe(Math.min(100, rageBefore + 25))
    })

    it('does NOT grant Rage to non-Berserker allies', () => {
      const [vraxx, knight] = setupMultiHeroBattle(['vraxx_thunderskin', 'town_guard'])

      const battleKnight = battleStore.heroes.find(h => h.templateId === 'town_guard')
      // Knights don't have currentRage

      const skillIndex = vraxx.template.skills.findIndex(s => s.name === 'Drums of the Old Blood')
      battleStore.selectAction(`skill_${skillIndex}`)

      // Knight should NOT have gained Rage
      expect(battleKnight.currentRage).toBeUndefined()
    })
  })

  describe('conditional_resource_or_buff (Vraxx Fury Beat)', () => {
    it('grants Rage to Berserker allies', () => {
      const [vraxx, berserker] = setupMultiHeroBattle(['vraxx_thunderskin', 'matsuda'])

      const battleBerserker = battleStore.heroes.find(h => h.templateId === 'matsuda')
      const rageBefore = battleBerserker.currentRage || 0

      const skillIndex = vraxx.template.skills.findIndex(s => s.name === 'Fury Beat')
      battleStore.selectAction(`skill_${skillIndex}`)

      expect(battleBerserker.currentRage).toBe(Math.min(100, rageBefore + 15))
    })

    it('grants ATK buff to non-Berserker allies', () => {
      const [vraxx, knight] = setupMultiHeroBattle(['vraxx_thunderskin', 'town_guard'])

      const battleKnight = battleStore.heroes.find(h => h.templateId === 'town_guard')

      const skillIndex = vraxx.template.skills.findIndex(s => s.name === 'Fury Beat')
      battleStore.selectAction(`skill_${skillIndex}`)

      expect(battleStore.hasEffect(battleKnight, EffectType.ATK_UP)).toBe(true)
    })
  })

  describe('consume_excess_rage finale (Vraxx Thunderclap Crescendo)', () => {
    it('consumes excess Rage from Berserker and deals AoE damage', () => {
      const [vraxx, berserker] = setupMultiHeroBattle(['vraxx_thunderskin', 'matsuda'])

      const battleBerserker = battleStore.heroes.find(h => h.templateId === 'matsuda')
      battleBerserker.currentRage = 80 // 30 above threshold of 50

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999
      const enemyHpBefore = enemy.currentHp

      // Trigger finale by setting verses to 3 and calling executeFinale
      vraxx.currentVerses = 3
      battleStore.executeFinale(vraxx)

      // Berserker should have Rage reduced to threshold (50)
      expect(battleBerserker.currentRage).toBe(50)
      // Enemy should have taken damage (30 consumed Rage * 3% per Rage = 90% ATK)
      expect(enemy.currentHp).toBeLessThan(enemyHpBefore)
    })

    it('applies fallback ATK buff when no excess Rage to consume', () => {
      const [vraxx, knight] = setupMultiHeroBattle(['vraxx_thunderskin', 'town_guard'])

      const battleKnight = battleStore.heroes.find(h => h.templateId === 'town_guard')

      vraxx.currentVerses = 3
      battleStore.executeFinale(vraxx)

      // Should have ATK_UP from fallback
      expect(battleStore.hasEffect(battleKnight, EffectType.ATK_UP)).toBe(true)
    })
  })
})
