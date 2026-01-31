import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { fortuna_inversus } from '../../data/heroes/5star/fortuna_inversus'
import { EffectType } from '../../data/statusEffects'

describe('Fortuna Inversus Finale Integration', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    battleStore.heroes = []
    battleStore.enemies = []
  })

  describe('Wheel of Reversal execution', () => {
    it('should swap buffs from allies to debuffs on enemies', () => {
      const fortuna = {
        instanceId: 'fortuna_1',
        template: fortuna_inversus,
        currentVerses: 3,
        currentHp: 100,
        statusEffects: []
      }
      const ally = {
        instanceId: 'ally_1',
        currentHp: 100,
        statusEffects: [{ type: EffectType.ATK_UP, duration: 2, value: 25 }]
      }
      const enemy = {
        id: 'enemy_1',
        currentHp: 100,
        statusEffects: []
      }

      battleStore.heroes = [fortuna, ally]
      battleStore.enemies = [enemy]

      battleStore.executeFortunaFinale(fortuna)

      expect(ally.statusEffects.find(e => e.type === EffectType.ATK_UP)).toBeUndefined()
      expect(enemy.statusEffects).toContainEqual(
        expect.objectContaining({ type: EffectType.ATK_DOWN, value: 25 })
      )
    })

    it('should apply random fallback when no effects exist', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1)

      const fortuna = {
        instanceId: 'fortuna_1',
        template: fortuna_inversus,
        currentVerses: 3,
        currentHp: 100,
        statusEffects: []
      }
      const ally = {
        instanceId: 'ally_1',
        currentHp: 100,
        statusEffects: []
      }
      const enemy = {
        id: 'enemy_1',
        currentHp: 100,
        statusEffects: []
      }

      battleStore.heroes = [fortuna, ally]
      battleStore.enemies = [enemy]

      const result = battleStore.executeFortunaFinale(fortuna)

      expect(result.usedFallback).toBe(true)
      const allUnits = [fortuna, ally, enemy]
      const hasEffect = allUnits.some(u => u.statusEffects.length > 0)
      expect(hasEffect).toBe(true)

      vi.restoreAllMocks()
    })

    it('should reset verses to 0 after finale', () => {
      const fortuna = {
        instanceId: 'fortuna_1',
        template: fortuna_inversus,
        currentVerses: 3,
        currentHp: 100,
        statusEffects: []
      }

      battleStore.heroes = [fortuna]
      battleStore.enemies = [{ id: 'enemy_1', currentHp: 100, statusEffects: [] }]

      battleStore.executeFortunaFinale(fortuna)

      expect(fortuna.currentVerses).toBe(0)
    })

    it('should clear lastSkillName after finale', () => {
      const fortuna = {
        instanceId: 'fortuna_1',
        template: fortuna_inversus,
        currentVerses: 3,
        currentHp: 100,
        lastSkillName: 'Fickle Fortune',
        statusEffects: []
      }

      battleStore.heroes = [fortuna]
      battleStore.enemies = [{ id: 'enemy_1', currentHp: 100, statusEffects: [] }]

      battleStore.executeFortunaFinale(fortuna)

      expect(fortuna.lastSkillName).toBeNull()
    })

    it('should return success false if finale is not fortune swap', () => {
      const nonFortunaHero = {
        instanceId: 'bard_1',
        template: {
          finale: {
            name: 'Regular Finale',
            isFortuneSwap: false
          }
        },
        currentVerses: 3,
        currentHp: 100,
        statusEffects: []
      }

      battleStore.heroes = [nonFortunaHero]
      battleStore.enemies = [{ id: 'enemy_1', currentHp: 100, statusEffects: [] }]

      const result = battleStore.executeFortunaFinale(nonFortunaHero)

      expect(result.success).toBe(false)
    })

    it('should only process alive units', () => {
      const fortuna = {
        instanceId: 'fortuna_1',
        template: fortuna_inversus,
        currentVerses: 3,
        currentHp: 100,
        statusEffects: [{ type: EffectType.DEF_UP, duration: 2, value: 15 }]
      }
      const deadAlly = {
        instanceId: 'ally_1',
        currentHp: 0,
        statusEffects: [{ type: EffectType.ATK_UP, duration: 2, value: 25 }]
      }
      const deadEnemy = {
        id: 'enemy_1',
        currentHp: 0,
        statusEffects: [{ type: EffectType.POISON, duration: 3, value: 10 }]
      }
      const aliveEnemy = {
        id: 'enemy_2',
        currentHp: 100,
        statusEffects: []
      }

      battleStore.heroes = [fortuna, deadAlly]
      battleStore.enemies = [deadEnemy, aliveEnemy]

      battleStore.executeFortunaFinale(fortuna)

      // Dead ally's buff should NOT be swapped (dead units are filtered out)
      expect(deadAlly.statusEffects.find(e => e.type === EffectType.ATK_UP)).toBeDefined()
      // Dead enemy's debuff should NOT be swapped (dead units are filtered out)
      expect(deadEnemy.statusEffects.find(e => e.type === EffectType.POISON)).toBeDefined()
      // Alive ally (Fortuna) DEF_UP should be swapped to DEF_DOWN on alive enemy
      expect(fortuna.statusEffects.find(e => e.type === EffectType.DEF_UP)).toBeUndefined()
      expect(aliveEnemy.statusEffects).toContainEqual(
        expect.objectContaining({ type: EffectType.DEF_DOWN, value: 15 })
      )
    })
  })
})
