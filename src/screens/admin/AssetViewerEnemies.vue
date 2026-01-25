<script setup>
import { ref, computed } from 'vue'
import { enemyTemplates } from '../../data/enemyTemplates.js'
import { genusLociData } from '../../data/genusLoci.js'
import assetPromptsData from '../../data/assetPrompts.json'
import EnemyAssetCard from '../../components/admin/EnemyAssetCard.vue'
import EnemyAssetModal from '../../components/admin/EnemyAssetModal.vue'

// --- Glob imports for asset detection ---
const enemyImages = import.meta.glob('../../assets/enemies/*.png', { eager: true, import: 'default' })

// --- Override map for newly saved assets (avoids page reload) ---
const imageOverrides = ref({})
const portraitOverrides = ref({})

// --- Asset lookup helpers ---
function getImageUrl(enemyId) {
  if (imageOverrides.value[enemyId]) return imageOverrides.value[enemyId]
  const path = `../../assets/enemies/${enemyId}.png`
  return enemyImages[path] || null
}

function getPortraitUrl(enemyId) {
  if (portraitOverrides.value[enemyId]) return portraitOverrides.value[enemyId]
  const path = `../../assets/enemies/${enemyId}_portrait.png`
  return enemyImages[path] || null
}

// --- Genus Loci IDs for tagging ---
const genusLociIds = new Set(Object.keys(genusLociData))

// --- Combined enemy list: regular enemies + genus loci, sorted by name ---
const enemies = computed(() => {
  const regular = Object.values(enemyTemplates).map(e => ({
    ...e,
    isGenusLoci: false
  }))

  const loci = Object.values(genusLociData).map(g => ({
    id: g.id,
    name: g.name,
    isGenusLoci: true
  }))

  return [...loci, ...regular].sort((a, b) => {
    // Genus Loci first, then alphabetical
    if (a.isGenusLoci !== b.isGenusLoci) return a.isGenusLoci ? -1 : 1
    return a.name.localeCompare(b.name)
  })
})

// --- Asset prompts state ---
const assetPrompts = ref({ ...assetPromptsData })

// --- Modal state ---
const selectedEnemy = ref(null)
const selectedIsGenusLoci = ref(false)

function openModal(enemy) {
  selectedEnemy.value = enemy
  selectedIsGenusLoci.value = enemy.isGenusLoci
}

function closeModal() {
  selectedEnemy.value = null
}

// --- Save handlers ---
async function saveImage({ enemyId, dataUrl, prompt }) {
  try {
    await fetch('/__admin/save-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetPath: `enemies/${enemyId}.png`, dataUrl })
    })

    assetPrompts.value[enemyId] = prompt
    await fetch('/__admin/save-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetPrompts.value)
    })

    imageOverrides.value[enemyId] = dataUrl
  } catch (err) {
    alert('Failed to save image: ' + (err.message || err))
  }
}

async function savePortrait({ enemyId, dataUrl }) {
  try {
    await fetch('/__admin/save-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetPath: `enemies/${enemyId}_portrait.png`, dataUrl })
    })

    portraitOverrides.value[enemyId] = dataUrl
  } catch (err) {
    alert('Failed to save portrait: ' + (err.message || err))
  }
}
</script>

<template>
  <div class="asset-viewer-enemies">
    <div class="enemies-grid">
      <EnemyAssetCard
        v-for="enemy in enemies"
        :key="enemy.id"
        :enemy="enemy"
        :image-url="getImageUrl(enemy.id)"
        :portrait-url="getPortraitUrl(enemy.id)"
        :is-genus-loci="enemy.isGenusLoci"
        @select="openModal"
      />
    </div>

    <EnemyAssetModal
      :enemy="selectedEnemy"
      :image-url="selectedEnemy ? getImageUrl(selectedEnemy.id) : null"
      :portrait-url="selectedEnemy ? getPortraitUrl(selectedEnemy.id) : null"
      :saved-prompt="selectedEnemy ? (assetPrompts[selectedEnemy.id] || null) : null"
      :is-genus-loci="selectedIsGenusLoci"
      @close="closeModal"
      @save-image="saveImage"
      @save-portrait="savePortrait"
    />
  </div>
</template>

<style scoped>
.asset-viewer-enemies {
  padding: 16px;
}

.enemies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}
</style>
