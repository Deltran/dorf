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

// Serialize data object back to JS source code
function serializeToJS(data, indent = 2) {
  const lines = []
  const entries = Object.entries(data)

  lines.push('{')
  entries.forEach(([key, value], index) => {
    const comma = index < entries.length - 1 ? ',' : ''
    const serialized = JSON.stringify(value, null, indent)
      .split('\n')
      .map((line, i) => i === 0 ? line : '  ' + line)
      .join('\n')
    lines.push(`  ${key}: ${serialized}${comma}`)
  })
  lines.push('}')

  return lines.join('\n')
}

// Write data back to file, preserving imports and helper functions
function writeDataFile(filePath, exportName, data, imports, suffix) {
  const serialized = serializeToJS(data)
  const content = `${imports}\n\nexport const ${exportName} = ${serialized}\n\n${suffix}\n`
  fs.writeFileSync(filePath, content, 'utf-8')
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

      // POST /api/admin/:contentType - create new entry
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/api\/admin\/(\w+)$/)
        if (req.method === 'POST' && match) {
          const contentType = match[1]
          const filePath = DATA_FILES[contentType]

          if (!filePath) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: `Unknown content type: ${contentType}` }))
            return
          }

          // Read request body
          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          try {
            const newEntry = JSON.parse(body)
            if (!newEntry.id) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Entry must have an id field' }))
              return
            }

            const fullPath = path.resolve(process.cwd(), filePath)
            const { exportName, data, imports, suffix } = parseDataFile(fullPath)

            if (data[newEntry.id]) {
              res.statusCode = 409
              res.end(JSON.stringify({ error: `Entry with id "${newEntry.id}" already exists` }))
              return
            }

            data[newEntry.id] = newEntry
            writeDataFile(fullPath, exportName, data, imports, suffix)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(newEntry))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // PUT /api/admin/:contentType/:id - update entry
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/api\/admin\/(\w+)\/(.+)$/)
        if (req.method === 'PUT' && match) {
          const contentType = match[1]
          const entryId = decodeURIComponent(match[2])
          const filePath = DATA_FILES[contentType]

          if (!filePath) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: `Unknown content type: ${contentType}` }))
            return
          }

          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          try {
            const updatedEntry = JSON.parse(body)
            const fullPath = path.resolve(process.cwd(), filePath)
            const { exportName, data, imports, suffix } = parseDataFile(fullPath)

            if (!data[entryId]) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: `Entry with id "${entryId}" not found` }))
              return
            }

            // If ID changed, remove old key and add new
            if (updatedEntry.id !== entryId) {
              delete data[entryId]
            }
            data[updatedEntry.id] = updatedEntry
            writeDataFile(fullPath, exportName, data, imports, suffix)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(updatedEntry))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // DELETE /api/admin/:contentType/:id - delete entry
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/api\/admin\/(\w+)\/(.+)$/)
        if (req.method === 'DELETE' && match) {
          const contentType = match[1]
          const entryId = decodeURIComponent(match[2])
          const filePath = DATA_FILES[contentType]

          if (!filePath) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: `Unknown content type: ${contentType}` }))
            return
          }

          try {
            const fullPath = path.resolve(process.cwd(), filePath)
            const { exportName, data, imports, suffix } = parseDataFile(fullPath)

            if (!data[entryId]) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: `Entry with id "${entryId}" not found` }))
              return
            }

            delete data[entryId]
            writeDataFile(fullPath, exportName, data, imports, suffix)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
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
