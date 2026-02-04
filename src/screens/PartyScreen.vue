<script setup>
import { ref, computed, toRef, Teleport, Transition } from 'vue'
import { useHeroesStore } from '../stores'
import HeroCard from '../components/HeroCard.vue'
import { useSwipeToDismiss } from '../composables/useSwipeToDismiss.js'
import { getClass } from '../data/classes.js'

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

// Hero selection sheet state
const selectingSlot = ref(null)
const heroPickerRef = ref(null)
const isPickerOpen = computed(() => selectingSlot.value !== null)

useSwipeToDismiss({
  elementRef: heroPickerRef,
  isOpen: isPickerOpen,
  onClose: () => { selectingSlot.value = null }
})

// Available heroes (not in party, sorted by rarity then level)
const availableHeroes = computed(() => {
  return heroesStore.collection
    .filter(h => !heroesStore.party.includes(h.instanceId))
    .map(h => heroesStore.getHeroFull(h.instanceId))
    .sort((a, b) => {
      const rarityDiff = (b.template?.rarity || 1) - (a.template?.rarity || 1)
      if (rarityDiff !== 0) return rarityDiff
      return (b.level || 1) - (a.level || 1)
    })
})

// Role icons for hero picker
const roleIcons = {
  tank: '🛡️',
  dps: '⚔️',
  healer: '💚',
  support: '✨'
}

function getRoleIcon(classId) {
  const heroClass = getClass(classId)
  return roleIcons[heroClass?.role] || '❓'
}

const partySlots = computed(() => {
  return heroesStore.party.map((instanceId, index) => {
    if (!instanceId) return { index, hero: null }
    return { index, hero: heroesStore.getHeroFull(instanceId) }
  })
})

function openHeroPicker(slotIndex) {
  if (placingHero.value) {
    // If already placing from browse, use that flow
    if (!isInParty(placingHero.value.instanceId)) {
      heroesStore.setPartySlot(slotIndex, placingHero.value.instanceId)
      placingHero.value = null
    }
  } else {
    selectingSlot.value = slotIndex
  }
}

function selectHeroForSlot(hero) {
  if (selectingSlot.value === null) return
  heroesStore.setPartySlot(selectingSlot.value, hero.instanceId)
  selectingSlot.value = null
}

function closeHeroPicker() {
  selectingSlot.value = null
}

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

// === Party Synergy ===

// Count heroes by role
const roleCounts = computed(() => {
  const counts = { tank: 0, dps: 0, healer: 0, support: 0 }
  for (const slot of partySlots.value) {
    if (slot.hero) {
      const role = slot.hero.class?.role
      if (role && counts[role] !== undefined) {
        counts[role]++
      }
    }
  }
  return counts
})

// Total party size
const partySize = computed(() => {
  return partySlots.value.filter(s => s.hero).length
})

// Get current leader and their leader skill
const leaderHero = computed(() => {
  if (!heroesStore.partyLeader) return null
  return heroesStore.getHeroFull(heroesStore.partyLeader)
})

const leaderSkill = computed(() => {
  return leaderHero.value?.template?.leaderSkill || null
})

// Synergy messages based on party composition
const synergyMessages = computed(() => {
  const messages = []
  const { tank, dps, healer, support } = roleCounts.value

  if (partySize.value === 0) {
    return [{ type: 'empty', text: 'Your party awaits...' }]
  }

  if (partySize.value === 4) {
    // Full party feedback
    if (tank >= 1 && dps >= 1 && healer >= 1) {
      messages.push({ type: 'good', text: 'Balanced formation' })
    } else if (dps >= 3) {
      messages.push({ type: 'warning', text: 'Glass cannon — high risk, high reward' })
    } else if (tank >= 2 && healer >= 1) {
      messages.push({ type: 'info', text: 'Fortress comp — outlast them' })
    } else if (healer === 0) {
      messages.push({ type: 'warning', text: 'No healer — pack potions' })
    } else if (tank === 0 && healer >= 1) {
      messages.push({ type: 'info', text: 'No frontline — stay mobile' })
    }
  } else {
    // Incomplete party
    const emptySlots = 4 - partySize.value
    messages.push({
      type: 'incomplete',
      text: `${emptySlots} slot${emptySlots > 1 ? 's' : ''} open`
    })
  }

  return messages.length > 0 ? messages : [{ type: 'neutral', text: 'Ready for battle' }]
})
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

    <!-- Party Synergy Bar -->
    <div v-if="!placingHero" class="synergy-bar">
      <div class="role-counts">
        <div :class="['role-count', { active: roleCounts.tank > 0 }]">
          <span class="role-icon">🛡️</span>
          <span class="role-num">{{ roleCounts.tank }}</span>
        </div>
        <div :class="['role-count', { active: roleCounts.dps > 0 }]">
          <span class="role-icon">⚔️</span>
          <span class="role-num">{{ roleCounts.dps }}</span>
        </div>
        <div :class="['role-count', { active: roleCounts.healer > 0 }]">
          <span class="role-icon">💚</span>
          <span class="role-num">{{ roleCounts.healer }}</span>
        </div>
        <div :class="['role-count', { active: roleCounts.support > 0 }]">
          <span class="role-icon">✨</span>
          <span class="role-num">{{ roleCounts.support }}</span>
        </div>
      </div>
      <div class="synergy-message">
        <span
          v-for="(msg, i) in synergyMessages"
          :key="i"
          :class="['synergy-text', msg.type]"
        >{{ msg.text }}</span>
      </div>
    </div>

    <!-- Leader Skill Preview -->
    <div v-if="leaderSkill && !placingHero" class="leader-skill-bar">
      <div class="leader-skill-icon">👑</div>
      <div class="leader-skill-content">
        <div class="leader-skill-name">{{ leaderSkill.name }}</div>
        <div class="leader-skill-desc">{{ leaderSkill.description }}</div>
      </div>
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
              class="empty-slot clickable"
              @click="openHeroPicker(slot.index)"
            >
              <span class="slot-icon">+</span>
              <span class="slot-label">Add Hero</span>
            </div>
          </template>
        </div>
      </div>
    </section>

    <div class="party-actions">
      <button class="auto-fill-btn" @click="heroesStore.autoFillParty">
        <span class="btn-icon">✨</span>
        <span>Auto-Fill Party</span>
      </button>

      <button class="browse-btn" @click="emit('navigate', 'heroes')">
        <span class="btn-icon">⚔️</span>
        <span>Manage Heroes</span>
      </button>
    </div>

    <!-- Hero Picker Sheet -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isPickerOpen"
          class="picker-backdrop"
          @click="closeHeroPicker"
        ></div>
      </Transition>

      <Transition name="slide-up">
        <div
          v-if="isPickerOpen"
          ref="heroPickerRef"
          class="hero-picker-sheet"
        >
          <div class="picker-handle" @click="closeHeroPicker">
            <div class="handle-bar"></div>
          </div>

          <div class="picker-header">
            <h3>Select Hero</h3>
            <span class="picker-slot-label">Slot {{ (selectingSlot ?? 0) + 1 }}</span>
          </div>

          <div v-if="availableHeroes.length === 0" class="picker-empty">
            <p>No available heroes</p>
            <button class="picker-summon-btn" @click="emit('navigate', 'gacha'); closeHeroPicker()">
              Summon Heroes
            </button>
          </div>

          <div v-else class="picker-grid">
            <div
              v-for="hero in availableHeroes"
              :key="hero.instanceId"
              :class="['picker-hero', `rarity-${hero.template?.rarity || 1}`]"
              @click="selectHeroForSlot(hero)"
            >
              <div class="picker-hero-role">{{ getRoleIcon(hero.template?.classId) }}</div>
              <div class="picker-hero-name">{{ hero.template?.name }}</div>
              <div class="picker-hero-meta">
                <span class="picker-hero-class">{{ hero.class?.title }}</span>
                <span class="picker-hero-level">Lv.{{ hero.level || 1 }}</span>
              </div>
              <div class="picker-hero-stars">{{ '★'.repeat(hero.template?.rarity || 1) }}</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.party-screen {
  height: 100vh;
  padding: 16px;
  padding-top: calc(16px + var(--safe-area-top));
  padding-bottom: calc(12px + var(--safe-area-bottom));
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  overflow: hidden;
  background: #111827;
  box-sizing: border-box;
}

/* Synergy Bar */
.synergy-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #1a1f2e;
  border-radius: 10px;
  border: 1px solid #252b3b;
}

.role-counts {
  display: flex;
  gap: 12px;
}

.role-count {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.35;
  transition: opacity 0.2s ease-out;
}

.role-count.active {
  opacity: 1;
}

.role-count .role-icon {
  font-size: 1rem;
}

.role-count .role-num {
  font-size: 0.85rem;
  font-weight: 600;
  color: #9ca3af;
  min-width: 12px;
}

.role-count.active .role-num {
  color: #f3f4f6;
}

.synergy-message {
  display: flex;
  gap: 8px;
}

.synergy-text {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;
}

.synergy-text.empty {
  color: #6b7280;
  font-style: italic;
}

.synergy-text.incomplete {
  color: #9ca3af;
  background: #252b3b;
}

.synergy-text.good {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.1);
}

.synergy-text.warning {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
}

.synergy-text.info {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
}

.synergy-text.neutral {
  color: #9ca3af;
}

/* Leader Skill Bar */
.leader-skill-bar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(26, 31, 46, 1) 100%);
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.leader-skill-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  animation: subtlePulse 3s ease-in-out infinite;
}

@keyframes subtlePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(0.95); }
}

.leader-skill-content {
  flex: 1;
  min-width: 0;
}

.leader-skill-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fbbf24;
  margin-bottom: 2px;
}

.leader-skill-desc {
  font-size: 0.75rem;
  color: #9ca3af;
  line-height: 1.4;
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
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.party-slots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: 1fr 1fr;
  gap: 12px;
  height: 100%;
}

.party-slot {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow: hidden;
  min-height: 0;
}

/* Party Actions - pinned at bottom */
.party-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-top: 12px;
  position: relative;
  z-index: 1;
}

.party-slot.filled {
  border-color: #4b5563;
}

.party-slot-content {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
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
  margin-top: 6px;
  padding: 6px 10px;
  border: 1px solid #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  background: transparent;
  color: #9ca3af;
  transition: all 0.15s ease-out;
  flex-shrink: 0;
}

.remove-btn:hover {
  border-color: #4b5563;
  color: #d1d5db;
  background: rgba(75, 85, 99, 0.2);
}

.auto-fill-btn,
.browse-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 1px solid #4b5563;
  border-radius: 12px;
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 8px;
}

.auto-fill-btn:hover,
.browse-btn:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.1rem;
}

/* Empty slot redesign */
.slot-icon {
  font-size: 2rem;
  font-weight: 300;
  color: #4b5563;
  line-height: 1;
}

.empty-slot.clickable {
  cursor: pointer;
  border-color: #374151;
  background: rgba(55, 65, 81, 0.1);
}

.empty-slot.clickable:hover {
  background: rgba(55, 65, 81, 0.25);
  border-color: #4b5563;
}

.empty-slot.clickable:hover .slot-icon {
  color: #9ca3af;
}

/* Hero Picker Sheet */
.picker-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
}

.hero-picker-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 70vh;
  background: #1a1f2e;
  border-radius: 16px 16px 0 0;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
}

.picker-handle {
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;
  cursor: pointer;
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: #374151;
  border-radius: 2px;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 16px;
  border-bottom: 1px solid #2d3548;
}

.picker-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.picker-slot-label {
  font-size: 0.8rem;
  color: #6b7280;
  background: #252b3b;
  padding: 4px 10px;
  border-radius: 6px;
}

.picker-empty {
  padding: 40px 20px;
  text-align: center;
}

.picker-empty p {
  color: #6b7280;
  margin: 0 0 16px;
}

.picker-summon-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.picker-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #232936;
  border-radius: 10px;
  border-left: 3px solid #6b7280;
  cursor: pointer;
  transition: all 0.15s ease-out;
}

.picker-hero:hover {
  background: #2a3142;
  transform: translateX(2px);
}

.picker-hero:active {
  transform: translateX(1px) scale(0.99);
}

.picker-hero.rarity-1 { border-left-color: #9ca3af; }
.picker-hero.rarity-2 { border-left-color: #22c55e; }
.picker-hero.rarity-3 { border-left-color: #3b82f6; }
.picker-hero.rarity-4 { border-left-color: #a855f7; }
.picker-hero.rarity-5 { border-left-color: #f59e0b; }

.picker-hero-role {
  font-size: 1.25rem;
  width: 32px;
  text-align: center;
  flex-shrink: 0;
}

.picker-hero-name {
  flex: 1;
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.95rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-hero-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.picker-hero-class {
  font-size: 0.7rem;
  color: #6b7280;
}

.picker-hero-level {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
}

.picker-hero-stars {
  font-size: 0.7rem;
  color: #f59e0b;
  letter-spacing: -1px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
