import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'

describe('Fight-Level Effects (FLE)', () => {
  let battleStore
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function makeHero(overrides = {}) {
    return {
      instanceId: 'hero_1',
      templateId: 'militia_soldier',
      template: { name: 'Militia Soldier', classId: 'knight' },
      currentHp: 500,
      maxHp: 500,
      stats: { hp: 500, atk: 100, def: 50, spd: 30 },
      statusEffects: [],
      ...overrides
    }
  }

  function makeEnemy(overrides = {}) {
    return {
      id: 0,
      name: 'Goblin Scout',
      template: { name: 'Goblin Scout' },
      currentHp: 200,
      maxHp: 200,
      stats: { hp: 200, atk: 60, def: 20, spd: 25 },
      statusEffects: [],
      ...overrides
    }
  }

  describe('setFightLevelEffects + fightLevelEffects ref', () => {
    it('makes effects available after setting', () => {
      const effects = [
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'heroes', value: 200 }
      ]
      battleStore.setFightLevelEffects(effects)
      expect(battleStore.fightLevelEffects).toEqual(effects)
    })

    it('replaces existing effects', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'heroes', value: 150 }
      ])
      const newEffects = [
        { hook: 'on_pre_damage', type: 'damage_reduction', scope: 'heroes', value: 30 }
      ]
      battleStore.setFightLevelEffects(newEffects)
      expect(battleStore.fightLevelEffects).toEqual(newEffects)
    })
  })

  describe('addFightLevelEffect', () => {
    it('adds to existing effects', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'heroes', value: 200 }
      ])
      battleStore.addFightLevelEffect(
        { hook: 'on_pre_damage', type: 'damage_reduction', scope: 'enemies', value: 20 }
      )
      expect(battleStore.fightLevelEffects).toHaveLength(2)
    })
  })

  describe('endBattle clears FLEs', () => {
    it('clears fight-level effects when battle ends', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'heroes', value: 200 }
      ])
      battleStore.endBattle()
      expect(battleStore.fightLevelEffects).toEqual([])
    })
  })

  describe('processPreDamage — damage_multiplier with scope heroes', () => {
    it('boosts damage when a hero attacks an enemy', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'heroes', value: 50 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()

      // 100 base damage, +50% bonus → 150
      const result = battleStore.processPreDamage(hero, enemy, 100)
      expect(result).toBe(150)
    })
  })

  describe('processPreDamage — damage_multiplier with scope enemies', () => {
    it('boosts damage when an enemy attacks a hero', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'enemies', value: 30 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()

      // Enemy attacks hero: 100 * 1.3 = 130
      const result = battleStore.processPreDamage(enemy, hero, 100)
      expect(result).toBe(130)
    })

    it('does not affect hero-on-enemy damage', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'enemies', value: 30 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()

      // Hero attacking enemy — scope is 'enemies' so should NOT multiply
      const result = battleStore.processPreDamage(hero, enemy, 100)
      expect(result).toBe(100)
    })
  })

  describe('processPreDamage — damage_reduction with scope heroes', () => {
    it('reduces damage taken by heroes', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_reduction', scope: 'heroes', value: 30 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()

      // Enemy attacks hero: 100 - 30% = 70
      const result = battleStore.processPreDamage(enemy, hero, 100)
      expect(result).toBe(70)
    })
  })

  describe('processPreDamage — damage_reduction cap at 80%', () => {
    it('caps total FLE damage reduction at 80%', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_reduction', scope: 'heroes', value: 50 },
        { hook: 'on_pre_damage', type: 'damage_reduction', scope: 'heroes', value: 50 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()

      // Two 50% reductions would be 100%, but cap at 80%. 100 * 0.2 = 20.
      const result = battleStore.processPreDamage(enemy, hero, 100)
      expect(result).toBe(20)
    })
  })

  describe('processPreDamage — multiple multipliers stack additively', () => {
    it('adds multiplier values together', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'heroes', value: 25 },
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'heroes', value: 25 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()

      // Two +25% bonuses: (100 + 25 + 25) / 100 = 1.5x. 100 * 1.5 = 150.
      const result = battleStore.processPreDamage(hero, enemy, 100)
      expect(result).toBe(150)
    })
  })

  describe('processPreDamage — no FLE = normal damage', () => {
    it('returns original damage when no fight-level effects are set', () => {
      const result = battleStore.processPreDamage(makeHero(), makeEnemy(), 100)
      expect(result).toBe(100)
    })
  })

  describe('processPreDamage — matchesScope hero vs enemy', () => {
    it('heroes scope matches attacker with instanceId', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'heroes', value: 50 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()

      // Hero has instanceId → matches 'heroes' scope
      const result = battleStore.processPreDamage(hero, enemy, 100)
      expect(result).toBe(150)
    })

    it('enemies scope matches attacker without instanceId', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'enemies', value: 50 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()

      // Enemy has no instanceId → matches 'enemies' scope
      const result = battleStore.processPreDamage(enemy, hero, 100)
      expect(result).toBe(150)
    })
  })

  describe('processPreDamage — multiplier and reduction combined', () => {
    it('applies multiplier to attacker then reduction to target', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'heroes', value: 50 },
        { hook: 'on_pre_damage', type: 'damage_reduction', scope: 'enemies', value: 25 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()

      // Hero attacks enemy: 100 * 1.5 = 150, then enemy takes 25% less = floor(150 * 0.75) = 112
      const result = battleStore.processPreDamage(hero, enemy, 100)
      expect(result).toBe(112)
    })
  })

  describe('integration — applyDamage with FLE applied beforehand', () => {
    it('enemy HP drops by FLE-modified damage', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'heroes', value: 50 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy({ currentHp: 500, maxHp: 500 })
      battleStore.heroes = [hero]
      battleStore.enemies = [enemy]

      // Simulate what call sites do: processPreDamage then applyDamage
      let damage = 100
      damage = battleStore.processPreDamage(hero, enemy, damage)
      expect(damage).toBe(150)

      battleStore.applyDamage(enemy, damage, 'attack', hero)
      expect(enemy.currentHp).toBe(350) // 500 - 150
    })
  })

  // ========== on_turn_start + damage_percent_max_hp ==========

  describe('scope: all', () => {
    it('matches both heroes and enemies', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'all', value: 50 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()

      // Hero attacking — 'all' matches hero, +50% → 150
      expect(battleStore.processPreDamage(hero, enemy, 100)).toBe(150)
      // Enemy attacking — 'all' matches enemy, +50% → 150
      expect(battleStore.processPreDamage(enemy, hero, 100)).toBe(150)
    })
  })

  describe('processTurnStartEffects', () => {
    it('deals percent max HP damage to a hero', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_turn_start', type: 'damage_percent_max_hp', scope: 'heroes', value: 10 }
      ])

      const hero = makeHero({ currentHp: 500, maxHp: 500 })
      battleStore.heroes = [hero]
      battleStore.enemies = [makeEnemy()]

      battleStore.processTurnStartEffects(hero)
      // 10% of 500 max HP = 50 damage → 450 HP
      expect(hero.currentHp).toBe(450)
    })

    it('deals percent max HP damage to an enemy', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_turn_start', type: 'damage_percent_max_hp', scope: 'enemies', value: 5 }
      ])

      const enemy = makeEnemy({ currentHp: 200, maxHp: 200 })
      battleStore.heroes = [makeHero()]
      battleStore.enemies = [enemy]

      battleStore.processTurnStartEffects(enemy)
      // 5% of 200 max HP = 10 damage → 190 HP
      expect(enemy.currentHp).toBe(190)
    })

    it('does not affect out-of-scope units', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_turn_start', type: 'damage_percent_max_hp', scope: 'enemies', value: 10 }
      ])

      const hero = makeHero({ currentHp: 500, maxHp: 500 })
      battleStore.heroes = [hero]
      battleStore.enemies = [makeEnemy()]

      battleStore.processTurnStartEffects(hero)
      // Hero is not in 'enemies' scope — no damage
      expect(hero.currentHp).toBe(500)
    })

    it('scope all affects both heroes and enemies', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_turn_start', type: 'damage_percent_max_hp', scope: 'all', value: 5 }
      ])

      const hero = makeHero({ currentHp: 500, maxHp: 500 })
      const enemy = makeEnemy({ currentHp: 200, maxHp: 200 })
      battleStore.heroes = [hero]
      battleStore.enemies = [enemy]

      battleStore.processTurnStartEffects(hero)
      battleStore.processTurnStartEffects(enemy)
      expect(hero.currentHp).toBe(475) // 500 - 25
      expect(enemy.currentHp).toBe(190) // 200 - 10
    })

    it('stacks multiple damage_percent_max_hp effects additively', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_turn_start', type: 'damage_percent_max_hp', scope: 'all', value: 3 },
        { hook: 'on_turn_start', type: 'damage_percent_max_hp', scope: 'all', value: 2 }
      ])

      const hero = makeHero({ currentHp: 500, maxHp: 500 })
      battleStore.heroes = [hero]
      battleStore.enemies = [makeEnemy()]

      battleStore.processTurnStartEffects(hero)
      // (3% + 2%) of 500 = 25 damage → 475 HP
      expect(hero.currentHp).toBe(475)
    })

    it('does not reduce HP below 1', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_turn_start', type: 'damage_percent_max_hp', scope: 'heroes', value: 50 }
      ])

      const hero = makeHero({ currentHp: 1, maxHp: 500 })
      battleStore.heroes = [hero]
      battleStore.enemies = [makeEnemy()]

      battleStore.processTurnStartEffects(hero)
      expect(hero.currentHp).toBe(1)
    })

    it('does nothing when no on_turn_start effects exist', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'heroes', value: 200 }
      ])

      const hero = makeHero({ currentHp: 500, maxHp: 500 })
      battleStore.heroes = [hero]

      battleStore.processTurnStartEffects(hero)
      expect(hero.currentHp).toBe(500)
    })

    it('heals with heal_percent_max_hp', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_turn_start', type: 'heal_percent_max_hp', scope: 'heroes', value: 10 }
      ])

      const hero = makeHero({ currentHp: 300, maxHp: 500 })
      battleStore.heroes = [hero]
      battleStore.enemies = [makeEnemy()]

      battleStore.processTurnStartEffects(hero)
      // 10% of 500 max HP = 50 heal → 350 HP
      expect(hero.currentHp).toBe(350)
    })

    it('does not heal above max HP', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_turn_start', type: 'heal_percent_max_hp', scope: 'heroes', value: 50 }
      ])

      const hero = makeHero({ currentHp: 480, maxHp: 500 })
      battleStore.heroes = [hero]
      battleStore.enemies = [makeEnemy()]

      battleStore.processTurnStartEffects(hero)
      expect(hero.currentHp).toBe(500)
    })
  })

  // ========== on_post_damage + apply_status ==========

  describe('processPostDamage — apply_status', () => {
    it('applies status to target when chance is 100 and attacker matches scope', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_post_damage', type: 'apply_status', scope: 'heroes', statusType: 'burn', duration: 2, value: 10, chance: 100 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()
      battleStore.heroes = [hero]
      battleStore.enemies = [enemy]

      battleStore.processPostDamage(hero, enemy)
      expect(enemy.statusEffects.some(e => e.type === 'burn')).toBe(true)
    })

    it('does not apply status when chance is 0', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_post_damage', type: 'apply_status', scope: 'heroes', statusType: 'burn', duration: 2, value: 10, chance: 0 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()
      battleStore.heroes = [hero]
      battleStore.enemies = [enemy]

      battleStore.processPostDamage(hero, enemy)
      expect(enemy.statusEffects.some(e => e.type === 'burn')).toBe(false)
    })

    it('respects scope — heroes scope only fires when hero attacks', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_post_damage', type: 'apply_status', scope: 'heroes', statusType: 'burn', duration: 2, value: 10, chance: 100 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()
      battleStore.heroes = [hero]
      battleStore.enemies = [enemy]

      // Enemy attacking hero — scope is 'heroes' but attacker is enemy, should NOT fire
      battleStore.processPostDamage(enemy, hero)
      expect(hero.statusEffects.some(e => e.type === 'burn')).toBe(false)
    })

    it('respects scope — enemies scope fires when enemy attacks', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_post_damage', type: 'apply_status', scope: 'enemies', statusType: 'spd_down', duration: 2, value: 15, chance: 100 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()
      battleStore.heroes = [hero]
      battleStore.enemies = [enemy]

      // Enemy attacking hero — scope 'enemies' matches enemy attacker
      battleStore.processPostDamage(enemy, hero)
      expect(hero.statusEffects.some(e => e.type === 'spd_down')).toBe(true)
    })

    it('scope all fires for both hero and enemy attackers', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_post_damage', type: 'apply_status', scope: 'all', statusType: 'burn', duration: 2, value: 5, chance: 100 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()
      battleStore.heroes = [hero]
      battleStore.enemies = [enemy]

      battleStore.processPostDamage(hero, enemy)
      expect(enemy.statusEffects.some(e => e.type === 'burn')).toBe(true)

      battleStore.processPostDamage(enemy, hero)
      expect(hero.statusEffects.some(e => e.type === 'burn')).toBe(true)
    })

    it('rolls chance correctly using Math.random', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_post_damage', type: 'apply_status', scope: 'heroes', statusType: 'burn', duration: 2, value: 10, chance: 50 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()
      battleStore.heroes = [hero]
      battleStore.enemies = [enemy]

      // Mock Math.random to return 0.49 (just under 50% → should apply)
      vi.spyOn(Math, 'random').mockReturnValue(0.49)
      battleStore.processPostDamage(hero, enemy)
      expect(enemy.statusEffects.some(e => e.type === 'burn')).toBe(true)

      // Reset enemy
      enemy.statusEffects = []

      // Mock Math.random to return 0.50 (at 50% → should NOT apply)
      Math.random.mockReturnValue(0.50)
      battleStore.processPostDamage(hero, enemy)
      expect(enemy.statusEffects.some(e => e.type === 'burn')).toBe(false)

      vi.restoreAllMocks()
    })

    it('multiple apply_status effects roll independently', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_post_damage', type: 'apply_status', scope: 'heroes', statusType: 'burn', duration: 2, value: 10, chance: 100 },
        { hook: 'on_post_damage', type: 'apply_status', scope: 'heroes', statusType: 'spd_down', duration: 2, value: 15, chance: 100 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()
      battleStore.heroes = [hero]
      battleStore.enemies = [enemy]

      battleStore.processPostDamage(hero, enemy)
      expect(enemy.statusEffects.some(e => e.type === 'burn')).toBe(true)
      expect(enemy.statusEffects.some(e => e.type === 'spd_down')).toBe(true)
    })

    it('does nothing when no on_post_damage effects exist', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_pre_damage', type: 'damage_multiplier', scope: 'heroes', value: 200 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()
      battleStore.heroes = [hero]
      battleStore.enemies = [enemy]

      battleStore.processPostDamage(hero, enemy)
      expect(enemy.statusEffects).toHaveLength(0)
    })

    it('applies correct duration and value to the status effect', () => {
      battleStore.setFightLevelEffects([
        { hook: 'on_post_damage', type: 'apply_status', scope: 'heroes', statusType: 'burn', duration: 3, value: 25, chance: 100 }
      ])

      const hero = makeHero()
      const enemy = makeEnemy()
      battleStore.heroes = [hero]
      battleStore.enemies = [enemy]

      battleStore.processPostDamage(hero, enemy)
      const burn = enemy.statusEffects.find(e => e.type === 'burn')
      expect(burn).toBeTruthy()
      expect(burn.duration).toBe(3)
      expect(burn.value).toBe(25)
    })
  })
})
