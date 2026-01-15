<script setup>
import { ref, computed } from 'vue'
import { useHeroesStore } from '../stores'
import HeroCard from '../components/HeroCard.vue'
import StarRating from '../components/StarRating.vue'
import { getHeroTemplate } from '../data/heroTemplates.js'
import { getClass } from '../data/classes.js'

const emit = defineEmits(['navigate'])

const heroesStore = useHeroesStore()

const selectedHero = ref(null)
const viewMode = ref('collection') // 'collection' or 'party'

const heroesWithData = computed(() => {
  return heroesStore.collection.map(hero => heroesStore.getHeroFull(hero.instanceId))
})

const sortedHeroes = computed(() => {
  return [...heroesWithData.value].sort((a, b) => {
    // Sort by rarity (desc), then level (desc)
    if (b.template.rarity !== a.template.rarity) {
      return b.template.rarity - a.template.rarity
    }
    return b.level - a.level
  })
})

const partySlots = computed(() => {
  return heroesStore.party.map((instanceId, index) => {
    if (!instanceId) return { index, hero: null }
    return { index, hero: heroesStore.getHeroFull(instanceId) }
  })
})

function selectHero(hero) {
  selectedHero.value = hero
}

function addToParty(slotIndex) {
  if (!selectedHero.value) return
  heroesStore.setPartySlot(slotIndex, selectedHero.value.instanceId)
}

function removeFromParty(slotIndex) {
  heroesStore.clearPartySlot(slotIndex)
}

function isInParty(instanceId) {
  return heroesStore.party.includes(instanceId)
}
</script>

<template>
  <div class="heroes-screen">
    <header class="heroes-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        ← Back
      </button>
      <h1>Heroes</h1>
      <span class="hero-count">{{ heroesStore.heroCount }} owned</span>
    </header>

    <div class="view-tabs">
      <button
        :class="['tab', { active: viewMode === 'collection' }]"
        @click="viewMode = 'collection'"
      >
        Collection
      </button>
      <button
        :class="['tab', { active: viewMode === 'party' }]"
        @click="viewMode = 'party'"
      >
        Party
      </button>
    </div>

    <!-- Party View -->
    <section v-if="viewMode === 'party'" class="party-section">
      <h2>Your Party</h2>
      <div class="party-slots">
        <div
          v-for="slot in partySlots"
          :key="slot.index"
          :class="['party-slot', { filled: slot.hero }]"
        >
          <template v-if="slot.hero">
            <HeroCard
              :hero="slot.hero"
              showStats
              @click="selectHero(slot.hero)"
            />
            <button
              class="remove-btn"
              @click.stop="removeFromParty(slot.index)"
            >
              Remove
            </button>
          </template>
          <template v-else>
            <div class="empty-slot">
              <span>Slot {{ slot.index + 1 }}</span>
              <p v-if="selectedHero">Click to add</p>
            </div>
            <button
              v-if="selectedHero && !isInParty(selectedHero.instanceId)"
              class="add-btn"
              @click="addToParty(slot.index)"
            >
              Add {{ selectedHero.template.name }}
            </button>
          </template>
        </div>
      </div>

      <button class="auto-fill-btn" @click="heroesStore.autoFillParty">
        Auto-Fill Party
      </button>
    </section>

    <!-- Collection View -->
    <section v-if="viewMode === 'collection'" class="collection-section">
      <div v-if="sortedHeroes.length === 0" class="empty-collection">
        <p>No heroes yet!</p>
        <button @click="emit('navigate', 'gacha')">Summon Heroes</button>
      </div>

      <div v-else class="hero-grid">
        <HeroCard
          v-for="hero in sortedHeroes"
          :key="hero.instanceId"
          :hero="hero"
          :selected="selectedHero?.instanceId === hero.instanceId"
          showStats
          @click="selectHero(hero)"
        />
      </div>
    </section>

    <!-- Hero Detail Panel -->
    <aside v-if="selectedHero" class="hero-detail">
      <div class="detail-header">
        <h3>{{ selectedHero.template.name }}</h3>
        <button class="close-detail" @click="selectedHero = null">×</button>
      </div>

      <div class="detail-body">
        <div class="detail-row">
          <span class="label">Class</span>
          <span>{{ selectedHero.class.title }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Role</span>
          <span>{{ selectedHero.class.role }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Rarity</span>
          <StarRating :rating="selectedHero.template.rarity" />
        </div>
        <div class="detail-row">
          <span class="label">Level</span>
          <span>{{ selectedHero.level }}</span>
        </div>

        <h4>Stats</h4>
        <div class="stats-grid">
          <div class="stat">
            <span class="stat-label">HP</span>
            <span class="stat-value">{{ selectedHero.stats.hp }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">ATK</span>
            <span class="stat-value">{{ selectedHero.stats.atk }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">DEF</span>
            <span class="stat-value">{{ selectedHero.stats.def }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">SPD</span>
            <span class="stat-value">{{ selectedHero.stats.spd }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">{{ selectedHero.class.resourceName }}</span>
            <span class="stat-value">{{ selectedHero.stats.mp }}</span>
          </div>
        </div>

        <h4>Skill</h4>
        <div class="skill-info">
          <div class="skill-name">{{ selectedHero.template.skill.name }}</div>
          <div class="skill-cost">
            Cost: {{ selectedHero.template.skill.mpCost }} {{ selectedHero.class.resourceName }}
          </div>
          <div class="skill-desc">{{ selectedHero.template.skill.description }}</div>
        </div>

        <div class="detail-actions">
          <span v-if="isInParty(selectedHero.instanceId)" class="in-party-badge">
            In Party
          </span>
          <button
            v-else
            class="add-to-party-btn"
            @click="viewMode = 'party'"
          >
            Add to Party
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.heroes-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.heroes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1rem;
  cursor: pointer;
  padding: 8px;
}

.back-button:hover {
  color: #f3f4f6;
}

.heroes-header h1 {
  font-size: 1.5rem;
  color: #f3f4f6;
  margin: 0;
}

.hero-count {
  color: #6b7280;
  font-size: 0.9rem;
}

.view-tabs {
  display: flex;
  gap: 8px;
}

.tab {
  flex: 1;
  padding: 12px;
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 8px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab.active {
  border-color: #3b82f6;
  color: #f3f4f6;
}

.party-section h2 {
  font-size: 1rem;
  color: #9ca3af;
  margin-bottom: 16px;
}

.party-slots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.party-slot {
  background: #1f2937;
  border-radius: 12px;
  padding: 12px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.party-slot .empty-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #374151;
  border-radius: 8px;
  color: #6b7280;
}

.remove-btn, .add-btn {
  margin-top: 8px;
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}

.remove-btn {
  background: #dc2626;
  color: white;
}

.add-btn {
  background: #3b82f6;
  color: white;
}

.auto-fill-btn {
  width: 100%;
  padding: 12px;
  background: #374151;
  border: none;
  border-radius: 8px;
  color: #f3f4f6;
  cursor: pointer;
}

.auto-fill-btn:hover {
  background: #4b5563;
}

.collection-section {
  flex: 1;
}

.empty-collection {
  text-align: center;
  padding: 40px;
  background: #1f2937;
  border-radius: 8px;
}

.empty-collection p {
  color: #9ca3af;
  margin-bottom: 16px;
}

.empty-collection button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.hero-detail {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1f2937;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.detail-header h3 {
  color: #f3f4f6;
  margin: 0;
}

.close-detail {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #374151;
  color: #f3f4f6;
}

.label {
  color: #6b7280;
}

.detail-body h4 {
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 16px 0 8px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.stat {
  background: #374151;
  padding: 8px;
  border-radius: 6px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.7rem;
  color: #6b7280;
}

.stat-value {
  font-weight: 600;
  color: #f3f4f6;
}

.skill-info {
  background: #374151;
  padding: 12px;
  border-radius: 8px;
}

.skill-name {
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 4px;
}

.skill-cost {
  font-size: 0.8rem;
  color: #60a5fa;
  margin-bottom: 8px;
}

.skill-desc {
  font-size: 0.85rem;
  color: #9ca3af;
}

.detail-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.in-party-badge {
  background: #22c55e;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.add-to-party-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
}
</style>
