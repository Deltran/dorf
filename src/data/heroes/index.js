// Skill target types:
// 'enemy' - single enemy target
// 'ally' - single ally target
// 'self' - targets self only (no selection needed)
// 'all_enemies' - all enemies (no selection needed)
// 'all_allies' - all allies (no selection needed)

// Effect target types for skill effects:
// 'enemy' - applies to targeted enemy
// 'ally' - applies to targeted ally
// 'self' - applies to the caster
// 'all_allies' - applies to all allies (for AoE buffs)

import { heroes as fiveStar } from './5star/index.js'
import { heroes as fourStar } from './4star/index.js'
import { heroes as threeStar } from './3star/index.js'
import { heroes as twoStar } from './2star/index.js'
import { heroes as oneStar } from './1star/index.js'

export const heroTemplates = {
  ...fiveStar,
  ...fourStar,
  ...threeStar,
  ...twoStar,
  ...oneStar
}

export function getHeroTemplate(templateId) {
  return heroTemplates[templateId] || null
}

export function getHeroTemplatesByRarity(rarity) {
  return Object.values(heroTemplates).filter(h => h.rarity === rarity)
}

export function getAllHeroTemplates() {
  return Object.values(heroTemplates)
}
