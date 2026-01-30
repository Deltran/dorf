<script setup>
import { ref, computed } from 'vue'
import { heroTemplates } from '../../data/heroes/index.js'
import assetPromptsData from '../../data/assetPrompts.json'
import HeroAssetCard from '../../components/admin/HeroAssetCard.vue'
import HeroAssetModal from '../../components/admin/HeroAssetModal.vue'

// --- Glob imports for asset detection ---
const heroImages = import.meta.glob('../../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../../assets/heroes/*.gif', { eager: true, import: 'default' })

// --- Override map for newly saved assets (avoids page reload) ---
const imageOverrides = ref({})
const portraitOverrides = ref({})

// --- Asset lookup helpers (overrides take priority) ---
function getImageUrl(heroId) {
  if (imageOverrides.value[heroId]) return imageOverrides.value[heroId]
  const path = `../../assets/heroes/${heroId}.png`
  return heroImages[path] || null
}

function getGifUrl(heroId) {
  const path = `../../assets/heroes/${heroId}.gif`
  return heroGifs[path] || null
}

function getPortraitUrl(heroId) {
  if (portraitOverrides.value[heroId]) return portraitOverrides.value[heroId]
  const path = `../../assets/heroes/${heroId}_portrait.png`
  return heroImages[path] || null
}

// --- Hero list sorted by rarity desc, then name asc ---
const heroes = computed(() => {
  return Object.values(heroTemplates).sort((a, b) => {
    if (b.rarity !== a.rarity) return b.rarity - a.rarity
    return a.name.localeCompare(b.name)
  })
})

// --- Asset prompts state ---
const assetPrompts = ref({ ...assetPromptsData })

// --- Modal state ---
const selectedHero = ref(null)

function openModal(hero) {
  selectedHero.value = hero
}

function closeModal() {
  selectedHero.value = null
}

// --- Save handlers ---
async function saveImage({ heroId, dataUrl, prompt }) {
  try {
    await fetch('/__admin/save-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetPath: `heroes/${heroId}.png`, dataUrl })
    })

    assetPrompts.value[heroId] = prompt
    await fetch('/__admin/save-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetPrompts.value)
    })

    imageOverrides.value[heroId] = dataUrl
  } catch (err) {
    alert('Failed to save image: ' + (err.message || err))
  }
}

async function savePortrait({ heroId, dataUrl }) {
  try {
    await fetch('/__admin/save-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetPath: `heroes/${heroId}_portrait.png`, dataUrl })
    })

    portraitOverrides.value[heroId] = dataUrl
  } catch (err) {
    alert('Failed to save portrait: ' + (err.message || err))
  }
}
</script>

<template>
  <div class="asset-viewer-heroes">
    <div class="heroes-grid">
      <HeroAssetCard
        v-for="hero in heroes"
        :key="hero.id"
        :hero="hero"
        :image-url="getImageUrl(hero.id)"
        :gif-url="getGifUrl(hero.id)"
        :portrait-url="getPortraitUrl(hero.id)"
        @select="openModal"
      />
    </div>

    <HeroAssetModal
      :hero="selectedHero"
      :image-url="selectedHero ? getImageUrl(selectedHero.id) : null"
      :gif-url="selectedHero ? getGifUrl(selectedHero.id) : null"
      :portrait-url="selectedHero ? getPortraitUrl(selectedHero.id) : null"
      :saved-prompt="selectedHero ? (assetPrompts[selectedHero.id] || null) : null"
      @close="closeModal"
      @save-image="saveImage"
      @save-portrait="savePortrait"
    />
  </div>
</template>

<style scoped>
.asset-viewer-heroes {
  padding: 16px;
}

.heroes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}
</style>
