# Region Link Markers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add visual markers on the world map that show paths to other regions, with click-to-navigate slide transitions and admin drag-and-drop positioning.

**Architecture:** Detect cross-region connections from existing `connections` arrays in questNodes.js. Render a new `RegionLinkMarker` component alongside `NodeMarker` in `MapCanvas`. WorldMapScreen wraps the map in a Vue `<Transition>` for slide navigation. MapEditor gets drag support for link markers, persisted via the existing admin Vite plugin.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Vite, CSS transitions

**Worktree:** `/home/deltran/code/dorf/.worktrees/region-link-markers` (branch: `feature/region-link-markers`)

---

### Task 1: Add regionLinkPosition to cross-region source nodes

**Files:**
- Modify: `src/data/questNodes.js`

Add `regionLinkPosition: { x, y }` to every node that has a cross-region connection. Position the link icon ~60-80px offset from the source node, biased toward the edge of the map the connection goes to.

**Step 1: Add regionLinkPosition to each cross-region source node**

These are the 12 nodes that need the field. Add `regionLinkPosition` right after the `y` property of each node. Use the source node's coordinates with an offset toward the nearest map edge:

```js
// forest_03 (Spider Nest) — Whispering Woods (480, 400) → Whisper Lake
regionLinkPosition: { x: 480, y: 470 },

// forest_05 (Goblin Cavern) — Whispering Woods (586, 164) → Echoing Caverns
regionLinkPosition: { x: 660, y: 164 },

// cave_04 (Deep Chasm) — Echoing Caverns (600, 250) → Stormwind Peaks
regionLinkPosition: { x: 680, y: 250 },

// mountain_02 (Frozen Lake) — Stormwind Peaks (380, 550) → Hibernation Den
regionLinkPosition: { x: 380, y: 630 },

// mountain_04 (Dragon's Lair) — Stormwind Peaks (405, 185) → The Summit
regionLinkPosition: { x: 490, y: 120 },

// summit_06 (Titan's Throne) — The Summit (700, 250) → Blistering Cliffsides
regionLinkPosition: { x: 770, y: 250 },

// cliffs_06 (Inferno Peak) — Blistering Cliffsides (720, 230) → Janxier Floodplain
regionLinkPosition: { x: 775, y: 160 },

// flood_07 (Hydra's Lair) — Janxier Floodplain (720, 250) → Old Fort Calindash
regionLinkPosition: { x: 775, y: 180 },

// fort_06 (Dungeon Entrance) — Old Fort Calindash (700, 250) → Ancient Catacombs
regionLinkPosition: { x: 770, y: 180 },

// cata_07 (Lich King's Throne) — Ancient Catacombs (720, 250) → Underground Morass
regionLinkPosition: { x: 775, y: 180 },

// morass_06 (Abyssal Exit) — Underground Morass (700, 250) → Gate to Aquaria
regionLinkPosition: { x: 770, y: 180 },

// aqua_08 (Kraken's Domain) — Gate to Aquaria (740, 250) → Coral Depths
regionLinkPosition: { x: 775, y: 180 },
```

**Step 2: Commit**

```bash
git add src/data/questNodes.js
git commit -m "feat: add regionLinkPosition to cross-region source nodes"
```

---

### Task 2: Create RegionLinkMarker component

**Files:**
- Create: `src/components/RegionLinkMarker.vue`

This component is similar to `NodeMarker.vue` but simpler — a blue-teal circle with an arrow icon and a label showing the target region name.

**Step 1: Create the component file**

Create `src/components/RegionLinkMarker.vue`:

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  link: {
    type: Object,
    required: true
    // Expected shape: { sourceNode, targetNode, targetRegion, position: { x, y } }
  },
  scale: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['navigate'])

const markerStyle = computed(() => ({
  left: `${props.link.position.x * props.scale}px`,
  top: `${props.link.position.y * props.scale}px`
}))
</script>

<template>
  <button
    class="region-link-marker"
    :style="markerStyle"
    @click="emit('navigate', { targetRegion: link.targetRegion, targetNode: link.targetNode })"
  >
    <div class="link-ring"></div>
    <div class="link-icon">➡</div>
    <div class="link-label">{{ link.targetRegion.name }}</div>
  </button>
</template>

<style scoped>
.region-link-marker {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  transition: transform 0.3s ease;
  z-index: 10;
  padding: 0;
  transform: translate(-50%, -50%);
}

.link-ring {
  position: absolute;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(59, 130, 246, 0.5);
  top: 22px;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: linkPulse 2s ease-in-out infinite;
}

@keyframes linkPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.3; }
}

.link-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
  animation: linkGlow 2s ease-in-out infinite;
}

@keyframes linkGlow {
  0%, 100% { box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5); }
  50% { box-shadow: 0 4px 20px rgba(59, 130, 246, 0.8); }
}

.region-link-marker:hover .link-icon {
  transform: scale(1.1);
}

.link-label {
  background: rgba(59, 130, 246, 0.85);
  color: #f3f4f6;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.2s ease;
}

.region-link-marker:hover .link-label {
  opacity: 1;
  transform: translateY(0);
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/RegionLinkMarker.vue
git commit -m "feat: create RegionLinkMarker component"
```

---

### Task 3: Update MapCanvas to detect and render region links

**Files:**
- Modify: `src/components/MapCanvas.vue`

MapCanvas needs to:
1. Import `RegionLinkMarker` and `regions` from questNodes
2. Compute `regionLinks` — cross-region connections from completed source nodes
3. Add SVG trails from source node to link marker position
4. Render `RegionLinkMarker` components in the markers layer
5. Emit a new `navigateRegion` event

**Step 1: Update script section**

Add imports at top of `<script setup>`:

```js
import { getQuestNode, regions } from '../data/questNodes.js'
import RegionLinkMarker from './RegionLinkMarker.vue'
```

Note: `getQuestNode` is already imported. Just add `regions` to the existing import, and add the `RegionLinkMarker` import.

Add a new emit:

```js
const emit = defineEmits(['selectNode', 'navigateRegion'])
```

Add `regionLinks` computed after the existing `trails` computed (after line 81):

```js
// Detect cross-region connections from completed nodes
const regionLinks = computed(() => {
  const links = []
  for (const node of props.nodes) {
    if (!props.completedNodes.includes(node.id)) continue
    for (const connId of node.connections || []) {
      const connNode = getQuestNode(connId)
      if (!connNode || connNode.region === props.region.name) continue
      const targetRegion = regions.find(r => r.name === connNode.region)
      if (!targetRegion) continue
      links.push({
        id: `link-${node.id}-${connId}`,
        sourceNode: node,
        targetNode: connNode,
        targetRegion,
        position: node.regionLinkPosition || { x: node.x + 60, y: node.y }
      })
    }
  }
  return links
})
```

Add a handler for navigate:

```js
function navigateRegion(payload) {
  emit('navigateRegion', payload)
}
```

**Step 2: Update template**

Add region link trails to the SVG `<g class="trails">` section, after the existing `<template v-for="trail in trails">` block:

```html
<!-- Region link trails -->
<template v-for="link in regionLinks" :key="link.id">
  <line
    :x1="link.sourceNode.x"
    :y1="link.sourceNode.y"
    :x2="link.position.x"
    :y2="link.position.y"
    class="trail-line region-link-trail"
    stroke-dasharray="8 8"
  />
</template>
```

Add `RegionLinkMarker` components in the `<div class="markers-layer">`, after the NodeMarker v-for:

```html
<RegionLinkMarker
  v-for="link in regionLinks"
  :key="link.id"
  :link="link"
  :scale="scale"
  @navigate="navigateRegion"
/>
```

**Step 3: Add CSS for region link trail**

Add after the existing `.trail-line.faded` rule:

```css
.trail-line.region-link-trail {
  stroke: rgba(59, 130, 246, 0.5);
  stroke-width: 3;
  stroke-linecap: round;
}
```

**Step 4: Commit**

```bash
git add src/components/MapCanvas.vue
git commit -m "feat: detect and render region link markers in MapCanvas"
```

---

### Task 4: Update WorldMapScreen with slide transition and navigate handler

**Files:**
- Modify: `src/screens/WorldMapScreen.vue`

WorldMapScreen needs to:
1. Handle the `navigateRegion` event from MapCanvas
2. Wrap the map section in a Vue `<Transition>` for slide animation
3. Switch `selectedRegion` during the transition

**Step 1: Add slide transition state**

In the `<script setup>` section, after the existing refs (~line 33), add:

```js
const isSliding = ref(false)
const slideDirection = ref('left') // 'left' for forward navigation
```

Add a navigate handler function (after the existing `clearSelection` function):

```js
function handleRegionNavigate({ targetRegion }) {
  if (isSliding.value) return

  // Find if the target region is in the current super-region
  const targetSuperRegion = targetRegion.superRegion
  if (targetSuperRegion !== selectedSuperRegion.value) {
    // Different super-region: switch super-region first, then region
    skipNextRegionReset = true
    selectedSuperRegion.value = targetSuperRegion
  }

  isSliding.value = true
  slideDirection.value = 'left'

  // After a brief delay for the leave animation, switch region
  setTimeout(() => {
    selectedNode.value = null
    selectedRegion.value = targetRegion.id
    // Allow the enter animation to play, then clear sliding state
    setTimeout(() => {
      isSliding.value = false
    }, 50)
  }, 400)
}
```

**Step 2: Update template — wrap MapCanvas in transition**

Replace the map-section (lines 352-363):

```html
<!-- Map Canvas -->
<section class="map-section">
  <Transition :name="isSliding ? 'region-slide' : 'none'">
    <MapCanvas
      v-if="currentRegion"
      :key="selectedRegion"
      :region="currentRegion"
      :nodes="currentRegionNodes"
      :unlocked-nodes="allUnlockedNodes"
      :completed-nodes="questsStore.completedNodes"
      :selected-node-id="selectedNode?.id"
      @select-node="selectNode"
      @navigate-region="handleRegionNavigate"
    />
  </Transition>
</section>
```

Key changes:
- Added `:key="selectedRegion"` to force re-render on region change
- Added `@navigate-region="handleRegionNavigate"` event handler
- Wrapped in `<Transition>` with conditional name (only slides when triggered by link click)

**Step 3: Add slide transition CSS**

Add to the `<style scoped>` section:

```css
/* Region slide transitions */
.region-slide-enter-active,
.region-slide-leave-active {
  transition: transform 0.4s ease-out, opacity 0.4s ease-out;
}

.region-slide-leave-active {
  position: absolute;
  width: 100%;
}

.region-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.region-slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
```

Also add `position: relative; overflow: hidden;` to the `.map-section` rule (create it if it doesn't exist):

```css
.map-section {
  position: relative;
  overflow: hidden;
}
```

**Step 4: Commit**

```bash
git add src/screens/WorldMapScreen.vue
git commit -m "feat: add slide transition for region link navigation"
```

---

### Task 5: Update MapEditor to support dragging region link markers

**Files:**
- Modify: `src/components/admin/MapEditor.vue`
- Modify: `src/data/questNodes.js` (import needed)

MapEditor needs to:
1. Import `getQuestNode` and detect cross-region links
2. Track link marker positions alongside node positions
3. Render link markers as draggable elements
4. Include link position changes in the save payload

**Step 1: Update script — add imports and link detection**

Add to the existing imports at top of the file:

```js
import { getQuestNode } from '../../data/questNodes.js'
```

After the `nodePositions` and `movedNodes` refs, add:

```js
// --- Region link positions (mutable copies) ---
const linkPositions = ref({})
const movedLinks = ref({})
```

After the existing `watch(() => props.nodes, ...)` watcher, add a new watcher:

```js
watch(() => props.nodes, (nodes) => {
  const positions = {}
  for (const node of nodes) {
    for (const connId of node.connections || []) {
      const connNode = getQuestNode(connId)
      if (!connNode || connNode.region === node.region) continue
      const linkId = `link-${node.id}`
      const pos = node.regionLinkPosition || { x: node.x + 60, y: node.y }
      positions[linkId] = { x: pos.x, y: pos.y, sourceNodeId: node.id }
    }
  }
  linkPositions.value = positions
  movedLinks.value = {}
}, { immediate: true })
```

Update the `hasChanges` computed:

```js
const hasChanges = computed(() =>
  Object.keys(movedNodes.value).length > 0 || Object.keys(movedLinks.value).length > 0
)
```

Add link dragging support. Extend `draggingNodeId` to also track links. Add a new ref:

```js
const draggingLinkId = ref(null)
```

Add link mouse handlers:

```js
function onLinkMouseDown(e, linkId) {
  e.preventDefault()
  draggingLinkId.value = linkId
  const pos = linkPositions.value[linkId]
  const rect = mapContainer.value.getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - (pos.x * scale.value + rect.left),
    y: e.clientY - (pos.y * scale.value + rect.top)
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
```

Modify `onMouseMove` to handle both nodes and links:

```js
function onMouseMove(e) {
  const activeId = draggingNodeId.value || draggingLinkId.value
  if (!activeId) return
  const rect = mapContainer.value.getBoundingClientRect()
  const rawX = (e.clientX - rect.left - dragOffset.value.x) / scale.value
  const rawY = (e.clientY - rect.top - dragOffset.value.y) / scale.value
  const x = Math.max(0, Math.min(props.region.width, Math.round(rawX)))
  const y = Math.max(0, Math.min(props.region.height, Math.round(rawY)))

  if (draggingNodeId.value) {
    nodePositions.value[draggingNodeId.value] = { x, y }
    movedNodes.value[draggingNodeId.value] = true
  } else if (draggingLinkId.value) {
    const existing = linkPositions.value[draggingLinkId.value]
    linkPositions.value[draggingLinkId.value] = { ...existing, x, y }
    movedLinks.value[draggingLinkId.value] = true
  }
}
```

Modify `onMouseUp`:

```js
function onMouseUp() {
  draggingNodeId.value = null
  draggingLinkId.value = null
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}
```

Modify `saveLayout` to include link positions:

```js
function saveLayout() {
  if (!hasChanges.value) return
  const positions = {}
  for (const nodeId of Object.keys(movedNodes.value)) {
    positions[nodeId] = nodePositions.value[nodeId]
  }
  const linkPosPayload = {}
  for (const linkId of Object.keys(movedLinks.value)) {
    const link = linkPositions.value[linkId]
    linkPosPayload[link.sourceNodeId] = { x: link.x, y: link.y }
  }
  emit('save-positions', positions)
  if (Object.keys(linkPosPayload).length > 0) {
    emit('save-link-positions', linkPosPayload)
  }
  movedNodes.value = {}
  movedLinks.value = {}
}
```

Add the new emit:

```js
const emit = defineEmits(['back', 'save-image', 'save-positions', 'resize-region', 'save-link-positions'])
```

Add link style helper:

```js
function getLinkStyle(linkId) {
  const pos = linkPositions.value[linkId]
  if (!pos) return {}
  return {
    left: `${pos.x * scale.value}px`,
    top: `${pos.y * scale.value}px`
  }
}
```

Add link trails computed:

```js
const linkTrails = computed(() => {
  const result = []
  for (const [linkId, link] of Object.entries(linkPositions.value)) {
    const sourcePos = nodePositions.value[link.sourceNodeId]
    if (!sourcePos) continue
    result.push({
      id: linkId,
      x1: sourcePos.x, y1: sourcePos.y,
      x2: link.x, y2: link.y
    })
  }
  return result
})
```

**Step 2: Update template — add link markers and trails**

In the SVG trail section, after the existing `<line v-for="trail in trails">`, add:

```html
<!-- Region link trails -->
<line
  v-for="trail in linkTrails"
  :key="trail.id"
  :x1="trail.x1" :y1="trail.y1"
  :x2="trail.x2" :y2="trail.y2"
  class="trail-line link-trail"
  stroke-dasharray="8 8"
/>
```

After the existing node markers `v-for`, add:

```html
<!-- Region link markers -->
<div
  v-for="(link, linkId) in linkPositions"
  :key="linkId"
  :class="['node-marker', 'node-link', {
    'node-moved': movedLinks[linkId],
    'node-dragging': draggingLinkId === linkId
  }]"
  :style="getLinkStyle(linkId)"
  :title="`Region Link (${link.x}, ${link.y})`"
  @mousedown="onLinkMouseDown($event, linkId)"
>
  <div class="node-dot"></div>
  <div class="node-label">Link</div>
</div>
```

**Step 3: Add CSS for link markers**

Add to the `<style scoped>`:

```css
.node-link .node-dot {
  background: #3b82f6;
  border-color: #60a5fa;
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
}

.trail-line.link-trail {
  stroke: rgba(59, 130, 246, 0.5);
}
```

**Step 4: Commit**

```bash
git add src/components/admin/MapEditor.vue
git commit -m "feat: add region link marker drag support to MapEditor"
```

---

### Task 6: Add admin endpoint for saving region link positions

**Files:**
- Modify: `vite-plugin-admin.js`
- Modify: `src/screens/admin/AssetViewerMaps.vue`

**Step 1: Add save-link-positions handler in AssetViewerMaps.vue**

Read `AssetViewerMaps.vue` to find where `savePositions` is defined and where the MapEditor `@save-positions` handler is bound. Add a parallel `saveLinkPositions` function and bind it.

In the script section, add:

```js
async function saveLinkPositions(positions) {
  try {
    await fetch('/__admin/save-link-positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions })
    })
  } catch (err) {
    alert('Failed to save link positions: ' + (err.message || err))
  }
}
```

In the template where MapEditor is rendered, add the event handler:

```html
@save-link-positions="saveLinkPositions"
```

**Step 2: Add the Vite plugin endpoint**

In `vite-plugin-admin.js`, add a new POST handler for `/__admin/save-link-positions`. This follows the same pattern as `save-node-positions` but targets `regionLinkPosition`:

The handler receives `{ positions: { nodeId: { x, y } } }` — where `nodeId` is the source quest node. For each entry:
1. Find the node block by `id: 'nodeId'` regex
2. Check if `regionLinkPosition` already exists within 300 chars of the id match
3. If it exists: replace the x/y values within it
4. If it doesn't exist: insert `regionLinkPosition: { x: N, y: N },` after the `y:` line

```js
// POST /__admin/save-link-positions
if (req.method === 'POST' && req.url === '/__admin/save-link-positions') {
  let body = ''
  for await (const chunk of req) body += chunk

  try {
    const { positions } = JSON.parse(body)
    if (!positions || typeof positions !== 'object') {
      res.statusCode = 400
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
    res.end(JSON.stringify({ error: e.message }))
  }
  return
}
```

**Step 3: Commit**

```bash
git add vite-plugin-admin.js src/screens/admin/AssetViewerMaps.vue
git commit -m "feat: add admin endpoint for saving region link positions"
```

---

### Task 7: Manual testing and final cleanup

**Steps:**
1. Run `npm run dev` in the worktree
2. Open the world map — verify link markers appear on completed nodes with cross-region connections
3. Click a link marker — verify slide transition to target region
4. Open admin (Ctrl+Shift+A) → Maps → select a region with cross-region links
5. Verify blue link markers appear and are draggable
6. Drag a link marker, click Save Layout, verify position persists in questNodes.js
7. Run `npx vitest run` to verify no regressions

**After testing, commit any fixes and run final tests:**

```bash
npx vitest run
```
