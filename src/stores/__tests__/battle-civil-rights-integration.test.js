// src/stores/__tests__/battle-civil-rights-integration.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { heroTemplates } from '../../data/heroes/index.js'
import { EffectType } from '../../data/statusEffects.js'

describe('Civil Rights Banner heroes integration', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('Hero template existence', () => {
    it('Rosara exists in heroTemplates', () => {
      expect(heroTemplates.rosara_the_unmoved).toBeDefined()
      expect(heroTemplates.rosara_the_unmoved.name).toBe('Rosara')
      expect(heroTemplates.rosara_the_unmoved.rarity).toBe(5)
      expect(heroTemplates.rosara_the_unmoved.classId).toBe('knight')
    })

    it('Zina exists in heroTemplates', () => {
      expect(heroTemplates.zina_the_desperate).toBeDefined()
      expect(heroTemplates.zina_the_desperate.name).toBe('Zina')
      expect(heroTemplates.zina_the_desperate.rarity).toBe(4)
      expect(heroTemplates.zina_the_desperate.classId).toBe('alchemist')
    })

    it('Vashek exists in heroTemplates', () => {
      expect(heroTemplates.vashek_the_unrelenting).toBeDefined()
      expect(heroTemplates.vashek_the_unrelenting.name).toBe('Vashek')
      expect(heroTemplates.vashek_the_unrelenting.rarity).toBe(3)
      expect(heroTemplates.vashek_the_unrelenting.classId).toBe('knight')
    })
  })

  describe('Rosara battle functionality', () => {
    it('has basicAttackModifier passive', () => {
      const rosara = heroTemplates.rosara_the_unmoved
      expect(rosara.basicAttackModifier).toBeDefined()
      expect(rosara.basicAttackModifier.baseDamagePercent).toBe(80)
      expect(rosara.basicAttackModifier.ifAttackedDamagePercent).toBe(120)
    })

    it('basic attack uses Quiet Defiance modifier when not attacked', () => {
      const hero = {
        template: heroTemplates.rosara_the_unmoved,
        wasAttacked: false
      }
      expect(store.getBasicAttackDamagePercent(hero)).toBe(80)
    })

    it('basic attack uses Quiet Defiance modifier when attacked', () => {
      const hero = {
        template: heroTemplates.rosara_the_unmoved,
        wasAttacked: true
      }
      expect(store.getBasicAttackDamagePercent(hero)).toBe(120)
    })

    it('has Seat of Power skill with SEATED effect', () => {
      const rosara = heroTemplates.rosara_the_unmoved
      const seatOfPower = rosara.skills.find(s => s.name === 'Seat of Power')
      expect(seatOfPower).toBeDefined()
      expect(seatOfPower.effects).toBeDefined()
      const seatedEffect = seatOfPower.effects.find(e => e.type === EffectType.SEATED)
      expect(seatedEffect).toBeDefined()
      expect(seatedEffect.target).toBe('self')
    })

    it('has leader skill The First to Stand', () => {
      const rosara = heroTemplates.rosara_the_unmoved
      expect(rosara.leaderSkill).toBeDefined()
      expect(rosara.leaderSkill.name).toBe('The First to Stand')
    })

    it('has Unwavering passive with control immunity', () => {
      const rosara = heroTemplates.rosara_the_unmoved
      const unwavering = rosara.skills.find(s => s.name === 'Unwavering')
      expect(unwavering).toBeDefined()
      expect(unwavering.isPassive).toBe(true)
      expect(unwavering.passiveType).toBe('controlImmunity')
      expect(unwavering.immuneTo).toContain(EffectType.STUN)
      expect(unwavering.immuneTo).toContain(EffectType.SLEEP)
    })
  })

  describe('Zina battle functionality', () => {
    it('has on-death passive', () => {
      const zina = heroTemplates.zina_the_desperate
      const hero = { template: zina }
      const onDeath = store.getHeroOnDeathPassive(hero)
      expect(onDeath).toBeDefined()
      expect(onDeath.damage.damagePercent).toBe(175)
      expect(onDeath.damage.targetType).toBe('random_enemy')
    })

    it('on-death applies poison to all enemies', () => {
      const zina = heroTemplates.zina_the_desperate
      const hero = { template: zina }
      const onDeath = store.getHeroOnDeathPassive(hero)
      expect(onDeath.effects).toBeDefined()
      expect(onDeath.effects).toHaveLength(1)
      expect(onDeath.effects[0].type).toBe(EffectType.POISON)
      expect(onDeath.effects[0].target).toBe('all_enemies')
      expect(onDeath.effects[0].duration).toBe(3)
    })

    it('uses Essence resource system', () => {
      const hero = {
        class: { resourceType: 'essence' },
        currentEssence: 30,
        maxHp: 100
      }
      expect(store.getVolatilityTier(hero)).toBe('reactive')
      expect(store.getVolatilityDamageBonus(hero)).toBe(15)
    })

    it('has skills with essenceCost', () => {
      const zina = heroTemplates.zina_the_desperate
      const taintedTonic = zina.skills.find(s => s.name === 'Tainted Tonic')
      expect(taintedTonic).toBeDefined()
      expect(taintedTonic.essenceCost).toBe(10)

      const taintedFeast = zina.skills.find(s => s.name === 'Tainted Feast')
      expect(taintedFeast).toBeDefined()
      expect(taintedFeast.essenceCost).toBe(20)
    })

    it('has Cornered Animal low HP trigger passive', () => {
      const zina = heroTemplates.zina_the_desperate
      const corneredAnimal = zina.skills.find(s => s.name === 'Cornered Animal')
      expect(corneredAnimal).toBeDefined()
      expect(corneredAnimal.isPassive).toBe(true)
      expect(corneredAnimal.passiveType).toBe('lowHpTrigger')
      expect(corneredAnimal.triggerBelowHpPercent).toBe(30)
      expect(corneredAnimal.oncePerBattle).toBe(true)
    })

    it("has Death's Needle with conditional ignore DEF", () => {
      const zina = heroTemplates.zina_the_desperate
      const deathsNeedle = zina.skills.find(s => s.name === "Death's Needle")
      expect(deathsNeedle).toBeDefined()
      expect(deathsNeedle.damagePercent).toBe(175)
      expect(deathsNeedle.conditionalAtLowHp).toBeDefined()
      expect(deathsNeedle.conditionalAtLowHp.hpThreshold).toBe(30)
      expect(deathsNeedle.conditionalAtLowHp.ignoresDef).toBe(true)
    })
  })

  describe('Vashek template', () => {
    it('has Valor scaling on Hold the Line', () => {
      const vashek = heroTemplates.vashek_the_unrelenting
      const holdTheLine = vashek.skills.find(s => s.name === 'Hold the Line')
      expect(holdTheLine).toBeDefined()
      expect(holdTheLine.damagePercent.base).toBe(80)
      expect(holdTheLine.damagePercent.at100).toBe(120)
    })

    it('has conditional bonus damage on Hold the Line', () => {
      const vashek = heroTemplates.vashek_the_unrelenting
      const holdTheLine = vashek.skills.find(s => s.name === 'Hold the Line')
      expect(holdTheLine.conditionalBonusDamage).toBeDefined()
      expect(holdTheLine.conditionalBonusDamage.condition).toBe('anyAllyBelowHalfHp')
      expect(holdTheLine.conditionalBonusDamage.bonusPercent.base).toBe(20)
    })

    it('has allySaveOnce passive (Unyielding)', () => {
      const vashek = heroTemplates.vashek_the_unrelenting
      const unyielding = vashek.skills.find(s => s.name === 'Unyielding')
      expect(unyielding).toBeDefined()
      expect(unyielding.isPassive).toBe(true)
      expect(unyielding.passiveType).toBe('allySaveOnce')
    })

    it('allySaveOnce has proper configuration', () => {
      const vashek = heroTemplates.vashek_the_unrelenting
      const unyielding = vashek.skills.find(s => s.name === 'Unyielding')
      expect(unyielding.saveAllyOnDeath).toBeDefined()
      expect(unyielding.saveAllyOnDeath.vashekMinHpPercent).toBe(50)
      expect(unyielding.saveAllyOnDeath.damageSharePercent).toBe(50)
      expect(unyielding.saveAllyOnDeath.oncePerBattle).toBe(true)
    })

    it('has Brothers in Arms dual-target buff', () => {
      const vashek = heroTemplates.vashek_the_unrelenting
      const brothersInArms = vashek.skills.find(s => s.name === 'Brothers in Arms')
      expect(brothersInArms).toBeDefined()
      expect(brothersInArms.targetType).toBe('ally')
      expect(brothersInArms.excludeSelf).toBe(true)
      // Gives DEF to ally and ATK to self
      const defUp = brothersInArms.effects.find(e => e.type === EffectType.DEF_UP)
      const atkUp = brothersInArms.effects.find(e => e.type === EffectType.ATK_UP)
      expect(defUp.target).toBe('ally')
      expect(atkUp.target).toBe('self')
    })

    it('has Forward, Together with self-damage', () => {
      const vashek = heroTemplates.vashek_the_unrelenting
      const forwardTogether = vashek.skills.find(s => s.name === 'Forward, Together')
      expect(forwardTogether).toBeDefined()
      expect(forwardTogether.selfDamagePercentMaxHp).toBe(10)
      expect(forwardTogether.targetType).toBe('all_allies')
    })

    it('has Shoulder to Shoulder with per-ally scaling', () => {
      const vashek = heroTemplates.vashek_the_unrelenting
      const shoulderToShoulder = vashek.skills.find(s => s.name === 'Shoulder to Shoulder')
      expect(shoulderToShoulder).toBeDefined()
      expect(shoulderToShoulder.valorRequired).toBe(50)
      const atkEffect = shoulderToShoulder.effects.find(e => e.type === EffectType.ATK_UP)
      expect(atkEffect.valuePerAlly).toBeDefined()
      expect(atkEffect.valuePerAlly.base).toBe(5)
    })
  })

  describe('SEATED status effect', () => {
    it('blocks skill use when SEATED', () => {
      const hero = {
        instanceId: 'hero1',
        statusEffects: [
          { type: EffectType.SEATED, duration: 2, definition: { isSeated: true } }
        ],
        skill: { name: 'Test Skill' }
      }
      expect(store.isSeated(hero)).toBe(true)
    })

    it('does not block skill use when not SEATED', () => {
      const hero = {
        instanceId: 'hero1',
        statusEffects: [],
        skill: { name: 'Test Skill' }
      }
      expect(store.isSeated(hero)).toBe(false)
    })

    it('SEATED effect is present in Rosara Seat of Power skill', () => {
      const rosara = heroTemplates.rosara_the_unmoved
      const seatOfPower = rosara.skills.find(s => s.name === 'Seat of Power')
      const seatedEffect = seatOfPower.effects.find(e => e.type === EffectType.SEATED)
      expect(seatedEffect).toBeDefined()
      expect(seatedEffect.duration).toEqual({ base: 2, at50: 3 })
    })
  })

  describe('Essence Volatility system integration', () => {
    it('returns stable tier for 0-20 Essence', () => {
      const hero = {
        class: { resourceType: 'essence' },
        currentEssence: 15
      }
      expect(store.getVolatilityTier(hero)).toBe('stable')
      expect(store.getVolatilityDamageBonus(hero)).toBe(0)
    })

    it('returns reactive tier for 21-40 Essence', () => {
      const hero = {
        class: { resourceType: 'essence' },
        currentEssence: 35
      }
      expect(store.getVolatilityTier(hero)).toBe('reactive')
      expect(store.getVolatilityDamageBonus(hero)).toBe(15)
    })

    it('returns volatile tier for 41-60 Essence', () => {
      const hero = {
        class: { resourceType: 'essence' },
        currentEssence: 55
      }
      expect(store.getVolatilityTier(hero)).toBe('volatile')
      expect(store.getVolatilityDamageBonus(hero)).toBe(30)
    })

    it('returns null for non-alchemist heroes', () => {
      const hero = {
        class: { resourceType: 'mp' },
        currentMp: 50
      }
      expect(store.getVolatilityTier(hero)).toBeNull()
    })
  })

  describe('Civil Rights thematic consistency', () => {
    it('all three heroes have thematic skill names', () => {
      // Rosara - defiance, sitting, history, monument
      const rosara = heroTemplates.rosara_the_unmoved
      expect(rosara.skills.some(s => s.name.includes('Defiance'))).toBe(true)
      expect(rosara.skills.some(s => s.name.includes('Seat'))).toBe(true)
      expect(rosara.skills.some(s => s.name.includes('Monument'))).toBe(true)

      // Zina - desperation, cornered, poison
      const zina = heroTemplates.zina_the_desperate
      expect(zina.skills.some(s => s.name.includes('Cornered'))).toBe(true)
      expect(zina.skills.some(s => s.name.includes('Breath'))).toBe(true)

      // Vashek - solidarity, brothers, together
      const vashek = heroTemplates.vashek_the_unrelenting
      expect(vashek.skills.some(s => s.name.includes('Brothers'))).toBe(true)
      expect(vashek.skills.some(s => s.name.includes('Together'))).toBe(true)
    })

    it('all heroes have correct rarity tiers', () => {
      expect(heroTemplates.rosara_the_unmoved.rarity).toBe(5) // Legendary
      expect(heroTemplates.zina_the_desperate.rarity).toBe(4) // Epic
      expect(heroTemplates.vashek_the_unrelenting.rarity).toBe(3) // Rare
    })
  })
})
