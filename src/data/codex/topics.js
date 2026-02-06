export const topics = [
  // === Core Topics (always visible) ===
  {
    id: 'combat_basics',
    title: 'Combat Basics',
    category: 'Core',
    alwaysVisible: true,
    icon: '⚔️',
    iconName: 'sword'
  },
  {
    id: 'rarity',
    title: 'Rarity',
    category: 'Core',
    alwaysVisible: true,
    icon: '⭐'
  },
  {
    id: 'classes_and_roles',
    title: 'Classes & Roles',
    category: 'Core',
    alwaysVisible: true,
    icon: '🛡️'
  },
  {
    id: 'gacha_and_summoning',
    title: 'Gacha & Summoning',
    category: 'Core',
    alwaysVisible: true,
    icon: '🎴'
  },
  {
    id: 'currency',
    title: 'Currency',
    category: 'Core',
    alwaysVisible: true,
    icon: '💎'
  },
  {
    id: 'party_and_leader',
    title: 'Party & Leader',
    category: 'Core',
    alwaysVisible: true,
    icon: '👑'
  },
  {
    id: 'items_and_inventory',
    title: 'Items & Inventory',
    category: 'Core',
    alwaysVisible: true,
    icon: '🎒'
  },

  // === Advanced Topics (unlock on encounter) ===
  {
    id: 'valor',
    title: 'Valor',
    category: 'Class Resources',
    alwaysVisible: false,
    icon: '🏅',
    unlockCondition: 'knight_encountered'
  },
  {
    id: 'rage',
    title: 'Rage',
    category: 'Class Resources',
    alwaysVisible: false,
    icon: '🔥',
    iconName: 'fire',
    unlockCondition: 'berserker_encountered'
  },
  {
    id: 'focus',
    title: 'Focus',
    category: 'Class Resources',
    alwaysVisible: false,
    icon: '🎯',
    iconName: 'target',
    unlockCondition: 'ranger_encountered'
  },
  {
    id: 'verse_and_finale',
    title: 'Verse & Finale',
    category: 'Class Resources',
    alwaysVisible: false,
    icon: '🎵',
    unlockCondition: 'bard_encountered'
  },
  {
    id: 'essence_and_volatility',
    title: 'Essence & Volatility',
    category: 'Class Resources',
    alwaysVisible: false,
    icon: '🧪',
    unlockCondition: 'alchemist_encountered'
  },
  {
    id: 'shards',
    title: 'Shards',
    category: 'Systems',
    alwaysVisible: false,
    icon: '💠',
    unlockCondition: 'shards_visited'
  },
  {
    id: 'fusion',
    title: 'Fusion',
    category: 'Systems',
    alwaysVisible: false,
    icon: '✨',
    unlockCondition: 'merge_visited'
  },
  {
    id: 'genus_loci',
    title: 'Genus Loci',
    category: 'Systems',
    alwaysVisible: false,
    icon: '🐉',
    unlockCondition: 'genus_loci_unlocked'
  },
  {
    id: 'explorations',
    title: 'Explorations',
    category: 'Systems',
    alwaysVisible: false,
    icon: '🧭',
    unlockCondition: 'exploration_unlocked'
  },
  {
    id: 'colosseum',
    title: 'Colosseum',
    category: 'Systems',
    alwaysVisible: false,
    icon: '🏟️',
    unlockCondition: 'colosseum_visited'
  },
  {
    id: 'the_maw',
    title: 'The Maw',
    category: 'Systems',
    alwaysVisible: false,
    icon: '🕳️',
    unlockCondition: 'maw_visited'
  },
  {
    id: 'status_effects',
    title: 'Status Effects',
    category: 'Advanced Combat',
    alwaysVisible: false,
    icon: '💫',
    unlockCondition: 'status_effect_applied'
  },
  {
    id: 'leader_skills',
    title: 'Leader Skills',
    category: 'Advanced Combat',
    alwaysVisible: false,
    icon: '👑',
    unlockCondition: 'five_star_obtained'
  },
  {
    id: 'damage_interception',
    title: 'Damage Interception',
    category: 'Advanced Combat',
    alwaysVisible: false,
    icon: '🛡️',
    unlockCondition: 'interception_triggered'
  }
]

export function getTopicsByCategory() {
  const categories = {}
  for (const topic of topics) {
    if (!categories[topic.category]) {
      categories[topic.category] = []
    }
    categories[topic.category].push(topic)
  }
  return categories
}

export function getTopic(topicId) {
  return topics.find(t => t.id === topicId) || null
}
