// Status Effect Types
export const EffectType = {
  // Stat modifiers (percentage-based)
  ATK_UP: 'atk_up',
  ATK_DOWN: 'atk_down',
  DEF_UP: 'def_up',
  DEF_DOWN: 'def_down',
  SPD_UP: 'spd_up',
  SPD_DOWN: 'spd_down',

  // Damage over time
  POISON: 'poison',
  BURN: 'burn',

  // Heal over time
  REGEN: 'regen',
  MP_REGEN: 'mp_regen',

  // Control effects
  STUN: 'stun',

  // Special
  SHIELD: 'shield', // Absorbs damage
  THORNS: 'thorns', // Damages attacker when hit
  RIPOSTE: 'riposte', // Counter-attack when hit by enemy with lower DEF

  // Targeting manipulation
  TAUNT: 'taunt', // Enemies must target this unit
  UNTARGETABLE: 'untargetable' // Cannot be targeted by enemies
}

// Effect definitions with display info and default behavior
export const effectDefinitions = {
  [EffectType.ATK_UP]: {
    name: 'ATK Up',
    icon: '⚔️↑',
    color: '#ef4444',
    isBuff: true,
    stat: 'atk',
    stackable: false // Same effect refreshes duration, doesn't stack
  },
  [EffectType.ATK_DOWN]: {
    name: 'ATK Down',
    icon: '⚔️↓',
    color: '#6b7280',
    isBuff: false,
    stat: 'atk',
    stackable: false
  },
  [EffectType.DEF_UP]: {
    name: 'DEF Up',
    icon: '🛡️↑',
    color: '#3b82f6',
    isBuff: true,
    stat: 'def',
    stackable: false
  },
  [EffectType.DEF_DOWN]: {
    name: 'DEF Down',
    icon: '🛡️↓',
    color: '#6b7280',
    isBuff: false,
    stat: 'def',
    stackable: false
  },
  [EffectType.SPD_UP]: {
    name: 'SPD Up',
    icon: '💨↑',
    color: '#22c55e',
    isBuff: true,
    stat: 'spd',
    stackable: false
  },
  [EffectType.SPD_DOWN]: {
    name: 'SPD Down',
    icon: '💨↓',
    color: '#6b7280',
    isBuff: false,
    stat: 'spd',
    stackable: false
  },
  [EffectType.POISON]: {
    name: 'Poison',
    icon: '☠️',
    color: '#a855f7',
    isBuff: false,
    isDot: true,
    stackable: true // Multiple poison sources stack
  },
  [EffectType.BURN]: {
    name: 'Burn',
    icon: '🔥',
    color: '#f97316',
    isBuff: false,
    isDot: true,
    stackable: true
  },
  [EffectType.REGEN]: {
    name: 'Regen',
    icon: '💚',
    color: '#22c55e',
    isBuff: true,
    isHot: true,
    stackable: false
  },
  [EffectType.MP_REGEN]: {
    name: 'MP Regen',
    icon: '💙',
    color: '#3b82f6',
    isBuff: true,
    isMpHot: true,
    stackable: false
  },
  [EffectType.STUN]: {
    name: 'Stunned',
    icon: '💫',
    color: '#fbbf24',
    isBuff: false,
    isControl: true,
    stackable: false
  },
  [EffectType.SHIELD]: {
    name: 'Shield',
    icon: '🔰',
    color: '#60a5fa',
    isBuff: true,
    stackable: false
  },
  [EffectType.THORNS]: {
    name: 'Thorns',
    icon: '🔄',
    color: '#a855f7',
    isBuff: true,
    isThorns: true,
    stackable: false
  },
  [EffectType.RIPOSTE]: {
    name: 'Riposte',
    icon: '⚔️',
    color: '#f59e0b',
    isBuff: true,
    isRiposte: true,
    stackable: false
  },
  [EffectType.TAUNT]: {
    name: 'Taunt',
    icon: '🎯',
    color: '#ef4444',
    isBuff: true,
    isTaunt: true,
    stackable: false
  },
  [EffectType.UNTARGETABLE]: {
    name: 'Untargetable',
    icon: '👻',
    color: '#8b5cf6',
    isBuff: true,
    isUntargetable: true,
    stackable: false
  }
}

// Helper to create a status effect instance
export function createEffect(type, { duration = 2, value = 0, sourceId = null } = {}) {
  const definition = effectDefinitions[type]
  if (!definition) {
    console.warn(`Unknown effect type: ${type}`)
    return null
  }

  return {
    type,
    duration, // Turns remaining
    value, // Percentage for stat mods, flat damage for DoTs, etc.
    sourceId, // Who applied this effect
    definition
  }
}

// Get effect definition
export function getEffectDefinition(type) {
  return effectDefinitions[type] || null
}
