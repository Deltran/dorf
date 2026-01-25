import { describe, it, expect } from 'vitest'
import {
  buildEnemyPrompt,
  buildBackgroundPrompt,
  REGION_THEMES,
  getEnemyPromptWithOverride,
  getBackgroundPromptWithOverride
} from '../prompt-builder.js'

describe('prompt-builder', () => {
  describe('buildEnemyPrompt', () => {
    it('builds prompt from enemy name and skill', () => {
      const enemy = {
        id: 'cave_leech',
        name: 'Cave Leech',
        skill: { name: 'Blood Drain' }
      }

      const prompt = buildEnemyPrompt(enemy)

      expect(prompt).toContain('A cave leech')
      expect(prompt).toContain('Blood drain')
      expect(prompt).toContain('High fantasy.')
    })

    it('ends with High fantasy.', () => {
      const enemy = { id: 'test', name: 'Test Enemy', skill: { name: 'Attack' } }
      const prompt = buildEnemyPrompt(enemy)

      expect(prompt.endsWith('High fantasy.')).toBe(true)
    })
  })

  describe('buildBackgroundPrompt', () => {
    it('builds prompt from node name and region', () => {
      const node = {
        id: 'cliffs_01',
        name: 'Lava Fields',
        region: 'Blistering Cliffsides'
      }

      const prompt = buildBackgroundPrompt(node)

      expect(prompt).toContain('Lava fields')
      expect(prompt).toContain('Volcanic')
      expect(prompt).toContain('Dark fantasy.')
    })

    it('ends with Dark fantasy.', () => {
      const node = { id: 'test', name: 'Test', region: 'Unknown Region' }
      const prompt = buildBackgroundPrompt(node)

      expect(prompt.endsWith('Dark fantasy.')).toBe(true)
    })
  })

  describe('REGION_THEMES', () => {
    it('has themes for all expected regions', () => {
      const expectedRegions = [
        'Blistering Cliffsides',
        'Janxier Floodplain',
        'Old Fort Calindash',
        'Ancient Catacombs',
        'Underground Morass',
        'Gate to Aquaria',
        'Coral Depths'
      ]

      for (const region of expectedRegions) {
        expect(REGION_THEMES[region]).toBeDefined()
      }
    })
  })

  describe('getEnemyPromptWithOverride', () => {
    it('returns generated prompt when no override exists', () => {
      const enemy = { id: 'new_enemy', name: 'New Enemy', skill: { name: 'Strike' } }
      const result = getEnemyPromptWithOverride(enemy)

      expect(result.isOverride).toBe(false)
      expect(result.prompt).toContain('A new enemy')
      expect(result.size).toBeNull()
    })
  })

  describe('getBackgroundPromptWithOverride', () => {
    it('returns generated prompt when no override exists', () => {
      const node = { id: 'new_node', name: 'New Area', region: 'Ancient Catacombs' }
      const result = getBackgroundPromptWithOverride(node)

      expect(result.isOverride).toBe(false)
      expect(result.prompt).toContain('New area')
      expect(result.prompt).toContain('Underground tombs')
    })
  })

  describe('buildEnemyPrompt edge cases', () => {
    it('handles enemy without skill', () => {
      const enemy = { id: 'simple', name: 'Simple Beast' }
      const prompt = buildEnemyPrompt(enemy)

      expect(prompt).toBe('A simple beast. High fantasy.')
    })

    it('handles enemy with null skill', () => {
      const enemy = { id: 'simple', name: 'Simple Beast', skill: null }
      const prompt = buildEnemyPrompt(enemy)

      expect(prompt).toBe('A simple beast. High fantasy.')
    })
  })

  describe('buildBackgroundPrompt edge cases', () => {
    it('handles node without known region', () => {
      const node = { id: 'unknown', name: 'Mystery Place', region: 'Unknown Region' }
      const prompt = buildBackgroundPrompt(node)

      expect(prompt).toBe('Mystery place. Dark fantasy.')
    })
  })
})
