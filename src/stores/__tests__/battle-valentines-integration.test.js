// src/stores/__tests__/battle-valentines-integration.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { mara_thornheart } from '../../data/heroes/5star/mara_thornheart.js'
import { philemon_the_ardent } from '../../data/heroes/4star/philemon_the_ardent.js'
import { EffectType } from '../../data/statusEffects'

describe("Valentine's heroes full integration", () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('Mara + Philemon party synergy', () => {
    beforeEach(() => {
      const mara = heroesStore.addHero('mara_thornheart')
      const philemon = heroesStore.addHero('philemon_the_ardent')
      heroesStore.setPartySlot(0, mara.instanceId)
      heroesStore.setPartySlot(1, philemon.instanceId)
      heroesStore.setPartyLeader(mara.instanceId)

      store.initBattle({}, ['goblin_scout', 'goblin_warrior'])
    })

    it('both heroes initialize correctly in battle', () => {
      const mara = store.heroes.find(h => h.templateId === 'mara_thornheart')
      const philemon = store.heroes.find(h => h.templateId === 'philemon_the_ardent')

      expect(mara).toBeDefined()
      expect(philemon).toBeDefined()
      expect(mara.heartbreakStacks).toBe(0)
      expect(philemon.currentValor).toBe(0)
    })

    it('Mara gains Heartbreak stack when she takes heavy damage (15%+ of her max HP)', () => {
      const mara = store.heroes.find(h => h.templateId === 'mara_thornheart')

      expect(mara.heartbreakStacks).toBe(0)

      // Mara takes heavy damage (15%+ of her max HP)
      const heavyDamage = Math.ceil(mara.maxHp * 0.20)
      store.applyDamage(mara, heavyDamage, 'attack', store.enemies[0])

      // Mara should have gained a stack from heavy self-damage
      expect(mara.heartbreakStacks).toBe(1)
    })

    it("Mara's leader skill grants passive lifesteal to both heroes", () => {
      const mara = store.heroes.find(h => h.templateId === 'mara_thornheart')
      const philemon = store.heroes.find(h => h.templateId === 'philemon_the_ardent')

      // Both should have leader bonus lifesteal
      expect(mara.leaderBonuses.lifesteal).toBe(5)
      expect(philemon.leaderBonuses.lifesteal).toBe(5)
    })

    it("Mara's leader skill triggers ATK buff when Philemon drops below 50% HP", () => {
      const philemon = store.heroes.find(h => h.templateId === 'philemon_the_ardent')

      // Set Philemon HP above threshold
      philemon.currentHp = 600
      philemon.maxHp = 1000

      // Verify no ATK_UP effect yet
      expect(philemon.statusEffects.filter(e => e.type === EffectType.ATK_UP).length).toBe(0)

      // Apply damage that drops Philemon below 50%
      store.applyDamage(philemon, 150, 'attack')

      // Should now have ATK_UP effect from leader skill
      const atkUp = philemon.statusEffects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.value).toBe(15)
      expect(atkUp.duration).toBe(3)
    })

    it('Philemon protecting Mara with guardedBy redirects damage', () => {
      const mara = store.heroes.find(h => h.templateId === 'mara_thornheart')
      const philemon = store.heroes.find(h => h.templateId === 'philemon_the_ardent')

      // Apply guardedBy (simulating Heart's Shield effect)
      mara.guardedBy = {
        guardianId: philemon.instanceId,
        percent: 100,
        duration: 2
      }

      const originalMaraHp = mara.currentHp
      const originalPhilemonHp = philemon.currentHp

      // Attack Mara
      store.applyDamage(mara, 100, 'attack', store.enemies[0])

      // Mara should not have taken the damage
      expect(mara.currentHp).toBe(originalMaraHp)
      // Philemon should have taken it
      expect(philemon.currentHp).toBeLessThan(originalPhilemonHp)
    })

    it('Mara gains Heartbreak when Philemon drops below 50% HP', () => {
      const mara = store.heroes.find(h => h.templateId === 'mara_thornheart')
      const philemon = store.heroes.find(h => h.templateId === 'philemon_the_ardent')

      expect(mara.heartbreakStacks).toBe(0)

      // Set Philemon HP above threshold
      philemon.currentHp = 600
      philemon.maxHp = 1000

      // Apply damage that drops Philemon below 50%
      store.applyDamage(philemon, 150, 'attack', store.enemies[0])

      // Mara should have gained a Heartbreak stack from ally dropping below 50%
      expect(mara.heartbreakStacks).toBe(1)
      expect(philemon.triggeredHeartbreak).toBe(true)
    })
  })

  describe('Mara skill execution', () => {
    beforeEach(() => {
      const mara = heroesStore.addHero('mara_thornheart')
      heroesStore.setPartySlot(0, mara.instanceId)
      store.initBattle({}, ['goblin_scout'])
    })

    it("Love's Final Thorn calculates bonus damage from stacks", () => {
      const skill = mara_thornheart.skills.find(s => s.name === "Love's Final Thorn")

      // Verify skill properties exist
      expect(skill.damagePercent).toBe(200)
      expect(skill.damagePerHeartbreakStackConsumed).toBe(25)
      expect(skill.consumeAllHeartbreakStacks).toBe(true)

      // Calculate expected damage multiplier with 4 stacks
      const stacks = 4
      const expectedMultiplier = skill.damagePercent + (stacks * skill.damagePerHeartbreakStackConsumed)
      expect(expectedMultiplier).toBe(300) // 200 + (4 * 25) = 300%
    })

    it('Scorned skill grants +1 Heartbreak stack', () => {
      const skill = mara_thornheart.skills.find(s => s.name === 'Scorned')

      expect(skill.grantHeartbreakStacks).toBe(1)
      expect(skill.effects.find(e => e.type === EffectType.REFLECT)).toBeDefined()
    })

    it('Vengeance Garden has Heartbreak stack damage scaling', () => {
      const skill = mara_thornheart.skills.find(s => s.name === 'Vengeance Garden')

      expect(skill.damagePercent).toBe(90)
      expect(skill.damagePerHeartbreakStack).toBe(15)
      expect(skill.targetType).toBe('all_enemies')

      // At 5 stacks: 90 + (5 * 15) = 165%
      const stackDamage = skill.damagePercent + (5 * skill.damagePerHeartbreakStack)
      expect(stackDamage).toBe(165)
    })

    it('Bitter Embrace applies Weakened at 3+ Heartbreak stacks', () => {
      const skill = mara_thornheart.skills.find(s => s.name === 'Bitter Embrace')

      expect(skill.conditionalEffects).toBeDefined()
      expect(skill.conditionalEffects.heartbreakThreshold).toBe(3)

      const weakenEffect = skill.conditionalEffects.effects.find(e => e.type === EffectType.ATK_DOWN)
      expect(weakenEffect).toBeDefined()
      expect(weakenEffect.value).toBe(15)
    })
  })

  describe('Philemon skill mechanics', () => {
    beforeEach(() => {
      const philemon = heroesStore.addHero('philemon_the_ardent')
      heroesStore.setPartySlot(0, philemon.instanceId)
      store.initBattle({}, ['goblin_scout'])
    })

    it('Undying Devotion applies Death Prevention with damage-to-source', () => {
      const skill = philemon_the_ardent.skills.find(s => s.name === 'Undying Devotion')
      const deathPreventionEffect = skill.effects.find(e => e.type === EffectType.DEATH_PREVENTION)

      expect(deathPreventionEffect).toBeDefined()
      expect(deathPreventionEffect.duration).toBe(3)
      expect(deathPreventionEffect.damageToSourceOnTrigger).toBe(25)
    })

    it("Heart's Shield applies GUARDING effect", () => {
      const skill = philemon_the_ardent.skills.find(s => s.name === "Heart's Shield")
      const guardingEffect = skill.effects.find(e => e.type === EffectType.GUARDING)

      expect(guardingEffect).toBeDefined()
      expect(guardingEffect.duration).toBe(2)
      expect(skill.selfBuffWhileGuarding).toBeDefined()
      expect(skill.selfBuffWhileGuarding.value).toBe(20)
    })

    it('Devoted Strike gives bonus Valor when guarding', () => {
      const skill = philemon_the_ardent.skills.find(s => s.name === 'Devoted Strike')

      expect(skill.valorGain).toBe(10)
      expect(skill.valorGainBonusIfGuarding).toBe(5)
    })

    it('Heartsworn Bulwark shields scale from caster max HP', () => {
      const skill = philemon_the_ardent.skills.find(s => s.name === 'Heartsworn Bulwark')
      const shieldEffect = skill.effects.find(e => e.type === EffectType.SHIELD)

      expect(shieldEffect.shieldPercentCasterMaxHp).toBe(15)
      expect(skill.selfBuffWhileShieldsActive).toBeDefined()
      expect(skill.selfBuffWhileShieldsActive.value).toBe(25)
    })
  })

  describe('Death Prevention damage-to-source integration', () => {
    it('damages Philemon when Death Prevention triggers on ally', () => {
      const philemon = {
        instanceId: 'philemon1',
        template: { name: 'Philemon the Ardent' },
        currentHp: 1000,
        maxHp: 1000,
        statusEffects: []
      }

      const ally = {
        instanceId: 'ally1',
        template: { name: 'Protected Ally' },
        currentHp: 50,
        maxHp: 500,
        statusEffects: [
          {
            type: EffectType.DEATH_PREVENTION,
            duration: 3,
            damageToSourceOnTrigger: 25,
            sourceId: 'philemon1',
            definition: { isDeathPrevention: true }
          }
        ]
      }

      store.heroes = [philemon, ally]
      store.enemies = [{
        id: 'enemy1',
        templateId: 'goblin_scout',
        template: { id: 'goblin_scout', name: 'Goblin Scout' },
        currentHp: 100,
        maxHp: 100,
        stats: { atk: 20, def: 5, spd: 10 },
        statusEffects: []
      }]

      // Apply lethal damage to ally
      store.applyDamage(ally, 100, 'attack', null)

      // Ally should survive at 1 HP
      expect(ally.currentHp).toBe(1)

      // Philemon should take 25% of his max HP (250 damage)
      expect(philemon.currentHp).toBe(750)
    })
  })

  describe('Heartbreak bonuses calculation', () => {
    it('getHeartbreakBonuses returns correct ATK and lifesteal values', () => {
      const mara = {
        instanceId: 'mara1',
        template: mara_thornheart,
        heartbreakStacks: 3,
        stats: { atk: 100 }
      }

      const bonuses = store.getHeartbreakBonuses(mara)

      // 3 stacks * 4% ATK per stack = 12%
      expect(bonuses.atkBonus).toBe(12)
      // 3 stacks * 3% lifesteal per stack = 9%
      expect(bonuses.lifestealBonus).toBe(9)
    })

    it('getHeartbreakBonuses caps at max stacks', () => {
      const mara = {
        instanceId: 'mara1',
        template: mara_thornheart,
        heartbreakStacks: 5, // Max stacks
        stats: { atk: 100 }
      }

      const bonuses = store.getHeartbreakBonuses(mara)

      // 5 stacks * 4% ATK per stack = 20%
      expect(bonuses.atkBonus).toBe(20)
      // 5 stacks * 3% lifesteal per stack = 15%
      expect(bonuses.lifestealBonus).toBe(15)
    })

    it('getHeartbreakBonuses returns zero for non-Heartbreak heroes', () => {
      const regularHero = {
        instanceId: 'hero1',
        template: { id: 'aurora_the_dawn' },
        heartbreakStacks: undefined
      }

      const bonuses = store.getHeartbreakBonuses(regularHero)

      expect(bonuses.atkBonus).toBe(0)
      expect(bonuses.lifestealBonus).toBe(0)
    })
  })

  describe('Combined synergy scenario', () => {
    it('simulates a full combat scenario with both heroes', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      const philemon = heroesStore.addHero('philemon_the_ardent')
      heroesStore.setPartySlot(0, mara.instanceId)
      heroesStore.setPartySlot(1, philemon.instanceId)
      heroesStore.setPartyLeader(mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')
      const battlePhilemon = store.heroes.find(h => h.templateId === 'philemon_the_ardent')

      // Verify initial state
      expect(battleMara.heartbreakStacks).toBe(0)
      expect(battleMara.leaderBonuses.lifesteal).toBe(5)
      expect(battlePhilemon.leaderBonuses.lifesteal).toBe(5)

      // Set Philemon HP for testing HP threshold trigger
      battlePhilemon.currentHp = 600
      battlePhilemon.maxHp = 1000

      // Simulate: Enemy attacks Philemon directly (drops below 50% HP)
      store.applyDamage(battlePhilemon, 150, 'attack', store.enemies[0])

      // Philemon should have taken the damage
      expect(battlePhilemon.currentHp).toBe(450)

      // Mara should gain Heartbreak from Philemon dropping below 50% HP
      expect(battleMara.heartbreakStacks).toBe(1)
      expect(battlePhilemon.triggeredHeartbreak).toBe(true)

      // Philemon should have ATK buff from leader skill
      const atkUp = battlePhilemon.statusEffects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.value).toBe(15)
    })

    it('guardedBy correctly redirects damage from Mara to Philemon', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      const philemon = heroesStore.addHero('philemon_the_ardent')
      heroesStore.setPartySlot(0, mara.instanceId)
      heroesStore.setPartySlot(1, philemon.instanceId)
      heroesStore.setPartyLeader(mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')
      const battlePhilemon = store.heroes.find(h => h.templateId === 'philemon_the_ardent')

      // Philemon guards Mara (100% redirect)
      battleMara.guardedBy = {
        guardianId: battlePhilemon.instanceId,
        percent: 100,
        duration: 2
      }

      const maraHpBefore = battleMara.currentHp
      const philemonHpBefore = battlePhilemon.currentHp

      // Enemy attacks Mara
      store.applyDamage(battleMara, 100, 'attack', store.enemies[0])

      // Mara should be unharmed
      expect(battleMara.currentHp).toBe(maraHpBefore)

      // Philemon should have taken the redirected damage
      expect(battlePhilemon.currentHp).toBe(philemonHpBefore - 100)
    })
  })
})
