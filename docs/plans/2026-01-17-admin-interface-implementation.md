# Admin Interface Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a content management interface for editing game data files without touching code.

**Architecture:** Vite dev server plugin exposes REST API for reading/writing JS data files. Vue admin screens provide form-based and JSON editing UI. Route only exists in dev mode.

**Tech Stack:** Vue 3, Vite plugin API, Pinia (for admin state), existing data file patterns

---

## Task 1: Vite Plugin - File Reading API

**Files:**
- Create: `vite-plugin-admin.js`
- Modify: `vite.config.js`

**Step 1: Create the plugin skeleton**

Create `vite-plugin-admin.js`:

```js
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
```

**Step 2: Register the plugin**

Modify `vite.config.js`:

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import adminPlugin from './vite-plugin-admin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), adminPlugin()],
})
```

**Step 3: Test the API manually**

Run: `npm run dev`

Then in browser or curl: `http://localhost:5173/api/admin/items`

Expected: JSON object with item data

**Step 4: Commit**

```bash
git add vite-plugin-admin.js vite.config.js
git commit -m "feat(admin): add Vite plugin with data file reading API"
```

---

## Task 2: Vite Plugin - File Writing API

**Files:**
- Modify: `vite-plugin-admin.js`

**Step 1: Add helper to serialize data back to JS**

Add to `vite-plugin-admin.js` before `export default`:

```js
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
```

**Step 2: Add POST endpoint for creating entries**

Add inside `configureServer`, after the GET handler:

```js
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
```

**Step 3: Add PUT endpoint for updating entries**

Add after POST handler:

```js
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
```

**Step 4: Add DELETE endpoint**

Add after PUT handler:

```js
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
```

**Step 5: Test CRUD operations manually**

Test with curl:
```bash
# Create
curl -X POST http://localhost:5173/api/admin/items \
  -H "Content-Type: application/json" \
  -d '{"id":"test_item","name":"Test Item","type":"junk","rarity":1,"sellReward":{"gold":1}}'

# Update
curl -X PUT http://localhost:5173/api/admin/items/test_item \
  -H "Content-Type: application/json" \
  -d '{"id":"test_item","name":"Updated Test Item","type":"junk","rarity":2,"sellReward":{"gold":10}}'

# Delete
curl -X DELETE http://localhost:5173/api/admin/items/test_item
```

**Step 6: Commit**

```bash
git add vite-plugin-admin.js
git commit -m "feat(admin): add create, update, delete API endpoints"
```

---

## Task 3: Admin Screen Shell with Sidebar

**Files:**
- Create: `src/screens/AdminScreen.vue`
- Modify: `src/App.vue`

**Step 1: Create AdminScreen with sidebar layout**

Create `src/screens/AdminScreen.vue`:

```vue
<script setup>
import { ref } from 'vue'

const activeSection = ref('heroes')

const sections = [
  { id: 'heroes', label: 'Heroes' },
  { id: 'enemies', label: 'Enemies' },
  { id: 'classes', label: 'Classes' },
  { id: 'statusEffects', label: 'Status Effects' },
  { id: 'questNodes', label: 'Quest Nodes' },
  { id: 'items', label: 'Items' }
]

const emit = defineEmits(['navigate'])

function exitAdmin() {
  emit('navigate', 'home')
}
</script>

<template>
  <div class="admin-screen">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Admin</h2>
        <button class="exit-btn" @click="exitAdmin">Exit</button>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="section in sections"
          :key="section.id"
          :class="['nav-item', { active: activeSection === section.id }]"
          @click="activeSection = section.id"
        >
          {{ section.label }}
        </button>
      </nav>
    </aside>

    <main class="content">
      <div class="content-header">
        <h1>{{ sections.find(s => s.id === activeSection)?.label }}</h1>
      </div>

      <div class="content-body">
        <p class="placeholder">{{ activeSection }} admin coming soon...</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-screen {
  display: flex;
  min-height: 100vh;
  background: #111827;
}

.sidebar {
  width: 200px;
  background: #1f2937;
  border-right: 1px solid #374151;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: #f3f4f6;
}

.exit-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
}

.exit-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
}

.nav-item {
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #9ca3af;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}

.nav-item:hover {
  background: #374151;
  color: #f3f4f6;
}

.nav-item.active {
  background: #3b82f6;
  color: white;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: none;
}

.content-header {
  padding: 16px 24px;
  border-bottom: 1px solid #374151;
}

.content-header h1 {
  margin: 0;
  font-size: 24px;
  color: #f3f4f6;
}

.content-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.placeholder {
  color: #6b7280;
}
</style>
```

**Step 2: Add admin route to App.vue (dev only)**

Modify `src/App.vue`:

Add import at top of script:
```js
import AdminScreen from './screens/AdminScreen.vue'
```

Add after MergeScreen in template (before closing `</template>`):
```vue
      <AdminScreen
        v-else-if="currentScreen === 'admin'"
        @navigate="navigate"
      />
```

Add keyboard shortcut to open admin (add inside `onMounted`):
```js
  // Dev-only: Ctrl+Shift+A opens admin
  if (import.meta.env.DEV) {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        currentScreen.value = 'admin'
      }
    })
  }
```

**Step 3: Test the admin screen**

Run: `npm run dev`

Press Ctrl+Shift+A to open admin screen. Verify sidebar navigation works.

**Step 4: Commit**

```bash
git add src/screens/AdminScreen.vue src/App.vue
git commit -m "feat(admin): add admin screen shell with sidebar navigation"
```

---

## Task 4: Admin API Composable

**Files:**
- Create: `src/composables/useAdminApi.js`

**Step 1: Create the composable**

Create `src/composables/useAdminApi.js`:

```js
import { ref } from 'vue'

export function useAdminApi(contentType) {
  const data = ref({})
  const loading = ref(false)
  const error = ref(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`/api/admin/${contentType}`)
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch')
      }
      data.value = await response.json()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createEntry(entry) {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`/api/admin/${contentType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to create')
      }
      const created = await response.json()
      data.value[created.id] = created
      return created
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateEntry(id, entry) {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`/api/admin/${contentType}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update')
      }
      const updated = await response.json()
      // Handle ID change
      if (id !== updated.id) {
        delete data.value[id]
      }
      data.value[updated.id] = updated
      return updated
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteEntry(id) {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`/api/admin/${contentType}/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to delete')
      }
      delete data.value[id]
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    fetchAll,
    createEntry,
    updateEntry,
    deleteEntry
  }
}
```

**Step 2: Commit**

```bash
git add src/composables/useAdminApi.js
git commit -m "feat(admin): add useAdminApi composable for CRUD operations"
```

---

## Task 5: Items Admin Screen (First Content Type)

**Files:**
- Create: `src/screens/admin/ItemsAdmin.vue`
- Modify: `src/screens/AdminScreen.vue`

**Step 1: Create ItemsAdmin component**

Create directory and file `src/screens/admin/ItemsAdmin.vue`:

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi.js'

const { data, loading, error, fetchAll, createEntry, updateEntry, deleteEntry } = useAdminApi('items')

const selectedId = ref(null)
const editMode = ref(false) // false = view/JSON, true = form
const jsonError = ref(null)
const jsonText = ref('')

const itemsList = computed(() => {
  return Object.values(data.value).sort((a, b) => {
    // Sort by rarity desc, then name asc
    if (a.rarity !== b.rarity) return b.rarity - a.rarity
    return a.name.localeCompare(b.name)
  })
})

const selectedItem = computed(() => {
  return selectedId.value ? data.value[selectedId.value] : null
})

onMounted(() => {
  fetchAll()
})

function selectItem(id) {
  selectedId.value = id
  jsonError.value = null
  if (data.value[id]) {
    jsonText.value = JSON.stringify(data.value[id], null, 2)
  }
}

function newItem() {
  const template = {
    id: 'new_item',
    name: 'New Item',
    description: 'Description here',
    type: 'junk',
    rarity: 1,
    sellReward: { gold: 10 }
  }
  jsonText.value = JSON.stringify(template, null, 2)
  selectedId.value = null
  jsonError.value = null
}

async function saveItem() {
  jsonError.value = null
  try {
    const parsed = JSON.parse(jsonText.value)
    if (!parsed.id) {
      jsonError.value = 'Item must have an id field'
      return
    }

    if (selectedId.value) {
      await updateEntry(selectedId.value, parsed)
      selectedId.value = parsed.id
    } else {
      await createEntry(parsed)
      selectedId.value = parsed.id
    }
    jsonText.value = JSON.stringify(data.value[parsed.id], null, 2)
  } catch (e) {
    jsonError.value = e.message
  }
}

async function deleteItem() {
  if (!selectedId.value) return
  if (!confirm(`Delete "${selectedItem.value?.name}"?`)) return

  await deleteEntry(selectedId.value)
  selectedId.value = null
  jsonText.value = ''
}

function cancelEdit() {
  if (selectedId.value && data.value[selectedId.value]) {
    jsonText.value = JSON.stringify(data.value[selectedId.value], null, 2)
  } else {
    jsonText.value = ''
    selectedId.value = null
  }
  jsonError.value = null
}

const rarityColors = {
  1: '#9ca3af',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f59e0b'
}
</script>

<template>
  <div class="items-admin">
    <div class="list-panel">
      <div class="list-header">
        <input type="text" placeholder="Search..." class="search-input" />
        <button class="new-btn" @click="newItem">+ New</button>
      </div>

      <div class="list-body">
        <div v-if="loading && !itemsList.length" class="loading">Loading...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div
          v-for="item in itemsList"
          :key="item.id"
          :class="['list-item', { selected: selectedId === item.id }]"
          @click="selectItem(item.id)"
        >
          <span class="item-name">{{ item.name }}</span>
          <span class="item-meta">
            <span class="rarity-dot" :style="{ background: rarityColors[item.rarity] }"></span>
            {{ item.type }}
          </span>
        </div>
      </div>
    </div>

    <div class="edit-panel">
      <div v-if="selectedId || jsonText" class="edit-content">
        <div class="edit-header">
          <h3>{{ selectedId ? 'Edit Item' : 'New Item' }}</h3>
          <div class="edit-actions">
            <button class="btn btn-secondary" @click="cancelEdit">Cancel</button>
            <button v-if="selectedId" class="btn btn-danger" @click="deleteItem">Delete</button>
            <button class="btn btn-primary" @click="saveItem">Save</button>
          </div>
        </div>

        <div v-if="jsonError" class="json-error">{{ jsonError }}</div>

        <textarea
          v-model="jsonText"
          class="json-editor"
          spellcheck="false"
        ></textarea>
      </div>

      <div v-else class="empty-state">
        <p>Select an item to edit, or click "+ New" to create one.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.items-admin {
  display: flex;
  gap: 24px;
  height: calc(100vh - 120px);
}

.list-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  padding: 12px;
  border-bottom: 1px solid #374151;
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 14px;
}

.search-input::placeholder {
  color: #6b7280;
}

.new-btn {
  padding: 8px 12px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.new-btn:hover {
  background: #2563eb;
}

.list-body {
  flex: 1;
  overflow-y: auto;
}

.list-item {
  padding: 12px;
  border-bottom: 1px solid #374151;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-item:hover {
  background: #374151;
}

.list-item.selected {
  background: #3b82f6;
}

.item-name {
  color: #f3f4f6;
  font-size: 14px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 12px;
}

.rarity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.edit-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.edit-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.edit-header {
  padding: 12px 16px;
  border-bottom: 1px solid #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-header h3 {
  margin: 0;
  font-size: 16px;
  color: #f3f4f6;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #374151;
  color: #9ca3af;
}

.btn-secondary:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.json-error {
  padding: 8px 16px;
  background: #7f1d1d;
  color: #fca5a5;
  font-size: 14px;
}

.json-editor {
  flex: 1;
  padding: 16px;
  background: #111827;
  border: none;
  color: #f3f4f6;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
}

.json-editor:focus {
  outline: none;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}

.loading, .error {
  padding: 16px;
  text-align: center;
  color: #6b7280;
}

.error {
  color: #fca5a5;
}
</style>
```

**Step 2: Wire up ItemsAdmin in AdminScreen**

Modify `src/screens/AdminScreen.vue`:

Add import:
```js
import ItemsAdmin from './admin/ItemsAdmin.vue'
```

Replace the placeholder in content-body:
```vue
      <div class="content-body">
        <ItemsAdmin v-if="activeSection === 'items'" />
        <p v-else class="placeholder">{{ activeSection }} admin coming soon...</p>
      </div>
```

**Step 3: Test Items admin**

Run: `npm run dev`

Press Ctrl+Shift+A, click "Items" in sidebar. Verify:
- Items list loads
- Clicking item shows JSON
- Creating new item works
- Editing and saving works
- Deleting works

**Step 4: Commit**

```bash
mkdir -p src/screens/admin
git add src/screens/admin/ItemsAdmin.vue src/screens/AdminScreen.vue
git commit -m "feat(admin): add Items admin screen with JSON editing"
```

---

## Task 6: Classes Admin Screen

**Files:**
- Create: `src/screens/admin/ClassesAdmin.vue`
- Modify: `src/screens/AdminScreen.vue`

**Step 1: Create ClassesAdmin component**

Create `src/screens/admin/ClassesAdmin.vue`:

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi.js'

const { data, loading, error, fetchAll, createEntry, updateEntry, deleteEntry } = useAdminApi('classes')

const selectedId = ref(null)
const jsonError = ref(null)
const jsonText = ref('')

const classesList = computed(() => {
  return Object.values(data.value).sort((a, b) => a.title.localeCompare(b.title))
})

const selectedClass = computed(() => {
  return selectedId.value ? data.value[selectedId.value] : null
})

const roleIcons = {
  tank: '🛡️',
  dps: '⚔️',
  healer: '💚',
  support: '✨'
}

onMounted(() => {
  fetchAll()
})

function selectClass(id) {
  selectedId.value = id
  jsonError.value = null
  if (data.value[id]) {
    jsonText.value = JSON.stringify(data.value[id], null, 2)
  }
}

function newClass() {
  const template = {
    id: 'new_class',
    title: 'New Class',
    role: 'dps',
    resourceName: 'Energy'
  }
  jsonText.value = JSON.stringify(template, null, 2)
  selectedId.value = null
  jsonError.value = null
}

async function saveClass() {
  jsonError.value = null
  try {
    const parsed = JSON.parse(jsonText.value)
    if (!parsed.id) {
      jsonError.value = 'Class must have an id field'
      return
    }

    if (selectedId.value) {
      await updateEntry(selectedId.value, parsed)
      selectedId.value = parsed.id
    } else {
      await createEntry(parsed)
      selectedId.value = parsed.id
    }
    jsonText.value = JSON.stringify(data.value[parsed.id], null, 2)
  } catch (e) {
    jsonError.value = e.message
  }
}

async function deleteClass() {
  if (!selectedId.value) return
  if (!confirm(`Delete "${selectedClass.value?.title}"?`)) return

  await deleteEntry(selectedId.value)
  selectedId.value = null
  jsonText.value = ''
}

function cancelEdit() {
  if (selectedId.value && data.value[selectedId.value]) {
    jsonText.value = JSON.stringify(data.value[selectedId.value], null, 2)
  } else {
    jsonText.value = ''
    selectedId.value = null
  }
  jsonError.value = null
}
</script>

<template>
  <div class="classes-admin">
    <div class="list-panel">
      <div class="list-header">
        <input type="text" placeholder="Search..." class="search-input" />
        <button class="new-btn" @click="newClass">+ New</button>
      </div>

      <div class="list-body">
        <div v-if="loading && !classesList.length" class="loading">Loading...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div
          v-for="cls in classesList"
          :key="cls.id"
          :class="['list-item', { selected: selectedId === cls.id }]"
          @click="selectClass(cls.id)"
        >
          <span class="item-name">{{ cls.title }}</span>
          <span class="item-meta">
            <span class="role-icon">{{ roleIcons[cls.role] || '?' }}</span>
            {{ cls.role }}
          </span>
        </div>
      </div>
    </div>

    <div class="edit-panel">
      <div v-if="selectedId || jsonText" class="edit-content">
        <div class="edit-header">
          <h3>{{ selectedId ? 'Edit Class' : 'New Class' }}</h3>
          <div class="edit-actions">
            <button class="btn btn-secondary" @click="cancelEdit">Cancel</button>
            <button v-if="selectedId" class="btn btn-danger" @click="deleteClass">Delete</button>
            <button class="btn btn-primary" @click="saveClass">Save</button>
          </div>
        </div>

        <div v-if="jsonError" class="json-error">{{ jsonError }}</div>

        <textarea
          v-model="jsonText"
          class="json-editor"
          spellcheck="false"
        ></textarea>
      </div>

      <div v-else class="empty-state">
        <p>Select a class to edit, or click "+ New" to create one.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.classes-admin {
  display: flex;
  gap: 24px;
  height: calc(100vh - 120px);
}

.list-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  padding: 12px;
  border-bottom: 1px solid #374151;
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 14px;
}

.search-input::placeholder {
  color: #6b7280;
}

.new-btn {
  padding: 8px 12px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.new-btn:hover {
  background: #2563eb;
}

.list-body {
  flex: 1;
  overflow-y: auto;
}

.list-item {
  padding: 12px;
  border-bottom: 1px solid #374151;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-item:hover {
  background: #374151;
}

.list-item.selected {
  background: #3b82f6;
}

.item-name {
  color: #f3f4f6;
  font-size: 14px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 12px;
}

.role-icon {
  font-size: 14px;
}

.edit-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.edit-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.edit-header {
  padding: 12px 16px;
  border-bottom: 1px solid #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-header h3 {
  margin: 0;
  font-size: 16px;
  color: #f3f4f6;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #374151;
  color: #9ca3af;
}

.btn-secondary:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.json-error {
  padding: 8px 16px;
  background: #7f1d1d;
  color: #fca5a5;
  font-size: 14px;
}

.json-editor {
  flex: 1;
  padding: 16px;
  background: #111827;
  border: none;
  color: #f3f4f6;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
}

.json-editor:focus {
  outline: none;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}

.loading, .error {
  padding: 16px;
  text-align: center;
  color: #6b7280;
}

.error {
  color: #fca5a5;
}
</style>
```

**Step 2: Add ClassesAdmin to AdminScreen**

Modify `src/screens/AdminScreen.vue`:

Add import:
```js
import ClassesAdmin from './admin/ClassesAdmin.vue'
```

Update content-body:
```vue
      <div class="content-body">
        <ItemsAdmin v-if="activeSection === 'items'" />
        <ClassesAdmin v-else-if="activeSection === 'classes'" />
        <p v-else class="placeholder">{{ activeSection }} admin coming soon...</p>
      </div>
```

**Step 3: Commit**

```bash
git add src/screens/admin/ClassesAdmin.vue src/screens/AdminScreen.vue
git commit -m "feat(admin): add Classes admin screen"
```

---

## Task 7: Reusable Admin List Component

**Files:**
- Create: `src/components/admin/AdminListPanel.vue`

**Step 1: Extract common list panel pattern**

Create `src/components/admin/AdminListPanel.vue`:

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  selectedId: { type: String, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  labelKey: { type: String, default: 'name' },
  searchPlaceholder: { type: String, default: 'Search...' }
})

const emit = defineEmits(['select', 'new', 'search'])

const searchText = defineModel('search', { type: String, default: '' })

const filteredItems = computed(() => {
  if (!searchText.value) return props.items
  const search = searchText.value.toLowerCase()
  return props.items.filter(item => {
    const label = item[props.labelKey] || item.id
    return label.toLowerCase().includes(search) || item.id.toLowerCase().includes(search)
  })
})
</script>

<template>
  <div class="list-panel">
    <div class="list-header">
      <input
        v-model="searchText"
        type="text"
        :placeholder="searchPlaceholder"
        class="search-input"
      />
      <button class="new-btn" @click="emit('new')">+ New</button>
    </div>

    <div class="list-body">
      <div v-if="loading && !items.length" class="loading">Loading...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div
        v-for="item in filteredItems"
        :key="item.id"
        :class="['list-item', { selected: selectedId === item.id }]"
        @click="emit('select', item.id)"
      >
        <slot name="item" :item="item">
          <span class="item-label">{{ item[labelKey] || item.id }}</span>
        </slot>
      </div>
      <div v-if="!loading && !filteredItems.length" class="empty">
        No items found
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  padding: 12px;
  border-bottom: 1px solid #374151;
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 14px;
}

.search-input::placeholder {
  color: #6b7280;
}

.new-btn {
  padding: 8px 12px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.new-btn:hover {
  background: #2563eb;
}

.list-body {
  flex: 1;
  overflow-y: auto;
}

.list-item {
  padding: 12px;
  border-bottom: 1px solid #374151;
  cursor: pointer;
}

.list-item:hover {
  background: #374151;
}

.list-item.selected {
  background: #3b82f6;
}

.item-label {
  color: #f3f4f6;
  font-size: 14px;
}

.loading, .error, .empty {
  padding: 16px;
  text-align: center;
  color: #6b7280;
}

.error {
  color: #fca5a5;
}
</style>
```

**Step 2: Commit**

```bash
mkdir -p src/components/admin
git add src/components/admin/AdminListPanel.vue
git commit -m "feat(admin): add reusable AdminListPanel component"
```

---

## Task 8: Reusable JSON Editor Panel Component

**Files:**
- Create: `src/components/admin/AdminEditPanel.vue`

**Step 1: Create the edit panel component**

Create `src/components/admin/AdminEditPanel.vue`:

```vue
<script setup>
const props = defineProps({
  title: { type: String, default: 'Edit' },
  isNew: { type: Boolean, default: false },
  error: { type: String, default: null },
  emptyMessage: { type: String, default: 'Select an item to edit, or click "+ New" to create one.' }
})

const emit = defineEmits(['save', 'delete', 'cancel'])

const jsonText = defineModel('json', { type: String, default: '' })
const hasContent = defineModel('hasContent', { type: Boolean, default: false })
</script>

<template>
  <div class="edit-panel">
    <div v-if="hasContent" class="edit-content">
      <div class="edit-header">
        <h3>{{ isNew ? `New ${title}` : `Edit ${title}` }}</h3>
        <div class="edit-actions">
          <button class="btn btn-secondary" @click="emit('cancel')">Cancel</button>
          <button v-if="!isNew" class="btn btn-danger" @click="emit('delete')">Delete</button>
          <button class="btn btn-primary" @click="emit('save')">Save</button>
        </div>
      </div>

      <div v-if="error" class="json-error">{{ error }}</div>

      <slot name="form">
        <textarea
          v-model="jsonText"
          class="json-editor"
          spellcheck="false"
        ></textarea>
      </slot>
    </div>

    <div v-else class="empty-state">
      <p>{{ emptyMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.edit-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.edit-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.edit-header {
  padding: 12px 16px;
  border-bottom: 1px solid #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-header h3 {
  margin: 0;
  font-size: 16px;
  color: #f3f4f6;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #374151;
  color: #9ca3af;
}

.btn-secondary:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.json-error {
  padding: 8px 16px;
  background: #7f1d1d;
  color: #fca5a5;
  font-size: 14px;
}

.json-editor {
  flex: 1;
  padding: 16px;
  background: #111827;
  border: none;
  color: #f3f4f6;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
}

.json-editor:focus {
  outline: none;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/admin/AdminEditPanel.vue
git commit -m "feat(admin): add reusable AdminEditPanel component"
```

---

## Task 9: Status Effects Admin Screen

**Files:**
- Create: `src/screens/admin/StatusEffectsAdmin.vue`
- Modify: `src/screens/AdminScreen.vue`

**Step 1: Create StatusEffectsAdmin component**

Create `src/screens/admin/StatusEffectsAdmin.vue`:

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi.js'
import AdminListPanel from '../../components/admin/AdminListPanel.vue'
import AdminEditPanel from '../../components/admin/AdminEditPanel.vue'

const { data, loading, error, fetchAll, createEntry, updateEntry, deleteEntry } = useAdminApi('statusEffects')

const selectedId = ref(null)
const jsonError = ref(null)
const jsonText = ref('')
const searchText = ref('')

const effectsList = computed(() => {
  return Object.values(data.value).sort((a, b) => (a.name || a.id || '').localeCompare(b.name || b.id || ''))
})

const hasContent = computed(() => selectedId.value !== null || jsonText.value !== '')
const isNew = computed(() => selectedId.value === null && jsonText.value !== '')

onMounted(() => {
  fetchAll()
})

function selectEffect(id) {
  selectedId.value = id
  jsonError.value = null
  if (data.value[id]) {
    jsonText.value = JSON.stringify(data.value[id], null, 2)
  }
}

function newEffect() {
  const template = {
    name: 'New Effect',
    icon: '✨',
    color: '#ffffff',
    isBuff: true,
    stackable: false
  }
  jsonText.value = JSON.stringify(template, null, 2)
  selectedId.value = null
  jsonError.value = null
}

async function saveEffect() {
  jsonError.value = null
  try {
    const parsed = JSON.parse(jsonText.value)

    // For status effects, the key is different - we need an ID
    // Generate from name if not present
    if (!parsed.id) {
      parsed.id = (parsed.name || 'effect').toLowerCase().replace(/\s+/g, '_')
    }

    if (selectedId.value) {
      await updateEntry(selectedId.value, parsed)
      selectedId.value = parsed.id
    } else {
      await createEntry(parsed)
      selectedId.value = parsed.id
    }
    jsonText.value = JSON.stringify(data.value[parsed.id], null, 2)
  } catch (e) {
    jsonError.value = e.message
  }
}

async function deleteEffect() {
  if (!selectedId.value) return
  const effect = data.value[selectedId.value]
  if (!confirm(`Delete "${effect?.name || selectedId.value}"?`)) return

  await deleteEntry(selectedId.value)
  selectedId.value = null
  jsonText.value = ''
}

function cancelEdit() {
  if (selectedId.value && data.value[selectedId.value]) {
    jsonText.value = JSON.stringify(data.value[selectedId.value], null, 2)
  } else {
    jsonText.value = ''
    selectedId.value = null
  }
  jsonError.value = null
}
</script>

<template>
  <div class="effects-admin">
    <AdminListPanel
      :items="effectsList"
      :selected-id="selectedId"
      :loading="loading"
      :error="error"
      label-key="name"
      v-model:search="searchText"
      @select="selectEffect"
      @new="newEffect"
    >
      <template #item="{ item }">
        <span class="item-row">
          <span class="effect-icon">{{ item.icon || '?' }}</span>
          <span class="effect-name">{{ item.name || item.id }}</span>
          <span :class="['buff-badge', item.isBuff ? 'buff' : 'debuff']">
            {{ item.isBuff ? 'Buff' : 'Debuff' }}
          </span>
        </span>
      </template>
    </AdminListPanel>

    <AdminEditPanel
      title="Status Effect"
      :is-new="isNew"
      :error="jsonError"
      v-model:json="jsonText"
      v-model:has-content="hasContent"
      @save="saveEffect"
      @delete="deleteEffect"
      @cancel="cancelEdit"
    />
  </div>
</template>

<style scoped>
.effects-admin {
  display: flex;
  gap: 24px;
  height: calc(100vh - 120px);
}

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.effect-icon {
  font-size: 16px;
}

.effect-name {
  flex: 1;
  color: #f3f4f6;
  font-size: 14px;
}

.buff-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.buff-badge.buff {
  background: #166534;
  color: #86efac;
}

.buff-badge.debuff {
  background: #7f1d1d;
  color: #fca5a5;
}
</style>
```

**Step 2: Add to AdminScreen**

Add import:
```js
import StatusEffectsAdmin from './admin/StatusEffectsAdmin.vue'
```

Update content-body:
```vue
      <div class="content-body">
        <ItemsAdmin v-if="activeSection === 'items'" />
        <ClassesAdmin v-else-if="activeSection === 'classes'" />
        <StatusEffectsAdmin v-else-if="activeSection === 'statusEffects'" />
        <p v-else class="placeholder">{{ activeSection }} admin coming soon...</p>
      </div>
```

**Step 3: Commit**

```bash
git add src/screens/admin/StatusEffectsAdmin.vue src/screens/AdminScreen.vue
git commit -m "feat(admin): add Status Effects admin screen"
```

---

## Task 10: Enemies Admin Screen

**Files:**
- Create: `src/screens/admin/EnemiesAdmin.vue`
- Modify: `src/screens/AdminScreen.vue`

**Step 1: Create EnemiesAdmin component**

Create `src/screens/admin/EnemiesAdmin.vue`:

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi.js'
import AdminListPanel from '../../components/admin/AdminListPanel.vue'
import AdminEditPanel from '../../components/admin/AdminEditPanel.vue'

const { data, loading, error, fetchAll, createEntry, updateEntry, deleteEntry } = useAdminApi('enemies')

const selectedId = ref(null)
const jsonError = ref(null)
const jsonText = ref('')
const searchText = ref('')

const enemiesList = computed(() => {
  return Object.values(data.value).sort((a, b) => a.name.localeCompare(b.name))
})

const hasContent = computed(() => selectedId.value !== null || jsonText.value !== '')
const isNew = computed(() => selectedId.value === null && jsonText.value !== '')

onMounted(() => {
  fetchAll()
})

function selectEnemy(id) {
  selectedId.value = id
  jsonError.value = null
  if (data.value[id]) {
    jsonText.value = JSON.stringify(data.value[id], null, 2)
  }
}

function newEnemy() {
  const template = {
    id: 'new_enemy',
    name: 'New Enemy',
    stats: { hp: 100, atk: 20, def: 10, spd: 10 },
    skill: {
      name: 'Basic Attack',
      description: 'Deal 100% ATK damage',
      cooldown: 2
    }
  }
  jsonText.value = JSON.stringify(template, null, 2)
  selectedId.value = null
  jsonError.value = null
}

async function saveEnemy() {
  jsonError.value = null
  try {
    const parsed = JSON.parse(jsonText.value)
    if (!parsed.id) {
      jsonError.value = 'Enemy must have an id field'
      return
    }

    if (selectedId.value) {
      await updateEntry(selectedId.value, parsed)
      selectedId.value = parsed.id
    } else {
      await createEntry(parsed)
      selectedId.value = parsed.id
    }
    jsonText.value = JSON.stringify(data.value[parsed.id], null, 2)
  } catch (e) {
    jsonError.value = e.message
  }
}

async function deleteEnemy() {
  if (!selectedId.value) return
  const enemy = data.value[selectedId.value]
  if (!confirm(`Delete "${enemy?.name}"?`)) return

  await deleteEntry(selectedId.value)
  selectedId.value = null
  jsonText.value = ''
}

function cancelEdit() {
  if (selectedId.value && data.value[selectedId.value]) {
    jsonText.value = JSON.stringify(data.value[selectedId.value], null, 2)
  } else {
    jsonText.value = ''
    selectedId.value = null
  }
  jsonError.value = null
}
</script>

<template>
  <div class="enemies-admin">
    <AdminListPanel
      :items="enemiesList"
      :selected-id="selectedId"
      :loading="loading"
      :error="error"
      label-key="name"
      v-model:search="searchText"
      @select="selectEnemy"
      @new="newEnemy"
    >
      <template #item="{ item }">
        <span class="item-row">
          <span class="enemy-name">{{ item.name }}</span>
          <span class="enemy-hp">HP: {{ item.stats?.hp || '?' }}</span>
        </span>
      </template>
    </AdminListPanel>

    <AdminEditPanel
      title="Enemy"
      :is-new="isNew"
      :error="jsonError"
      v-model:json="jsonText"
      v-model:has-content="hasContent"
      @save="saveEnemy"
      @delete="deleteEnemy"
      @cancel="cancelEdit"
    />
  </div>
</template>

<style scoped>
.enemies-admin {
  display: flex;
  gap: 24px;
  height: calc(100vh - 120px);
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.enemy-name {
  color: #f3f4f6;
  font-size: 14px;
}

.enemy-hp {
  color: #9ca3af;
  font-size: 12px;
}
</style>
```

**Step 2: Add to AdminScreen**

Add import:
```js
import EnemiesAdmin from './admin/EnemiesAdmin.vue'
```

Update content-body:
```vue
        <EnemiesAdmin v-else-if="activeSection === 'enemies'" />
```

**Step 3: Commit**

```bash
git add src/screens/admin/EnemiesAdmin.vue src/screens/AdminScreen.vue
git commit -m "feat(admin): add Enemies admin screen"
```

---

## Task 11: Heroes Admin Screen

**Files:**
- Create: `src/screens/admin/HeroesAdmin.vue`
- Modify: `src/screens/AdminScreen.vue`

**Step 1: Create HeroesAdmin component**

Create `src/screens/admin/HeroesAdmin.vue`:

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi.js'
import AdminListPanel from '../../components/admin/AdminListPanel.vue'
import AdminEditPanel from '../../components/admin/AdminEditPanel.vue'

const { data, loading, error, fetchAll, createEntry, updateEntry, deleteEntry } = useAdminApi('heroes')

const selectedId = ref(null)
const jsonError = ref(null)
const jsonText = ref('')
const searchText = ref('')

const heroesList = computed(() => {
  return Object.values(data.value).sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity
    return a.name.localeCompare(b.name)
  })
})

const hasContent = computed(() => selectedId.value !== null || jsonText.value !== '')
const isNew = computed(() => selectedId.value === null && jsonText.value !== '')

const rarityColors = {
  1: '#9ca3af',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f59e0b'
}

onMounted(() => {
  fetchAll()
})

function selectHero(id) {
  selectedId.value = id
  jsonError.value = null
  if (data.value[id]) {
    jsonText.value = JSON.stringify(data.value[id], null, 2)
  }
}

function newHero() {
  const template = {
    id: 'new_hero',
    name: 'New Hero',
    rarity: 3,
    classId: 'knight',
    baseStats: { hp: 100, atk: 25, def: 25, spd: 10, mp: 50 },
    skill: {
      name: 'Basic Skill',
      description: 'Deal 100% ATK damage to one enemy',
      mpCost: 10,
      targetType: 'enemy'
    }
  }
  jsonText.value = JSON.stringify(template, null, 2)
  selectedId.value = null
  jsonError.value = null
}

async function saveHero() {
  jsonError.value = null
  try {
    const parsed = JSON.parse(jsonText.value)
    if (!parsed.id) {
      jsonError.value = 'Hero must have an id field'
      return
    }

    if (selectedId.value) {
      await updateEntry(selectedId.value, parsed)
      selectedId.value = parsed.id
    } else {
      await createEntry(parsed)
      selectedId.value = parsed.id
    }
    jsonText.value = JSON.stringify(data.value[parsed.id], null, 2)
  } catch (e) {
    jsonError.value = e.message
  }
}

async function deleteHero() {
  if (!selectedId.value) return
  const hero = data.value[selectedId.value]
  if (!confirm(`Delete "${hero?.name}"?`)) return

  await deleteEntry(selectedId.value)
  selectedId.value = null
  jsonText.value = ''
}

function cancelEdit() {
  if (selectedId.value && data.value[selectedId.value]) {
    jsonText.value = JSON.stringify(data.value[selectedId.value], null, 2)
  } else {
    jsonText.value = ''
    selectedId.value = null
  }
  jsonError.value = null
}
</script>

<template>
  <div class="heroes-admin">
    <AdminListPanel
      :items="heroesList"
      :selected-id="selectedId"
      :loading="loading"
      :error="error"
      label-key="name"
      v-model:search="searchText"
      @select="selectHero"
      @new="newHero"
    >
      <template #item="{ item }">
        <span class="item-row">
          <span class="hero-info">
            <span class="rarity-stars" :style="{ color: rarityColors[item.rarity] }">
              {{ '★'.repeat(item.rarity) }}
            </span>
            <span class="hero-name">{{ item.name }}</span>
          </span>
          <span class="hero-class">{{ item.classId }}</span>
        </span>
      </template>
    </AdminListPanel>

    <AdminEditPanel
      title="Hero"
      :is-new="isNew"
      :error="jsonError"
      v-model:json="jsonText"
      v-model:has-content="hasContent"
      @save="saveHero"
      @delete="deleteHero"
      @cancel="cancelEdit"
    />
  </div>
</template>

<style scoped>
.heroes-admin {
  display: flex;
  gap: 24px;
  height: calc(100vh - 120px);
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.hero-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rarity-stars {
  font-size: 10px;
  letter-spacing: -2px;
}

.hero-name {
  color: #f3f4f6;
  font-size: 14px;
}

.hero-class {
  color: #9ca3af;
  font-size: 12px;
  text-transform: capitalize;
}
</style>
```

**Step 2: Add to AdminScreen**

Add import:
```js
import HeroesAdmin from './admin/HeroesAdmin.vue'
```

Update content-body:
```vue
        <HeroesAdmin v-else-if="activeSection === 'heroes'" />
```

**Step 3: Commit**

```bash
git add src/screens/admin/HeroesAdmin.vue src/screens/AdminScreen.vue
git commit -m "feat(admin): add Heroes admin screen"
```

---

## Task 12: Quest Nodes Admin Screen

**Files:**
- Create: `src/screens/admin/QuestsAdmin.vue`
- Modify: `src/screens/AdminScreen.vue`

**Step 1: Create QuestsAdmin component**

Create `src/screens/admin/QuestsAdmin.vue`:

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi.js'
import AdminListPanel from '../../components/admin/AdminListPanel.vue'
import AdminEditPanel from '../../components/admin/AdminEditPanel.vue'

const { data, loading, error, fetchAll, createEntry, updateEntry, deleteEntry } = useAdminApi('questNodes')

const selectedId = ref(null)
const jsonError = ref(null)
const jsonText = ref('')
const searchText = ref('')

const questsList = computed(() => {
  return Object.values(data.value).sort((a, b) => {
    // Sort by region, then by id
    if (a.region !== b.region) return a.region.localeCompare(b.region)
    return a.id.localeCompare(b.id)
  })
})

const hasContent = computed(() => selectedId.value !== null || jsonText.value !== '')
const isNew = computed(() => selectedId.value === null && jsonText.value !== '')

onMounted(() => {
  fetchAll()
})

function selectQuest(id) {
  selectedId.value = id
  jsonError.value = null
  if (data.value[id]) {
    jsonText.value = JSON.stringify(data.value[id], null, 2)
  }
}

function newQuest() {
  const template = {
    id: 'new_node',
    name: 'New Quest Node',
    region: 'Whispering Woods',
    x: 100,
    y: 100,
    battles: [
      { enemies: ['goblin_scout', 'goblin_scout'] }
    ],
    connections: [],
    rewards: { gems: 50, gold: 100, exp: 80 },
    firstClearBonus: { gems: 30 },
    itemDrops: []
  }
  jsonText.value = JSON.stringify(template, null, 2)
  selectedId.value = null
  jsonError.value = null
}

async function saveQuest() {
  jsonError.value = null
  try {
    const parsed = JSON.parse(jsonText.value)
    if (!parsed.id) {
      jsonError.value = 'Quest node must have an id field'
      return
    }

    if (selectedId.value) {
      await updateEntry(selectedId.value, parsed)
      selectedId.value = parsed.id
    } else {
      await createEntry(parsed)
      selectedId.value = parsed.id
    }
    jsonText.value = JSON.stringify(data.value[parsed.id], null, 2)
  } catch (e) {
    jsonError.value = e.message
  }
}

async function deleteQuest() {
  if (!selectedId.value) return
  const quest = data.value[selectedId.value]
  if (!confirm(`Delete "${quest?.name}"?`)) return

  await deleteEntry(selectedId.value)
  selectedId.value = null
  jsonText.value = ''
}

function cancelEdit() {
  if (selectedId.value && data.value[selectedId.value]) {
    jsonText.value = JSON.stringify(data.value[selectedId.value], null, 2)
  } else {
    jsonText.value = ''
    selectedId.value = null
  }
  jsonError.value = null
}
</script>

<template>
  <div class="quests-admin">
    <AdminListPanel
      :items="questsList"
      :selected-id="selectedId"
      :loading="loading"
      :error="error"
      label-key="name"
      v-model:search="searchText"
      @select="selectQuest"
      @new="newQuest"
    >
      <template #item="{ item }">
        <span class="item-row">
          <span class="quest-info">
            <span class="quest-name">{{ item.name }}</span>
            <span class="quest-id">{{ item.id }}</span>
          </span>
          <span class="quest-region">{{ item.region }}</span>
        </span>
      </template>
    </AdminListPanel>

    <AdminEditPanel
      title="Quest Node"
      :is-new="isNew"
      :error="jsonError"
      v-model:json="jsonText"
      v-model:has-content="hasContent"
      @save="saveQuest"
      @delete="deleteQuest"
      @cancel="cancelEdit"
    />
  </div>
</template>

<style scoped>
.quests-admin {
  display: flex;
  gap: 24px;
  height: calc(100vh - 120px);
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.quest-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quest-name {
  color: #f3f4f6;
  font-size: 14px;
}

.quest-id {
  color: #6b7280;
  font-size: 11px;
  font-family: monospace;
}

.quest-region {
  color: #9ca3af;
  font-size: 11px;
  white-space: nowrap;
}
</style>
```

**Step 2: Add to AdminScreen**

Add import:
```js
import QuestsAdmin from './admin/QuestsAdmin.vue'
```

Update content-body:
```vue
        <QuestsAdmin v-else-if="activeSection === 'questNodes'" />
```

**Step 3: Commit**

```bash
git add src/screens/admin/QuestsAdmin.vue src/screens/AdminScreen.vue
git commit -m "feat(admin): add Quest Nodes admin screen"
```

---

## Task 13: Fix Status Effects File Format

The statusEffects.js file has a different structure (uses computed keys with EffectType enum). Need to handle this specially.

**Files:**
- Modify: `vite-plugin-admin.js`

**Step 1: Add special handling for statusEffects**

The current parser won't work well with statusEffects because it uses `[EffectType.ATK_UP]` as keys. For the admin, we'll treat `effectDefinitions` as the main export and convert keys to simple strings.

Update `vite-plugin-admin.js`:

Change DATA_FILES to include export name:
```js
const DATA_FILES = {
  heroes: { path: 'src/data/heroTemplates.js', exportName: 'heroTemplates' },
  enemies: { path: 'src/data/enemyTemplates.js', exportName: 'enemyTemplates' },
  classes: { path: 'src/data/classes.js', exportName: 'classes' },
  statusEffects: { path: 'src/data/statusEffects.js', exportName: 'effectDefinitions' },
  questNodes: { path: 'src/data/questNodes.js', exportName: 'questNodes' },
  items: { path: 'src/data/items.js', exportName: 'items' }
}
```

Update the GET handler:
```js
          const { path: filePath, exportName: targetExport } = DATA_FILES[contentType]
          // ... use filePath instead of DATA_FILES[contentType]
```

Note: The statusEffects file is complex due to computed property keys. For MVP, we can either:
1. Skip editing statusEffects through the admin (read-only)
2. Or parse/reconstruct it more carefully

For MVP, recommend marking it read-only or handling separately.

**Step 2: Commit**

```bash
git add vite-plugin-admin.js
git commit -m "fix(admin): update data file configuration structure"
```

---

## Task 14: Final AdminScreen Integration

**Files:**
- Modify: `src/screens/AdminScreen.vue`

**Step 1: Ensure all imports and sections are wired up**

Update `src/screens/AdminScreen.vue` with all imports:

```vue
<script setup>
import { ref } from 'vue'
import ItemsAdmin from './admin/ItemsAdmin.vue'
import ClassesAdmin from './admin/ClassesAdmin.vue'
import StatusEffectsAdmin from './admin/StatusEffectsAdmin.vue'
import EnemiesAdmin from './admin/EnemiesAdmin.vue'
import HeroesAdmin from './admin/HeroesAdmin.vue'
import QuestsAdmin from './admin/QuestsAdmin.vue'

const activeSection = ref('heroes')

const sections = [
  { id: 'heroes', label: 'Heroes' },
  { id: 'enemies', label: 'Enemies' },
  { id: 'classes', label: 'Classes' },
  { id: 'statusEffects', label: 'Status Effects' },
  { id: 'questNodes', label: 'Quest Nodes' },
  { id: 'items', label: 'Items' }
]

const emit = defineEmits(['navigate'])

function exitAdmin() {
  emit('navigate', 'home')
}
</script>

<template>
  <div class="admin-screen">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Admin</h2>
        <button class="exit-btn" @click="exitAdmin">Exit</button>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="section in sections"
          :key="section.id"
          :class="['nav-item', { active: activeSection === section.id }]"
          @click="activeSection = section.id"
        >
          {{ section.label }}
        </button>
      </nav>
    </aside>

    <main class="content">
      <div class="content-header">
        <h1>{{ sections.find(s => s.id === activeSection)?.label }}</h1>
      </div>

      <div class="content-body">
        <HeroesAdmin v-if="activeSection === 'heroes'" />
        <EnemiesAdmin v-else-if="activeSection === 'enemies'" />
        <ClassesAdmin v-else-if="activeSection === 'classes'" />
        <StatusEffectsAdmin v-else-if="activeSection === 'statusEffects'" />
        <QuestsAdmin v-else-if="activeSection === 'questNodes'" />
        <ItemsAdmin v-else-if="activeSection === 'items'" />
      </div>
    </main>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add src/screens/AdminScreen.vue
git commit -m "feat(admin): complete admin screen with all content type sections"
```

---

## Task 15: Manual Testing & Polish

**Step 1: Test all CRUD operations**

For each content type (Heroes, Enemies, Classes, Status Effects, Quest Nodes, Items):
1. Open admin (Ctrl+Shift+A)
2. Click section in sidebar
3. Verify list loads
4. Click an item, verify JSON appears
5. Edit JSON, click Save, verify file updated
6. Click "+ New", fill template, Save
7. Select new item, Delete it

**Step 2: Fix any issues found during testing**

Document and fix issues as you find them.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(admin): complete admin interface MVP"
```

---

## Summary

After completing all tasks, you will have:

1. **Vite plugin** (`vite-plugin-admin.js`) - REST API for reading/writing data files
2. **Admin screen** (`src/screens/AdminScreen.vue`) - Main layout with sidebar navigation
3. **Content admin screens** - One for each data type with list + JSON editor
4. **Reusable components** - `AdminListPanel` and `AdminEditPanel` for consistent UI
5. **API composable** - `useAdminApi` for CRUD operations

The admin is accessible via Ctrl+Shift+A in dev mode only.
