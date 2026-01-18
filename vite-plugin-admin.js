// vite-plugin-admin.js
import fs from 'fs'
import path from 'path'

const DATA_FILES = {
  heroes: 'src/data/heroTemplates.js',
  enemies: 'src/data/enemyTemplates.js',
  classes: 'src/data/classes.js',
  statusEffects: 'src/data/statusEffects.js',
  questNodes: 'src/data/questNodes.js',
  items: 'src/data/items.js'
}

// Extract the main export object from a JS file
function parseDataFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')

  // Find the main export (e.g., "export const heroTemplates = {")
  const exportMatch = content.match(/export\s+const\s+(\w+)\s*=\s*\{/)
  if (!exportMatch) {
    throw new Error(`Could not find main export in ${filePath}`)
  }

  const exportName = exportMatch[1]

  // Find the opening brace position
  const startIndex = content.indexOf('{', exportMatch.index)

  // Find matching closing brace by counting braces
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

  const objectStr = content.slice(startIndex, endIndex + 1)

  // Use Function constructor to safely evaluate the object
  // Note: This is safe because we control the source files
  try {
    const data = new Function(`return ${objectStr}`)()
    return {
      exportName,
      data,
      imports: content.slice(0, exportMatch.index).trim(),
      suffix: content.slice(endIndex + 1).trim()
    }
  } catch (e) {
    throw new Error(`Failed to parse ${filePath}: ${e.message}`)
  }
}

export default function adminPlugin() {
  return {
    name: 'vite-plugin-admin',
    configureServer(server) {
      // GET /api/admin/:contentType - fetch all entries
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/api\/admin\/(\w+)$/)
        if (req.method === 'GET' && match) {
          const contentType = match[1]
          const filePath = DATA_FILES[contentType]

          if (!filePath) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: `Unknown content type: ${contentType}` }))
            return
          }

          try {
            const fullPath = path.resolve(process.cwd(), filePath)
            const { data } = parseDataFile(fullPath)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })
    }
  }
}
