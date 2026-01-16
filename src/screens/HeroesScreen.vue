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
const placingHero = ref(null) // hero being placed into party
const heroImageError = ref(false)

// Import all hero images
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })

function getHeroImageUrl(heroId) {
  const path = `../assets/heroes/${heroId}.png`
  return heroImages[path] || null
}

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
  heroImageError.value = false
}

function addToParty(slotIndex) {
  const heroToPlace = placingHero.value || selectedHero.value
  if (!heroToPlace) return
  heroesStore.setPartySlot(slotIndex, heroToPlace.instanceId)
  placingHero.value = null
}

function startPlacing(hero) {
  placingHero.value = hero
  viewMode.value = 'party'
}

function cancelPlacing() {
  placingHero.value = null
}

function removeFromParty(slotIndex) {
  heroesStore.clearPartySlot(slotIndex)
}

function isInParty(instanceId) {
  return heroesStore.party.includes(instanceId)
}

const roleIcons = {
  tank: '🛡️',
  dps: '⚔️',
  healer: '💚',
  support: '✨'
}

function getRoleIcon(role) {
  return roleIcons[role] || '❓'
}

function getLevelDisplay(level) {
  return level >= 250 ? 'Master' : level
}

function getExpToNextLevel(level) {
  return 100 * level
}

function getExpProgress(hero) {
  if (hero.level >= 250) return { current: 0, needed: 0, percent: 100 }
  const needed = getExpToNextLevel(hero.level)
  const percent = Math.floor((hero.exp / needed) * 100)
  return { current: hero.exp, needed, percent }
}
</script>

<template>
  <div class="heroes-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="heroes-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Heroes</h1>
      <div class="hero-count-badge">
        <span class="count-value">{{ heroesStore.heroCount }}</span>
        <span class="count-label">owned</span>
      </div>
    </header>

    <div class="view-tabs">
      <button
        :class="['tab', { active: viewMode === 'collection' }]"
        @click="viewMode = 'collection'"
      >
        <span class="tab-icon">📚</span>
        <span class="tab-label">Collection</span>
      </button>
      <button
        :class="['tab', { active: viewMode === 'party' }]"
        @click="viewMode = 'party'"
      >
        <span class="tab-icon">⚔️</span>
        <span class="tab-label">Party</span>
      </button>
    </div>

    <!-- Party View -->
    <section v-if="viewMode === 'party'" class="party-section">
      <div class="section-header">
        <div class="section-line"></div>
        <h2>Your Party</h2>
        <div class="section-line"></div>
      </div>
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
    </section>

    <!-- Collection View -->
    <section v-if="viewMode === 'collection'" class="collection-section">
      <div v-if="sortedHeroes.length === 0" class="empty-collection">
        <div class="empty-icon">⚔️</div>
        <p>No heroes yet!</p>
        <button class="summon-cta" @click="emit('navigate', 'gacha')">
          <span>Summon Heroes</span>
        </button>
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

    <!-- Placement Bar -->
    <div v-if="placingHero" class="placement-bar">
      <div class="placement-info">
        <span class="placement-label">Placing:</span>
        <span class="placement-name">{{ placingHero.template.name }}</span>
      </div>
      <button class="cancel-btn" @click="cancelPlacing">Cancel</button>
    </div>

    <!-- Hero Detail Backdrop -->
    <div
      v-if="selectedHero && !placingHero"
      class="detail-backdrop"
      @click="selectedHero = null"
    ></div>

    <!-- Hero Detail Panel -->
    <aside v-if="selectedHero && !placingHero" :class="['hero-detail', `rarity-${selectedHero.template.rarity}`]">
      <div class="detail-header">
        <div class="header-left">
          <img
            v-if="getHeroImageUrl(selectedHero.template.id) && !heroImageError"
            :src="getHeroImageUrl(selectedHero.template.id)"
            :alt="selectedHero.template.name"
            class="hero-portrait"
            @error="heroImageError = true"
          />
          <div class="header-info">
            <h3>{{ selectedHero.template.name }}</h3>
            <StarRating :rating="selectedHero.template.rarity" />
          </div>
        </div>
        <button class="close-detail" @click="selectedHero = null">×</button>
      </div>

      <div class="detail-body">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Class</span>
            <span class="info-value">{{ selectedHero.class.title }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Role</span>
            <span class="info-value">{{ getRoleIcon(selectedHero.class.role) }} {{ selectedHero.class.role }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Level</span>
            <span class="info-value level">{{ getLevelDisplay(selectedHero.level) }}</span>
          </div>
        </div>

        <div v-if="selectedHero.level < 250" class="exp-section">
          <div class="exp-header">
            <span class="exp-label">Experience</span>
            <span class="exp-text">{{ getExpProgress(selectedHero).current }} / {{ getExpProgress(selectedHero).needed }}</span>
          </div>
          <div class="exp-bar-container">
            <div
              class="exp-bar-fill"
              :style="{ width: getExpProgress(selectedHero).percent + '%' }"
            ></div>
          </div>
        </div>

        <div class="section-header stats-header">
          <div class="section-line"></div>
          <h4>Stats</h4>
          <div class="section-line"></div>
        </div>
        <div class="stats-grid">
          <div class="stat">
            <span class="stat-icon">❤️</span>
            <span class="stat-value">{{ selectedHero.stats.hp }}</span>
            <span class="stat-label">HP</span>
          </div>
          <div class="stat">
            <span class="stat-icon">⚔️</span>
            <span class="stat-value">{{ selectedHero.stats.atk }}</span>
            <span class="stat-label">ATK</span>
          </div>
          <div class="stat">
            <span class="stat-icon">🛡️</span>
            <span class="stat-value">{{ selectedHero.stats.def }}</span>
            <span class="stat-label">DEF</span>
          </div>
          <div class="stat">
            <span class="stat-icon">💨</span>
            <span class="stat-value">{{ selectedHero.stats.spd }}</span>
            <span class="stat-label">SPD</span>
          </div>
          <div class="stat">
            <span class="stat-icon">💧</span>
            <span class="stat-value">{{ selectedHero.stats.mp }}</span>
            <span class="stat-label">{{ selectedHero.class.resourceName }}</span>
          </div>
        </div>

        <div class="section-header skills-header">
          <div class="section-line"></div>
          <h4>{{ selectedHero.template.skills ? 'Skills' : 'Skill' }}</h4>
          <div class="section-line"></div>
        </div>
        <div v-if="selectedHero.template.skills" class="skills-list">
          <div
            v-for="(skill, index) in selectedHero.template.skills"
            :key="index"
            class="skill-info"
          >
            <div class="skill-header">
              <span class="skill-name">{{ skill.name }}</span>
              <span v-if="skill.skillUnlockLevel" class="skill-unlock">Lv.{{ skill.skillUnlockLevel }}</span>
            </div>
            <div class="skill-cost">{{ skill.mpCost }} {{ selectedHero.class.resourceName }}</div>
            <div class="skill-desc">{{ skill.description }}</div>
          </div>
        </div>
        <div v-else-if="selectedHero.template.skill" class="skills-list">
          <div class="skill-info">
            <div class="skill-header">
              <span class="skill-name">{{ selectedHero.template.skill.name }}</span>
            </div>
            <div class="skill-cost">{{ selectedHero.template.skill.mpCost }} {{ selectedHero.class.resourceName }}</div>
            <div class="skill-desc">{{ selectedHero.template.skill.description }}</div>
          </div>
        </div>

        <div class="detail-actions">
          <span v-if="isInParty(selectedHero.instanceId)" class="in-party-badge">
            <span class="badge-icon">✓</span>
            <span>In Party</span>
          </span>
          <button
            v-else
            class="add-to-party-btn"
            @click="startPlacing(selectedHero)"
          >
            <span>Add to Party</span>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* ===== Base Layout ===== */
.heroes-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

/* ===== Animated Background ===== */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-gradient {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e1b4b 25%,
    #7f1d1d 50%,
    #1e1b4b 75%,
    #0f172a 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  opacity: 0.03;
  background-image:
    radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  z-index: -1;
}

/* ===== Header ===== */
.heroes-header {
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
  text-shadow: 0 2px 10px rgba(239, 68, 68, 0.3);
}

.hero-count-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid #334155;
}

.count-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f3f4f6;
}

.count-label {
  font-size: 0.65rem;
  color: #6b7280;
  text-transform: uppercase;
}

/* ===== View Tabs ===== */
.view-tabs {
  display: flex;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 2px solid #374151;
  border-radius: 12px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab:hover {
  border-color: #4b5563;
}

.tab.active {
  border-color: #3b82f6;
  color: #f3f4f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 41, 59, 0.8) 100%);
}

.tab-icon {
  font-size: 1.1rem;
}

.tab-label {
  font-weight: 600;
}

/* ===== Section Headers ===== */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-header h2, .section-header h4 {
  font-size: 0.8rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
  white-space: nowrap;
}

.section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #374151 50%, transparent 100%);
}

/* ===== Party Section ===== */
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

.auto-fill-btn {
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
}

.auto-fill-btn:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.1rem;
}

/* ===== Collection Section ===== */
.collection-section {
  flex: 1;
  position: relative;
  z-index: 1;
}

.empty-collection {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border-radius: 16px;
  border: 1px solid #334155;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-collection p {
  color: #9ca3af;
  margin-bottom: 20px;
  font-size: 1rem;
}

.summon-cta {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.summon-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

/* ===== Detail Panel ===== */
.detail-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 99;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.hero-detail {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px 20px 0 0;
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
  animation: slideUp 0.3s ease;
  border: 1px solid #334155;
  border-bottom: none;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.hero-detail::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 20px 20px 0 0;
}

.hero-detail.rarity-1::before { background: linear-gradient(90deg, #9ca3af 0%, transparent 100%); }
.hero-detail.rarity-2::before { background: linear-gradient(90deg, #22c55e 0%, transparent 100%); }
.hero-detail.rarity-3::before { background: linear-gradient(90deg, #3b82f6 0%, transparent 100%); }
.hero-detail.rarity-4::before { background: linear-gradient(90deg, #a855f7 0%, transparent 100%); }
.hero-detail.rarity-5::before { background: linear-gradient(90deg, #f59e0b 0%, transparent 100%); }

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-portrait {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid #374151;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-info h3 {
  color: #f3f4f6;
  margin: 0;
  font-size: 1.2rem;
}

.close-detail {
  background: rgba(55, 65, 81, 0.5);
  border: 1px solid #4b5563;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 1.3rem;
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-detail:hover {
  background: rgba(55, 65, 81, 0.8);
  color: #f3f4f6;
}

/* ===== Info Grid ===== */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: rgba(55, 65, 81, 0.3);
  border-radius: 10px;
  gap: 4px;
}

.info-label {
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
}

.info-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f3f4f6;
}

.info-value.level {
  font-size: 1.1rem;
  color: #60a5fa;
}

/* ===== EXP Section ===== */
.exp-section {
  margin-bottom: 20px;
}

.exp-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.exp-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
}

.exp-text {
  color: #a78bfa;
  font-size: 0.85rem;
  font-weight: 600;
}

.exp-bar-container {
  height: 10px;
  background: #374151;
  border-radius: 5px;
  overflow: hidden;
}

.exp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%);
  border-radius: 5px;
  transition: width 0.3s ease;
}

/* ===== Stats Grid ===== */
.stats-header, .skills-header {
  margin-top: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: rgba(55, 65, 81, 0.3);
  padding: 10px 6px;
  border-radius: 10px;
  transition: transform 0.2s ease;
}

.stat:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 1rem;
}

.stat-value {
  font-weight: 700;
  color: #f3f4f6;
  font-size: 1rem;
}

.stat-label {
  font-size: 0.6rem;
  color: #6b7280;
  text-transform: uppercase;
}

/* ===== Skills ===== */
.skills-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skill-info {
  background: rgba(55, 65, 81, 0.3);
  padding: 14px;
  border-radius: 12px;
  border-left: 3px solid #60a5fa;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.skill-name {
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.95rem;
}

.skill-unlock {
  font-size: 0.65rem;
  font-weight: 600;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
  padding: 3px 8px;
  border-radius: 6px;
}

.skill-cost {
  font-size: 0.8rem;
  color: #60a5fa;
  margin-bottom: 8px;
}

.skill-desc {
  font-size: 0.85rem;
  color: #9ca3af;
  line-height: 1.4;
}

/* ===== Detail Actions ===== */
.detail-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.in-party-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 0.95rem;
  font-weight: 600;
}

.badge-icon {
  font-size: 1rem;
}

.add-to-party-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.add-to-party-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

/* ===== Placement Bar ===== */
.placement-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -8px 20px rgba(0, 0, 0, 0.5);
  border-top: 2px solid #3b82f6;
  z-index: 98;
  animation: slideUp 0.2s ease;
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
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
}
</style>
