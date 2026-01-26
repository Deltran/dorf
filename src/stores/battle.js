import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHeroesStore } from './heroes.js'
import { getEnemyTemplate } from '../data/enemyTemplates.js'
import { EffectType, createEffect, getEffectDefinition } from '../data/statusEffects.js'
import { getClass } from '../data/classes.js'
import { getGenusLoci } from '../data/genusLoci.js'
import { getGenusLociAbilitiesForLevel } from '../data/genusLociAbilities.js'

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
  // State
  const state = ref(BattleState.IDLE)
  const heroes = ref([]) // { instanceId, ..., statusEffects: [] }
  const enemies = ref([]) // { id, ..., statusEffects: [] }
  const turnOrder = ref([])
  const currentTurnIndex = ref(0)
  const roundNumber = ref(1)
  const battleLog = ref([])
  const selectedAction = ref(null)
  const selectedTarget = ref(null)
  const combatEffects = ref([]) // For visual feedback: { id, targetId, targetType, effectType, value }
  const leaderSkillActivation = ref(null) // { skillName, leaderId } - for visual announcement
  const battleType = ref('normal') // 'normal' or 'genusLoci'
  const genusLociMeta = ref(null) // { genusLociId, powerLevel, triggeredTowersWrath }

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
    if (!template) return false

    // Class-based conditions
    if (condition.classId) {
      if (typeof condition.classId === 'string') {
        if (template.classId !== condition.classId) return false
      } else if (condition.classId.not) {
        if (template.classId === condition.classId.not) return false
      }
    }

    // Role-based conditions (hero template role overrides class role)
    if (condition.role) {
      const heroClass = getClass(template.classId)
      if (!heroClass) return false
      const effectiveRole = template.role || heroClass.role

      if (typeof condition.role === 'string') {
        if (effectiveRole !== condition.role) return false
      } else if (condition.role.not) {
        if (effectiveRole === condition.role.not) return false
      }
    }

    return true
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
      if (effect.type !== 'passive') continue

      for (const hero of heroes.value) {
        if (matchesCondition(hero, effect.condition)) {
          if (!hero.leaderBonuses) hero.leaderBonuses = {}
          hero.leaderBonuses[effect.stat] = (hero.leaderBonuses[effect.stat] || 0) + effect.value
        }
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
        if (effect.type.includes('_up')) {
          modifier += effect.value
        } else if (effect.type.includes('_down')) {
          modifier -= effect.value
        }
      }
    }

    // Add passive leader bonuses
    if (unit.leaderBonuses?.[statName]) {
      modifier += unit.leaderBonuses[statName]
    }

    return Math.max(1, Math.floor(baseStat * (1 + modifier / 100)))
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

    // Track whether this is a self-buff or ally-buff (for stat buff stacking)
    newEffect.fromAllySkill = fromAllySkill

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

    return true // Can act
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

  // Check if a unit can use their skill based on resource type
  function canUseSkill(unit) {
    if (!unit.skill) return false

    // Rangers check focus
    if (isRanger(unit)) {
      return unit.hasFocus === true
    }

    // Berserkers check rage cost
    if (isBerserker(unit)) {
      const rageCost = unit.skill.rageCost ?? 0
      return unit.currentRage >= rageCost
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
      return rawValue + shardBonus
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

  // Apply damage to a unit and handle focus loss for rangers
  // attacker: optional unit object for the attacker (used for rage gain)
  function applyDamage(unit, damage, source = 'attack', attacker = null) {
    if (damage <= 0) return 0

    // Check for EVASION effect
    const evasionEffect = (unit.statusEffects || []).find(e => e.type === EffectType.EVASION)
    if (evasionEffect && source === 'attack') {
      const evasionChance = evasionEffect.value / 100
      if (Math.random() < evasionChance) {
        const unitName = unit.template?.name || 'Unknown'
        addLog(`${unitName} evades the attack!`)
        emitCombatEffect(unit.instanceId || unit.id, unit.instanceId ? 'hero' : 'enemy', 'miss', 0)

        // Handle onEvade effects (e.g., MP restore to caster)
        if (evasionEffect.onEvade?.restoreMp && evasionEffect.sourceId) {
          const caster = heroes.value.find(h => h.instanceId === evasionEffect.sourceId)
          if (caster && caster.currentHp > 0) {
            const mpToRestore = evasionEffect.onEvade.restoreMp
            caster.currentMp = Math.min(caster.maxMp, caster.currentMp + mpToRestore)
            addLog(`${caster.template.name} recovers ${mpToRestore} MP!`)
          }
        }

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
    const damageReductionEffect = (unit.statusEffects || []).find(e => e.type === EffectType.DAMAGE_REDUCTION)
    if (damageReductionEffect) {
      const reductionPercent = damageReductionEffect.value
      const reducedAmount = Math.floor(damage * reductionPercent / 100)
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

    // Check death prevention before applying lethal damage
    if (unit.currentHp - damage <= 0) {
      if (checkDeathPrevention(unit, damage)) {
        const unitName = unit.template?.name || 'Unit'
        addLog(`${unitName} is protected from death by World Root's Embrace!`)
        emitCombatEffect(unit.instanceId || unit.id, unit.instanceId ? 'hero' : 'enemy', 'heal', 0)
        return 0 // Damage was prevented by death prevention effect
      }
    }

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

    // Clear all status effects on death
    if (unit.currentHp <= 0) {
      if (unit.statusEffects?.length > 0) {
        unit.statusEffects = []
      }
      // Reset rage on death for berserkers
      if (isBerserker(unit)) {
        unit.currentRage = 0
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
          const finalDamage = Math.max(1, retaliateDamage - Math.floor(attackerDef * 0.5))

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

    // Initialize cooldowns for active skills
    const cooldowns = {}
    for (const skill of activeSkills) {
      cooldowns[skill.name] = 0
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
      shield: 0, // For Iron Guard shield
      isGenusLoci: true
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
    battleType.value = genusLociContext ? 'genusLoci' : 'normal'
    genusLociMeta.value = genusLociContext ? {
      genusLociId: genusLociContext.genusLociId,
      powerLevel: genusLociContext.powerLevel,
      triggeredTowersWrath: false
    } : null

    // Initialize heroes from party
    const party = heroesStore.party.filter(Boolean)
    for (const instanceId of party) {
      const heroFull = heroesStore.getHeroFull(instanceId)
      if (!heroFull) continue

      const savedState = partyState?.[instanceId]

      heroes.value.push({
        instanceId,
        templateId: heroFull.templateId,
        level: heroFull.level,
        currentHp: savedState?.currentHp ?? heroFull.stats.hp,
        maxHp: heroFull.stats.hp,
        currentMp: savedState?.currentMp ?? Math.floor(heroFull.stats.mp * 0.3),
        maxMp: heroFull.stats.mp,
        stats: heroFull.stats,
        template: heroFull.template,
        class: heroFull.class,
        statusEffects: [],
        hasFocus: heroFull.class?.resourceType === 'focus' ? true : undefined,
        currentValor: heroFull.class?.resourceType === 'valor' ? 0 : undefined,
        currentRage: heroFull.class?.resourceType === 'rage' ? (savedState?.currentRage ?? 0) : undefined,
        wasAttacked: false
      })
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
            cooldowns[skill.name] = 0
          }
        } else if (template.skill) {
          cooldowns[template.skill.name] = 0
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

    // Apply passive leader skill effects
    applyPassiveLeaderEffects()

    // Apply round 1 timed effects
    applyTimedLeaderEffects(1)

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
        units.push({ type: 'hero', id: hero.instanceId, spd: effectiveSpd })
      }
    }

    for (const enemy of enemies.value) {
      if (enemy.currentHp > 0) {
        const effectiveSpd = getEffectiveStat(enemy, 'spd')
        units.push({ type: 'enemy', id: enemy.id, spd: effectiveSpd })
      }
    }

    units.sort((a, b) => b.spd - a.spd)
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

      // MP recovery at start of round
      for (const hero of heroes.value) {
        if (hero.currentHp > 0) {
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
      const damage = calculateDamage(effectiveAtk, 1.0, effectiveDef)
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
      } else {
        if (hero.currentMp < skill.mpCost) {
          addLog(`Not enough ${hero.class.resourceName}!`)
          state.value = BattleState.PLAYER_TURN
          return
        }
        hero.currentMp -= skill.mpCost
      }
      usedSkill = true

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

      const targetType = skill.targetType || 'enemy'
      const effectiveAtk = getEffectiveStat(hero, 'atk')
      // Support useStat property for skills that use a different stat for damage (e.g., DEF)
      const damageStat = skill.useStat || 'atk'
      const effectiveDamageStat = skill.useStat ? getEffectiveStat(hero, skill.useStat) : effectiveAtk

      // Get shard bonus for this hero (0, 5, 10, or 15)
      const heroesStore = useHeroesStore()
      const shardBonus = heroesStore.getShardBonus(hero.instanceId)

      switch (targetType) {
        case 'enemy': {
          const target = enemies.value.find(e => e.id === selectedTarget.value?.id)
          if (!target || target.currentHp <= 0) {
            addLog('Invalid target')
            // Refund resource: Focus for rangers, Rage for berserkers, MP for others
            if (isRanger(hero)) {
              grantFocus(hero)
            } else if (isBerserker(hero)) {
              // Don't refund 'all' cost skills (rage wasn't deducted yet)
              if (typeof skill.rageCost === 'number') {
                hero.currentRage += skill.rageCost
              }
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
          const finalDamageStat = skill.useStat ? getEffectiveStat(hero, skill.useStat) : effectiveAtk

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
              const hitDamage = calculateDamageWithMarked(finalDamageStat, multiplier, reducedDef, markedMultiplier)
              applyDamage(target, hitDamage, 'attack', hero)
              totalDamage += hitDamage
              emitCombatEffect(target.id, 'enemy', 'damage', hitDamage)
            }

            addLog(`${hero.template.name} deals ${totalDamage} total damage in ${skill.multiHit} hits!`)

            if (target.currentHp <= 0) {
              addLog(`${target.template.name} defeated!`)
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
              const hitDamage = calculateDamageWithMarked(finalDamageStat, multiplier, reducedDef, markedMultiplier)
              applyDamage(target, hitDamage, 'attack', hero)
              totalDamage += hitDamage
              emitCombatEffect(target.id, 'enemy', 'damage', hitDamage)
            }

            addLog(`${hero.template.name} deals ${totalDamage} total damage in ${skill.multiHit} hits!`)

            if (target.currentHp <= 0) {
              addLog(`${target.template.name} defeated!`)
            }
          }
          // Deal damage unless skill is effect-only
          else if (!skill.noDamage) {
            const effectiveDef = getEffectiveStat(target, 'def')
            // Apply ignoreDef if present
            const defReduction = skill.ignoreDef ? (skill.ignoreDef / 100) : 0
            const reducedDef = effectiveDef * (1 - defReduction)
            const markedMultiplier = getMarkedDamageMultiplier(target)
            let damage

            // Count debuffs for bonusDamagePerDebuff skills (e.g., Knarly's Special)
            let debuffCount = 0
            if (skill.bonusDamagePerDebuff) {
              debuffCount = (target.statusEffects || []).filter(e => !e.definition?.isBuff).length
            }

            // Check for Valor-scaled damage
            const scaledDamage = getSkillDamage(skill, hero)
            if (scaledDamage !== null) {
              // Apply shard bonus to Valor-scaled damage percentage
              const multiplier = (scaledDamage + shardBonus) / 100
              damage = calculateDamageWithMarked(finalDamageStat, multiplier, reducedDef, markedMultiplier)
            } else if (skill.damageMultiplier !== undefined) {
              // Use explicit damageMultiplier if provided (with bonus per debuff)
              let baseMultiplier = skill.damageMultiplier
              if (skill.bonusDamagePerDebuff && debuffCount > 0) {
                baseMultiplier += (skill.bonusDamagePerDebuff / 100) * debuffCount
              }
              // Apply shard bonus as percentage
              baseMultiplier += shardBonus / 100
              damage = calculateDamageWithMarked(finalDamageStat, baseMultiplier, reducedDef, markedMultiplier)
            } else {
              const multiplier = parseSkillMultiplier(skill.description, shardBonus)
              damage = calculateDamageWithMarked(finalDamageStat, multiplier, reducedDef, markedMultiplier)
            }

            applyDamage(target, damage, 'attack', hero)
            if (skill.bonusDamagePerDebuff && debuffCount > 0) {
              addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name} for ${damage} damage! (${debuffCount} debuffs consumed)`)
            } else {
              addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name} for ${damage} damage!`)
            }
            emitCombatEffect(target.id, 'enemy', 'damage', damage)

// Heal all allies for percentage of damage dealt (Nature's Reclamation)
            if (skill.healAlliesPercent && damage > 0) {
              healAlliesFromDamage(aliveHeroes.value, damage, skill.healAlliesPercent)
              addLog(`All allies are healed from the life force reclaimed!`)
            }

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
          } else {
            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}!`)
          }

          // Apply skill effects
          if (skill.effects) {
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

          // Handle spreadBurn skill
          if (skill.spreadBurn && target.currentHp > 0) {
            const spreadCount = spreadBurnFromTarget(target, aliveEnemies.value, hero.instanceId)
            if (spreadCount > 0) {
              addLog(`Flames spread to ${spreadCount} other enemies!`)
            }
          }

          if (target.currentHp <= 0) {
            addLog(`${target.template.name} defeated!`)
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
            // Refund resource: Focus for rangers, Rage for berserkers, MP for others
            if (isRanger(hero)) {
              grantFocus(hero)
            } else if (isBerserker(hero)) {
              // Don't refund 'all' cost skills (rage wasn't deducted yet)
              if (typeof skill.rageCost === 'number') {
                hero.currentRage += skill.rageCost
              }
            } else {
              hero.currentMp += skill.mpCost
            }
            state.value = BattleState.PLAYER_TURN
            return
          }

          // Heal unless skill is effect-only
          if (!skill.noDamage) {
            const healAmount = calculateHeal(effectiveAtk, skill.description, shardBonus)
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
            // Refund MP
            hero.currentMp += skill.mpCost
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
          break
        }

        case 'random_enemies': {
          const multiplier = parseSkillMultiplier(skill.description, shardBonus)
          const numHits = skill.multiHit || 1
          let totalDamage = 0

          addLog(`${hero.template.name} uses ${skill.name}!`)

          for (let i = 0; i < numHits; i++) {
            const target = selectRandomTarget(aliveEnemies.value, skill.prioritizeMarked)
            if (!target) break

            const effectiveDef = getEffectiveStat(target, 'def')
            const defReduction = skill.ignoreDef ? (skill.ignoreDef / 100) : 0
            const reducedDef = effectiveDef * (1 - defReduction)
            const markedMultiplier = getMarkedDamageMultiplier(target)
            const damage = calculateDamageWithMarked(effectiveAtk, multiplier, reducedDef, markedMultiplier)

            applyDamage(target, damage, 'attack', hero)
            totalDamage += damage
            emitCombatEffect(target.id, 'enemy', 'damage', damage)

            if (target.currentHp <= 0) {
              addLog(`${target.template.name} defeated!`)
            }
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

          // Use Valor-scaled damage if available (with shard bonus)
          const scaledDamage = getSkillDamage(skill, hero)
          const multiplier = scaledDamage !== null ? (scaledDamage + shardBonus) / 100 : parseSkillMultiplier(skill.description, shardBonus)
          let totalDamage = 0
          let totalThornsDamage = 0
          for (const target of targets) {
            const effectiveDef = getEffectiveStat(target, 'def')
            const markedMultiplier = getMarkedDamageMultiplier(target)
            const damage = calculateDamageWithMarked(effectiveAtk, multiplier, effectiveDef, markedMultiplier)
            applyDamage(target, damage, 'attack', hero)
            totalDamage += damage
            emitCombatEffect(target.id, 'enemy', 'damage', damage)

            if (skill.effects) {
              for (const effect of skill.effects) {
                if (effect.target === 'enemy' && shouldApplyEffect(effect, hero)) {
                  const effectDuration = resolveEffectDuration(effect, hero)
                  const effectValue = resolveEffectValue(effect, hero, effectiveAtk, shardBonus)
                  applyEffect(target, effect.type, { duration: effectDuration, value: effectValue, sourceId: hero.instanceId })
                  emitCombatEffect(target.id, 'enemy', 'debuff', 0)
                }
              }
            }

            if (target.currentHp <= 0) {
              addLog(`${target.template.name} defeated!`)
            }

            // Check for thorns effect on the enemy
            const thornsEffect = target.statusEffects?.find(e => e.type === EffectType.THORNS)
            if (thornsEffect && target.currentHp > 0) {
              const enemyAtk = getEffectiveStat(target, 'atk')
              const thornsDamage = Math.max(1, Math.floor(enemyAtk * (thornsEffect.value || 40) / 100))
              totalThornsDamage += thornsDamage
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
          break
        }

        case 'all_allies': {
          addLog(`${hero.template.name} uses ${skill.name} on all allies!`)
          if (skill.description.toLowerCase().includes('heal')) {
            const healAmount = calculateHeal(effectiveAtk, skill.description, shardBonus)
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
      // Filter out untargetable heroes (only if no taunt)
      const targetableHeroes = targets.filter(h =>
        !h.statusEffects?.some(e => e.definition?.isUntargetable)
      )
      // If all heroes are untargetable, enemy can still attack (no valid targets edge case)
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

    if (skill) {
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
          const actualDamage = applyDamage(heroTarget, damage)
          totalDamage += actualDamage
          if (actualDamage > 0) {
            emitCombatEffect(heroTarget.instanceId, 'hero', 'damage', actualDamage)
          }

          // Apply debuffs to each hero if applicable
          if (skill.effects) {
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
        enemy.currentCooldowns[skill.name] = skill.cooldown
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
        const actualDamage = applyDamage(target, damage)
        if (actualDamage > 0) {
          addLog(`${enemy.template.name} uses ${skill.name} on ${target.template.name} for ${actualDamage} damage!`)
          emitCombatEffect(target.instanceId, 'hero', 'damage', actualDamage)
        } else {
          addLog(`${enemy.template.name} uses ${skill.name} on ${target.template.name}!`)
        }

        // Remove buffs if skill has cleanse
        if (skill.cleanse === 'buffs') {
          const removedEffects = target.statusEffects?.filter(e => e.definition?.isBuff) || []
          if (removedEffects.length > 0) {
            target.statusEffects = target.statusEffects.filter(e => !e.definition?.isBuff)
            for (const effect of removedEffects) {
              addLog(`${target.template.name}'s ${effect.definition.name} was removed!`)
            }
            emitCombatEffect(target.instanceId, 'hero', 'debuff', 0)
          }
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

        if (target.currentHp <= 0) {
          addLog(`${target.template.name} has fallen!`)
        }
      }

      enemy.currentCooldowns[skill.name] = skill.cooldown
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

    // Check for riposte effect on the target (counter-attack if enemy has lower DEF)
    const riposteEffect = target.statusEffects?.find(e => e.definition?.isRiposte)
    if (riposteEffect && enemy.currentHp > 0 && target.currentHp > 0) {
      const targetDef = getEffectiveStat(target, 'def')
      const enemyDef = getEffectiveStat(enemy, 'def')

      if (enemyDef < targetDef) {
        const targetAtk = getEffectiveStat(target, 'atk')
        const riposteDamage = Math.floor(targetAtk * (riposteEffect.value || 100) / 100)
        if (riposteDamage > 0) {
          applyDamage(enemy, riposteDamage, 'riposte')
          addLog(`${target.template.name} ripostes ${enemy.template.name} for ${riposteDamage} damage!`)
          emitCombatEffect(enemy.id, 'enemy', 'damage', riposteDamage)
          if (enemy.currentHp <= 0) {
            addLog(`${enemy.template.name} defeated!`)
          }
        }
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
    const raw = atk * multiplier - def * 0.5
    return Math.max(1, Math.floor(raw))
  }

  function getMarkedDamageMultiplier(target) {
    const markedEffect = target?.statusEffects?.find(e => e.type === EffectType.MARKED)
    if (markedEffect) {
      return 1 + (markedEffect.value / 100)
    }
    return 1
  }

  function calculateDamageWithMarked(atk, multiplier, def, markedMultiplier = 1) {
    const raw = atk * multiplier - def * 0.5
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
    // Effect helpers (for UI)
    getEffectiveStat,
    hasEffect,
    checkDeathPrevention,
    getMarkedDamageMultiplier,
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
// Verse helpers (for UI)
    isBard,
    gainVerse,
    canUseSkill,
    // Valor helpers (for UI)
    isKnight,
    getValorTier,
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
    // Heal Self Percent (lifesteal for skills)
    calculateHealSelfPercent,
    // Constants
    BattleState,
    EffectType
  }
})
