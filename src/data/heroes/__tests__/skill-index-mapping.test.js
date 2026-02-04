import { describe, it, expect } from 'vitest'
import { getAllHeroTemplates } from '../index.js'

// Replicates BattleScreen's availableSkills filtering logic
function getAvailableSkills(template, heroLevel = 99) {
  const skills = template.skills || (template.skill ? [template.skill] : [])
  return skills
    .map((skill, originalIndex) => ({ skill, originalIndex }))
    .filter(({ skill }) => {
      if (skill.isPassive) return false
      const unlockLevel = skill.skillUnlockLevel ?? 1
      return heroLevel >= unlockLevel
    })
}

// Replicates battle.js getSkillByIndex
function getSkillByIndex(template, index) {
  if (template.skills) return template.skills[index] || null
  if (template.skill && index === 0) return template.skill
  return null
}

describe('Skill index mapping', () => {
  const templates = getAllHeroTemplates()

  for (const template of templates) {
    const skills = template.skills || (template.skill ? [template.skill] : [])
    const hasPassives = skills.some(s => s.isPassive)

    if (skills.length === 0) continue

    describe(template.name, () => {
      it('filtered skill indices should map back to the correct skills', () => {
        const available = getAvailableSkills(template)

        for (let uiIndex = 0; uiIndex < available.length; uiIndex++) {
          const { skill: expectedSkill, originalIndex } = available[uiIndex]
          const lookedUp = getSkillByIndex(template, originalIndex)

          expect(lookedUp).not.toBeNull()
          expect(lookedUp.name).toBe(expectedSkill.name)
          expect(lookedUp.targetType).toBe(expectedSkill.targetType)
        }
      })

      if (hasPassives) {
        it('should not map a passive skill when selecting an active skill', () => {
          const available = getAvailableSkills(template)

          for (const { originalIndex } of available) {
            const skill = getSkillByIndex(template, originalIndex)
            expect(skill.isPassive).toBeFalsy()
          }
        })
      }
    })
  }
})
