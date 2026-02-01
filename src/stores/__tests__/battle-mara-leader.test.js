// src/stores/__tests__/battle-mara-leader.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { EffectType } from '../../data/statusEffects'

describe('Mara leader skill - What Doesn\'t Kill Us', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('passive_lifesteal effect', () => {
    it('grants +5% lifesteal to all allies via leaderBonuses', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      const ally = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, mara.instanceId)
      heroesStore.setPartySlot(1, ally.instanceId)
      heroesStore.setPartyLeader(mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')
      const battleAlly = store.heroes.find(h => h.templateId === 'shadow_king')

      expect(battleMara.leaderBonuses.lifesteal).toBe(5)
      expect(battleAlly.leaderBonuses.lifesteal).toBe(5)
    })
  })

  describe('hp_threshold_triggered effect', () => {
    it('grants ATK buff when ally first drops below 50% HP', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      const ally = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, mara.instanceId)
      heroesStore.setPartySlot(1, ally.instanceId)
      heroesStore.setPartyLeader(mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleAlly = store.heroes.find(h => h.templateId === 'shadow_king')

      // Set ally HP above threshold
      battleAlly.currentHp = 600
      battleAlly.maxHp = 1000

      // Verify no ATK_UP effect yet
      expect(battleAlly.statusEffects.filter(e => e.type === EffectType.ATK_UP).length).toBe(0)

      // Apply damage that drops ally below 50%
      store.applyDamage(battleAlly, 150, 'attack')

      // Should now have ATK_UP effect
      const atkUp = battleAlly.statusEffects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.value).toBe(15)
      expect(atkUp.duration).toBe(3)
    })

    it('only triggers once per unit', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      const ally = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, mara.instanceId)
      heroesStore.setPartySlot(1, ally.instanceId)
      heroesStore.setPartyLeader(mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleAlly = store.heroes.find(h => h.templateId === 'shadow_king')

      // Set ally HP above threshold
      battleAlly.currentHp = 600
      battleAlly.maxHp = 1000

      // Apply damage to trigger
      store.applyDamage(battleAlly, 150, 'attack')

      // Heal back up
      battleAlly.currentHp = 600

      // Clear existing effect
      battleAlly.statusEffects = battleAlly.statusEffects.filter(e => e.type !== EffectType.ATK_UP)

      // Apply damage again - should NOT trigger second time
      store.applyDamage(battleAlly, 150, 'attack')

      const atkUpCount = battleAlly.statusEffects.filter(e => e.type === EffectType.ATK_UP).length
      expect(atkUpCount).toBe(0)
    })

    it('does not trigger if unit was already below threshold', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      const ally = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, mara.instanceId)
      heroesStore.setPartySlot(1, ally.instanceId)
      heroesStore.setPartyLeader(mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleAlly = store.heroes.find(h => h.templateId === 'shadow_king')

      // Start below threshold
      battleAlly.currentHp = 400
      battleAlly.maxHp = 1000

      // Apply more damage
      store.applyDamage(battleAlly, 100, 'attack')

      // Should NOT trigger ATK_UP
      const atkUp = battleAlly.statusEffects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeUndefined()
    })
  })
})
