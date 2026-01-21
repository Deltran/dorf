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

    // Role-based conditions
    if (condition.role) {
      const heroClass = getClass(template.classId)
      if (!heroClass) return false

      if (typeof condition.role === 'string') {
        if (heroClass.role !== condition.role) return false
      } else if (condition.role.not) {
        if (heroClass.role === condition.role.not) return false
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

  const needsTargetSelection = computed(() => {
    const targetType = currentTargetType.value
    return targetType === 'enemy' || targetType === 'ally'
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
  function applyEffect(unit, effectType, { duration = 2, value = 0, sourceId = null, fromAllySkill = false } = {}) {
    if (!unit.statusEffects) {
      unit.statusEffects = []
    }

    const definition = getEffectDefinition(effectType)
    if (!definition) return

    const newEffect = createEffect(effectType, { duration, value, sourceId })
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

  // Process effects at start of turn (check for stun, etc.)
  function processStartOfTurnEffects(unit) {
    if (hasEffect(unit, EffectType.STUN)) {
      const unitName = unit.template?.name || 'Unknown'
      addLog(`${unitName} is stunned and cannot act!`)
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
    }

    // Tick down durations and remove expired effects
    unit.statusEffects = unit.statusEffects.filter(effect => {
      effect.duration--
      if (effect.duration <= 0) {
        addLog(`${unitName}'s ${effect.definition.name} wore off.`)
        return false
      }
      return true
    })
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

  // Apply damage to a unit and handle focus loss for rangers
  // attacker: optional unit object for the attacker (used for rage gain)
  function applyDamage(unit, damage, source = 'attack', attacker = null) {
    if (damage <= 0) return 0

    const actualDamage = Math.min(unit.currentHp, damage)
    unit.currentHp = Math.max(0, unit.currentHp - actualDamage)

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

    return actualDamage
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
        skills: activeSkills
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

            for (let i = 0; i < skill.multiHit && target.currentHp > 0; i++) {
              const hitDamage = calculateDamage(finalDamageStat, multiplier, reducedDef)
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
            let totalDamage = 0

            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}!`)

            for (let i = 0; i < skill.multiHit && target.currentHp > 0; i++) {
              const hitDamage = calculateDamage(finalDamageStat, multiplier, reducedDef)
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
            let damage

            // Check for Valor-scaled damage
            const scaledDamage = getSkillDamage(skill, hero)
            if (scaledDamage !== null) {
              // Apply shard bonus to Valor-scaled damage percentage
              const multiplier = (scaledDamage + shardBonus) / 100
              damage = calculateDamage(finalDamageStat, multiplier, reducedDef)
            } else {
              const multiplier = parseSkillMultiplier(skill.description, shardBonus)
              damage = calculateDamage(finalDamageStat, multiplier, reducedDef)
            }

            applyDamage(target, damage, 'attack', hero)
            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name} for ${damage} damage!`)
            emitCombatEffect(target.id, 'enemy', 'damage', damage)
          } else {
            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}!`)
          }

          // Apply skill effects
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

          // Apply skill effects (buffs)
          if (skill.effects) {
            for (const effect of skill.effects) {
              if (effect.target === 'ally' && shouldApplyEffect(effect, hero)) {
                const effectDuration = resolveEffectDuration(effect, hero)
                const effectValue = resolveEffectValue(effect, hero, effectiveAtk, shardBonus)
                applyEffect(target, effect.type, { duration: effectDuration, value: effectValue, sourceId: hero.instanceId, fromAllySkill: true })
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
          const numHits = skill.hits || 1
          const multiplier = parseSkillMultiplier(skill.description, shardBonus)
          let totalDamage = 0

          addLog(`${hero.template.name} uses ${skill.name}!`)

          for (let i = 0; i < numHits; i++) {
            // Pick a random alive enemy for each hit
            const targets = aliveEnemies.value
            if (targets.length === 0) break

            const target = targets[Math.floor(Math.random() * targets.length)]
            const effectiveDef = getEffectiveStat(target, 'def')
            const damage = calculateDamage(effectiveAtk, multiplier, effectiveDef)
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
            const damage = calculateDamage(effectiveAtk, multiplier, effectiveDef)
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
                  applyEffect(target, effect.type, { duration: effectDuration, value: effectValue, sourceId: hero.instanceId, fromAllySkill: true })
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
    const readySkills = allSkills.filter(s => enemy.currentCooldowns[s.name] === 0)
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
          applyDamage(heroTarget, damage)
          totalDamage += damage
          emitCombatEffect(heroTarget.instanceId, 'hero', 'damage', damage)

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
        applyDamage(target, damage)
        addLog(`${enemy.template.name} uses ${skill.name} on ${target.template.name} for ${damage} damage!`)
        emitCombatEffect(target.instanceId, 'hero', 'damage', damage)

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
      applyDamage(target, damage)
      addLog(`${enemy.template.name} attacks ${target.template.name} for ${damage} damage!`)
      emitCombatEffect(target.instanceId, 'hero', 'damage', damage)
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

    // Process end of turn effects for enemy
    processEndOfTurnEffects(enemy)

    setTimeout(() => {
      advanceTurnIndex()
      startNextTurn()
    }, 600)
  }

  function calculateDamage(atk, multiplier, def) {
    const raw = atk * multiplier - def * 0.5
    return Math.max(1, Math.floor(raw))
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
    aliveEnemies,
    isBattleOver,
    currentTargetType,
    needsTargetSelection,
    // Actions
    initBattle,
    selectAction,
    selectTarget,
    getPartyState,
    endBattle,
    clearCombatEffects,
    applyDamage,
    // Effect helpers (for UI)
    getEffectiveStat,
    hasEffect,
    // Focus helpers (for UI)
    isRanger,
    grantFocus,
    removeFocus,
// Rage helpers (for UI)
    isBerserker,
    gainRage,
    spendRage,
    canUseSkill,
    // Valor helpers (for UI)
    isKnight,
    getValorTier,
    // Constants
    BattleState,
    EffectType
  }
})
