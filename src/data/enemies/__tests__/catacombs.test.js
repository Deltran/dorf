import { describe, it, expect } from 'vitest'
import { enemies } from '../catacombs.js'
import { EffectType } from '../../statusEffects.js'

describe('Ancient Catacombs enemies - Summoning', () => {
  describe('Skeletal Shard (summonable)', () => {
    const shard = enemies.skeletal_shard

    it('should exist', () => {
      expect(shard).toBeDefined()
    })

    it('should have correct stats', () => {
      expect(shard.stats).toEqual({ hp: 60, atk: 38, def: 10, spd: 14 })
    })

    it('should have no skill', () => {
      expect(shard.skill).toBeUndefined()
      expect(shard.skills).toBeUndefined()
    })
  })

  describe('Bone Heap', () => {
    const heap = enemies.bone_heap

    it('should exist', () => {
      expect(heap).toBeDefined()
    })

    it('should have correct stats', () => {
      expect(heap.stats).toEqual({ hp: 220, atk: 8, def: 34, spd: 3 })
    })

    it('should have Reassemble skill', () => {
      expect(heap.skill.name).toBe('Reassemble')
    })

    it('should be a noDamage skill', () => {
      expect(heap.skill.noDamage).toBe(true)
    })

    it('should summon a skeletal_shard', () => {
      expect(heap.skill.summon).toBeDefined()
      expect(heap.skill.summon.templateId).toBe('skeletal_shard')
      expect(heap.skill.summon.count).toBe(1)
    })

    it('should have cooldown 3', () => {
      expect(heap.skill.cooldown).toBe(3)
    })

    it('should have a fallbackSkill named Bone Armor', () => {
      expect(heap.skill.fallbackSkill).toBeDefined()
      expect(heap.skill.fallbackSkill.name).toBe('Bone Armor')
    })

    it('should have fallbackSkill that applies Thorns 80% for 2 turns', () => {
      const thorns = heap.skill.fallbackSkill.effects.find(e => e.type === EffectType.THORNS)
      expect(thorns).toBeDefined()
      expect(thorns.target).toBe('self')
      expect(thorns.value).toBe(80)
      expect(thorns.duration).toBe(2)
    })
  })
})
