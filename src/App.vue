<script setup>
import { ref, onMounted, watch } from 'vue'
import { useHeroesStore, useGachaStore, useQuestsStore, useInventoryStore } from './stores'
import { saveGame, loadGame, hasSaveData } from './utils/storage.js'

import HomeScreen from './screens/HomeScreen.vue'
import GachaScreen from './screens/GachaScreen.vue'
import HeroesScreen from './screens/HeroesScreen.vue'
import WorldMapScreen from './screens/WorldMapScreen.vue'
import BattleScreen from './screens/BattleScreen.vue'
import InventoryScreen from './screens/InventoryScreen.vue'
import ShardsScreen from './screens/ShardsScreen.vue'
import MergeScreen from './screens/MergeScreen.vue'
import AdminScreen from './screens/AdminScreen.vue'

const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()
const questsStore = useQuestsStore()
const inventoryStore = useInventoryStore()

const currentScreen = ref('home')
const isLoaded = ref(false)
const initialHeroId = ref(null)

// Load game on mount
onMounted(() => {
  const hasData = hasSaveData()

  if (hasData) {
    loadGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore, inventory: inventoryStore })
  } else {
    // New player: give them a starter hero
    initNewPlayer()
  }

  isLoaded.value = true

  // Dev-only: Ctrl+Shift+A opens admin
  if (import.meta.env.DEV) {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        currentScreen.value = 'admin'
      }
    })
  }
})

function initNewPlayer() {
  // Give the player a guaranteed 3-star hero to start
  heroesStore.addHero('town_guard')
  heroesStore.autoFillParty()
}

// Auto-save when relevant state changes
watch(
  () => [
    heroesStore.collection.length,
    heroesStore.party,
    gachaStore.gems,
    gachaStore.gold,
    gachaStore.totalPulls,
    questsStore.completedNodes.length,
    inventoryStore.totalItemCount
  ],
  () => {
    if (isLoaded.value) {
      saveGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore, inventory: inventoryStore })
    }
  },
  { deep: true }
)

function navigate(screen, heroId = null) {
  currentScreen.value = screen
  initialHeroId.value = heroId
}

function startBattle() {
  currentScreen.value = 'battle'
}
</script>

<template>
  <div :class="['app', { 'full-width': currentScreen === 'admin' }]">
    <template v-if="isLoaded">
      <HomeScreen
        v-if="currentScreen === 'home'"
        @navigate="navigate"
      />
      <GachaScreen
        v-else-if="currentScreen === 'gacha'"
        @navigate="navigate"
      />
      <HeroesScreen
        v-else-if="currentScreen === 'heroes'"
        :initial-hero-id="initialHeroId"
        @navigate="navigate"
      />
      <WorldMapScreen
        v-else-if="currentScreen === 'worldmap'"
        @navigate="navigate"
        @startBattle="startBattle"
      />
      <BattleScreen
        v-else-if="currentScreen === 'battle'"
        @navigate="navigate"
      />
      <InventoryScreen
        v-else-if="currentScreen === 'inventory'"
        @navigate="navigate"
      />
      <ShardsScreen
        v-else-if="currentScreen === 'shards'"
        @navigate="navigate"
      />
      <MergeScreen
        v-else-if="currentScreen === 'merge'"
        @navigate="navigate"
      />
      <AdminScreen
        v-else-if="currentScreen === 'admin'"
        @navigate="navigate"
      />
    </template>

    <div v-else class="loading">
      <p>Loading...</p>
    </div>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: #111827;
  color: #f3f4f6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  min-height: 100vh;
  max-width: 600px;
  margin: 0 auto;
}

.app.full-width {
  max-width: none;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #6b7280;
}
</style>
