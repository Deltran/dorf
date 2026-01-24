<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useHeroesStore, useInventoryStore, useGachaStore, useExplorationsStore } from '../stores'
import HeroCard from '../components/HeroCard.vue'
import StarRating from '../components/StarRating.vue'
import MergePlannerModal from '../components/MergePlannerModal.vue'
import { getHeroTemplate } from '../data/heroTemplates.js'
import { getClass } from '../data/classes.js'
import { getItem } from '../data/items.js'

const props = defineProps({
  initialHeroId: {
    type: String,
    default: null
  },
  autoOpenMerge: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['navigate'])

const heroesStore = useHeroesStore()
const inventoryStore = useInventoryStore()
const gachaStore = useGachaStore()
const explorationsStore = useExplorationsStore()

const selectedHero = ref(null)
const heroImageError = ref(false)
const showItemPicker = ref(false)
const xpGainAnimation = ref(null) // { value: number }

// Filter/Sort state
const sortBy = ref('default')
const selectedRoles = ref([])
const selectedClasses = ref([])
const hideOnExpedition = ref(false)

// Dropdown visibility state
const showSortDropdown = ref(false)
const showRoleDropdown = ref(false)
const showClassDropdown = ref(false)

const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'level', label: 'Level' },
  { value: 'atk', label: 'ATK' },
  { value: 'def', label: 'DEF' },
  { value: 'spd', label: 'SPD' }
]

const roleOptions = [
  { value: 'tank', label: 'Tank', icon: '🛡️' },
  { value: 'dps', label: 'DPS', icon: '⚔️' },
  { value: 'healer', label: 'Healer', icon: '💚' },
  { value: 'support', label: 'Support', icon: '✨' }
]

const classOptions = [
  { value: 'berserker', label: 'Berserker' },
  { value: 'ranger', label: 'Ranger' },
  { value: 'knight', label: 'Knight' },
  { value: 'paladin', label: 'Paladin' },
  { value: 'mage', label: 'Mage' },
  { value: 'cleric', label: 'Cleric' },
  { value: 'druid', label: 'Druid' },
  { value: 'bard', label: 'Bard' },
  { value: 'alchemist', label: 'Alchemist' }
]

function toggleRole(role) {
  const index = selectedRoles.value.indexOf(role)
  if (index === -1) {
    selectedRoles.value.push(role)
  } else {
    selectedRoles.value.splice(index, 1)
  }
}

function toggleClass(classId) {
  const index = selectedClasses.value.indexOf(classId)
  if (index === -1) {
    selectedClasses.value.push(classId)
  } else {
    selectedClasses.value.splice(index, 1)
  }
}

function closeAllDropdowns() {
  showSortDropdown.value = false
  showRoleDropdown.value = false
  showClassDropdown.value = false
}

function handleClickOutside(event) {
  const filterBar = event.target.closest('.filter-bar')
  if (!filterBar) {
    closeAllDropdowns()
  }
}

// Merge state
const showMergeModal = ref(false)
const mergeInfo = ref(null)
const selectedFodder = ref([])

// Build Copies modal state
const showBuildCopiesModal = ref(false)
const buildCopiesHeroId = ref(null)

// Auto-select hero if passed from another screen
onMounted(async () => {
  if (props.initialHeroId) {
    const hero = heroesStore.getHeroFull(props.initialHeroId)
    if (hero) {
      selectedHero.value = hero
      // If autoOpenMerge is set, wait for mergeInfo to be computed then open modal
      if (props.autoOpenMerge) {
        await nextTick()
        if (mergeInfo.value?.canMerge) {
          openMergeModal()
        }
      }
    }
  }
})

// Click-outside handler for dropdowns
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Import all hero images
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })

function getHeroImageUrl(heroId) {
  const path = `../assets/heroes/${heroId}.png`
  return heroImages[path] || null
}

const heroesWithData = computed(() => {
  return heroesStore.collection.map(hero => heroesStore.getHeroFull(hero.instanceId))
})

const filteredAndSortedHeroes = computed(() => {
  let heroes = [...heroesWithData.value]

  // Filter by expedition status
  if (hideOnExpedition.value) {
    heroes = heroes.filter(hero => {
      const heroData = heroesStore.collection.find(h => h.instanceId === hero.instanceId)
      return !heroData?.explorationNodeId
    })
  }

  // Filter by role
  if (selectedRoles.value.length > 0) {
    heroes = heroes.filter(hero => selectedRoles.value.includes(hero.class.role))
  }

  // Filter by class
  if (selectedClasses.value.length > 0) {
    heroes = heroes.filter(hero => selectedClasses.value.includes(hero.template.classId))
  }

  // Sort
  heroes.sort((a, b) => {
    let primary = 0
    let secondary = 0

    switch (sortBy.value) {
      case 'rarity':
        primary = b.template.rarity - a.template.rarity
        secondary = b.level - a.level
        break
      case 'level':
        primary = b.level - a.level
        secondary = b.template.rarity - a.template.rarity
        break
      case 'atk':
        primary = b.stats.atk - a.stats.atk
        secondary = b.template.rarity - a.template.rarity
        break
      case 'def':
        primary = b.stats.def - a.stats.def
        secondary = b.template.rarity - a.template.rarity
        break
      case 'spd':
        primary = b.stats.spd - a.stats.spd
        secondary = b.template.rarity - a.template.rarity
        break
      default: // 'default'
        primary = b.template.rarity - a.template.rarity
        secondary = b.level - a.level
    }

    return primary !== 0 ? primary : secondary
  })

  return heroes
})

const hasActiveFilters = computed(() => {
  return sortBy.value !== 'default' ||
    selectedRoles.value.length > 0 ||
    selectedClasses.value.length > 0 ||
    hideOnExpedition.value
})

const filteredCount = computed(() => filteredAndSortedHeroes.value.length)
const totalCount = computed(() => heroesStore.heroCount)

function clearAllFilters() {
  sortBy.value = 'default'
  selectedRoles.value = []
  selectedClasses.value = []
  hideOnExpedition.value = false
}

const xpItems = computed(() => {
  return inventoryStore.itemList.filter(item => item.type === 'xp')
})

function selectHero(hero) {
  selectedHero.value = hero
  heroImageError.value = false
}

function startPlacing(hero) {
  emit('navigate', 'party', hero.instanceId)
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

function openItemPicker() {
  showItemPicker.value = true
}

function closeItemPicker() {
  showItemPicker.value = false
}

function useItemOnHero(item) {
  if (!selectedHero.value) return
  const result = heroesStore.useXpItem(selectedHero.value.instanceId, item.id)
  if (result.success) {
    // Show XP gain animation
    xpGainAnimation.value = { value: result.xpGained }
    setTimeout(() => {
      xpGainAnimation.value = null
    }, 1500)

    // Refresh selected hero data
    selectedHero.value = heroesStore.getHeroFull(selectedHero.value.instanceId)

    // Close picker if no more XP items
    if (xpItems.value.length === 0) {
      closeItemPicker()
    }
  }
}

// Merge functions
const canShowMergeButton = computed(() => {
  if (!selectedHero.value) return false
  const starLevel = selectedHero.value.starLevel || selectedHero.value.template.rarity
  return starLevel < 5
})

// Can show Build Copies button (hero is below 5* and has lower-tier copies)
const canShowBuildCopies = computed(() => {
  if (!selectedHero.value) return false
  const starLevel = selectedHero.value.starLevel || selectedHero.value.template.rarity
  if (starLevel >= 5) return false
  return heroesStore.hasLowerTierCopies(selectedHero.value.template.id, starLevel)
})

// Watch selectedHero to update mergeInfo
watch(selectedHero, (hero) => {
  if (hero) {
    mergeInfo.value = heroesStore.canMergeHero(hero.instanceId)
  } else {
    mergeInfo.value = null
  }
}, { immediate: true })

const availableFodder = computed(() => {
  if (!selectedHero.value) return []
  const selectedStarLevel = selectedHero.value.starLevel || selectedHero.value.template?.rarity || 1
  return heroesStore.collection
    .filter(h => {
      if (h.templateId !== selectedHero.value.templateId) return false
      if (h.instanceId === selectedHero.value.instanceId) return false
      // Only show fodder with matching star level
      const fodderStarLevel = h.starLevel || heroesStore.getHeroFull(h.instanceId)?.template?.rarity || 1
      return fodderStarLevel === selectedStarLevel
    })
    .sort((a, b) => a.level - b.level)
})

const hasEnoughGold = computed(() => {
  return gachaStore.gold >= (mergeInfo.value?.goldCost || 0)
})

const hasMergeMaterial = computed(() => {
  // No material required for this star level
  if (!mergeInfo.value?.requiredMaterial) return true
  // If canMerge is true, we have everything including material
  if (mergeInfo.value.canMerge) return true
  // If reason mentions "Requires", we're missing the material
  if (mergeInfo.value.reason?.includes('Requires')) return false
  // Otherwise we have the material but missing something else
  return true
})

// Computed for merge button display - shows what's missing in priority order
const mergeButtonState = computed(() => {
  if (!mergeInfo.value) return { icon: '⭐', text: 'Merge', canMerge: false }

  if (mergeInfo.value.canMerge) {
    return { icon: '⭐', text: 'Merge', canMerge: true }
  }

  // Priority: copies → material → gold
  if (mergeInfo.value.copiesHave < mergeInfo.value.copiesNeeded) {
    return { icon: '⭐', text: `Need ${mergeInfo.value.copiesNeeded} copies`, canMerge: false }
  }

  if (mergeInfo.value.requiredMaterial && !mergeInfo.value.canMerge) {
    return { icon: '💎', text: 'Need Shard', canMerge: false }
  }

  if (!hasEnoughGold.value) {
    return { icon: '🪙', text: 'Need Gold', canMerge: false }
  }

  return { icon: '⭐', text: mergeInfo.value.reason || 'Cannot Merge', canMerge: false }
})

const canConfirmMerge = computed(() => {
  return selectedFodder.value.length === mergeInfo.value?.copiesNeeded && hasEnoughGold.value && !mergeInfo.value?.requiredMaterial || (mergeInfo.value?.requiredMaterial && mergeInfo.value?.canMerge)
})

function isFodderInParty(instanceId) {
  return heroesStore.party.includes(instanceId)
}

function openMergeModal() {
  if (!selectedHero.value || !mergeInfo.value?.canMerge) return

  const candidates = heroesStore.getMergeCandidates(
    selectedHero.value.instanceId,
    mergeInfo.value.copiesNeeded
  )
  selectedFodder.value = candidates.map(h => h.instanceId)
  showMergeModal.value = true
}

function closeMergeModal() {
  showMergeModal.value = false
  selectedFodder.value = []
}

function toggleFodder(instanceId) {
  const index = selectedFodder.value.indexOf(instanceId)
  if (index === -1) {
    if (selectedFodder.value.length < mergeInfo.value?.copiesNeeded) {
      selectedFodder.value.push(instanceId)
    }
  } else {
    selectedFodder.value.splice(index, 1)
  }
}

function confirmMerge() {
  if (!canConfirmMerge.value) return

  // Show party warning if any fodder is in party
  const partyFodder = selectedFodder.value.filter(id => isFodderInParty(id))
  if (partyFodder.length > 0) {
    if (!confirm('Some selected heroes are in your party and will be removed. Continue?')) {
      return
    }
  }

  const result = heroesStore.mergeHero(selectedHero.value.instanceId, selectedFodder.value)

  if (result.success) {
    closeMergeModal()
    // Refresh selected hero and merge info
    selectedHero.value = heroesStore.getHeroFull(selectedHero.value.instanceId)
    mergeInfo.value = heroesStore.canMergeHero(selectedHero.value.instanceId)
  } else {
    alert(result.error)
  }
}

function getStarLevel(hero) {
  return hero.starLevel || hero.template?.rarity || 1
}

function openBuildCopies() {
  if (!selectedHero.value) return
  buildCopiesHeroId.value = selectedHero.value.instanceId
  showBuildCopiesModal.value = true
}

function closeBuildCopies() {
  showBuildCopiesModal.value = false
  buildCopiesHeroId.value = null
}

function onBuildCopiesComplete(result) {
  closeBuildCopies()
  if (result.success) {
    // Refresh selected hero data
    if (selectedHero.value) {
      selectedHero.value = heroesStore.getHeroFull(selectedHero.value.instanceId)
      mergeInfo.value = heroesStore.canMergeHero(selectedHero.value.instanceId)
    }
  }
}

// Check if selected hero is a Knight (uses Valor)
const isKnightHero = computed(() => {
  return selectedHero.value?.class?.resourceType === 'valor'
})

// Check if selected hero is on exploration
const selectedHeroExplorationInfo = computed(() => {
  if (!selectedHero.value) return null
  const hero = heroesStore.collection.find(h => h.instanceId === selectedHero.value.instanceId)
  if (!hero?.explorationNodeId) return null
  const node = explorationsStore.getExplorationNode(hero.explorationNodeId)
  return {
    nodeId: hero.explorationNodeId,
    nodeName: node?.name || 'Unknown'
  }
})

// Shard tier info for selected hero
const selectedHeroShardInfo = computed(() => {
  if (!selectedHero.value) return null
  const hero = heroesStore.collection.find(h => h.instanceId === selectedHero.value.instanceId)
  if (!hero) return null

  const tier = hero.shardTier || 0
  const shards = hero.shards || 0
  const canUpgrade = heroesStore.canUpgradeShardTier(hero.instanceId)

  return {
    shards,
    tier,
    canUpgrade,
    nextCost: tier < 3 ? heroesStore.SHARD_TIER_COSTS[tier] : null,
    bonusPercent: tier * 5
  }
})

function upgradeShardTier() {
  if (!selectedHero.value) return
  const result = heroesStore.upgradeShardTier(selectedHero.value.instanceId)
  if (result.success) {
    // Refresh selected hero data
    selectedHero.value = heroesStore.getHeroFull(selectedHero.value.instanceId)
  }
}

// Get skill cost display (handles both mpCost and valorRequired)
function getSkillCostDisplay(skill, heroClass) {
  if (skill.valorRequired !== undefined) {
    return `${skill.valorRequired} Valor required`
  }
  if (skill.rageCost !== undefined) {
    return `${skill.rageCost} Rage`
  }
  if (skill.mpCost !== undefined) {
    return `${skill.mpCost} ${heroClass?.resourceName || 'MP'}`
  }
  return null
}

// Extract Valor scaling breakdown from a skill
function getValorBreakdown(skill) {
  const breakdown = []

  // Check damage scaling
  if (skill.damage && typeof skill.damage === 'object' && skill.damage.base !== undefined) {
    const dmg = skill.damage
    const tiers = []
    if (dmg.base !== undefined) tiers.push({ valor: 0, label: 'Base', value: `${dmg.base}% ATK` })
    if (dmg.at25 !== undefined) tiers.push({ valor: 25, label: '25+', value: `${dmg.at25}% ATK` })
    if (dmg.at50 !== undefined) tiers.push({ valor: 50, label: '50+', value: `${dmg.at50}% ATK` })
    if (dmg.at75 !== undefined) tiers.push({ valor: 75, label: '75+', value: `${dmg.at75}% ATK` })
    if (dmg.at100 !== undefined) tiers.push({ valor: 100, label: '100', value: `${dmg.at100}% ATK` })
    if (tiers.length > 1) {
      breakdown.push({ type: 'Damage', tiers })
    }
  }

  // Check effects for Valor scaling
  if (skill.effects) {
    for (const effect of skill.effects) {
      // valorThreshold effects (only apply at certain Valor)
      if (effect.valorThreshold !== undefined) {
        breakdown.push({
          type: getEffectTypeName(effect.type),
          tiers: [{ valor: effect.valorThreshold, label: `${effect.valorThreshold}+`, value: `+${effect.value}%` }]
        })
      }

      // Object-based value scaling
      if (typeof effect.value === 'object' && effect.value !== null && effect.value.base !== undefined) {
        const val = effect.value
        const tiers = []
        if (val.base !== undefined) tiers.push({ valor: 0, label: 'Base', value: `${val.base}%` })
        if (val.at25 !== undefined) tiers.push({ valor: 25, label: '25+', value: `${val.at25}%` })
        if (val.at50 !== undefined) tiers.push({ valor: 50, label: '50+', value: `${val.at50}%` })
        if (val.at75 !== undefined) tiers.push({ valor: 75, label: '75+', value: `${val.at75}%` })
        if (val.at100 !== undefined) tiers.push({ valor: 100, label: '100', value: `${val.at100}%` })
        if (tiers.length > 1) {
          breakdown.push({ type: `${getEffectTypeName(effect.type)} Strength`, tiers })
        }
      }

      // Object-based duration scaling
      if (typeof effect.duration === 'object' && effect.duration !== null && effect.duration.base !== undefined) {
        const dur = effect.duration
        const tiers = []
        if (dur.base !== undefined) tiers.push({ valor: 0, label: 'Base', value: `${dur.base} turns` })
        if (dur.at25 !== undefined) tiers.push({ valor: 25, label: '25+', value: `${dur.at25} turns` })
        if (dur.at50 !== undefined) tiers.push({ valor: 50, label: '50+', value: `${dur.at50} turns` })
        if (dur.at75 !== undefined) tiers.push({ valor: 75, label: '75+', value: `${dur.at75} turns` })
        if (dur.at100 !== undefined) tiers.push({ valor: 100, label: '100', value: `${dur.at100} turns` })
        if (tiers.length > 1) {
          breakdown.push({ type: `${getEffectTypeName(effect.type)} Duration`, tiers })
        }
      }
    }
  }

  // Check conditionalPreBuff scaling
  if (skill.conditionalPreBuff?.effect) {
    const preBuff = skill.conditionalPreBuff.effect
    if (typeof preBuff.value === 'object' && preBuff.value !== null && preBuff.value.base !== undefined) {
      const val = preBuff.value
      const tiers = []
      if (val.base !== undefined) tiers.push({ valor: 0, label: 'Base', value: `+${val.base}%` })
      if (val.at25 !== undefined) tiers.push({ valor: 25, label: '25+', value: `+${val.at25}%` })
      if (val.at50 !== undefined) tiers.push({ valor: 50, label: '50+', value: `+${val.at50}%` })
      if (val.at75 !== undefined) tiers.push({ valor: 75, label: '75+', value: `+${val.at75}%` })
      if (val.at100 !== undefined) tiers.push({ valor: 100, label: '100', value: `+${val.at100}%` })
      if (tiers.length > 1) {
        const conditionLabel = skill.conditionalPreBuff.condition === 'wasAttacked' ? 'If Attacked' : 'Conditional'
        breakdown.push({ type: `${conditionLabel}: ${getEffectTypeName(preBuff.type)}`, tiers })
      }
    }
  }

  return breakdown
}

function getEffectTypeName(type) {
  const names = {
    atk_up: 'ATK Buff',
    atk_down: 'ATK Debuff',
    def_up: 'DEF Buff',
    def_down: 'DEF Debuff',
    spd_up: 'SPD Buff',
    spd_down: 'SPD Debuff',
    taunt: 'Taunt',
    poison: 'Poison',
    burn: 'Burn'
  }
  return names[type] || type
}
</script>

<template>
  <div class="heroes-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="heroes-header">
      <button class="back-button" @click="emit('navigate', 'fellowship-hall')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Heroes</h1>
      <div class="hero-count-badge">
        <span class="count-value">
          <template v-if="hasActiveFilters">{{ filteredCount }}/</template>{{ totalCount }}
        </span>
        <span class="count-label">{{ hasActiveFilters ? 'shown' : 'owned' }}</span>
      </div>
    </header>

    <!-- Filter Bar -->
    <section class="filter-bar">
      <div class="filter-controls">
        <!-- Sort Dropdown -->
        <div class="dropdown-container">
          <button
            class="filter-btn"
            :class="{ active: sortBy !== 'default' }"
            @click.stop="showSortDropdown = !showSortDropdown; showRoleDropdown = false; showClassDropdown = false"
          >
            <span>Sort: {{ sortOptions.find(o => o.value === sortBy)?.label || 'Default' }}</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div v-if="showSortDropdown" class="dropdown-menu">
            <div
              v-for="option in sortOptions"
              :key="option.value"
              class="dropdown-item"
              :class="{ selected: sortBy === option.value }"
              @click="sortBy = option.value; showSortDropdown = false"
            >
              <span class="check-mark">{{ sortBy === option.value ? '✓' : '' }}</span>
              <span>{{ option.label }}</span>
            </div>
          </div>
        </div>

        <!-- Role Dropdown -->
        <div class="dropdown-container">
          <button
            class="filter-btn"
            :class="{ active: selectedRoles.length > 0 }"
            @click.stop="showRoleDropdown = !showRoleDropdown; showSortDropdown = false; showClassDropdown = false"
          >
            <span>Role{{ selectedRoles.length > 0 ? ` (${selectedRoles.length})` : '' }}</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div v-if="showRoleDropdown" class="dropdown-menu">
            <label
              v-for="role in roleOptions"
              :key="role.value"
              class="dropdown-checkbox"
            >
              <input
                type="checkbox"
                :checked="selectedRoles.includes(role.value)"
                @change="toggleRole(role.value)"
              />
              <span class="role-icon">{{ role.icon }}</span>
              <span>{{ role.label }}</span>
            </label>
          </div>
        </div>

        <!-- Class Dropdown -->
        <div class="dropdown-container">
          <button
            class="filter-btn"
            :class="{ active: selectedClasses.length > 0 }"
            @click.stop="showClassDropdown = !showClassDropdown; showSortDropdown = false; showRoleDropdown = false"
          >
            <span>Class{{ selectedClasses.length > 0 ? ` (${selectedClasses.length})` : '' }}</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div v-if="showClassDropdown" class="dropdown-menu class-dropdown">
            <label
              v-for="cls in classOptions"
              :key="cls.value"
              class="dropdown-checkbox"
            >
              <input
                type="checkbox"
                :checked="selectedClasses.includes(cls.value)"
                @change="toggleClass(cls.value)"
              />
              <span>{{ cls.label }}</span>
            </label>
          </div>
        </div>

        <!-- Expedition Toggle -->
        <button
          class="expedition-toggle"
          :class="{ active: hideOnExpedition }"
          @click="hideOnExpedition = !hideOnExpedition"
          title="Hide heroes on expedition"
        >
          <span class="toggle-icon">🧭</span>
          <span class="toggle-indicator">{{ hideOnExpedition ? '●' : '○' }}</span>
        </button>
      </div>
    </section>

    <!-- Collection -->
    <section class="collection-section">
      <div v-if="heroesStore.collection.length === 0" class="empty-collection">
        <div class="empty-icon">⚔️</div>
        <p>No heroes yet!</p>
        <button class="summon-cta" @click="emit('navigate', 'gacha')">
          <span>Summon Heroes</span>
        </button>
      </div>

      <div v-else-if="filteredAndSortedHeroes.length === 0" class="empty-filtered">
        <div class="empty-icon">🔍</div>
        <p>No heroes match filters</p>
        <button class="clear-filters-btn" @click="clearAllFilters">
          Clear Filters
        </button>
      </div>

      <div v-else class="hero-grid">
        <HeroCard
          v-for="hero in filteredAndSortedHeroes"
          :key="hero.instanceId"
          :hero="hero"
          :selected="selectedHero?.instanceId === hero.instanceId"
          showStats
          showExplorationStatus
          @click="selectHero(hero)"
        />
      </div>
    </section>

    <!-- Hero Detail Backdrop -->
    <div
      v-if="selectedHero"
      class="detail-backdrop"
      @click="selectedHero = null"
    ></div>

    <!-- Hero Detail Panel -->
    <aside v-if="selectedHero" :class="['hero-detail', `rarity-${selectedHero.template.rarity}`]">
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
            <StarRating :rating="getStarLevel(selectedHero)" />
            <div v-if="selectedHero.starLevel > selectedHero.template.rarity" class="origin-badge">
              {{ selectedHero.template.rarity }}★ origin
            </div>
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

        <div v-if="selectedHeroExplorationInfo" class="exploration-status">
          <span class="exploration-icon">🧭</span>
          <span class="exploration-text">Currently Exploring</span>
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
            :class="['skill-info', { 'valor-skill': isKnightHero && skill.valorRequired !== undefined }]"
          >
            <div class="skill-header">
              <span class="skill-name">{{ skill.name }}</span>
              <span v-if="skill.skillUnlockLevel" class="skill-unlock">Lv.{{ skill.skillUnlockLevel }}</span>
            </div>
            <div v-if="getSkillCostDisplay(skill, selectedHero.class)" class="skill-cost">
              {{ getSkillCostDisplay(skill, selectedHero.class) }}
            </div>
            <div class="skill-desc">{{ skill.description }}</div>

            <!-- Valor Breakdown for Knights -->
            <div v-if="isKnightHero && getValorBreakdown(skill).length > 0" class="valor-breakdown">
              <div class="valor-breakdown-header">Valor Scaling</div>
              <div v-for="(item, idx) in getValorBreakdown(skill)" :key="idx" class="valor-row">
                <span class="valor-type">{{ item.type }}:</span>
                <div class="valor-tiers">
                  <span
                    v-for="tier in item.tiers"
                    :key="tier.valor"
                    class="valor-tier"
                  >
                    <span class="tier-label">{{ tier.label }}</span>
                    <span class="tier-value">{{ tier.value }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="selectedHero.template.skill" class="skills-list">
          <div class="skill-info">
            <div class="skill-header">
              <span class="skill-name">{{ selectedHero.template.skill.name }}</span>
            </div>
            <div v-if="getSkillCostDisplay(selectedHero.template.skill, selectedHero.class)" class="skill-cost">
              {{ getSkillCostDisplay(selectedHero.template.skill, selectedHero.class) }}
            </div>
            <div class="skill-desc">{{ selectedHero.template.skill.description }}</div>
          </div>
        </div>

        <!-- Leader Skill Section (5-star only) -->
        <template v-if="selectedHero.template.rarity === 5 && selectedHero.template.leaderSkill">
          <div class="section-header leader-header">
            <div class="section-line"></div>
            <h4>Leader Skill</h4>
            <div class="section-line"></div>
          </div>
          <div class="leader-skill-info">
            <div class="leader-skill-name">{{ selectedHero.template.leaderSkill.name }}</div>
            <div class="leader-skill-desc">{{ selectedHero.template.leaderSkill.description }}</div>
          </div>
        </template>

        <!-- Shard Tier Section -->
        <div class="shard-section" v-if="selectedHeroShardInfo">
          <div class="section-header shard-header">
            <div class="section-line"></div>
            <h4>Shard Power</h4>
            <div class="section-line"></div>
          </div>
          <div class="shard-tier-display">
            <div class="tier-pips">
              <span
                v-for="i in 3"
                :key="i"
                :class="['tier-pip', { active: selectedHeroShardInfo.tier >= i }]"
              >★</span>
            </div>
            <span class="tier-bonus" v-if="selectedHeroShardInfo.bonusPercent > 0">
              +{{ selectedHeroShardInfo.bonusPercent }}% to all skills
            </span>
          </div>

          <div class="shard-progress" v-if="selectedHeroShardInfo.nextCost">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${Math.min(100, (selectedHeroShardInfo.shards / selectedHeroShardInfo.nextCost) * 100)}%` }"
              />
            </div>
            <span class="progress-text">
              {{ selectedHeroShardInfo.shards }} / {{ selectedHeroShardInfo.nextCost }} shards
            </span>
          </div>
          <div class="shard-max" v-else>
            <span class="max-badge">MAX TIER</span>
          </div>

          <button
            v-if="selectedHeroShardInfo.canUpgrade.canUpgrade"
            class="upgrade-btn"
            @click="upgradeShardTier"
          >
            Upgrade (+{{ selectedHeroShardInfo.canUpgrade.bonusPercent }}%)
          </button>
        </div>

        <div class="detail-actions">
          <span v-if="isInParty(selectedHero.instanceId)" class="in-party-badge">
            <span class="badge-icon">✓</span>
            <span>In Party</span>
          </span>
          <button
            v-else
            class="add-to-party-btn"
            :disabled="!!selectedHeroExplorationInfo"
            @click="startPlacing(selectedHero)"
          >
            <span>Add to Party</span>
          </button>
        </div>

        <!-- Next Star Requirements -->
        <div v-if="canShowMergeButton && mergeInfo" class="next-star-requirements">
          <div class="nsr-header">Next ★ Requirements</div>
          <div class="nsr-row">
            <span class="nsr-label">{{ mergeInfo.copiesNeeded }}× {{ '★'.repeat(mergeInfo.requiredStarLevel) }} copies</span>
            <span class="nsr-value" :class="mergeInfo.copiesHave >= mergeInfo.copiesNeeded ? 'met' : 'unmet'">
              {{ mergeInfo.copiesHave }}/{{ mergeInfo.copiesNeeded }}
            </span>
          </div>
          <div class="nsr-row">
            <span class="nsr-label">🪙 {{ mergeInfo.goldCost?.toLocaleString() }} Gold</span>
            <span class="nsr-value" :class="hasEnoughGold ? 'met' : 'unmet'">
              {{ hasEnoughGold ? '✓' : '✗' }}
            </span>
          </div>
          <div v-if="mergeInfo.requiredMaterial" class="nsr-row">
            <span class="nsr-label">💎 {{ mergeInfo.requiredMaterialName }}</span>
            <span class="nsr-value" :class="hasMergeMaterial ? 'met' : 'unmet'">
              {{ hasMergeMaterial ? '✓' : '✗' }}
            </span>
          </div>
        </div>

        <!-- Merge Button -->
        <div v-if="canShowMergeButton" class="merge-section">
          <button
            class="merge-btn"
            :disabled="!mergeButtonState.canMerge || !!selectedHeroExplorationInfo"
            @click="openMergeModal"
          >
            <span class="merge-icon">{{ mergeButtonState.icon }}</span>
            <span>{{ mergeButtonState.text }}</span>
          </button>
        </div>

        <!-- Build Copies Button -->
        <div v-if="canShowBuildCopies" class="build-copies-section">
          <button
            class="build-copies-btn"
            :disabled="!!selectedHeroExplorationInfo"
            @click="openBuildCopies"
          >
            <span class="btn-icon">🔨</span>
            <span>Build Copies</span>
          </button>
        </div>

        <!-- Use XP Item Button -->
        <div v-if="selectedHero.level < 250 && xpItems.length > 0" class="use-item-section">
          <button class="use-item-btn" :disabled="!!selectedHeroExplorationInfo" @click="openItemPicker">
            <span class="btn-icon">📖</span>
            <span>Use XP Item</span>
            <span class="item-badge">{{ xpItems.length }}</span>
          </button>
        </div>

        <!-- XP Gain Animation -->
        <div v-if="xpGainAnimation" class="xp-gain-floater">
          +{{ xpGainAnimation.value }} XP
        </div>

        <!-- Item Picker Modal -->
        <div v-if="showItemPicker" class="item-picker-backdrop" @click="closeItemPicker"></div>
        <div v-if="showItemPicker" class="item-picker-modal">
          <div class="picker-header">
            <h4>Use XP Item</h4>
            <button class="close-picker" @click="closeItemPicker">×</button>
          </div>
          <div class="picker-items">
            <div
              v-for="item in xpItems"
              :key="item.id"
              class="picker-item"
              @click="useItemOnHero(item)"
            >
              <span class="picker-item-icon">📖</span>
              <div class="picker-item-info">
                <span class="picker-item-name">{{ item.name }}</span>
                <span class="picker-item-xp">+{{ item.xpValue }} XP</span>
              </div>
              <span class="picker-item-count">×{{ item.count }}</span>
            </div>
          </div>
        </div>

        <!-- Merge Modal -->
        <div v-if="showMergeModal" class="merge-modal-backdrop" @click="closeMergeModal"></div>
        <div v-if="showMergeModal" class="merge-modal">
          <div class="merge-modal-header">
            <h4>Merge {{ selectedHero?.template.name }}</h4>
            <button class="close-merge" @click="closeMergeModal">×</button>
          </div>

          <div class="merge-preview">
            <div class="merge-base">
              <span class="label">Base Hero</span>
              <div class="hero-preview">
                <span class="stars">{{ '★'.repeat(getStarLevel(selectedHero)) }}</span>
                <span class="name">Lv.{{ selectedHero?.level }} {{ selectedHero?.template.name }}</span>
              </div>
            </div>

            <div class="merge-arrow">→</div>

            <div class="merge-result">
              <span class="label">Result</span>
              <div class="hero-preview result">
                <span class="stars">{{ '★'.repeat(mergeInfo?.targetStarLevel || 1) }}</span>
                <span class="name">{{ selectedHero?.template.name }}</span>
              </div>
            </div>
          </div>

          <div class="fodder-section">
            <h5>Select {{ mergeInfo?.copiesNeeded }} copies to consume:</h5>
            <div class="fodder-grid">
              <div
                v-for="hero in availableFodder"
                :key="hero.instanceId"
                class="fodder-item"
                :class="{
                  selected: selectedFodder.includes(hero.instanceId),
                  'in-party': isFodderInParty(hero.instanceId)
                }"
                @click="toggleFodder(hero.instanceId)"
              >
                <img
                  v-if="getHeroImageUrl(hero.templateId)"
                  :src="getHeroImageUrl(hero.templateId)"
                  :alt="hero.templateId"
                  class="fodder-image"
                />
                <div v-else class="fodder-image-placeholder"></div>
                <span class="fodder-level">Lv.{{ hero.level }}</span>
                <span v-if="isFodderInParty(hero.instanceId)" class="party-warning">⚠️ In Party</span>
              </div>
            </div>
          </div>

          <div class="merge-requirements">
            <div class="requirement-header">Requirements</div>
            <div class="requirement-row">
              <span class="req-icon">🪙</span>
              <span class="req-label">{{ mergeInfo?.goldCost?.toLocaleString() }} Gold</span>
              <span class="req-status" :class="hasEnoughGold ? 'met' : 'unmet'">
                {{ hasEnoughGold ? `✓ (${gachaStore.gold.toLocaleString()})` : '✗' }}
              </span>
            </div>
            <div v-if="mergeInfo?.requiredMaterial" class="requirement-row">
              <span class="req-icon">💎</span>
              <span class="req-label">{{ mergeInfo?.requiredMaterialName }}</span>
              <span class="req-status" :class="hasMergeMaterial ? 'met' : 'unmet'">
                {{ hasMergeMaterial ? '✓' : '✗' }}
              </span>
            </div>
          </div>

          <div class="merge-modal-actions">
            <button class="merge-cancel-btn" @click="closeMergeModal">Cancel</button>
            <button
              class="merge-confirm-btn"
              :disabled="!canConfirmMerge"
              @click="confirmMerge"
            >
              Merge
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Build Copies Modal -->
    <MergePlannerModal
      :show="showBuildCopiesModal"
      :heroInstanceId="buildCopiesHeroId"
      @close="closeBuildCopies"
      @complete="onBuildCopiesComplete"
    />
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

.empty-filtered {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border-radius: 16px;
  border: 1px solid #334155;
}

.empty-filtered .empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-filtered p {
  color: #9ca3af;
  margin-bottom: 20px;
  font-size: 1rem;
}

.clear-filters-btn {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-filters-btn:hover {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  transform: translateY(-1px);
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

/* ===== Exploration Status ===== */
.exploration-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(55, 65, 81, 0.3) 100%);
  border: 1px solid #06b6d4;
  border-radius: 10px;
  margin-bottom: 16px;
}

.exploration-icon {
  font-size: 1.1rem;
}

.exploration-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #06b6d4;
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

/* ===== Valor Skills ===== */
.skill-info.valor-skill {
  border-left-color: #f59e0b;
}

.valor-breakdown {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(245, 158, 11, 0.2);
}

.valor-breakdown-header {
  font-size: 0.7rem;
  color: #f59e0b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  font-weight: 600;
}

.valor-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.valor-row:last-child {
  margin-bottom: 0;
}

.valor-type {
  font-size: 0.75rem;
  color: #d1d5db;
  font-weight: 500;
}

.valor-tiers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.valor-tier {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(245, 158, 11, 0.1);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.tier-label {
  color: #f59e0b;
  font-weight: 600;
}

.tier-value {
  color: #e5e7eb;
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

.add-to-party-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

.add-to-party-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

/* ===== Leader Skill ===== */
.leader-header {
  margin-top: 20px;
}

.leader-skill-info {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(55, 65, 81, 0.3) 100%);
  padding: 14px;
  border-radius: 12px;
  border-left: 3px solid #f59e0b;
}

.leader-skill-name {
  font-weight: 600;
  color: #fbbf24;
  font-size: 0.95rem;
  margin-bottom: 6px;
}

.leader-skill-desc {
  font-size: 0.85rem;
  color: #9ca3af;
  line-height: 1.4;
}

/* ===== Use XP Item Section ===== */
.use-item-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #374151;
}

.use-item-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.use-item-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4);
}

.use-item-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

.use-item-btn .btn-icon {
  font-size: 1.1rem;
}

.item-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  margin-left: 4px;
}

/* ===== XP Gain Floater ===== */
.xp-gain-floater {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  font-weight: 700;
  color: #a78bfa;
  text-shadow: 0 2px 8px rgba(167, 139, 250, 0.5);
  pointer-events: none;
  user-select: none;
  animation: xpFloat 1.5s ease-out forwards;
  z-index: 200;
}

@keyframes xpFloat {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.5);
  }
  20% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  40% {
    transform: translate(-50%, -60%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -100%) scale(1);
  }
}

/* ===== Item Picker Modal ===== */
.item-picker-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 150;
}

.item-picker-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 360px;
  max-height: 70vh;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #374151;
  border-radius: 16px;
  overflow: hidden;
  z-index: 151;
  animation: modalPop 0.2s ease;
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #374151;
  background: rgba(55, 65, 81, 0.3);
}

.picker-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.close-picker {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: color 0.2s ease;
}

.close-picker:hover {
  color: #f3f4f6;
}

.picker-items {
  padding: 12px;
  overflow-y: auto;
  max-height: calc(70vh - 60px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba(55, 65, 81, 0.4);
  border: 1px solid #4b5563;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.picker-item:hover {
  background: rgba(124, 58, 237, 0.2);
  border-color: #7c3aed;
  transform: translateX(4px);
}

.picker-item-icon {
  font-size: 1.8rem;
}

.picker-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.picker-item-name {
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.95rem;
}

.picker-item-xp {
  font-size: 0.8rem;
  color: #a78bfa;
}

.picker-item-count {
  font-size: 0.9rem;
  font-weight: 600;
  color: #9ca3af;
  background: rgba(55, 65, 81, 0.5);
  padding: 4px 10px;
  border-radius: 8px;
}

/* ===== Origin Badge ===== */
.origin-badge {
  font-size: 0.7rem;
  color: #9ca3af;
  opacity: 0.8;
  font-style: italic;
  margin-top: 2px;
}

/* ===== Next Star Requirements ===== */
.next-star-requirements {
  margin-top: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid #374151;
}

.nsr-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.nsr-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 0.85rem;
}

.nsr-label {
  color: #d1d5db;
}

.nsr-value {
  font-weight: 600;
}

.nsr-value.met {
  color: #22c55e;
}

.nsr-value.unmet {
  color: #6b7280;
}

/* ===== Merge Section ===== */
.merge-section {
  margin-top: 12px;
}

.merge-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.merge-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
}

.merge-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

.merge-icon {
  font-size: 1.1rem;
}

/* ===== Merge Modal ===== */
.merge-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 200;
}

.merge-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 400px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #374151;
  border-radius: 16px;
  padding: 20px;
  z-index: 201;
  animation: modalPop 0.2s ease;
}

.merge-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.merge-modal-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #f59e0b;
}

.close-merge {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: color 0.2s ease;
}

.close-merge:hover {
  color: #f3f4f6;
}

.merge-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 16px;
  background: #111827;
  border-radius: 8px;
}

.merge-base, .merge-result {
  text-align: center;
}

.merge-preview .label {
  display: block;
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.hero-preview .stars {
  color: #f59e0b;
  display: block;
  font-size: 1rem;
}

.hero-preview .name {
  display: block;
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 4px;
}

.hero-preview.result {
  color: #22c55e;
}

.hero-preview.result .stars {
  color: #22c55e;
}

.merge-arrow {
  font-size: 1.5rem;
  color: #f59e0b;
}

.fodder-section {
  margin-bottom: 16px;
}

.fodder-section h5 {
  margin: 0 0 12px 0;
  font-size: 0.85rem;
  color: #9ca3af;
  font-weight: 500;
}

.fodder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.fodder-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #374151;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}

.fodder-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 4px;
  margin-bottom: 4px;
}

.fodder-image-placeholder {
  width: 48px;
  height: 48px;
  background: #4b5563;
  border-radius: 4px;
  margin-bottom: 4px;
}

.fodder-item:hover {
  background: #4b5563;
}

.fodder-item.selected {
  border-color: #f59e0b;
  background: #4b5563;
}

.fodder-item.in-party {
  background: #7c2d12;
}

.fodder-level {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #f3f4f6;
}

.party-warning {
  display: block;
  font-size: 0.65rem;
  color: #fbbf24;
  margin-top: 4px;
}

.merge-requirements {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.requirement-header {
  font-size: 0.8rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.requirement-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 0.9rem;
}

.req-icon {
  font-size: 1rem;
  width: 24px;
  text-align: center;
}

.req-label {
  flex: 1;
  color: #f3f4f6;
}

.req-status {
  font-weight: 600;
}

.req-status.met {
  color: #22c55e;
}

.req-status.unmet {
  color: #ef4444;
}

.merge-modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.merge-cancel-btn {
  padding: 10px 20px;
  background: #4b5563;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.merge-cancel-btn:hover {
  background: #6b7280;
}

.merge-confirm-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.merge-confirm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.merge-confirm-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
}

/* ===== Shard Tier Section ===== */
.shard-section {
  margin-top: 20px;
}

.shard-header {
  margin-bottom: 12px;
}

.shard-tier-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tier-pips {
  display: flex;
  gap: 4px;
}

.tier-pip {
  font-size: 1.2rem;
  color: #4b5563;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.tier-pip.active {
  color: #a855f7;
  text-shadow: 0 0 8px rgba(168, 85, 247, 0.6);
}

.tier-bonus {
  font-size: 0.85rem;
  font-weight: 600;
  color: #a855f7;
}

.shard-progress {
  margin-bottom: 12px;
}

.shard-progress .progress-bar {
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.shard-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #a855f7 0%, #c084fc 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.shard-progress .progress-text {
  font-size: 0.8rem;
  color: #9ca3af;
}

.shard-max {
  margin-bottom: 12px;
}

.max-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(34, 197, 94, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.upgrade-btn {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
}

.upgrade-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(168, 85, 247, 0.4);
}

/* ===== Filter Bar ===== */
.filter-bar {
  position: relative;
  z-index: 10;
  margin-bottom: 16px;
}

.filter-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.dropdown-container {
  position: relative;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: #4b5563;
  color: #f3f4f6;
}

.filter-btn.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.dropdown-arrow {
  font-size: 0.7rem;
  opacity: 0.7;
}

.expedition-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.expedition-toggle:hover {
  border-color: #4b5563;
  color: #f3f4f6;
}

.expedition-toggle.active {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
}

.toggle-icon {
  font-size: 1rem;
}

.toggle-indicator {
  font-size: 0.8rem;
}

/* ===== Dropdown Menus ===== */
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 150px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 6px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dropdown-menu.class-dropdown {
  min-width: 140px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #9ca3af;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.dropdown-item:hover {
  background: rgba(55, 65, 81, 0.5);
  color: #f3f4f6;
}

.dropdown-item.selected {
  color: #60a5fa;
}

.check-mark {
  width: 16px;
  color: #60a5fa;
}

.dropdown-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #9ca3af;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.dropdown-checkbox:hover {
  background: rgba(55, 65, 81, 0.5);
  color: #f3f4f6;
}

.dropdown-checkbox input[type="checkbox"] {
  accent-color: #3b82f6;
  width: 16px;
  height: 16px;
}

.role-icon {
  font-size: 1rem;
}

/* ===== Build Copies Section ===== */
.build-copies-section {
  margin-top: 12px;
}

.build-copies-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.build-copies-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.build-copies-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

.build-copies-btn .btn-icon {
  font-size: 1.1rem;
}
</style>
