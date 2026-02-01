<script setup>
import { ref, computed } from 'vue'
import { getAllHeroTemplates } from '../../data/heroes/index.js'
import HeroCard from '../../components/HeroCard.vue'

const emit = defineEmits(['select'])

const searchQuery = ref('')
const rarityFilter = ref(0) // 0 = all

const allHeroes = getAllHeroTemplates()

const filteredHeroes = computed(() => {
  let heroes = allHeroes

  if (rarityFilter.value > 0) {
    heroes = heroes.filter(h => h.rarity === rarityFilter.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    heroes = heroes.filter(h =>
      h.name.toLowerCase().includes(query) ||
      h.id.toLowerCase().includes(query)
    )
  }

  return heroes.sort((a, b) => {
    if (b.rarity !== a.rarity) return b.rarity - a.rarity
    return a.name.localeCompare(b.name)
  })
})

// Wrap template as hero object for HeroCard compatibility
function wrapAsHero(template) {
  return {
    templateId: template.id,
    level: 1
  }
}

function selectHero(hero) {
  // hero is the wrapped object from HeroCard click, find original template
  const template = allHeroes.find(t => t.id === hero.templateId)
  emit('select', template)
}
</script>

<template>
  <div class="hero-picker">
    <div class="filters">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Search by name or id..."
      />
      <select v-model="rarityFilter" class="rarity-select">
        <option :value="0">All</option>
        <option :value="5">5 star</option>
        <option :value="4">4 star</option>
        <option :value="3">3 star</option>
        <option :value="2">2 star</option>
        <option :value="1">1 star</option>
      </select>
    </div>

    <div v-if="filteredHeroes.length === 0" class="no-results">
      No heroes found
    </div>

    <div v-else class="hero-grid">
      <div
        v-for="hero in filteredHeroes"
        :key="hero.id"
        class="hero-item"
        @click="selectHero(wrapAsHero(hero))"
      >
        <HeroCard
          :hero="wrapAsHero(hero)"
          compact
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-picker {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filters {
  display: flex;
  gap: 12px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 0.9rem;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:focus {
  outline: none;
  border-color: #6b7280;
}

.rarity-select {
  padding: 8px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 0.9rem;
  cursor: pointer;
}

.rarity-select:focus {
  outline: none;
  border-color: #6b7280;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.hero-item {
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}

.hero-item:hover {
  background-color: rgba(75, 85, 99, 0.3);
}

.no-results {
  text-align: center;
  color: #9ca3af;
  padding: 32px;
  font-size: 0.95rem;
}
</style>
