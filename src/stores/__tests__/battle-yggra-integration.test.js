import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { heroTemplates } from '../../data/heroTemplates'

describe('Yggra skills integration', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  it('Yggra template has all required skills', () => {
    const yggra = heroTemplates.yggra_world_root
    expect(yggra.skills).toHaveLength(5)

    const skillNames = yggra.skills.map(s => s.name)
    expect(skillNames).toContain('Blessing of the World Root')
    expect(skillNames).toContain('Grasping Roots')
    expect(skillNames).toContain('Bark Shield')
    expect(skillNames).toContain("Nature's Reclamation")
    expect(skillNames).toContain("World Root's Embrace")
  })

  it("Nature's Reclamation has healAlliesPercent property", () => {
    const yggra = heroTemplates.yggra_world_root
    const skill = yggra.skills.find(s => s.name === "Nature's Reclamation")
    expect(skill.healAlliesPercent).toBe(35)
  })
})
