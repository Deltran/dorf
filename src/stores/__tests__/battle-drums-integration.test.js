// src/stores/__tests__/battle-drums-integration.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { heroTemplates } from '../../data/heroes/index.js'
import { EffectType } from '../../data/statusEffects.js'

describe('Drums of the Old Blood banner heroes integration', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('Hero template existence', () => {
    it('Korrath exists in heroTemplates', () => {
      expect(heroTemplates.korrath_hollow_ear).toBeDefined()
      expect(heroTemplates.korrath_hollow_ear.name).toBe('Korrath of the Hollow Ear')
      expect(heroTemplates.korrath_hollow_ear.rarity).toBe(5)
      expect(heroTemplates.korrath_hollow_ear.classId).toBe('ranger')
    })

    it('Vraxx exists in heroTemplates', () => {
      expect(heroTemplates.vraxx_thunderskin).toBeDefined()
      expect(heroTemplates.vraxx_thunderskin.name).toBe('Vraxx the Thunderskin')
      expect(heroTemplates.vraxx_thunderskin.rarity).toBe(4)
      expect(heroTemplates.vraxx_thunderskin.classId).toBe('bard')
    })

    it('Torga exists in heroTemplates', () => {
      expect(heroTemplates.torga_bloodbeat).toBeDefined()
      expect(heroTemplates.torga_bloodbeat.name).toBe('Torga Bloodbeat')
      expect(heroTemplates.torga_bloodbeat.rarity).toBe(3)
      expect(heroTemplates.torga_bloodbeat.classId).toBe('berserker')
    })
  })

  describe('Korrath battle functionality', () => {
    it('has leader skill Blood Remembers', () => {
      const korrath = heroTemplates.korrath_hollow_ear
      expect(korrath.leaderSkill).toBeDefined()
      expect(korrath.leaderSkill.name).toBe('Blood Remembers')
      expect(korrath.leaderSkill.effects[0].triggerRound).toBe(2)
    })

    it('has Spirit Mark with MARKED effect', () => {
      const korrath = heroTemplates.korrath_hollow_ear
      const spiritMark = korrath.skills.find(s => s.name === 'Spirit Mark')
      expect(spiritMark).toBeDefined()
      const markedEffect = spiritMark.effects.find(e => e.type === EffectType.MARKED)
      expect(markedEffect).toBeDefined()
      expect(markedEffect.value).toBe(25)
    })

    it('has execute bonus on Whisper Shot', () => {
      const korrath = heroTemplates.korrath_hollow_ear
      const whisperShot = korrath.skills.find(s => s.name === 'Whisper Shot')
      expect(whisperShot.executeBonus).toBeDefined()
      expect(whisperShot.executeBonus.threshold).toBe(30)
      expect(whisperShot.executeBonus.damagePercent).toBe(150)
    })

    it('has Deathecho Volley with bonus damage per death', () => {
      const korrath = heroTemplates.korrath_hollow_ear
      const deathecho = korrath.skills.find(s => s.name === 'Deathecho Volley')
      expect(deathecho).toBeDefined()
      expect(deathecho.bonusDamagePerDeath).toBeDefined()
      expect(deathecho.bonusDamagePerDeath.perDeath).toBe(15)
      expect(deathecho.bonusDamagePerDeath.maxBonus).toBe(60)
    })

    it('has Spirit Volley with multi-hit and marked priority', () => {
      const korrath = heroTemplates.korrath_hollow_ear
      const spiritVolley = korrath.skills.find(s => s.name === 'Spirit Volley')
      expect(spiritVolley).toBeDefined()
      expect(spiritVolley.multiHit).toBe(5)
      expect(spiritVolley.prioritizeMarked).toBe(true)
    })

    it('has The Last Drumbeat with ignore DEF and onKill reset', () => {
      const korrath = heroTemplates.korrath_hollow_ear
      const lastDrumbeat = korrath.skills.find(s => s.name === 'The Last Drumbeat')
      expect(lastDrumbeat).toBeDefined()
      expect(lastDrumbeat.ignoreDef).toBe(75)
      expect(lastDrumbeat.onKill.resetTurnOrder).toBe(true)
    })
  })

  describe('Vraxx battle functionality', () => {
    it('has Bard finale', () => {
      const vraxx = heroTemplates.vraxx_thunderskin
      expect(vraxx.finale).toBeDefined()
      expect(vraxx.finale.name).toBe('Thunderclap Crescendo')
    })

    it('has Fury Beat with conditional rage grant', () => {
      const vraxx = heroTemplates.vraxx_thunderskin
      const furyBeat = vraxx.skills.find(s => s.name === 'Fury Beat')
      expect(furyBeat).toBeDefined()
      const effect = furyBeat.effects.find(e => e.type === 'conditional_resource_or_buff')
      expect(effect).toBeDefined()
      expect(effect.rageGrant.classCondition).toBe('berserker')
      expect(effect.rageGrant.amount).toBe(15)
    })

    it('has conditional regen on Unbreaking Tempo', () => {
      const vraxx = heroTemplates.vraxx_thunderskin
      const tempo = vraxx.skills.find(s => s.name === 'Unbreaking Tempo')
      expect(tempo).toBeDefined()
      const regen = tempo.effects.find(e => e.type === EffectType.REGEN)
      expect(regen.condition).toBeDefined()
      expect(regen.condition.hpBelow).toBe(50)
    })

    it('has Battle Cadence with ATK buff', () => {
      const vraxx = heroTemplates.vraxx_thunderskin
      const cadence = vraxx.skills.find(s => s.name === 'Battle Cadence')
      expect(cadence).toBeDefined()
      const atkUp = cadence.effects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.value).toBe(15)
    })

    it('has Drums of the Old Blood with ATK buff and Rage grant', () => {
      const vraxx = heroTemplates.vraxx_thunderskin
      const drums = vraxx.skills.find(s => s.name === 'Drums of the Old Blood')
      expect(drums).toBeDefined()
      const atkUp = drums.effects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.duration).toBe(3)
      expect(atkUp.value).toBe(25)
      const rageGrant = drums.effects.find(e => e.type === 'rage_grant')
      expect(rageGrant).toBeDefined()
      expect(rageGrant.classCondition).toBe('berserker')
      expect(rageGrant.amount).toBe(25)
    })

    it('Thunderclap Crescendo consumes excess rage', () => {
      const vraxx = heroTemplates.vraxx_thunderskin
      const finale = vraxx.finale
      const consumeRage = finale.effects.find(e => e.type === 'consume_excess_rage')
      expect(consumeRage).toBeDefined()
      expect(consumeRage.rageThreshold).toBe(50)
      expect(consumeRage.damagePerRagePercent).toBe(3)
    })
  })

  describe('Torga battle functionality', () => {
    it('has Blood Echo with rage cost', () => {
      const torga = heroTemplates.torga_bloodbeat
      const bloodEcho = torga.skills.find(s => s.name === 'Blood Echo')
      expect(bloodEcho.rageCost).toBe(20)
    })

    it('has rageGain on Rhythm Strike', () => {
      const torga = heroTemplates.torga_bloodbeat
      const rhythmStrike = torga.skills.find(s => s.name === 'Rhythm Strike')
      expect(rhythmStrike.rageCost).toBe(0)
      expect(rhythmStrike.rageGain).toBe(10)
    })

    it('has selfDamagePercentMaxHp on Blood Tempo', () => {
      const torga = heroTemplates.torga_bloodbeat
      const bloodTempo = torga.skills.find(s => s.name === 'Blood Tempo')
      expect(bloodTempo.selfDamagePercentMaxHp).toBe(15)
      expect(bloodTempo.rageGain).toBe(30)
    })

    it('has execute bonus with healing on Death Knell', () => {
      const torga = heroTemplates.torga_bloodbeat
      const deathKnell = torga.skills.find(s => s.name === 'Death Knell')
      expect(deathKnell.executeBonus).toBeDefined()
      expect(deathKnell.executeBonus.threshold).toBe(30)
      expect(deathKnell.executeBonus.healSelfPercent).toBe(20)
    })

    it('has consume all rage on Finale of Fury', () => {
      const torga = heroTemplates.torga_bloodbeat
      const finale = torga.skills.find(s => s.name === 'Finale of Fury')
      expect(finale.rageCost).toBe('all')
      expect(finale.onKill.rageGain).toBe(50)
    })

    it('Blood Echo has bonus damage per Blood Tempo use', () => {
      const torga = heroTemplates.torga_bloodbeat
      const bloodEcho = torga.skills.find(s => s.name === 'Blood Echo')
      expect(bloodEcho.bonusDamagePerBloodTempo).toBe(30)
      expect(bloodEcho.maxBloodTempoBonus).toBe(90)
    })
  })

  describe('Banner thematic consistency', () => {
    it('all heroes have thematic skill names', () => {
      // Korrath - spirit, whisper, echo, drumbeat
      const korrath = heroTemplates.korrath_hollow_ear
      expect(korrath.skills.some(s => s.name.includes('Spirit'))).toBe(true)
      expect(korrath.skills.some(s => s.name.includes('Drumbeat'))).toBe(true)

      // Vraxx - battle, fury, tempo, drums
      const vraxx = heroTemplates.vraxx_thunderskin
      expect(vraxx.skills.some(s => s.name.includes('Battle'))).toBe(true)
      expect(vraxx.skills.some(s => s.name.includes('Drums'))).toBe(true)

      // Torga - rhythm, blood, rage, fury
      const torga = heroTemplates.torga_bloodbeat
      expect(torga.skills.some(s => s.name.includes('Rhythm'))).toBe(true)
      expect(torga.skills.some(s => s.name.includes('Fury'))).toBe(true)
    })

    it('all heroes have correct rarity tiers', () => {
      expect(heroTemplates.korrath_hollow_ear.rarity).toBe(5) // Legendary
      expect(heroTemplates.vraxx_thunderskin.rarity).toBe(4) // Epic
      expect(heroTemplates.torga_bloodbeat.rarity).toBe(3) // Rare
    })

    it('Korrath and Torga share execute mechanic at 30% HP threshold', () => {
      const korrath = heroTemplates.korrath_hollow_ear
      const torga = heroTemplates.torga_bloodbeat

      const whisperShot = korrath.skills.find(s => s.name === 'Whisper Shot')
      const deathKnell = torga.skills.find(s => s.name === 'Death Knell')

      expect(whisperShot.executeBonus.threshold).toBe(deathKnell.executeBonus.threshold)
    })

    it('Vraxx synergizes with Berserker class (Torga)', () => {
      const vraxx = heroTemplates.vraxx_thunderskin

      // Fury Beat grants rage to Berserkers
      const furyBeat = vraxx.skills.find(s => s.name === 'Fury Beat')
      expect(furyBeat.effects[0].rageGrant.classCondition).toBe('berserker')

      // Drums of the Old Blood grants rage to Berserkers
      const drums = vraxx.skills.find(s => s.name === 'Drums of the Old Blood')
      const rageGrant = drums.effects.find(e => e.type === 'rage_grant')
      expect(rageGrant.classCondition).toBe('berserker')
    })
  })
})
