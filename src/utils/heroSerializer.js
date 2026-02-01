import { EffectType } from '../data/statusEffects.js'

// Build reverse mapping from string values to EffectType keys
const effectTypeToKey = {}
for (const [key, value] of Object.entries(EffectType)) {
  effectTypeToKey[value] = key
}

/**
 * Formats a JavaScript value as a string for serialization
 * @param {*} value - The value to format
 * @param {number} indent - Current indentation level
 * @returns {string} Formatted string representation
 */
function formatValue(value, indent = 0) {
  const spaces = '  '.repeat(indent)
  const innerSpaces = '  '.repeat(indent + 1)

  if (value === null) {
    return 'null'
  }

  if (value === undefined) {
    return 'undefined'
  }

  if (typeof value === 'boolean') {
    return value.toString()
  }

  if (typeof value === 'number') {
    return value.toString()
  }

  if (typeof value === 'string') {
    // Use double quotes if string contains single quotes, else single quotes
    if (value.includes("'")) {
      return `"${value.replace(/"/g, '\\"')}"`
    }
    return `'${value}'`
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]'
    }

    const items = value.map(item => {
      const formatted = formatValue(item, indent + 1)
      return `${innerSpaces}${formatted}`
    })

    return `[\n${items.join(',\n')}\n${spaces}]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return '{}'
    }

    // Check if this is a simple inline object (all values are primitives and object is small)
    const isSimple = entries.every(([, v]) =>
      typeof v === 'number' || typeof v === 'boolean' ||
      (typeof v === 'string' && !v.includes('\n'))
    ) && entries.length <= 5

    if (isSimple) {
      const items = entries.map(([key, val]) => {
        return `${key}: ${formatValue(val, 0)}`
      })
      return `{ ${items.join(', ')} }`
    }

    const items = entries.map(([key, val]) => {
      const formatted = formatValue(val, indent + 1)
      return `${innerSpaces}${key}: ${formatted}`
    })

    return `{\n${items.join(',\n')}\n${spaces}}`
  }

  return String(value)
}

/**
 * Checks if a hero object contains any effects that use EffectType constants
 * @param {Object} hero - The hero object
 * @returns {boolean} True if hero has effects
 */
function heroHasEffects(hero) {
  // Check skills for effects
  if (hero.skills) {
    for (const skill of hero.skills) {
      if (skill.effects && skill.effects.length > 0) {
        // Check if any effect uses a standard EffectType (not custom finale effects)
        for (const effect of skill.effects) {
          if (effectTypeToKey[effect.type]) {
            return true
          }
        }
      }
    }
  }

  // Leader skills use different effect types (passive, timed, etc.) not EffectType
  // Finale effects are custom types, not EffectType

  return false
}

/**
 * Formats an effect object, converting type strings to EffectType constants
 * @param {Object} effect - The effect object
 * @param {number} indent - Current indentation level
 * @returns {string} Formatted effect string
 */
function formatEffect(effect, indent) {
  const spaces = '  '.repeat(indent)
  const innerSpaces = '  '.repeat(indent + 1)

  const entries = Object.entries(effect).map(([key, value]) => {
    if (key === 'type' && effectTypeToKey[value]) {
      // Use EffectType.XXX constant
      return `${innerSpaces}${key}: EffectType.${effectTypeToKey[value]}`
    }
    return `${innerSpaces}${key}: ${formatValue(value, indent + 1)}`
  })

  return `{\n${entries.join(',\n')}\n${spaces}}`
}

/**
 * Formats a skill object with proper effect handling
 * @param {Object} skill - The skill object
 * @param {number} indent - Current indentation level
 * @returns {string} Formatted skill string
 */
function formatSkill(skill, indent) {
  const spaces = '  '.repeat(indent)
  const innerSpaces = '  '.repeat(indent + 1)

  const entries = Object.entries(skill).map(([key, value]) => {
    if (key === 'effects' && Array.isArray(value)) {
      const effectStrings = value.map(effect => {
        // Check if this effect uses a standard EffectType
        if (effectTypeToKey[effect.type]) {
          return `${innerSpaces}  ${formatEffect(effect, indent + 2)}`
        }
        return `${innerSpaces}  ${formatValue(effect, indent + 2)}`
      })
      return `${innerSpaces}effects: [\n${effectStrings.join(',\n')}\n${innerSpaces}]`
    }
    return `${innerSpaces}${key}: ${formatValue(value, indent + 1)}`
  })

  return `{\n${entries.join(',\n')}\n${spaces}}`
}

/**
 * Serializes a hero object to JavaScript file content
 * @param {Object} hero - The hero object to serialize
 * @returns {string} JavaScript file content string
 */
export function serializeHero(hero) {
  const lines = []

  // Add import if hero has effects
  if (heroHasEffects(hero)) {
    lines.push("import { EffectType } from '../../statusEffects.js'")
    lines.push('')
  }

  // Start export
  lines.push(`export const ${hero.id} = {`)

  // Add properties in order
  const propertyOrder = ['id', 'name', 'rarity', 'classId', 'baseStats', 'skills', 'leaderSkill', 'finale']

  for (const prop of propertyOrder) {
    if (hero[prop] === undefined) continue

    if (prop === 'skills') {
      const skillStrings = hero.skills.map(skill => {
        return `    ${formatSkill(skill, 2)}`
      })
      lines.push(`  skills: [`)
      lines.push(skillStrings.join(',\n'))
      lines.push(`  ],`)
    } else if (prop === 'leaderSkill' || prop === 'finale') {
      const formatted = formatValue(hero[prop], 1)
      lines.push(`  ${prop}: ${formatted},`)
    } else if (prop === 'baseStats') {
      const formatted = formatValue(hero[prop], 1)
      lines.push(`  ${prop}: ${formatted},`)
    } else {
      const formatted = formatValue(hero[prop], 1)
      lines.push(`  ${prop}: ${formatted},`)
    }
  }

  // Add any additional properties not in the standard order
  for (const [key, value] of Object.entries(hero)) {
    if (!propertyOrder.includes(key)) {
      lines.push(`  ${key}: ${formatValue(value, 1)},`)
    }
  }

  // Close export (remove trailing comma from last property)
  if (lines.length > 0) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '')
  }
  lines.push('}')

  return lines.join('\n') + '\n'
}

/**
 * Parses JavaScript file content to extract a hero object
 * @param {string} content - The JavaScript file content
 * @returns {Object} The parsed hero object
 */
export function parseHeroFile(content) {
  // Replace EffectType.XXX references with string values
  let processedContent = content

  for (const [key, value] of Object.entries(EffectType)) {
    // Replace EffectType.XXX with 'value'
    const regex = new RegExp(`EffectType\\.${key}\\b`, 'g')
    processedContent = processedContent.replace(regex, `'${value}'`)
  }

  // Remove the import statement
  processedContent = processedContent.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"]\s*;?\n*/g, '')

  // Extract the object from export const xxx = {...}
  const exportMatch = processedContent.match(/export\s+const\s+\w+\s*=\s*(\{[\s\S]*\})\s*;?\s*$/)
  if (!exportMatch) {
    throw new Error('Could not find hero export in file content')
  }

  const objectString = exportMatch[1]

  // Use Function constructor to safely evaluate the object literal
  // This is safe because we're only parsing data we control
  try {
    const fn = new Function(`return ${objectString}`)
    return fn()
  } catch (error) {
    throw new Error(`Failed to parse hero object: ${error.message}`)
  }
}
