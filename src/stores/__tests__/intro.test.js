import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useIntroStore } from '../intro.js'
import { useHeroesStore } from '../heroes.js'
import { useGachaStore } from '../gacha.js'
import { getHeroTemplate } from '../../data/heroes/index.js'

describe('intro store', () => {
  let introStore
  let heroesStore
  let gachaStore

  beforeEach(() => {
    setActivePinia(createPinia())
    introStore = useIntroStore()
    heroesStore = useHeroesStore()
    gachaStore = useGachaStore()
  })

  describe('initial state', () => {
    it('starts at NARRATIVE_1 step', () => {
      expect(introStore.currentStep).toBe('NARRATIVE_1')
    })

    it('starts with intro not complete', () => {
      expect(introStore.isIntroComplete).toBe(false)
    })

    it('has no gifted hero initially', () => {
      expect(introStore.giftedHero).toBeNull()
    })
  })

  describe('step progression', () => {
    it('advances from NARRATIVE_1 to NARRATIVE_2', () => {
      introStore.advanceStep()
      expect(introStore.currentStep).toBe('NARRATIVE_2')
    })

    it('advances from NARRATIVE_2 to NARRATIVE_3', () => {
      introStore.currentStep = 'NARRATIVE_2'
      introStore.advanceStep()
      expect(introStore.currentStep).toBe('NARRATIVE_3')
    })

    it('advances from NARRATIVE_3 to HERO_SPOTLIGHT_KENSIN', () => {
      introStore.currentStep = 'NARRATIVE_3'
      introStore.advanceStep()
      expect(introStore.currentStep).toBe('HERO_SPOTLIGHT_KENSIN')
    })

    it('advances from HERO_SPOTLIGHT_KENSIN to HERO_SPOTLIGHT_4STAR', () => {
      introStore.currentStep = 'HERO_SPOTLIGHT_KENSIN'
      introStore.advanceStep()
      expect(introStore.currentStep).toBe('HERO_SPOTLIGHT_4STAR')
    })

    it('advances from HERO_SPOTLIGHT_4STAR to BATTLE_PROMPT', () => {
      introStore.currentStep = 'HERO_SPOTLIGHT_4STAR'
      introStore.advanceStep()
      expect(introStore.currentStep).toBe('BATTLE_PROMPT')
    })

    it('advances from BATTLE_PROMPT to BATTLE', () => {
      introStore.currentStep = 'BATTLE_PROMPT'
      introStore.advanceStep()
      expect(introStore.currentStep).toBe('BATTLE')
    })
  })

  describe('hero gifting', () => {
    it('giftStarterHero adds Kensin to heroes collection', () => {
      introStore.giftStarterHero()
      const kensin = heroesStore.collection.find(h => h.templateId === 'town_guard')
      expect(kensin).toBeDefined()
    })

    it('giftStarterHero adds Kensin to party slot 1', () => {
      introStore.giftStarterHero()
      const kensin = heroesStore.collection.find(h => h.templateId === 'town_guard')
      expect(heroesStore.party[0]).toBe(kensin.instanceId)
    })

    it('giftRandomFourStar adds a 4-star hero to collection', () => {
      introStore.giftRandomFourStar()
      const fourStar = heroesStore.collection.find(h => {
        const template = getHeroTemplate(h.templateId)
        return template && template.rarity === 4
      })
      expect(fourStar).toBeDefined()
    })

    it('giftRandomFourStar stores the gifted hero reference', () => {
      introStore.giftRandomFourStar()
      expect(introStore.giftedHero).not.toBeNull()
      expect(introStore.giftedHero.template.rarity).toBe(4)
    })

    it('giftRandomFourStar adds hero to party slot 2', () => {
      introStore.giftStarterHero() // Fill slot 1 first
      introStore.giftRandomFourStar()
      expect(heroesStore.party[1]).toBe(introStore.giftedHero.instance.instanceId)
    })

    it('giftRandomFourStar does not cost gems', () => {
      const initialGems = gachaStore.gems
      introStore.giftRandomFourStar()
      expect(gachaStore.gems).toBe(initialGems)
    })
  })

  describe('completion', () => {
    it('completeIntro marks intro as complete', () => {
      introStore.completeIntro()
      expect(introStore.isIntroComplete).toBe(true)
    })

    it('completeIntro sets step to COMPLETE', () => {
      introStore.completeIntro()
      expect(introStore.currentStep).toBe('COMPLETE')
    })
  })

  describe('victory and defeat handling', () => {
    it('handleVictory advances to VICTORY_OUTRO', () => {
      introStore.currentStep = 'BATTLE'
      introStore.handleVictory()
      expect(introStore.currentStep).toBe('VICTORY_OUTRO')
    })

    it('handleDefeat advances to DEFEAT_MESSAGE', () => {
      introStore.currentStep = 'BATTLE'
      introStore.handleDefeat()
      expect(introStore.currentStep).toBe('DEFEAT_MESSAGE')
    })

    it('retryBattle returns to BATTLE from DEFEAT_MESSAGE', () => {
      introStore.currentStep = 'DEFEAT_MESSAGE'
      introStore.retryBattle()
      expect(introStore.currentStep).toBe('BATTLE')
    })

    it('goHome from DEFEAT_MESSAGE completes intro', () => {
      introStore.currentStep = 'DEFEAT_MESSAGE'
      introStore.goHome()
      expect(introStore.isIntroComplete).toBe(true)
    })

    it('advancing from VICTORY_OUTRO completes intro', () => {
      introStore.currentStep = 'VICTORY_OUTRO'
      introStore.advanceStep()
      expect(introStore.isIntroComplete).toBe(true)
      expect(introStore.currentStep).toBe('COMPLETE')
    })
  })

  describe('persistence', () => {
    it('saveState includes isIntroComplete', () => {
      introStore.completeIntro()
      const saved = introStore.saveState()
      expect(saved.isIntroComplete).toBe(true)
    })

    it('loadState restores isIntroComplete', () => {
      introStore.loadState({ isIntroComplete: true })
      expect(introStore.isIntroComplete).toBe(true)
    })

    it('loadState with complete intro sets step to COMPLETE', () => {
      introStore.loadState({ isIntroComplete: true })
      expect(introStore.currentStep).toBe('COMPLETE')
    })
  })
})
