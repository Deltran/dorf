<script setup>
import { ref, onMounted, watch } from 'vue'
import { useHeroesStore, useGachaStore, useQuestsStore } from './stores'
import { saveGame, loadGame, hasSaveData } from './utils/storage.js'

import HomeScreen from './screens/HomeScreen.vue'
import GachaScreen from './screens/GachaScreen.vue'
import HeroesScreen from './screens/HeroesScreen.vue'
import WorldMapScreen from './screens/WorldMapScreen.vue'
import BattleScreen from './screens/BattleScreen.vue'

const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()
const questsStore = useQuestsStore()

const currentScreen = ref('home')
const isLoaded = ref(false)

// Load game on mount
onMounted(() => {
  const hasData = hasSaveData()

  if (hasData) {
    loadGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore })
  } else {
    // New player: give them a starter hero
    initNewPlayer()
  }

  isLoaded.value = true
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
    gachaStore.totalPulls,
    questsStore.completedNodes.length
  ],
  () => {
    if (isLoaded.value) {
      saveGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore })
    }
  },
  { deep: true }
)

function navigate(screen) {
  currentScreen.value = screen
}

function startBattle() {
  currentScreen.value = 'battle'
}
</script>

<template>
  <div class="app">
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

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #6b7280;
}
</style>
