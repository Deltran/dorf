// vite-plugin-admin.js
import fs from 'fs'
import path from 'path'

const DATA_FILES = {
  heroes: { path: 'src/data/heroTemplates.js', exportName: 'heroTemplates' },
  enemies: { path: 'src/data/enemyTemplates.js', exportName: 'enemyTemplates' },
  classes: { path: 'src/data/classes.js', exportName: 'classes' },
  statusEffects: { path: 'src/data/statusEffects.js', exportName: 'effectDefinitions' },
  questNodes: { path: 'src/data/questNodes.js', exportName: 'questNodes' },
  items: { path: 'src/data/items.js', exportName: 'items' }
}

// EffectType enum - must match src/data/statusEffects.js
const EffectType = {
  ATK_UP: 'atk_up',
  ATK_DOWN: 'atk_down',
  DEF_UP: 'def_up',
  DEF_DOWN: 'def_down',
  SPD_UP: 'spd_up',
  SPD_DOWN: 'spd_down',
  POISON: 'poison',
  BURN: 'burn',
  REGEN: 'regen',
  MP_REGEN: 'mp_regen',
  STUN: 'stun',
  SHIELD: 'shield',
  THORNS: 'thorns',
  TAUNT: 'taunt',
  UNTARGETABLE: 'untargetable'
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
  // Inject EffectType for files that use it (heroTemplates, enemyTemplates)
  try {
    const data = new Function('EffectType', `return ${objectStr}`)(EffectType)
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
          const fileConfig = DATA_FILES[contentType]

          if (!fileConfig) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: `Unknown content type: ${contentType}` }))
            return
          }

          try {
            const fullPath = path.resolve(process.cwd(), fileConfig.path)
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
          const fileConfig = DATA_FILES[contentType]

          if (!fileConfig) {
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

            const fullPath = path.resolve(process.cwd(), fileConfig.path)
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
          const fileConfig = DATA_FILES[contentType]

          if (!fileConfig) {
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
            const fullPath = path.resolve(process.cwd(), fileConfig.path)
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
          const fileConfig = DATA_FILES[contentType]

          if (!fileConfig) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: `Unknown content type: ${contentType}` }))
            return
          }

          try {
            const fullPath = path.resolve(process.cwd(), fileConfig.path)
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

      // POST /__admin/save-asset - save a generated image asset to disk
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/__admin/save-asset') {
          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          try {
            const { assetPath, dataUrl } = JSON.parse(body)

            if (!assetPath || typeof assetPath !== 'string' || !dataUrl || typeof dataUrl !== 'string') {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'assetPath and dataUrl are required strings' }))
              return
            }

            const assetsDir = path.resolve(process.cwd(), 'src/assets')
            const fullPath = path.resolve(assetsDir, assetPath)

            // Path traversal protection: ensure resolved path is within src/assets/
            if (!fullPath.startsWith(assetsDir + path.sep)) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid asset path' }))
              return
            }

            // Extract base64 data from data URL (strip "data:image/...;base64," prefix)
            const base64Data = dataUrl.replace(/^data:image\/[^;]+;base64,/, '')
            const buffer = Buffer.from(base64Data, 'base64')

            // Create directories if needed
            fs.mkdirSync(path.dirname(fullPath), { recursive: true })

            // Write the file
            fs.writeFileSync(fullPath, buffer)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // POST /__admin/save-prompts - save asset prompts JSON to disk
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/__admin/save-prompts') {
          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          try {
            const prompts = JSON.parse(body)
            const promptsPath = path.resolve(process.cwd(), 'src/data/assetPrompts.json')
            fs.writeFileSync(promptsPath, JSON.stringify(prompts, null, 2) + '\n', 'utf-8')

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // POST /__admin/save-node-positions - update x/y in questNodes.js
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/__admin/save-node-positions') {
          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          try {
            const { positions } = JSON.parse(body)

            if (!positions || typeof positions !== 'object') {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'positions object is required' }))
              return
            }

            const filePath = path.resolve(process.cwd(), 'src/data/questNodes.js')
            let content = fs.readFileSync(filePath, 'utf-8')

            for (const [nodeId, pos] of Object.entries(positions)) {
              const x = Math.round(pos.x)
              const y = Math.round(pos.y)

              // Find the node block by its id property
              const idPattern = new RegExp(`id:\\s*'${nodeId}'`)
              const idMatch = content.match(idPattern)
              if (!idMatch) continue

              // Replace x: and y: values within a reasonable range after the id match
              const idIndex = idMatch.index
              const blockSlice = content.slice(idIndex, idIndex + 200)

              const xMatch = blockSlice.match(/x:\s*\d+/)
              const yMatch = blockSlice.match(/y:\s*\d+/)

              if (xMatch) {
                const absoluteIndex = idIndex + xMatch.index
                content = content.slice(0, absoluteIndex) + `x: ${x}` + content.slice(absoluteIndex + xMatch[0].length)
              }

              if (yMatch) {
                // Re-find after x replacement may have shifted indices
                const updatedIdMatch = content.match(idPattern)
                const updatedIdIndex = updatedIdMatch.index
                const updatedSlice = content.slice(updatedIdIndex, updatedIdIndex + 200)
                const updatedYMatch = updatedSlice.match(/y:\s*\d+/)
                if (updatedYMatch) {
                  const absoluteIndex = updatedIdIndex + updatedYMatch.index
                  content = content.slice(0, absoluteIndex) + `y: ${y}` + content.slice(absoluteIndex + updatedYMatch[0].length)
                }
              }
            }

            fs.writeFileSync(filePath, content, 'utf-8')

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // POST /__admin/save-link-positions - update regionLinkPosition in questNodes.js
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/__admin/save-link-positions') {
          let body = ''
          for await (const chunk of req) body += chunk

          try {
            const { positions } = JSON.parse(body)
            if (!positions || typeof positions !== 'object') {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'positions required' }))
              return
            }

            const filePath = path.resolve(process.cwd(), 'src/data/questNodes.js')
            let content = fs.readFileSync(filePath, 'utf-8')

            for (const [nodeId, pos] of Object.entries(positions)) {
              const x = Math.round(pos.x)
              const y = Math.round(pos.y)
              const idPattern = new RegExp(`id:\\s*'${nodeId}'`)
              const idMatch = content.match(idPattern)
              if (!idMatch) continue

              const idIndex = idMatch.index
              const blockSlice = content.slice(idIndex, idIndex + 400)

              // Check if regionLinkPosition already exists
              const existingMatch = blockSlice.match(/regionLinkPosition:\s*\{[^}]*\}/)
              if (existingMatch) {
                const absIndex = idIndex + existingMatch.index
                content = content.slice(0, absIndex) +
                  `regionLinkPosition: { x: ${x}, y: ${y} }` +
                  content.slice(absIndex + existingMatch[0].length)
              } else {
                // Insert after the y: line
                const yLineMatch = blockSlice.match(/y:\s*\d+,?\s*\n/)
                if (yLineMatch) {
                  const insertIndex = idIndex + yLineMatch.index + yLineMatch[0].length
                  const indent = '    '
                  content = content.slice(0, insertIndex) +
                    `${indent}regionLinkPosition: { x: ${x}, y: ${y} },\n` +
                    content.slice(insertIndex)
                }
              }
            }

            fs.writeFileSync(filePath, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // POST /__admin/save-region-size - update width/height for a region in questNodes.js
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/__admin/save-region-size') {
          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          try {
            const { regionId, width, height } = JSON.parse(body)

            if (!regionId || !width || !height) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'regionId, width, and height are required' }))
              return
            }

            const filePath = path.resolve(process.cwd(), 'src/data/questNodes.js')
            let content = fs.readFileSync(filePath, 'utf-8')

            const idPattern = new RegExp(`id:\\s*'${regionId}'`)
            const idMatch = content.match(idPattern)
            if (!idMatch) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region ${regionId} not found` }))
              return
            }

            const idIndex = idMatch.index
            const blockSlice = content.slice(idIndex, idIndex + 200)

            const wMatch = blockSlice.match(/width:\s*\d+/)
            if (wMatch) {
              const absIdx = idIndex + wMatch.index
              content = content.slice(0, absIdx) + `width: ${Math.round(width)}` + content.slice(absIdx + wMatch[0].length)
            }

            // Re-find after width replacement
            const updatedMatch = content.match(idPattern)
            const updatedSlice = content.slice(updatedMatch.index, updatedMatch.index + 200)
            const hMatch = updatedSlice.match(/height:\s*\d+/)
            if (hMatch) {
              const absIdx = updatedMatch.index + hMatch.index
              content = content.slice(0, absIdx) + `height: ${Math.round(height)}` + content.slice(absIdx + hMatch[0].length)
            }

            fs.writeFileSync(filePath, content, 'utf-8')

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })
    }
  }
}
