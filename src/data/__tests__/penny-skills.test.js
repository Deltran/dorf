import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroTemplates'

describe('Penny Whistler skills', () => {
  const penny = heroTemplates.street_busker

  it('has Street Racket as a damage skill at level 3', () => {
    const streetRacket = penny.skills.find(s => s.name === 'Street Racket')
    expect(streetRacket).toBeDefined()
    expect(streetRacket.skillUnlockLevel).toBe(3)
    expect(streetRacket.targetType).toBe('enemy')
    expect(streetRacket.damageMultiplier).toBe(0.9)
    expect(streetRacket.noDamage).toBeUndefined()
  })

  it('Street Racket has bonusDamagePerDebuff without consuming debuffs', () => {
    const streetRacket = penny.skills.find(s => s.name === 'Street Racket')
    expect(streetRacket.bonusDamagePerDebuff).toBe(25)
    expect(streetRacket.consumeDebuffs).toBeUndefined()
  })

  it('has Distracting Jingle at level 6', () => {
    const jingle = penny.skills.find(s => s.name === 'Distracting Jingle')
    expect(jingle).toBeDefined()
    expect(jingle.skillUnlockLevel).toBe(6)
  })

  it('has Jarring Whistle at level 1 unchanged', () => {
    const whistle = penny.skills.find(s => s.name === 'Jarring Whistle')
    expect(whistle).toBeDefined()
    expect(whistle.skillUnlockLevel).toBe(1)
    expect(whistle.noDamage).toBe(true)
  })

  it('has Ear-Splitting Crescendo at level 12 unchanged', () => {
    const crescendo = penny.skills.find(s => s.name === 'Ear-Splitting Crescendo')
    expect(crescendo).toBeDefined()
    expect(crescendo.skillUnlockLevel).toBe(12)
  })

  it('Finale deals damage and applies ATK down', () => {
    const finale = penny.finale
    expect(finale.target).toBe('all_enemies')
    const damageEffect = finale.effects.find(e => e.type === 'damage')
    expect(damageEffect).toBeDefined()
    expect(damageEffect.damagePercent).toBe(80)
    const atkDown = finale.effects.find(e => e.type === 'atk_down')
    expect(atkDown).toBeDefined()
    expect(atkDown.value).toBe(15)
  })
})
