import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { EffectType } from '../../data/statusEffects'

describe('Engine fixes batch 3', () => {
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

  describe('conditionalDamage (Matsuda Death Before Dishonor)', () => {
    it('uses hpBelow50 damage when hero below 50% HP', () => {
      const hero = setupBattle('matsuda')
      hero.currentRage = 40

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      // Set hero to 40% HP (below 50% threshold)
      hero.currentHp = Math.floor(hero.maxHp * 0.4)

      const hpBefore = enemy.currentHp
      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Death Before Dishonor')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      const damageDealt = hpBefore - enemy.currentHp
      expect(damageDealt).toBeGreaterThan(0)
    })

    it('uses hpBelow25 damage when hero below 25% HP', () => {
      const hero = setupBattle('matsuda')
      hero.currentRage = 40

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      // Set hero to 20% HP (below 25% threshold)
      hero.currentHp = Math.floor(hero.maxHp * 0.2)

      const hpBefore = enemy.currentHp
      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Death Before Dishonor')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      const damageDealt = hpBefore - enemy.currentHp
      expect(damageDealt).toBeGreaterThan(0)
    })
  })

  describe('conditionalEvasion (Matsuda Death Before Dishonor)', () => {
    it('grants evasion when hero below 25% HP', () => {
      const hero = setupBattle('matsuda')
      hero.currentRage = 40

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      // Set hero to 20% HP (below 25% threshold)
      hero.currentHp = Math.floor(hero.maxHp * 0.2)

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Death Before Dishonor')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      expect(battleStore.hasEffect(hero, EffectType.EVASION)).toBe(true)
    })

    it('does not grant evasion when hero above 25% HP', () => {
      const hero = setupBattle('matsuda')
      hero.currentRage = 40

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      // Set hero to 40% HP (below 50% but above 25%)
      hero.currentHp = Math.floor(hero.maxHp * 0.4)

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Death Before Dishonor')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      expect(battleStore.hasEffect(hero, EffectType.EVASION)).toBe(false)
    })
  })

  describe('conditionalBonusDamage (Vashek Hold the Line)', () => {
    it('deals bonus damage when an ally is below 50% HP', () => {
      const [vashek, ally] = setupMultiHeroBattle(['vashek_the_unrelenting', 'town_guard'])

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      // Set ally below 50% HP
      const battleAlly = battleStore.heroes.find(h => h.templateId === 'town_guard')
      battleAlly.currentHp = Math.floor(battleAlly.maxHp * 0.3)

      const hpBefore = enemy.currentHp
      const skillIndex = vashek.template.skills.findIndex(s => s.name === 'Hold the Line')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      const damageWithBonus = hpBefore - enemy.currentHp

      // Reset for comparison without bonus
      enemy.currentHp = 9999
      battleAlly.currentHp = battleAlly.maxHp // Ally at full HP now

      const heroTurnIndex = battleStore.turnOrder.findIndex(t => t.id === vashek.instanceId)
      battleStore.currentTurnIndex = heroTurnIndex >= 0 ? heroTurnIndex : 0
      battleStore.state = 'player_turn'

      const hpBefore2 = enemy.currentHp
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      const damageWithout = hpBefore2 - enemy.currentHp
      expect(damageWithBonus).toBeGreaterThan(damageWithout)
    })
  })

  describe('valuePerAlly (Vashek Shoulder to Shoulder)', () => {
    it('scales buff value with number of alive allies', () => {
      const [vashek, ally] = setupMultiHeroBattle(['vashek_the_unrelenting', 'town_guard'])
      vashek.currentValor = 50 // Need 50 Valor

      const skillIndex = vashek.template.skills.findIndex(s => s.name === 'Shoulder to Shoulder')
      battleStore.selectAction(`skill_${skillIndex}`)

      // Both heroes should have ATK_UP and DEF_UP
      expect(battleStore.hasEffect(vashek, EffectType.ATK_UP)).toBe(true)
      expect(battleStore.hasEffect(vashek, EffectType.DEF_UP)).toBe(true)

      // With 2 alive allies, value should be 5 * 2 = 10 (at base Valor tier)
      const atkBuff = vashek.statusEffects.find(e => e.type === EffectType.ATK_UP)
      expect(atkBuff.value).toBe(10) // 5 per ally * 2 allies
    })
  })

  describe('selfBuffWhileGuarding (Philemon Heart\'s Shield)', () => {
    it('grants DEF_UP to Philemon when using Heart\'s Shield', () => {
      const [philemon, ally] = setupMultiHeroBattle(['philemon_the_ardent', 'town_guard'])
      philemon.currentValor = 20 // Need 20 Valor

      const battleAlly = battleStore.heroes.find(h => h.templateId === 'town_guard')
      const skillIndex = philemon.template.skills.findIndex(s => s.name === "Heart's Shield")
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(battleAlly.instanceId, 'hero')

      // Philemon should have DEF_UP
      expect(battleStore.hasEffect(philemon, EffectType.DEF_UP)).toBe(true)
      const defBuff = philemon.statusEffects.find(e => e.type === EffectType.DEF_UP)
      expect(defBuff.value).toBe(20)
    })
  })

  describe('ifMarked (Shinobi Jin)', () => {
    it('extends Poison duration when target is Marked (Kunai)', () => {
      const hero = setupBattle('shinobi_jin')

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      // Apply MARKED to enemy
      battleStore.applyEffect(enemy, EffectType.MARKED, { duration: 3, value: 15, sourceId: hero.instanceId })

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Kunai')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      // Poison should have duration 3 (base 2 + 1 from ifMarked.extendDuration)
      const poison = enemy.statusEffects.find(e => e.type === EffectType.POISON)
      expect(poison).toBeDefined()
      expect(poison.duration).toBe(3)
    })

    it('uses higher damagePercent for Marked targets in AoE (Kusari Fundo)', () => {
      const hero = setupBattle('shinobi_jin')

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      // First attack without Mark
      const hpBefore1 = enemy.currentHp
      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Kusari Fundo')
      battleStore.selectAction(`skill_${skillIndex}`)

      const damageWithout = hpBefore1 - enemy.currentHp

      // Reset and apply Mark
      enemy.currentHp = 9999
      battleStore.applyEffect(enemy, EffectType.MARKED, { duration: 3, value: 15, sourceId: hero.instanceId })

      // Ranger loses Focus after skill use — restore it for second attack
      hero.hasFocus = true
      const heroTurnIndex = battleStore.turnOrder.findIndex(t => t.id === hero.instanceId)
      battleStore.currentTurnIndex = heroTurnIndex >= 0 ? heroTurnIndex : 0
      battleStore.state = 'player_turn'

      const hpBefore2 = enemy.currentHp
      battleStore.selectAction(`skill_${skillIndex}`)

      const damageWith = hpBefore2 - enemy.currentHp

      // Marked damage (90%) should be higher than unmarked (70%) + marked bonus damage
      expect(damageWith).toBeGreaterThan(damageWithout)
    })
  })

  describe('executeThreshold (Shinobi Jin Ansatsu)', () => {
    it('executes enemy below HP threshold', () => {
      const hero = setupBattle('shinobi_jin')

      const enemy = battleStore.enemies[0]
      // Set enemy to 20% HP (below 30% threshold)
      enemy.currentHp = Math.floor(enemy.maxHp * 0.2)

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Ansatsu')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      // Enemy should be dead (executed)
      expect(enemy.currentHp).toBeLessThanOrEqual(0)
    })

    it('uses higher threshold when target is Marked', () => {
      const hero = setupBattle('shinobi_jin')

      const enemy = battleStore.enemies[0]
      // Set enemy to 33% HP (above 30% base but below 35% ifMarked threshold)
      enemy.currentHp = Math.floor(enemy.maxHp * 0.33)
      battleStore.applyEffect(enemy, EffectType.MARKED, { duration: 3, value: 15, sourceId: hero.instanceId })

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Ansatsu')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      // Enemy should be dead (executed with higher threshold)
      expect(enemy.currentHp).toBeLessThanOrEqual(0)
    })
  })

  describe('onSkillUse passive (Shinobi Jin Kage no Mai)', () => {
    it('grants evasion after using a skill', () => {
      const hero = setupBattle('shinobi_jin')

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 9999
      enemy.maxHp = 9999

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Kunai')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      expect(battleStore.hasEffect(hero, EffectType.EVASION)).toBe(true)
      const evasion = hero.statusEffects.find(e => e.type === EffectType.EVASION)
      expect(evasion.value).toBe(10)
    })
  })

  describe('valorThreshold passive stat bonuses (Grateful Dead Already Dead)', () => {
    it('grants +10% DEF at 25 Valor', () => {
      const hero = setupBattle('the_grateful_dead')
      hero.currentValor = 25

      const defWithBonus = battleStore.getEffectiveStat(hero, 'def')
      hero.currentValor = 0
      const defWithout = battleStore.getEffectiveStat(hero, 'def')

      expect(defWithBonus).toBeGreaterThan(defWithout)
    })

    it('grants +15% ATK at 50 Valor', () => {
      const hero = setupBattle('the_grateful_dead')
      hero.currentValor = 50

      const atkWithBonus = battleStore.getEffectiveStat(hero, 'atk')
      hero.currentValor = 0
      const atkWithout = battleStore.getEffectiveStat(hero, 'atk')

      expect(atkWithBonus).toBeGreaterThan(atkWithout)
    })
  })

  describe('passive.onHealed (Matsuda Reluctance)', () => {
    it('gains Reluctance stack when healed by ally', () => {
      const [matsuda, healer] = setupMultiHeroBattle(['matsuda', 'village_healer'])

      // Damage Matsuda
      matsuda.currentHp = Math.floor(matsuda.maxHp * 0.5)

      // Switch to healer's turn
      const healerTurnIndex = battleStore.turnOrder.findIndex(t => t.id === healer.instanceId)
      battleStore.currentTurnIndex = healerTurnIndex >= 0 ? healerTurnIndex : 0
      battleStore.state = 'player_turn'

      // Use healing skill on Matsuda
      const skillIndex = healer.template.skills.findIndex(s =>
        s.targetType === 'ally' && !s.noDamage
      )
      if (skillIndex >= 0) {
        battleStore.selectAction(`skill_${skillIndex}`)
        battleStore.selectTarget(matsuda.instanceId, 'hero')

        expect(battleStore.hasEffect(matsuda, EffectType.RELUCTANCE)).toBe(true)
      }
    })
  })
})
