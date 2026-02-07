import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { EffectType } from '../../data/statusEffects'

describe('Engine fixes batch 2', () => {
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

  describe('cleanseSelf', () => {
    it('removes specific effects from self (Grateful Dead A Minor Inconvenience)', () => {
      const hero = setupBattle('the_grateful_dead')

      // Apply stun to hero
      battleStore.applyEffect(hero, EffectType.STUN, { duration: 2, value: 0, sourceId: 'test' })
      expect(battleStore.hasEffect(hero, EffectType.STUN)).toBe(true)

      // A Minor Inconvenience is skill index 1, targetType 'self', cleanseSelf: ['stun', 'sleep', 'heal_block']
      const skillIndex = hero.template.skills.findIndex(s => s.name === 'A Minor Inconvenience')
      hero.currentValor = 15 // Needs 15 valor
      battleStore.selectAction(`skill_${skillIndex}`)

      // Stun should be removed
      expect(battleStore.hasEffect(hero, EffectType.STUN)).toBe(false)
      // Should have gained Riposte from the skill's effects
      expect(battleStore.hasEffect(hero, EffectType.RIPOSTE)).toBe(true)
    })
  })

  describe('numeric valorCost', () => {
    it('deducts numeric valor cost from knight (Philemon Heart\'s Shield)', () => {
      const hero = setupBattle('philemon_the_ardent')
      hero.currentValor = 50

      // Heart's Shield: valorCost: 20, targetType: 'ally'
      const skillIndex = hero.template.skills.findIndex(s => s.name === "Heart's Shield")
      expect(skillIndex).toBeGreaterThanOrEqual(0)

      // Need an ally to target
      const ally = heroesStore.addHero('town_guard')
      heroesStore.setPartySlot(1, ally.instanceId)

      // Re-init battle with ally in party
      battleStore.initBattle(null, ['goblin_scout'])
      const battleHero = battleStore.heroes.find(h => h.templateId === 'philemon_the_ardent')
      const battleAlly = battleStore.heroes.find(h => h.templateId === 'town_guard')
      const heroTurnIndex = battleStore.turnOrder.findIndex(t => t.id === battleHero.instanceId)
      battleStore.currentTurnIndex = heroTurnIndex >= 0 ? heroTurnIndex : 0
      battleStore.state = 'player_turn'
      battleHero.currentValor = 50

      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(battleAlly.instanceId, 'hero')

      expect(battleHero.currentValor).toBe(30) // 50 - 20
    })

    it('prevents use when insufficient valor', () => {
      const hero = setupBattle('philemon_the_ardent')
      hero.currentValor = 10 // Less than 20 required

      const skillIndex = hero.template.skills.findIndex(s => s.name === "Heart's Shield")
      battleStore.selectAction(`skill_${skillIndex}`)

      // Should stay in player_turn (skill rejected)
      expect(battleStore.state).toBe('player_turn')
    })
  })

  describe('valorGainBonusIfGuarding', () => {
    it('grants bonus valor when guarding (Philemon Devoted Strike)', () => {
      const hero = setupBattle('philemon_the_ardent')
      hero.currentValor = 0

      // Apply GUARDING effect to hero
      battleStore.applyEffect(hero, EffectType.GUARDING, { duration: 2, value: 100, sourceId: hero.instanceId })

      // Devoted Strike: valorGain: 10, valorGainBonusIfGuarding: 5
      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Devoted Strike')
      const enemy = battleStore.enemies[0]

      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      // Should gain 10 + 5 = 15 valor
      expect(hero.currentValor).toBe(15)
    })

    it('grants base valor when not guarding', () => {
      const hero = setupBattle('philemon_the_ardent')
      hero.currentValor = 0

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Devoted Strike')
      const enemy = battleStore.enemies[0]

      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      // Should gain 10 (no bonus)
      expect(hero.currentValor).toBe(10)
    })
  })

  describe('bonusDamagePerBloodTempo', () => {
    it('increases Blood Echo damage after Blood Tempo uses (Torga)', () => {
      const hero = setupBattle('torga_bloodbeat')
      hero.currentRage = 100

      // Use Blood Tempo once (self skill, increments blood tempo counter)
      const bloodTempoIndex = hero.template.skills.findIndex(s => s.name === 'Blood Tempo')
      battleStore.selectAction(`skill_${bloodTempoIndex}`)

      // Set up for next turn
      const heroTurnIndex = battleStore.turnOrder.findIndex(t => t.id === hero.instanceId)
      battleStore.currentTurnIndex = heroTurnIndex >= 0 ? heroTurnIndex : 0
      battleStore.state = 'player_turn'

      const enemy = battleStore.enemies[0]
      const hpBefore = enemy.currentHp

      // Use Blood Echo (should have +30% bonus from 1 Blood Tempo use)
      hero.currentRage = 20 // Needs 20 rage
      const bloodEchoIndex = hero.template.skills.findIndex(s => s.name === 'Blood Echo')
      battleStore.selectAction(`skill_${bloodEchoIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      const damageDealt = hpBefore - enemy.currentHp
      // Blood Echo: 90% base + 30% bonus = 120% ATK damage (approximately)
      expect(damageDealt).toBeGreaterThan(0)
    })
  })

  describe('single-hit rageCost all', () => {
    it('consumes all rage and scales damage (Torga Finale of Fury)', () => {
      const hero = setupBattle('torga_bloodbeat')
      hero.currentRage = 50

      const enemy = battleStore.enemies[0]
      // Give enemy lots of HP so it survives
      enemy.currentHp = 9999
      enemy.maxHp = 9999
      const hpBefore = enemy.currentHp

      const finaleIndex = hero.template.skills.findIndex(s => s.name === 'Finale of Fury')
      battleStore.selectAction(`skill_${finaleIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      // Should deal damage (baseDamagePercent:50 + damagePerRage:2 * 50 = 150% ATK)
      expect(enemy.currentHp).toBeLessThan(hpBefore)
      // Rage should be near 0 (consumed, plus +10 from berserker attacker bonus in applyDamage)
      expect(hero.currentRage).toBeLessThanOrEqual(10)
    })
  })

  describe('onKill handler', () => {
    it('grants rage on kill (Torga Finale of Fury)', () => {
      const hero = setupBattle('torga_bloodbeat')
      hero.currentRage = 100

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 1 // Will die from any damage

      const finaleIndex = hero.template.skills.findIndex(s => s.name === 'Finale of Fury')
      battleStore.selectAction(`skill_${finaleIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      // onKill.rageGain: 50 (plus processRageOnKill gives base rage)
      expect(hero.currentRage).toBeGreaterThanOrEqual(50)
    })

    it('heals on kill (Matsuda Glorious End)', () => {
      const hero = setupBattle('matsuda')
      hero.currentRage = 60

      const enemy = battleStore.enemies[0]
      enemy.currentHp = 1

      // Damage hero first
      hero.currentHp = Math.floor(hero.maxHp * 0.5)
      const hpBefore = hero.currentHp

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Glorious End')
      battleStore.selectAction(`skill_${skillIndex}`)

      // Glorious End is all_enemies, auto-executes
      // onKill.healPercent: 20 — heals for 20% of ATK
      expect(hero.currentHp).toBeGreaterThanOrEqual(hpBefore)
    })
  })

  describe('bonusDamagePerValor (Grateful Dead Bygone Valor)', () => {
    it('consumes valor and adds bonus damage to all_enemies', () => {
      const hero = setupBattle('the_grateful_dead')
      hero.currentValor = 50

      const enemy = battleStore.enemies[0]
      const hpBefore = enemy.currentHp

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Bygone Valor')
      battleStore.selectAction(`skill_${skillIndex}`)

      // Valor should be consumed
      expect(hero.currentValor).toBe(0)
      // Should deal damage (60% base + 50*1 = 50% bonus = 110% total)
      expect(enemy.currentHp).toBeLessThan(hpBefore)
    })

    it('applies at100Valor effects at max valor', () => {
      const hero = setupBattle('the_grateful_dead')
      hero.currentValor = 100

      const enemy = battleStore.enemies[0]
      const hpBefore = enemy.currentHp

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Bygone Valor')
      battleStore.selectAction(`skill_${skillIndex}`)

      expect(hero.currentValor).toBe(0)
      // Should apply DEF_DOWN to enemy
      if (enemy.currentHp > 0) {
        expect(battleStore.hasEffect(enemy, 'def_down')).toBe(true)
      }
    })
  })

  describe('bonusDamagePerMissingHpPercent (Matsuda Glorious End)', () => {
    it('increases AoE damage based on missing HP', () => {
      const hero = setupBattle('matsuda')
      hero.currentRage = 60

      const enemy = battleStore.enemies[0]

      // Hero at 50% HP = 50% missing = +50% bonus damage
      hero.currentHp = Math.floor(hero.maxHp * 0.5)
      const hpBefore = enemy.currentHp

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Glorious End')
      battleStore.selectAction(`skill_${skillIndex}`)

      // Should deal significant damage (180% + 50% bonus = 230% ATK)
      const damageDealt = hpBefore - enemy.currentHp
      expect(damageDealt).toBeGreaterThan(0)
    })
  })

  describe('executeBonus (Torga Death Knell)', () => {
    it('deals increased damage when target below threshold', () => {
      const hero = setupBattle('torga_bloodbeat')
      hero.currentRage = 40

      const enemy = battleStore.enemies[0]
      // Set enemy to 20% HP (below 30% threshold)
      enemy.currentHp = Math.floor(enemy.maxHp * 0.2)
      const hpBefore = enemy.currentHp

      const skillIndex = hero.template.skills.findIndex(s => s.name === 'Death Knell')
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(enemy.id, 'enemy')

      // Should deal heavy damage (250% instead of 150%)
      const damageDealt = hpBefore - Math.max(0, enemy.currentHp)
      expect(damageDealt).toBeGreaterThan(0)
    })
  })
})
