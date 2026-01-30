<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { questNodes, regions, superRegions } from '../../data/quests/index.js'
import assetPromptsData from '../../data/assetPrompts.json'
import MapAssetCard from '../../components/admin/MapAssetCard.vue'
import MapEditor from '../../components/admin/MapEditor.vue'

// --- Glob imports for asset detection ---
const mapImages = import.meta.glob('../../assets/maps/*.png', { eager: true, import: 'default' })

// --- Override map for newly saved assets ---
const imageOverrides = ref({})

// --- Asset lookup ---
function getImageUrl(regionId) {
  if (imageOverrides.value[regionId]) return imageOverrides.value[regionId]
  const path = `../../assets/maps/${regionId}.png`
  return mapImages[path] || null
}

// --- Node counts per region ---
function getNodeCount(regionName) {
  return Object.values(questNodes).filter(n => n.region === regionName).length
}

// --- Nodes for a region ---
function getRegionNodes(regionName) {
  return Object.values(questNodes)
    .filter(n => n.region === regionName)
    .map(n => ({ id: n.id, name: n.name, x: n.x, y: n.y, type: n.type || null, region: n.region, connections: n.connections || [] }))
}

// --- Super region groups ---
const superRegionGroups = computed(() => {
  const groups = []
  for (const sr of superRegions) {
    const srRegions = regions.filter(r => r.superRegion === sr.id)
    if (srRegions.length > 0) {
      groups.push({
        superRegionName: sr.name,
        regions: srRegions
      })
    }
  }
  return groups
})

// --- Asset prompts state ---
const assetPrompts = ref({ ...assetPromptsData })

// --- Editor state with persistence ---
const editingRegion = ref(null)

// Restore editing state on mount
onMounted(() => {
  if (import.meta.env.DEV) {
    const savedRegionId = sessionStorage.getItem('dorf_dev_admin_map_editing')
    if (savedRegionId) {
      const region = regions.find(r => r.id === savedRegionId)
      if (region) {
        editingRegion.value = region
      }
    }
  }
})

// Persist editing state on change
watch(editingRegion, (region) => {
  if (import.meta.env.DEV) {
    if (region) {
      sessionStorage.setItem('dorf_dev_admin_map_editing', region.id)
    } else {
      sessionStorage.removeItem('dorf_dev_admin_map_editing')
    }
  }
})

function openEditor(region) {
  editingRegion.value = region
}

function closeEditor() {
  editingRegion.value = null
}

// --- Save handlers ---
async function saveImage({ regionId, dataUrl, prompt }) {
  try {
    await fetch('/__admin/save-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetPath: `maps/${regionId}.png`, dataUrl })
    })

    const promptKey = `map_${regionId}`
    assetPrompts.value[promptKey] = prompt
    await fetch('/__admin/save-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetPrompts.value)
    })

    imageOverrides.value[regionId] = dataUrl
  } catch (err) {
    alert('Failed to save map: ' + (err.message || err))
  }
}

async function savePositions(positions) {
  try {
    const response = await fetch('/__admin/save-node-positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions })
    })
    const result = await response.json()
    if (!response.ok || result.error) {
      alert('Failed to save positions: ' + (result.error || response.statusText))
    }
  } catch (err) {
    alert('Failed to save positions: ' + (err.message || err))
  }
}

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

async function resizeRegion({ width, height }) {
  if (!editingRegion.value) return
  const regionId = editingRegion.value.id
  try {
    await fetch('/__admin/save-region-size', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regionId, width, height })
    })
    editingRegion.value = { ...editingRegion.value, width, height }
  } catch (err) {
    alert('Failed to resize region: ' + (err.message || err))
  }
}
</script>

<template>
  <div class="asset-viewer-maps">
    <!-- Editor view -->
    <MapEditor
      v-if="editingRegion"
      :region="editingRegion"
      :nodes="getRegionNodes(editingRegion.name)"
      :image-url="getImageUrl(editingRegion.id)"
      :saved-prompt="assetPrompts[`map_${editingRegion.id}`] || null"
      @back="closeEditor"
      @save-image="saveImage"
      @save-positions="savePositions"
      @save-link-positions="saveLinkPositions"
      @resize-region="resizeRegion"
    />

    <!-- Card grid view -->
    <template v-else>
      <div v-for="group in superRegionGroups" :key="group.superRegionName" class="super-region-group">
        <h3 class="super-region-header">{{ group.superRegionName }}</h3>
        <div class="maps-grid">
          <MapAssetCard
            v-for="region in group.regions"
            :key="region.id"
            :region="region"
            :image-url="getImageUrl(region.id)"
            :node-count="getNodeCount(region.name)"
            @select="openEditor"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.asset-viewer-maps {
  padding: 16px;
}

.super-region-group {
  margin-bottom: 32px;
}

.super-region-header {
  font-size: 16px;
  font-weight: 600;
  color: #d1d5db;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #374151;
}

.maps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
</style>
