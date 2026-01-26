<script setup>
import { ref, computed } from 'vue'
import { questNodes, regions } from '../../data/questNodes.js'
import assetPromptsData from '../../data/assetPrompts.json'
import BackgroundAssetCard from '../../components/admin/BackgroundAssetCard.vue'
import BackgroundAssetModal from '../../components/admin/BackgroundAssetModal.vue'

// --- Glob imports for asset detection ---
const bgImages = import.meta.glob('../../assets/battle_backgrounds/*.png', { eager: true, import: 'default' })

// --- Override map for newly saved assets ---
const imageOverrides = ref({})

// --- Asset lookup ---
function getImageUrl(nodeId) {
  if (imageOverrides.value[nodeId]) return imageOverrides.value[nodeId]
  const path = `../../assets/battle_backgrounds/${nodeId}.png`
  return bgImages[path] || null
}

// --- Default node pseudo-object ---
const defaultNode = { id: 'default', name: 'Default Background', region: 'Default' }

// --- Build region groups from questNodes + regions ---
const regionGroups = computed(() => {
  const groups = []

  // Default section first
  groups.push({
    regionName: 'Default',
    nodes: [defaultNode]
  })

  // Each region in order
  for (const region of regions) {
    const regionNodes = Object.values(questNodes)
      .filter(n => n.region === region.name)
      .map(n => ({ id: n.id, name: n.name, region: n.region, type: n.type || null }))

    if (regionNodes.length > 0) {
      groups.push({
        regionName: region.name,
        nodes: regionNodes
      })
    }
  }

  return groups
})

// --- Asset prompts state ---
const assetPrompts = ref({ ...assetPromptsData })

// --- Modal state ---
const selectedNode = ref(null)

function openModal(node) {
  selectedNode.value = node
}

function closeModal() {
  selectedNode.value = null
}

// --- Save handler ---
async function saveImage({ nodeId, dataUrl, prompt }) {
  try {
    await fetch('/__admin/save-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetPath: `battle_backgrounds/${nodeId}.png`, dataUrl })
    })

    const promptKey = `bg_${nodeId}`
    assetPrompts.value[promptKey] = prompt
    await fetch('/__admin/save-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetPrompts.value)
    })

    imageOverrides.value[nodeId] = dataUrl
  } catch (err) {
    alert('Failed to save background: ' + (err.message || err))
  }
}
</script>

<template>
  <div class="asset-viewer-backgrounds">
    <div v-for="group in regionGroups" :key="group.regionName" class="region-group">
      <h3 class="region-header">{{ group.regionName }}</h3>
      <div class="backgrounds-grid">
        <BackgroundAssetCard
          v-for="node in group.nodes"
          :key="node.id"
          :node="node"
          :image-url="getImageUrl(node.id)"
          @select="openModal"
        />
      </div>
    </div>

    <BackgroundAssetModal
      :node="selectedNode"
      :image-url="selectedNode ? getImageUrl(selectedNode.id) : null"
      :saved-prompt="selectedNode ? (assetPrompts[`bg_${selectedNode.id}`] || null) : null"
      @close="closeModal"
      @save-image="saveImage"
    />
  </div>
</template>

<style scoped>
.asset-viewer-backgrounds {
  padding: 16px;
}

.region-group {
  margin-bottom: 32px;
}

.region-header {
  font-size: 16px;
  font-weight: 600;
  color: #d1d5db;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #374151;
}

.backgrounds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 16px;
}
</style>
