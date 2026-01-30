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
  SLEEP: 'sleep', // Skips turn, removed when attacked

  // Special
  SHIELD: 'shield', // Absorbs damage
  THORNS: 'thorns', // Damages attacker when hit
  RIPOSTE: 'riposte', // Counter-attack when hit by enemy with lower DEF

  // Targeting manipulation
  TAUNT: 'taunt', // Enemies must target this unit
  UNTARGETABLE: 'untargetable', // Cannot be targeted by enemies
  EVASION: 'evasion', // Chance to completely avoid attacks

  // Protection
  GUARDING: 'guarding', // Redirects damage from guarded ally to guardian
  GUARDIAN_LINK: 'guardian_link', // Redirects portion of damage to linked guardian
  DAMAGE_STORE: 'damage_store', // Stores damage taken, releases as AoE on expiration
  DIVINE_SACRIFICE: 'divine_sacrifice', // Intercepts all ally damage with self-sustain
  DAMAGE_REDUCTION: 'damage_reduction', // Reduces incoming damage by percentage
  REFLECT: 'reflect', // Reflects percentage of damage taken back to attacker
  DEBUFF_IMMUNE: 'debuff_immune', // Immune to new debuffs

  // Triggered effects
  WELL_FED: 'well_fed', // Auto-heals when HP drops below threshold

  // Reactive effects
  FLAME_SHIELD: 'flame_shield', // Burns attackers when hit

  // Vulnerability
  MARKED: 'marked', // Increases damage taken from all sources

  // Protection from death
  DEATH_PREVENTION: 'death_prevention',

  // Offensive buff
  VICIOUS: 'vicious', // Bonus damage vs debuffed enemies

  // Leader skill debuff (provides buff but counts as debuff)
  DISCORDANT_RESONANCE: 'discordant_resonance', // +damage dealt, -healing received

  // AoE conversion
  ECHOING: 'echoing', // Next single-hit skill hits all enemies

  // Turn order manipulation
  SHATTERED_TEMPO: 'shattered_tempo' // Acts in top N of turn order
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
  [EffectType.SLEEP]: {
    name: 'Asleep',
    icon: '💤',
    color: '#6366f1',
    isBuff: false,
    isControl: true,
    isSleep: true,
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
  },
  [EffectType.EVASION]: {
    name: 'Evasion',
    icon: '💨',
    color: '#a78bfa',
    isBuff: true,
    isEvasion: true,
    stackable: true
  },
  [EffectType.GUARDING]: {
    name: 'Guarding',
    icon: '🛡️',
    color: '#3b82f6',
    isBuff: true,
    isGuarding: true,
    stackable: false
  },
  [EffectType.GUARDIAN_LINK]: {
    name: 'Guardian Link',
    icon: '🔗',
    color: '#fbbf24',
    isBuff: true,
    isGuardianLink: true,
    stackable: false
  },
  [EffectType.DAMAGE_STORE]: {
    name: "Judgment's Echo",
    icon: '⚡',
    color: '#fbbf24',
    isBuff: true,
    isDamageStore: true,
    stackable: false
  },
  [EffectType.DIVINE_SACRIFICE]: {
    name: 'Divine Sacrifice',
    icon: '✨',
    color: '#fbbf24',
    isBuff: true,
    isDivineSacrifice: true,
    stackable: false
  },
  [EffectType.DAMAGE_REDUCTION]: {
    name: 'Fortified',
    icon: '🏰',
    color: '#60a5fa',
    isBuff: true,
    isDamageReduction: true,
    stackable: false
  },
  [EffectType.REFLECT]: {
    name: 'Reflect',
    icon: '🪞',
    color: '#c084fc',
    isBuff: true,
    isReflect: true,
    stackable: false
  },
  [EffectType.DEBUFF_IMMUNE]: {
    name: 'Debuff Immune',
    icon: '✨',
    color: '#fbbf24',
    isBuff: true,
    isDebuffImmune: true,
    stackable: false
  },
  [EffectType.WELL_FED]: {
    name: 'Well Fed',
    icon: '🍲',
    color: '#f59e0b',
    isBuff: true,
    isTriggered: true,
    stackable: false
  },
  [EffectType.FLAME_SHIELD]: {
    name: 'Flame Shield',
    icon: '🔥',
    color: '#f97316',
    isBuff: true,
    isFlameShield: true,
    stackable: false
  },
  [EffectType.MARKED]: {
    name: 'Marked',
    icon: '🎯',
    color: '#ef4444',
    isBuff: false,
    isMarked: true,
    stackable: false
  },
  [EffectType.VICIOUS]: {
    name: 'Vicious',
    icon: '🗡️',
    color: '#dc2626',
    isBuff: true,
    isVicious: true,
    stackable: false
  },
  [EffectType.DEATH_PREVENTION]: {
    name: 'Protected',
    icon: '🌳',
    color: '#22c55e',
    isBuff: true,
    isDeathPrevention: true,
    stackable: false
  },
  [EffectType.DISCORDANT_RESONANCE]: {
    name: 'Discordant Resonance',
    icon: '🎵',
    color: '#ec4899',
    isBuff: false, // Counts as debuff for cleanse purposes
    isDiscordantResonance: true,
    stackable: false
  },
  [EffectType.ECHOING]: {
    name: 'Echoing',
    icon: '🔊',
    color: '#ec4899',
    isBuff: true,
    isEchoing: true,
    stackable: false
  }
}

// Helper to create a status effect instance
export function createEffect(type, { duration = 2, value = 0, sourceId = null, ...extra } = {}) {
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
    definition,
    ...extra // Additional properties (e.g., casterAtk, atkPercent, threshold for WELL_FED)
  }
}

// Get effect definition
export function getEffectDefinition(type) {
  return effectDefinitions[type] || null
}
