export const classes = {
  paladin: {
    id: 'paladin',
    title: 'Paladin',
    role: 'tank',
    resourceName: 'Faith'
  },
  knight: {
    id: 'knight',
    title: 'Knight',
    role: 'tank',
    resourceName: 'Valor',
    resourceType: 'valor'
  },
  mage: {
    id: 'mage',
    title: 'Mage',
    role: 'dps',
    resourceName: 'Mana'
  },
  berserker: {
    id: 'berserker',
    title: 'Berserker',
    role: 'dps',
    resourceName: 'Rage',
    resourceType: 'rage'
  },
  ranger: {
    id: 'ranger',
    title: 'Ranger',
    role: 'dps',
    resourceName: 'Focus',
    resourceType: 'focus'
  },
  cleric: {
    id: 'cleric',
    title: 'Cleric',
    role: 'healer',
    resourceName: 'Devotion'
  },
  druid: {
    id: 'druid',
    title: 'Druid',
    role: 'healer',
    resourceName: 'Nature'
  },
  bard: {
    id: 'bard',
    title: 'Bard',
    role: 'support',
    resourceName: 'Verse',
    resourceType: 'verse'
  },
  alchemist: {
    id: 'alchemist',
    title: 'Alchemist',
    role: 'support',
    resourceName: 'Essence'
  }
}

export function getClass(classId) {
  return classes[classId] || null
}

export function getClassesByRole(role) {
  return Object.values(classes).filter(c => c.role === role)
}
