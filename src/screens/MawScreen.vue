<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMawStore } from '../stores/maw.js'
import { useHeroesStore } from '../stores/heroes.js'
import { useGachaStore } from '../stores/gacha.js'
import { SeededRandom } from '../utils/seededRandom.js'
import { generateWaveEnemies } from '../data/maw/enemies.js'
import { TIER_CONFIG, WAVE_COUNT, BOSS_WAVE } from '../data/maw/waves.js'
import DregsShopPanel from '../components/DregsShopPanel.vue'
import dregsIcon from '../assets/icons/valor_marks.png'
import BoonSelectionOverlay from '../components/BoonSelectionOverlay.vue'
import skullIcon from '../assets/icons/skull.png'
import swordsIcon from '../assets/icons/crossed_swords.png'
import goldIcon from '../assets/icons/gold.png'
import gemsIcon from '../assets/icons/gems.png'
import lockIcon from '../assets/icons/lock.png'
import mawBg from '../assets/backgrounds/the_maw_bg.png'

const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })

function getHeroImageUrl(heroId) {
  const gifPath = `../assets/heroes/${heroId}.gif`
  if (heroGifs[gifPath]) return heroGifs[gifPath]
  const pngPath = `../assets/heroes/${heroId}.png`
  return heroImages[pngPath] || null
}

const emit = defineEmits(['navigate', 'back', 'startMawBattle'])

const mawStore = useMawStore()
const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()

const showShop = ref(false)
const showRewardSummary = ref(false)
const showCloseConfirmation = ref(false)
const claimedRewards = ref(null)
const expandedBoon = ref(null)

function toggleBoon(boon) {
  expandedBoon.value = expandedBoon.value?.id === boon.id ? null : boon
}

function closeBoonPopup() {
  expandedBoon.value = null
}

// Daily reset countdown
const resetCountdown = ref('')
let countdownInterval = null

function updateCountdown() {
  const now = new Date()
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  const diff = tomorrow - now
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  resetCountdown.value = `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
}

// Tier definitions — escalating dread
const tierData = {
  1: { name: 'The Gullet', flavor: 'The walls are still wet here.', color: '#4ade80', colorDim: 'rgba(74, 222, 128, 0.08)', borderColor: 'rgba(74, 222, 128, 0.25)' },
  2: { name: 'The Bile Pit', flavor: 'Something dissolves below.', color: '#f59e0b', colorDim: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)' },
  3: { name: 'The Marrow', flavor: 'The bones remember.', color: '#ef4444', colorDim: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)' },
  4: { name: 'The Abyss', flavor: 'Light does not return.', color: '#a855f7', colorDim: 'rgba(168, 85, 247, 0.08)', borderColor: 'rgba(168, 85, 247, 0.25)' },
  5: { name: 'The Heart', flavor: 'It beats for you.', color: '#f59e0b', colorDim: 'rgba(245, 158, 11, 0.06)', borderColor: 'rgba(245, 158, 11, 0.3)' }
}

// Computed state
const hasActiveRun = computed(() => !!mawStore.activeRun)
const tierLocked = computed(() => mawStore.selectedTier !== null)
const isClosed = computed(() => mawStore.closed)
const restBonus = computed(() => mawStore.daysSkipped > 0 ? mawStore.getRestBonusMultiplier() : null)
const hasPendingRewards = computed(() => !!mawStore.pendingRewards)

const showBoonSelection = computed(() => {
  return mawStore.activeRun?.pendingBoonSelection && mawStore.activeRun?.boonOfferings?.length > 0
})
const justWonWave = ref(false)

const currentWaveLabel = computed(() => {
  if (!mawStore.activeRun) return ''
  const wave = mawStore.activeRun.wave
  if (wave === BOSS_WAVE) return 'BOSS'
  return `Wave ${wave}`
})

const currentPhaseLabel = computed(() => {
  if (!mawStore.activeRun) return ''
  const wave = mawStore.activeRun.wave
  if (wave <= 3) return 'Warm-up'
  if (wave <= 7) return 'Pressure'
  if (wave <= 10) return 'Danger'
  return 'Boss'
})

const phaseColor = computed(() => {
  if (!mawStore.activeRun) return '#6b7280'
  const wave = mawStore.activeRun.wave
  if (wave <= 3) return '#22c55e'
  if (wave <= 7) return '#f59e0b'
  if (wave <= 10) return '#ef4444'
  return '#a855f7'
})

// "One more run" messaging
const wavesFromBoss = computed(() => BOSS_WAVE - mawStore.lastRunDepth)
const proximityMessage = computed(() => {
  if (mawStore.lastRunDepth === 0) return null
  const remaining = wavesFromBoss.value
  if (remaining <= 1) return 'You were at the boss doorstep.'
  if (remaining <= 3) return `${remaining} waves from the boss.`
  return null
})

const lastRunFlavorLines = [
  'The Maw remembers your scent.',
  'It stirs again.',
  'The descent calls.',
  'Deeper, this time.',
  'The dark is patient.'
]

const lastRunFlavor = computed(() => {
  if (mawStore.runAttempts <= 0) return null
  return lastRunFlavorLines[mawStore.runAttempts % lastRunFlavorLines.length]
})

// Party display
const hasParty = computed(() => {
  return heroesStore.party.some(slot => slot !== null)
})

const partySlots = computed(() => {
  return heroesStore.party.map(instanceId => {
    if (!instanceId) return null
    const hero = heroesStore.getHeroFull(instanceId)
    return hero || null
  })
})

const partyCount = computed(() => partySlots.value.filter(Boolean).length)

const roleIcons = { tank: '\u{1F6E1}\uFE0F', dps: '\u2694\uFE0F', healer: '\u{1F49A}', support: '\u2728' }

// Active run party with resource state (preserves empty slots)
const runPartySlots = computed(() => {
  if (!mawStore.activeRun) return []
  const state = mawStore.activeRun.partyState
  return heroesStore.party.map(instanceId => {
    if (!instanceId) return null
    const hero = heroesStore.getHeroFull(instanceId)
    if (!hero) return null
    const stats = heroesStore.getHeroStats(instanceId)
    const saved = state ? state[instanceId] : null
    const currentHp = saved ? saved.currentHp : stats.hp
    return {
      instanceId,
      name: hero.template.name,
      templateId: hero.template.id,
      level: hero.level || 1,
      rarity: hero.template.rarity,
      role: hero.class?.role,
      currentHp,
      maxHp: stats.hp,
      currentMp: saved ? saved.currentMp : Math.floor(stats.mp * 0.3),
      maxMp: stats.mp,
      isDead: currentHp <= 0
    }
  })
})

// Actions
function handleSelectTier(tier) {
  if (isClosed.value) return
  if (tierLocked.value) return
  if (!mawStore.tierUnlocks[tier]) return

  const result = mawStore.selectTier(tier)
  if (result.success) {
    startNewRun()
  }
}

function startNewRun() {
  const result = mawStore.startRun()
  if (result.success) {
    startWaveBattle()
  }
}

function retryRun() {
  mawStore.endRun()
  startNewRun()
}

function startWaveBattle() {
  const run = mawStore.activeRun
  if (!run) return

  // Generate enemies for this wave
  const seed = mawStore.getDailySeed()
  const rng = new SeededRandom(seed + run.wave * 1000)
  const waveEnemies = generateWaveEnemies(rng, run.wave, run.tier)

  // Get party state (first wave uses fresh, subsequent use saved)
  let partyState = run.partyState
  if (!partyState) {
    // First wave — build fresh party state
    partyState = {}
    for (const instanceId of heroesStore.party.filter(Boolean)) {
      const stats = heroesStore.getHeroStats(instanceId)
      partyState[instanceId] = {
        currentHp: stats.hp,
        currentMp: Math.floor(stats.mp * 0.3)
      }
    }
  } else {
    // Apply between-wave recovery
    partyState = mawStore.applyBetweenWaveRecovery(partyState)
  }

  emit('startMawBattle', {
    partyState,
    enemies: waveEnemies.map(e => e.templateId),
    boons: run.boons,
    wave: run.wave
  })
}

function handleBoonSelected(boonId) {
  mawStore.selectBoon(boonId)
  justWonWave.value = false
  // Player lands on the active run panel with "Continue Run"
}

// Close confirmation preview
const closePreviewRewards = computed(() => {
  if (!mawStore.pendingRewards) return null
  const multiplier = mawStore.getRestBonusMultiplier()
  return {
    gold: Math.floor(mawStore.pendingRewards.gold * multiplier),
    gems: Math.floor((mawStore.pendingRewards.gems || 0) * multiplier),
    dregs: Math.floor(mawStore.pendingRewards.dregs * multiplier)
  }
})

function confirmCloseMaw() {
  const result = mawStore.closeMaw()
  if (result.success && result.rewards) {
    if (result.rewards.gold) gachaStore.addGold(result.rewards.gold)
    if (result.rewards.gems) gachaStore.addGems(result.rewards.gems)

    showCloseConfirmation.value = false
    claimedRewards.value = result.rewards
    showRewardSummary.value = true
  }
}

function cancelClose() {
  showCloseConfirmation.value = false
}

function dismissRewardSummary() {
  showRewardSummary.value = false
  claimedRewards.value = null
}

function getCategoryColor(category) {
  const colors = {
    offensive: '#ef4444',
    defensive: '#3b82f6',
    tactical: '#22c55e',
    synergy: '#a855f7'
  }
  return colors[category] || '#6b7280'
}

onMounted(() => {
  mawStore.checkDailyReset()
  // If we arrive with a pending boon selection, we just won a wave
  if (showBoonSelection.value) {
    justWonWave.value = true
  }
  // Start countdown timer
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<template>
  <div class="maw-screen">
    <!-- Atmospheric background -->
    <div class="maw-bg" :style="{ backgroundImage: `url(${mawBg})` }"></div>
    <div class="maw-vignette"></div>

    <!-- Boon Selection Overlay -->
    <BoonSelectionOverlay
      v-if="showBoonSelection"
      :boons="mawStore.activeRun.boonOfferings"
      :player-boons="mawStore.activeRun.boons"
      :show-victory="justWonWave"
      @select="handleBoonSelected"
    />

    <!-- Reward Summary Overlay -->
    <div v-if="showRewardSummary && claimedRewards" class="reward-overlay" @click="dismissRewardSummary">
      <div class="reward-panel" @click.stop>
        <h2 class="reward-title">Rewards Claimed</h2>
        <div class="reward-list">
          <div v-if="claimedRewards.gold" class="reward-row">
            <img :src="goldIcon" alt="Gold" class="reward-icon inline-icon" />
            <span class="reward-amount">{{ claimedRewards.gold }} Gold</span>
          </div>
          <div v-if="claimedRewards.gems" class="reward-row">
            <img :src="gemsIcon" alt="Gems" class="reward-icon inline-icon" />
            <span class="reward-amount">{{ claimedRewards.gems }} Gems</span>
          </div>
          <div v-if="claimedRewards.dregs" class="reward-row">
            <img :src="dregsIcon" alt="Dregs" class="reward-icon dregs-inline-icon" />
            <span class="reward-amount">{{ claimedRewards.dregs }} Dregs</span>
          </div>
        </div>
        <button class="dismiss-button" @click="dismissRewardSummary">Continue</button>
      </div>
    </div>

    <!-- Close Confirmation Overlay -->
    <div v-if="showCloseConfirmation" class="reward-overlay" @click="cancelClose">
      <div class="close-confirm-panel" @click.stop>
        <h2 class="close-confirm-title">Seal The Maw?</h2>
        <p class="close-confirm-warning">You won't be able to run again until tomorrow.</p>

        <div v-if="closePreviewRewards" class="close-confirm-rewards">
          <h3 class="section-label">You'll receive:</h3>
          <div class="reward-list">
            <div v-if="closePreviewRewards.gold" class="reward-row">
              <img :src="goldIcon" alt="Gold" class="reward-icon inline-icon" />
              <span class="reward-amount">{{ closePreviewRewards.gold }} Gold</span>
            </div>
            <div v-if="closePreviewRewards.gems" class="reward-row">
              <img :src="gemsIcon" alt="Gems" class="reward-icon inline-icon" />
              <span class="reward-amount">{{ closePreviewRewards.gems }} Gems</span>
            </div>
            <div v-if="closePreviewRewards.dregs" class="reward-row">
              <img :src="dregsIcon" alt="Dregs" class="reward-icon dregs-inline-icon" />
              <span class="reward-amount">{{ closePreviewRewards.dregs }} Dregs</span>
            </div>
          </div>
          <p v-if="restBonus" class="rest-note">Includes x{{ restBonus.toFixed(1) }} rest bonus</p>
        </div>

        <div class="close-confirm-actions">
          <button class="close-confirm-seal" @click="confirmCloseMaw">
            <img :src="lockIcon" alt="" class="inline-icon" /> Seal It
          </button>
          <button class="close-confirm-cancel" @click="cancelClose">Keep Running</button>
        </div>
      </div>
    </div>

    <!-- Boon Detail Popup -->
    <div v-if="expandedBoon" class="boon-popup-backdrop" @click="closeBoonPopup">
      <div class="boon-popup" @click.stop>
        <span class="boon-popup-category" :style="{ color: getCategoryColor(expandedBoon.category) }">{{ expandedBoon.category }}</span>
        <h3 class="boon-popup-name">{{ expandedBoon.name }}</h3>
        <p class="boon-popup-desc">{{ expandedBoon.description }}</p>
        <div class="boon-popup-tags">
          <span v-if="expandedBoon.isSeed" class="boon-popup-tag seed">Seed</span>
          <span v-if="expandedBoon.isPayoff" class="boon-popup-tag payoff">Payoff</span>
          <span class="boon-popup-tag rarity">{{ expandedBoon.rarity }}</span>
        </div>
      </div>
    </div>

    <!-- Header -->
    <header class="screen-header">
      <button class="back-button" @click="emit('back')">
        <span class="back-arrow">&#8249;</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">The Maw</h1>
      <div class="dregs-display">
        <img :src="dregsIcon" alt="Dregs" class="dregs-icon" />
        <span class="dregs-count">{{ mawStore.dregs }}</span>
      </div>
    </header>

    <!-- Reset countdown -->
    <div class="reset-timer">
      <span class="reset-label">Resets in</span>
      <span class="reset-time">{{ resetCountdown }}</span>
    </div>

    <!-- Rest Bonus indicator -->
    <div v-if="restBonus" class="rest-bonus-bar">
      <span class="rest-label">Rest Bonus</span>
      <span class="rest-value">x{{ restBonus.toFixed(1) }}</span>
    </div>

    <template v-if="!showShop">
      <!-- Closed state -->
      <div v-if="isClosed" class="closed-state">
        <div class="closed-icon"><img :src="lockIcon" alt="Locked" class="closed-lock-img" /></div>
        <h2 class="closed-title">The Maw is Sealed</h2>
        <p class="closed-text">Your rewards have been claimed. Return tomorrow.</p>
        <!-- DEBUG: unlock for testing -->
        <button class="debug-unlock" @click="mawStore.closed = false; mawStore.selectedTier = null; mawStore.bestDepth = 0; mawStore.pendingRewards = null; mawStore.runAttempts = 0; mawStore.lastRunBoons = []; mawStore.lastRunDepth = 0">
          Unlock Maw (Debug)
        </button>
      </div>

      <!-- Active run panel -->
      <template v-else-if="hasActiveRun && !showBoonSelection">
        <div class="active-run-panel">
          <div class="run-header">
            <div class="wave-display">
              <span class="wave-number" :style="{ color: phaseColor }">{{ currentWaveLabel }}</span>
              <span class="wave-of">/ {{ WAVE_COUNT }}</span>
            </div>
            <span class="phase-badge" :style="{ color: phaseColor, borderColor: phaseColor }">
              {{ currentPhaseLabel }}
            </span>
          </div>

          <!-- Active boons -->
          <div v-if="mawStore.activeRun.boons.length > 0" class="boons-section">
            <h3 class="section-label">Active Boons ({{ mawStore.activeRun.boons.length }})</h3>
            <div class="boons-list">
              <button
                v-for="boon in mawStore.activeRun.boons"
                :key="boon.id"
                class="boon-chip"
                :style="{ borderLeftColor: getCategoryColor(boon.category) }"
                @click="toggleBoon(boon)"
              >
                <span class="boon-chip-name">{{ boon.name }}</span>
              </button>
            </div>
          </div>

          <!-- Run party with resources -->
          <div class="run-party">
            <div class="run-party-header">
              <h3 class="section-label">Party <img :src="lockIcon" alt="Locked" class="party-lock-icon" /></h3>
            </div>
            <div class="run-party-grid">
              <template v-for="(hero, i) in runPartySlots" :key="i">
                <div v-if="hero" class="run-hero-slot" :class="{ dead: hero.isDead }">
                  <img
                    v-if="getHeroImageUrl(hero.templateId)"
                    :src="getHeroImageUrl(hero.templateId)"
                    :alt="hero.name"
                    class="run-hero-portrait"
                  />
                  <div v-else class="run-hero-portrait-fallback">
                    {{ roleIcons[hero.role] || '\u2694\uFE0F' }}
                  </div>
                  <span class="run-hero-name">{{ hero.name }}</span>
                  <span class="run-hero-level">Lv.{{ hero.level }}</span>
                  <div class="run-hero-bars">
                    <div class="run-bar hp-bar">
                      <div class="run-bar-fill hp" :style="{ width: `${(hero.currentHp / hero.maxHp) * 100}%` }"></div>
                    </div>
                    <div class="run-bar mp-bar">
                      <div class="run-bar-fill mp" :style="{ width: `${(hero.currentMp / hero.maxMp) * 100}%` }"></div>
                    </div>
                  </div>
                </div>
                <div v-else class="run-empty-slot">
                  <div class="run-empty-box"></div>
                </div>
              </template>
            </div>
          </div>

          <!-- Accrued rewards preview -->
          <div class="accrued-rewards">
            <span class="accrued-label">Run Rewards</span>
            <div class="accrued-values">
              <span v-if="mawStore.activeRun.rewards.gold" class="accrued-item"><img :src="goldIcon" alt="Gold" class="inline-icon" /> {{ mawStore.activeRun.rewards.gold }}</span>
              <span v-if="mawStore.activeRun.rewards.dregs" class="accrued-item"><img :src="dregsIcon" alt="Dregs" class="dregs-inline-icon" /> {{ mawStore.activeRun.rewards.dregs }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="run-actions">
            <button
              class="continue-button"
              :disabled="!hasParty"
              @click="startWaveBattle"
            >
              <img :src="swordsIcon" alt="" class="inline-icon" /> Continue Run
            </button>
          </div>
        </div>
      </template>

      <!-- Tier selection (no active run, no tier locked yet) -->
      <template v-else-if="!tierLocked">
        <div class="tier-selection">
          <!-- Party preview -->
          <div class="maw-party-row">
            <div class="maw-party-header">
              <h3 class="section-label">Party ({{ partyCount }}/4)</h3>
              <button class="change-party-button" @click="emit('navigate', 'party')">Change</button>
            </div>
            <div class="maw-party-slots">
              <div v-for="(hero, i) in partySlots" :key="i" class="maw-party-slot" @click="emit('navigate', 'party')">
                <template v-if="hero">
                  <img
                    v-if="getHeroImageUrl(hero.template.id)"
                    :src="getHeroImageUrl(hero.template.id)"
                    :alt="hero.template.name"
                    class="maw-hero-portrait"
                    :class="`rarity-border-${hero.template.rarity}`"
                  />
                  <div v-else class="maw-hero-placeholder" :class="`rarity-border-${hero.template.rarity}`">
                    {{ roleIcons[hero.class?.role] || '\u2694\uFE0F' }}
                  </div>
                  <span class="maw-hero-name">{{ hero.template.name }}</span>
                  <span class="maw-hero-level">Lv.{{ hero.level || 1 }}</span>
                </template>
                <div v-else class="maw-empty-slot" @click="emit('navigate', 'party')">
                  <span class="maw-empty-icon">+</span>
                </div>
              </div>
            </div>
          </div>

          <h2 class="section-heading">Select Difficulty</h2>
          <p class="section-note">Tier is locked in for the day</p>

          <div class="tier-buttons">
            <button
              v-for="tier in 5"
              :key="tier"
              class="tier-button"
              :class="{
                unlocked: mawStore.tierUnlocks[tier],
                locked: !mawStore.tierUnlocks[tier]
              }"
              :style="mawStore.tierUnlocks[tier] ? {
                background: tierData[tier].colorDim,
                borderColor: tierData[tier].borderColor
              } : {}"
              :disabled="!mawStore.tierUnlocks[tier] || !hasParty"
              @click="handleSelectTier(tier)"
            >
              <div class="tier-accent" :style="{ backgroundColor: mawStore.tierUnlocks[tier] ? tierData[tier].color : '#334155' }"></div>
              <div class="tier-left">
                <img v-if="!mawStore.tierUnlocks[tier]" :src="lockIcon" alt="Locked" class="tier-lock-icon" />
                <div class="tier-info">
                  <span class="tier-name" :style="mawStore.tierUnlocks[tier] ? { color: tierData[tier].color } : {}">{{ tierData[tier].name }}</span>
                  <span class="tier-flavor" v-if="mawStore.tierUnlocks[tier]">{{ tierData[tier].flavor }}</span>
                  <span class="tier-levels">Lv. {{ TIER_CONFIG[tier].levelRange.min }}-{{ TIER_CONFIG[tier].levelRange.max }}</span>
                </div>
              </div>
              <span class="tier-multiplier" :style="mawStore.tierUnlocks[tier] ? { color: tierData[tier].color } : {}">x{{ TIER_CONFIG[tier].rewardMultiplier }}</span>
            </button>
          </div>

          <p v-if="!hasParty" class="no-party-warning">Set up a party before entering The Maw.</p>
        </div>
      </template>

      <!-- Tier locked, no active run (can start a new run or close) -->
      <template v-else>
        <div class="between-runs">
          <div class="locked-tier-display" :style="{ borderColor: tierData[mawStore.selectedTier].borderColor, background: tierData[mawStore.selectedTier].colorDim }">
            <span class="locked-tier-label">Today's Tier</span>
            <span class="locked-tier-name" :style="{ color: tierData[mawStore.selectedTier].color }">{{ tierData[mawStore.selectedTier].name }}</span>
          </div>

          <!-- Last run recap — "one more run" psychology -->
          <div v-if="mawStore.lastRunDepth > 0" class="last-run-recap">
            <div class="recap-header">
              <span class="recap-label">Last Run</span>
              <span class="recap-depth">Fell at wave {{ mawStore.lastRunDepth }}</span>
            </div>
            <p v-if="proximityMessage" class="proximity-message">{{ proximityMessage }}</p>
            <div v-if="mawStore.lastRunBoons.length > 0" class="recap-boons">
              <span class="recap-boons-label">You had:</span>
              <div class="recap-boon-list">
                <button
                  v-for="boon in mawStore.lastRunBoons"
                  :key="boon.id"
                  class="boon-chip recap-boon-chip"
                  :style="{ borderLeftColor: getCategoryColor(boon.category) }"
                  @click="toggleBoon(boon)"
                >
                  <span class="boon-chip-name">{{ boon.name }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Flavor line -->
          <p v-if="lastRunFlavor" class="maw-flavor">{{ lastRunFlavor }}</p>

          <div class="best-depth-section">
            <div class="depth-header">
              <h3 class="section-label">Best Depth</h3>
              <span v-if="mawStore.runAttempts > 0" class="attempt-counter">Attempt {{ mawStore.runAttempts }}</span>
            </div>
            <div class="depth-bar">
              <div
                class="depth-fill"
                :style="{ width: `${(mawStore.bestDepth / WAVE_COUNT) * 100}%` }"
              ></div>
              <span class="depth-label">{{ mawStore.bestDepth }} / {{ WAVE_COUNT }}</span>
            </div>
          </div>

          <!-- Pending rewards preview -->
          <div v-if="hasPendingRewards" class="pending-rewards">
            <h3 class="section-label">Banked Rewards</h3>
            <div class="pending-values">
              <span v-if="mawStore.pendingRewards.gold" class="pending-item"><img :src="goldIcon" alt="Gold" class="inline-icon" /> {{ mawStore.pendingRewards.gold }}</span>
              <span v-if="mawStore.pendingRewards.gems" class="pending-item"><img :src="gemsIcon" alt="Gems" class="inline-icon" /> {{ mawStore.pendingRewards.gems }}</span>
              <span v-if="mawStore.pendingRewards.dregs" class="pending-item"><img :src="dregsIcon" alt="Dregs" class="dregs-inline-icon" /> {{ mawStore.pendingRewards.dregs }}</span>
            </div>
            <p v-if="restBonus" class="rest-note">Rest bonus (x{{ restBonus.toFixed(1) }}) applies on claim</p>
          </div>

          <!-- Party preview -->
          <div class="maw-party-row">
            <div class="maw-party-header">
              <h3 class="section-label">Party ({{ partyCount }}/4)</h3>
              <button class="change-party-button" @click="emit('navigate', 'party')">Change</button>
            </div>
            <div class="maw-party-slots">
              <div v-for="(hero, i) in partySlots" :key="i" class="maw-party-slot" @click="emit('navigate', 'party')">
                <template v-if="hero">
                  <img
                    v-if="getHeroImageUrl(hero.template.id)"
                    :src="getHeroImageUrl(hero.template.id)"
                    :alt="hero.template.name"
                    class="maw-hero-portrait"
                    :class="`rarity-border-${hero.template.rarity}`"
                  />
                  <div v-else class="maw-hero-placeholder" :class="`rarity-border-${hero.template.rarity}`">
                    {{ roleIcons[hero.class?.role] || '\u2694\uFE0F' }}
                  </div>
                  <span class="maw-hero-name">{{ hero.template.name }}</span>
                  <span class="maw-hero-level">Lv.{{ hero.level || 1 }}</span>
                </template>
                <div v-else class="maw-empty-slot">
                  <span class="maw-empty-icon">+</span>
                </div>
              </div>
            </div>
          </div>

          <div class="between-actions">
            <button
              class="continue-button"
              :disabled="!hasParty"
              @click="retryRun"
            >
              <img :src="swordsIcon" alt="" class="inline-icon" /> {{ mawStore.bestDepth > 0 ? 'Descend Again' : 'Enter The Maw' }}
            </button>
            <button
              v-if="hasPendingRewards"
              class="done-for-today-button"
              @click="showCloseConfirmation = true"
            >
              Done for today
            </button>
          </div>
        </div>
      </template>

      <!-- Best depth progress (always visible unless closed or no runs) -->
      <div v-if="!isClosed && mawStore.bestDepth > 0 && !hasActiveRun && !tierLocked" class="depth-bar-standalone">
        <div
          class="depth-fill"
          :style="{ width: `${(mawStore.bestDepth / WAVE_COUNT) * 100}%` }"
        ></div>
        <span class="depth-label">Best: {{ mawStore.bestDepth }} / {{ WAVE_COUNT }}</span>
      </div>
    </template>

    <!-- Dregs Shop panel -->
    <template v-else>
      <div class="shop-wrapper">
        <h2 class="shop-heading">Dregs Exchange</h2>
        <DregsShopPanel />
      </div>
    </template>

    <!-- Bottom toggle -->
    <div class="bottom-nav">
      <button
        class="tab-button"
        :class="{ active: !showShop }"
        @click="showShop = false"
      >
        <img :src="skullIcon" alt="" class="inline-icon" /> Delve
      </button>
      <button
        class="tab-button"
        :class="{ active: showShop }"
        @click="showShop = true"
      >
        <img :src="dregsIcon" alt="Dregs" class="dregs-inline-icon" /> Shop
      </button>
    </div>
  </div>
</template>

<style scoped>
.maw-screen {
  min-height: 100vh;
  padding: 16px;
  position: relative;
  overflow: hidden;
  padding-top: calc(16px + var(--safe-area-top));
  padding-bottom: calc(80px + var(--safe-area-bottom));
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #0a0d0a;
}

/* Atmospheric background */
.maw-bg {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  height: 100%;
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;
}

.maw-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.7) 100%);
  pointer-events: none;
  z-index: 0;
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
  font-family: inherit;
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
  font-size: 1.4rem;
  font-weight: 700;
  color: #4ade80;
  margin: 0;
  letter-spacing: 0.08em;
  text-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
}

.dregs-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 6px 12px;
}

.dregs-icon {
  width: 18px;
  height: 18px;
  vertical-align: middle;
}

.inline-icon {
  width: 14px;
  height: 14px;
  vertical-align: middle;
}

.dregs-inline-icon {
  width: 14px;
  height: 14px;
  vertical-align: middle;
}

.dregs-count {
  color: #4ade80;
  font-weight: 700;
  font-size: 1rem;
}

/* Reset countdown */
.reset-timer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.reset-label {
  color: #4b5563;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.reset-time {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Rest Bonus */
.rest-bonus-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 8px;
  padding: 8px 14px;
  position: relative;
  z-index: 1;
}

.rest-label {
  color: #c4b5fd;
  font-size: 0.85rem;
}

.rest-value {
  color: #a855f7;
  font-weight: 700;
  font-size: 1rem;
}

/* Closed state */
.closed-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.closed-icon {
  font-size: 3rem;
}

.closed-lock-img {
  width: 48px;
  height: 48px;
}

.tier-lock-icon {
  width: 20px;
  height: 20px;
}

.closed-title {
  color: #6b7280;
  font-size: 1.3rem;
  margin: 0;
}

.closed-text {
  color: #4b5563;
  font-size: 0.9rem;
  margin: 0;
}

.debug-unlock {
  margin-top: 12px;
  padding: 8px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #ef4444;
  font-size: 0.75rem;
  cursor: pointer;
  font-family: inherit;
}

/* Active Run Panel */
.active-run-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  z-index: 1;
}

.run-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wave-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.wave-number {
  font-size: 1.5rem;
  font-weight: 700;
}

.wave-of {
  color: #6b7280;
  font-size: 1rem;
}

.phase-badge {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 4px 10px;
  border: 1px solid;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
}

/* Party row */
.maw-party-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.maw-party-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.party-lock-icon {
  width: 12px;
  height: 12px;
  opacity: 0.5;
  vertical-align: middle;
  margin-left: 4px;
  margin-top: -2px;
}

.change-party-button {
  background: transparent;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 10px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
}

.change-party-button:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.maw-party-slots {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.maw-party-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.maw-hero-portrait {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
  object-position: top center;
  border: 2px solid #334155;
}

.maw-hero-portrait.rarity-border-1 { border-color: #9ca3af; }
.maw-hero-portrait.rarity-border-2 { border-color: #22c55e; }
.maw-hero-portrait.rarity-border-3 { border-color: #3b82f6; }
.maw-hero-portrait.rarity-border-4 { border-color: #a855f7; }
.maw-hero-portrait.rarity-border-5 { border-color: #f59e0b; }

.maw-hero-placeholder {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  border: 2px solid #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 41, 59, 0.6);
  font-size: 1.2rem;
}

.maw-hero-placeholder.rarity-border-1 { border-color: #9ca3af; }
.maw-hero-placeholder.rarity-border-2 { border-color: #22c55e; }
.maw-hero-placeholder.rarity-border-3 { border-color: #3b82f6; }
.maw-hero-placeholder.rarity-border-4 { border-color: #a855f7; }
.maw-hero-placeholder.rarity-border-5 { border-color: #f59e0b; }

.maw-hero-name {
  color: #d1d5db;
  font-size: 0.6rem;
  font-weight: 600;
  text-align: center;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.maw-hero-level {
  color: #6b7280;
  font-size: 0.55rem;
}

.maw-empty-slot {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  border: 2px dashed #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.maw-empty-icon {
  color: #4b5563;
  font-size: 1.2rem;
  font-weight: 300;
}

/* Run party (active run) */
.run-party {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.run-party-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.run-party-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.run-hero-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.run-hero-slot.dead {
  filter: grayscale(1) brightness(0.5);
}

.run-hero-portrait {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
  object-position: top center;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
}

.run-hero-portrait-fallback {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 41, 59, 0.6);
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
}

.run-hero-name {
  color: #d1d5db;
  font-size: 0.6rem;
  font-weight: 600;
  text-align: center;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.run-hero-level {
  color: #6b7280;
  font-size: 0.55rem;
}

.run-hero-bars {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  max-width: 72px;
}

.run-bar {
  height: 5px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  overflow: hidden;
}

.run-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.run-bar-fill.hp {
  background: linear-gradient(90deg, #166534, #22c55e);
}

.run-bar-fill.mp {
  background: linear-gradient(90deg, #1e40af, #3b82f6);
}

.run-empty-slot {
  display: flex;
  align-items: center;
  justify-content: center;
}

.run-empty-box {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  border: 2px dashed #334155;
}

/* Boons section */
.boons-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  color: #9ca3af;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
  font-weight: 600;
}

.boons-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.boon-chip {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid #334155;
  border-left: 3px solid;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  width: 100%;
  transition: background 0.2s ease;
}

.boon-chip:hover {
  background: rgba(30, 41, 59, 0.9);
}

.boon-chip-name {
  color: #d1d5db;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Boon detail popup */
.boon-popup-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.boon-popup {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1f 100%);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 20px;
  max-width: 320px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.boon-popup-category {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.boon-popup-name {
  color: #f3f4f6;
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
}

.boon-popup-desc {
  color: #9ca3af;
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
}

.boon-popup-tags {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.boon-popup-tag {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.boon-popup-tag.seed {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.3);
}

.boon-popup-tag.payoff {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
  border-color: rgba(168, 85, 247, 0.3);
}

/* Accrued rewards */
.accrued-rewards {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 8px;
  padding: 10px 14px;
}

.accrued-label {
  color: #6b7280;
  font-size: 0.8rem;
}

.accrued-values {
  display: flex;
  gap: 12px;
}

.accrued-item {
  color: #d1d5db;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Run actions */
.run-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.continue-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #166534 0%, #15803d 50%, #22c55e 100%);
  border: none;
  border-radius: 12px;
  color: #f0fdf4;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.03em;
  font-family: inherit;
}

.continue-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
}

.continue-button:active {
  transform: translateY(0);
}

.continue-button:disabled {
  background: #374151;
  color: #6b7280;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

/* Tier Selection */
.tier-selection {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.section-heading {
  color: #f3f4f6;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.section-note {
  color: #6b7280;
  font-size: 0.8rem;
  margin: -4px 0 0;
}

.tier-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tier-button {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 14px 20px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #334155;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  text-align: left;
  width: 100%;
  overflow: hidden;
}

.tier-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 10px 0 0 10px;
}

.tier-button.unlocked:hover {
  filter: brightness(1.2);
  transform: translateY(-1px);
}

.tier-button.unlocked:active {
  transform: translateY(0);
}

.tier-button.locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.tier-button:disabled {
  cursor: not-allowed;
}

.tier-button:disabled:not(.locked) {
  opacity: 0.6;
}

.tier-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tier-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tier-name {
  color: #f3f4f6;
  font-size: 0.95rem;
  font-weight: 600;
}

.tier-flavor {
  color: #6b7280;
  font-size: 0.7rem;
  font-style: italic;
}

.tier-levels {
  color: #4b5563;
  font-size: 0.7rem;
}

.tier-multiplier {
  color: #4ade80;
  font-weight: 700;
  font-size: 0.9rem;
}

.no-party-warning {
  color: #f59e0b;
  font-size: 0.8rem;
  text-align: center;
  margin: 4px 0 0;
}

/* Between runs */
.between-runs {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  z-index: 1;
}

.locked-tier-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid;
  border-radius: 10px;
  padding: 12px 16px;
}

.locked-tier-label {
  color: #6b7280;
  font-size: 0.8rem;
}

.locked-tier-name {
  font-weight: 600;
  font-size: 0.95rem;
}

/* Last run recap */
.last-run-recap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(239, 68, 68, 0.04);
  border: 1px solid rgba(239, 68, 68, 0.12);
  border-radius: 10px;
  padding: 12px 14px;
}

.recap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recap-label {
  color: #6b7280;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

.recap-depth {
  color: #ef4444;
  font-size: 0.85rem;
  font-weight: 600;
}

.proximity-message {
  color: #f59e0b;
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0;
}

.recap-boons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recap-boons-label {
  color: #4b5563;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.recap-boon-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.recap-boon-chip {
  padding: 2px 8px;
}

.maw-flavor {
  color: #4b5563;
  font-size: 0.8rem;
  font-style: italic;
  text-align: center;
  margin: 0;
}

/* Depth bar */
.best-depth-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.depth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.attempt-counter {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
}

.depth-bar,
.depth-bar-standalone {
  position: relative;
  z-index: 1;
  height: 26px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 13px;
  border: 1px solid #334155;
  overflow: hidden;
}

.depth-fill {
  height: 100%;
  background: linear-gradient(90deg, #166534, #22c55e);
  border-radius: 13px;
  transition: width 0.5s ease;
}

.depth-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f3f4f6;
  font-size: 0.8rem;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

/* Pending rewards */
.pending-rewards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 12px 14px;
}

.pending-values {
  display: flex;
  gap: 16px;
}

.pending-item {
  color: #d1d5db;
  font-size: 0.9rem;
  font-weight: 600;
}

.rest-note {
  color: #a855f7;
  font-size: 0.75rem;
  margin: 0;
}

/* Between-run actions */
.between-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.done-for-today-button {
  padding: 12px;
  background: transparent;
  border: 1px solid #334155;
  border-radius: 10px;
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.done-for-today-button:hover {
  color: #9ca3af;
  border-color: #4b5563;
}

/* Close Confirmation */
.close-confirm-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1f 100%);
  border: 2px solid #ef4444;
  border-radius: 16px;
  padding: 28px 24px;
  max-width: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 0 40px rgba(239, 68, 68, 0.15);
}

.close-confirm-title {
  color: #ef4444;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  text-align: center;
}

.close-confirm-warning {
  color: #6b7280;
  font-size: 0.85rem;
  text-align: center;
  margin: 0;
}

.close-confirm-rewards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 10px;
  padding: 12px;
}

.close-confirm-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.close-confirm-seal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 10px;
  color: #ef4444;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.close-confirm-seal:hover {
  background: rgba(239, 68, 68, 0.25);
}

.close-confirm-cancel {
  padding: 12px;
  background: transparent;
  border: 1px solid #334155;
  border-radius: 10px;
  color: #9ca3af;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.close-confirm-cancel:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

/* Reward Overlay */
.reward-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.reward-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1f 100%);
  border: 2px solid #4ade80;
  border-radius: 16px;
  padding: 28px 24px;
  max-width: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 0 40px rgba(74, 222, 128, 0.2);
}

.reward-title {
  color: #4ade80;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 0 15px rgba(74, 222, 128, 0.3);
}

.reward-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.reward-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.reward-icon {
  font-size: 1.3rem;
}

.reward-amount {
  color: #f3f4f6;
  font-size: 1.05rem;
  font-weight: 600;
}

.dismiss-button {
  padding: 12px 32px;
  background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
  border: none;
  border-radius: 10px;
  color: #f0fdf4;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.dismiss-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 12px rgba(34, 197, 94, 0.3);
}

/* Shop wrapper */
.shop-wrapper {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.shop-heading {
  color: #f3f4f6;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

/* Bottom nav */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  display: flex;
  padding: 0 16px;
  padding-bottom: calc(8px + var(--safe-area-bottom));
  gap: 8px;
  background: linear-gradient(to top, #0a0d0a 60%, transparent);
  z-index: 10;
}

.tab-button {
  flex: 1;
  padding: 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 10px;
  color: #9ca3af;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.tab-button.active {
  background: rgba(74, 222, 128, 0.12);
  border-color: #4ade80;
  color: #4ade80;
}

.tab-button:hover {
  border-color: #4b5563;
}

.depth-bar-standalone {
  position: relative;
  z-index: 1;
}
</style>
