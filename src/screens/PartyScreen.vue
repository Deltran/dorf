<script setup>
import { ref, computed } from 'vue'
import { useHeroesStore } from '../stores'
import HeroCard from '../components/HeroCard.vue'

const props = defineProps({
  placingHeroId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['navigate'])

const heroesStore = useHeroesStore()

const placingHero = ref(null)

// If a hero ID was passed for placement, load it
if (props.placingHeroId) {
  placingHero.value = heroesStore.getHeroFull(props.placingHeroId)
}

const partySlots = computed(() => {
  return heroesStore.party.map((instanceId, index) => {
    if (!instanceId) return { index, hero: null }
    return { index, hero: heroesStore.getHeroFull(instanceId) }
  })
})

function addToParty(slotIndex) {
  const heroToPlace = placingHero.value
  if (!heroToPlace) return
  heroesStore.setPartySlot(slotIndex, heroToPlace.instanceId)
  placingHero.value = null
}

function removeFromParty(slotIndex) {
  heroesStore.clearPartySlot(slotIndex)
}

function isInParty(instanceId) {
  return heroesStore.party.includes(instanceId)
}

function cancelPlacing() {
  placingHero.value = null
}

function isLeader(instanceId) {
  return heroesStore.partyLeader === instanceId
}

function toggleLeader(hero) {
  if (isLeader(hero.instanceId)) {
    heroesStore.setPartyLeader(null)
  } else {
    heroesStore.setPartyLeader(hero.instanceId)
  }
}
</script>

<template>
  <div class="party-screen">
    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'fellowship-hall')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Party</h1>
      <div class="header-spacer"></div>
    </header>

    <!-- Placement Bar -->
    <div v-if="placingHero" class="placement-bar">
      <div class="placement-info">
        <span class="placement-label">Placing:</span>
        <span class="placement-name">{{ placingHero.template.name }}</span>
      </div>
      <button class="cancel-btn" @click="cancelPlacing">Cancel</button>
    </div>

    <section class="party-section">
      <div class="party-slots">
        <div
          v-for="slot in partySlots"
          :key="slot.index"
          :class="['party-slot', { filled: slot.hero }]"
        >
          <template v-if="slot.hero">
            <div class="party-slot-content">
              <div v-if="isLeader(slot.hero.instanceId)" class="leader-crown">👑</div>
              <HeroCard
                :hero="slot.hero"
                showStats
                @click="toggleLeader(slot.hero)"
              />
            </div>
            <button
              class="remove-btn"
              @click.stop="removeFromParty(slot.index)"
            >
              <span>Remove</span>
            </button>
          </template>
          <template v-else>
            <div
              :class="['empty-slot', { clickable: placingHero && !isInParty(placingHero.instanceId) }]"
              @click="placingHero && !isInParty(placingHero.instanceId) && addToParty(slot.index)"
            >
              <span class="slot-number">{{ slot.index + 1 }}</span>
              <span class="slot-label">Empty Slot</span>
              <p v-if="placingHero && !isInParty(placingHero.instanceId)" class="slot-hint">Tap to add</p>
            </div>
          </template>
        </div>
      </div>

      <button class="auto-fill-btn" @click="heroesStore.autoFillParty">
        <span class="btn-icon">✨</span>
        <span>Auto-Fill Party</span>
      </button>

      <button class="browse-btn" @click="emit('navigate', 'heroes')">
        <span class="btn-icon">⚔️</span>
        <span>Browse Heroes</span>
      </button>
    </section>
  </div>
</template>

<style scoped>
.party-screen {
  min-height: 100vh;
  padding: 20px;
  padding-top: calc(20px + var(--safe-area-top));
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
  background: #111827;
}

/* Header */
.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.screen-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.header-spacer {
  width: 70px;
}

/* Placement Bar */
.placement-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 41, 59, 0.8) 100%);
  border: 1px solid #3b82f6;
  border-radius: 12px;
  position: relative;
  z-index: 1;
}

.placement-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.placement-label {
  color: #9ca3af;
}

.placement-name {
  color: #f3f4f6;
  font-weight: 600;
}

.cancel-btn {
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 1px solid #4b5563;
  color: #f3f4f6;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
}

/* Party Section */
.party-section {
  position: relative;
  z-index: 1;
}

.party-slots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.party-slot {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  padding: 12px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.party-slot.filled {
  border-color: #4b5563;
}

.party-slot-content {
  position: relative;
  flex: 1;
}

.leader-crown {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 1.5rem;
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  animation: crownBob 2s ease-in-out infinite;
}

@keyframes crownBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.party-slot .empty-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #334155;
  border-radius: 10px;
  color: #6b7280;
  transition: all 0.3s ease;
  gap: 4px;
}

.party-slot .empty-slot.clickable {
  cursor: pointer;
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.party-slot .empty-slot.clickable:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #60a5fa;
}

.slot-number {
  font-size: 2rem;
  font-weight: 700;
  color: #334155;
}

.slot-label {
  font-size: 0.8rem;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.slot-hint {
  margin: 8px 0 0 0;
  font-size: 0.75rem;
  color: #60a5fa;
}

.remove-btn {
  margin-top: 10px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

.auto-fill-btn,
.browse-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 1px solid #4b5563;
  border-radius: 12px;
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 12px;
}

.auto-fill-btn:hover,
.browse-btn:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.1rem;
}
</style>
