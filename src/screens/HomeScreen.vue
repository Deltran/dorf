<script setup>
import { computed } from 'vue'
import { useHeroesStore, useGachaStore, useQuestsStore } from '../stores'
import HeroCard from '../components/HeroCard.vue'

const emit = defineEmits(['navigate'])

const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()
const questsStore = useQuestsStore()

const partyPreview = computed(() => {
  return heroesStore.partyHeroes.map(hero => {
    if (!hero) return null
    return heroesStore.getHeroFull(hero.instanceId)
  })
})

const hasParty = computed(() => {
  return heroesStore.party.some(id => id !== null)
})
</script>

<template>
  <div class="home-screen">
    <header class="home-header">
      <h1>Dorf</h1>
      <div class="gem-display">
        <span class="gem-icon">💎</span>
        <span class="gem-count">{{ gachaStore.gems }}</span>
      </div>
    </header>

    <section class="party-preview">
      <h2>Your Party</h2>
      <div v-if="hasParty" class="party-grid">
        <template v-for="(hero, index) in partyPreview" :key="index">
          <HeroCard
            v-if="hero"
            :hero="hero"
            compact
            @click="emit('navigate', 'heroes')"
          />
          <div v-else class="empty-slot" @click="emit('navigate', 'heroes')">
            <span>Empty</span>
          </div>
        </template>
      </div>
      <div v-else class="no-party">
        <p>No heroes in party!</p>
        <button @click="emit('navigate', 'gacha')">Summon Heroes</button>
      </div>
    </section>

    <nav class="main-nav">
      <button class="nav-button" @click="emit('navigate', 'gacha')">
        <span class="nav-icon">🎰</span>
        <span class="nav-label">Summon</span>
        <span class="nav-hint">Get new heroes</span>
      </button>

      <button class="nav-button" @click="emit('navigate', 'heroes')">
        <span class="nav-icon">👥</span>
        <span class="nav-label">Heroes</span>
        <span class="nav-hint">{{ heroesStore.heroCount }} owned</span>
      </button>

      <button
        class="nav-button"
        :disabled="!hasParty"
        @click="emit('navigate', 'worldmap')"
      >
        <span class="nav-icon">🗺️</span>
        <span class="nav-label">Quests</span>
        <span class="nav-hint">{{ questsStore.completedNodeCount }} cleared</span>
      </button>
    </nav>

    <footer class="home-footer">
      <p>Total Pulls: {{ gachaStore.totalPulls }}</p>
    </footer>
  </div>
</template>

<style scoped>
.home-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.home-header h1 {
  font-size: 2rem;
  color: #f3f4f6;
  margin: 0;
}

.gem-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1f2937;
  padding: 8px 16px;
  border-radius: 20px;
}

.gem-icon {
  font-size: 1.2rem;
}

.gem-count {
  font-size: 1.1rem;
  font-weight: 600;
  color: #60a5fa;
}

.party-preview h2 {
  font-size: 1rem;
  color: #9ca3af;
  margin-bottom: 12px;
}

.party-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.empty-slot {
  background: #1f2937;
  border: 2px dashed #4b5563;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-height: 100px;
}

.empty-slot:hover {
  border-color: #6b7280;
}

.empty-slot span {
  color: #6b7280;
  font-size: 0.9rem;
}

.no-party {
  text-align: center;
  padding: 40px;
  background: #1f2937;
  border-radius: 8px;
}

.no-party p {
  color: #9ca3af;
  margin-bottom: 16px;
}

.no-party button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.no-party button:hover {
  background: #2563eb;
}

.main-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.nav-button:hover:not(:disabled) {
  border-color: #4b5563;
  transform: translateX(4px);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-icon {
  font-size: 2rem;
}

.nav-label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #f3f4f6;
}

.nav-hint {
  margin-left: auto;
  color: #6b7280;
  font-size: 0.9rem;
}

.home-footer {
  text-align: center;
  color: #4b5563;
  font-size: 0.8rem;
}
</style>
