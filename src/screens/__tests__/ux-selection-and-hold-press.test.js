/**
 * @vitest-environment happy-dom
 *
 * Acceptance tests for UX changes:
 * 1. Global user-select: none — nothing in the app should be selectable
 * 2. Hero detail in combat uses hold-press (not double-tap)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Global user-select: none', () => {
  it('should have user-select: none on * selector in App.vue', () => {
    const appVue = readFileSync(resolve(__dirname, '../../App.vue'), 'utf-8')
    // Extract the global (non-scoped) style block
    const globalStyleMatch = appVue.match(/<style>[\s\S]*?<\/style>/)
    expect(globalStyleMatch).not.toBeNull()
    const globalStyle = globalStyleMatch[0]

    expect(globalStyle).toContain('user-select: none')
    expect(globalStyle).toContain('-webkit-user-select: none')
    expect(globalStyle).toContain('-webkit-touch-callout: none')
  })

  it('should NOT have user-select: none in individual component files', () => {
    // Spot-check key components that previously had user-select: none
    const componentFiles = [
      '../../components/HeroCard.vue',
      '../../components/EnemyCard.vue',
      '../../components/ItemCard.vue',
      '../../components/ActionButton.vue',
      '../../components/DamageNumber.vue',
      '../../components/SkillPanel.vue',
    ]

    for (const file of componentFiles) {
      const content = readFileSync(resolve(__dirname, file), 'utf-8')
      expect(content, `${file} should not contain user-select: none`).not.toContain('user-select: none')
    }
  })
})

describe('Hero detail uses hold-press in combat (not double-tap)', () => {
  it('should NOT have lastClickedHero ref in BattleScreen', () => {
    const battleScreen = readFileSync(resolve(__dirname, '../BattleScreen.vue'), 'utf-8')
    expect(battleScreen).not.toContain('lastClickedHero')
  })

  it('should have hero long-press touch handlers in BattleScreen', () => {
    const battleScreen = readFileSync(resolve(__dirname, '../BattleScreen.vue'), 'utf-8')
    expect(battleScreen).toContain('onHeroTouchStart')
    expect(battleScreen).toContain('onHeroTouchEnd')
    expect(battleScreen).toContain('onHeroTouchMove')
  })

  it('should bind hero touch events on .hero-wrapper in the template', () => {
    const battleScreen = readFileSync(resolve(__dirname, '../BattleScreen.vue'), 'utf-8')
    // Extract template section
    const templateMatch = battleScreen.match(/<template>[\s\S]*?<\/template>/)
    expect(templateMatch).not.toBeNull()
    const template = templateMatch[0]

    expect(template).toContain('@touchstart.passive="onHeroTouchStart(hero')
    expect(template).toContain('@touchend="onHeroTouchEnd"')
    expect(template).toContain('@touchmove="onHeroTouchMove"')
    expect(template).toContain('@mousedown="onHeroTouchStart(hero')
    expect(template).toContain('@mouseup="onHeroTouchEnd"')
  })

  it('should use the same LONG_PRESS_DURATION for hero and enemy', () => {
    const battleScreen = readFileSync(resolve(__dirname, '../BattleScreen.vue'), 'utf-8')
    // Should only define LONG_PRESS_DURATION once (shared between hero and enemy)
    const matches = battleScreen.match(/const LONG_PRESS_DURATION/g)
    expect(matches).toHaveLength(1)
  })

  it('should call openHeroDetail in hero long-press handler', () => {
    const battleScreen = readFileSync(resolve(__dirname, '../BattleScreen.vue'), 'utf-8')
    // The hero touch start handler should call openHeroDetail
    const heroTouchStartMatch = battleScreen.match(
      /function onHeroTouchStart[\s\S]*?openHeroDetail[\s\S]*?}/
    )
    expect(heroTouchStartMatch).not.toBeNull()
  })

  it('should keep handleHeroClick for targeting only (no detail logic)', () => {
    const battleScreen = readFileSync(resolve(__dirname, '../BattleScreen.vue'), 'utf-8')
    // handleHeroClick should still exist for targeting
    expect(battleScreen).toContain('function handleHeroClick')
    // But should NOT contain double-tap detection patterns
    expect(battleScreen).not.toContain('lastClickedHero')
    // handleHeroClick should NOT call openHeroDetail
    const clickHandler = battleScreen.match(
      /function handleHeroClick[\s\S]*?^}/m
    )
    expect(clickHandler).not.toBeNull()
    expect(clickHandler[0]).not.toContain('openHeroDetail')
  })

  it('should mirror enemy long-press pattern (touchstart, touchend, touchmove)', () => {
    const battleScreen = readFileSync(resolve(__dirname, '../BattleScreen.vue'), 'utf-8')
    // Both hero and enemy should have the same three handler types
    expect(battleScreen).toContain('function onHeroTouchStart')
    expect(battleScreen).toContain('function onHeroTouchEnd')
    expect(battleScreen).toContain('function onHeroTouchMove')
    expect(battleScreen).toContain('function onEnemyTouchStart')
    expect(battleScreen).toContain('function onEnemyTouchEnd')
    expect(battleScreen).toContain('function onEnemyTouchMove')
  })
})
