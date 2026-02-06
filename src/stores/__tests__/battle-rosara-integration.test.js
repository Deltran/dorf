// src/stores/__tests__/battle-rosara-integration.test.js
// TDD: Comprehensive tests for Rosara the Unmoved's battle mechanics
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore, BattleState } from '../battle'
import { useHeroesStore } from '../heroes'
import { EffectType } from '../../data/statusEffects'

describe('Rosara the Unmoved - full battle integration', () => {
  let battleStore
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  // Helper: set up Rosara in battle with optional allies using real initBattle
  function setupRosaraBattle(options = {}) {
    const { asLeader = false, allies = [], enemyIds = ['goblin_scout'] } = options
    const rosara = heroesStore.addHero('rosara_the_unmoved')
    heroesStore.setPartySlot(0, rosara.instanceId)

    allies.forEach((allyId, i) => {
      const ally = heroesStore.addHero(allyId)
      heroesStore.setPartySlot(i + 1, ally.instanceId)
    })

    if (asLeader) {
      heroesStore.setPartyLeader(rosara.instanceId)
    }

    battleStore.initBattle({}, enemyIds)

    const battleRosara = battleStore.heroes.find(h => h.templateId === 'rosara_the_unmoved')
    const battleAllies = allies.map(allyId =>
      battleStore.heroes.find(h => h.templateId === allyId)
    )
    const enemy = battleStore.enemies[0]

    return { battleRosara, battleAllies, enemy }
  }

  // Helper: make Rosara the current unit and execute a skill by index
  // Rosara's skills: [0]=Quiet Defiance (passive), [1]=Seat of Power, [2]=Weight of History,
  //                  [3]=Unwavering (passive), [4]=Monument to Defiance
  function executeSkill(rosara, skillIndex, targetId, targetType = 'enemy') {
    // Set up battle state for player action
    battleStore.turnOrder = [{ type: 'hero', id: rosara.instanceId }]
    battleStore.currentTurnIndex = 0
    battleStore.state = BattleState.PLAYER_TURN

    const skill = rosara.template.skills[skillIndex]
    if (skill.targetType === 'self' || skill.targetType === 'all_enemies' || skill.targetType === 'all_allies') {
      battleStore.selectAction(`skill_${skillIndex}`)
    } else {
      battleStore.selectAction(`skill_${skillIndex}`)
      battleStore.selectTarget(targetId, targetType)
    }
  }

  function executeBasicAttack(rosara, targetId) {
    battleStore.turnOrder = [{ type: 'hero', id: rosara.instanceId }]
    battleStore.currentTurnIndex = 0
    battleStore.state = BattleState.PLAYER_TURN

    battleStore.selectAction('attack')
    battleStore.selectTarget(targetId, 'enemy')
  }

  // =========================================
  // 1. Quiet Defiance (Basic Attack Modifier)
  // =========================================
  describe('Quiet Defiance - basic attack modifier', () => {
    it('deals 80% ATK when Rosara was NOT attacked last round', () => {
      const { battleRosara } = setupRosaraBattle()
      expect(battleRosara.wasAttacked).toBe(false)

      const damagePercent = battleStore.getBasicAttackDamagePercent(battleRosara)
      expect(damagePercent).toBe(80)
    })

    it('deals 120% ATK when Rosara WAS attacked last round', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.wasAttacked = true

      const damagePercent = battleStore.getBasicAttackDamagePercent(battleRosara)
      expect(damagePercent).toBe(120)
    })

    it('resets wasAttacked after Rosara takes her turn', () => {
      const { battleRosara, enemy } = setupRosaraBattle()
      battleRosara.wasAttacked = true

      // Execute basic attack through the real battle flow
      executeBasicAttack(battleRosara, enemy.id)

      expect(battleRosara.wasAttacked).toBe(false)
    })
  })

  // =========================================
  // 2. Seat of Power (Bulwark Stance)
  // =========================================
  describe('Seat of Power - Bulwark stance', () => {
    it('applies SEATED, TAUNT, and DEF_UP on self', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 0

      // Seat of Power is skill index 1 (targetType: self, auto-executes)
      executeSkill(battleRosara, 1)

      expect(battleStore.hasEffect(battleRosara, EffectType.SEATED)).toBe(true)
      expect(battleStore.hasEffect(battleRosara, EffectType.TAUNT)).toBe(true)
      expect(battleStore.hasEffect(battleRosara, EffectType.DEF_UP)).toBe(true)
    })

    it('scales duration with Valor - base 2 turns at 0 Valor (1 after end-of-turn tick)', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 0

      executeSkill(battleRosara, 1)

      // Duration 2 decrements to 1 after end-of-turn processing
      const seated = battleRosara.statusEffects.find(e => e.type === EffectType.SEATED)
      expect(seated.duration).toBe(1)
    })

    it('scales duration with Valor - 3 turns at 50+ Valor (2 after end-of-turn tick)', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 50

      executeSkill(battleRosara, 1)

      // Duration 3 decrements to 2 after end-of-turn processing
      const seated = battleRosara.statusEffects.find(e => e.type === EffectType.SEATED)
      expect(seated.duration).toBe(2)
    })

    it('scales DEF_UP value with Valor tiers - base 20 at 0 Valor', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 0

      executeSkill(battleRosara, 1)

      const defUp = battleRosara.statusEffects.find(e => e.type === EffectType.DEF_UP)
      expect(defUp.value).toBe(20)
    })

    it('scales DEF_UP to 30 at 25 Valor', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 25

      executeSkill(battleRosara, 1)

      const defUp = battleRosara.statusEffects.find(e => e.type === EffectType.DEF_UP)
      expect(defUp.value).toBe(30)
    })

    it('scales DEF_UP to 50 at 100 Valor', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 100

      executeSkill(battleRosara, 1)

      const defUp = battleRosara.statusEffects.find(e => e.type === EffectType.DEF_UP)
      expect(defUp.value).toBe(50)
    })

    it('prevents skill use while SEATED', () => {
      const { battleRosara } = setupRosaraBattle()
      // Manually add SEATED effect to test canUseSkill
      battleRosara.statusEffects.push({
        type: EffectType.SEATED,
        duration: 2,
        definition: { isSeated: true }
      })

      const weightOfHistory = battleRosara.template.skills.find(s => s.name === 'Weight of History')
      battleRosara.skill = weightOfHistory
      expect(battleStore.canUseSkill(battleRosara)).toBe(false)
    })

    it('selectAction does not execute skills while SEATED', () => {
      const { battleRosara, enemy } = setupRosaraBattle()
      battleRosara.currentValor = 30

      // Use Seat of Power to become SEATED
      executeSkill(battleRosara, 1)
      expect(battleRosara.statusEffects.some(e => e.type === EffectType.SEATED)).toBe(true)

      // Now try to use Weight of History while SEATED
      battleStore.turnOrder = [{ type: 'hero', id: battleRosara.instanceId }]
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      battleStore.selectAction('skill_2')
      // If selectAction doesn't block, it will set up target selection
      // Try to select target to complete the skill
      if (battleStore.needsTargetSelection) {
        battleStore.selectTarget(enemy.id, 'enemy')
      }
      // The enemy should NOT have MARKED applied since Rosara is SEATED
      const enemyMarked = (enemy.statusEffects || []).some(e => e.type === EffectType.MARKED)
      expect(enemyMarked).toBe(false)
    })
  })

  // =========================================
  // 3. Weight of History (MARKED)
  // =========================================
  describe('Weight of History - MARKED debuff', () => {
    it('requires 25 Valor to use', () => {
      const { battleRosara } = setupRosaraBattle()
      const skill = battleRosara.template.skills.find(s => s.name === 'Weight of History')
      battleRosara.skill = skill

      battleRosara.currentValor = 0
      expect(battleStore.canUseSkill(battleRosara)).toBe(false)

      battleRosara.currentValor = 25
      expect(battleStore.canUseSkill(battleRosara)).toBe(true)
    })

    it('applies MARKED to target enemy', () => {
      const { battleRosara, enemy } = setupRosaraBattle()
      battleRosara.currentValor = 25

      // Weight of History is skill index 2 (targetType: enemy)
      executeSkill(battleRosara, 2, enemy.id, 'enemy')

      expect(battleStore.hasEffect(enemy, EffectType.MARKED)).toBe(true)
    })

    it('MARKED value is base 30 at tier below 50', () => {
      const { battleRosara, enemy } = setupRosaraBattle()
      battleRosara.currentValor = 25

      executeSkill(battleRosara, 2, enemy.id, 'enemy')

      const marked = enemy.statusEffects.find(e => e.type === EffectType.MARKED)
      expect(marked.value).toBe(30)
    })

    it('MARKED value scales to 40 at 50+ Valor', () => {
      const { battleRosara, enemy } = setupRosaraBattle()
      battleRosara.currentValor = 50

      executeSkill(battleRosara, 2, enemy.id, 'enemy')

      const marked = enemy.statusEffects.find(e => e.type === EffectType.MARKED)
      expect(marked.value).toBe(40)
    })

    it('MARKED duration is 3 and value is 50 at 100 Valor', () => {
      const { battleRosara, enemy } = setupRosaraBattle()
      battleRosara.currentValor = 100

      executeSkill(battleRosara, 2, enemy.id, 'enemy')

      const marked = enemy.statusEffects.find(e => e.type === EffectType.MARKED)
      expect(marked.duration).toBe(3)
      expect(marked.value).toBe(50)
    })
  })

  // =========================================
  // 4. Unwavering (Control Immunity)
  // =========================================
  describe('Unwavering - control immunity passive', () => {
    it('blocks STUN from being applied to Rosara', () => {
      const { battleRosara } = setupRosaraBattle()

      battleStore.applyEffect(battleRosara, EffectType.STUN, { duration: 1 })

      expect(battleStore.hasEffect(battleRosara, EffectType.STUN)).toBe(false)
    })

    it('blocks SLEEP from being applied to Rosara', () => {
      const { battleRosara } = setupRosaraBattle()

      battleStore.applyEffect(battleRosara, EffectType.SLEEP, { duration: 2 })

      expect(battleStore.hasEffect(battleRosara, EffectType.SLEEP)).toBe(false)
    })

    it('grants +10 Valor when stun immunity triggers', () => {
      const { battleRosara } = setupRosaraBattle()
      const valorBefore = battleRosara.currentValor

      battleStore.applyEffect(battleRosara, EffectType.STUN, { duration: 1 })

      expect(battleRosara.currentValor).toBe(valorBefore + 10)
    })

    it('grants +10 Valor when sleep immunity triggers', () => {
      const { battleRosara } = setupRosaraBattle()
      const valorBefore = battleRosara.currentValor

      battleStore.applyEffect(battleRosara, EffectType.SLEEP, { duration: 2 })

      expect(battleRosara.currentValor).toBe(valorBefore + 10)
    })

    it('does NOT block other debuffs (e.g., ATK_DOWN)', () => {
      const { battleRosara } = setupRosaraBattle()

      battleStore.applyEffect(battleRosara, EffectType.ATK_DOWN, { duration: 2, value: 20 })

      expect(battleStore.hasEffect(battleRosara, EffectType.ATK_DOWN)).toBe(true)
    })

    it('caps Valor at 100 even with immunity gain', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 95

      battleStore.applyEffect(battleRosara, EffectType.STUN, { duration: 1 })

      expect(battleRosara.currentValor).toBe(100)
    })
  })

  // =========================================
  // 5. Monument to Defiance (REFLECT + onDeath)
  // =========================================
  describe('Monument to Defiance - REFLECT', () => {
    it('requires 50 Valor to use', () => {
      const { battleRosara } = setupRosaraBattle()
      const skill = battleRosara.template.skills.find(s => s.name === 'Monument to Defiance')
      battleRosara.skill = skill

      battleRosara.currentValor = 40
      expect(battleStore.canUseSkill(battleRosara)).toBe(false)

      battleRosara.currentValor = 50
      expect(battleStore.canUseSkill(battleRosara)).toBe(true)
    })

    it('consumes all Valor when used', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 75

      // Monument to Defiance is skill index 4 (targetType: self)
      executeSkill(battleRosara, 4)

      // Valor should be 0 (all consumed). Currently the defensive skill adds +5 first,
      // but valorCost:'all' should consume everything.
      expect(battleRosara.currentValor).toBe(0)
    })

    it('applies REFLECT effect on self (persists at 75+ Valor)', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 75

      executeSkill(battleRosara, 4)

      // At 75 Valor, REFLECT duration = 2 (at75 tier). After end-of-turn tick, duration = 1.
      expect(battleStore.hasEffect(battleRosara, EffectType.REFLECT)).toBe(true)
    })

    it('REFLECT at base duration (50 Valor) is logged as applied', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 50

      executeSkill(battleRosara, 4)

      // Base duration = 1, expires after end-of-turn tick. Verify it was applied via log.
      const reflectApplied = battleStore.battleLog.some(l => l.message.includes('Reflect'))
      expect(reflectApplied).toBe(true)
    })

    it('REFLECT value is 75% at 75+ Valor', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 75

      executeSkill(battleRosara, 4)

      const reflect = battleRosara.statusEffects.find(e => e.type === EffectType.REFLECT)
      expect(reflect.value).toBe(75)
    })

    it('REFLECT value is 100% at 100 Valor', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 100

      executeSkill(battleRosara, 4)

      const reflect = battleRosara.statusEffects.find(e => e.type === EffectType.REFLECT)
      expect(reflect.value).toBe(100)
    })

    describe('reflect damage cap', () => {
      it('caps reflected damage at cap value', () => {
        const { battleRosara, enemy } = setupRosaraBattle()
        battleRosara.currentValor = 75 // Use 75 so REFLECT survives end-of-turn

        executeSkill(battleRosara, 4)

        const reflect = battleRosara.statusEffects.find(e => e.type === EffectType.REFLECT)
        expect(reflect).toBeDefined()
        expect(reflect.cap).toBeDefined()

        // Cap at 75 tier = 125 (% of ATK)
        const rosAtk = battleRosara.stats.atk
        const maxReflect = Math.floor(rosAtk * reflect.cap / 100)

        // Rosara must SURVIVE the hit for reflect to fire
        battleRosara.currentHp = 999999
        battleRosara.maxHp = 999999
        const hpBefore = enemy.currentHp

        // Deal large damage (bigger than what the cap would allow reflecting)
        battleStore.applyDamage(battleRosara, 50000, 'attack', enemy)

        // Rosara survived (so reflect fired)
        expect(battleRosara.currentHp).toBeGreaterThan(0)

        const reflectedDamage = hpBefore - enemy.currentHp
        expect(reflectedDamage).toBeLessThanOrEqual(maxReflect)
        expect(reflectedDamage).toBeGreaterThan(0)
      })
    })

    describe('onDeathDuringEffect - ally buffs on death', () => {
      it('grants ATK_UP and DEF_UP to all allies when Rosara dies during REFLECT', () => {
        const { battleRosara, battleAllies } = setupRosaraBattle({
          allies: ['shadow_king']
        })
        battleRosara.currentValor = 75 // Use 75 so REFLECT survives end-of-turn

        executeSkill(battleRosara, 4)
        expect(battleStore.hasEffect(battleRosara, EffectType.REFLECT)).toBe(true)

        // Kill Rosara while REFLECT is active
        battleRosara.currentHp = 1
        battleStore.applyDamage(battleRosara, 9999, 'attack')

        expect(battleRosara.currentHp).toBe(0)

        const ally = battleAllies[0]
        expect(battleStore.hasEffect(ally, EffectType.ATK_UP)).toBe(true)
        expect(battleStore.hasEffect(ally, EffectType.DEF_UP)).toBe(true)
      })

      it('onDeath buff values scale with Valor tier at cast time', () => {
        const { battleRosara, battleAllies } = setupRosaraBattle({
          allies: ['shadow_king']
        })
        // 75 Valor before cast — skill consumes all, but value resolved at cast-time tier
        battleRosara.currentValor = 75

        executeSkill(battleRosara, 4)

        // Kill Rosara
        battleRosara.currentHp = 1
        battleStore.applyDamage(battleRosara, 9999, 'attack')

        const ally = battleAllies[0]
        const atkUp = ally.statusEffects.find(e => e.type === EffectType.ATK_UP)
        const defUp = ally.statusEffects.find(e => e.type === EffectType.DEF_UP)

        // At 75 Valor tier: { base: 20, at75: 25, at100: 30 } → 25
        expect(atkUp).toBeDefined()
        expect(atkUp.value).toBe(25)
        expect(defUp).toBeDefined()
        expect(defUp.value).toBe(25)
        expect(atkUp.duration).toBe(3)
        expect(defUp.duration).toBe(3)
      })

      it('does NOT grant buffs if Rosara dies without REFLECT active', () => {
        const { battleRosara, battleAllies } = setupRosaraBattle({
          allies: ['shadow_king']
        })

        // Kill Rosara without REFLECT
        battleRosara.currentHp = 1
        battleStore.applyDamage(battleRosara, 9999, 'attack')

        const ally = battleAllies[0]
        const atkUp = ally.statusEffects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUp).toBeUndefined()
      })
    })
  })

  // =========================================
  // 6. Leader Skill: The First to Stand
  // =========================================
  describe('Leader Skill - The First to Stand', () => {
    it('grants Taunt to an ally at battle start', () => {
      const { battleRosara, battleAllies } = setupRosaraBattle({
        asLeader: true,
        allies: ['shadow_king']
      })

      // At least one hero should have Taunt from leader skill
      const anyHasTaunt = battleStore.heroes.some(h =>
        battleStore.hasEffect(h, EffectType.TAUNT)
      )
      expect(anyHasTaunt).toBe(true)
    })

    it('grants DEF_UP (+25%) to the protected ally', () => {
      const { battleRosara, battleAllies } = setupRosaraBattle({
        asLeader: true,
        allies: ['shadow_king']
      })

      // Find the hero with Taunt from leader skill
      const protectedHero = battleStore.heroes.find(h =>
        battleStore.hasEffect(h, EffectType.TAUNT)
      )
      expect(protectedHero).toBeDefined()

      expect(battleStore.hasEffect(protectedHero, EffectType.DEF_UP)).toBe(true)
      const defUp = protectedHero.statusEffects.find(e =>
        e.type === EffectType.DEF_UP && e.sourceId === 'leader_skill'
      )
      expect(defUp).toBeDefined()
      expect(defUp.value).toBe(25)
    })

    it('Rosara shares 30% of damage dealt to protected ally', () => {
      const { battleRosara, battleAllies } = setupRosaraBattle({
        asLeader: true,
        allies: ['shadow_king']
      })

      // Find the protected ally (has Taunt)
      const protectedAlly = battleStore.heroes.find(h =>
        battleStore.hasEffect(h, EffectType.TAUNT) && h.templateId !== 'rosara_the_unmoved'
      ) || battleAllies[0]

      const rosHpBefore = battleRosara.currentHp
      const allyHpBefore = protectedAlly.currentHp

      // Apply 100 damage to the protected ally
      battleStore.applyDamage(protectedAlly, 100, 'attack')

      const rosHpLost = rosHpBefore - battleRosara.currentHp
      const allyHpLost = allyHpBefore - protectedAlly.currentHp

      // Rosara should absorb 30% of the damage
      expect(rosHpLost).toBe(30)
      expect(allyHpLost).toBe(70)
    })

    it('protects the lowest HP% ally (not Rosara herself)', () => {
      const { battleRosara, battleAllies } = setupRosaraBattle({
        asLeader: true,
        allies: ['shadow_king', 'militia_soldier']
      })

      // At least one non-Rosara hero should have Taunt from leader skill
      const protectedHeroes = battleStore.heroes.filter(h =>
        h.templateId !== 'rosara_the_unmoved' && battleStore.hasEffect(h, EffectType.TAUNT)
      )
      expect(protectedHeroes.length).toBe(1)
    })

    it('Taunt and DEF_UP from leader skill last 1 turn', () => {
      const { battleRosara, battleAllies } = setupRosaraBattle({
        asLeader: true,
        allies: ['shadow_king']
      })

      const protectedHero = battleStore.heroes.find(h =>
        battleStore.hasEffect(h, EffectType.TAUNT)
      )
      expect(protectedHero).toBeDefined()

      const taunt = protectedHero.statusEffects.find(e => e.type === EffectType.TAUNT)
      expect(taunt.duration).toBe(1)
    })
  })

  // =========================================
  // 7. Valor Integration
  // =========================================
  describe('Valor integration', () => {
    it('Rosara is a Knight with Valor resource', () => {
      const { battleRosara } = setupRosaraBattle()

      expect(battleRosara.currentValor).toBeDefined()
      expect(battleStore.isKnight(battleRosara)).toBe(true)
    })

    it('Rosara gains 10 Valor from Unwavering immunity trigger', () => {
      const { battleRosara } = setupRosaraBattle()
      battleRosara.currentValor = 20

      battleStore.applyEffect(battleRosara, EffectType.STUN, { duration: 1 })

      expect(battleRosara.currentValor).toBe(30)
    })
  })
})
