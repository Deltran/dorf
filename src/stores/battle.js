import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHeroesStore } from './heroes.js'
import { useEquipmentStore } from './equipment.js'
import { useQuestsStore } from './quests.js'
import { getEnemyTemplate } from '../data/enemies/index.js'
import { EffectType, createEffect, getEffectDefinition, effectDefinitions } from '../data/statusEffects.js'
import { getClass } from '../data/classes.js'
import { getGenusLoci } from '../data/genusLoci.js'
import { getGenusLociAbilitiesForLevel } from '../data/genusLociAbilities.js'
import { getEquipment } from '../data/equipment.js'
import { getHeroTemplate } from '../data/heroes/index.js'

// Battle states
export const BattleState = {
  IDLE: 'idle',
  STARTING: 'starting',
  PLAYER_TURN: 'player_turn',
  ENEMY_TURN: 'enemy_turn',
  ANIMATING: 'animating',
  VICTORY: 'victory',
  DEFEAT: 'defeat'
}

export const useBattleStore = defineStore('battle', () => {
  // Constants
  const MAX_ENEMIES = 6

  // State
  const state = ref(BattleState.IDLE)
  const heroes = ref([]) // { instanceId, ..., statusEffects: [] }
  const enemies = ref([]) // { id, ..., statusEffects: [] }
  const nextEnemyId = ref(0)
  const turnOrder = ref([])
  const currentTurnIndex = ref(0)
  const roundNumber = ref(1)
  const battleLog = ref([])
  const selectedAction = ref(null)
  const selectedTarget = ref(null)
  const combatEffects = ref([]) // For visual feedback: { id, targetId, targetType, effectType, value }
  const leaderSkillActivation = ref(null) // { skillName, leaderId } - for visual announcement
  const finaleActivation = ref(null) // { bardId, finaleName } - for visual announcement
  let currentEffectSource = '' // Context: name of skill/ability currently applying effects
  const enemySkillActivation = ref(null) // { enemyId, skillName } - for visual announcement
  const battleType = ref('normal') // 'normal' or 'genusLoci'
  const genusLociMeta = ref(null) // { genusLociId, powerLevel, triggeredTowersWrath }

  // Track total ally HP lost for Cacophon's Finale
  const totalAllyHpLost = ref(0)

  // Track Blood Tempo uses per hero for Torga's Blood Echo
  const bloodTempoUses = ref({})

  // Getters
  const currentUnit = computed(() => {
    if (turnOrder.value.length === 0) return null
    const turn = turnOrder.value[currentTurnIndex.value]
    if (!turn) return null

    if (turn.type === 'hero') {
      return heroes.value.find(h => h.instanceId === turn.id)
    } else {
      return enemies.value.find(e => e.id === turn.id)
    }
  })

  const isPlayerTurn = computed(() => {
    return state.value === BattleState.PLAYER_TURN
  })

  const aliveHeroes = computed(() => {
    return heroes.value.filter(h => h.currentHp > 0)
  })

  const deadHeroes = computed(() => {
    return heroes.value.filter(h => h.currentHp <= 0)
  })

  const aliveEnemies = computed(() => {
    return enemies.value.filter(e => e.currentHp > 0)
  })

  const isBattleOver = computed(() => {
    return state.value === BattleState.VICTORY || state.value === BattleState.DEFEAT
  })

  // Get skill by index from current unit (supports both 'skill' and 'skills')
  function getSkillByIndex(unit, index) {
    const template = unit?.template
    if (!template) return null
    if (template.skills) return template.skills[index] || null
    if (template.skill && index === 0) return template.skill
    return null
  }

  // Parse skill index from action string (e.g., 'skill_0' -> 0)
  function parseSkillIndex(action) {
    if (!action?.startsWith('skill_')) return null
    return parseInt(action.split('_')[1], 10)
  }

  // Check if a unit matches a leader skill condition
  function matchesCondition(unit, condition) {
    if (!condition) return true

    const template = unit.template

    // Class-based conditions
    if (condition.classId) {
      if (!template) return false
      if (typeof condition.classId === 'string') {
        if (template.classId !== condition.classId) return false
      } else if (condition.classId.not) {
        if (template.classId === condition.classId.not) return false
      }
    }

    // Role-based conditions (hero template role overrides class role)
    if (condition.role) {
      if (!template) return false
      const heroClass = getClass(template.classId)
      if (!heroClass) return false
      const effectiveRole = template.role || heroClass.role

      if (typeof condition.role === 'string') {
        if (effectiveRole !== condition.role) return false
      } else if (condition.role.not) {
        if (effectiveRole === condition.role.not) return false
      }
    }

    // HP threshold condition - check if HP percentage is below threshold
    if (condition.hpBelow !== undefined) {
      const hpPercent = (unit.currentHp / unit.maxHp) * 100
      if (hpPercent >= condition.hpBelow) return false
    }

    return true
  }

  // Public wrapper for condition checking (exposed as store action)
  function checkLeaderCondition(hero, condition) {
    return matchesCondition(hero, condition)
  }

  // Get bonus stat from leader skill passive effects
  function getLeaderBonusStat(hero, statName, leaderSkill) {
    if (!leaderSkill?.effects) return 0

    let bonus = 0
    for (const effect of leaderSkill.effects) {
      if (effect.type === 'passive' && effect.stat === statName) {
        if (matchesCondition(hero, effect.condition)) {
          bonus += Math.floor(hero[statName] * (effect.value / 100))
        }
      }
    }
    return bonus
  }

  // Get the active leader skill from the party leader
  function getActiveLeaderSkill() {
    const heroesStore = useHeroesStore()
    const leaderId = heroesStore.partyLeader
    if (!leaderId) return null

    const leader = heroes.value.find(h => h.instanceId === leaderId)
    if (!leader) return null

    return leader.template?.leaderSkill || null
  }

  // Get targets for a leader skill effect
  function getLeaderEffectTargets(targetType, condition) {
    let targets = []

    if (targetType === 'all_allies') {
      targets = [...aliveHeroes.value]
    } else if (targetType === 'all_enemies') {
      targets = [...aliveEnemies.value]
    }

    if (condition) {
      targets = targets.filter(t => matchesCondition(t, condition))
    }

    return targets
  }

  // Apply passive leader skill effects at battle start
  function applyPassiveLeaderEffects() {
    const leaderSkill = getActiveLeaderSkill()
    if (!leaderSkill) return

    for (const effect of leaderSkill.effects) {
      if (effect.type === 'passive') {
        for (const hero of heroes.value) {
          if (matchesCondition(hero, effect.condition)) {
            if (!hero.leaderBonuses) hero.leaderBonuses = {}
            hero.leaderBonuses[effect.stat] = (hero.leaderBonuses[effect.stat] || 0) + effect.value
          }
        }
      }

      // Handle passive_lifesteal type (Mara's leader skill)
      if (effect.type === 'passive_lifesteal') {
        const targets = getLeaderEffectTargets(effect.target, effect.condition)
        for (const target of targets) {
          if (!target.leaderBonuses) target.leaderBonuses = {}
          target.leaderBonuses.lifesteal = (target.leaderBonuses.lifesteal || 0) + effect.value
        }
      }

      // Handle battle_start_debuff type (Cacophon's Harmonic Bleeding)
      if (effect.type === 'battle_start_debuff') {
        const heroesStore = useHeroesStore()
        // Trigger visual announcement (golden glow + floating text)
        leaderSkillActivation.value = {
          skillName: leaderSkill.name,
          leaderId: heroesStore.partyLeader
        }
        applyBattleStartDebuffLeaderEffect(heroes.value, effect)
      }
    }

    addLog(`Leader skill: ${leaderSkill.name} is active!`)
  }

  // Apply timed leader skill effects at round start
  function applyTimedLeaderEffects(round) {
    const leaderSkill = getActiveLeaderSkill()
    if (!leaderSkill) return

    const heroesStore = useHeroesStore()

    // Check if any timed effects will trigger this round
    const willTrigger = leaderSkill.effects.some(e =>
      e.type === 'timed' && e.triggerRound === round
    )

    if (willTrigger) {
      // Trigger visual announcement
      leaderSkillActivation.value = {
        skillName: leaderSkill.name,
        leaderId: heroesStore.partyLeader
      }
    }

    for (const effect of leaderSkill.effects) {
      if (effect.type !== 'timed') continue
      if (effect.triggerRound !== round) continue

      const targets = getLeaderEffectTargets(effect.target, effect.condition)

      for (const target of targets) {
        if (effect.apply.effectType === 'heal') {
          // Heal based on leader's ATK
          const leader = heroes.value.find(h => h.instanceId === heroesStore.partyLeader)
          if (leader) {
            const leaderAtk = getEffectiveStat(leader, 'atk')
            const healAmount = Math.floor(leaderAtk * effect.apply.value / 100)
            const oldHp = target.currentHp
            target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount)
            const actualHeal = target.currentHp - oldHp
            if (actualHeal > 0) {
              emitCombatEffect(target.instanceId, 'hero', 'heal', actualHeal)
            }
          }
        } else {
          // Apply status effect
          applyEffect(target, effect.apply.effectType, {
            duration: effect.apply.duration,
            value: effect.apply.value,
            sourceId: 'leader_skill'
          })
        }
      }

      addLog(`Leader skill: ${leaderSkill.name} activates!`)
    }
  }

  // Apply passive regen leader skill effects each round
  function applyPassiveRegenLeaderEffects() {
    const leaderSkill = getActiveLeaderSkill()
    if (!leaderSkill) return

    for (const effect of leaderSkill.effects) {
      if (effect.type !== 'passive_regen') continue

      const targets = getLeaderEffectTargets(effect.target, effect.condition)

      for (const target of targets) {
        const maxHp = target.maxHp
        const healAmount = Math.floor(maxHp * effect.percentMaxHp / 100)
        const oldHp = target.currentHp
        target.currentHp = Math.min(maxHp, target.currentHp + healAmount)
        const actualHeal = target.currentHp - oldHp
        if (actualHeal > 0) {
          emitCombatEffect(target.instanceId, 'hero', 'heal', actualHeal)
          addLog(`${target.template.name} regenerates ${actualHeal} HP!`)
        }
      }
    }
  }

  // Check HP threshold triggers from leader skill (Mara's "What Doesn't Kill Us")
  function checkHpThresholdLeaderTriggers(unit, hpBefore) {
    // Only trigger for heroes (not enemies)
    if (!unit.instanceId) return

    const leaderSkill = getActiveLeaderSkill()
    if (!leaderSkill) return

    for (const effect of leaderSkill.effects) {
      if (effect.type !== 'hp_threshold_triggered') continue

      const threshold = unit.maxHp * (effect.threshold / 100)

      // Check if HP crossed the threshold (was above, now at or below)
      if (hpBefore > threshold && unit.currentHp <= threshold) {
        // Check triggerOnce flag
        if (effect.triggerOnce && unit.leaderThresholdTriggered) continue

        if (effect.triggerOnce) {
          unit.leaderThresholdTriggered = true
        }

        // Apply the effect
        applyEffect(unit, effect.apply.effectType, {
          duration: effect.apply.duration,
          value: effect.apply.value,
          sourceId: 'leader_skill'
        })

        const unitName = unit.template?.name || 'Unknown'
        addLog(`${leaderSkill.name}: ${unitName} gains ${effect.apply.effectType}!`)
      }
    }
  }

  const currentTargetType = computed(() => {
    if (selectedAction.value === 'attack') {
      return 'enemy'
    }
    const skillIndex = parseSkillIndex(selectedAction.value)
    if (skillIndex !== null) {
      const skill = getSkillByIndex(currentUnit.value, skillIndex)
      return skill?.targetType || 'enemy'
    }
    return null
  })

  const currentSkillExcludesSelf = computed(() => {
    const skillIndex = parseSkillIndex(selectedAction.value)
    if (skillIndex === null) return false
    const skill = getSkillByIndex(currentUnit.value, skillIndex)
    return skill?.excludeSelf || false
  })

  const needsTargetSelection = computed(() => {
    const targetType = currentTargetType.value
    return targetType === 'enemy' || targetType === 'ally' || targetType === 'dead_ally'
  })

  // ========== STATUS EFFECT FUNCTIONS ==========

  // Get effective stat for a unit (base stat + modifiers from effects)
  function getEffectiveStat(unit, statName) {
    const baseStat = unit.stats[statName] || 0
    let modifier = 0

    for (const effect of unit.statusEffects || []) {
      const def = effect.definition
      if (def.stat === statName) {
        // value is percentage (e.g., 20 = 20%)
        if (effect.type.includes('_up') || (def.isBuff && !effect.type.includes('_down'))) {
          modifier += effect.value * (effect.stacks || 1)
        } else if (effect.type.includes('_down') || (def.isDebuff && !effect.type.includes('_up'))) {
          modifier -= effect.value * (effect.stacks || 1)
        }
      }
    }

    // Add passive leader bonuses
    if (unit.leaderBonuses?.[statName]) {
      modifier += unit.leaderBonuses[statName]
    }

    // Add Heartbreak ATK bonus for Heartbreak heroes
    if (statName === 'atk' && hasHeartbreakPassive(unit)) {
      const { atkBonus } = getHeartbreakBonuses(unit)
      modifier += atkBonus
    }

    let total = Math.max(1, Math.floor(baseStat * (1 + modifier / 100)))

    // Apply Bushido passive for ATK (passive object format from hero templates)
    if (statName === 'atk' && unit.template?.passive?.atkPerMissingHpPercent) {
      const passive = unit.template.passive
      const maxHp = unit.maxHp || unit.stats?.hp || 1
      const missingHpPercent = 100 - (unit.currentHp / maxHp * 100)
      const bonusPercent = Math.min(
        missingHpPercent * passive.atkPerMissingHpPercent,
        passive.maxAtkBonus || 50
      )
      total = Math.floor(total * (1 + bonusPercent / 100))
    }

    return total
  }

  // Calculate effect value (supports flat value or ATK percentage)
  function calculateEffectValue(effect, casterAtk) {
    if (effect.atkPercent) {
      return Math.floor(casterAtk * effect.atkPercent / 100)
    }
    return effect.value || 0
  }

  // Apply a status effect to a unit
  function applyEffect(unit, effectType, { duration = 2, value = 0, sourceId = null, fromAllySkill = false, ...extra } = {}) {
    if (!unit.statusEffects) {
      unit.statusEffects = []
    }

    const definition = getEffectDefinition(effectType)
    if (!definition) return

    // Check for debuff immunity - block debuffs if unit has DEBUFF_IMMUNE
    if (!definition.isBuff && hasEffect(unit, EffectType.DEBUFF_IMMUNE)) {
      const unitName = unit.template?.name || 'Unknown'
      addLog(`${unitName} is immune to debuffs!`)
      return
    }

    const newEffect = createEffect(effectType, { duration, value, sourceId, ...extra })
    if (!newEffect) return

    // Attach source name for tooltip display
    if (currentEffectSource) {
      newEffect.sourceName = currentEffectSource
    }
    // Track whether this is a self-buff or ally-buff (for stat buff stacking)
    newEffect.fromAllySkill = fromAllySkill

    // Counter-based stacking (maxStacks)
    if (definition.maxStacks) {
      const existingIndex = unit.statusEffects.findIndex(e => e.type === effectType)

      if (existingIndex !== -1) {
        unit.statusEffects = unit.statusEffects.map((effect, index) => {
          if (index === existingIndex) {
            return {
              ...effect,
              stacks: Math.min(effect.stacks + 1, definition.maxStacks),
              duration: Math.max(effect.duration, duration)
            }
          }
          return effect
        })
      } else {
        newEffect.stacks = 1
        unit.statusEffects = [...unit.statusEffects, newEffect]
      }

      const unitName = unit.template?.name || 'Unknown'
      addLog(`${unitName} gains ${definition.name}!`)
      return
    }

    // For stat buffs/debuffs, self-applied and ally-applied can stack separately
    // Check if effect of same type AND same source type (self vs ally) exists
    const isStatEffect = definition.stat !== undefined
    const existingIndex = unit.statusEffects.findIndex(e => {
      if (e.type !== effectType) return false
      // For stat effects, also check if source type matches (self vs ally)
      if (isStatEffect && !definition.stackable) {
        return e.fromAllySkill === fromAllySkill
      }
      return true
    })

    if (existingIndex !== -1) {
      if (definition.stackable) {
        // Add another stack - reassign array for Vue reactivity
        unit.statusEffects = [...unit.statusEffects, newEffect]
      } else {
        // Refresh duration and update value if higher
        // Create new array with updated effect for Vue reactivity
        unit.statusEffects = unit.statusEffects.map((effect, index) => {
          if (index === existingIndex) {
            return {
              ...effect,
              duration: Math.max(effect.duration, duration),
              value: Math.max(effect.value, value)
            }
          }
          return effect
        })
      }
    } else {
      // New effect type (or new source type for stat effects) - add to array
      unit.statusEffects = [...unit.statusEffects, newEffect]
    }

    // Rangers gain focus when receiving beneficial effect from ally skill
    if (isRanger(unit) && definition.isBuff && fromAllySkill) {
      grantFocus(unit)
    }

    // Rangers lose focus when debuffed
    if (isRanger(unit) && !definition.isBuff) {
      removeFocus(unit)
    }

    const unitName = unit.template?.name || 'Unknown'
    addLog(`${unitName} gains ${definition.name}!`)
  }

  // Remove a specific effect type from a unit
  function removeEffect(unit, effectType) {
    if (!unit.statusEffects) return
    unit.statusEffects = unit.statusEffects.filter(e => e.type !== effectType)
  }

  // Remove all effects from a unit
  function clearEffects(unit) {
    unit.statusEffects = []
  }

  // Check if unit has a specific effect
  function hasEffect(unit, effectType) {
    return (unit.statusEffects || []).some(e => e.type === effectType)
  }

  // Get the current stack count for a counter-based stacking effect
  function getStacks(unit, effectType) {
    const effect = (unit.statusEffects || []).find(e => e.type === effectType)
    return effect?.stacks || 0
  }

  // Check if death prevention should trigger and handle it
  function checkDeathPrevention(unit, incomingDamage) {
    if (!unit.statusEffects) return false

    const deathPreventionEffect = unit.statusEffects.find(
      e => e.type === EffectType.DEATH_PREVENTION
    )

    if (!deathPreventionEffect) return false

    // Only trigger if damage would kill
    if (unit.currentHp - incomingDamage > 0) return false

    // Prevent death: set HP to 1
    unit.currentHp = 1

    // Heal based on caster's ATK
    if (deathPreventionEffect.healOnTrigger && deathPreventionEffect.casterAtk) {
      const healAmount = Math.floor(deathPreventionEffect.casterAtk * deathPreventionEffect.healOnTrigger / 100)
      unit.currentHp = Math.min(unit.maxHp, unit.currentHp + healAmount)
    }

    // Damage the source hero if damageToSourceOnTrigger is set (Philemon's Undying Devotion)
    if (deathPreventionEffect.damageToSourceOnTrigger && deathPreventionEffect.sourceId) {
      const source = heroes.value.find(h => h.instanceId === deathPreventionEffect.sourceId)
      if (source && source.currentHp > 0) {
        const selfDamage = Math.floor(source.maxHp * deathPreventionEffect.damageToSourceOnTrigger / 100)
        source.currentHp = Math.max(1, source.currentHp - selfDamage)
        addLog(`${source.template.name} takes ${selfDamage} damage from Undying Devotion!`)
      }
    }

    // Remove the effect (one-time use)
    unit.statusEffects = unit.statusEffects.filter(
      e => e.type !== EffectType.DEATH_PREVENTION
    )

    return true
  }

  // Process effects at start of turn (check for stun, etc.)
  function processStartOfTurnEffects(unit) {
    const unitName = unit.template?.name || 'Unknown'

    if (hasEffect(unit, EffectType.STUN)) {
      addLog(`${unitName} is stunned and cannot act!`)
      return false // Cannot act
    }

    if (hasEffect(unit, EffectType.SLEEP)) {
      // Check for regenerative_sleep passive (Great Troll)
      const regenPassive = unit.passiveAbilities?.find(p => p.healWhileSleeping)
      if (regenPassive) {
        const healAmount = Math.floor(unit.maxHp * (regenPassive.healWhileSleeping.percentMaxHp / 100))
        unit.currentHp = Math.min(unit.maxHp, unit.currentHp + healAmount)
        addLog(`${unitName} regenerates ${healAmount} HP while sleeping!`)
        emitCombatEffect(unit.id, 'enemy', 'heal', healAmount)
      }
      addLog(`${unitName} is asleep and cannot act!`)
      return false // Cannot act
    }

    // Check for start-of-turn buff passives (e.g., Pyroclast's Tectonic Charge)
    if (unit.passiveAbilities) {
      for (const passive of unit.passiveAbilities) {
        if (passive.startOfTurnBuff) {
          let buffValue = passive.startOfTurnBuff.value
          // Check for modifying passives (e.g., Pyroclastic Flow - stronger buff below HP threshold)
          const modifier = unit.passiveAbilities.find(p => p.modifies === passive.id)
          if (modifier) {
            const hpPercent = (unit.currentHp / unit.maxHp) * 100
            if (modifier.triggerCondition === 'hp_below_50' && hpPercent < 50) {
              buffValue = modifier.modifiedValue
            }
          }
          applyEffect(unit, passive.startOfTurnBuff.type, {
            duration: passive.startOfTurnBuff.duration,
            value: buffValue,
            sourceId: unit.id
          })
          addLog(`${unitName}'s ${passive.name} increases ATK by ${buffValue}%!`)
          emitCombatEffect(unit.id, 'enemy', 'buff', 0)
        }
      }
    }

    return true // Can act
  }

  // Execute a Bard's Finale effect
  function executeFinale(bard) {
    const finale = bard.template.finale
    if (!finale) return

    addLog(`${bard.template.name}'s Finale: ${finale.name}!`)
    finaleActivation.value = { bardId: bard.instanceId, finaleName: finale.name }

    // Reset verses
    bard.currentVerses = 0
    bard.lastSkillName = null

    if (!finale.effects) return

    // Handle special finale types that work on the whole party (not per-target)
    for (const effect of finale.effects) {
      if (effect.type === 'suffering_crescendo') {
        processSufferingCrescendoFinale(heroes.value, effect)
        addLog(`All allies gain ATK and DEF from accumulated suffering!`)
        for (const hero of heroes.value) {
          if (hero.currentHp > 0) {
            emitCombatEffect(hero.instanceId, 'hero', 'buff', 0)
          }
        }
      }
    }

    for (const effect of finale.effects) {
      // Skip effects already handled above
      if (effect.type === 'suffering_crescendo') continue
      if (finale.target === 'all_allies') {
        for (const hero of heroes.value) {
          if (hero.currentHp <= 0) continue
          applyFinaleEffect(bard, hero, effect)
        }
      } else if (finale.target === 'all_enemies') {
        for (const enemy of enemies.value) {
          if (enemy.currentHp <= 0) continue
          applyFinaleEffectToEnemy(bard, enemy, effect)
        }
      }
    }
  }

  function applyFinaleEffect(bard, target, effect) {
    // Get Finale boost from equipment
    const finaleBoost = getFinaleBoost(bard.templateId)
    const boostMultiplier = 1 + finaleBoost / 100

    // Resource grants
    if (effect.type === 'resource_grant') {
      if (effect.rageAmount && isBerserker(target)) {
        const boostedAmount = Math.floor(effect.rageAmount * boostMultiplier)
        gainRage(target, boostedAmount)
        addLog(`${target.template.name} gains ${boostedAmount} Rage!`)
        emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
      }
      if (effect.focusGrant && isRanger(target)) {
        grantFocus(target)
        emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
      }
      if (effect.valorAmount && isKnight(target)) {
        const boostedAmount = Math.floor(effect.valorAmount * boostMultiplier)
        gainValor(target, boostedAmount)
        addLog(`${target.template.name} gains ${boostedAmount} Valor!`)
        emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
      }
      if (effect.mpAmount && !isBerserker(target) && !isRanger(target) && !isKnight(target) && !isBard(target)) {
        const boostedAmount = Math.floor(effect.mpAmount * boostMultiplier)
        const oldMp = target.currentMp || 0
        target.currentMp = Math.min(target.maxMp || 100, oldMp + boostedAmount)
        const actual = target.currentMp - oldMp
        if (actual > 0) {
          addLog(`${target.template.name} gains ${actual} MP!`)
          emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
        }
      }
      if (effect.verseAmount && isBard(target) && target.instanceId !== bard.instanceId) {
        gainVerse(target)
        addLog(`${target.template.name} gains 1 Verse!`)
        emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
      }
    }

    // Heal (percentage of Bard's ATK)
    if (effect.type === 'heal' && effect.value) {
      const bardAtk = getEffectiveStat(bard, 'atk')
      const boostedValue = effect.value * boostMultiplier
      const healAmount = Math.floor(bardAtk * (boostedValue / 100))
      const oldHp = target.currentHp
      target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount)
      const actual = target.currentHp - oldHp
      if (actual > 0) {
        emitCombatEffect(target.instanceId, 'hero', 'heal', actual)
      }
    }
  }

  function applyFinaleEffectToEnemy(bard, enemy, effect) {
    // Get Finale boost from equipment
    const finaleBoost = getFinaleBoost(bard.templateId)
    const boostMultiplier = 1 + finaleBoost / 100

    // Damage (percentage of Bard's ATK)
    if (effect.type === 'damage' && effect.damagePercent) {
      const bardAtk = getEffectiveStat(bard, 'atk')
      const boostedPercent = effect.damagePercent * boostMultiplier
      const damage = Math.floor(bardAtk * (boostedPercent / 100))
      applyDamage(enemy, damage, 'skill', bard)
      emitCombatEffect(enemy.id, 'enemy', 'damage', damage)
    }

    // Status effects
    if (effect.type && effect.duration) {
      const definition = getEffectDefinition(effect.type)
      if (definition) {
        enemy.statusEffects = enemy.statusEffects || []
        enemy.statusEffects.push({
          type: effect.type,
          definition,
          duration: effect.duration,
          value: effect.value,
          sourceId: bard.instanceId
        })
        addLog(`${enemy.template.name} receives ${definition.name}!`)
        emitCombatEffect(enemy.id, 'enemy', 'debuff', 0)
      }
    }
  }

  // Process effects at end of turn (DoT damage, tick durations)
  function processEndOfTurnEffects(unit) {
    if (!unit.statusEffects || unit.statusEffects.length === 0) return
    if (unit.currentHp <= 0) {
      // Dead units lose all effects
      unit.statusEffects = []
      return
    }

    const unitName = unit.template?.name || 'Unknown'

    // Process DoT effects
    const isHero = !!unit.instanceId
    const targetId = isHero ? unit.instanceId : unit.id
    const targetType = isHero ? 'hero' : 'enemy'

    for (const effect of unit.statusEffects) {
      if (effect.definition.isDot) {
        // DoT damage
        const damage = effect.value
        applyDamage(unit, damage, 'dot')
        addLog(`${unitName} takes ${damage} ${effect.definition.name} damage!`)
        emitCombatEffect(targetId, targetType, 'damage', damage)

        if (unit.currentHp <= 0) {
          addLog(`${unitName} ${unit.instanceId ? 'has fallen' : 'defeated'}!`)
          return // Stop processing - unit is dead, effects already cleared by applyDamage
        }
      }

      if (effect.definition.isHot) {
        // HoT healing
        const heal = effect.value
        const oldHp = unit.currentHp
        unit.currentHp = Math.min(unit.maxHp, unit.currentHp + heal)
        const actualHeal = unit.currentHp - oldHp
        if (actualHeal > 0) {
          addLog(`${unitName} regenerates ${actualHeal} HP!`)
          emitCombatEffect(targetId, targetType, 'heal', actualHeal)
        }
      }

      if (effect.definition.isMpHot) {
        // MP regen over time
        const mpGain = effect.value
        const oldMp = unit.currentMp
        unit.currentMp = Math.min(unit.maxMp, unit.currentMp + mpGain)
        const actualGain = unit.currentMp - oldMp
        if (actualGain > 0) {
          addLog(`${unitName} recovers ${actualGain} MP!`)
        }
      }

      // Divine Sacrifice heal per turn
      if (effect.type === EffectType.DIVINE_SACRIFICE && effect.healPerTurn) {
        const maxHp = unit.stats?.hp || unit.maxHp || 100
        const healAmount = Math.floor(maxHp * effect.healPerTurn / 100)
        const oldHp = unit.currentHp
        unit.currentHp = Math.min(maxHp, unit.currentHp + healAmount)
        const actualHeal = unit.currentHp - oldHp
        if (actualHeal > 0) {
          addLog(`Divine Sacrifice heals ${unitName} for ${actualHeal}!`)
          emitCombatEffect(targetId, targetType, 'heal', actualHeal)
        }
      }
    }

    // Tick down durations and remove expired effects
    unit.statusEffects = unit.statusEffects.filter(effect => {
      effect.duration--
      if (effect.duration <= 0) {
        // Check for DAMAGE_STORE expiration - release damage before removing
        if (effect.type === EffectType.DAMAGE_STORE) {
          const storedDamage = effect.storedDamage || 0
          if (storedDamage > 0) {
            for (const enemy of aliveEnemies.value) {
              applyDamage(enemy, storedDamage, 'attack', unit)
              emitCombatEffect(enemy.id, 'enemy', 'damage', storedDamage)
            }
            addLog(`${unitName} releases ${storedDamage} stored damage to all enemies!`)
          }
        }
        addLog(`${unitName}'s ${effect.definition.name} wore off.`)
        return false
      }
      return true
    })

    // Tick down guardedBy duration (for units being protected)
    if (unit.guardedBy && unit.guardedBy.duration > 0) {
      unit.guardedBy.duration--
      if (unit.guardedBy.duration <= 0) {
        const guardian = heroes.value.find(h => h.instanceId === unit.guardedBy.guardianId)
        if (guardian) {
          addLog(`${guardian.template.name} is no longer protecting ${unitName}.`)
        }
        unit.guardedBy = null
      }
    }
  }

  // ========== FOCUS HELPERS (Rangers) ==========

  // Check if a unit is a Ranger (uses Focus)
  function isRanger(unit) {
    return unit.class?.resourceType === 'focus'
  }

  // Grant focus to a ranger
  function grantFocus(unit) {
    if (!isRanger(unit)) return
    if (unit.hasFocus) return // Already has focus
    unit.hasFocus = true
    const unitName = unit.template?.name || 'Unknown'
    addLog(`${unitName} gains Focus!`)
  }

  // Remove focus from a ranger
  function removeFocus(unit, silent = false) {
    if (!isRanger(unit)) return
    if (!unit.hasFocus) return // Already no focus
    unit.hasFocus = false
    if (!silent) {
      const unitName = unit.template?.name || 'Unknown'
      addLog(`${unitName} loses Focus!`)
    }
  }

// ========== RAGE HELPERS (Berserkers) ==========

  // Check if a unit is a Berserker (uses Rage)
  function isBerserker(unit) {
    return unit.class?.resourceType === 'rage'
  }

  // Gain rage for a berserker
  function gainRage(unit, amount) {
    if (unit.currentRage !== undefined) {
      unit.currentRage = Math.min(100, unit.currentRage + amount)
    }
  }

  // Spend rage for a berserker
  function spendRage(unit, amount) {
    if (unit.currentRage !== undefined) {
      unit.currentRage = Math.max(0, unit.currentRage - amount)
    }
  }

  // ========== BLOOD TEMPO TRACKING (for Torga's Blood Echo) ==========

  // Get the number of Blood Tempo uses for a hero this battle
  function getBloodTempoUses(heroInstanceId) {
    return bloodTempoUses.value[heroInstanceId] || 0
  }

  // Increment Blood Tempo uses for a hero
  function incrementBloodTempoUses(heroInstanceId) {
    if (!bloodTempoUses.value[heroInstanceId]) {
      bloodTempoUses.value[heroInstanceId] = 0
    }
    bloodTempoUses.value[heroInstanceId]++
  }

  // Calculate Blood Echo damage based on Blood Tempo uses
  function calculateBloodEchoDamage(atk, bloodTempoUses) {
    const baseDamagePercent = 90
    const bonusPerUse = 30
    const maxBonus = 90

    const bonus = Math.min(bloodTempoUses * bonusPerUse, maxBonus)
    const damagePercent = baseDamagePercent + bonus

    return { damagePercent }
  }

  // Process skill execution for Blood Tempo tracking
  // Call this when a skill is executed to check if it's Blood Tempo
  function processSkillForBloodTempoTracking(hero, skill) {
    if (skill.name === 'Blood Tempo') {
      incrementBloodTempoUses(hero.instanceId)
    }
  }

  // ========== VERSE HELPERS (Bards) ==========

  // Check if a unit is a Bard (uses Verse)
  function isBard(unit) {
    return unit.class?.resourceType === 'verse'
  }

  // Gain a verse for a bard (capped at 3)
  function gainVerse(unit) {
    if (unit.currentVerses === undefined) return
    unit.currentVerses = Math.min(3, unit.currentVerses + 1)
  }

  // Check if unit has SEATED stance (cannot use skills)
  function isSeated(unit) {
    return unit.statusEffects?.some(e => e.definition?.isSeated) || false
  }

  // Get basic attack damage percent, accounting for modifier passives
  function getBasicAttackDamagePercent(hero) {
    const modifier = hero.template?.basicAttackModifier
    if (!modifier) return 100

    if (hero.wasAttacked && modifier.ifAttackedDamagePercent) {
      return modifier.ifAttackedDamagePercent
    }
    return modifier.baseDamagePercent || 100
  }

  // Get hero's on-death passive if any
  function getHeroOnDeathPassive(hero) {
    const skills = hero.template?.skills || []
    const onDeathSkill = skills.find(s => s.isPassive && s.passiveType === 'onDeath')
    return onDeathSkill?.onDeath || null
  }

  // Process hero death triggers
  function processHeroDeathTrigger(hero) {
    const onDeath = getHeroOnDeathPassive(hero)
    if (!onDeath) return

    addLog(`${hero.template.name}'s Last Breath triggers!`)

    // Deal damage if specified
    if (onDeath.damage) {
      const { damagePercent, targetType } = onDeath.damage
      const damage = Math.floor(hero.stats.atk * (damagePercent / 100))

      if (targetType === 'random_enemy') {
        const aliveEnemyList = enemies.value.filter(e => e.currentHp > 0)
        if (aliveEnemyList.length > 0) {
          const target = aliveEnemyList[Math.floor(Math.random() * aliveEnemyList.length)]
          applyDamage(target, damage, 'skill', hero)
        }
      }
    }

    // Apply effects if specified
    if (onDeath.effects) {
      for (const effectConfig of onDeath.effects) {
        if (effectConfig.target === 'all_enemies') {
          for (const enemy of enemies.value.filter(e => e.currentHp > 0)) {
            const effect = createEffect(effectConfig.type, {
              duration: effectConfig.duration,
              value: effectConfig.value,
              atkPercent: effectConfig.atkPercent,
              casterAtk: hero.stats.atk,
              sourceId: hero.instanceId
            })
            if (effect) {
              enemy.statusEffects.push(effect)
            }
          }
        }
      }
    }
  }

  // Check if a unit can use their skill based on resource type
  function canUseSkill(unit) {
    if (!unit.skill) return false

    // Check if unit is in SEATED stance (cannot use non-basic skills)
    if (isSeated(unit)) {
      return false
    }

    // Rangers check focus
    if (isRanger(unit)) {
      return unit.hasFocus === true
    }

    // Berserkers check rage cost
    if (isBerserker(unit)) {
      const rageCost = unit.skill.rageCost ?? 0
      return unit.currentRage >= rageCost
    }

    // Knights check valor requirements
    if (isKnight(unit)) {
      if (unit.skill.valorCost === 'all') {
        // 'all' cost skills require valorRequired minimum (or any valor > 0)
        const required = unit.skill.valorRequired || 1
        return (unit.currentValor || 0) >= required
      }
      // Knights with no valorCost can always use their skills (no MP cost)
      return true
    }

    // Bards can always use skills (no cost) - repeat restriction checked in BattleScreen
    if (isBard(unit)) {
      return true
    }

    // Alchemists check essence cost
    if (isAlchemist(unit)) {
      const essenceCost = unit.skill.essenceCost ?? 0
      return (unit.currentEssence || 0) >= essenceCost
    }

    // MP-based classes
    const mpCost = unit.skill.mpCost ?? 0
    return unit.currentMp >= mpCost
  }

  // ========== VALOR HELPERS (Knights) ==========

  // Check if a unit is a Knight (uses Valor)
  function isKnight(unit) {
    return unit.class?.resourceType === 'valor'
  }

  // Gain valor for a knight (clamped to 100)
  function gainValor(unit, amount) {
    if (!isKnight(unit)) return
    if (unit.currentValor === undefined) unit.currentValor = 0
    unit.currentValor = Math.min(100, unit.currentValor + amount)
  }

  // Get current valor tier (0, 25, 50, 75, or 100)
  function getValorTier(unit) {
    if (!isKnight(unit)) return 0
    const valor = unit.currentValor || 0
    if (valor >= 100) return 100
    if (valor >= 75) return 75
    if (valor >= 50) return 50
    if (valor >= 25) return 25
    return 0
  }

  // Resolve a valor-scaled value to its current tier value
  function resolveValorScaling(scalingObj, valorTier) {
    if (typeof scalingObj !== 'object' || scalingObj === null) {
      return scalingObj // Not a scaling object, return as-is
    }
    if (scalingObj.base === undefined) {
      return scalingObj // Not a scaling object, return as-is
    }

    // Find the highest tier at or below current
    const tiers = [100, 75, 50, 25]
    for (const tier of tiers) {
      if (valorTier >= tier && scalingObj[`at${tier}`] !== undefined) {
        return scalingObj[`at${tier}`]
      }
    }
    return scalingObj.base
  }

  // Get skill damage value, applying Valor scaling for Knights
  function getSkillDamage(skill, hero) {
    if (skill.damage && typeof skill.damage === 'object' && skill.damage.base !== undefined) {
      // This is a Valor-scaling damage value
      const tier = getValorTier(hero)
      return resolveValorScaling(skill.damage, tier)
    }
    return null // Use standard multiplier parsing
  }

  // Resolve valorCost: 'all' consumption for Valor-consuming finishers (e.g., Judgment of Steel)
  // Returns { valorConsumed, damagePercent } — consumes all Valor and calculates scaled damage
  function resolveValorCost(hero, skill) {
    if (skill.valorCost !== 'all' || !isKnight(hero)) {
      return { valorConsumed: 0, damagePercent: 0 }
    }
    const valorConsumed = hero.currentValor || 0
    hero.currentValor = 0
    const damagePercent = (skill.baseDamage || 0) + valorConsumed * (skill.damagePerValor || 0)
    return { valorConsumed, damagePercent }
  }

  // ========== ESSENCE RESOURCE SYSTEM (Alchemist) ==========

  function isAlchemist(unit) {
    return unit.class?.resourceType === 'essence'
  }

  function initializeEssence(hero) {
    if (!isAlchemist(hero)) return
    hero.maxEssence = hero.template?.baseStats?.mp || 60
    hero.currentEssence = Math.floor(hero.maxEssence / 2) // Start at 50%
  }

  function regenerateEssence(hero) {
    if (!isAlchemist(hero)) return
    const regenAmount = 10
    hero.currentEssence = Math.min(hero.maxEssence, (hero.currentEssence || 0) + regenAmount)
  }

  function getVolatilityTier(hero) {
    if (!isAlchemist(hero)) return null
    const essence = hero.currentEssence || 0
    if (essence <= 20) return 'stable'
    if (essence <= 40) return 'reactive'
    return 'volatile'
  }

  function getVolatilityDamageBonus(hero) {
    const tier = getVolatilityTier(hero)
    if (tier === 'reactive') return 15
    if (tier === 'volatile') return 30
    return 0
  }

  function getVolatilitySelfDamage(hero) {
    const tier = getVolatilityTier(hero)
    if (tier === 'volatile') {
      return Math.floor((hero.maxHp || 0) * 0.05)
    }
    return 0
  }

  // ========== LOW HP TRIGGER PASSIVE (Cornered Animal) ==========

  function getLowHpTriggerPassive(hero) {
    const skills = hero.template?.skills
    if (!skills) return null
    const passive = skills.find(s => s.isPassive && s.passiveType === 'lowHpTrigger')
    return passive || null
  }

  function processLowHpTrigger(hero, hpBefore) {
    const passive = getLowHpTriggerPassive(hero)
    if (!passive) return

    // Check oncePerBattle flag
    if (passive.oncePerBattle && hero.lowHpTriggerFired) return

    const threshold = hero.maxHp * (passive.triggerBelowHpPercent / 100)

    // Only trigger when HP crosses the threshold (was above, now below)
    if (hpBefore <= threshold || hero.currentHp >= threshold) return

    // Fire the trigger
    if (passive.oncePerBattle) {
      hero.lowHpTriggerFired = true
    }

    const heroName = hero.template?.name || 'Unknown'
    addLog(`${heroName}'s ${passive.name} triggers!`)

    for (const effect of passive.triggerEffects) {
      applyEffect(hero, effect.type, {
        duration: effect.duration,
        value: effect.value,
        sourceId: hero.instanceId
      })
    }

    emitCombatEffect(hero.instanceId, 'hero', 'buff', 0)
  }

  // Check if an effect should be applied based on valorThreshold
  function shouldApplyEffect(effect, hero) {
    if (effect.valorThreshold === undefined) return true
    if (!isKnight(hero)) return false
    const valor = hero.currentValor || 0
    return valor >= effect.valorThreshold
  }

  // Resolve effect duration, handling both number and Valor-scaled object
  function resolveEffectDuration(effect, hero) {
    if (typeof effect.duration === 'number') {
      return effect.duration
    }
    if (typeof effect.duration === 'object' && effect.duration !== null) {
      const tier = getValorTier(hero)
      return resolveValorScaling(effect.duration, tier)
    }
    return 2 // Default duration
  }

  // Resolve effect value, handling both number and Valor-scaled object
  // shardBonus is added to percentage-based effect values (buffs/debuffs)
  function resolveEffectValue(effect, hero, casterAtk = 0, shardBonus = 0) {
    // First check for atkPercent (ATK-based effect value)
    if (effect.atkPercent) {
      const effectivePercent = effect.atkPercent + shardBonus
      return Math.floor(casterAtk * effectivePercent / 100)
    }

    const rawValue = effect.value
    if (typeof rawValue === 'number') {
      // Effect values are percentages (e.g., 20 = +20% stat), add shard bonus
      let value = rawValue + shardBonus
      // Desperation scaling: bonus based on party average missing HP
      if (effect.desperationBonus) {
        const missingHpPercent = calculatePartyMissingHpPercent(aliveHeroes.value)
        value += Math.floor(effect.desperationBonus * missingHpPercent)
      }
      return value
    }
    if (typeof rawValue === 'object' && rawValue !== null) {
      const tier = getValorTier(hero)
      const baseValue = resolveValorScaling(rawValue, tier)
      return baseValue + shardBonus
    }
    return 0 // Default value
  }

  // Calculate how damage should be split between an ally and their linked guardian
  function calculateGuardianLinkDamage(target, damage, allHeroes) {
    const guardianLink = target.statusEffects?.find(e => e.type === EffectType.GUARDIAN_LINK)
    if (!guardianLink) {
      return { allyDamage: damage, guardianDamage: 0, guardian: null }
    }

    // guardianId is set explicitly, or fall back to sourceId (who cast the link)
    const guardianId = guardianLink.guardianId || guardianLink.sourceId
    const guardian = allHeroes.find(h => h.instanceId === guardianId)
    if (!guardian || guardian.currentHp <= 0) {
      return { allyDamage: damage, guardianDamage: 0, guardian: null }
    }

    const redirectPercent = guardianLink.redirectPercent || 40
    const guardianDamage = Math.floor(damage * redirectPercent / 100)
    const allyDamage = damage - guardianDamage

    return { allyDamage, guardianDamage, guardian }
  }

  function releaseDamageStore(hero, enemies) {
    const damageStore = hero.statusEffects?.find(e => e.type === EffectType.DAMAGE_STORE)
    if (!damageStore || !damageStore.storedDamage || damageStore.storedDamage <= 0) {
      return { totalDamage: 0, enemiesHit: 0 }
    }

    const storedDamage = damageStore.storedDamage
    const aliveEnemies = enemies.filter(e => e.currentHp > 0)

    return { totalDamage: storedDamage, enemiesHit: aliveEnemies.length }
  }

  function checkDivineSacrifice(target, allHeroes) {
    // Find a hero (not the target) who has Divine Sacrifice active
    for (const hero of allHeroes) {
      if (hero.instanceId === target.instanceId) continue
      if (hero.currentHp <= 0) continue

      const divineSacrifice = hero.statusEffects?.find(e => e.type === EffectType.DIVINE_SACRIFICE)
      if (divineSacrifice) {
        return hero
      }
    }
    return null
  }

  // Calculate heal amount from lifesteal (healSelfPercent skill property)
  function calculateHealSelfPercent(damageDealt, healPercent) {
    if (!healPercent || healPercent <= 0) return 0
    return Math.floor(damageDealt * healPercent / 100)
  }

  // Calculate heal with desperation scaling (bonus based on missing HP percentage)
  function calculateDesperationHeal(atk, healPercent, desperationBonus, missingHpPercent, shardBonus = 0) {
    const totalPercent = healPercent + shardBonus + Math.floor(desperationBonus * missingHpPercent)
    return Math.floor(atk * totalPercent / 100)
  }

  // Calculate average missing HP percentage across a set of heroes
  function calculatePartyMissingHpPercent(heroList) {
    if (!heroList || heroList.length === 0) return 0
    const totalMissing = heroList.reduce((sum, h) => sum + (1 - h.currentHp / h.maxHp), 0)
    return totalMissing / heroList.length
  }

  // ========== HEARTBREAK STACK SYSTEM (for Mara Thornheart) ==========

  // Check if a unit has the Heartbreak passive
  function hasHeartbreakPassive(unit) {
    return unit.template?.heartbreakPassive !== undefined
  }

  // Initialize Heartbreak stacks for a unit (called at battle start)
  function initializeHeartbreakStacks(unit) {
    if (hasHeartbreakPassive(unit)) {
      unit.heartbreakStacks = unit.heartbreakStacks ?? 0
    }
  }

  // Gain Heartbreak stacks (capped at maxStacks)
  function gainHeartbreakStack(unit, amount = 1) {
    if (!hasHeartbreakPassive(unit)) return
    const maxStacks = unit.template.heartbreakPassive.maxStacks || 5
    const oldStacks = unit.heartbreakStacks || 0
    unit.heartbreakStacks = Math.min(maxStacks, oldStacks + amount)

    if (unit.heartbreakStacks > oldStacks) {
      addLog(`${unit.template.name} gains Heartbreak! (${unit.heartbreakStacks}/${maxStacks})`)
    }
  }

  // Consume all Heartbreak stacks and return the count
  function consumeAllHeartbreakStacks(unit) {
    if (!hasHeartbreakPassive(unit)) return 0
    const stacks = unit.heartbreakStacks || 0
    unit.heartbreakStacks = 0
    if (stacks > 0) {
      addLog(`${unit.template.name} consumes ${stacks} Heartbreak stacks!`)
    }
    return stacks
  }

  // Get ATK and lifesteal bonuses from Heartbreak stacks
  function getHeartbreakBonuses(unit) {
    if (!hasHeartbreakPassive(unit)) return { atkBonus: 0, lifestealBonus: 0 }
    const passive = unit.template.heartbreakPassive
    const stacks = unit.heartbreakStacks || 0
    return {
      atkBonus: stacks * (passive.atkPerStack || 0),
      lifestealBonus: stacks * (passive.lifestealPerStack || 0)
    }
  }

  // Check if ally dropping below 50% HP triggers Heartbreak
  // Check if ally dropping below 50% HP triggers Heartbreak
  // NOTE: This is called AFTER damage is applied, so ally.currentHp already reflects the damage
  function checkHeartbreakAllyHpTrigger(maraUnit, ally, damageDealt) {
    if (!hasHeartbreakPassive(maraUnit)) return
    if (ally.instanceId === maraUnit.instanceId) return
    if (ally.triggeredHeartbreak) return

    const triggers = maraUnit.template.heartbreakPassive.triggers
    if (!triggers?.allyBelowHalfHp) return

    // ally.currentHp already has damage applied, so calculate what HP was before
    const hpAfter = ally.currentHp
    const hpBefore = ally.currentHp + damageDealt
    const halfHp = ally.maxHp * 0.5

    if (hpBefore > halfHp && hpAfter <= halfHp) {
      ally.triggeredHeartbreak = true
      gainHeartbreakStack(maraUnit, 1)
    }
  }

  // Check if Mara taking heavy damage (15%+ max HP) triggers Heartbreak
  function checkHeartbreakSelfDamageTrigger(maraUnit, damageDealt) {
    if (!hasHeartbreakPassive(maraUnit)) return

    const triggers = maraUnit.template.heartbreakPassive.triggers
    if (!triggers?.heavyDamagePercent) return

    const threshold = maraUnit.maxHp * (triggers.heavyDamagePercent / 100)
    if (damageDealt >= threshold) {
      gainHeartbreakStack(maraUnit, 1)
    }
  }

  // Check if ally death triggers Heartbreak
  function checkHeartbreakAllyDeathTrigger(maraUnit) {
    if (!hasHeartbreakPassive(maraUnit)) return

    const triggers = maraUnit.template.heartbreakPassive.triggers
    if (!triggers?.allyDeath) return

    gainHeartbreakStack(maraUnit, 1)
  }

  // Reset ally HP tracking (called at battle start)
  function resetAllyHpTracking() {
    totalAllyHpLost.value = 0
  }

  // Apply ally HP cost (for Cacophon's skills)
  // Returns actual damage dealt
  function applyAllyHpCost(hero, percent, isCacophonSkill = false) {
    // Cacophon is immune to her own skill costs
    if (isCacophonSkill && hero.templateId === 'cacophon') {
      return 0
    }

    const maxHp = hero.maxHp || hero.currentHp
    const damage = Math.floor(maxHp * (percent / 100))
    const actualDamage = Math.min(damage, hero.currentHp - 1) // Don't reduce below 1 HP

    if (actualDamage > 0) {
      hero.currentHp -= actualDamage
      totalAllyHpLost.value += actualDamage
    }

    return actualDamage
  }

  // Check if riposte triggers on a target hit by an enemy
  // Returns { triggered, damage } - noDefCheck bypasses the DEF comparison
  function checkRiposte(target, enemy) {
    const riposteEffect = target.statusEffects?.find(e => e.definition?.isRiposte)
    if (!riposteEffect || enemy.currentHp <= 0 || target.currentHp <= 0) {
      return { triggered: false, damage: 0 }
    }

    const targetDef = getEffectiveStat(target, 'def')
    const enemyDef = getEffectiveStat(enemy, 'def')

    if (riposteEffect.noDefCheck || enemyDef < targetDef) {
      const targetAtk = getEffectiveStat(target, 'atk')
      const riposteDamage = Math.floor(targetAtk * (riposteEffect.value || 100) / 100)
      return { triggered: true, damage: riposteDamage }
    }

    return { triggered: false, damage: 0 }
  }

  // Check if a blinded attacker misses their attack
  function checkBlindMiss(attacker) {
    const blindEffect = attacker.statusEffects?.find(e => e.type === EffectType.BLIND)
    if (!blindEffect) return false

    const missChance = blindEffect.value / 100
    return Math.random() < missChance
  }

  // Dice roll utility for Bones McCready
  function rollDice(count, sides) {
    const rolls = []
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1)
    }
    const total = rolls.reduce((a, b) => a + b, 0)
    const isDoubles = count === 2 && rolls[0] === rolls[1]
    return { rolls, total, isDoubles }
  }

  // Get the tier from a dice result
  function getDiceTier(rollTotal, tiers) {
    return tiers.find(t => rollTotal >= t.min && rollTotal <= t.max)
  }

  // Check and consume LOADED_DICE effect
  function checkLoadedDice(target) {
    const idx = target.statusEffects.findIndex(e => e.type === 'loaded_dice')
    if (idx !== -1) {
      target.statusEffects.splice(idx, 1)
      return true
    }
    return false
  }

  // Execute dice-based healing (Bones McCready's Roll the Bones)
  function executeDiceHeal(caster, target, skill) {
    let roll
    const isLoaded = checkLoadedDice(target)

    if (isLoaded) {
      // Loaded dice guarantees max roll
      roll = skill.diceSides * skill.diceCount
    } else {
      const result = rollDice(skill.diceCount, skill.diceSides)
      roll = result.total
    }

    const tier = getDiceTier(roll, skill.diceTiers)
    if (!tier) return { roll, healed: 0 }

    const healAmount = Math.floor(caster.atk * (tier.healPercent / 100))
    target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount)

    if (tier.applyRegen) {
      target.statusEffects.push({
        type: 'regen',
        duration: 2,
        value: 25,
        sourceId: caster.instanceId
      })
    }

    return { roll, healed: healAmount, tier }
  }

  // Execute dice-based effect (Bones McCready's Snake Eyes)
  function executeDiceEffect(caster, target, skill) {
    const result = rollDice(skill.diceCount, skill.diceSides)

    for (const effectDef of skill.effects || []) {
      let duration = effectDef.duration

      if (result.isDoubles && skill.onDoubles?.extendDuration) {
        duration += skill.onDoubles.extendDuration
      }

      target.statusEffects.push({
        type: effectDef.type,
        duration,
        value: effectDef.value,
        sourceId: caster.instanceId
      })
    }

    return { roll: result.total, isDoubles: result.isDoubles }
  }

  // Apply damage to a unit and handle focus loss for rangers
  // attacker: optional unit object for the attacker (used for rage gain)
  function applyDamage(unit, damage, source = 'attack', attacker = null, result = null) {
    if (damage <= 0) return 0

    // Check for EVASION effects (sum all additively, cap at 100%)
    // 'attack_cannot_miss' source bypasses evasion (e.g., Death's Needle at low HP)
    const evasionEffects = (unit.statusEffects || []).filter(e => e.type === EffectType.EVASION)
    if (evasionEffects.length > 0 && source === 'attack') {
      const totalEvasion = evasionEffects.reduce((sum, e) => sum + (e.value || 0), 0)
      const evasionChance = Math.min(totalEvasion, 100) / 100
      if (Math.random() < evasionChance) {
        const unitName = unit.template?.name || 'Unknown'
        addLog(`${unitName} evades the attack!`)
        emitCombatEffect(unit.instanceId || unit.id, unit.instanceId ? 'hero' : 'enemy', 'miss', 0)

        // Handle onEvade effects (e.g., MP restore to caster)
        for (const evasionEffect of evasionEffects) {
          if (evasionEffect.onEvade?.restoreMp && evasionEffect.sourceId) {
            const caster = heroes.value.find(h => h.instanceId === evasionEffect.sourceId)
            if (caster && caster.currentHp > 0) {
              const mpToRestore = evasionEffect.onEvade.restoreMp
              caster.currentMp = Math.min(caster.maxMp, caster.currentMp + mpToRestore)
              addLog(`${caster.template.name} recovers ${mpToRestore} MP!`)
            }
          }
        }

        if (result) result.evaded = true
        return 0 // No damage dealt
      }
    }

    // Check for DIVINE_SACRIFICE - intercepts ALL ally damage
    const sacrificer = checkDivineSacrifice(unit, heroes.value)
    if (sacrificer) {
      const sacrifice = sacrificer.statusEffects.find(e => e.type === EffectType.DIVINE_SACRIFICE)
      const damageReduction = sacrifice.damageReduction || 50
      const reducedDamage = Math.floor(damage * (100 - damageReduction) / 100)
      const actualDamage = Math.min(sacrificer.currentHp, reducedDamage)

      sacrificer.currentHp = Math.max(0, sacrificer.currentHp - actualDamage)

      addLog(`${sacrificer.template.name} intercepts ${damage} damage meant for ${unit.template.name}! (Reduced to ${actualDamage})`)
      emitCombatEffect(sacrificer.instanceId, 'hero', 'damage', actualDamage)

      // Track for DAMAGE_STORE
      const damageStore = sacrificer.statusEffects?.find(e => e.type === EffectType.DAMAGE_STORE)
      if (damageStore) {
        damageStore.storedDamage = (damageStore.storedDamage || 0) + actualDamage
      }

      if (sacrificer.currentHp <= 0) {
        if (sacrificer.statusEffects?.length > 0) {
          sacrificer.statusEffects = []
        }
      }

      return actualDamage // Target takes no damage
    }

    // Check for GUARDIAN_LINK effect (damage sharing with Aurora)
    const guardianLinkResult = calculateGuardianLinkDamage(unit, damage, heroes.value)
    if (guardianLinkResult.guardianDamage > 0 && guardianLinkResult.guardian) {
      const guardian = guardianLinkResult.guardian
      const redirectedDamage = Math.min(guardian.currentHp, guardianLinkResult.guardianDamage)
      guardian.currentHp = Math.max(0, guardian.currentHp - redirectedDamage)

      addLog(`${guardian.template.name} absorbs ${redirectedDamage} damage for ${unit.template.name}!`)
      emitCombatEffect(guardian.instanceId, 'hero', 'damage', redirectedDamage)

      // Check for valorOnRedirect (Oath of Protection grants Valor when absorbing damage)
      const guardianLink = unit.statusEffects?.find(e => e.type === EffectType.GUARDIAN_LINK)
      if (guardianLink?.valorOnRedirect && isKnight(guardian)) {
        gainValor(guardian, guardianLink.valorOnRedirect)
        addLog(`${guardian.template.name} gains ${guardianLink.valorOnRedirect} Valor!`)
      }

      // Track damage for DAMAGE_STORE if guardian has it
      const damageStore = guardian.statusEffects?.find(e => e.type === EffectType.DAMAGE_STORE)
      if (damageStore) {
        damageStore.storedDamage = (damageStore.storedDamage || 0) + redirectedDamage
      }

      if (guardian.currentHp <= 0) {
        if (guardian.statusEffects?.length > 0) {
          guardian.statusEffects = []
        }
        // Remove guardian link from ally when guardian dies
        unit.statusEffects = unit.statusEffects.filter(e => e.type !== EffectType.GUARDIAN_LINK)
      }

      damage = guardianLinkResult.allyDamage
      if (damage <= 0) return redirectedDamage
    }

    // Check if unit is being guarded by another hero
    if (unit.guardedBy && unit.guardedBy.duration > 0) {
      const guardian = heroes.value.find(h => h.instanceId === unit.guardedBy.guardianId)
      if (guardian && guardian.currentHp > 0) {
        // Redirect damage to guardian
        const redirectPercent = unit.guardedBy.percent / 100
        const redirectedDamage = Math.floor(damage * redirectPercent)
        const remainingDamage = damage - redirectedDamage

        if (redirectedDamage > 0) {
          const guardianActualDamage = Math.min(guardian.currentHp, redirectedDamage)
          guardian.currentHp = Math.max(0, guardian.currentHp - guardianActualDamage)
          addLog(`${guardian.template.name} takes ${guardianActualDamage} damage protecting ${unit.template.name}!`)
          emitCombatEffect(guardian.instanceId, 'hero', 'damage', guardianActualDamage)

          // Guardian loses focus if ranger
          if (isRanger(guardian) && guardianActualDamage > 0) {
            removeFocus(guardian)
          }

          // Guardian gains rage if berserker
          if (isBerserker(guardian)) {
            gainRage(guardian, 10)
          }

          // Track that guardian was attacked
          if (guardian.wasAttacked !== undefined) {
            guardian.wasAttacked = true
          }

          // Clear guardian's effects on death
          if (guardian.currentHp <= 0) {
            if (guardian.statusEffects?.length > 0) {
              guardian.statusEffects = []
            }
            if (isBerserker(guardian)) {
              guardian.currentRage = 0
            }
            // Clear the guarding relationship
            unit.guardedBy = null
          }
        }

        // Apply remaining damage to original target (if any)
        if (remainingDamage > 0) {
          damage = remainingDamage
        } else {
          return redirectedDamage // Return redirected damage as the "actual damage" dealt
        }
      }
    }

    // Check for DAMAGE_REDUCTION effect
    let damageBlockedByReduction = 0
    const damageReductionEffect = (unit.statusEffects || []).find(e => e.type === EffectType.DAMAGE_REDUCTION)
    if (damageReductionEffect) {
      const reductionPercent = damageReductionEffect.value
      const reducedAmount = Math.floor(damage * reductionPercent / 100)
      damageBlockedByReduction = reducedAmount
      damage = damage - reducedAmount
      if (reducedAmount > 0) {
        const unitName = unit.template?.name || 'Unknown'
        addLog(`${unitName}'s fortified stance reduces damage by ${reducedAmount}!`)
      }
    }

    // Check for thick_hide passive (Great Troll - permanent damage reduction)
    const thickHidePassive = unit.passiveAbilities?.find(p => p.damageReduction)
    if (thickHidePassive) {
      const reductionPercent = thickHidePassive.damageReduction
      const reducedAmount = Math.floor(damage * reductionPercent / 100)
      damage = damage - reducedAmount
    }

    // Apply equipment ally_damage_reduction for heroes (from party members)
    const isHeroUnit = !!unit.instanceId
    if (isHeroUnit) {
      const allyReduction = getAllyDamageReduction()
      if (allyReduction > 0) {
        const reducedAmount = Math.floor(damage * allyReduction / 100)
        damage = damage - reducedAmount
        if (reducedAmount > 0) {
          const unitName = unit.template?.name || 'Unknown'
          addLog(`${unitName}'s allies reduce damage by ${reducedAmount}!`)
        }
      }
    }

    // Process valor_on_block effect for knights blocking damage
    if (isHeroUnit && isKnight(unit) && damageBlockedByReduction > 0) {
      processValorOnBlock(unit, damageBlockedByReduction)
    }

    // Check for SHIELD effect - absorbs damage before HP
    const shieldEffect = (unit.statusEffects || []).find(e => e.type === EffectType.SHIELD && e.shieldHp > 0)
    if (shieldEffect) {
      const shieldAbsorbed = Math.min(shieldEffect.shieldHp, damage)
      shieldEffect.shieldHp -= shieldAbsorbed
      damage -= shieldAbsorbed

      const unitName = unit.template?.name || 'Unknown'
      if (shieldAbsorbed > 0) {
        addLog(`${unitName}'s shield absorbs ${shieldAbsorbed} damage!`)
      }

      // Remove shield if depleted
      if (shieldEffect.shieldHp <= 0) {
        unit.statusEffects = unit.statusEffects.filter(e => e !== shieldEffect)
        addLog(`${unitName}'s shield breaks!`)
      }

      // If shield absorbed all damage, return early
      if (damage <= 0) {
        return shieldAbsorbed
      }
    }

    // Check death prevention before applying lethal damage
    if (unit.currentHp - damage <= 0) {
      if (checkDeathPrevention(unit, damage)) {
        const unitName = unit.template?.name || 'Unit'
        addLog(`${unitName} is protected from death by World Root's Embrace!`)
        emitCombatEffect(unit.instanceId || unit.id, unit.instanceId ? 'hero' : 'enemy', 'heal', 0)
        return 0 // Damage was prevented by death prevention effect
      }
    }

    const hpBeforeDamage = unit.currentHp
    const actualDamage = Math.min(unit.currentHp, damage)
    unit.currentHp = Math.max(0, unit.currentHp - actualDamage)

    // Track damage for DAMAGE_STORE if this unit has it (direct damage)
    if (unit.statusEffects) {
      const damageStore = unit.statusEffects.find(e => e.type === EffectType.DAMAGE_STORE)
      if (damageStore) {
        damageStore.storedDamage = (damageStore.storedDamage || 0) + actualDamage
      }
    }

    // Rangers lose focus when taking damage
    if (isRanger(unit) && actualDamage > 0) {
      removeFocus(unit)
    }

    // Grant rage to berserker attackers
    if (attacker && isBerserker(attacker)) {
      gainRage(attacker, 10)
    }

    // Grant rage to berserker defenders
    if (isBerserker(unit)) {
      gainRage(unit, 10)
    }

    // Track that this hero was attacked (for conditional skills like Defensive Footwork)
    if (unit.wasAttacked !== undefined) {
      unit.wasAttacked = true
    }

    // Check Heartbreak triggers for any Mara in party (only for hero units taking damage)
    const isHeroTarget = !!unit.instanceId
    if (isHeroTarget && actualDamage > 0 && unit.currentHp > 0) {
      const maraHeroes = heroes.value.filter(h => hasHeartbreakPassive(h) && h.currentHp > 0)
      for (const mara of maraHeroes) {
        if (unit.instanceId !== mara.instanceId) {
          // Check ally HP threshold trigger
          checkHeartbreakAllyHpTrigger(mara, unit, actualDamage)
        } else {
          // Check self-damage trigger
          checkHeartbreakSelfDamageTrigger(mara, actualDamage)
        }
      }
    }

    // Check HP threshold leader triggers (e.g., Mara's "What Doesn't Kill Us")
    if (actualDamage > 0 && unit.currentHp > 0) {
      checkHpThresholdLeaderTriggers(unit, hpBeforeDamage)
    }

    // Check for Well Fed trigger (auto-heal when HP drops below threshold)
    if (unit.currentHp > 0 && unit.statusEffects) {
      const wellFedEffect = unit.statusEffects.find(e => e.type === EffectType.WELL_FED && !e.triggered)
      if (wellFedEffect) {
        const hpPercent = (unit.currentHp / unit.maxHp) * 100
        if (hpPercent < wellFedEffect.threshold) {
          // Trigger the auto-heal
          const healAmount = Math.floor(wellFedEffect.casterAtk * wellFedEffect.atkPercent / 100)
          const oldHp = unit.currentHp
          unit.currentHp = Math.min(unit.maxHp, unit.currentHp + healAmount)
          const actualHeal = unit.currentHp - oldHp
          wellFedEffect.triggered = true
          const unitName = unit.template?.name || 'Unknown'
          addLog(`${unitName} is Well Fed! Auto-healed for ${actualHeal} HP!`)
          const isHero = !!unit.instanceId
          emitCombatEffect(isHero ? unit.instanceId : unit.id, isHero ? 'hero' : 'enemy', 'heal', actualHeal)
        }
      }
    }

    // Check for lowHpTrigger passive (e.g., Cornered Animal)
    if (actualDamage > 0 && unit.currentHp > 0 && unit.instanceId) {
      processLowHpTrigger(unit, hpBeforeDamage)
    }

    // Clear all status effects on death
    if (unit.currentHp <= 0) {
      // Process on-death triggers for heroes before clearing effects
      if (unit.instanceId && heroes.value.includes(unit)) {
        processHeroDeathTrigger(unit)
      }
      // Track defeated enemy types for bestiary/discovery
      if (!unit.instanceId && enemies.value.includes(unit) && unit.template?.id) {
        const questsStore = useQuestsStore()
        questsStore.recordDefeatedEnemy(unit.template.id)
      }
      if (unit.statusEffects?.length > 0) {
        unit.statusEffects = []
      }
      // Reset rage on death for berserkers
      if (isBerserker(unit)) {
        unit.currentRage = 0
      }
      // Check Heartbreak ally death trigger (only for hero deaths)
      if (unit.instanceId) {
        const maraHeroes = heroes.value.filter(h => hasHeartbreakPassive(h) && h.currentHp > 0)
        for (const mara of maraHeroes) {
          if (unit.instanceId !== mara.instanceId) {
            checkHeartbreakAllyDeathTrigger(mara)
          }
        }
      }
    }

    // Check for SLEEP effect - wake up when attacked
    if (actualDamage > 0 && unit.currentHp > 0 && unit.statusEffects) {
      const sleepEffect = unit.statusEffects.find(e => e.type === EffectType.SLEEP)
      if (sleepEffect) {
        // Remove sleep effect
        unit.statusEffects = unit.statusEffects.filter(e => e.type !== EffectType.SLEEP)
        const unitName = unit.template?.name || 'Unknown'
        addLog(`${unitName} wakes up!`)

        // Check for rage_awakening passive (Great Troll)
        const rageAwakening = unit.passiveAbilities?.find(p => p.triggerCondition === 'woken_from_sleep')
        if (rageAwakening && attacker && attacker.currentHp > 0) {
          const retaliatePercent = rageAwakening.retaliatePercent || 200
          const retaliateDamage = Math.floor(unit.stats.atk * retaliatePercent / 100)
          const attackerDef = attacker.stats?.def || 0
          const finalDamage = Math.max(1, Math.floor(retaliateDamage * (100 / (100 + attackerDef))))

          addLog(`${unitName} awakens in a rage and counterattacks for ${finalDamage} damage!`)
          const attackerActual = Math.min(attacker.currentHp, finalDamage)
          attacker.currentHp = Math.max(0, attacker.currentHp - attackerActual)
          emitCombatEffect(attacker.instanceId || attacker.id, attacker.instanceId ? 'hero' : 'enemy', 'damage', attackerActual)

          if (attacker.currentHp <= 0) {
            addLog(`${attacker.template?.name || 'Unknown'} defeated!`)
            if (attacker.statusEffects?.length > 0) {
              attacker.statusEffects = []
            }
          }
        }
      }
    }

    // Check for REFLECT effect - reflect damage back to attacker
    // Only trigger on direct attacks, not on reflected damage (to avoid infinite loops)
    if (source !== 'reflect' && attacker && actualDamage > 0 && unit.currentHp > 0) {
      const reflectEffect = (unit.statusEffects || []).find(e => e.type === EffectType.REFLECT)
      if (reflectEffect) {
        const reflectPercent = reflectEffect.value
        const reflectDamage = Math.floor(actualDamage * reflectPercent / 100)
        if (reflectDamage > 0) {
          const unitName = unit.template?.name || 'Unknown'
          const attackerName = attacker.template?.name || attacker.name || 'Unknown'
          addLog(`${unitName} reflects ${reflectDamage} damage back to ${attackerName}!`)

          // Apply reflected damage to attacker (use 'reflect' source to prevent loops)
          const reflectedActual = Math.min(attacker.currentHp, reflectDamage)
          attacker.currentHp = Math.max(0, attacker.currentHp - reflectedActual)
          emitCombatEffect(attacker.id || attacker.instanceId, attacker.instanceId ? 'hero' : 'enemy', 'damage', reflectedActual)

          // Check for attacker death from reflect
          if (attacker.currentHp <= 0) {
            if (attacker.statusEffects?.length > 0) {
              attacker.statusEffects = []
            }
          }
        }
      }
    }

    // Check for HP-threshold triggered passives (e.g., Tower's Wrath, Cataclysm)
    if (unit.passiveAbilities && unit.currentHp > 0 && unit.triggeredPassives) {
      for (const passive of unit.passiveAbilities) {
        if (passive.triggerOnce && passive.targetType === 'all_heroes' && !unit.triggeredPassives.has(passive.id)) {
          let threshold = 50
          if (passive.triggerCondition === 'hp_below_50') threshold = 50
          else if (passive.triggerCondition === 'hp_below_25') threshold = 25
          const hpPercent = (unit.currentHp / unit.maxHp) * 100
          if (hpPercent < threshold) {
            unit.triggeredPassives.add(passive.id)
            const unitName = unit.template?.name || 'Unknown'
            const multiplier = (passive.damagePercent || 100) / 100
            addLog(`${unitName} triggers ${passive.name}!`)
            enemySkillActivation.value = { enemyId: unit.id, skillName: passive.name }
            for (const hero of aliveHeroes.value) {
              const heroDef = getEffectiveStat(hero, 'def')
              const passiveDamage = calculateDamage(unit.stats.atk, multiplier, heroDef)
              const heroActual = Math.min(hero.currentHp, Math.max(1, passiveDamage))
              hero.currentHp = Math.max(0, hero.currentHp - heroActual)
              if (heroActual > 0) {
                emitCombatEffect(hero.instanceId, 'hero', 'damage', heroActual)
              }
              if (hero.currentHp <= 0) {
                addLog(`${hero.template.name} has fallen!`)
                if (hero.statusEffects?.length > 0) hero.statusEffects = []
              }
            }
          }
        }
      }
    }

    return actualDamage
  }

  // Revive a dead unit with a percentage of max HP
  function reviveUnit(unit, hpPercent) {
    if (!unit || unit.currentHp > 0) return false

    const newHp = Math.floor(unit.maxHp * hpPercent / 100)
    unit.currentHp = newHp

    addLog(`${unit.template.name} has been revived with ${newHp} HP!`)
    emitCombatEffect(unit.instanceId, 'hero', 'heal', newHp)

    return true
  }

  // ========== SKILL CONDITION HELPERS ==========

  // Evaluate a condition object against a hero (for conditional skill effects)
  function evaluateCondition(condition, hero) {
    if (condition.stat === 'hpPercent') {
      const hpPercent = (hero.currentHp / hero.maxHp) * 100
      if (condition.below !== undefined) return hpPercent < condition.below
      if (condition.above !== undefined) return hpPercent > condition.above
    }
    return false
  }

  // ========== genus loci HELPERS ==========

  // Generate a Genus Loci boss enemy object for battle
  function generateGenusLociBoss(genusLociId, powerLevel) {
    const bossData = getGenusLoci(genusLociId)
    if (!bossData) return null

    // Calculate scaled stats based on power level
    const levelMultiplier = Math.pow(1, powerLevel - 1) // Base level
    const stats = {
      hp: Math.floor(bossData.baseStats.hp * Math.pow(bossData.statScaling.hp, powerLevel - 1)),
      atk: Math.floor(bossData.baseStats.atk * Math.pow(bossData.statScaling.atk, powerLevel - 1)),
      def: Math.floor(bossData.baseStats.def * Math.pow(bossData.statScaling.def, powerLevel - 1)),
      spd: bossData.baseStats.spd
    }

    // Get abilities unlocked at this power level
    const abilities = getGenusLociAbilitiesForLevel(genusLociId, powerLevel, bossData)

    // Separate active skills from passive abilities
    const activeSkills = abilities.filter(a => !a.isPassive)
    const passiveAbilities = abilities.filter(a => a.isPassive)

    // Initialize cooldowns for active skills (support initialCooldown for delayed availability)
    const cooldowns = {}
    for (const skill of activeSkills) {
      cooldowns[skill.name] = skill.initialCooldown || 0
    }

    return {
      id: 'genus_loci_boss',
      templateId: genusLociId,
      currentHp: stats.hp,
      maxHp: stats.hp,
      stats,
      template: {
        id: genusLociId,
        name: bossData.name,
        skills: activeSkills,
        imageSize: bossData.imageSize
      },
      currentCooldowns: cooldowns,
      statusEffects: [],
      passiveAbilities, // Store for checking passive triggers
      triggeredPassives: new Set(), // Track one-time passive triggers
      shield: 0, // For Iron Guard shield
      isGenusLoci: true
    }
  }

  // ========== EQUIPMENT HELPERS ==========

  /**
   * Get total stat bonuses from all equipped gear for a hero template
   * @param {string} templateId - Hero template ID
   * @returns {{ hp: number, atk: number, def: number, spd: number, mp: number }}
   */
  function getEquipmentBonuses(templateId) {
    const equipmentStore = useEquipmentStore()
    const gear = equipmentStore.getEquippedGear(templateId)

    const bonuses = { hp: 0, atk: 0, def: 0, spd: 0, mp: 0 }

    // Sum stats from all equipped items
    const slots = ['weapon', 'armor', 'trinket', 'special']
    for (const slot of slots) {
      const equipmentId = gear[slot]
      if (!equipmentId) continue

      const equipment = getEquipment(equipmentId)
      if (!equipment || !equipment.stats) continue

      // Add each stat from the equipment
      for (const stat in equipment.stats) {
        if (stat in bonuses) {
          bonuses[stat] += equipment.stats[stat]
        }
      }
    }

    return bonuses
  }

  /**
   * Get all equipment effects for a hero template
   * @param {string} templateId - Hero template ID
   * @returns {Array<{type: string, value?: number, ...}>} Array of effect objects
   */
  function getEquipmentEffects(templateId) {
    const equipmentStore = useEquipmentStore()
    const gear = equipmentStore.getEquippedGear(templateId)

    const effects = []

    // Collect effects from all equipped items
    const slots = ['weapon', 'armor', 'trinket', 'special']
    for (const slot of slots) {
      const equipmentId = gear[slot]
      if (!equipmentId) continue

      const equipment = getEquipment(equipmentId)
      if (!equipment || !equipment.effect) continue

      effects.push({ ...equipment.effect })
    }

    return effects
  }

  /**
   * Get MP boost from equipment effects (for mp_boost_and_cost_reduction)
   * @param {string} templateId - Hero template ID
   * @returns {number} Additional max MP
   */
  function getEquipmentMpBoost(templateId) {
    const effects = getEquipmentEffects(templateId)
    let boost = 0
    for (const effect of effects) {
      if (effect.type === 'mp_boost_and_cost_reduction' && effect.mpBoost) {
        boost += effect.mpBoost
      }
    }
    return boost
  }

  /**
   * Process equipment start-of-turn effects (mp_regen, hp_regen_percent, nature_regen)
   * @param {object} hero - Battle hero object
   */
  function processEquipmentStartOfTurn(hero) {
    if (hero.currentHp <= 0) return

    const effects = getEquipmentEffects(hero.templateId)

    for (const effect of effects) {
      if (effect.type === 'mp_regen') {
        const oldMp = hero.currentMp
        hero.currentMp = Math.min(hero.maxMp, hero.currentMp + effect.value)
        const gained = hero.currentMp - oldMp
        if (gained > 0) {
          addLog(`${hero.template.name} regenerates ${gained} MP from equipment!`)
        }
      }

      if (effect.type === 'hp_regen_percent' || effect.type === 'nature_regen') {
        const healAmount = Math.floor(hero.maxHp * effect.value / 100)
        const oldHp = hero.currentHp
        hero.currentHp = Math.min(hero.maxHp, hero.currentHp + healAmount)
        const healed = hero.currentHp - oldHp
        if (healed > 0) {
          addLog(`${hero.template.name} regenerates ${healed} HP from equipment!`)
          emitCombatEffect(hero.instanceId, 'hero', 'heal', healed)
        }
      }
    }
  }

  /**
   * Roll for critical hit based on equipment crit_chance
   * @param {string} templateId - Hero template ID
   * @returns {{isCrit: boolean, multiplier: number}}
   */
  function rollCrit(templateId) {
    const effects = getEquipmentEffects(templateId)
    let totalCritChance = 0

    for (const effect of effects) {
      if (effect.type === 'crit_chance') {
        totalCritChance += effect.value
      }
    }

    if (totalCritChance <= 0) {
      return { isCrit: false, multiplier: 1 }
    }

    const roll = Math.random() * 100
    if (roll < totalCritChance) {
      return { isCrit: true, multiplier: 1.5 }
    }

    return { isCrit: false, multiplier: 1 }
  }

  /**
   * Get ATK boost from low_hp_atk_boost effect
   * @param {object} hero - Battle hero object
   * @returns {number} ATK boost percentage (e.g., 25 for +25%)
   */
  function getEquipmentAtkBoost(hero) {
    const effects = getEquipmentEffects(hero.templateId)
    let boost = 0

    for (const effect of effects) {
      if (effect.type === 'low_hp_atk_boost') {
        const hpPercent = (hero.currentHp / hero.maxHp) * 100
        if (hpPercent < effect.threshold) {
          boost += effect.value
        }
      }
    }

    return boost
  }

  /**
   * Get skill cost reduction percentage from equipment
   * @param {string} templateId - Hero template ID
   * @returns {number} Cost reduction percentage (e.g., 10 for 10% reduction)
   */
  function getSkillCostReduction(templateId) {
    const effects = getEquipmentEffects(templateId)
    let reduction = 0

    for (const effect of effects) {
      if (effect.type === 'mp_boost_and_cost_reduction' && effect.costReduction) {
        reduction += effect.costReduction
      }
    }

    return reduction
  }

  /**
   * Process valor_on_block effect when a knight blocks damage
   * @param {object} hero - Battle hero object
   * @param {number} damageBlocked - Amount of damage blocked
   */
  function processValorOnBlock(hero, damageBlocked) {
    if (!isKnight(hero) || hero.currentValor === undefined) return
    if (damageBlocked <= 0) return

    const effects = getEquipmentEffects(hero.templateId)

    for (const effect of effects) {
      if (effect.type === 'valor_on_block') {
        gainValor(hero, effect.value)
        addLog(`${hero.template.name} gains ${effect.value} Valor from blocking!`)
      }
    }
  }

  /**
   * Process rage_on_kill effect when a berserker kills an enemy
   * @param {object} hero - Battle hero object
   */
  function processRageOnKill(hero) {
    if (!isBerserker(hero) || hero.currentRage === undefined) return

    const effects = getEquipmentEffects(hero.templateId)

    for (const effect of effects) {
      if (effect.type === 'rage_on_kill') {
        gainRage(hero, effect.value)
        addLog(`${hero.template.name} gains ${effect.value} Rage from kill!`)
      }
    }
  }

  /**
   * Process focus_on_crit effect when a ranger crits
   * @param {object} hero - Battle hero object
   * @param {boolean} didCrit - Whether the attack was a critical hit
   */
  function processFocusOnCrit(hero, didCrit) {
    if (!isRanger(hero)) return
    if (!didCrit) return

    const effects = getEquipmentEffects(hero.templateId)

    for (const effect of effects) {
      if (effect.type === 'focus_on_crit') {
        grantFocus(hero)
        addLog(`${hero.template.name} regains Focus from critical hit!`)
      }
    }
  }

  /**
   * Get spell damage amplification percentage from equipment
   * @param {string} templateId - Hero template ID
   * @returns {number} Spell amp percentage (e.g., 15 for +15%)
   */
  function getSpellAmp(templateId) {
    const effects = getEquipmentEffects(templateId)
    let amp = 0

    for (const effect of effects) {
      if (effect.type === 'spell_amp') {
        amp += effect.value
      }
    }

    return amp
  }

  /**
   * Get healing amplification percentage from equipment
   * @param {string} templateId - Hero template ID
   * @returns {number} Heal amp percentage (e.g., 20 for +20%)
   */
  function getHealAmp(templateId) {
    const effects = getEquipmentEffects(templateId)
    let amp = 0

    for (const effect of effects) {
      if (effect.type === 'heal_amp') {
        amp += effect.value
      }
    }

    return amp
  }

  /**
   * Get total ally damage reduction from all equipped ally_damage_reduction effects
   * @returns {number} Damage reduction percentage
   */
  function getAllyDamageReduction() {
    let totalReduction = 0

    for (const hero of heroes.value) {
      if (hero.currentHp <= 0) continue
      const effects = getEquipmentEffects(hero.templateId)

      for (const effect of effects) {
        if (effect.type === 'ally_damage_reduction') {
          totalReduction += effect.value
        }
      }
    }

    return totalReduction
  }

  /**
   * Get Finale effect boost percentage from equipment
   * @param {string} templateId - Hero template ID
   * @returns {number} Finale boost percentage (e.g., 25 for +25%)
   */
  function getFinaleBoost(templateId) {
    const effects = getEquipmentEffects(templateId)
    let boost = 0

    for (const effect of effects) {
      if (effect.type === 'finale_boost') {
        boost += effect.value
      }
    }

    return boost
  }

  /**
   * Apply starting equipment effects to a hero (starting_mp, starting_resource)
   * @param {object} hero - Battle hero object
   * @param {string} templateId - Hero template ID
   */
  function applyStartingEquipmentEffects(hero, templateId) {
    const effects = getEquipmentEffects(templateId)

    for (const effect of effects) {
      // Starting MP bonus
      if (effect.type === 'starting_mp') {
        hero.currentMp = Math.min(hero.maxMp, hero.currentMp + effect.value)
      }

      // Starting resource bonus (Rage/Valor for Berserkers/Knights)
      if (effect.type === 'starting_resource') {
        if (isBerserker(hero) && hero.currentRage !== undefined) {
          hero.currentRage = Math.min(100, hero.currentRage + effect.value)
        }
        if (isKnight(hero) && hero.currentValor !== undefined) {
          hero.currentValor = Math.min(100, hero.currentValor + effect.value)
        }
        // Rangers already start with focus, no additional benefit
      }
    }
  }

  // ========== BATTLE FUNCTIONS ==========

  function initBattle(partyState, enemyTemplateIds, genusLociContext = null) {
    const heroesStore = useHeroesStore()

    // Reset state
    heroes.value = []
    enemies.value = []
    turnOrder.value = []
    currentTurnIndex.value = 0
    roundNumber.value = 1
    battleLog.value = []
    selectedAction.value = null
    selectedTarget.value = null
    bloodTempoUses.value = {}
    battleType.value = genusLociContext ? 'genusLoci' : 'normal'
    genusLociMeta.value = genusLociContext ? {
      genusLociId: genusLociContext.genusLociId,
      powerLevel: genusLociContext.powerLevel,
      triggeredTowersWrath: false
    } : null
    resetAllyHpTracking()

    // Initialize heroes from party
    const party = heroesStore.party.filter(Boolean)
    for (const instanceId of party) {
      const heroFull = heroesStore.getHeroFull(instanceId)
      if (!heroFull) continue

      const savedState = partyState?.[instanceId]

      // Build cooldowns for hero skills
      const heroCooldowns = {}
      if (heroFull.template.skills) {
        for (const skill of heroFull.template.skills) {
          if (skill.cooldown) heroCooldowns[skill.name] = 0
        }
      }

      // Get equipment bonuses (only if hero is NOT on expedition)
      const isOnExpedition = heroFull.explorationNodeId != null
      const equipBonuses = isOnExpedition
        ? { hp: 0, atk: 0, def: 0, spd: 0, mp: 0 }
        : getEquipmentBonuses(heroFull.templateId)

      // Get MP boost from equipment effects (mp_boost_and_cost_reduction)
      const mpBoostFromEffects = isOnExpedition ? 0 : getEquipmentMpBoost(heroFull.templateId)

      // Build final stats with equipment bonuses
      const finalStats = {
        hp: heroFull.stats.hp + equipBonuses.hp,
        atk: heroFull.stats.atk + equipBonuses.atk,
        def: heroFull.stats.def + equipBonuses.def,
        spd: heroFull.stats.spd + equipBonuses.spd,
        mp: heroFull.stats.mp + equipBonuses.mp + mpBoostFromEffects
      }

      const battleHero = {
        instanceId,
        templateId: heroFull.templateId,
        level: heroFull.level,
        currentHp: savedState?.currentHp ?? finalStats.hp,
        maxHp: finalStats.hp,
        currentMp: savedState?.currentMp ?? Math.floor(finalStats.mp * 0.3),
        maxMp: finalStats.mp,
        stats: finalStats,
        template: heroFull.template,
        class: heroFull.class,
        statusEffects: [],
        currentCooldowns: heroCooldowns,
        hasFocus: heroFull.class?.resourceType === 'focus' ? true : undefined,
        currentValor: heroFull.class?.resourceType === 'valor' ? 0 : undefined,
        currentRage: heroFull.class?.resourceType === 'rage' ? (savedState?.currentRage ?? 0) : undefined,
        currentVerses: heroFull.class?.resourceType === 'verse' ? 0 : undefined,
        lastSkillName: heroFull.class?.resourceType === 'verse' ? null : undefined,
        wasAttacked: false
      }

      // Apply starting equipment effects (starting_mp, starting_resource)
      if (!isOnExpedition) {
        applyStartingEquipmentEffects(battleHero, heroFull.templateId)
      }

      // Initialize Heartbreak stacks for heroes with heartbreakPassive (e.g., Mara Thornheart)
      initializeHeartbreakStacks(battleHero)

      // Initialize Essence for Alchemist heroes
      initializeEssence(battleHero)

      heroes.value.push(battleHero)
    }

    // Initialize enemies
    if (genusLociContext) {
      // Genus Loci battle - generate boss
      const boss = generateGenusLociBoss(genusLociContext.genusLociId, genusLociContext.powerLevel)
      if (boss) {
        enemies.value.push(boss)
        addLog(`${boss.template.name} (Lv.${genusLociContext.powerLevel}) appears!`)
      }
    } else {
      // Normal battle - use enemy templates
      let enemyIndex = 0
      for (const templateId of enemyTemplateIds) {
        const template = getEnemyTemplate(templateId)
        if (!template) continue

        const cooldowns = {}
        if (template.skills) {
          for (const skill of template.skills) {
            cooldowns[skill.name] = skill.initialCooldown || 0
          }
        } else if (template.skill) {
          cooldowns[template.skill.name] = template.skill.initialCooldown || 0
        }

        enemies.value.push({
          id: `enemy_${enemyIndex++}`,
          templateId,
          currentHp: template.stats.hp,
          maxHp: template.stats.hp,
          stats: template.stats,
          template,
          currentCooldowns: cooldowns,
          statusEffects: []
        })
      }
    }

    // Set nextEnemyId to continue from existing enemies
    nextEnemyId.value = enemies.value.length

    // Apply passive leader skill effects
    applyPassiveLeaderEffects()

    // Apply round 1 timed effects
    applyTimedLeaderEffects(1)
    applyPassiveRegenLeaderEffects()

    calculateTurnOrder()

    state.value = BattleState.STARTING
    addLog(`Battle start! Round ${roundNumber.value}`)

    setTimeout(() => startNextTurn(), 500)
  }

  function calculateTurnOrder() {
    const units = []

    for (const hero of heroes.value) {
      if (hero.currentHp > 0) {
        const effectiveSpd = getEffectiveStat(hero, 'spd')
        const tempoEffect = hero.statusEffects?.find(e => e.type === EffectType.SHATTERED_TEMPO)
        units.push({
          type: 'hero',
          id: hero.instanceId,
          spd: effectiveSpd,
          turnOrderPriority: tempoEffect?.turnOrderPriority || 999
        })
      }
    }

    for (const enemy of enemies.value) {
      if (enemy.currentHp > 0) {
        const effectiveSpd = getEffectiveStat(enemy, 'spd')
        units.push({
          type: 'enemy',
          id: enemy.id,
          spd: effectiveSpd,
          turnOrderPriority: 999
        })
      }
    }

    // Sort by priority first (lower = acts sooner), then by SPD
    units.sort((a, b) => {
      if (a.turnOrderPriority !== b.turnOrderPriority) {
        return a.turnOrderPriority - b.turnOrderPriority
      }
      return b.spd - a.spd
    })

    turnOrder.value = units.map(u => ({ type: u.type, id: u.id }))
  }

  function startNextTurn() {
    // Check for victory/defeat
    if (aliveHeroes.value.length === 0) {
      state.value = BattleState.DEFEAT
      addLog('Defeat! All heroes have fallen.')
      return
    }

    if (aliveEnemies.value.length === 0) {
      state.value = BattleState.VICTORY
      addLog('Victory! All enemies defeated.')
      return
    }

    // Find next alive unit
    let attempts = 0
    while (attempts < turnOrder.value.length) {
      const turn = turnOrder.value[currentTurnIndex.value]

      if (turn.type === 'hero') {
        const hero = heroes.value.find(h => h.instanceId === turn.id)
        if (hero && hero.currentHp > 0) {
          // Check for stun
          if (!processStartOfTurnEffects(hero)) {
            // Stunned - process end of turn effects and skip
            processEndOfTurnEffects(hero)
            advanceTurnIndex()
            setTimeout(() => startNextTurn(), 600)
            return
          }

          // Process equipment start-of-turn effects (mp_regen, hp_regen_percent, nature_regen)
          processEquipmentStartOfTurn(hero)

          // Regenerate Essence for Alchemist heroes (+10 per turn)
          regenerateEssence(hero)

          // Check for Bard Finale (auto-trigger at 3 verses)
          if (isBard(hero) && hero.currentVerses >= 3 && hero.template.finale) {
            executeFinale(hero)
          }

          state.value = BattleState.PLAYER_TURN
          selectedAction.value = null
          selectedTarget.value = null
          addLog(`${hero.template.name}'s turn`)
          return
        }
      } else {
        const enemy = enemies.value.find(e => e.id === turn.id)
        if (enemy && enemy.currentHp > 0) {
          // Check for stun
          if (!processStartOfTurnEffects(enemy)) {
            processEndOfTurnEffects(enemy)
            advanceTurnIndex()
            setTimeout(() => startNextTurn(), 600)
            return
          }

          state.value = BattleState.ENEMY_TURN
          addLog(`${enemy.template.name}'s turn`)
          setTimeout(() => executeEnemyTurn(enemy), 800)
          return
        }
      }

      advanceTurnIndex()
      attempts++
    }
  }

  // Process end-of-round Valor gains for all Knights
  function processRoundEndValor() {
    const livingAllies = aliveHeroes.value.length

    for (const hero of heroes.value) {
      if (!isKnight(hero) || hero.currentHp <= 0) continue

      const oldValor = hero.currentValor || 0
      let gained = 0

      // +5 passive per round
      gained += 5

      // +5 per living ally (not counting self)
      gained += (livingAllies - 1) * 5

      // +10 if below 50% HP
      if (hero.currentHp < hero.maxHp * 0.5) {
        gained += 10
      }

      gainValor(hero, gained)

      if (hero.currentValor > oldValor) {
        const heroName = hero.template?.name || 'Knight'
        addLog(`${heroName} gains ${hero.currentValor - oldValor} Valor! (${hero.currentValor}/100)`)
      }
    }
  }

  function advanceTurnIndex() {
    currentTurnIndex.value++
    if (currentTurnIndex.value >= turnOrder.value.length) {
      currentTurnIndex.value = 0
      roundNumber.value++
      addLog(`--- Round ${roundNumber.value} ---`)

      // Valor gains at round end for Knights
      processRoundEndValor()

      // Check for round-triggered leader effects
      applyTimedLeaderEffects(roundNumber.value)
      applyPassiveRegenLeaderEffects()

      // MP recovery at start of round
      for (const hero of heroes.value) {
        if (hero.currentHp > 0 && !isBard(hero)) {
          const recovery = Math.floor(hero.maxMp * 0.1)
          hero.currentMp = Math.min(hero.currentMp + recovery, hero.maxMp)
        }
      }

      // Reduce enemy cooldowns
      for (const enemy of enemies.value) {
        for (const skillName of Object.keys(enemy.currentCooldowns)) {
          if (enemy.currentCooldowns[skillName] > 0) {
            enemy.currentCooldowns[skillName]--
          }
        }
      }

      // Reduce hero cooldowns
      for (const hero of heroes.value) {
        if (hero.currentCooldowns) {
          for (const skillName of Object.keys(hero.currentCooldowns)) {
            if (hero.currentCooldowns[skillName] > 0) {
              hero.currentCooldowns[skillName]--
            }
          }
        }
      }

      calculateTurnOrder()
    }
  }

  function selectAction(action) {
    if (state.value !== BattleState.PLAYER_TURN) return
    selectedAction.value = action

    const skillIndex = parseSkillIndex(action)
    if (skillIndex !== null) {
      const skill = getSkillByIndex(currentUnit.value, skillIndex)
      if (!skill) return

      const targetType = skill.targetType || 'enemy'

      if (targetType === 'self' || targetType === 'all_enemies' || targetType === 'all_allies' || targetType === 'random_enemies') {
        executePlayerAction()
      }
    }
  }

  function selectTarget(targetId, targetType = 'enemy') {
    if (state.value !== BattleState.PLAYER_TURN) return
    if (!selectedAction.value) return

    selectedTarget.value = { id: targetId, type: targetType }
    executePlayerAction()
  }

  function executePlayerAction() {
    const hero = currentUnit.value
    if (!hero || hero.currentHp <= 0) return

    let usedSkill = false
    let skillUsed = null  // Track the skill for grantsExtraTurn check

    state.value = BattleState.ANIMATING

    if (selectedAction.value === 'attack') {
      const target = enemies.value.find(e => e.id === selectedTarget.value?.id)
      if (!target || target.currentHp <= 0) {
        addLog('Invalid target')
        state.value = BattleState.PLAYER_TURN
        return
      }

      const effectiveAtk = getEffectiveStat(hero, 'atk')
      const effectiveDef = getEffectiveStat(target, 'def')
      const basicDamagePercent = getBasicAttackDamagePercent(hero)
      const damage = calculateDamage(effectiveAtk, basicDamagePercent / 100, effectiveDef)
      applyDamage(target, damage, 'attack', hero)
      addLog(`${hero.template.name} attacks ${target.template.name} for ${damage} damage!`)
      emitCombatEffect(target.id, 'enemy', 'damage', damage)

      if (target.currentHp <= 0) {
        addLog(`${target.template.name} defeated!`)
      }

      // Check for thorns effect on the enemy
      const thornsEffect = target.statusEffects?.find(e => e.type === EffectType.THORNS)
      if (thornsEffect && target.currentHp > 0) {
        const enemyAtk = getEffectiveStat(target, 'atk')
        const thornsDamage = Math.max(1, Math.floor(enemyAtk * (thornsEffect.value || 40) / 100))
        applyDamage(hero, thornsDamage, 'thorns')
        addLog(`${hero.template.name} takes ${thornsDamage} thorns damage!`)
        emitCombatEffect(hero.instanceId, 'hero', 'damage', thornsDamage)
        if (hero.currentHp <= 0) {
          addLog(`${hero.template.name} has fallen!`)
        }
      }
    } else {
      const skillIndex = parseSkillIndex(selectedAction.value)
      if (skillIndex === null) {
        state.value = BattleState.PLAYER_TURN
        return
      }
      const skill = getSkillByIndex(hero, skillIndex)
      if (!skill) {
        state.value = BattleState.PLAYER_TURN
        return
      }
      skillUsed = skill  // Track for grantsExtraTurn check at end of action

      // Check resource availability: Valor for knights, Focus for rangers, MP for others
      if (isKnight(hero)) {
        if (skill.valorRequired && (hero.currentValor || 0) < skill.valorRequired) {
          addLog(`Requires ${skill.valorRequired} Valor!`)
          state.value = BattleState.PLAYER_TURN
          return
        }
        // Handle 'all' valor cost (consume all valor) — deferred to damage calculation
        if (skill.valorCost === 'all') {
          if ((hero.currentValor || 0) <= 0) {
            addLog(`Not enough ${hero.class.resourceName}!`)
            state.value = BattleState.PLAYER_TURN
            return
          }
          // Valor will be consumed in resolveValorCost during damage calculation
        }
        // Knights don't spend MP
      } else if (isRanger(hero)) {
        if (!hero.hasFocus) {
          addLog(`Not enough ${hero.class.resourceName}!`)
          state.value = BattleState.PLAYER_TURN
          return
        }
      } else if (isBerserker(hero)) {
        // Handle 'all' rage cost (consume all rage)
        if (skill.rageCost === 'all') {
          if (hero.currentRage <= 0) {
            addLog(`Not enough ${hero.class.resourceName}!`)
            state.value = BattleState.PLAYER_TURN
            return
          }
          // Store consumed rage for damage calculation, will be consumed after skill execution
        } else {
          const rageCost = skill.rageCost ?? 0
          if (hero.currentRage < rageCost) {
            addLog(`Not enough ${hero.class.resourceName}!`)
            state.value = BattleState.PLAYER_TURN
            return
          }
          hero.currentRage -= rageCost
        }
      } else if (isBard(hero)) {
        // Bards have no resource cost — skills are free
        // Repeat restriction is handled by BattleScreen canUseSkill
      } else if (isAlchemist(hero)) {
        const essenceCost = skill.essenceCost ?? 0
        if ((hero.currentEssence || 0) < essenceCost) {
          addLog(`Not enough ${hero.class.resourceName}!`)
          state.value = BattleState.PLAYER_TURN
          return
        }
        hero.currentEssence -= essenceCost
      } else {
        // Apply skill cost reduction from equipment
        const costReduction = getSkillCostReduction(hero.templateId)
        let actualMpCost = skill.mpCost || 0
        if (costReduction > 0 && actualMpCost > 0) {
          actualMpCost = Math.max(1, Math.floor(actualMpCost * (1 - costReduction / 100)))
        }
        if (hero.currentMp < actualMpCost) {
          addLog(`Not enough ${hero.class.resourceName}!`)
          state.value = BattleState.PLAYER_TURN
          return
        }
        hero.currentMp -= actualMpCost
      }
      usedSkill = true

      // Apply cooldown if skill has one (+1 to survive start-of-round decrement)
      if (skill.cooldown && hero.currentCooldowns) {
        hero.currentCooldowns[skill.name] = skill.cooldown + 1
      }

      // Knights gain Valor for using defensive skills
      if (isKnight(hero) && skill.defensive) {
        const oldValor = hero.currentValor || 0
        gainValor(hero, 5)
        if (hero.currentValor > oldValor) {
          addLog(`${hero.template.name} gains 5 Valor from defensive action! (${hero.currentValor}/100)`)
        }
      }

      // Rangers lose focus when using a skill
      if (isRanger(hero)) {
        removeFocus(hero, true)  // silent - skill use is implied
      }

      // Bards gain a verse when using a skill
      if (isBard(hero)) {
        gainVerse(hero)
        hero.lastSkillName = skill.name
        addLog(`${hero.template.name} plays ${skill.name}! (Verse ${hero.currentVerses}/3)`)
      }

      // Track Blood Tempo uses for Torga's Blood Echo
      processSkillForBloodTempoTracking(hero, skill)

      const targetType = skill.targetType || 'enemy'
      let effectiveAtk = getEffectiveStat(hero, 'atk')

      // Apply equipment low_hp_atk_boost
      const equipAtkBoost = getEquipmentAtkBoost(hero)
      if (equipAtkBoost > 0) {
        effectiveAtk = Math.floor(effectiveAtk * (1 + equipAtkBoost / 100))
        addLog(`${hero.template.name}'s desperation boosts ATK by ${equipAtkBoost}%!`)
      }

      // Support useStat property for skills that use a different stat for damage (e.g., DEF)
      const damageStat = skill.useStat || 'atk'
      const effectiveDamageStat = skill.useStat ? getEffectiveStat(hero, skill.useStat) : effectiveAtk

      // Get shard bonus for this hero (0, 5, 10, or 15)
      const heroesStore = useHeroesStore()
      const shardBonus = heroesStore.getShardBonus(hero.instanceId)

      // Roll for crit from equipment (once per skill use)
      const critResult = rollCrit(hero.templateId)
      if (critResult.isCrit) {
        addLog(`${hero.template.name} scores a CRITICAL HIT!`)
      }

      // Get spell amp from equipment
      const spellAmp = getSpellAmp(hero.templateId)

      // Set effect source context for tooltip tracking
      currentEffectSource = `${hero.template.name}'s ${skill.name}`

      switch (targetType) {
        case 'enemy': {
          const target = enemies.value.find(e => e.id === selectedTarget.value?.id)
          if (!target || target.currentHp <= 0) {
            addLog('Invalid target')
            // Refund resource: Focus for rangers, Rage for berserkers, Essence for alchemists, MP for others
            if (isRanger(hero)) {
              grantFocus(hero)
            } else if (isBerserker(hero)) {
              // Don't refund 'all' cost skills (rage wasn't deducted yet)
              if (typeof skill.rageCost === 'number') {
                hero.currentRage += skill.rageCost
              }
            } else if (isAlchemist(hero)) {
              hero.currentEssence += skill.essenceCost ?? 0
            } else {
              hero.currentMp += skill.mpCost
            }
            state.value = BattleState.PLAYER_TURN
            return
          }

          // Process conditionalPreBuff (e.g., Defensive Footwork grants DEF buff if attacked)
          if (skill.conditionalPreBuff) {
            const { condition, effect: preBuff } = skill.conditionalPreBuff
            let conditionMet = false
            if (condition === 'wasAttacked' && hero.wasAttacked) {
              conditionMet = true
            }
            if (conditionMet && preBuff) {
              const buffDuration = resolveEffectDuration(preBuff, hero)
              const buffValue = resolveEffectValue(preBuff, hero, effectiveAtk, shardBonus)
              applyEffect(hero, preBuff.type, { duration: buffDuration, value: buffValue, sourceId: hero.instanceId, fromAllySkill: true })
              emitCombatEffect(hero.instanceId, 'hero', 'buff', 0)
              addLog(`${hero.template.name} was attacked - gains +${buffValue}% DEF!`)
            }
          }

          // Recalculate damage stat after pre-buff (in case pre-buff affects the stat used for damage)
          let finalDamageStat = skill.useStat ? getEffectiveStat(hero, skill.useStat) : effectiveAtk

          let targetEvaded = false

          // Handle multi-hit rage-consuming skills (e.g., Crushing Eternity)
          if (skill.rageCost === 'all' && skill.multiHit && skill.baseDamage !== undefined && skill.damagePerRage !== undefined) {
            const rageConsumed = hero.currentRage || 0
            hero.currentRage = 0 // Consume all rage

            const effectiveDef = getEffectiveStat(target, 'def')
            // Apply ignoreDef if present
            const defReduction = skill.ignoreDef ? (skill.ignoreDef / 100) : 0
            const reducedDef = effectiveDef * (1 - defReduction)

            // Apply shard bonus to the base damage percentage
            const multiplier = (skill.baseDamage + shardBonus + skill.damagePerRage * rageConsumed) / 100
            let totalDamage = 0

            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}! (${rageConsumed} rage consumed)`)

            const markedMultiplier = getMarkedDamageMultiplier(target)
            for (let i = 0; i < skill.multiHit && target.currentHp > 0; i++) {
              let hitDamage = calculateDamageWithMarked(finalDamageStat, multiplier, reducedDef, markedMultiplier)
              // Apply crit and spell amp
              hitDamage = Math.floor(hitDamage * critResult.multiplier * (1 + spellAmp / 100))
              applyDamage(target, hitDamage, 'attack', hero)
              totalDamage += hitDamage
              emitCombatEffect(target.id, 'enemy', 'damage', hitDamage)
            }

            // Process focus_on_crit for rangers
            if (critResult.isCrit) {
              processFocusOnCrit(hero, true)
            }

            addLog(`${hero.template.name} deals ${totalDamage} total damage in ${skill.multiHit} hits!`)

            if (target.currentHp <= 0) {
              addLog(`${target.template.name} defeated!`)
              processRageOnKill(hero)
            }
          }
          // Handle single-hit valor-consuming skills (e.g., Judgment of Steel)
          else if (skill.valorCost === 'all' && skill.baseDamage !== undefined && skill.damagePerValor !== undefined) {
            const { valorConsumed, damagePercent } = resolveValorCost(hero, skill)

            const effectiveDef = getEffectiveStat(target, 'def')
            const defReduction = skill.ignoreDef ? (skill.ignoreDef / 100) : 0
            const reducedDef = effectiveDef * (1 - defReduction)

            // Apply shard bonus to the calculated damage percentage
            const multiplier = (damagePercent + shardBonus) / 100
            const markedMultiplier = getMarkedDamageMultiplier(target)
            let damage = calculateDamageWithMarked(finalDamageStat, multiplier, reducedDef, markedMultiplier)
            // Apply crit and spell amp
            damage = Math.floor(damage * critResult.multiplier * (1 + spellAmp / 100))

            // Process focus_on_crit for rangers
            if (critResult.isCrit) {
              processFocusOnCrit(hero, true)
            }

            applyDamage(target, damage, 'attack', hero)
            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name} for ${damage} damage! (${valorConsumed} Valor consumed)`)
            emitCombatEffect(target.id, 'enemy', 'damage', damage)

            // Handle healSelfPercent (lifesteal)
            if (skill.healSelfPercent && damage > 0) {
              const healAmount = calculateHealSelfPercent(damage, skill.healSelfPercent)
              if (healAmount > 0) {
                const maxHp = hero.stats?.hp || hero.maxHp
                const oldHp = hero.currentHp
                hero.currentHp = Math.min(maxHp, hero.currentHp + healAmount)
                const actualHeal = hero.currentHp - oldHp
                if (actualHeal > 0) {
                  addLog(`${hero.template.name} heals for ${actualHeal}!`)
                  emitCombatEffect(hero.instanceId, 'hero', 'heal', actualHeal)
                }
              }
            }

            if (target.currentHp <= 0) {
              addLog(`${target.template.name} defeated!`)
              processRageOnKill(hero)
            }
          }
          // Handle regular multi-hit skills (e.g., Toad Strangler)
          else if (skill.multiHit && !skill.noDamage) {
            const effectiveDef = getEffectiveStat(target, 'def')
            const defReduction = skill.ignoreDef ? (skill.ignoreDef / 100) : 0
            const reducedDef = effectiveDef * (1 - defReduction)
            const multiplier = parseSkillMultiplier(skill.description, shardBonus)
            const markedMultiplier = getMarkedDamageMultiplier(target)
            let totalDamage = 0

            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}!`)

            for (let i = 0; i < skill.multiHit && target.currentHp > 0; i++) {
              let hitDamage = calculateDamageWithMarked(finalDamageStat, multiplier, reducedDef, markedMultiplier)
              // Apply crit and spell amp
              hitDamage = Math.floor(hitDamage * critResult.multiplier * (1 + spellAmp / 100))
              applyDamage(target, hitDamage, 'attack', hero)
              totalDamage += hitDamage
              emitCombatEffect(target.id, 'enemy', 'damage', hitDamage)

              // Process onHitDebuffedTarget (e.g., Swift Arrow's Flurry of Arrows momentum stacking)
              if (skill.onHitDebuffedTarget && target.currentHp > 0) {
                const targetHasDebuff = (target.statusEffects || []).some(e => {
                  const def = e.definition || getEffectDefinition(e.type)
                  return def && !def.isBuff
                })
                if (targetHasDebuff && skill.onHitDebuffedTarget.applyToSelf) {
                  const selfEffect = skill.onHitDebuffedTarget.applyToSelf
                  applyEffect(hero, selfEffect.type, {
                    duration: selfEffect.duration,
                    value: selfEffect.value,
                    sourceId: hero.instanceId
                  })
                }
              }
            }

            // Process focus_on_crit for rangers
            if (critResult.isCrit) {
              processFocusOnCrit(hero, true)
            }

            addLog(`${hero.template.name} deals ${totalDamage} total damage in ${skill.multiHit} hits!`)

            if (target.currentHp <= 0) {
              addLog(`${target.template.name} defeated!`)
              processRageOnKill(hero)
            }
          }
          // Deal damage unless skill is effect-only
          else if (!skill.noDamage) {
            const effectiveDef = getEffectiveStat(target, 'def')
            // Check conditionalAtLowHp (e.g., Death's Needle ignores DEF below 30% HP)
            const lowHpCondition = skill.conditionalAtLowHp
            const heroHpPercent = (hero.currentHp / hero.maxHp) * 100
            const lowHpActive = lowHpCondition && heroHpPercent < lowHpCondition.hpThreshold
            // Process bonusIfTargetHas modifiers (e.g., Swift Arrow's Precision Strike)
            let bonusIgnoreDef = 0
            let bonusDamagePercent = null
            if (skill.bonusIfTargetHas) {
              for (const bonus of skill.bonusIfTargetHas) {
                if (hasEffect(target, bonus.effectType)) {
                  if (bonus.ignoreDef) bonusIgnoreDef += bonus.ignoreDef
                  if (bonus.damagePercent) bonusDamagePercent = bonus.damagePercent
                }
              }
            }

            // Apply ignoreDef if present, or full ignore from conditionalAtLowHp
            const baseDefReduction = lowHpActive && lowHpCondition.ignoresDef ? 1 : (skill.ignoreDef ? (skill.ignoreDef / 100) : 0)
            const defReduction = Math.min(1, baseDefReduction + bonusIgnoreDef / 100)
            const reducedDef = effectiveDef * (1 - defReduction)
            const markedMultiplier = getMarkedDamageMultiplier(target)
            let damage

            // Count debuffs for bonusDamagePerDebuff skills (e.g., Knarly's Special)
            let debuffCount = 0
            if (skill.bonusDamagePerDebuff) {
              debuffCount = (target.statusEffects || []).filter(e => !e.definition?.isBuff).length
            }

            // Handle Heartbreak stack mechanics for damage calculation
            let heartbreakStacksConsumed = 0
            let heartbreakBonusDamagePercent = 0

            // If skill consumes all Heartbreak stacks, do it now and calculate bonus
            if (skill.consumeAllHeartbreakStacks && hasHeartbreakPassive(hero)) {
              heartbreakStacksConsumed = consumeAllHeartbreakStacks(hero)
              if (skill.damagePerHeartbreakStackConsumed) {
                heartbreakBonusDamagePercent = heartbreakStacksConsumed * skill.damagePerHeartbreakStackConsumed
              }
            }

            // If skill has damagePerHeartbreakStack, add bonus per current stack (without consuming)
            if (skill.damagePerHeartbreakStack && hasHeartbreakPassive(hero)) {
              const currentStacks = hero.heartbreakStacks || 0
              heartbreakBonusDamagePercent += currentStacks * skill.damagePerHeartbreakStack
            }

            // Check for Valor-scaled damage
            const scaledDamage = getSkillDamage(skill, hero)
            if (scaledDamage !== null) {
              // Apply shard bonus and Heartbreak bonus to Valor-scaled damage percentage
              const multiplier = (scaledDamage + shardBonus + heartbreakBonusDamagePercent) / 100
              damage = calculateDamageWithMarked(finalDamageStat, multiplier, reducedDef, markedMultiplier)
            } else if (skill.damageMultiplier !== undefined) {
              // Use explicit damageMultiplier if provided (with bonus per debuff)
              let baseMultiplier = skill.damageMultiplier
              if (skill.bonusDamagePerDebuff && debuffCount > 0) {
                baseMultiplier += (skill.bonusDamagePerDebuff / 100) * debuffCount
              }
              // Apply shard bonus and Heartbreak bonus as percentage
              baseMultiplier += (shardBonus + heartbreakBonusDamagePercent) / 100
              damage = calculateDamageWithMarked(finalDamageStat, baseMultiplier, reducedDef, markedMultiplier)
            } else if (skill.damagePercent !== undefined) {
              // Use explicit damagePercent if provided (for skills like Mara's)
              // Apply Volatility damage bonus for Alchemist skills
              const volatilityBonus = (skill.usesVolatility && isAlchemist(hero)) ? getVolatilityDamageBonus(hero) : 0
              const multiplier = ((bonusDamagePercent || skill.damagePercent) + shardBonus + heartbreakBonusDamagePercent + volatilityBonus) / 100
              damage = calculateDamageWithMarked(finalDamageStat, multiplier, reducedDef, markedMultiplier)
            } else {
              // Parse from description with Heartbreak bonus
              const baseMultiplier = parseSkillMultiplier(skill.description, shardBonus)
              const finalMultiplier = baseMultiplier + heartbreakBonusDamagePercent / 100
              damage = calculateDamageWithMarked(finalDamageStat, finalMultiplier, reducedDef, markedMultiplier)
            }

            // Apply crit and spell amp
            damage = Math.floor(damage * critResult.multiplier * (1 + spellAmp / 100))

            // Apply DISCORDANT_RESONANCE damage bonus (Cacophon's leader skill)
            damage = Math.floor(damage * getDiscordantDamageBonus(hero))

            // Process focus_on_crit for rangers
            if (critResult.isCrit) {
              processFocusOnCrit(hero, true)
            }

            const dmgResult = {}
            const attackSource = (lowHpActive && lowHpCondition.cannotMiss) ? 'attack_cannot_miss' : 'attack'
            applyDamage(target, damage, attackSource, hero, dmgResult)
            if (dmgResult.evaded) targetEvaded = true
            if (skill.bonusDamagePerDebuff && debuffCount > 0) {
              const debuffNote = skill.consumeDebuffs ? `${debuffCount} debuffs consumed` : `${debuffCount} debuffs`
              addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name} for ${damage} damage! (${debuffNote})`)
            } else {
              addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name} for ${damage} damage!`)
            }
            emitCombatEffect(target.id, 'enemy', 'damage', damage)

// Heal all allies for percentage of damage dealt (Nature's Reclamation)
            if (skill.healAlliesPercent && damage > 0) {
              healAlliesFromDamage(aliveHeroes.value, damage, skill.healAlliesPercent)
              addLog(`All allies are healed from the life force reclaimed!`)
            }

            // Handle healSelfPercent (lifesteal) and Heartbreak lifesteal
            let totalLifestealPercent = skill.healSelfPercent || 0

            // Add Heartbreak lifesteal bonus if skill uses it
            if (skill.usesHeartbreakLifesteal && hasHeartbreakPassive(hero)) {
              const { lifestealBonus } = getHeartbreakBonuses(hero)
              totalLifestealPercent += lifestealBonus
            }

            // Also add leader bonus lifesteal if present
            if (hero.leaderBonuses?.lifesteal) {
              totalLifestealPercent += hero.leaderBonuses.lifesteal
            }

            if (totalLifestealPercent > 0 && damage > 0) {
              const healAmount = calculateHealSelfPercent(damage, totalLifestealPercent)
              if (healAmount > 0) {
                const maxHp = hero.stats?.hp || hero.maxHp
                const oldHp = hero.currentHp
                hero.currentHp = Math.min(maxHp, hero.currentHp + healAmount)
                const actualHeal = hero.currentHp - oldHp
                if (actualHeal > 0) {
                  addLog(`${hero.template.name} heals for ${actualHeal}!`)
                  emitCombatEffect(hero.instanceId, 'hero', 'heal', actualHeal)
                }
              }
            }

            // Consume debuffs if skill has consumeDebuffs flag
            if (skill.consumeDebuffs && target.currentHp > 0) {
              const debuffsRemoved = (target.statusEffects || []).filter(e => !e.definition?.isBuff)
              if (debuffsRemoved.length > 0) {
                target.statusEffects = (target.statusEffects || []).filter(e => e.definition?.isBuff)
                for (const debuff of debuffsRemoved) {
                  addLog(`${target.template.name}'s ${debuff.definition.name} was consumed!`)
                }
              }
            }

            // Handle splash damage to random other enemies
            if (skill.splashCount && skill.splashDamagePercent) {
              const otherEnemies = aliveEnemies.value.filter(e => e.id !== target.id)
              applySplashDamage(hero, target, otherEnemies, skill)
            }

            // Handle ECHOING effect splash damage (Cacophon's Screaming Echo)
            if (checkAndApplyEchoing(hero, skill) && damage > 0) {
              const splashPercent = getEchoingSplashPercent(hero)
              if (splashPercent > 0) {
                const splashDamage = Math.floor(damage * splashPercent / 100)
                const otherEnemies = aliveEnemies.value.filter(e => e.id !== target.id && e.currentHp > 0)

                if (otherEnemies.length > 0 && splashDamage > 0) {
                  for (const enemy of otherEnemies) {
                    applyDamage(enemy, splashDamage, 'attack', hero)
                    emitCombatEffect(enemy.id, 'enemy', 'damage', splashDamage)
                  }
                  addLog(`Echoing damage strikes ${otherEnemies.length} other enemies for ${splashDamage} each!`)
                }

                consumeEchoingEffect(hero)
              }
            }
          } else {
            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}!`)
          }

          // Apply skill effects (skip enemy-targeted effects if attack was evaded)
          if (skill.effects && !targetEvaded) {
            // Check for stunIfDebuffed: if target has any debuff, apply stun instead of normal effects
            if (skill.stunIfDebuffed) {
              const targetDebuffs = (target.statusEffects || []).filter(e => !e.definition?.isBuff)
              if (targetDebuffs.length > 0) {
                // Target has debuffs - apply stun for 1 turn instead of normal effects
                applyEffect(target, EffectType.STUN, { duration: 1, value: 0, sourceId: hero.instanceId })
                addLog(`${target.template.name} is stunned by the piercing noise!`)
                emitCombatEffect(target.id, 'enemy', 'debuff', 0)
              } else {
                // No debuffs - apply normal effects
                for (const effect of skill.effects) {
                  if (effect.target === 'enemy' && shouldApplyEffect(effect, hero)) {
                    const effectDuration = resolveEffectDuration(effect, hero)
                    const effectValue = resolveEffectValue(effect, hero, effectiveAtk, shardBonus)
                    applyEffect(target, effect.type, { duration: effectDuration, value: effectValue, sourceId: hero.instanceId })
                    emitCombatEffect(target.id, 'enemy', 'debuff', 0)
                  }
                }
              }
            } else {
              for (const effect of skill.effects) {
                if (effect.target === 'enemy' && shouldApplyEffect(effect, hero)) {
                  // Handle effect chance (e.g., 50% chance to stun)
                  if (effect.chance !== undefined) {
                    const roll = Math.random() * 100
                    if (roll >= effect.chance) {
                      // Effect didn't proc
                      continue
                    }
                  }
                  const effectDuration = resolveEffectDuration(effect, hero)
                  const effectValue = resolveEffectValue(effect, hero, effectiveAtk, shardBonus)
                  applyEffect(target, effect.type, { duration: effectDuration, value: effectValue, sourceId: hero.instanceId })
                  emitCombatEffect(target.id, 'enemy', 'debuff', 0)
                }
              }
            }
          }

          // Apply self-buff effects from enemy-targeting skills (e.g., Fennick's Counter-shot thorns)
          if (skill.effects) {
            for (const effect of skill.effects) {
              if (effect.target === 'self' && shouldApplyEffect(effect, hero)) {
                const effectDuration = resolveEffectDuration(effect, hero)
                const effectValue = resolveEffectValue(effect, hero, effectiveAtk, shardBonus)
                applyEffect(hero, effect.type, { duration: effectDuration, value: effectValue, sourceId: hero.instanceId })
                emitCombatEffect(hero.instanceId, 'hero', 'buff', 0)
              }
            }
          }

          // Handle conditionalEffects with Heartbreak threshold (Bitter Embrace)
          if (skill.conditionalEffects && skill.conditionalEffects.heartbreakThreshold && !targetEvaded) {
            const threshold = skill.conditionalEffects.heartbreakThreshold
            const currentStacks = hasHeartbreakPassive(hero) ? (hero.heartbreakStacks || 0) : 0
            if (currentStacks >= threshold && target.currentHp > 0) {
              for (const effect of skill.conditionalEffects.effects || []) {
                if (effect.target === 'enemy') {
                  const effectDuration = resolveEffectDuration(effect, hero)
                  const effectValue = resolveEffectValue(effect, hero, effectiveAtk, shardBonus)
                  applyEffect(target, effect.type, { duration: effectDuration, value: effectValue, sourceId: hero.instanceId })
                  emitCombatEffect(target.id, 'enemy', 'debuff', 0)
                  addLog(`${target.template.name} is ${effect.displayName || 'affected'}!`)
                }
              }
            }
          }

          // Process array-style conditionalEffects (e.g., target_has_debuff condition)
          if (skill.conditionalEffects && Array.isArray(skill.conditionalEffects) && !targetEvaded && target.currentHp > 0) {
            for (const condEffect of skill.conditionalEffects) {
              if (condEffect.condition === 'target_has_debuff') {
                const targetHasDebuff = (target.statusEffects || []).some(e => {
                  const def = e.definition || getEffectDefinition(e.type)
                  return def && !def.isBuff
                })
                if (targetHasDebuff) {
                  applyEffect(target, condEffect.type, {
                    duration: condEffect.duration,
                    value: condEffect.value,
                    sourceId: hero.instanceId
                  })
                  emitCombatEffect(target.id, 'enemy', 'debuff', 0)
                }
              }
            }
          }

          // Handle spreadBurn skill
          if (skill.spreadBurn && target.currentHp > 0) {
            const spreadCount = spreadBurnFromTarget(target, aliveEnemies.value, hero.instanceId)
            if (spreadCount > 0) {
              addLog(`Flames spread to ${spreadCount} other enemies!`)
            }
          }

          if (target.currentHp <= 0) {
            addLog(`${target.template.name} defeated!`)
            processRageOnKill(hero)

            // Grant Heartbreak stacks on kill
            if (skill.onKillGrantHeartbreakStacks && hasHeartbreakPassive(hero)) {
              gainHeartbreakStack(hero, skill.onKillGrantHeartbreakStacks)
            }
          }

          // Grant Heartbreak stacks when skill is used (regardless of kill)
          if (skill.grantHeartbreakStacks && hasHeartbreakPassive(hero)) {
            gainHeartbreakStack(hero, skill.grantHeartbreakStacks)
          }

          // Apply self-damage after skill use (Love's Final Thorn)
          if (skill.selfDamagePercentMaxHp && hero.currentHp > 0) {
            const selfDamage = Math.floor(hero.maxHp * skill.selfDamagePercentMaxHp / 100)
            hero.currentHp = Math.max(1, hero.currentHp - selfDamage)
            addLog(`${hero.template.name} takes ${selfDamage} self-damage!`)
            emitCombatEffect(hero.instanceId, 'hero', 'damage', selfDamage)
          }

          // Apply Volatility self-damage for Alchemists at Volatile tier
          if (skill.usesVolatility && isAlchemist(hero) && hero.currentHp > 0) {
            const volatilitySelfDmg = getVolatilitySelfDamage(hero)
            if (volatilitySelfDmg > 0) {
              hero.currentHp = Math.max(1, hero.currentHp - volatilitySelfDmg)
              addLog(`${hero.template.name} takes ${volatilitySelfDmg} Volatility damage!`)
              emitCombatEffect(hero.instanceId, 'hero', 'damage', volatilitySelfDmg)
            }
          }

          // Handle chain bounce damage (e.g., Chain Lightning)
          if (skill.chainBounce && !skill.noDamage) {
            const { maxBounces, bounceMultiplier } = skill.chainBounce
            const bounceTargets = getChainTargets(target, enemies.value, maxBounces)

            if (bounceTargets.length > 0) {
              const bouncePercent = bounceMultiplier / 100
              for (const bounceTarget of bounceTargets) {
                if (bounceTarget.currentHp <= 0) continue
                const bounceDef = getEffectiveStat(bounceTarget, 'def')
                const bounceDamage = calculateDamage(effectiveAtk, bouncePercent, bounceDef)
                applyDamage(bounceTarget, bounceDamage, 'attack', hero)
                emitCombatEffect(bounceTarget.id, 'enemy', 'damage', bounceDamage)
                addLog(`Lightning chains to ${bounceTarget.template.name} for ${bounceDamage} damage!`)

                if (bounceTarget.currentHp <= 0) {
                  addLog(`${bounceTarget.template.name} defeated!`)
                }
              }
            }
          }

          // Check for thorns effect on the enemy (only if we dealt damage)
          if (!skill.noDamage) {
            const thornsEffect = target.statusEffects?.find(e => e.type === EffectType.THORNS)
            if (thornsEffect && target.currentHp > 0) {
              const enemyAtk = getEffectiveStat(target, 'atk')
              const thornsDamage = Math.max(1, Math.floor(enemyAtk * (thornsEffect.value || 40) / 100))
              applyDamage(hero, thornsDamage, 'thorns')
              addLog(`${hero.template.name} takes ${thornsDamage} thorns damage!`)
              emitCombatEffect(hero.instanceId, 'hero', 'damage', thornsDamage)
              if (hero.currentHp <= 0) {
                addLog(`${hero.template.name} has fallen!`)
              }
            }
          }
          break
        }

        case 'ally': {
          const target = heroes.value.find(h => h.instanceId === selectedTarget.value?.id)
          if (!target || target.currentHp <= 0) {
            addLog('Invalid target')
            // Refund resource: Focus for rangers, Rage for berserkers, Essence for alchemists, MP for others
            if (isRanger(hero)) {
              grantFocus(hero)
            } else if (isBerserker(hero)) {
              // Don't refund 'all' cost skills (rage wasn't deducted yet)
              if (typeof skill.rageCost === 'number') {
                hero.currentRage += skill.rageCost
              }
            } else if (isAlchemist(hero)) {
              hero.currentEssence += skill.essenceCost ?? 0
            } else {
              hero.currentMp += skill.mpCost
            }
            state.value = BattleState.PLAYER_TURN
            return
          }

          // Heal unless skill is effect-only
          if (!skill.noDamage) {
            let healAmount
            if (skill.desperationHealBonus) {
              const missingHpPercent = 1 - (target.currentHp / target.maxHp)
              healAmount = calculateDesperationHeal(effectiveAtk, skill.healPercent || 0, skill.desperationHealBonus, missingHpPercent, shardBonus)
            } else {
              healAmount = calculateHeal(effectiveAtk, skill.description, shardBonus)
            }
            // Apply heal amp from equipment
            const healAmp = getHealAmp(hero.templateId)
            if (healAmp > 0) {
              healAmount = Math.floor(healAmount * (1 + healAmp / 100))
            }
            // Apply DISCORDANT_RESONANCE healing penalty (Cacophon's leader skill)
            healAmount = Math.floor(healAmount * getDiscordantHealingPenalty(target))

            const oldHp = target.currentHp
            target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount)
            const actualHeal = target.currentHp - oldHp
            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}, healing for ${actualHeal} HP!`)
            if (actualHeal > 0) {
              emitCombatEffect(target.instanceId, 'hero', 'heal', actualHeal)
              // Rangers gain focus when healed by ally
              if (isRanger(target)) {
                grantFocus(target)
              }
            }
          } else {
            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}!`)
          }

          // Apply ally HP cost (for Cacophon's skills)
          if (skill.allyHpCostPercent) {
            processAllyHpCostForSkill(hero, skill, [target])
          }

          // Cleanse stat debuffs only (not DoT or control effects)
          if (skill.cleanse === 'debuffs') {
            const isStatDebuff = (e) => !e.definition?.isBuff && e.definition?.stat && !e.definition?.isDot && !e.definition?.isControl
            const removedEffects = target.statusEffects?.filter(isStatDebuff) || []
            if (removedEffects.length > 0) {
              target.statusEffects = target.statusEffects.filter(e => !isStatDebuff(e))
              for (const effect of removedEffects) {
                addLog(`${target.template.name}'s ${effect.definition.name} was cleansed!`)
              }
              emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
              // Rangers gain focus when cleansed
              if (isRanger(target)) {
                grantFocus(target)
              }
            } else {
              addLog(`${target.template.name} has no stat debuffs to cleanse.`)
            }
          }

          // Cleanse DoT effects only (poison, burn, bleed)
          if (skill.cleanse === 'dots') {
            const isDot = (e) => e.definition?.isDot
            const removedEffects = target.statusEffects?.filter(isDot) || []
            if (removedEffects.length > 0) {
              target.statusEffects = target.statusEffects.filter(e => !isDot(e))
              for (const effect of removedEffects) {
                addLog(`${target.template.name}'s ${effect.definition.name} was cured!`)
              }
              emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
              // Rangers gain focus when cured
              if (isRanger(target)) {
                grantFocus(target)
              }
            } else {
              addLog(`${target.template.name} has no ailments to cure.`)
            }
          }

          // Selective cleanse: { types: ['atk', 'def'], at100Types: ['atk', 'def', 'spd'] }
          if (skill.cleanse && typeof skill.cleanse === 'object' && skill.cleanse.types) {
            const valorTier = getValorTier(hero)
            const cleansableStats = valorTier >= 100 && skill.cleanse.at100Types
              ? skill.cleanse.at100Types
              : skill.cleanse.types

            const isTargetedDebuff = (e) => {
              if (e.definition?.isBuff) return false
              if (!e.definition?.stat) return false
              // Check if this debuff's stat is in our cleansable list
              return cleansableStats.includes(e.definition.stat)
            }

            const removedEffects = target.statusEffects?.filter(isTargetedDebuff) || []
            if (removedEffects.length > 0) {
              target.statusEffects = target.statusEffects.filter(e => !isTargetedDebuff(e))
              for (const effect of removedEffects) {
                addLog(`${target.template.name}'s ${effect.definition.name} was cleansed!`)
              }
              emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
              if (isRanger(target)) {
                grantFocus(target)
              }
            } else {
              addLog(`${target.template.name} has no debuffs to cleanse.`)
            }
          }

          // Heal from stat (e.g., heal based on caster's DEF)
          if (skill.healFromStat) {
            const { stat, percent } = skill.healFromStat
            const valorTier = getValorTier(hero)
            const healPercent = resolveValorScaling(percent, valorTier) + shardBonus
            const statValue = getEffectiveStat(hero, stat)
            const healAmount = Math.floor(statValue * healPercent / 100)

            if (healAmount > 0) {
              const oldHp = target.currentHp
              target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount)
              const actualHeal = target.currentHp - oldHp
              if (actualHeal > 0) {
                addLog(`${target.template.name} is healed for ${actualHeal} HP!`)
                emitCombatEffect(target.instanceId, 'hero', 'heal', actualHeal)
                if (isRanger(target)) {
                  grantFocus(target)
                }
              }
            }
          }

          // MP restore
          if (skill.mpRestore) {
            const oldMp = target.currentMp
            target.currentMp = Math.min(target.maxMp, target.currentMp + skill.mpRestore)
            const actualRestore = target.currentMp - oldMp
            if (actualRestore > 0) {
              addLog(`${target.template.name} recovers ${actualRestore} MP!`)
            }
          }

          // Resource restore (Chroma's Resonance - restores appropriate resource based on class)
          if (skill.resourceRestore) {
            const amount = skill.resourceRestore
            if (isBerserker(target)) {
              const oldRage = target.currentRage || 0
              target.currentRage = Math.min(100, oldRage + amount)
              const actual = target.currentRage - oldRage
              if (actual > 0) {
                addLog(`${target.template.name} gains ${actual} Rage!`)
                emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
              }
            } else if (isRanger(target)) {
              if (!target.hasFocus) {
                grantFocus(target)
                addLog(`${target.template.name} regains Focus!`)
                emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
              }
            } else if (isKnight(target)) {
              const oldValor = target.currentValor || 0
              target.currentValor = Math.min(100, oldValor + amount)
              const actual = target.currentValor - oldValor
              if (actual > 0) {
                addLog(`${target.template.name} gains ${actual} Valor!`)
                emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
              }
            } else if (!isBard(target)) {
              // MP-based classes (Mage, Cleric, Paladin, Druid, Alchemist)
              const oldMp = target.currentMp || 0
              const maxMp = target.maxMp || 100
              target.currentMp = Math.min(maxMp, oldMp + amount)
              const actual = target.currentMp - oldMp
              if (actual > 0) {
                addLog(`${target.template.name} recovers ${actual} MP!`)
                emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
              }
            }
            // Bards use Verse which is capped at 3 and builds via skill use, so we skip them
          }

          // Grant focus to rangers
          if (skill.grantsFocus && isRanger(target)) {
            grantFocus(target)
            addLog(`${target.template.name} regains Focus!`)
          }

          // Apply skill effects (buffs)
          if (skill.effects) {
            for (const effect of skill.effects) {
              if (effect.target === 'ally' && shouldApplyEffect(effect, hero)) {
                const effectDuration = resolveEffectDuration(effect, hero)
                const effectValue = resolveEffectValue(effect, hero, effectiveAtk, shardBonus)
                const effectOptions = {
                  duration: effectDuration,
                  value: effectValue,
                  sourceId: hero.instanceId,
                  fromAllySkill: true
                }
                // Pass through additional properties for specific effect types
                if (effect.onEvade) effectOptions.onEvade = effect.onEvade
                // GUARDIAN_LINK specific properties
                if (effect.type === EffectType.GUARDIAN_LINK) {
                  // Resolve Valor-scaled redirectPercent
                  const valorTier = getValorTier(hero)
                  effectOptions.redirectPercent = typeof effect.redirectPercent === 'object'
                    ? resolveValorScaling(effect.redirectPercent, valorTier)
                    : effect.redirectPercent
                  if (effect.valorOnRedirect) effectOptions.valorOnRedirect = effect.valorOnRedirect
                }
                // SHIELD specific properties - calculate shieldHp from shieldPercentMaxHp
                if (effect.type === EffectType.SHIELD && effect.shieldPercentMaxHp) {
                  effectOptions.shieldHp = calculateShieldFromPercentMaxHp(target, effect)
                }
                applyEffect(target, effect.type, effectOptions)
                emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
              }
            }
          }

          // Buff per debuff on target (e.g., Despair - gain ATK buff per debuff on ally)
          if (skill.buffPerDebuff) {
            const debuffCount = target.statusEffects?.filter(e => !e.definition?.isBuff).length || 0
            if (debuffCount > 0) {
              const buff = skill.buffPerDebuff
              // Apply shard bonus to each debuff's contribution
              const buffValue = (buff.valuePerDebuff + shardBonus) * debuffCount
              applyEffect(hero, buff.type, { duration: buff.duration, value: buffValue, sourceId: hero.instanceId, fromAllySkill: true })
              emitCombatEffect(hero.instanceId, 'hero', 'buff', 0)
              addLog(`${hero.template.name} gains ${buffValue}% ATK from ${debuffCount} debuff(s)!`)
            } else {
              addLog(`${target.template.name} has no debuffs.`)
            }
          }

          // Damage redirect (e.g., Guardian's Sacrifice)
          if (skill.redirect) {
            const redirectDuration = resolveEffectDuration(skill.redirect, hero)
            // Mark the target as being guarded by the caster
            target.guardedBy = {
              guardianId: hero.instanceId,
              percent: skill.redirect.percent,
              duration: redirectDuration
            }
            // Apply GUARDING effect to the guardian (caster) for visual feedback
            applyEffect(hero, EffectType.GUARDING, { duration: redirectDuration, value: skill.redirect.percent, sourceId: hero.instanceId, fromAllySkill: true })
            addLog(`${hero.template.name} is now protecting ${target.template.name}!`)
            emitCombatEffect(hero.instanceId, 'hero', 'buff', 0)
            emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
          }

          // Extend buff durations (e.g., Encore)
          if (skill.extendBuffs) {
            const buffsExtended = target.statusEffects?.filter(e => e.definition?.isBuff) || []
            if (buffsExtended.length > 0) {
              for (const buff of buffsExtended) {
                buff.duration += skill.extendBuffs
              }
              addLog(`${target.template.name}'s buffs extended by ${skill.extendBuffs} turns!`)
              emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
            }
          }

          // Grant MP to target (e.g., Encore)
          if (skill.grantMp) {
            const oldMp = target.currentMp || 0
            target.currentMp = Math.min(target.maxMp || 100, oldMp + skill.grantMp)
            const actualGrant = target.currentMp - oldMp
            if (actualGrant > 0) {
              addLog(`${target.template.name} gains ${actualGrant} MP!`)
            }
          }

          // Grant Rage to target (e.g., Encore - for Berserkers)
          if (skill.grantRage && isBerserker(target)) {
            const oldRage = target.currentRage || 0
            gainRage(target, skill.grantRage)
            const actualGrant = target.currentRage - oldRage
            if (actualGrant > 0) {
              addLog(`${target.template.name} gains ${actualGrant} Rage!`)
              emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
            }
          }

          // Grant Valor to target (e.g., Encore - for Knights)
          if (skill.grantValor && isKnight(target)) {
            const oldValor = target.currentValor || 0
            gainValor(target, skill.grantValor)
            const actualGrant = target.currentValor - oldValor
            if (actualGrant > 0) {
              addLog(`${target.template.name} gains ${actualGrant} Valor!`)
              emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
            }
          }
          break
        }

        case 'dead_ally': {
          const target = heroes.value.find(h => h.instanceId === selectedTarget.value?.id)
          if (!target || target.currentHp > 0) {
            addLog('Invalid target - must target a fallen ally')
            // Refund resource
            if (isAlchemist(hero)) {
              hero.currentEssence += skill.essenceCost ?? 0
            } else {
              hero.currentMp += skill.mpCost
            }
            state.value = BattleState.PLAYER_TURN
            return
          }

          addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}!`)

          // Revive the target
          if (skill.revive) {
            reviveUnit(target, skill.revive.hpPercent)
          }

          // Apply post-revive effects (like untargetable)
          if (skill.effects) {
            for (const effect of skill.effects) {
              if (effect.target === 'ally') {
                applyEffect(target, effect.type, {
                  duration: effect.duration,
                  value: effect.value || 0,
                  sourceId: hero.instanceId,
                  fromAllySkill: true
                })
                emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
              }
            }
          }
          break
        }

        case 'self': {
          addLog(`${hero.template.name} uses ${skill.name}!`)
          if (skill.effects) {
            for (const effect of skill.effects) {
              if (effect.target === 'self' && shouldApplyEffect(effect, hero)) {
                const effectDuration = resolveEffectDuration(effect, hero)
                const effectValue = resolveEffectValue(effect, hero, effectiveAtk, shardBonus)
                applyEffect(hero, effect.type, { duration: effectDuration, value: effectValue, sourceId: hero.instanceId, fromAllySkill: false })
                emitCombatEffect(hero.instanceId, 'hero', 'buff', 0)
              }
            }
          }
          // Conditional self buff (e.g., Salia's "But Not Out" - stronger buff when HP is low)
          if (skill.conditionalSelfBuff) {
            const { default: defaultBuff, conditional } = skill.conditionalSelfBuff
            const buff = evaluateCondition(conditional.condition, hero)
              ? conditional.effect
              : defaultBuff

            applyEffect(hero, buff.type, {
              duration: buff.duration,
              value: buff.value,
              sourceId: hero.instanceId,
              fromAllySkill: false
            })
            emitCombatEffect(hero.instanceId, 'hero', 'buff', 0)

            addLog(`${hero.template.name} gains ${buff.value}% ATK for ${buff.duration} turns!`)
          }
          // Self heal (percentage of max HP)
          if (skill.selfHealPercent) {
            const effectiveHealPercent = skill.selfHealPercent + shardBonus
            const healAmount = Math.floor(hero.maxHp * effectiveHealPercent / 100)
            const oldHp = hero.currentHp
            hero.currentHp = Math.min(hero.maxHp, hero.currentHp + healAmount)
            const actualHeal = hero.currentHp - oldHp
            if (actualHeal > 0) {
              addLog(`${hero.template.name} heals for ${actualHeal} HP!`)
              emitCombatEffect(hero.instanceId, 'hero', 'heal', actualHeal)
            }
          }
          // MP restore
          if (skill.mpRestore) {
            const oldMp = hero.currentMp
            hero.currentMp = Math.min(hero.maxMp, hero.currentMp + skill.mpRestore)
            const actualRestore = hero.currentMp - oldMp
            if (actualRestore > 0) {
              addLog(`${hero.template.name} recovers ${actualRestore} MP!`)
            }
          }
          // Consume debuffs (Shadow King's Consume Shadow)
          if (skill.consumeDebuffs) {
            const debuffs = (hero.statusEffects || []).filter(e => e.definition && !e.definition.isBuff)
            const debuffCount = debuffs.length
            if (debuffCount > 0) {
              // Remove all debuffs
              hero.statusEffects = (hero.statusEffects || []).filter(e => !e.definition || e.definition.isBuff)
              addLog(`${hero.template.name} consumes ${debuffCount} debuff${debuffCount > 1 ? 's' : ''}!`)

              // Gain rage per debuff
              const totalRage = debuffCount * skill.consumeDebuffs.ragePerDebuff
              gainRage(hero, totalRage)
              addLog(`${hero.template.name} gains ${totalRage} Rage!`)

              // Deal damage per debuff to random enemies
              const dmgPercent = skill.consumeDebuffs.damagePercentPerDebuff
              const damagePerHit = Math.floor(effectiveAtk * dmgPercent / 100)
              for (let i = 0; i < debuffCount; i++) {
                const target = selectRandomTarget(aliveEnemies.value)
                if (!target) break
                applyDamage(target, damagePerHit, 'skill', hero)
                addLog(`${hero.template.name} deals ${damagePerHit} shadow damage to ${target.template?.name || target.name}!`)
                emitCombatEffect(target.id, 'enemy', 'damage', damagePerHit)
              }
            } else {
              addLog(`${hero.template.name} has no debuffs to consume.`)
            }
          }
          break
        }

        case 'random_enemies': {
          const multiplier = parseSkillMultiplier(skill.description, shardBonus)
          const numHits = skill.multiHit || 1
          let totalDamage = 0
          let killedAny = false

          addLog(`${hero.template.name} uses ${skill.name}!`)

          for (let i = 0; i < numHits; i++) {
            const target = selectRandomTarget(aliveEnemies.value, skill.prioritizeMarked)
            if (!target) break

            const effectiveDef = getEffectiveStat(target, 'def')
            const defReduction = skill.ignoreDef ? (skill.ignoreDef / 100) : 0
            const reducedDef = effectiveDef * (1 - defReduction)
            const markedMultiplier = getMarkedDamageMultiplier(target)
            let damage = calculateDamageWithMarked(effectiveAtk, multiplier, reducedDef, markedMultiplier)
            // Apply crit and spell amp
            damage = Math.floor(damage * critResult.multiplier * (1 + spellAmp / 100))

            applyDamage(target, damage, 'attack', hero)
            totalDamage += damage
            emitCombatEffect(target.id, 'enemy', 'damage', damage)

            if (target.currentHp <= 0) {
              addLog(`${target.template.name} defeated!`)
              killedAny = true
            }
          }

          // Process focus_on_crit for rangers
          if (critResult.isCrit) {
            processFocusOnCrit(hero, true)
          }

          // Process rage_on_kill if any enemy was killed
          if (killedAny) {
            processRageOnKill(hero)
          }

          addLog(`${hero.template.name} deals ${totalDamage} total damage!`)
          break
        }

        case 'all_enemies': {
          // Handle consumeBurns skill (Conflagration)
          if (skill.consumeBurns) {
            const atkBonus = skill.consumeBurnAtkBonus || 0
            const { totalDamage, burnsConsumed } = consumeAllBurns(aliveEnemies.value, effectiveAtk, atkBonus)

            if (burnsConsumed > 0) {
              // Distribute damage to all alive enemies
              const damagePerEnemy = Math.floor(totalDamage / aliveEnemies.value.length)
              for (const enemy of aliveEnemies.value) {
                applyDamage(enemy, damagePerEnemy, 'attack', hero)
                emitCombatEffect(enemy.id, 'enemy', 'damage', damagePerEnemy)
                if (enemy.currentHp <= 0) {
                  addLog(`${enemy.template.name} defeated!`)
                }
              }
              addLog(`${hero.template.name} detonates ${burnsConsumed} burns for ${totalDamage} total damage!`)
            } else {
              addLog(`${hero.template.name} uses ${skill.name}, but no enemies are burning!`)
            }
            break
          }

          // Filter targets based on targetFilter
          let targets = aliveEnemies.value
          if (skill.targetFilter === 'not_acted') {
            // Get enemies that haven't acted yet this round (appear after current turn in turn order)
            const notActedEnemyIds = new Set()
            for (let i = currentTurnIndex.value + 1; i < turnOrder.value.length; i++) {
              const turn = turnOrder.value[i]
              if (turn.type === 'enemy') {
                notActedEnemyIds.add(turn.id)
              }
            }
            targets = aliveEnemies.value.filter(e => notActedEnemyIds.has(e.id))
            if (targets.length === 0) {
              addLog(`${hero.template.name} uses ${skill.name}, but all enemies have already acted!`)
              break
            }
          }

          // Handle Heartbreak stack mechanics for AoE damage calculation
          let heartbreakStacksConsumedAoe = 0
          let heartbreakBonusDamagePercentAoe = 0

          // If skill consumes all Heartbreak stacks, do it now and calculate bonus
          if (skill.consumeAllHeartbreakStacks && hasHeartbreakPassive(hero)) {
            heartbreakStacksConsumedAoe = consumeAllHeartbreakStacks(hero)
            if (skill.damagePerHeartbreakStackConsumed) {
              heartbreakBonusDamagePercentAoe = heartbreakStacksConsumedAoe * skill.damagePerHeartbreakStackConsumed
            }
          }

          // If skill has damagePerHeartbreakStack, add bonus per current stack (without consuming)
          if (skill.damagePerHeartbreakStack && hasHeartbreakPassive(hero)) {
            const currentStacks = hero.heartbreakStacks || 0
            heartbreakBonusDamagePercentAoe += currentStacks * skill.damagePerHeartbreakStack
          }

          // Use Valor-scaled damage, damagePercent, or parse from description (with shard and Heartbreak bonus)
          let multiplier = 0
          if (!skill.noDamage) {
            const scaledDamage = getSkillDamage(skill, hero)
            if (scaledDamage !== null) {
              multiplier = (scaledDamage + shardBonus + heartbreakBonusDamagePercentAoe) / 100
            } else if (skill.damagePercent !== undefined) {
              const volatilityBonusAoe = (skill.usesVolatility && isAlchemist(hero)) ? getVolatilityDamageBonus(hero) : 0
              multiplier = (skill.damagePercent + shardBonus + heartbreakBonusDamagePercentAoe + volatilityBonusAoe) / 100
            } else {
              const baseMultiplier = parseSkillMultiplier(skill.description, shardBonus)
              multiplier = baseMultiplier + heartbreakBonusDamagePercentAoe / 100
            }
          }
          let totalDamage = 0
          let totalThornsDamage = 0
          let killedAny = false
          for (const target of targets) {
            let damage = 0
            const aoeResult = {}

            if (!skill.noDamage) {
              const effectiveDef = getEffectiveStat(target, 'def')
              const markedMultiplier = getMarkedDamageMultiplier(target)
              damage = calculateDamageWithMarked(effectiveAtk, multiplier, effectiveDef, markedMultiplier)
              // Apply crit and spell amp
              damage = Math.floor(damage * critResult.multiplier * (1 + spellAmp / 100))
              applyDamage(target, damage, 'attack', hero, aoeResult)
              totalDamage += damage
              emitCombatEffect(target.id, 'enemy', 'damage', damage)
            }

            if (skill.effects && !aoeResult.evaded) {
              for (const effect of skill.effects) {
                if ((effect.target === 'enemy' || effect.target === 'all_enemies') && shouldApplyEffect(effect, hero)) {
                  const effectDuration = resolveEffectDuration(effect, hero)
                  const effectValue = resolveEffectValue(effect, hero, effectiveAtk, shardBonus)
                  applyEffect(target, effect.type, { duration: effectDuration, value: effectValue, sourceId: hero.instanceId })
                  emitCombatEffect(target.id, 'enemy', 'debuff', 0)
                }
              }
            }

            // Process conditionalEffects (e.g., Swift Arrow's Pinning Volley: apply DEF_DOWN if target has a debuff)
            if (skill.conditionalEffects && Array.isArray(skill.conditionalEffects) && !aoeResult.evaded && target.currentHp > 0) {
              for (const condEffect of skill.conditionalEffects) {
                if (condEffect.condition === 'target_has_debuff') {
                  const targetHasDebuff = (target.statusEffects || []).some(e => {
                    const def = e.definition || getEffectDefinition(e.type)
                    return def && !def.isBuff
                  })
                  if (targetHasDebuff) {
                    applyEffect(target, condEffect.type, {
                      duration: condEffect.duration,
                      value: condEffect.value,
                      sourceId: hero.instanceId
                    })
                    emitCombatEffect(target.id, 'enemy', 'debuff', 0)
                  }
                }
              }
            }

            if (target.currentHp <= 0) {
              addLog(`${target.template.name} defeated!`)
              killedAny = true
            }

            // Check for thorns effect on the enemy
            const thornsEffect = target.statusEffects?.find(e => e.type === EffectType.THORNS)
            if (thornsEffect && target.currentHp > 0) {
              const enemyAtk = getEffectiveStat(target, 'atk')
              const thornsDamage = Math.max(1, Math.floor(enemyAtk * (thornsEffect.value || 40) / 100))
              totalThornsDamage += thornsDamage
            }
          }

          // Process focus_on_crit for rangers
          if (critResult.isCrit) {
            processFocusOnCrit(hero, true)
          }

          // Process rage_on_kill if any enemy was killed
          if (killedAny) {
            processRageOnKill(hero)

            // Grant Heartbreak stacks on kill (AoE)
            if (skill.onKillGrantHeartbreakStacks && hasHeartbreakPassive(hero)) {
              gainHeartbreakStack(hero, skill.onKillGrantHeartbreakStacks)
            }
          }

          // Grant Heartbreak stacks when skill is used (regardless of kill, for AoE)
          if (skill.grantHeartbreakStacks && hasHeartbreakPassive(hero)) {
            gainHeartbreakStack(hero, skill.grantHeartbreakStacks)
          }

          // Handle healSelfPercent (lifesteal) for AoE - heals based on total damage dealt
          let totalLifestealPercentAoe = skill.healSelfPercent || 0

          // Add Heartbreak lifesteal bonus if skill uses it
          if (skill.usesHeartbreakLifesteal && hasHeartbreakPassive(hero)) {
            const { lifestealBonus } = getHeartbreakBonuses(hero)
            totalLifestealPercentAoe += lifestealBonus
          }

          // Also add leader bonus lifesteal if present
          if (hero.leaderBonuses?.lifesteal) {
            totalLifestealPercentAoe += hero.leaderBonuses.lifesteal
          }

          if (totalLifestealPercentAoe > 0 && totalDamage > 0) {
            const healAmount = calculateHealSelfPercent(totalDamage, totalLifestealPercentAoe)
            if (healAmount > 0) {
              const maxHp = hero.stats?.hp || hero.maxHp
              const oldHp = hero.currentHp
              hero.currentHp = Math.min(maxHp, hero.currentHp + healAmount)
              const actualHeal = hero.currentHp - oldHp
              if (actualHeal > 0) {
                addLog(`${hero.template.name} heals for ${actualHeal}!`)
                emitCombatEffect(hero.instanceId, 'hero', 'heal', actualHeal)
              }
            }
          }

          // Apply accumulated thorns damage
          if (totalThornsDamage > 0) {
            applyDamage(hero, totalThornsDamage, 'thorns')
            addLog(`${hero.template.name} takes ${totalThornsDamage} thorns damage!`)
            emitCombatEffect(hero.instanceId, 'hero', 'damage', totalThornsDamage)
            if (hero.currentHp <= 0) {
              addLog(`${hero.template.name} has fallen!`)
            }
          }
          addLog(`${hero.template.name} uses ${skill.name}, dealing ${totalDamage} total damage!`)

          // Apply self-damage after AoE skill use (e.g., Tainted Feast)
          if (skill.selfDamagePercentMaxHp && hero.currentHp > 0) {
            const selfDamage = Math.floor(hero.maxHp * skill.selfDamagePercentMaxHp / 100)
            hero.currentHp = Math.max(1, hero.currentHp - selfDamage)
            addLog(`${hero.template.name} takes ${selfDamage} self-damage!`)
            emitCombatEffect(hero.instanceId, 'hero', 'damage', selfDamage)
          }

          // Apply Volatility self-damage for Alchemists at Volatile tier (AoE skills)
          if (skill.usesVolatility && isAlchemist(hero) && hero.currentHp > 0) {
            const volatilitySelfDmg = getVolatilitySelfDamage(hero)
            if (volatilitySelfDmg > 0) {
              hero.currentHp = Math.max(1, hero.currentHp - volatilitySelfDmg)
              addLog(`${hero.template.name} takes ${volatilitySelfDmg} Volatility damage!`)
              emitCombatEffect(hero.instanceId, 'hero', 'damage', volatilitySelfDmg)
            }
          }
          break
        }

        case 'all_allies': {
          addLog(`${hero.template.name} uses ${skill.name} on all allies!`)

          // Apply ally HP cost (for Cacophon's Discordant Anthem)
          if (skill.allyHpCostPercent) {
            processAllyHpCostForSkill(hero, skill, aliveHeroes.value)
          }

          if (skill.healPercent || skill.description.toLowerCase().includes('heal')) {
            let healAmount
            if (skill.desperationHealBonus) {
              const missingHpPercent = calculatePartyMissingHpPercent(aliveHeroes.value)
              healAmount = calculateDesperationHeal(effectiveAtk, skill.healPercent || 0, skill.desperationHealBonus, missingHpPercent, shardBonus)
            } else {
              healAmount = calculateHeal(effectiveAtk, skill.description, shardBonus)
            }
            // Apply heal amp from equipment
            const healAmp = getHealAmp(hero.templateId)
            if (healAmp > 0) {
              healAmount = Math.floor(healAmount * (1 + healAmp / 100))
            }
            for (const target of aliveHeroes.value) {
              const oldHp = target.currentHp
              target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount)
              const actualHeal = target.currentHp - oldHp
              if (actualHeal > 0) {
                emitCombatEffect(target.instanceId, 'hero', 'heal', actualHeal)
                // Rangers gain focus when healed by ally
                if (isRanger(target)) {
                  grantFocus(target)
                }
              }
            }
          }
          // MP restore (flat or percentage)
          if (skill.mpRestore || skill.mpRestorePercent) {
            for (const target of aliveHeroes.value) {
              const oldMp = target.currentMp
              let restoreAmount = skill.mpRestore || 0
              if (skill.mpRestorePercent) {
                restoreAmount = Math.floor(target.maxMp * skill.mpRestorePercent / 100)
              }
              target.currentMp = Math.min(target.maxMp, target.currentMp + restoreAmount)
              const actualRestore = target.currentMp - oldMp
              if (actualRestore > 0) {
                addLog(`${target.template.name} recovers ${actualRestore} MP!`)
              }
            }
          }
          // Extend buff durations on all allies
          if (skill.extendBuffs) {
            for (const target of aliveHeroes.value) {
              const buffsExtended = target.statusEffects?.filter(e => e.definition?.isBuff) || []
              if (buffsExtended.length > 0) {
                for (const buff of buffsExtended) {
                  buff.duration += skill.extendBuffs
                }
                addLog(`${target.template.name}'s buffs extended by ${skill.extendBuffs} turns!`)
                emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
              }
            }
          }
          if (skill.effects) {
            for (const effect of skill.effects) {
              if ((effect.target === 'ally' || effect.target === 'all_allies') && shouldApplyEffect(effect, hero)) {
                const effectDuration = resolveEffectDuration(effect, hero)
                const effectValue = resolveEffectValue(effect, hero, effectiveAtk, shardBonus)
                for (const target of aliveHeroes.value) {
                  const effectOptions = {
                    duration: effectDuration,
                    value: effectValue,
                    sourceId: hero.instanceId,
                    fromAllySkill: true
                  }
                  // Pass caster ATK for death prevention heal
                  if (effect.type === EffectType.DEATH_PREVENTION) {
                    effectOptions.healOnTrigger = effect.healOnTrigger
                    effectOptions.casterAtk = effectiveAtk
                  }
                  applyEffect(target, effect.type, effectOptions)
                  emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
                }
              }
              // Handle effects that target all enemies (e.g., Beggar's Prayer debuff)
              if (effect.target === 'all_enemies' && shouldApplyEffect(effect, hero)) {
                const effectDuration = resolveEffectDuration(effect, hero)
                const effectValue = resolveEffectValue(effect, hero, effectiveAtk, shardBonus)
                for (const target of aliveEnemies.value) {
                  applyEffect(target, effect.type, { duration: effectDuration, value: effectValue, sourceId: hero.instanceId })
                  emitCombatEffect(target.id, 'enemy', 'debuff', 0)
                }
              }
            }
          }
          // Apply Well Fed effect (e.g., Second Helping)
          if (skill.wellFedEffect) {
            const { duration, atkPercent, threshold } = skill.wellFedEffect
            for (const target of aliveHeroes.value) {
              applyEffect(target, EffectType.WELL_FED, {
                duration,
                sourceId: hero.instanceId,
                fromAllySkill: true,
                casterAtk: effectiveAtk,
                atkPercent,
                threshold
              })
              emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
            }
          }
          // The Great Composting: Consume poison from enemies, grant regen to allies
          if (skill.consumesPoisonFromEnemies) {
            // Count and remove all POISON effects from all enemies
            let poisonStacksConsumed = 0
            for (const enemy of enemies.value) {
              const poisonEffects = enemy.statusEffects?.filter(e => e.type === EffectType.POISON) || []
              poisonStacksConsumed += poisonEffects.length
              // Remove all poison effects from this enemy
              if (enemy.statusEffects) {
                enemy.statusEffects = enemy.statusEffects.filter(e => e.type !== EffectType.POISON)
              }
            }
            if (poisonStacksConsumed > 0) {
              addLog(`Consumed ${poisonStacksConsumed} poison stack${poisonStacksConsumed > 1 ? 's' : ''} from enemies!`)
            }
            // Apply REGEN to all alive allies based on baseline + scaling
            if (skill.baselineRegen) {
              const baseAtkPercent = skill.baselineRegen.atkPercent || 5
              const scalingPerStack = 2 // +2% per poison stack consumed
              const totalAtkPercent = baseAtkPercent + (poisonStacksConsumed * scalingPerStack)
              const duration = skill.baselineRegen.duration || 2
              for (const target of aliveHeroes.value) {
                applyEffect(target, EffectType.REGEN, {
                  duration,
                  sourceId: hero.instanceId,
                  fromAllySkill: true,
                  atkPercent: totalAtkPercent,
                  casterAtk: effectiveAtk
                })
                emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
              }
              addLog(`All allies gain Regen (${totalAtkPercent}% ATK) for ${duration} turns!`)
            }
          }
          break
        }
      }
    }

    // Rangers regain focus if they didn't use a skill this turn
    if (isRanger(hero) && !usedSkill) {
      grantFocus(hero)
    }

    // Process end of turn effects
    processEndOfTurnEffects(hero)

    // Reset wasAttacked flag after the hero's turn ends
    hero.wasAttacked = false

    // Check for extra turn from skill (e.g., Quick Throw)
    if (skillUsed?.grantsExtraTurn && hero.currentHp > 0) {
      // Check victory/defeat before granting extra turn
      if (aliveEnemies.value.length === 0) {
        setTimeout(() => {
          state.value = BattleState.VICTORY
          addLog('Victory! All enemies defeated.')
        }, 600)
      } else if (aliveHeroes.value.length === 0) {
        setTimeout(() => {
          state.value = BattleState.DEFEAT
          addLog('Defeat! All heroes have fallen.')
        }, 600)
      } else {
        addLog(`${hero.template.name} gets an extra turn!`)
        setTimeout(() => {
          selectedAction.value = null
          selectedTarget.value = null
          state.value = BattleState.PLAYER_TURN
        }, 600)
      }
    } else {
      setTimeout(() => {
        advanceTurnIndex()
        startNextTurn()
      }, 600)
    }
  }

  function executeEnemyTurn(enemy) {
    if (enemy.currentHp <= 0) {
      advanceTurnIndex()
      startNextTurn()
      return
    }

    state.value = BattleState.ANIMATING

    let targets = aliveHeroes.value
    if (targets.length === 0) {
      advanceTurnIndex()
      startNextTurn()
      return
    }

    // Check for taunt - if any hero has taunt, they must be targeted
    const tauntingHeroes = targets.filter(h =>
      h.statusEffects?.some(e => e.definition?.isTaunt)
    )
    if (tauntingHeroes.length > 0) {
      targets = tauntingHeroes
    } else {
      // Filter out untargetable and stealthed heroes (only if no taunt)
      const targetableHeroes = targets.filter(h =>
        !h.statusEffects?.some(e => e.definition?.isUntargetable || e.definition?.isStealth)
      )
      // If all heroes are untargetable/stealthed, enemy can still attack (no valid targets edge case)
      if (targetableHeroes.length > 0) {
        targets = targetableHeroes
      }
    }

    const target = targets[Math.floor(Math.random() * targets.length)]

    // Get available skills (supports both 'skill' and 'skills')
    const allSkills = enemy.template.skills || (enemy.template.skill ? [enemy.template.skill] : [])
    const readySkills = allSkills.filter(s => {
      // Check cooldown
      if (enemy.currentCooldowns[s.name] !== 0) return false
      // Check HP-based use conditions
      if (s.useCondition === 'hp_below_50') {
        const hpPercent = (enemy.currentHp / enemy.maxHp) * 100
        if (hpPercent >= 50) return false
      }
      return true
    })
    const skill = readySkills.length > 0 ? readySkills[Math.floor(Math.random() * readySkills.length)] : null

    const effectiveAtk = getEffectiveStat(enemy, 'atk')
    const effectiveDef = getEffectiveStat(target, 'def')

    // Check if blinded enemy misses (only for damaging attacks)
    const willMiss = checkBlindMiss(enemy)
    if (willMiss && (!skill || !skill.noDamage)) {
      const enemyName = enemy.template?.name || 'Enemy'
      addLog(`${enemyName}'s attack misses due to Blind!`)
      emitCombatEffect(enemy.id, 'enemy', 'miss', 0)
      processEndOfTurnEffects(enemy)
      setTimeout(() => {
        advanceTurnIndex()
        startNextTurn()
      }, 600)
      return
    }

    if (skill) {
      // Handle summon skills before normal skill processing
      if (skill.summon) {
        const aliveCount = enemies.value.filter(e => e.currentHp > 0).length

        if (aliveCount < MAX_ENEMIES) {
          // Room on field — perform summon
          enemySkillActivation.value = { enemyId: enemy.id, skillName: skill.name }
          currentEffectSource = `${enemy.template?.name || enemy.name}'s ${skill.name}`

          const count = skill.summon.count || 1
          for (let i = 0; i < count; i++) {
            // Re-check cap each iteration
            if (enemies.value.filter(e => e.currentHp > 0).length >= MAX_ENEMIES) break
            summonEnemy(skill.summon.templateId)
          }

          // Apply skill effects (same target handling as noDamage skills)
          if (skill.effects) {
            for (const effect of skill.effects) {
              const effectValue = calculateEffectValue(effect, effectiveAtk)
              if (effect.target === 'self') {
                applyEffect(enemy, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
                emitCombatEffect(enemy.id, 'enemy', 'buff', 0)
              } else if (effect.target === 'enemy' || effect.target === 'hero') {
                applyEffect(target, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
                emitCombatEffect(target.instanceId, 'hero', 'debuff', 0)
              } else if (effect.target === 'all_allies') {
                for (const ally of enemies.value.filter(e => e.currentHp > 0)) {
                  if (effect.excludeSelf && ally.id === enemy.id) continue
                  applyEffect(ally, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
                  emitCombatEffect(ally.id, 'enemy', 'buff', 0)
                }
              }
            }
          }

          // Set cooldown
          enemy.currentCooldowns[skill.name] = skill.cooldown + 1

          processEndOfTurnEffects(enemy)
          setTimeout(() => {
            advanceTurnIndex()
            startNextTurn()
          }, 600)
          return
        } else if (skill.fallbackSkill) {
          // Field is full — use fallback skill
          enemySkillActivation.value = { enemyId: enemy.id, skillName: skill.fallbackSkill.name }
          currentEffectSource = `${enemy.template?.name || enemy.name}'s ${skill.fallbackSkill.name}`

          // Apply fallback skill effects (same target handling as noDamage skills)
          if (skill.fallbackSkill.effects) {
            for (const effect of skill.fallbackSkill.effects) {
              const effectValue = calculateEffectValue(effect, effectiveAtk)
              if (effect.target === 'self') {
                applyEffect(enemy, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
                emitCombatEffect(enemy.id, 'enemy', 'buff', 0)
              } else if (effect.target === 'enemy' || effect.target === 'hero') {
                applyEffect(target, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
                emitCombatEffect(target.instanceId, 'hero', 'debuff', 0)
              } else if (effect.target === 'all_allies') {
                for (const ally of enemies.value.filter(e => e.currentHp > 0)) {
                  if (effect.excludeSelf && ally.id === enemy.id) continue
                  applyEffect(ally, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
                  emitCombatEffect(ally.id, 'enemy', 'buff', 0)
                }
              }
            }
          }

          // Set cooldown on the ORIGINAL summon skill
          enemy.currentCooldowns[skill.name] = skill.cooldown + 1

          processEndOfTurnEffects(enemy)
          setTimeout(() => {
            advanceTurnIndex()
            startNextTurn()
          }, 600)
          return
        } else {
          // Field is full, no fallback — pass turn, put skill on cooldown
          addLog(`${enemy.template?.name || 'Enemy'} cannot summon — field is full.`)
          enemy.currentCooldowns[skill.name] = skill.cooldown + 1

          processEndOfTurnEffects(enemy)
          setTimeout(() => {
            advanceTurnIndex()
            startNextTurn()
          }, 600)
          return
        }
      }

      // Set effect source context for tooltip tracking
      currentEffectSource = `${enemy.template?.name || enemy.name}'s ${skill.name}`
      // Announce skill name for UI floating text
      enemySkillActivation.value = { enemyId: enemy.id, skillName: skill.name }

      // Check if skill targets heroes at all or is self/ally only
      const skillTargetType = skill.targetType || 'hero'
      const isAoeSkill = skillTargetType === 'all_heroes'

      // Handle AoE skills that target all heroes
      if (isAoeSkill) {
        const multiplier = skill.damagePercent ? skill.damagePercent / 100 : parseSkillMultiplier(skill.description)
        let totalDamage = 0
        for (const heroTarget of aliveHeroes.value) {
          const heroDef = getEffectiveStat(heroTarget, 'def')
          const damage = calculateDamage(effectiveAtk, multiplier, heroDef)
          const aoeHeroResult = {}
          const actualDamage = applyDamage(heroTarget, damage, 'attack', null, aoeHeroResult)
          totalDamage += actualDamage
          if (actualDamage > 0) {
            emitCombatEffect(heroTarget.instanceId, 'hero', 'damage', actualDamage)
          }

          // Apply debuffs to each hero if applicable (skip if this hero evaded)
          if (skill.effects && !aoeHeroResult.evaded) {
            for (const effect of skill.effects) {
              if (effect.target === 'enemy' || effect.target === 'hero') {
                const effectValue = calculateEffectValue(effect, effectiveAtk)
                applyEffect(heroTarget, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
                emitCombatEffect(heroTarget.instanceId, 'hero', 'debuff', 0)
              }
            }
          }

          if (heroTarget.currentHp <= 0) {
            addLog(`${heroTarget.template.name} has fallen!`)
          }
        }
        addLog(`${enemy.template.name} uses ${skill.name}, dealing ${totalDamage} total damage!`)

        // Apply self/ally buffs for AoE skills
        if (skill.effects) {
          for (const effect of skill.effects) {
            const effectValue = calculateEffectValue(effect, effectiveAtk)
            if (effect.target === 'self') {
              applyEffect(enemy, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
              emitCombatEffect(enemy.id, 'enemy', 'buff', 0)
            } else if (effect.target === 'all_allies') {
              for (const ally of enemies.value.filter(e => e.currentHp > 0)) {
                if (effect.excludeSelf && ally.id === enemy.id) continue
                applyEffect(ally, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
                emitCombatEffect(ally.id, 'enemy', 'buff', 0)
              }
            }
          }
        }
      } else if (skill.noDamage) {
        // Skills that don't deal damage (buffs, debuffs only)
        addLog(`${enemy.template.name} uses ${skill.name}!`)

        // Heal all alive allies for % of their max HP
        if (skill.healAllAllies) {
          for (const ally of enemies.value.filter(e => e.currentHp > 0)) {
            const healAmount = Math.floor(ally.maxHp * skill.healAllAllies / 100)
            const actualHeal = Math.min(healAmount, ally.maxHp - ally.currentHp)
            if (actualHeal > 0) {
              ally.currentHp += actualHeal
              emitCombatEffect(ally.id, 'enemy', 'heal', actualHeal)
            }
          }
          addLog(`${enemy.template.name} heals all allies for ${skill.healAllAllies}% of max HP!`)
        }

        // Apply skill effects
        if (skill.effects) {
          for (const effect of skill.effects) {
            const effectValue = calculateEffectValue(effect, effectiveAtk)
            if (effect.target === 'enemy' || effect.target === 'hero') {
              applyEffect(target, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
              emitCombatEffect(target.instanceId, 'hero', 'debuff', 0)
            } else if (effect.target === 'self') {
              applyEffect(enemy, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
              emitCombatEffect(enemy.id, 'enemy', 'buff', 0)
            } else if (effect.target === 'all_allies') {
              for (const ally of enemies.value.filter(e => e.currentHp > 0)) {
                if (effect.excludeSelf && ally.id === enemy.id) continue
                applyEffect(ally, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
                emitCombatEffect(ally.id, 'enemy', 'buff', 0)
              }
            }
          }
        }

        // noDamage skills don't attack heroes, so skip thorns check and end turn early
        enemy.currentCooldowns[skill.name] = skill.cooldown + 1
        processEndOfTurnEffects(enemy)
        setTimeout(() => {
          advanceTurnIndex()
          startNextTurn()
        }, 600)
        return
      } else {
        // Standard single-target damage skill
        const multiplier = parseSkillMultiplier(skill.description)
        const damage = calculateDamage(effectiveAtk, multiplier, effectiveDef)
        const enemyDmgResult = {}
        const actualDamage = applyDamage(target, damage, 'attack', null, enemyDmgResult)
        if (actualDamage > 0) {
          addLog(`${enemy.template.name} uses ${skill.name} on ${target.template.name} for ${actualDamage} damage!`)
          emitCombatEffect(target.instanceId, 'hero', 'damage', actualDamage)
        } else {
          addLog(`${enemy.template.name} uses ${skill.name} on ${target.template.name}!`)
        }

        // Remove buffs if skill has cleanse (skip if evaded)
        if (skill.cleanse === 'buffs' && !enemyDmgResult.evaded) {
          const removedEffects = target.statusEffects?.filter(e => e.definition?.isBuff) || []
          if (removedEffects.length > 0) {
            target.statusEffects = target.statusEffects.filter(e => !e.definition?.isBuff)
            for (const effect of removedEffects) {
              addLog(`${target.template.name}'s ${effect.definition.name} was removed!`)
            }
            emitCombatEffect(target.instanceId, 'hero', 'debuff', 0)
          }
        }

        // Apply skill effects (skip hero-targeted effects if evaded)
        if (skill.effects) {
          for (const effect of skill.effects) {
            const effectValue = calculateEffectValue(effect, effectiveAtk)
            if ((effect.target === 'enemy' || effect.target === 'hero') && !enemyDmgResult.evaded) {
              applyEffect(target, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
              emitCombatEffect(target.instanceId, 'hero', 'debuff', 0)
            } else if (effect.target === 'self') {
              applyEffect(enemy, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
              emitCombatEffect(enemy.id, 'enemy', 'buff', 0)
            } else if (effect.target === 'all_allies') {
              for (const ally of enemies.value.filter(e => e.currentHp > 0)) {
                if (effect.excludeSelf && ally.id === enemy.id) continue
                applyEffect(ally, effect.type, { duration: effect.duration, value: effectValue, sourceId: enemy.id })
                emitCombatEffect(ally.id, 'enemy', 'buff', 0)
              }
            }
          }
        }

        if (target.currentHp <= 0) {
          addLog(`${target.template.name} has fallen!`)
        }
      }

      enemy.currentCooldowns[skill.name] = skill.cooldown + 1
    } else {
      const damage = calculateDamage(effectiveAtk, 1.0, effectiveDef)
      const actualDamage = applyDamage(target, damage)
      if (actualDamage > 0) {
        addLog(`${enemy.template.name} attacks ${target.template.name} for ${actualDamage} damage!`)
        emitCombatEffect(target.instanceId, 'hero', 'damage', actualDamage)
      } else {
        addLog(`${enemy.template.name} attacks ${target.template.name}!`)
      }
    }

    if (target.currentHp <= 0) {
      addLog(`${target.template.name} has fallen!`)
    }

    // Check for thorns effect on the target
    const thornsEffect = target.statusEffects?.find(e => e.definition?.isThorns)
    if (thornsEffect && enemy.currentHp > 0) {
      const targetAtk = getEffectiveStat(target, 'atk')
      const thornsDamage = Math.floor(targetAtk * thornsEffect.value / 100)
      if (thornsDamage > 0) {
        applyDamage(enemy, thornsDamage, 'thorns')
        addLog(`${enemy.template.name} takes ${thornsDamage} retaliation damage!`)
        emitCombatEffect(enemy.id, 'enemy', 'damage', thornsDamage)
        if (enemy.currentHp <= 0) {
          addLog(`${enemy.template.name} defeated!`)
        }
      }
    }

    // Check for riposte effect on the target (counter-attack if enemy has lower DEF, or noDefCheck bypasses)
    const riposteResult = checkRiposte(target, enemy)
    if (riposteResult.triggered && riposteResult.damage > 0) {
      applyDamage(enemy, riposteResult.damage, 'riposte')
      addLog(`${target.template.name} ripostes ${enemy.template.name} for ${riposteResult.damage} damage!`)
      emitCombatEffect(enemy.id, 'enemy', 'damage', riposteResult.damage)
      if (enemy.currentHp <= 0) {
        addLog(`${enemy.template.name} defeated!`)
      }
    }

    // Check for flame shield effect on the target
    triggerFlameShield(target, enemy)

    // Process end of turn effects for enemy
    processEndOfTurnEffects(enemy)

    setTimeout(() => {
      advanceTurnIndex()
      startNextTurn()
    }, 600)
  }

  function triggerFlameShield(defender, attacker) {
    const flameShieldEffect = defender.statusEffects?.find(e => e.type === EffectType.FLAME_SHIELD)
    if (!flameShieldEffect || attacker.currentHp <= 0) return

    const burnDuration = flameShieldEffect.burnDuration || 2
    const defenderAtk = getEffectiveStat(defender, 'atk')

    applyEffect(attacker, EffectType.BURN, {
      duration: burnDuration,
      value: Math.floor(defenderAtk * 0.5),
      sourceId: defender.instanceId
    })

    const defenderName = defender.template?.name || 'Hero'
    const attackerName = attacker.template?.name || 'Enemy'
    addLog(`${attackerName} is burned by ${defenderName}'s Flame Shield!`)
    emitCombatEffect(attacker.id, 'enemy', 'debuff', 0)
  }

  function spreadBurnFromTarget(target, allEnemies, sourceId) {
    const burnEffect = target.statusEffects?.find(e => e.type === EffectType.BURN)
    if (!burnEffect) return 0

    let spreadCount = 0
    for (const enemy of allEnemies) {
      if (enemy.id === target.id) continue
      if (enemy.currentHp <= 0) continue

      const hasBurn = enemy.statusEffects?.some(e => e.type === EffectType.BURN)
      if (hasBurn) continue

      applyEffect(enemy, EffectType.BURN, {
        duration: burnEffect.duration,
        value: burnEffect.value,
        sourceId: sourceId
      })
      addLog(`Burn spreads to ${enemy.template.name}!`)
      emitCombatEffect(enemy.id, 'enemy', 'debuff', 0)
      spreadCount++
    }

    return spreadCount
  }

  function consumeAllBurns(allEnemies, casterAtk, atkBonusPercent = 0) {
    let burnDamage = 0
    let burnsConsumed = 0

    for (const enemy of allEnemies) {
      if (enemy.currentHp <= 0) continue
      if (!enemy.statusEffects) continue

      const burnEffects = enemy.statusEffects.filter(e => e.type === EffectType.BURN)

      for (const burn of burnEffects) {
        // Calculate remaining burn damage
        const burnDamagePerTick = burn.value
        const remainingDamage = burnDamagePerTick * burn.duration

        burnDamage += remainingDamage
        burnsConsumed++
      }

      // Remove all burns from this enemy
      if (burnEffects.length > 0) {
        enemy.statusEffects = enemy.statusEffects.filter(e => e.type !== EffectType.BURN)
      }
    }

    // Calculate ATK bonus based on total burns consumed
    const atkBonus = Math.floor(burnsConsumed * casterAtk * atkBonusPercent / 100)
    const totalDamage = burnDamage + atkBonus

    return { totalDamage, burnsConsumed }
  }

  function calculateDamage(atk, multiplier, def) {
    const raw = atk * multiplier * (100 / (100 + def))
    return Math.max(1, Math.floor(raw))
  }

  function getMarkedDamageMultiplier(target) {
    const markedEffect = target?.statusEffects?.find(e => e.type === EffectType.MARKED)
    if (markedEffect) {
      return 1 + (markedEffect.value / 100)
    }
    return 1
  }

  function getViciousDamageMultiplier(attacker, target) {
    const viciousEffect = attacker?.statusEffects?.find(e => e.type === EffectType.VICIOUS)
    if (!viciousEffect) return 1.0

    // Check if target has any debuffs
    const hasDebuff = target?.statusEffects?.some(e => {
      const def = e.definition || effectDefinitions[e.type]
      return def && !def.isBuff
    })

    if (!hasDebuff) return 1.0

    return 1 + (viciousEffect.bonusDamagePercent || 0) / 100
  }

  function calculateDamageWithMarked(atk, multiplier, def, markedMultiplier = 1) {
    const raw = atk * multiplier * (100 / (100 + def))
    const baseDamage = Math.max(1, Math.floor(raw))
    return Math.floor(baseDamage * markedMultiplier)
  }

  function selectRandomTarget(enemies, prioritizeMarked = false) {
    const alive = enemies.filter(e => e.currentHp > 0)
    if (alive.length === 0) return null

    if (prioritizeMarked) {
      const marked = alive.filter(e => e.statusEffects?.some(s => s.type === EffectType.MARKED))
      if (marked.length > 0) {
        return marked[Math.floor(Math.random() * marked.length)]
      }
    }

    return alive[Math.floor(Math.random() * alive.length)]
  }

  function calculateHeal(atk, description, shardBonus = 0) {
    const match = description.match(/(\d+)%/)
    if (match) {
      const basePercent = parseInt(match[1])
      const effectivePercent = basePercent + shardBonus
      return Math.floor(atk * effectivePercent / 100)
    }
    return Math.floor(atk)
  }

  function calculateShieldFromPercentMaxHp(target, effect) {
    if (!effect.shieldPercentMaxHp) return 0
    const maxHp = target.maxHp || target.currentHp
    return Math.floor(maxHp * (effect.shieldPercentMaxHp / 100))
  }

  function pickRandom(array, count) {
    const shuffled = [...array].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  function applySplashDamage(attacker, primaryTarget, otherEnemies, skill) {
    if (!skill.splashCount || !skill.splashDamagePercent) return
    if (!otherEnemies || otherEnemies.length === 0) return

    const splashTargets = pickRandom(otherEnemies, skill.splashCount)
    const effectiveAtk = getEffectiveStat(attacker, 'atk')
    const splashMultiplier = skill.splashDamagePercent / 100

    for (const splashTarget of splashTargets) {
      if (splashTarget.currentHp <= 0) continue

      const splashDef = getEffectiveStat(splashTarget, 'def')
      const splashDamage = calculateDamage(effectiveAtk, splashMultiplier, splashDef)
      applyDamage(splashTarget, splashDamage, 'attack', attacker)
      emitCombatEffect(splashTarget.id, 'enemy', 'damage', splashDamage)
      addLog(`${skill.name} splashes to ${splashTarget.template.name} for ${splashDamage} damage!`)

      if (splashTarget.currentHp <= 0) {
        addLog(`${splashTarget.template.name} defeated!`)
      }
    }
  }

  function parseSkillMultiplier(description, shardBonus = 0) {
    const match = description.match(/(\d+)%/)
    if (match) {
      const basePercent = parseInt(match[1])
      const effectivePercent = basePercent + shardBonus
      return effectivePercent / 100
    }
    return 1.0
  }

  function addLog(message) {
    battleLog.value.push({
      round: roundNumber.value,
      message,
      timestamp: Date.now()
    })
  }

  function emitCombatEffect(targetId, targetType, effectType, value) {
    combatEffects.value.push({
      id: Date.now() + Math.random(),
      targetId,
      targetType, // 'hero' or 'enemy'
      effectType, // 'damage', 'heal', 'buff', 'debuff'
      value
    })
  }

  function clearCombatEffects() {
    combatEffects.value = []
  }

  function getPartyState() {
    const partyState = {}
    for (const hero of heroes.value) {
      partyState[hero.instanceId] = {
        currentHp: hero.currentHp,
        currentMp: hero.currentMp,
        currentRage: hero.currentRage
      }
    }
    return partyState
  }

  function endBattle() {
    state.value = BattleState.IDLE
    heroes.value = []
    enemies.value = []
    turnOrder.value = []
    battleLog.value = []
  }

  // Get chain bounce targets (excludes primary target and dead enemies)
  function getChainTargets(primaryTarget, allEnemies, maxBounces) {
    const eligible = allEnemies.filter(e =>
      e.id !== primaryTarget.id && e.currentHp > 0
    )
    // Shuffle and take up to maxBounces
    const shuffled = [...eligible].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, maxBounces)
  }

  // Heal all allies for a percentage of damage dealt
  function healAlliesFromDamage(allies, damageDealt, healPercent) {
    if (damageDealt <= 0 || healPercent <= 0) return

    const healAmount = Math.floor(damageDealt * healPercent / 100)
    if (healAmount <= 0) return

    for (const ally of allies) {
      const oldHp = ally.currentHp
      ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmount)
      const actualHeal = ally.currentHp - oldHp
      if (actualHeal > 0) {
        emitCombatEffect(ally.instanceId, 'hero', 'heal', actualHeal)
      }
    }
  }

  // ========== ORIENTAL FIGHTERS MECHANICS ==========

  /**
   * Apply healing to a unit, accounting for Reluctance stacks
   * @param {object} unit - The unit to heal
   * @param {number} amount - Base heal amount
   * @param {object} options - Options like { bypassReluctance: true }
   * @returns {number} - Actual heal amount applied
   */
  function applyHeal(unit, amount, options = {}) {
    if (amount <= 0) return 0

    let healAmount = amount

    // Check for Reluctance stacks (unless bypassed)
    if (!options.bypassReluctance) {
      const reluctanceStacks = (unit.statusEffects || []).filter(
        e => e.type === EffectType.RELUCTANCE
      ).length

      if (reluctanceStacks > 0) {
        // Each stack reduces healing by 10%, max 5 stacks = 50% reduction
        const effectiveStacks = Math.min(reluctanceStacks, 5)
        const reduction = effectiveStacks * 10 / 100
        healAmount = Math.floor(amount * (1 - reduction))
      }
    }

    const oldHp = unit.currentHp
    unit.currentHp = Math.min(unit.maxHp, unit.currentHp + healAmount)
    const actualHeal = unit.currentHp - oldHp

    return actualHeal
  }

  /**
   * Get valid targets for enemy attacks (filters out STEALTH and UNTARGETABLE)
   * @returns {Array} - Array of targetable heroes
   */
  function getValidEnemyTargets() {
    let targets = heroes.value.filter(h => h.currentHp > 0)

    // Check for taunt - if any hero has taunt, they must be targeted
    const tauntingHeroes = targets.filter(h =>
      h.statusEffects?.some(e => e.definition?.isTaunt)
    )
    if (tauntingHeroes.length > 0) {
      return tauntingHeroes
    }

    // Filter out untargetable and stealthed heroes
    const targetableHeroes = targets.filter(h =>
      !h.statusEffects?.some(e => e.definition?.isUntargetable || e.definition?.isStealth)
    )

    // If all heroes are untargetable/stealthed, enemy can still attack (edge case)
    if (targetableHeroes.length > 0) {
      return targetableHeroes
    }

    return targets
  }

  /**
   * Get valid ally targets for support/healing skills (includes STEALTH heroes)
   * @param {string} casterId - The instanceId of the casting hero (for excludeSelf logic)
   * @returns {Array} - Array of targetable allies
   */
  function getValidAllyTargets(casterId) {
    return heroes.value.filter(h => h.currentHp > 0)
    // Note: STEALTH heroes CAN be targeted by allies, unlike UNTARGETABLE
    // We return all alive heroes - the UI will handle excludeSelf if needed
  }

  /**
   * Get effective stat including passive abilities like Bushido
   * @param {object} unit - The unit
   * @param {string} statName - The stat name (atk, def, spd)
   * @returns {number} - The effective stat value
   */
  function getEffectiveStatWithPassives(unit, statName) {
    // Start with base effective stat from status effects
    // Note: getEffectiveStat now handles passive object format (atkPerMissingHpPercent)
    let effectiveStat = getEffectiveStat(unit, statName)

    // Handle both passives array and passive object formats
    const passives = unit.template?.passives ||
      (unit.template?.passive ? [unit.template.passive] : [])

    for (const passive of passives) {
      // Bushido passive (array format with type: 'bushido'): ATK scales with missing HP
      if (passive.type === 'bushido' && statName === 'atk') {
        const currentHpPercent = (unit.currentHp / unit.maxHp) * 100
        const missingHpPercent = 100 - currentHpPercent
        // Bonus is 0.5% ATK per 1% missing HP, capped at 50%
        const bonusPercent = Math.min(missingHpPercent * 0.5, 50)
        effectiveStat = Math.floor(effectiveStat * (1 + bonusPercent / 100))
      }
      // Note: passive object format with atkPerMissingHpPercent is already handled in getEffectiveStat
    }

    return effectiveStat
  }

  // ========== CACOPHON ALLY HP COST FUNCTIONS ==========

  function resetAllyHpTracking() {
    totalAllyHpLost.value = 0
  }

  function applyAllyHpCost(hero, percent, isCacophonSkill = false) {
    // Cacophon is immune to her own skill costs
    if (isCacophonSkill && hero.templateId === 'cacophon') {
      return 0
    }

    const maxHp = hero.maxHp || hero.currentHp
    const damage = Math.floor(maxHp * (percent / 100))
    const actualDamage = Math.min(damage, hero.currentHp - 1) // Don't reduce below 1 HP

    if (actualDamage > 0) {
      hero.currentHp -= actualDamage
      totalAllyHpLost.value += actualDamage
    }

    return actualDamage
  }

  function processAllyHpCostForSkill(caster, skill, targets) {
    if (!skill.allyHpCostPercent) return

    const isCacophonSkill = caster.templateId === 'cacophon'

    for (const target of targets) {
      applyAllyHpCost(target, skill.allyHpCostPercent, isCacophonSkill)
    }
  }

  // ========== ECHOING AOE CONVERSION FUNCTIONS ==========

  function checkAndApplyEchoing(hero, skill) {
    const echoingEffect = hero?.statusEffects?.find(e => e.type === EffectType.ECHOING)
    if (!echoingEffect) return false

    // Only works on single-hit damaging skills
    if (skill.multiHit) return false
    if (skill.noDamage) return false
    if (!skill.damagePercent && !skill.damageMultiplier) return false

    return true
  }

  function getEchoingSplashPercent(hero) {
    const echoingEffect = hero?.statusEffects?.find(e => e.type === EffectType.ECHOING)
    return echoingEffect?.splashPercent || 0
  }

  function consumeEchoingEffect(hero) {
    if (hero?.statusEffects) {
      hero.statusEffects = hero.statusEffects.filter(e => e.type !== EffectType.ECHOING)
    }
  }

  // ========== DISCORDANT_RESONANCE LEADER SKILL FUNCTIONS ==========

  function applyBattleStartDebuffLeaderEffect(heroList, effect) {
    if (effect.type !== 'battle_start_debuff') return
    if (effect.target !== 'all_allies') return

    const { damageBonus, healingPenalty } = effect.apply

    for (const hero of heroList) {
      if (hero.currentHp > 0 || hero.currentHp === undefined) {
        hero.statusEffects.push({
          type: EffectType.DISCORDANT_RESONANCE,
          duration: 999, // Lasts entire battle
          damageBonus: damageBonus || 0,
          healingPenalty: healingPenalty || 0,
          sourceId: 'leader_skill',
          definition: effectDefinitions[EffectType.DISCORDANT_RESONANCE]
        })
      }
    }
  }

  function getDiscordantDamageBonus(hero) {
    const effect = hero?.statusEffects?.find(e => e.type === EffectType.DISCORDANT_RESONANCE)
    if (!effect) return 1.0
    return 1 + (effect.damageBonus || 0) / 100
  }

  function getDiscordantHealingPenalty(hero) {
    const effect = hero?.statusEffects?.find(e => e.type === EffectType.DISCORDANT_RESONANCE)
    if (!effect) return 1.0
    return 1 - (effect.healingPenalty || 0) / 100
  }

  // ========== SUFFERING'S CRESCENDO FINALE FUNCTIONS ==========

  function calculateSufferingCrescendoBonus(baseBuff, hpPerPercent, maxBonus) {
    const hpBonus = Math.floor(totalAllyHpLost.value / hpPerPercent)
    const cappedBonus = Math.min(hpBonus, maxBonus)
    return baseBuff + cappedBonus
  }

  function processSufferingCrescendoFinale(heroes, effect) {
    const { baseBuff, hpPerPercent, maxBonus, duration } = effect
    const totalBuff = calculateSufferingCrescendoBonus(baseBuff, hpPerPercent, maxBonus)

    // Apply ATK_UP and DEF_UP to all living heroes
    for (const hero of heroes) {
      if (hero.currentHp > 0) {
        // Use applyEffect to properly create effects with definitions
        applyEffect(hero, EffectType.ATK_UP, {
          duration,
          value: totalBuff,
          sourceId: 'cacophon_finale',
          fromAllySkill: true
        })
        applyEffect(hero, EffectType.DEF_UP, {
          duration,
          value: totalBuff,
          sourceId: 'cacophon_finale',
          fromAllySkill: true
        })
      }
    }

    // Reset tracking
    resetAllyHpTracking()
  }

  function processFinaleEffects(heroList, effects) {
    for (const effect of effects) {
      if (effect.type === 'suffering_crescendo') {
        processSufferingCrescendoFinale(heroList, effect)
      }
      // Add other finale effect types here as needed
    }
  }

  // ========== COIN FLIP SYSTEM (for Copper Jack) ==========

  // Flip a coin - returns 'heads' or 'tails'
  function flipCoin() {
    return Math.random() < 0.5 ? 'heads' : 'tails'
  }

  // Apply coin flip result to hero based on their coinFlipEffects template
  function applyCoinFlipResult(hero, result) {
    const effects = hero.template?.coinFlipEffects
    if (!effects) return

    if (result === 'heads') {
      // Apply damage multiplier effect
      hero.statusEffects.push({
        type: 'coin_flip_heads',
        duration: 1,
        value: effects.heads.damageMultiplier,
        firstHitOnly: effects.heads.firstHitOnly
      })
    } else {
      // Tails: deal self damage and gain rage
      const damage = Math.floor(hero.maxHp * (effects.tails.selfDamagePercent / 100))
      hero.currentHp = Math.max(1, hero.currentHp - damage)
      hero.currentRage = Math.min(100, (hero.currentRage || 0) + effects.tails.rageGain)
      hero.tookSelfDamageThisTurn = true
    }
    hero.coinFlippedThisTurn = true
  }

  // Consume and return coin flip damage bonus (returns multiplier, removes effect)
  function consumeCoinFlipBonus(hero) {
    const idx = hero.statusEffects.findIndex(e => e.type === 'coin_flip_heads')
    if (idx !== -1) {
      const effect = hero.statusEffects[idx]
      hero.statusEffects.splice(idx, 1)
      return effect.value
    }
    return 1
  }

  // Calculate damage for Copper Jack's coin flip-aware skills
  function calculateCoinFlipSkillDamage(hero, skill) {
    let damagePercent = skill.damagePercent || 0

    // Weighted Toss: +coinFlipBonus% if coin was flipped this turn
    if (skill.coinFlipBonus && hero.coinFlippedThisTurn) {
      damagePercent += skill.coinFlipBonus
    }

    // Double Down: use selfDamageBonusPercent if took self damage this turn
    if (skill.selfDamageBonusPercent && hero.tookSelfDamageThisTurn) {
      damagePercent = skill.selfDamageBonusPercent
    }

    return Math.floor(hero.atk * (damagePercent / 100))
  }

  // Execute Jackpot skill (5 coin flips)
  function executeJackpot(hero, skill) {
    let heads = 0
    let tails = 0

    for (let i = 0; i < skill.jackpotFlips; i++) {
      if (flipCoin() === 'heads') {
        heads++
      } else {
        tails++
      }
    }

    // Damage: damagePerHeads% ATK per heads
    const damagePercent = heads * skill.damagePerHeads
    const damage = Math.floor(hero.atk * (damagePercent / 100))

    // Rage: ragePerTails per tails
    const rageGained = tails * skill.ragePerTails
    hero.currentRage = Math.min(100, (hero.currentRage || 0) + rageGained)

    // ATK buff: atkPerTails% per tails for atkDuration turns
    if (tails > 0) {
      hero.statusEffects.push({
        type: 'atk_up',
        duration: skill.atkDuration,
        value: tails * skill.atkPerTails,
        sourceId: hero.instanceId
      })
    }

    return { damage, heads, tails, rageGained, atkBuffStacks: tails }
  }

  // ========== FORTUNE SWAP SYSTEM (for Fortuna Inversus Finale) ==========

  // Execute Fortuna's Wheel of Reversal finale
  // Swaps buff/debuff pairs between allies and enemies, dispels certain effects
  function executeFortuneSwap(allies, enemies, swapPairs, dispelList, sourceId) {
    let swapped = 0
    let dispelled = 0

    const allyEffectsToProcess = []
    const enemyEffectsToProcess = []

    // Collect effects from allies
    for (const ally of allies) {
      for (const effect of [...ally.statusEffects]) {
        if (swapPairs[effect.type]) {
          allyEffectsToProcess.push({ unit: ally, effect, isAlly: true })
        } else if (dispelList.includes(effect.type)) {
          allyEffectsToProcess.push({ unit: ally, effect, isAlly: true, dispel: true })
        }
      }
    }

    // Collect effects from enemies
    for (const enemy of enemies) {
      for (const effect of [...enemy.statusEffects]) {
        if (swapPairs[effect.type]) {
          enemyEffectsToProcess.push({ unit: enemy, effect, isAlly: false })
        } else if (dispelList.includes(effect.type)) {
          enemyEffectsToProcess.push({ unit: enemy, effect, isAlly: false, dispel: true })
        }
      }
    }

    const isEmpty = allyEffectsToProcess.length === 0 && enemyEffectsToProcess.length === 0

    // Process ally effects: swap to random enemy or dispel
    for (const { unit, effect, dispel } of allyEffectsToProcess) {
      const idx = unit.statusEffects.indexOf(effect)
      if (idx !== -1) {
        unit.statusEffects.splice(idx, 1)
        if (dispel) {
          dispelled++
        } else {
          // Swap to random enemy
          const target = enemies[Math.floor(Math.random() * enemies.length)]
          target.statusEffects.push({
            type: swapPairs[effect.type],
            duration: effect.duration,
            value: effect.value,
            sourceId
          })
          swapped++
        }
      }
    }

    // Process enemy effects: swap to random ally or dispel
    for (const { unit, effect, dispel } of enemyEffectsToProcess) {
      const idx = unit.statusEffects.indexOf(effect)
      if (idx !== -1) {
        unit.statusEffects.splice(idx, 1)
        if (dispel) {
          dispelled++
        } else {
          // Swap to random ally
          const target = allies[Math.floor(Math.random() * allies.length)]
          target.statusEffects.push({
            type: swapPairs[effect.type],
            duration: effect.duration,
            value: effect.value,
            sourceId
          })
          swapped++
        }
      }
    }

    return { swapped, dispelled, isEmpty }
  }

  // Execute Fortuna's Wheel of Reversal finale
  function executeFortunaFinale(fortuna) {
    const finale = fortuna.template.finale
    if (!finale?.isFortuneSwap) return { success: false }

    const aliveAllies = heroes.value.filter(h => h.currentHp > 0)
    const aliveEnemies = enemies.value.filter(e => e.currentHp > 0)

    const result = executeFortuneSwap(
      aliveAllies,
      aliveEnemies,
      finale.swapPairs,
      finale.dispelList,
      fortuna.instanceId
    )

    if (result.isEmpty && finale.emptyFallback) {
      const allUnits = [...aliveAllies, ...aliveEnemies]
      const randomUnit = allUnits[Math.floor(Math.random() * allUnits.length)]
      const randomEffect = finale.emptyFallback.options[
        Math.floor(Math.random() * finale.emptyFallback.options.length)
      ]

      randomUnit.statusEffects.push({
        type: randomEffect.type,
        duration: randomEffect.duration,
        value: randomEffect.value,
        sourceId: fortuna.instanceId
      })

      result.usedFallback = true
      result.fallbackMessage = finale.emptyFallback.message
    }

    fortuna.currentVerses = 0
    fortuna.lastSkillName = null

    return result
  }

  function summonEnemy(templateId) {
    // Check alive enemy cap
    if (enemies.value.filter(e => e.currentHp > 0).length >= MAX_ENEMIES) {
      return false
    }

    // Get template
    const template = getEnemyTemplate(templateId)
    if (!template) {
      return false
    }

    // Initialize cooldowns from template skills
    const cooldowns = {}
    if (template.skills) {
      for (const skill of template.skills) {
        cooldowns[skill.name] = skill.initialCooldown || 0
      }
    } else if (template.skill) {
      cooldowns[template.skill.name] = template.skill.initialCooldown || 0
    }

    // Push new enemy
    enemies.value.push({
      id: `enemy_${nextEnemyId.value++}`,
      templateId,
      isSummoned: true,
      currentHp: template.stats.hp,
      maxHp: template.stats.hp,
      stats: template.stats,
      template,
      currentCooldowns: cooldowns,
      statusEffects: []
    })

    addLog(`${template.name} has been summoned!`)
    return true
  }

  // --- Colosseum: Hero-as-Enemy ---

  const STAR_GROWTH_MULTIPLIERS = {
    1: 1.00,
    2: 1.10,
    3: 1.20,
    4: 1.35,
    5: 1.50
  }

  const SHARD_TIER_BONUSES = {
    0: 0,
    1: 0.05,  // +5%
    2: 0.10,  // +10%
    3: 0.15   // +15%
  }

  function calculateColosseumStats(template, level, shardTier) {
    const starLevel = template.rarity
    const starMultiplier = STAR_GROWTH_MULTIPLIERS[starLevel] || 1
    const baseLevelGrowth = 0.05
    const levelMultiplier = 1 + (baseLevelGrowth * starMultiplier) * (level - 1)
    const shardBonus = 1 + (SHARD_TIER_BONUSES[shardTier] || 0)

    return {
      hp: Math.floor(template.baseStats.hp * levelMultiplier * shardBonus),
      atk: Math.floor(template.baseStats.atk * levelMultiplier * shardBonus),
      def: Math.floor(template.baseStats.def * levelMultiplier * shardBonus),
      spd: Math.floor(template.baseStats.spd * levelMultiplier * shardBonus),
      mp: Math.floor((template.baseStats.mp || 0) * levelMultiplier * shardBonus)
    }
  }

  function createColosseumEnemies(bout) {
    return bout.heroes.map((heroDef, index) => {
      const template = getHeroTemplate(heroDef.templateId)
      if (!template) return null

      const heroClass = getClass(template.classId)
      const stats = calculateColosseumStats(template, heroDef.level, heroDef.shardTier)

      // Build cooldowns
      const cooldowns = {}
      if (template.skills) {
        for (const skill of template.skills) {
          if (skill.cooldown) cooldowns[skill.name] = 0
        }
      }

      // Resource initialization based on class
      const resourceState = {}
      if (heroClass?.resourceType === 'rage') {
        resourceState.currentRage = 0
      } else if (heroClass?.resourceType === 'focus') {
        resourceState.hasFocus = true
      } else if (heroClass?.resourceType === 'valor') {
        resourceState.currentValor = 0
      } else if (heroClass?.resourceType === 'verse') {
        resourceState.currentVerses = 0
        resourceState.lastSkillName = null
      } else if (heroClass?.resourceType === 'essence') {
        resourceState.currentEssence = Math.floor((stats.mp || 60) * 0.5)
        resourceState.maxEssence = stats.mp || 60
      } else {
        // Standard MP classes
        resourceState.currentMp = Math.floor(stats.mp * 0.3)
        resourceState.maxMp = stats.mp
      }

      return {
        id: `colosseum_${index}`,
        templateId: heroDef.templateId,
        classId: template.classId,
        currentHp: stats.hp,
        maxHp: stats.hp,
        stats,
        template,
        class: heroClass,
        currentCooldowns: cooldowns,
        statusEffects: [],
        isColosseumEnemy: true,
        isLeader: bout.leader === heroDef.templateId,
        level: heroDef.level,
        ...resourceState
      }
    }).filter(Boolean)
  }

  return {
    // State
    state,
    heroes,
    enemies,
    turnOrder,
    currentTurnIndex,
    roundNumber,
    battleLog,
    selectedAction,
    selectedTarget,
    combatEffects,
    leaderSkillActivation,
    finaleActivation,
    enemySkillActivation,
    battleType,
    genusLociMeta,
    // Getters
    currentUnit,
    isPlayerTurn,
    aliveHeroes,
    deadHeroes,
    aliveEnemies,
    isBattleOver,
    currentTargetType,
    currentSkillExcludesSelf,
    needsTargetSelection,
    // Actions
    initBattle,
    selectAction,
    selectTarget,
    getPartyState,
    endBattle,
    clearCombatEffects,
    applyDamage,
    reviveUnit,
    // Turn order (with SHATTERED_TEMPO priority support)
    calculateTurnOrder,
    // Effect helpers (for UI)
    applyEffect,
    resolveEffectValue,
    getEffectiveStat,
    hasEffect,
    getStacks,
    checkDeathPrevention,
    getMarkedDamageMultiplier,
    getViciousDamageMultiplier,
    calculateDamageWithMarked,
    selectRandomTarget,
    pickRandom,
    // Splash damage (for cleave/AoE skills)
    applySplashDamage,
    // Focus helpers (for UI)
    isRanger,
    grantFocus,
    removeFocus,
// Rage helpers (for UI)
    isBerserker,
    gainRage,
    spendRage,
// Blood Tempo tracking (for Torga's Blood Echo)
    getBloodTempoUses,
    incrementBloodTempoUses,
    calculateBloodEchoDamage,
    processSkillForBloodTempoTracking,
// Verse helpers (for UI)
    isBard,
    gainVerse,
    canUseSkill,
    // SEATED stance check (for Civil Rights heroes)
    isSeated,
    // Basic attack modifier passive (for Rosara's Quiet Defiance)
    getBasicAttackDamagePercent,
    // Hero on-death triggers (for Zina's Last Breath)
    getHeroOnDeathPassive,
    processHeroDeathTrigger,
    // Low HP trigger passive (for Zina's Cornered Animal)
    getLowHpTriggerPassive,
    processLowHpTrigger,
    // Valor helpers (for UI)
    isKnight,
    getValorTier,
    resolveValorCost,
    gainValor,
    // Essence helpers (for Alchemist class)
    isAlchemist,
    initializeEssence,
    regenerateEssence,
    getVolatilityTier,
    getVolatilityDamageBonus,
    getVolatilitySelfDamage,
    // Chain bounce helpers
    getChainTargets,
    // Flame Shield trigger (for reactive burn)
    triggerFlameShield,
    // Spread burn (for Spreading Flames skill)
    spreadBurnFromTarget,
    // Consume burns (for Conflagration skill)
    consumeAllBurns,
// Heal allies from damage (for Nature's Reclamation skill)
    healAlliesFromDamage,
    // Guardian Link (for Aurora's damage sharing)
    calculateGuardianLinkDamage,
    // Damage Store (for Aurora's damage release)
    releaseDamageStore,
    // Divine Sacrifice (for Aurora's ally damage interception)
    checkDivineSacrifice,
    // Riposte (counter-attack check with optional noDefCheck bypass)
    checkRiposte,
    // Blind miss check (for blinded attackers)
    checkBlindMiss,
    // Heal Self Percent (lifesteal for skills)
    calculateHealSelfPercent,
    // Desperation heal scaling (bonus based on missing HP)
    calculateDesperationHeal,
    calculatePartyMissingHpPercent,
    // Heartbreak Stack System (for Mara Thornheart)
    hasHeartbreakPassive,
    initializeHeartbreakStacks,
    gainHeartbreakStack,
    consumeAllHeartbreakStacks,
    getHeartbreakBonuses,
    checkHeartbreakAllyHpTrigger,
    checkHeartbreakSelfDamageTrigger,
    checkHeartbreakAllyDeathTrigger,
    // Ally HP cost (for Cacophon's skills)
    totalAllyHpLost,
    resetAllyHpTracking,
    applyAllyHpCost,
    processAllyHpCostForSkill,
    // Shield from percent max HP (for Cacophon's Warding Noise)
    calculateShieldFromPercentMaxHp,
    // Suffering's Crescendo Finale (for Cacophon)
    calculateSufferingCrescendoBonus,
    processSufferingCrescendoFinale,
    processFinaleEffects,
    executeFinale,
    // ECHOING AoE conversion (for Cacophon)
    checkAndApplyEchoing,
    getEchoingSplashPercent,
    consumeEchoingEffect,
    // DISCORDANT_RESONANCE leader skill (for Cacophon)
    applyBattleStartDebuffLeaderEffect,
    getDiscordantDamageBonus,
    getDiscordantHealingPenalty,
    // Passive regen leader effects
    applyPassiveRegenLeaderEffects,
    // Equipment helpers
    getEquipmentBonuses,
    getEquipmentEffects,
    processEquipmentStartOfTurn,
    rollCrit,
    getEquipmentAtkBoost,
    getSkillCostReduction,
    processValorOnBlock,
    processRageOnKill,
    processFocusOnCrit,
    getSpellAmp,
    getHealAmp,
    getAllyDamageReduction,
    getFinaleBoost,
    // Dice roll utilities (for Bones McCready)
    rollDice,
    getDiceTier,
    checkLoadedDice,
    executeDiceHeal,
    executeDiceEffect,
    // Coin flip system (for Copper Jack)
    flipCoin,
    applyCoinFlipResult,
    consumeCoinFlipBonus,
    calculateCoinFlipSkillDamage,
    executeJackpot,
    // Fortune swap system (for Fortuna Inversus)
    executeFortuneSwap,
    executeFortunaFinale,
    // Leader skill condition helpers (for HP-based conditions)
    checkLeaderCondition,
    getLeaderBonusStat,
    // Constants
    BattleState,
    EffectType,
    MAX_ENEMIES,
    // Summoning
    summonEnemy,
    // Enemy turn execution (for testing)
    executeEnemyTurn,
    // Oriental Fighters mechanics
    applyHeal,
    getValidEnemyTargets,
    getValidAllyTargets,
    getEffectiveStatWithPassives,
    // Colosseum
    createColosseumEnemies,
    calculateColosseumStats
  }
})
