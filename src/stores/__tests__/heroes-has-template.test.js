import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHeroesStore } from '../heroes.js'

describe('heroes store - hasTemplate', () => {
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    heroesStore = useHeroesStore()
  })

  it('returns false when collection is empty', () => {
    expect(heroesStore.hasTemplate('aurora_the_dawn')).toBe(false)
  })

  it('returns true when hero with templateId exists', () => {
    heroesStore.addHero('aurora_the_dawn')
    expect(heroesStore.hasTemplate('aurora_the_dawn')).toBe(true)
  })

  it('returns false for different templateId', () => {
    heroesStore.addHero('aurora_the_dawn')
    expect(heroesStore.hasTemplate('shadow_king')).toBe(false)
  })

  it('returns true even with multiple copies', () => {
    heroesStore.addHero('aurora_the_dawn')
    heroesStore.addHero('aurora_the_dawn')
    expect(heroesStore.hasTemplate('aurora_the_dawn')).toBe(true)
  })
})
