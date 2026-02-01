import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'
import { chroma } from '../../data/heroes/4star/chroma.js'

describe('Chroma Battle Integration', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('Chroma hero data', () => {
    it('should have valid skill structure', () => {
      expect(chroma.skills).toHaveLength(5)
      chroma.skills.forEach(skill => {
        expect(skill.name).toBeDefined()
        expect(skill.targetType).toBeDefined()
      })
    })

    it('should have valid finale structure', () => {
      expect(chroma.finale).toBeDefined()
      expect(chroma.finale.name).toBe('The Dazzling')
      expect(chroma.finale.effects).toHaveLength(1)
      expect(chroma.finale.effects[0].type).toBe(EffectType.BLIND)
    })
  })

  describe('Ink Flare skill', () => {
    it('should have correct Blind effect configuration', () => {
      const inkFlare = chroma.skills.find(s => s.name === 'Ink Flare')
      expect(inkFlare.effects[0].type).toBe(EffectType.BLIND)
      expect(inkFlare.effects[0].value).toBe(50)
      expect(inkFlare.effects[0].duration).toBe(1)
      expect(inkFlare.targetType).toBe('enemy')
    })
  })

  describe('Fixation Pattern skill', () => {
    it('should apply Taunt to ally', () => {
      const fixation = chroma.skills.find(s => s.name === 'Fixation Pattern')
      expect(fixation.effects[0].type).toBe(EffectType.TAUNT)
      expect(fixation.targetType).toBe('ally')
      expect(fixation.effects[0].duration).toBe(1)
    })
  })

  describe('Chromatic Fade skill', () => {
    it('should grant self Evasion', () => {
      const fade = chroma.skills.find(s => s.name === 'Chromatic Fade')
      expect(fade.effects[0].type).toBe(EffectType.EVASION)
      expect(fade.effects[0].value).toBe(75)
      expect(fade.targetType).toBe('self')
    })
  })

  describe('Refraction skill', () => {
    it('should grant ally Evasion', () => {
      const refraction = chroma.skills.find(s => s.name === 'Refraction')
      expect(refraction.effects[0].type).toBe(EffectType.EVASION)
      expect(refraction.effects[0].value).toBe(50)
      expect(refraction.targetType).toBe('ally')
    })
  })

  describe('Resonance skill', () => {
    it('should have resource restore property', () => {
      const resonance = chroma.skills.find(s => s.name === 'Resonance')
      expect(resonance.resourceRestore).toBe(20)
      expect(resonance.targetType).toBe('ally')
    })
  })

  describe('Resonance resourceRestore in combat', () => {
    function createTestHero(overrides = {}) {
      const hp = overrides.currentHp ?? overrides.maxHp ?? 1000
      const maxHp = overrides.maxHp ?? 1000
      return {
        instanceId: overrides.instanceId || 'test_hero',
        templateId: overrides.templateId || 'test',
        template: {
          name: overrides.name || 'Test Hero',
          classId: overrides.classId || 'berserker',
          skills: overrides.skills || []
        },
        class: { resourceType: overrides.resourceType || null, resourceName: 'MP' },
        stats: { hp: maxHp, atk: overrides.atk ?? 100, def: 50, spd: 10, mp: 100 },
        currentHp: hp,
        maxHp: maxHp,
        currentMp: overrides.currentMp ?? 100,
        maxMp: overrides.maxMp ?? 100,
        currentRage: overrides.currentRage ?? 0,
        hasFocus: overrides.hasFocus ?? true,
        currentValor: overrides.currentValor ?? 0,
        currentVerses: overrides.currentVerses ?? 0,
        lastSkillName: null,
        statusEffects: [],
        level: 1,
        ...overrides
      }
    }

    function createChromaHero() {
      return createTestHero({
        instanceId: 'chroma_test',
        templateId: 'chroma',
        name: 'Chroma',
        classId: 'bard',
        resourceType: 'verse',
        skills: chroma.skills,
        currentVerses: 0
      })
    }

    function setupBattle(chromaHero, target) {
      battleStore.heroes.push(chromaHero, target)
      battleStore.enemies.push({ id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, stats: { atk: 50, def: 10, spd: 5 }, statusEffects: [] })
      battleStore.turnOrder.push({ type: 'hero', id: chromaHero.instanceId })
      battleStore.currentTurnIndex = 0
      battleStore.state = 'player_turn'
      vi.spyOn(console, 'log').mockImplementation(() => {})
    }

    it('should restore 20 Rage to a Berserker ally', () => {
      const chromaHero = createChromaHero()
      const berserker = createTestHero({
        instanceId: 'berserker_1',
        name: 'Berserker',
        classId: 'berserker',
        resourceType: 'rage',
        currentRage: 30
      })

      setupBattle(chromaHero, berserker)

      // Chroma uses Resonance (skill index 1) on berserker
      battleStore.selectAction('skill_1')
      battleStore.selectTarget(berserker.instanceId, 'ally')

      // Berserker should gain 20 Rage (30 + 20 = 50)
      expect(berserker.currentRage).toBe(50)
    })

    it('should grant Focus to a Ranger ally without Focus', () => {
      const chromaHero = createChromaHero()
      const ranger = createTestHero({
        instanceId: 'ranger_1',
        name: 'Ranger',
        classId: 'ranger',
        resourceType: 'focus',
        hasFocus: false
      })

      setupBattle(chromaHero, ranger)

      // Chroma uses Resonance on ranger
      battleStore.selectAction('skill_1')
      battleStore.selectTarget(ranger.instanceId, 'ally')

      // Ranger should have Focus restored
      expect(ranger.hasFocus).toBe(true)
    })

    it('should restore 20 Valor to a Knight ally', () => {
      const chromaHero = createChromaHero()
      const knight = createTestHero({
        instanceId: 'knight_1',
        name: 'Knight',
        classId: 'knight',
        resourceType: 'valor',
        currentValor: 25
      })

      setupBattle(chromaHero, knight)

      // Chroma uses Resonance on knight
      battleStore.selectAction('skill_1')
      battleStore.selectTarget(knight.instanceId, 'ally')

      // Knight should gain 20 Valor (25 + 20 = 45)
      expect(knight.currentValor).toBe(45)
    })

    it('should restore 20 MP to an MP-based ally', () => {
      const chromaHero = createChromaHero()
      const mage = createTestHero({
        instanceId: 'mage_1',
        name: 'Mage',
        classId: 'mage',
        currentMp: 50,
        maxMp: 100
      })

      setupBattle(chromaHero, mage)

      // Chroma uses Resonance on mage
      battleStore.selectAction('skill_1')
      battleStore.selectTarget(mage.instanceId, 'ally')

      // Mage should gain 20 MP (50 + 20 = 70)
      expect(mage.currentMp).toBe(70)
    })

    it('should cap resource restoration at maximum', () => {
      const chromaHero = createChromaHero()
      const berserker = createTestHero({
        instanceId: 'berserker_1',
        name: 'Berserker',
        classId: 'berserker',
        resourceType: 'rage',
        currentRage: 90 // Near cap of 100
      })

      setupBattle(chromaHero, berserker)

      // Chroma uses Resonance on berserker
      battleStore.selectAction('skill_1')
      battleStore.selectTarget(berserker.instanceId, 'ally')

      // Berserker should be capped at 100 Rage
      expect(berserker.currentRage).toBe(100)
    })
  })

  describe('The Dazzling finale', () => {
    it('should apply AoE Blind with correct values', () => {
      expect(chroma.finale.target).toBe('all_enemies')
      expect(chroma.finale.effects[0].value).toBe(30)
      expect(chroma.finale.effects[0].duration).toBe(1)
    })
  })

  describe('Blind miss mechanic', () => {
    it('should have checkBlindMiss function exported', () => {
      expect(typeof battleStore.checkBlindMiss).toBe('function')
    })

    it('should cause blinded attacker to potentially miss', () => {
      const attacker = {
        statusEffects: [{ type: EffectType.BLIND, value: 100 }]
      }

      // With 100% blind, should always miss
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      expect(battleStore.checkBlindMiss(attacker)).toBe(true)
      vi.restoreAllMocks()
    })
  })
})
