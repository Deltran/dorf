/**
 * Quest region file serializer/deserializer.
 *
 * Region files (src/data/quests/*.js) export two things:
 *   - regionMeta: region metadata object
 *   - nodes: object keyed by node ID
 *
 * They may also have import lines (e.g., for map background images).
 * This module parses those files from their string content using
 * brace-counting and new Function() evaluation (same pattern as
 * vite-plugin-admin.js).
 */

/**
 * Finds an `export const {exportName} = { ... }` block in source content
 * using brace-counting to locate the matching closing brace, then evaluates
 * the object literal with `new Function()`.
 *
 * @param {string} content - Full file content
 * @param {string} exportName - The export name to find (e.g., 'regionMeta' or 'nodes')
 * @param {Object} [options] - Options
 * @param {string[]} [options.stripProperties] - Property names whose values are bare
 *   identifiers (e.g., import references) that would cause evaluation to fail.
 *   These lines are removed from the object string before evaluation.
 * @returns {{ object: Object, startIndex: number, endIndex: number } | null}
 */
function parseExportObject(content, exportName, options = {}) {
  const regex = new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*\\{`)
  const match = content.match(regex)
  if (!match) {
    return null
  }

  // Find the opening brace position
  const startIndex = content.indexOf('{', match.index)

  // Count braces to find the matching closing brace
  let braceCount = 0
  let endIndex = startIndex
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') braceCount++
    else if (content[i] === '}') {
      braceCount--
      if (braceCount === 0) {
        endIndex = i
        break
      }
    }
  }

  let objectStr = content.slice(startIndex, endIndex + 1)

  // Strip properties that reference bare identifiers (e.g., import variables)
  // so that new Function() evaluation doesn't throw ReferenceError
  if (options.stripProperties) {
    for (const prop of options.stripProperties) {
      // Match the property line: "  backgroundImage: someIdentifier" with optional trailing comma
      const propRegex = new RegExp(`\\n\\s*${prop}:\\s*[a-zA-Z_$][a-zA-Z0-9_$]*,?\\s*\\n`, 'g')
      objectStr = objectStr.replace(propRegex, '\n')
    }
  }

  try {
    const object = new Function(`return ${objectStr}`)()
    return { object, startIndex: match.index, endIndex }
  } catch (e) {
    throw new Error(`Failed to parse export "${exportName}": ${e.message}`)
  }
}

/**
 * Parses a region file's content string and returns its constituent parts.
 *
 * @param {string} fileContent - The full content of a region .js file
 * @returns {{ importLines: string[], regionMeta: Object, nodes: Object }}
 *   - importLines: array of import line strings
 *   - regionMeta: the region metadata object (backgroundImage stripped)
 *   - nodes: object keyed by node ID
 */
export function parseRegionFile(fileContent) {
  // Extract import lines
  const importLines = []
  const importRegex = /^import\s+.+$/gm
  let importMatch
  while ((importMatch = importRegex.exec(fileContent)) !== null) {
    importLines.push(importMatch[0])
  }

  // Parse regionMeta, stripping backgroundImage since it references an
  // import identifier that can't be evaluated by new Function()
  const regionMetaResult = parseExportObject(fileContent, 'regionMeta', {
    stripProperties: ['backgroundImage']
  })
  if (!regionMetaResult) {
    throw new Error('Could not find regionMeta export in file content')
  }
  const regionMeta = regionMetaResult.object

  // Parse nodes
  const nodesResult = parseExportObject(fileContent, 'nodes')
  if (!nodesResult) {
    throw new Error('Could not find nodes export in file content')
  }
  const nodes = nodesResult.object

  return { importLines, regionMeta, nodes }
}

/**
 * Converts a snake_case string to camelCase.
 *
 * @param {string} str - snake_case string (e.g., 'whispering_woods')
 * @returns {string} camelCase string (e.g., 'whisperingWoods')
 */
export function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Adds a new region's import and spread to the quests index.js content string.
 *
 * Inserts `import { nodes as {camelCase}Nodes } from './{regionId}.js'`
 * before the `export { regions, superRegions }` line, and adds
 * `...{camelCase}Nodes` spread before the closing brace of questNodes.
 *
 * @param {string} content - The full content of index.js
 * @param {string} regionId - Snake_case region ID (e.g., 'whisper_lake')
 * @param {string} superRegion - The super-region this region belongs to (unused for now, reserved)
 * @returns {string} Modified content
 */
export function addRegionToIndex(content, regionId, superRegion) {
  const camel = toCamelCase(regionId)
  const varName = camel + 'Nodes'
  const importLine = `import { nodes as ${varName} } from './${regionId}.js'`

  // Insert import before the "export { regions, superRegions }" line
  const regionsExportLine = "export { regions, superRegions } from './regions.js'"
  const regionsExportIndex = content.indexOf(regionsExportLine)
  let result
  if (regionsExportIndex !== -1) {
    result = content.slice(0, regionsExportIndex) + importLine + '\n' + content.slice(regionsExportIndex)
  } else {
    // Fallback: prepend
    result = importLine + '\n' + content
  }

  // Insert spread before the closing brace of questNodes
  // Find the questNodes block's closing brace
  const questNodesMatch = result.match(/export\s+const\s+questNodes\s*=\s*\{/)
  if (questNodesMatch) {
    const blockStart = result.indexOf('{', questNodesMatch.index)
    // Find matching closing brace
    let braceCount = 0
    let closingBrace = blockStart
    for (let i = blockStart; i < result.length; i++) {
      if (result[i] === '{') braceCount++
      else if (result[i] === '}') {
        braceCount--
        if (braceCount === 0) {
          closingBrace = i
          break
        }
      }
    }

    // Find the last spread line before the closing brace to add after it
    const blockContent = result.slice(blockStart, closingBrace)
    const lastSpreadMatch = blockContent.match(/.*\.\.\.\w+Nodes\b[^}]*$/m)

    if (lastSpreadMatch) {
      // Find the end of the last spread line
      const lastSpreadEnd = blockStart + lastSpreadMatch.index + lastSpreadMatch[0].length
      // Ensure trailing comma on the previous last spread if missing
      const prevLine = result.slice(blockStart + lastSpreadMatch.index, lastSpreadEnd)
      let insertStr = ''
      if (!prevLine.trimEnd().endsWith(',')) {
        // Need to add comma after existing last spread
        insertStr = ','
      }
      insertStr += '\n  ...' + varName
      result = result.slice(0, lastSpreadEnd) + insertStr + result.slice(lastSpreadEnd)
    } else {
      // No existing spreads, insert before closing brace
      result = result.slice(0, closingBrace) + '  ...' + varName + '\n' + result.slice(closingBrace)
    }
  }

  return result
}

/**
 * Removes a region's import and spread from the quests index.js content string.
 *
 * @param {string} content - The full content of index.js
 * @param {string} regionId - Snake_case region ID (e.g., 'whisper_lake')
 * @returns {string} Modified content
 */
export function removeRegionFromIndex(content, regionId) {
  const camel = toCamelCase(regionId)
  const varName = camel + 'Nodes'

  // Remove the import line (entire line including newline)
  const importRegex = new RegExp(`^import\\s*\\{\\s*nodes\\s+as\\s+${varName}\\s*\\}\\s*from\\s*'./${regionId}\\.js'\\s*\\n`, 'm')
  let result = content.replace(importRegex, '')

  // Remove the spread line (with optional leading comma on previous line fix)
  // Match "  ...varName" with optional trailing comma and newline
  const spreadRegex = new RegExp(`^[ \\t]*\\.\\.\\.${varName},?\\s*\\n`, 'm')
  result = result.replace(spreadRegex, '')

  // Clean up: if the last spread before closing brace has a trailing comma, remove it
  // Find questNodes closing brace and check the line before it
  result = result.replace(/,(\s*\n\s*\})/, '$1')

  return result
}

/**
 * Adds a new region's import and entry to the regions.js content string.
 *
 * Inserts `import { regionMeta as {camelCase} } from './{regionId}.js'`
 * before the `export const superRegions` line, and adds `{camelCase}`
 * entry before the closing bracket of the regions array.
 *
 * @param {string} content - The full content of regions.js
 * @param {string} regionId - Snake_case region ID (e.g., 'whisper_lake')
 * @param {string} superRegion - The super-region this belongs to (unused for now, reserved)
 * @returns {string} Modified content
 */
export function addRegionToRegions(content, regionId, superRegion) {
  const camel = toCamelCase(regionId)
  const importLine = `import { regionMeta as ${camel} } from './${regionId}.js'`

  // Insert import before "export const superRegions"
  const superRegionsIndex = content.indexOf('export const superRegions')
  let result
  if (superRegionsIndex !== -1) {
    result = content.slice(0, superRegionsIndex) + importLine + '\n' + content.slice(superRegionsIndex)
  } else {
    result = importLine + '\n' + content
  }

  // Insert entry before the closing bracket of the regions array
  const regionsArrayMatch = result.match(/export\s+const\s+regions\s*=\s*\[/)
  if (regionsArrayMatch) {
    const arrayStart = result.indexOf('[', regionsArrayMatch.index)
    // Find matching closing bracket
    let bracketCount = 0
    let closingBracket = arrayStart
    for (let i = arrayStart; i < result.length; i++) {
      if (result[i] === '[') bracketCount++
      else if (result[i] === ']') {
        bracketCount--
        if (bracketCount === 0) {
          closingBracket = i
          break
        }
      }
    }

    // Find the last non-comment, non-empty entry before closing bracket
    const arrayContent = result.slice(arrayStart + 1, closingBracket)
    // Find the last identifier line (the last region entry)
    const lines = arrayContent.split('\n')
    let lastEntryLineIndex = -1
    for (let i = lines.length - 1; i >= 0; i--) {
      const trimmed = lines[i].trim()
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('[')) {
        lastEntryLineIndex = i
        break
      }
    }

    if (lastEntryLineIndex !== -1) {
      // Ensure the last entry has a trailing comma
      const lastLine = lines[lastEntryLineIndex]
      if (!lastLine.trimEnd().endsWith(',')) {
        lines[lastEntryLineIndex] = lastLine.replace(/(\S)\s*$/, '$1,')
      }
      // Add the new entry after the last entry
      lines.splice(lastEntryLineIndex + 1, 0, `  ${camel}`)
      const newArrayContent = lines.join('\n')
      result = result.slice(0, arrayStart + 1) + newArrayContent + result.slice(closingBracket)
    } else {
      // Empty array, just insert
      result = result.slice(0, closingBracket) + '\n  ' + camel + '\n' + result.slice(closingBracket)
    }
  }

  return result
}

/**
 * Removes a region's import and entry from the regions.js content string.
 *
 * @param {string} content - The full content of regions.js
 * @param {string} regionId - Snake_case region ID (e.g., 'whisper_lake')
 * @returns {string} Modified content
 */
export function removeRegionFromRegions(content, regionId) {
  const camel = toCamelCase(regionId)

  // Remove the import line
  const importRegex = new RegExp(`^import\\s*\\{\\s*regionMeta\\s+as\\s+${camel}\\s*\\}\\s*from\\s*'./${regionId}\\.js'\\s*\\n`, 'm')
  let result = content.replace(importRegex, '')

  // Remove the entry from the regions array (line with just the camelCase var, optional comma)
  const entryRegex = new RegExp(`^[ \\t]*${camel},?\\s*\\n`, 'm')
  result = result.replace(entryRegex, '')

  // Clean up trailing comma before closing bracket
  result = result.replace(/,(\s*\n\s*\])/, '$1')

  return result
}
