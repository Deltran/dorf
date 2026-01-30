import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getHeroTemplate } from '../data/heroes/index.js'
import { getClass } from '../data/classes.js'
import { getItem } from '../data/items.js'
import { useInventoryStore } from './inventory.js'
import { useGachaStore } from './gacha.js'

// Shard tier upgrade costs (tier 1, 2, 3)
const SHARD_TIER_COSTS = [50, 100, 200]

export const useHeroesStore = defineStore('heroes', () => {
  // State
  const collection = ref([]) // Array of hero instances
  const party = ref([null, null, null, null]) // 4 slots for party
  const partyLeader = ref(null) // instanceId of the party leader

  // Getters
  const heroCount = computed(() => collection.value.length)

  const partyHeroes = computed(() => {
    return party.value.map(instanceId => {
      if (!instanceId) return null
      return collection.value.find(h => h.instanceId === instanceId) || null
    })
  })

  const partyIsFull = computed(() => {
    return party.value.every(slot => slot !== null)
  })

  const availableForParty = computed(() => {
    const partyIds = new Set(party.value.filter(Boolean))
    const partyTemplateIds = new Set(
      party.value.filter(Boolean).map(id => {
        const hero = collection.value.find(h => h.instanceId === id)
        return hero?.templateId
      }).filter(Boolean)
    )
    return collection.value.filter(h =>
      !partyIds.has(h.instanceId) && !partyTemplateIds.has(h.templateId)
    )
  })

  // Heroes available for exploration (not in party, not already on exploration)
  const availableForExploration = computed(() => {
    const partyIds = new Set(party.value.filter(Boolean))
    return collection.value.filter(h =>
      !partyIds.has(h.instanceId) &&
      !h.explorationNodeId
    )
  })

  function isHeroLocked(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    return hero?.explorationNodeId != null
  }

  function lockHeroToExploration(instanceId, nodeId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return false
    if (hero.explorationNodeId) return false // Already locked
    hero.explorationNodeId = nodeId
    return true
  }

  function unlockHeroFromExploration(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return false
    hero.explorationNodeId = null
    return true
  }

  const leaderHero = computed(() => {
    if (!partyLeader.value) return null
    return collection.value.find(h => h.instanceId === partyLeader.value) || null
  })

  // Actions
  function addHero(templateId) {
    const template = getHeroTemplate(templateId)
    if (!template) {
      console.warn(`Unknown hero template: ${templateId}`)
      return null
    }

    const heroInstance = {
      instanceId: crypto.randomUUID(),
      templateId,
      level: 1,
      exp: 0,
      starLevel: template.rarity,  // Starts at base rarity, upgradeable through merging
      shards: 0,      // Current shard count (resets after upgrade)
      shardTier: 0    // 0 = none, 1/2/3 = upgraded tiers
    }

    collection.value.push(heroInstance)
    return heroInstance
  }

  function removeHero(instanceId) {
    // Clear leader if this hero was leader
    if (instanceId === partyLeader.value) {
      partyLeader.value = null
    }
    // Remove from party if present
    party.value = party.value.map(id => id === instanceId ? null : id)
    // Remove from collection
    collection.value = collection.value.filter(h => h.instanceId !== instanceId)
  }

  function setPartySlot(slotIndex, instanceId) {
    if (slotIndex < 0 || slotIndex > 3) return false

    // Check if hero is locked to exploration
    if (isHeroLocked(instanceId)) return false

    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return false

    // If hero is already in another slot, it's a swap — always allowed
    const existingSlot = party.value.findIndex(id => id === instanceId)
    if (existingSlot !== -1 && existingSlot !== slotIndex) {
      party.value[existingSlot] = party.value[slotIndex]
    } else if (existingSlot === -1) {
      // New hero being added — check for duplicate templateId
      const partyTemplateIds = party.value
        .filter((id, idx) => id && idx !== slotIndex) // exclude the slot being replaced
        .map(id => collection.value.find(h => h.instanceId === id)?.templateId)
        .filter(Boolean)
      if (partyTemplateIds.includes(hero.templateId)) return false
    }

    party.value[slotIndex] = instanceId
    return true
  }

  function clearPartySlot(slotIndex) {
    if (slotIndex < 0 || slotIndex > 3) return false
    const removedId = party.value[slotIndex]
    if (removedId === partyLeader.value) {
      partyLeader.value = null
    }
    party.value[slotIndex] = null
    return true
  }

  function setPartyLeader(instanceId) {
    // Allow null to clear leader, or valid party member
    if (instanceId && !party.value.includes(instanceId)) {
      return false
    }
    partyLeader.value = instanceId
    return true
  }

  function autoFillParty() {
    // Fill empty party slots with strongest available heroes
    const available = [...availableForParty.value]

    // Sort by rarity then level
    available.sort((a, b) => {
      const templateA = getHeroTemplate(a.templateId)
      const templateB = getHeroTemplate(b.templateId)
      if (templateB.rarity !== templateA.rarity) {
        return templateB.rarity - templateA.rarity
      }
      return b.level - a.level
    })

    // Track templateIds used during this fill to prevent duplicates
    const usedTemplateIds = new Set(
      party.value.filter(Boolean).map(id => {
        const hero = collection.value.find(h => h.instanceId === id)
        return hero?.templateId
      }).filter(Boolean)
    )

    for (let i = 0; i < 4; i++) {
      if (!party.value[i]) {
        const candidate = available.find(h => !usedTemplateIds.has(h.templateId))
        if (candidate) {
          available.splice(available.indexOf(candidate), 1)
          party.value[i] = candidate.instanceId
          usedTemplateIds.add(candidate.templateId)
        }
      }
    }
  }

  const MAX_LEVEL = 250

  // Stat growth multiplier per star level (applied per level-up)
  const STAR_GROWTH_MULTIPLIERS = {
    1: 1.00,
    2: 1.10,
    3: 1.20,
    4: 1.35,
    5: 1.50
  }

  // Merge cost: targetStar * this value
  const MERGE_GOLD_COST_PER_STAR = 1000

  function addExp(instanceId, amount) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return

    // No XP gain at max level
    if (hero.level >= MAX_LEVEL) return

    hero.exp += amount

    // Level up logic: 100 exp per level
    const expPerLevel = 100
    while (hero.exp >= expPerLevel * hero.level && hero.level < MAX_LEVEL) {
      hero.exp -= expPerLevel * hero.level
      hero.level++
    }

    // Clear excess exp at max level
    if (hero.level >= MAX_LEVEL) {
      hero.exp = 0
    }
  }

  function addExpToParty(totalExp) {
    const activeParty = party.value.filter(Boolean)
    if (activeParty.length === 0) return []

    const expPerHero = Math.floor(totalExp / activeParty.length)
    const levelUps = []

    activeParty.forEach(instanceId => {
      const hero = collection.value.find(h => h.instanceId === instanceId)
      if (!hero) return

      const oldLevel = hero.level
      addExp(instanceId, expPerHero)
      const newLevel = hero.level

      if (newLevel > oldLevel) {
        levelUps.push({ instanceId, oldLevel, newLevel })
      }
    })

    return levelUps
  }

  // Get computed stats for a hero instance
  function getHeroStats(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return null

    const template = getHeroTemplate(hero.templateId)
    if (!template) return null

    const starLevel = hero.starLevel || template.rarity
    const starMultiplier = STAR_GROWTH_MULTIPLIERS[starLevel] || 1
    const starBonus = starLevel - template.rarity  // +1 base stats per star gained

    // Base level multiplier: 5% per level
    const baseLevelGrowth = 0.05
    // Star level increases growth rate
    const levelMultiplier = 1 + (baseLevelGrowth * starMultiplier) * (hero.level - 1)

    return {
      hp: Math.floor((template.baseStats.hp + starBonus) * levelMultiplier),
      atk: Math.floor((template.baseStats.atk + starBonus) * levelMultiplier),
      def: Math.floor((template.baseStats.def + starBonus) * levelMultiplier),
      spd: Math.floor((template.baseStats.spd + starBonus) * levelMultiplier),
      mp: Math.floor(((template.baseStats.mp || 0) + starBonus) * levelMultiplier)
    }
  }

  // Get full hero data (instance + template + class)
  function getHeroFull(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return null

    const template = getHeroTemplate(hero.templateId)
    if (!template) return null

    const heroClass = getClass(template.classId)
    const effectiveClass = template.role
      ? { ...heroClass, role: template.role }
      : heroClass

    return {
      ...hero,
      template,
      class: effectiveClass,
      stats: getHeroStats(instanceId)
    }
  }

  // Persistence
  function loadState(savedState) {
    if (savedState.collection) {
      // Migration: add starLevel if missing (defaults to template rarity)
      // Migration: add shards/shardTier if missing (defaults to 0)
      // Migration: add explorationNodeId if missing (defaults to null)
      collection.value = savedState.collection.map(hero => ({
        ...hero,
        starLevel: hero.starLevel || getHeroTemplate(hero.templateId)?.rarity || 1,
        shards: hero.shards ?? 0,
        shardTier: hero.shardTier ?? 0,
        explorationNodeId: hero.explorationNodeId ?? null
      }))
    }
    if (savedState.party) party.value = savedState.party
    if (savedState.partyLeader !== undefined) partyLeader.value = savedState.partyLeader
  }

  function saveState() {
    return {
      collection: collection.value,
      party: party.value,
      partyLeader: partyLeader.value
    }
  }

  function useXpItem(instanceId, itemId) {
    const inventoryStore = useInventoryStore()

    const item = getItem(itemId)
    if (!item || item.type !== 'xp') return { success: false, reason: 'invalid_item' }
    if (!inventoryStore.removeItem(itemId)) return { success: false, reason: 'no_item' }

    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) {
      inventoryStore.addItem(itemId) // refund
      return { success: false, reason: 'hero_not_found' }
    }

    const oldLevel = hero.level
    addExp(instanceId, item.xpValue)
    const newLevel = hero.level

    return {
      success: true,
      xpGained: item.xpValue,
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel
    }
  }

  // Helper to get a hero's current star level
  function getHeroStarLevel(hero) {
    const template = getHeroTemplate(hero.templateId)
    return hero.starLevel || template?.rarity || 1
  }

  // Merge functions
  function canMergeHero(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return { canMerge: false, reason: 'Hero not found' }

    const starLevel = getHeroStarLevel(hero)

    if (starLevel >= 5) {
      return { canMerge: false, reason: 'Already at max star level' }
    }

    // Find duplicates (same templateId, same star level, different instanceId)
    const duplicates = collection.value.filter(
      h => h.templateId === hero.templateId &&
           h.instanceId !== instanceId &&
           getHeroStarLevel(h) === starLevel
    )

    const copiesNeeded = starLevel
    if (duplicates.length < copiesNeeded) {
      return {
        canMerge: false,
        reason: `Need ${copiesNeeded} ${starLevel}-star copies (have ${duplicates.length})`,
        copiesNeeded,
        copiesHave: duplicates.length,
        requiredStarLevel: starLevel
      }
    }

    // Check for required merge material (e.g., shards for 3* -> 4*)
    const requiredMaterial = MERGE_MATERIALS[starLevel]
    let hasMaterial = true
    let materialName = null
    if (requiredMaterial) {
      const inventoryStore = useInventoryStore()
      hasMaterial = inventoryStore.getItemCount(requiredMaterial) >= 1
      const materialItem = getItem(requiredMaterial)
      materialName = materialItem?.name || requiredMaterial
    }

    if (!hasMaterial) {
      return {
        canMerge: false,
        reason: `Requires 1 ${materialName}`,
        copiesNeeded,
        copiesHave: duplicates.length,
        requiredStarLevel: starLevel,
        requiredMaterial,
        requiredMaterialName: materialName
      }
    }

    const goldCost = (starLevel + 1) * MERGE_GOLD_COST_PER_STAR

    return {
      canMerge: true,
      copiesNeeded,
      copiesHave: duplicates.length,
      duplicates,
      goldCost,
      targetStarLevel: starLevel + 1,
      requiredStarLevel: starLevel,
      requiredMaterial,
      requiredMaterialName: materialName
    }
  }

  function getMergeCandidates(instanceId, count) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return []

    const starLevel = getHeroStarLevel(hero)

    // Get all duplicates with same star level, sorted by level (ascending) - sacrifice lowest level first
    const duplicates = collection.value
      .filter(h => h.templateId === hero.templateId &&
                   h.instanceId !== instanceId &&
                   getHeroStarLevel(h) === starLevel)
      .sort((a, b) => a.level - b.level)

    return duplicates.slice(0, count)
  }

  function getLowerTierCopies(templateId, belowStarLevel) {
    // Get all copies of this template with star level below the specified level
    // Excludes heroes in party or on expedition
    return collection.value.filter(h => {
      if (h.templateId !== templateId) return false
      const heroStar = getHeroStarLevel(h)
      if (heroStar >= belowStarLevel) return false
      // Exclude heroes in party
      if (party.value.includes(h.instanceId)) return false
      // Exclude heroes on expedition
      if (h.explorationNodeId) return false
      return true
    })
  }

  function hasLowerTierCopies(templateId, belowStarLevel) {
    return getLowerTierCopies(templateId, belowStarLevel).length > 0
  }

  function executeBulkMerge(templateId, mergeConfig) {
    // mergeConfig = { tier1: 5, tier2: 3, tier3: 0, tier4: 0 }
    // tier1 = number of 1*->2* merges, tier2 = 2*->3* merges, etc.
    const gachaStore = useGachaStore()
    const inventoryStore = useInventoryStore()

    const results = {
      success: true,
      mergesCompleted: { tier1: 0, tier2: 0, tier3: 0, tier4: 0 },
      totalGoldSpent: 0,
      errors: []
    }

    // Calculate total costs upfront
    const totalGold =
      (mergeConfig.tier1 || 0) * 2000 +  // 1*->2* costs 2000
      (mergeConfig.tier2 || 0) * 3000 +  // 2*->3* costs 3000
      (mergeConfig.tier3 || 0) * 4000 +  // 3*->4* costs 4000
      (mergeConfig.tier4 || 0) * 5000    // 4*->5* costs 5000

    // Check gold
    if (gachaStore.gold < totalGold) {
      return { success: false, error: `Not enough gold (need ${totalGold}, have ${gachaStore.gold})` }
    }

    // Check materials for tier3 (3*->4*) merges
    const tier3Materials = mergeConfig.tier3 || 0
    if (tier3Materials > 0) {
      const shardCount = inventoryStore.getItemCount('shard_dragon_heart')
      if (shardCount < tier3Materials) {
        return { success: false, error: `Not enough Dragon Heart Shards (need ${tier3Materials}, have ${shardCount})` }
      }
    }

    // Check materials for tier4 (4*->5*) merges
    const tier4Materials = mergeConfig.tier4 || 0
    if (tier4Materials > 0) {
      const heartCount = inventoryStore.getItemCount('dragon_heart')
      if (heartCount < tier4Materials) {
        return { success: false, error: `Not enough Dragon Hearts (need ${tier4Materials}, have ${heartCount})` }
      }
    }

    // Execute merges bottom-up (1*->2* first, then 2*->3*, etc.)
    const tiers = [
      { key: 'tier1', fromStar: 1, toStar: 2, copiesNeeded: 1 },
      { key: 'tier2', fromStar: 2, toStar: 3, copiesNeeded: 2 },
      { key: 'tier3', fromStar: 3, toStar: 4, copiesNeeded: 3 },
      { key: 'tier4', fromStar: 4, toStar: 5, copiesNeeded: 4 }
    ]

    for (const tier of tiers) {
      const mergeCount = mergeConfig[tier.key] || 0
      if (mergeCount === 0) continue

      for (let i = 0; i < mergeCount; i++) {
        // Get available copies at this star level (fresh each iteration)
        const available = collection.value.filter(h =>
          h.templateId === templateId &&
          getHeroStarLevel(h) === tier.fromStar &&
          !party.value.includes(h.instanceId) &&
          !h.explorationNodeId
        ).sort((a, b) => a.level - b.level) // Lowest level first

        if (available.length < tier.copiesNeeded + 1) {
          results.errors.push(`Not enough ${tier.fromStar}-star copies for merge ${i + 1}`)
          results.success = false
          break
        }

        // Pick base (first one) and fodder (next N)
        const baseHero = available[0]
        const fodder = available.slice(1, 1 + tier.copiesNeeded)

        const mergeResult = mergeHero(baseHero.instanceId, fodder.map(h => h.instanceId))

        if (!mergeResult.success) {
          results.errors.push(`Tier ${tier.fromStar}->${tier.toStar} merge ${i + 1}: ${mergeResult.error}`)
          results.success = false
          break
        }

        results.mergesCompleted[tier.key]++
        results.totalGoldSpent += (tier.toStar) * MERGE_GOLD_COST_PER_STAR
      }

      if (!results.success) break
    }

    return results
  }

  // Material requirements for merging
  const MERGE_MATERIALS = {
    3: 'shard_dragon_heart', // 3* -> 4* requires Shard of Dragon Heart
    4: 'dragon_heart'        // 4* -> 5* requires Dragon Heart
  }

  function mergeHero(baseInstanceId, fodderInstanceIds) {
    const gachaStore = useGachaStore()
    const inventoryStore = useInventoryStore()

    const hero = collection.value.find(h => h.instanceId === baseInstanceId)
    if (!hero) return { success: false, error: 'Base hero not found' }

    // Check if base hero is on exploration
    if (isHeroLocked(baseInstanceId)) {
      return { success: false, error: 'Cannot merge hero on exploration' }
    }

    const currentStar = getHeroStarLevel(hero)

    if (currentStar >= 5) {
      return { success: false, error: 'Already at max star level' }
    }

    const copiesNeeded = currentStar
    if (fodderInstanceIds.length !== copiesNeeded) {
      return { success: false, error: `Need exactly ${copiesNeeded} copies` }
    }

    // Validate all fodder heroes exist and are same template
    const fodderHeroes = fodderInstanceIds.map(id =>
      collection.value.find(h => h.instanceId === id)
    )

    if (fodderHeroes.some(h => !h)) {
      return { success: false, error: 'One or more fodder heroes not found' }
    }

    // Check if any fodder hero is on exploration
    if (fodderInstanceIds.some(id => isHeroLocked(id))) {
      return { success: false, error: 'Cannot use hero on exploration as merge fodder' }
    }

    if (fodderHeroes.some(h => h.templateId !== hero.templateId)) {
      return { success: false, error: 'All heroes must be the same type' }
    }

    // Validate all fodder heroes have the same star level as base
    if (fodderHeroes.some(h => getHeroStarLevel(h) !== currentStar)) {
      return { success: false, error: `All fodder heroes must be ${currentStar}-star` }
    }

    // Check for required merge material
    const requiredMaterial = MERGE_MATERIALS[currentStar]
    if (requiredMaterial) {
      const materialItem = getItem(requiredMaterial)
      if (inventoryStore.getItemCount(requiredMaterial) < 1) {
        return { success: false, error: `Requires 1 ${materialItem?.name || requiredMaterial}` }
      }
    }

    // Check gold cost
    const goldCost = (currentStar + 1) * MERGE_GOLD_COST_PER_STAR
    if (gachaStore.gold < goldCost) {
      return { success: false, error: `Not enough gold (need ${goldCost})` }
    }

    // Find highest level among all heroes (base + fodder)
    const allHeroes = [hero, ...fodderHeroes]
    const highestLevel = Math.max(...allHeroes.map(h => h.level))
    const highestExp = allHeroes.find(h => h.level === highestLevel)?.exp || 0

    // Remove fodder from party if present
    fodderInstanceIds.forEach(id => {
      const slotIndex = party.value.indexOf(id)
      if (slotIndex !== -1) {
        party.value[slotIndex] = null
      }
      if (partyLeader.value === id) {
        partyLeader.value = null
      }
    })

    // Remove fodder heroes from collection
    collection.value = collection.value.filter(
      h => !fodderInstanceIds.includes(h.instanceId)
    )

    // Upgrade base hero
    hero.starLevel = currentStar + 1
    hero.level = highestLevel
    hero.exp = highestExp

    // Deduct gold
    gachaStore.spendGold(goldCost)

    // Consume merge material if required
    if (requiredMaterial) {
      inventoryStore.removeItem(requiredMaterial, 1)
    }

    return {
      success: true,
      newStarLevel: hero.starLevel,
      goldSpent: goldCost,
      materialUsed: requiredMaterial || null
    }
  }

  // Shard functions
  function canUpgradeShardTier(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return { canUpgrade: false, reason: 'Hero not found' }

    const currentTier = hero.shardTier || 0
    if (currentTier >= 3) {
      return { canUpgrade: false, reason: 'Already at max shard tier' }
    }

    const cost = SHARD_TIER_COSTS[currentTier]
    const currentShards = hero.shards || 0

    if (currentShards < cost) {
      return {
        canUpgrade: false,
        reason: `Need ${cost} shards (have ${currentShards})`,
        shardsNeeded: cost,
        shardsHave: currentShards,
        nextTier: currentTier + 1
      }
    }

    return {
      canUpgrade: true,
      shardsNeeded: cost,
      shardsHave: currentShards,
      nextTier: currentTier + 1,
      bonusPercent: (currentTier + 1) * 5 // +5%, +10%, +15%
    }
  }

  function upgradeShardTier(instanceId) {
    const checkResult = canUpgradeShardTier(instanceId)
    if (!checkResult.canUpgrade) {
      return { success: false, error: checkResult.reason }
    }

    const hero = collection.value.find(h => h.instanceId === instanceId)
    const cost = SHARD_TIER_COSTS[hero.shardTier || 0]

    hero.shards -= cost
    hero.shardTier = (hero.shardTier || 0) + 1

    return {
      success: true,
      newTier: hero.shardTier,
      bonusPercent: hero.shardTier * 5,
      shardsRemaining: hero.shards
    }
  }

  function getShardBonus(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return 0
    return (hero.shardTier || 0) * 5 // 0, 5, 10, or 15
  }

  return {
    // State
    collection,
    party,
    partyLeader,
    // Getters
    heroCount,
    partyHeroes,
    partyIsFull,
    availableForParty,
    leaderHero,
    // Actions
    addHero,
    removeHero,
    setPartySlot,
    clearPartySlot,
    setPartyLeader,
    autoFillParty,
    addExp,
    addExpToParty,
    getHeroStats,
    getHeroFull,
    useXpItem,
    // Merge
    canMergeHero,
    getMergeCandidates,
    mergeHero,
    getHeroStarLevel,
    getLowerTierCopies,
    hasLowerTierCopies,
    executeBulkMerge,
    MERGE_GOLD_COST_PER_STAR,
    MERGE_MATERIALS,
    // Shards
    canUpgradeShardTier,
    upgradeShardTier,
    getShardBonus,
    SHARD_TIER_COSTS,
    // Exploration
    availableForExploration,
    isHeroLocked,
    lockHeroToExploration,
    unlockHeroFromExploration,
    // Persistence
    loadState,
    saveState
  }
})
