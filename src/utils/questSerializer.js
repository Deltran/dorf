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
