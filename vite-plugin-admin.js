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
      // Helper: invalidate module cache so changes are picked up on refresh
      function invalidateQuestModules() {
        const moduleGraph = server.moduleGraph
        for (const [id, mod] of moduleGraph.idToModuleMap) {
          if (id.includes('/src/data/quests/')) {
            moduleGraph.invalidateModule(mod)
          }
        }
      }

      // Helper: find a quest region file by regionId
      function findQuestRegionFile(regionId) {
        const filePath = path.resolve(process.cwd(), `src/data/quests/${regionId}.js`)
        return fs.existsSync(filePath) ? filePath : null
      }

      // Helper: get all quest region files (excluding index.js and regions.js)
      function getQuestRegionFiles() {
        const questsDir = path.resolve(process.cwd(), 'src/data/quests')
        const files = fs.readdirSync(questsDir).filter(f =>
          f.endsWith('.js') && f !== 'index.js' && f !== 'regions.js'
        )
        return files.map(f => ({
          regionId: f.replace('.js', ''),
          filePath: path.join(questsDir, f)
        }))
      }

      // Helper: parse a quest region file into regionMeta, nodes, and importLines
      function parseQuestRegionFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')

        // Extract import lines
        const importLines = []
        const importRegex = /^import\s+.+$/gm
        let importMatch
        while ((importMatch = importRegex.exec(content)) !== null) {
          importLines.push(importMatch[0])
        }

        // Parse regionMeta export
        const regionMetaMatch = content.match(/export\s+const\s+regionMeta\s*=\s*\{/)
        if (!regionMetaMatch) {
          throw new Error(`Could not find regionMeta export in ${filePath}`)
        }

        let startIndex = content.indexOf('{', regionMetaMatch.index)
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

        let regionMetaStr = content.slice(startIndex, endIndex + 1)
        // Strip backgroundImage property since it references a bare import identifier
        regionMetaStr = regionMetaStr.replace(/\n\s*backgroundImage:\s*[a-zA-Z_$][a-zA-Z0-9_$]*,?\s*\n/g, '\n')

        let regionMeta
        try {
          regionMeta = new Function(`return ${regionMetaStr}`)()
        } catch (e) {
          throw new Error(`Failed to parse regionMeta in ${filePath}: ${e.message}`)
        }

        // Parse nodes export
        const nodesMatch = content.match(/export\s+const\s+nodes\s*=\s*\{/)
        if (!nodesMatch) {
          throw new Error(`Could not find nodes export in ${filePath}`)
        }

        startIndex = content.indexOf('{', nodesMatch.index)
        braceCount = 0
        endIndex = startIndex
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

        const nodesStr = content.slice(startIndex, endIndex + 1)
        let nodes
        try {
          nodes = new Function(`return ${nodesStr}`)()
        } catch (e) {
          throw new Error(`Failed to parse nodes in ${filePath}: ${e.message}`)
        }

        return { regionMeta, nodes, importLines }
      }

      // GET /__admin/quest-regions - fetch all quest region data
      server.middlewares.use((req, res, next) => {
        if (req.method === 'GET' && req.url === '/__admin/quest-regions') {
          try {
            const regionFiles = getQuestRegionFiles()
            const regions = regionFiles.map(({ regionId, filePath }) => {
              const { regionMeta, nodes, importLines } = parseQuestRegionFile(filePath)
              return { regionId, regionMeta, nodes, importLines }
            })

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(regions))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // POST /__admin/quest-regions - create a new region
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/__admin/quest-regions') {
          let body = ''
          for await (const chunk of req) body += chunk

          try {
            const data = JSON.parse(body)
            const { regionMeta } = data

            if (!regionMeta || !regionMeta.id) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'regionMeta with id is required' }))
              return
            }

            const regionId = regionMeta.id
            const filePath = path.resolve(process.cwd(), `src/data/quests/${regionId}.js`)

            if (fs.existsSync(filePath)) {
              res.statusCode = 409
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region file for "${regionId}" already exists` }))
              return
            }

            const { serializeRegionFile, addRegionToIndex, addRegionToRegions } = await import('./src/utils/questSerializer.js')

            // Create the region file
            const content = serializeRegionFile(regionMeta, {}, [])
            fs.writeFileSync(filePath, content, 'utf-8')

            // Update index.js
            const indexPath = path.resolve(process.cwd(), 'src/data/quests/index.js')
            const indexContent = fs.readFileSync(indexPath, 'utf-8')
            const updatedIndex = addRegionToIndex(indexContent, regionId, regionMeta.superRegion)
            fs.writeFileSync(indexPath, updatedIndex, 'utf-8')

            // Update regions.js
            const regionsPath = path.resolve(process.cwd(), 'src/data/quests/regions.js')
            const regionsContent = fs.readFileSync(regionsPath, 'utf-8')
            const updatedRegions = addRegionToRegions(regionsContent, regionId, regionMeta.superRegion)
            fs.writeFileSync(regionsPath, updatedRegions, 'utf-8')

            invalidateQuestModules()

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, regionId }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // PUT /__admin/quest-regions/:regionId - update region metadata
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/__admin\/quest-regions\/([^/]+)$/)
        if (req.method === 'PUT' && match) {
          const regionId = decodeURIComponent(match[1])

          let body = ''
          for await (const chunk of req) body += chunk

          try {
            const data = JSON.parse(body)
            const { regionMeta } = data

            const filePath = findQuestRegionFile(regionId)
            if (!filePath) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region "${regionId}" not found` }))
              return
            }

            const parsed = parseQuestRegionFile(filePath)

            const { serializeRegionFile } = await import('./src/utils/questSerializer.js')
            const content = serializeRegionFile(regionMeta, parsed.nodes, parsed.importLines)
            fs.writeFileSync(filePath, content, 'utf-8')

            invalidateQuestModules()

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

      // DELETE /__admin/quest-regions/:regionId - delete a region
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/__admin\/quest-regions\/([^/]+)$/)
        if (req.method === 'DELETE' && match) {
          const regionId = decodeURIComponent(match[1])

          try {
            const filePath = findQuestRegionFile(regionId)
            if (!filePath) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region "${regionId}" not found` }))
              return
            }

            const { removeRegionFromIndex, removeRegionFromRegions } = await import('./src/utils/questSerializer.js')

            // Update index.js
            const indexPath = path.resolve(process.cwd(), 'src/data/quests/index.js')
            const indexContent = fs.readFileSync(indexPath, 'utf-8')
            const updatedIndex = removeRegionFromIndex(indexContent, regionId)
            fs.writeFileSync(indexPath, updatedIndex, 'utf-8')

            // Update regions.js
            const regionsPath = path.resolve(process.cwd(), 'src/data/quests/regions.js')
            const regionsContent = fs.readFileSync(regionsPath, 'utf-8')
            const updatedRegions = removeRegionFromRegions(regionsContent, regionId)
            fs.writeFileSync(regionsPath, updatedRegions, 'utf-8')

            // Delete the region file
            fs.unlinkSync(filePath)

            invalidateQuestModules()

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

      // POST /__admin/quest-regions/:regionId/nodes - create a node
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/__admin\/quest-regions\/([^/]+)\/nodes$/)
        if (req.method === 'POST' && match) {
          const regionId = decodeURIComponent(match[1])

          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          try {
            const node = JSON.parse(body)
            if (!node.id) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Node must have an id field' }))
              return
            }

            const filePath = findQuestRegionFile(regionId)
            if (!filePath) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region "${regionId}" not found` }))
              return
            }

            const parsed = parseQuestRegionFile(filePath)

            if (parsed.nodes[node.id]) {
              res.statusCode = 409
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Node with id "${node.id}" already exists` }))
              return
            }

            parsed.nodes[node.id] = node

            const { serializeRegionFile } = await import('./src/utils/questSerializer.js')
            const content = serializeRegionFile(parsed.regionMeta, parsed.nodes, parsed.importLines)
            fs.writeFileSync(filePath, content, 'utf-8')

            invalidateQuestModules()

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(node))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // PUT /__admin/quest-regions/:regionId/nodes/:nodeId - update a node
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/__admin\/quest-regions\/([^/]+)\/nodes\/([^/]+)$/)
        if (req.method === 'PUT' && match) {
          const regionId = decodeURIComponent(match[1])
          const nodeId = decodeURIComponent(match[2])

          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          try {
            const node = JSON.parse(body)

            const filePath = findQuestRegionFile(regionId)
            if (!filePath) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region "${regionId}" not found` }))
              return
            }

            const parsed = parseQuestRegionFile(filePath)

            if (!parsed.nodes[nodeId]) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Node "${nodeId}" not found in region "${regionId}"` }))
              return
            }

            // Handle ID change: if the node's id changed, remove the old key
            if (node.id !== nodeId) {
              delete parsed.nodes[nodeId]
            }
            parsed.nodes[node.id] = node

            const { serializeRegionFile } = await import('./src/utils/questSerializer.js')
            const content = serializeRegionFile(parsed.regionMeta, parsed.nodes, parsed.importLines)
            fs.writeFileSync(filePath, content, 'utf-8')

            invalidateQuestModules()

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(node))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // DELETE /__admin/quest-regions/:regionId/nodes/:nodeId - delete a node
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/__admin\/quest-regions\/([^/]+)\/nodes\/([^/]+)$/)
        if (req.method === 'DELETE' && match) {
          const regionId = decodeURIComponent(match[1])
          const nodeId = decodeURIComponent(match[2])

          try {
            const filePath = findQuestRegionFile(regionId)
            if (!filePath) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region "${regionId}" not found` }))
              return
            }

            const parsed = parseQuestRegionFile(filePath)

            if (!parsed.nodes[nodeId]) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Node "${nodeId}" not found in region "${regionId}"` }))
              return
            }

            delete parsed.nodes[nodeId]

            const { serializeRegionFile } = await import('./src/utils/questSerializer.js')
            const content = serializeRegionFile(parsed.regionMeta, parsed.nodes, parsed.importLines)
            fs.writeFileSync(filePath, content, 'utf-8')

            invalidateQuestModules()

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

      // Helper: find hero file by heroId across rarity folders
      function findHeroFile(heroId) {
        const heroesDir = path.resolve(process.cwd(), 'src/data/heroes')
        const rarityFolders = ['1star', '2star', '3star', '4star', '5star']

        for (const folder of rarityFolders) {
          const filePath = path.join(heroesDir, folder, `${heroId}.js`)
          if (fs.existsSync(filePath)) {
            return filePath
          }
        }
        return null
      }

      // Helper: invalidate hero module cache so changes are picked up on refresh
      function invalidateHeroModules() {
        const moduleGraph = server.moduleGraph
        for (const [id, mod] of moduleGraph.idToModuleMap) {
          if (id.includes('/src/data/heroes/')) {
            moduleGraph.invalidateModule(mod)
          }
        }
      }

      // GET /__admin/hero/:heroId - read a specific hero file
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/__admin\/hero\/([^/]+)$/)
        if (req.method === 'GET' && match) {
          const heroId = decodeURIComponent(match[1])

          try {
            const filePath = findHeroFile(heroId)
            if (!filePath) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Hero file for "${heroId}" not found` }))
              return
            }

            const content = fs.readFileSync(filePath, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ path: filePath, content }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // PUT /__admin/hero/:heroId - write to a specific hero file
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/__admin\/hero\/([^/]+)$/)
        if (req.method === 'PUT' && match) {
          const heroId = decodeURIComponent(match[1])

          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          try {
            const { content } = JSON.parse(body)

            if (!content || typeof content !== 'string') {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'content is required and must be a string' }))
              return
            }

            const filePath = findHeroFile(heroId)
            if (!filePath) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Hero file for "${heroId}" not found` }))
              return
            }

            fs.writeFileSync(filePath, content, 'utf-8')

            // Invalidate module cache so refresh picks up changes
            invalidateHeroModules()

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

      // Helper: find which quest file contains a node by ID
      function findQuestFileForNode(nodeId) {
        const questsDir = path.resolve(process.cwd(), 'src/data/quests')
        const files = fs.readdirSync(questsDir).filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'regions.js')

        for (const file of files) {
          const filePath = path.join(questsDir, file)
          const content = fs.readFileSync(filePath, 'utf-8')
          const idPattern = new RegExp(`id:\\s*'${nodeId}'`)
          if (idPattern.test(content)) {
            return filePath
          }
        }
        return null
      }

      // POST /__admin/save-node-positions - update x/y in quest region files
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

            // Group positions by file
            const fileUpdates = {}
            for (const [nodeId, pos] of Object.entries(positions)) {
              const filePath = findQuestFileForNode(nodeId)
              if (!filePath) continue
              if (!fileUpdates[filePath]) fileUpdates[filePath] = []
              fileUpdates[filePath].push({ nodeId, x: Math.round(pos.x), y: Math.round(pos.y) })
            }

            // Update each file
            for (const [filePath, updates] of Object.entries(fileUpdates)) {
              let content = fs.readFileSync(filePath, 'utf-8')

              for (const { nodeId, x, y } of updates) {
                const idPattern = new RegExp(`id:\\s*'${nodeId}'`)
                const idMatch = content.match(idPattern)
                if (!idMatch) continue

                const idIndex = idMatch.index
                const blockSlice = content.slice(idIndex, idIndex + 200)

                const xMatch = blockSlice.match(/x:\s*\d+/)
                if (xMatch) {
                  const absoluteIndex = idIndex + xMatch.index
                  content = content.slice(0, absoluteIndex) + `x: ${x}` + content.slice(absoluteIndex + xMatch[0].length)
                }

                // Re-find after x replacement may have shifted indices
                const updatedIdMatch = content.match(idPattern)
                const updatedIdIndex = updatedIdMatch.index
                const updatedSlice = content.slice(updatedIdIndex, updatedIdIndex + 200)
                const yMatch = updatedSlice.match(/y:\s*\d+/)
                if (yMatch) {
                  const absoluteIndex = updatedIdIndex + yMatch.index
                  content = content.slice(0, absoluteIndex) + `y: ${y}` + content.slice(absoluteIndex + yMatch[0].length)
                }
              }

              fs.writeFileSync(filePath, content, 'utf-8')
            }

            // Invalidate module cache so refresh picks up changes
            invalidateQuestModules()

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, updatedFiles: Object.keys(fileUpdates).length }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })

      // POST /__admin/save-link-positions - update regionLinkPosition in quest region files
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

            // Group positions by file
            const fileUpdates = {}
            for (const [nodeId, pos] of Object.entries(positions)) {
              const filePath = findQuestFileForNode(nodeId)
              if (!filePath) continue
              if (!fileUpdates[filePath]) fileUpdates[filePath] = []
              fileUpdates[filePath].push({ nodeId, x: Math.round(pos.x), y: Math.round(pos.y) })
            }

            // Update each file
            for (const [filePath, updates] of Object.entries(fileUpdates)) {
              let content = fs.readFileSync(filePath, 'utf-8')

              for (const { nodeId, x, y } of updates) {
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
            }

            // Invalidate module cache so refresh picks up changes
            invalidateQuestModules()

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

      // POST /__admin/save-region-size - update width/height for a region in its quest file
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

            // Region ID maps directly to filename (e.g., 'coral_depths' -> 'coral_depths.js')
            const filePath = path.resolve(process.cwd(), `src/data/quests/${regionId}.js`)

            if (!fs.existsSync(filePath)) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Region file for ${regionId} not found` }))
              return
            }

            let content = fs.readFileSync(filePath, 'utf-8')

            // Update width in regionMeta
            const wMatch = content.match(/width:\s*\d+/)
            if (wMatch) {
              content = content.slice(0, wMatch.index) + `width: ${Math.round(width)}` + content.slice(wMatch.index + wMatch[0].length)
            }

            // Update height in regionMeta
            const hMatch = content.match(/height:\s*\d+/)
            if (hMatch) {
              content = content.slice(0, hMatch.index) + `height: ${Math.round(height)}` + content.slice(hMatch.index + hMatch[0].length)
            }

            fs.writeFileSync(filePath, content, 'utf-8')

            // Invalidate module cache so refresh picks up changes
            invalidateQuestModules()

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
