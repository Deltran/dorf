export const classes = {
  paladin: {
    id: 'paladin',
    title: 'Paladin',
    role: 'tank',
    resourceName: 'Faith',
    color: '#fbbf24'
  },
  knight: {
    id: 'knight',
    title: 'Knight',
    role: 'tank',
    resourceName: 'Valor',
    resourceType: 'valor',
    color: '#3b82f6'
  },
  mage: {
    id: 'mage',
    title: 'Mage',
    role: 'dps',
    resourceName: 'Mana',
    color: '#a855f7'
  },
  berserker: {
    id: 'berserker',
    title: 'Berserker',
    role: 'dps',
    resourceName: 'Rage',
    resourceType: 'rage',
    color: '#ef4444'
  },
  ranger: {
    id: 'ranger',
    title: 'Ranger',
    role: 'dps',
    resourceName: 'Focus',
    resourceType: 'focus',
    color: '#f59e0b'
  },
  cleric: {
    id: 'cleric',
    title: 'Cleric',
    role: 'healer',
    resourceName: 'Devotion',
    color: '#22c55e'
  },
  druid: {
    id: 'druid',
    title: 'Druid',
    role: 'healer',
    resourceName: 'Nature',
    color: '#10b981'
  },
  bard: {
    id: 'bard',
    title: 'Bard',
    role: 'support',
    resourceName: 'Verse',
    resourceType: 'verse',
    color: '#ec4899'
  },
  alchemist: {
    id: 'alchemist',
    title: 'Alchemist',
    role: 'support',
    resourceName: 'Essence',
    resourceType: 'essence',
    color: '#06b6d4'
  }
}

export function getClass(classId) {
  return classes[classId] || null
}

export function getClassesByRole(role) {
  return Object.values(classes).filter(c => c.role === role)
}
