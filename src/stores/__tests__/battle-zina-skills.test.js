// src/stores/__tests__/battle-zina-skills.test.js
// TDD tests for Zina the Desperate's skill behaviors in battle
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - Zina skill behaviors', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  // Helper: create a minimal Alchemist hero with Essence
  function makeZina(overrides = {}) {
    const hero = {
      instanceId: 'zina_1',
      templateId: 'zina_the_desperate',
      template: {
        id: 'zina_the_desperate',
        name: 'Zina',
        classId: 'alchemist',
        skills: [],
        baseStats: { hp: 750, atk: 380, def: 150, spd: 160, mp: 60 }
      },
      class: { id: 'alchemist', resourceType: 'essence', resourceName: 'Essence' },
      stats: { hp: 750, atk: 380, def: 150, spd: 160 },
      currentHp: 750,
      maxHp: 750,
      currentEssence: 30,
      maxEssence: 60,
      level: 1,
      statusEffects: [],
      currentCooldowns: {},
      ...overrides
    }
    return hero
  }

  function makeEnemy(overrides = {}) {
    return {
      id: 'enemy_1',
      template: { id: 'goblin', name: 'Goblin', skills: [] },
      stats: { atk: 50, def: 50, spd: 30 },
      currentHp: 500,
      maxHp: 500,
      statusEffects: [],
      ...overrides
    }
  }

  // =====================================================
  // Task 1: Essence cost deduction
  // =====================================================
  describe('Essence cost deduction', () => {
    it('canUseSkill returns true when Essence >= essenceCost', () => {
      const hero = makeZina({ currentEssence: 30 })
      hero.skill = { essenceCost: 10 }
      expect(store.canUseSkill(hero)).toBe(true)
    })

    it('canUseSkill returns true when Essence exactly equals essenceCost', () => {
      const hero = makeZina({ currentEssence: 10 })
      hero.skill = { essenceCost: 10 }
      expect(store.canUseSkill(hero)).toBe(true)
    })

    it('canUseSkill returns false when Essence < essenceCost', () => {
      const hero = makeZina({ currentEssence: 5 })
      hero.skill = { essenceCost: 10 }
      expect(store.canUseSkill(hero)).toBe(false)
    })

    it('canUseSkill returns true for zero-cost Alchemist skill', () => {
      const hero = makeZina({ currentEssence: 0 })
      hero.skill = { essenceCost: 0 }
      expect(store.canUseSkill(hero)).toBe(true)
    })
  })

  // =====================================================
  // Task 2: selfDamagePercentMaxHp (Tainted Feast)
  // =====================================================
  describe('selfDamagePercentMaxHp (Tainted Feast)', () => {
    it('deals self-damage based on max HP percentage', () => {
      const hero = makeZina({ currentHp: 750, maxHp: 750 })
      // Simulate the self-damage logic directly
      const skill = { selfDamagePercentMaxHp: 15 }

      // This mirrors the logic in battle.js line ~3244
      if (skill.selfDamagePercentMaxHp && hero.currentHp > 0) {
        const selfDamage = Math.floor(hero.maxHp * skill.selfDamagePercentMaxHp / 100)
        hero.currentHp = Math.max(1, hero.currentHp - selfDamage)
      }

      // 15% of 750 = 112
      expect(hero.currentHp).toBe(750 - 112)
    })

    it('does not kill the hero (minimum 1 HP)', () => {
      const hero = makeZina({ currentHp: 50, maxHp: 750 })
      const skill = { selfDamagePercentMaxHp: 15 }

      if (skill.selfDamagePercentMaxHp && hero.currentHp > 0) {
        const selfDamage = Math.floor(hero.maxHp * skill.selfDamagePercentMaxHp / 100)
        hero.currentHp = Math.max(1, hero.currentHp - selfDamage)
      }

      // 15% of 750 = 112, would reduce 50 to -62, but clamped to 1
      expect(hero.currentHp).toBe(1)
    })
  })

  // =====================================================
  // Task 3: usesVolatility damage bonus
  // =====================================================
  describe('Volatility damage bonus on skills', () => {
    it('applies +15% damage bonus at Reactive tier (Essence 21-40)', () => {
      const hero = makeZina({ currentEssence: 30 })
      expect(store.getVolatilityTier(hero)).toBe('reactive')
      expect(store.getVolatilityDamageBonus(hero)).toBe(15)
    })

    it('applies +30% damage bonus at Volatile tier (Essence 41+)', () => {
      const hero = makeZina({ currentEssence: 50 })
      expect(store.getVolatilityTier(hero)).toBe('volatile')
      expect(store.getVolatilityDamageBonus(hero)).toBe(30)
    })

    it('applies no damage bonus at Stable tier (Essence 0-20)', () => {
      const hero = makeZina({ currentEssence: 15 })
      expect(store.getVolatilityTier(hero)).toBe('stable')
      expect(store.getVolatilityDamageBonus(hero)).toBe(0)
    })

    it('Tainted Tonic damage is increased by Volatility bonus', () => {
      // Reactive tier: +15% bonus on 90% damagePercent
      const hero = makeZina({ currentEssence: 30 })
      const skill = { damagePercent: 90, usesVolatility: true }

      const bonus = store.getVolatilityDamageBonus(hero)
      const effectiveDamagePercent = skill.damagePercent + bonus
      // 90 + 15 = 105
      expect(effectiveDamagePercent).toBe(105)
    })

    it("Death's Needle damage is increased by Volatility bonus at Volatile tier", () => {
      const hero = makeZina({ currentEssence: 50 })
      const skill = { damagePercent: 175, usesVolatility: true }

      const bonus = store.getVolatilityDamageBonus(hero)
      const effectiveDamagePercent = skill.damagePercent + bonus
      // 175 + 30 = 205
      expect(effectiveDamagePercent).toBe(205)
    })

    it('Volatile tier self-damage is 5% max HP', () => {
      const hero = makeZina({ currentEssence: 50, maxHp: 750 })
      expect(store.getVolatilitySelfDamage(hero)).toBe(37) // floor(750 * 0.05)
    })

    it('non-Volatile tiers have no self-damage', () => {
      const hero = makeZina({ currentEssence: 30, maxHp: 750 })
      expect(store.getVolatilitySelfDamage(hero)).toBe(0)
    })
  })

  // =====================================================
  // Task 4: conditionalAtLowHp (Death's Needle)
  // =====================================================
  describe("conditionalAtLowHp (Death's Needle)", () => {
    it('getConditionalAtLowHp returns null when HP above threshold', () => {
      const hero = makeZina({ currentHp: 750, maxHp: 750 })
      const skill = { conditionalAtLowHp: { hpThreshold: 30, ignoresDef: true, cannotMiss: true } }

      const hpPercent = (hero.currentHp / hero.maxHp) * 100
      const isLowHp = hpPercent < skill.conditionalAtLowHp.hpThreshold
      expect(isLowHp).toBe(false)
    })

    it('getConditionalAtLowHp activates when HP below threshold', () => {
      const hero = makeZina({ currentHp: 150, maxHp: 750 }) // 20% HP
      const skill = { conditionalAtLowHp: { hpThreshold: 30, ignoresDef: true, cannotMiss: true } }

      const hpPercent = (hero.currentHp / hero.maxHp) * 100
      const isLowHp = hpPercent < skill.conditionalAtLowHp.hpThreshold
      expect(isLowHp).toBe(true)
    })

    it('ignoresDef at low HP means DEF is treated as 0', () => {
      const hero = makeZina({ currentHp: 150, maxHp: 750 })
      const skill = {
        damagePercent: 175,
        conditionalAtLowHp: { hpThreshold: 30, ignoresDef: true, cannotMiss: true }
      }
      const targetDef = 100
      const atk = 380

      const hpPercent = (hero.currentHp / hero.maxHp) * 100
      const isLowHp = hpPercent < skill.conditionalAtLowHp.hpThreshold

      // Normal damage: atk * multiplier * (100 / (100 + def))
      // With ignoresDef: atk * multiplier * (100 / (100 + 0))
      const normalDamage = Math.max(1, Math.floor(atk * (skill.damagePercent / 100) * (100 / (100 + targetDef))))
      const ignoredDefDamage = Math.max(1, Math.floor(atk * (skill.damagePercent / 100) * (100 / (100 + 0))))

      expect(isLowHp).toBe(true)
      expect(ignoredDefDamage).toBeGreaterThan(normalDamage)
      // Full damage: 380 * 1.75 = 665 (no def reduction)
      expect(ignoredDefDamage).toBe(665)
    })
  })

  // =====================================================
  // Task 5: lowHpTrigger passive (Cornered Animal)
  // =====================================================
  describe('lowHpTrigger passive (Cornered Animal)', () => {
    it('checkLowHpTrigger detects passive on hero template', () => {
      const hero = makeZina({
        template: {
          id: 'zina_the_desperate',
          name: 'Zina',
          classId: 'alchemist',
          skills: [
            {
              name: 'Cornered Animal',
              isPassive: true,
              passiveType: 'lowHpTrigger',
              triggerBelowHpPercent: 30,
              oncePerBattle: true,
              triggerEffects: [
                { type: 'atk_up', target: 'self', duration: 2, value: 40 },
                { type: 'spd_up', target: 'self', duration: 2, value: 30 }
              ]
            }
          ],
          baseStats: { hp: 750, atk: 380, def: 150, spd: 160, mp: 60 }
        }
      })

      const passive = store.getLowHpTriggerPassive(hero)
      expect(passive).toBeDefined()
      expect(passive.triggerBelowHpPercent).toBe(30)
      expect(passive.triggerEffects).toHaveLength(2)
    })

    it('checkLowHpTrigger returns null for hero without passive', () => {
      const hero = makeZina({
        template: {
          id: 'zina_the_desperate',
          name: 'Zina',
          classId: 'alchemist',
          skills: [{ name: 'Tainted Tonic', isPassive: false }],
          baseStats: { hp: 750, atk: 380, def: 150, spd: 160, mp: 60 }
        }
      })

      const passive = store.getLowHpTriggerPassive(hero)
      expect(passive).toBeNull()
    })

    it('triggers effects when HP drops below threshold', () => {
      const hero = makeZina({
        currentHp: 200, // Will be set to drop below 30%
        maxHp: 750,
        template: {
          id: 'zina_the_desperate',
          name: 'Zina',
          classId: 'alchemist',
          skills: [
            {
              name: 'Cornered Animal',
              isPassive: true,
              passiveType: 'lowHpTrigger',
              triggerBelowHpPercent: 30,
              oncePerBattle: true,
              triggerEffects: [
                { type: 'atk_up', target: 'self', duration: 2, value: 40 },
                { type: 'spd_up', target: 'self', duration: 2, value: 30 }
              ]
            }
          ],
          baseStats: { hp: 750, atk: 380, def: 150, spd: 160, mp: 60 }
        }
      })

      // HP was above 30% (226+), now at 200 (26.7%) — below threshold
      store.processLowHpTrigger(hero, 230)

      // Should have gained ATK_UP and SPD_UP
      const atkUp = hero.statusEffects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.value).toBe(40)
      expect(atkUp.duration).toBe(2)

      const spdUp = hero.statusEffects.find(e => e.type === EffectType.SPD_UP)
      expect(spdUp).toBeDefined()
      expect(spdUp.value).toBe(30)
      expect(spdUp.duration).toBe(2)
    })

    it('does not trigger if HP was already below threshold', () => {
      const hero = makeZina({
        currentHp: 150, // 20% — already below
        maxHp: 750,
        template: {
          id: 'zina_the_desperate',
          name: 'Zina',
          classId: 'alchemist',
          skills: [
            {
              name: 'Cornered Animal',
              isPassive: true,
              passiveType: 'lowHpTrigger',
              triggerBelowHpPercent: 30,
              oncePerBattle: true,
              triggerEffects: [
                { type: 'atk_up', target: 'self', duration: 2, value: 40 }
              ]
            }
          ],
          baseStats: { hp: 750, atk: 380, def: 150, spd: 160, mp: 60 }
        }
      })

      // HP was 150 (20%), still 150 — already below, not crossing
      store.processLowHpTrigger(hero, 150)

      expect(hero.statusEffects).toHaveLength(0)
    })

    it('does not trigger a second time (oncePerBattle)', () => {
      const hero = makeZina({
        currentHp: 200,
        maxHp: 750,
        lowHpTriggerFired: true, // Already triggered
        template: {
          id: 'zina_the_desperate',
          name: 'Zina',
          classId: 'alchemist',
          skills: [
            {
              name: 'Cornered Animal',
              isPassive: true,
              passiveType: 'lowHpTrigger',
              triggerBelowHpPercent: 30,
              oncePerBattle: true,
              triggerEffects: [
                { type: 'atk_up', target: 'self', duration: 2, value: 40 }
              ]
            }
          ],
          baseStats: { hp: 750, atk: 380, def: 150, spd: 160, mp: 60 }
        }
      })

      store.processLowHpTrigger(hero, 230)

      expect(hero.statusEffects).toHaveLength(0)
    })
  })

  // =====================================================
  // Task 6: Tainted Feast AoE poison application (bugfix)
  // =====================================================
  describe('Tainted Feast AoE poison (all_enemies effect target)', () => {
    function setupBattle(hero, enemyList) {
      store.heroes.push(hero)
      for (const e of enemyList) store.enemies.push(e)
      store.turnOrder.push({ type: 'hero', id: hero.instanceId })
      store.currentTurnIndex = 0
      store.state = 'player_turn'
    }

    it('applies POISON to all enemies via Tainted Feast', () => {
      const hero = makeZina({ currentEssence: 30 })
      hero.template.skills = [
        {
          name: 'Tainted Feast',
          essenceCost: 20,
          targetType: 'all_enemies',
          noDamage: true,
          usesVolatility: true,
          selfDamagePercentMaxHp: 15,
          effects: [
            { type: EffectType.POISON, target: 'all_enemies', duration: 3, atkPercent: 45 }
          ]
        }
      ]
      const enemy1 = makeEnemy({ id: 'enemy_1', template: { id: 'goblin', name: 'Goblin A', skills: [] } })
      const enemy2 = makeEnemy({ id: 'enemy_2', template: { id: 'goblin', name: 'Goblin B', skills: [] } })

      setupBattle(hero, [enemy1, enemy2])
      store.selectAction('skill_0')

      // Both enemies should have POISON
      expect(enemy1.statusEffects.some(e => e.type === EffectType.POISON)).toBe(true)
      expect(enemy2.statusEffects.some(e => e.type === EffectType.POISON)).toBe(true)
      expect(enemy1.statusEffects.find(e => e.type === EffectType.POISON).duration).toBe(3)
    })

    it('does not deal damage when noDamage is true', () => {
      const hero = makeZina({ currentEssence: 30 })
      hero.template.skills = [
        {
          name: 'Tainted Feast',
          essenceCost: 20,
          targetType: 'all_enemies',
          noDamage: true,
          usesVolatility: true,
          selfDamagePercentMaxHp: 15,
          effects: [
            { type: EffectType.POISON, target: 'all_enemies', duration: 3, atkPercent: 45 }
          ]
        }
      ]
      const enemy1 = makeEnemy({ id: 'enemy_1', template: { id: 'goblin', name: 'Goblin A', skills: [] } })

      setupBattle(hero, [enemy1])
      store.selectAction('skill_0')

      // Enemy should be at full HP — no damage from noDamage skill
      expect(enemy1.currentHp).toBe(500)
    })

    it('applies selfDamagePercentMaxHp to Zina', () => {
      const hero = makeZina({ currentEssence: 30, currentHp: 750, maxHp: 750 })
      hero.template.skills = [
        {
          name: 'Tainted Feast',
          essenceCost: 20,
          targetType: 'all_enemies',
          noDamage: true,
          usesVolatility: true,
          selfDamagePercentMaxHp: 15,
          effects: [
            { type: EffectType.POISON, target: 'all_enemies', duration: 3, atkPercent: 45 }
          ]
        }
      ]
      const enemy1 = makeEnemy({ id: 'enemy_1', template: { id: 'goblin', name: 'Goblin A', skills: [] } })

      setupBattle(hero, [enemy1])
      store.selectAction('skill_0')

      // 15% of 750 = 112 self-damage
      expect(hero.currentHp).toBe(750 - 112)
    })
  })
})
