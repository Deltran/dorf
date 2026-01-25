// Prompt builder - generates prompts from game data
import { enemyPrompts, backgroundPrompts } from '../../src/data/assetPrompts.js'

// Region to theme keywords mapping
export const REGION_THEMES = {
  'Blistering Cliffsides': 'Volcanic cliffs. Orange lava glow. Black rock. Ash in air.',
  'Janxier Floodplain': 'Flooded plains. Murky water. Dead trees. Overcast sky.',
  'Old Fort Calindash': 'Ruined fort. Crumbling stone walls. Overgrown with vines. Ghostly atmosphere.',
  'Ancient Catacombs': 'Underground tombs. Stone coffins. Flickering torches. Scattered bones.',
  'Underground Morass': 'Swamp cave. Glowing mushrooms. Murky water. Twisted roots.',
  'Gate to Aquaria': 'Underwater realm. Coral formations. Blue-green light. Bubbles rising.',
  'Coral Depths': 'Deep ocean. Coral reef. Bioluminescent creatures. Dark water.'
}

export function buildEnemyPrompt(enemy) {
  // Check for manual override first
  if (enemyPrompts[enemy.id]) {
    return enemyPrompts[enemy.id].prompt
  }

  const parts = []

  // Name (convert to lowercase for natural sentence)
  const name = enemy.name.toLowerCase()
  const article = /^[aeiou]/i.test(name) ? 'An' : 'A'
  parts.push(`${article} ${name}.`)

  // Skill flavor if available
  if (enemy.skill?.name) {
    const skillName = enemy.skill.name.toLowerCase()
    parts.push(`${skillName.charAt(0).toUpperCase() + skillName.slice(1)} ability.`)
  }

  // Style suffix
  parts.push('High fantasy.')

  return parts.join(' ')
}

export function buildBackgroundPrompt(node) {
  // Check for manual override first
  if (backgroundPrompts[node.id]) {
    return backgroundPrompts[node.id].prompt
  }

  const parts = []

  // Node name
  const nodeName = node.name.toLowerCase()
  parts.push(`${nodeName.charAt(0).toUpperCase() + nodeName.slice(1)}.`)

  // Region theme
  const theme = REGION_THEMES[node.region]
  if (theme) {
    parts.push(theme)
  }

  // Style suffix
  parts.push('Dark fantasy.')

  return parts.join(' ')
}

export function getEnemyPromptWithOverride(enemy) {
  if (enemyPrompts[enemy.id]) {
    return {
      prompt: enemyPrompts[enemy.id].prompt,
      size: enemyPrompts[enemy.id].size || null,
      isOverride: true
    }
  }
  return {
    prompt: buildEnemyPrompt(enemy),
    size: null,
    isOverride: false
  }
}

export function getBackgroundPromptWithOverride(node) {
  if (backgroundPrompts[node.id]) {
    return {
      prompt: backgroundPrompts[node.id].prompt,
      isOverride: true
    }
  }
  return {
    prompt: buildBackgroundPrompt(node),
    isOverride: false
  }
}
