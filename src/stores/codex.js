import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHeroesStore } from './heroes.js'
import { useQuestsStore } from './quests.js'
import { useGachaStore } from './gacha.js'
import { getAllHeroTemplates } from '../data/heroes/index.js'
import { getAllEnemyTemplates } from '../data/enemies/index.js'
import { regions } from '../data/quests/regions.js'
import { topics } from '../data/codex/topics.js'

const READ_REWARD_GEMS = 50
const ENEMY_READ_REWARD_GEMS = 10

export const useCodexStore = defineStore('codex', () => {
  // Persisted state
  const unlockedTopics = ref(new Set())
  const readEntries = ref(new Set())

  // --- Topic unlock management ---

  function unlockTopic(topicId) {
    unlockedTopics.value.add(topicId)
  }

  function isTopicUnlocked(topicId) {
    const topic = topics.find(t => t.id === topicId)
    if (!topic) return false
    if (topic.alwaysVisible) return true
    return unlockedTopics.value.has(topicId)
  }

  const visibleTopics = computed(() => {
    return topics.filter(t => t.alwaysVisible || unlockedTopics.value.has(t.id))
  })

  // --- Class-based topic unlock helper ---

  const classTopicMap = {
    knight: 'valor',
    berserker: 'rage',
    ranger: 'focus',
    bard: 'verse_and_finale',
    alchemist: 'essence_and_volatility'
  }

  function unlockTopicsForHero(heroTemplate) {
    // Unlock class resource topic
    const topicId = classTopicMap[heroTemplate.classId]
    if (topicId) {
      unlockTopic(topicId)
    }
    // Unlock leader skills topic for 5-star heroes
    if (heroTemplate.rarity >= 5) {
      unlockTopic('leader_skills')
    }
    // Unlock status effects if hero has skills with effects
    if (heroTemplate.skills?.some(s => s.effects?.length > 0)) {
      unlockTopic('status_effects')
    }
    // Unlock damage interception if hero has protection-related skills
    if (heroTemplate.skills?.some(s =>
      s.effects?.some(e =>
        ['divine_sacrifice', 'guardian_link', 'damage_reduction', 'shield', 'evasion', 'death_prevention'].includes(e.type)
      )
    )) {
      unlockTopic('damage_interception')
    }
  }

  // --- Read tracking with gem rewards ---

  function markRead(entryKey) {
    if (readEntries.value.has(entryKey)) return false
    readEntries.value.add(entryKey)
    const gachaStore = useGachaStore()
    const gems = entryKey.startsWith('enemy:') ? ENEMY_READ_REWARD_GEMS : READ_REWARD_GEMS
    gachaStore.addGems(gems)
    return gems
  }

  function hasRead(entryKey) {
    return readEntries.value.has(entryKey)
  }

  // --- Discovery computeds (read from other stores) ---

  const discoveredHeroes = computed(() => {
    const heroesStore = useHeroesStore()
    return getAllHeroTemplates().filter(t => heroesStore.hasTemplate(t.id))
  })

  const totalHeroes = computed(() => {
    return getAllHeroTemplates().length
  })

  const discoveredEnemies = computed(() => {
    const questsStore = useQuestsStore()
    return getAllEnemyTemplates().filter(t => questsStore.hasDefeatedEnemy(t.id))
  })

  const totalEnemies = computed(() => {
    return getAllEnemyTemplates().length
  })

  const discoveredRegions = computed(() => {
    const questsStore = useQuestsStore()
    return regions.filter(r => questsStore.unlockedNodes.includes(r.startNode))
  })

  const totalRegions = computed(() => {
    return regions.length
  })

  // --- Unread counts ---

  const unreadHeroCount = computed(() => {
    return discoveredHeroes.value.filter(h => !readEntries.value.has(`hero:${h.id}`)).length
  })

  const unreadEnemyCount = computed(() => {
    return discoveredEnemies.value.filter(e => !readEntries.value.has(`enemy:${e.id}`)).length
  })

  const unreadRegionCount = computed(() => {
    return discoveredRegions.value.filter(r => !readEntries.value.has(`region:${r.id}`)).length
  })

  const unreadTopicCount = computed(() => {
    return visibleTopics.value.filter(t => !readEntries.value.has(`topic:${t.id}`)).length
  })

  const totalUnreadCount = computed(() => {
    return unreadHeroCount.value + unreadEnemyCount.value + unreadRegionCount.value
  })

  // --- Persistence ---

  function saveState() {
    return {
      unlockedTopics: Array.from(unlockedTopics.value),
      readEntries: Array.from(readEntries.value)
    }
  }

  function loadState(savedState) {
    if (savedState.unlockedTopics) {
      unlockedTopics.value = new Set(savedState.unlockedTopics)
    }
    if (savedState.readEntries) {
      readEntries.value = new Set(savedState.readEntries)
    }
  }

  // Retroactively unlock topics based on existing hero collection
  function syncUnlocksFromCollection() {
    const heroesStore = useHeroesStore()
    const allTemplates = getAllHeroTemplates()
    for (const template of allTemplates) {
      if (heroesStore.hasTemplate(template.id)) {
        unlockTopicsForHero(template)
      }
    }
  }

  return {
    // State
    unlockedTopics,
    readEntries,

    // Topic management
    unlockTopic,
    isTopicUnlocked,
    visibleTopics,
    unlockTopicsForHero,

    // Read tracking
    markRead,
    hasRead,

    // Discovery
    discoveredHeroes,
    totalHeroes,
    discoveredEnemies,
    totalEnemies,
    discoveredRegions,
    totalRegions,

    // Unread counts
    unreadHeroCount,
    unreadEnemyCount,
    unreadRegionCount,
    unreadTopicCount,
    totalUnreadCount,

    // Persistence
    saveState,
    loadState,
    syncUnlocksFromCollection
  }
})
