import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHeroesStore } from './heroes.js'
import { getEnemyTemplate } from '../data/enemyTemplates.js'
import { EffectType, createEffect, getEffectDefinition } from '../data/statusEffects.js'

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
  function applyEffect(unit, effectType, { duration = 2, value = 0, sourceId = null } = {}) {
    if (!unit.statusEffects) {
      unit.statusEffects = []
    }

    const definition = getEffectDefinition(effectType)
    if (!definition) return

    // Check if effect already exists
    const existingIndex = unit.statusEffects.findIndex(e => e.type === effectType)

    if (existingIndex !== -1) {
      if (definition.stackable) {
        // Add another stack
        unit.statusEffects.push(createEffect(effectType, { duration, value, sourceId }))
      } else {
        // Refresh duration and update value if higher
        const existing = unit.statusEffects[existingIndex]
        existing.duration = Math.max(existing.duration, duration)
        existing.value = Math.max(existing.value, value)
      }
    } else {
      unit.statusEffects.push(createEffect(effectType, { duration, value, sourceId }))
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

    const unitName = unit.template?.name || 'Unknown'

    // Process DoT effects
    const isHero = !!unit.instanceId
    const targetId = isHero ? unit.instanceId : unit.id
    const targetType = isHero ? 'hero' : 'enemy'

    for (const effect of unit.statusEffects) {
      if (effect.definition.isDot) {
        // DoT damage
        const damage = effect.value
        unit.currentHp = Math.max(0, unit.currentHp - damage)
        addLog(`${unitName} takes ${damage} ${effect.definition.name} damage!`)
        emitCombatEffect(targetId, targetType, 'damage', damage)

        if (unit.currentHp <= 0) {
          addLog(`${unitName} ${unit.instanceId ? 'has fallen' : 'defeated'}!`)
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

  // ========== BATTLE FUNCTIONS ==========

  function initBattle(partyState, enemyTemplateIds) {
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
        statusEffects: []
      })
    }

    // Initialize enemies
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

  function advanceTurnIndex() {
    currentTurnIndex.value++
    if (currentTurnIndex.value >= turnOrder.value.length) {
      currentTurnIndex.value = 0
      roundNumber.value++
      addLog(`--- Round ${roundNumber.value} ---`)

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

      if (targetType === 'self' || targetType === 'all_enemies' || targetType === 'all_allies') {
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
      target.currentHp = Math.max(0, target.currentHp - damage)
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
        hero.currentHp = Math.max(0, hero.currentHp - thornsDamage)
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
      if (!skill || hero.currentMp < skill.mpCost) {
        addLog(`Not enough ${hero.class.resourceName}!`)
        state.value = BattleState.PLAYER_TURN
        return
      }

      hero.currentMp -= skill.mpCost
      const targetType = skill.targetType || 'enemy'
      const effectiveAtk = getEffectiveStat(hero, 'atk')

      switch (targetType) {
        case 'enemy': {
          const target = enemies.value.find(e => e.id === selectedTarget.value?.id)
          if (!target || target.currentHp <= 0) {
            addLog('Invalid target')
            hero.currentMp += skill.mpCost
            state.value = BattleState.PLAYER_TURN
            return
          }

          // Deal damage unless skill is effect-only
          if (!skill.noDamage) {
            const effectiveDef = getEffectiveStat(target, 'def')
            const multiplier = parseSkillMultiplier(skill.description)
            const damage = calculateDamage(effectiveAtk, multiplier, effectiveDef)
            target.currentHp = Math.max(0, target.currentHp - damage)
            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name} for ${damage} damage!`)
            emitCombatEffect(target.id, 'enemy', 'damage', damage)
          } else {
            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}!`)
          }

          // Apply skill effects
          if (skill.effects) {
            for (const effect of skill.effects) {
              if (effect.target === 'enemy') {
                const effectValue = calculateEffectValue(effect, effectiveAtk)
                applyEffect(target, effect.type, { duration: effect.duration, value: effectValue, sourceId: hero.instanceId })
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
              hero.currentHp = Math.max(0, hero.currentHp - thornsDamage)
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
            hero.currentMp += skill.mpCost
            state.value = BattleState.PLAYER_TURN
            return
          }

          // Heal unless skill is effect-only
          if (!skill.noDamage) {
            const healAmount = calculateHeal(effectiveAtk, skill.description)
            const oldHp = target.currentHp
            target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount)
            const actualHeal = target.currentHp - oldHp
            addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}, healing for ${actualHeal} HP!`)
            if (actualHeal > 0) {
              emitCombatEffect(target.instanceId, 'hero', 'heal', actualHeal)
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
            } else {
              addLog(`${target.template.name} has no stat debuffs to cleanse.`)
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
              if (effect.target === 'ally') {
                const effectValue = calculateEffectValue(effect, effectiveAtk)
                applyEffect(target, effect.type, { duration: effect.duration, value: effectValue, sourceId: hero.instanceId })
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
              if (effect.target === 'self') {
                const effectValue = calculateEffectValue(effect, effectiveAtk)
                applyEffect(hero, effect.type, { duration: effect.duration, value: effectValue, sourceId: hero.instanceId })
                emitCombatEffect(hero.instanceId, 'hero', 'buff', 0)
              }
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

        case 'all_enemies': {
          const multiplier = parseSkillMultiplier(skill.description)
          let totalDamage = 0
          let totalThornsDamage = 0
          for (const target of aliveEnemies.value) {
            const effectiveDef = getEffectiveStat(target, 'def')
            const damage = calculateDamage(effectiveAtk, multiplier, effectiveDef)
            target.currentHp = Math.max(0, target.currentHp - damage)
            totalDamage += damage
            emitCombatEffect(target.id, 'enemy', 'damage', damage)

            if (skill.effects) {
              for (const effect of skill.effects) {
                if (effect.target === 'enemy') {
                  const effectValue = calculateEffectValue(effect, effectiveAtk)
                  applyEffect(target, effect.type, { duration: effect.duration, value: effectValue, sourceId: hero.instanceId })
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
            hero.currentHp = Math.max(0, hero.currentHp - totalThornsDamage)
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
            const healAmount = calculateHeal(effectiveAtk, skill.description)
            for (const target of aliveHeroes.value) {
              const oldHp = target.currentHp
              target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount)
              const actualHeal = target.currentHp - oldHp
              if (actualHeal > 0) {
                emitCombatEffect(target.instanceId, 'hero', 'heal', actualHeal)
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
              if (effect.target === 'ally' || effect.target === 'all_allies') {
                const effectValue = calculateEffectValue(effect, effectiveAtk)
                for (const target of aliveHeroes.value) {
                  applyEffect(target, effect.type, { duration: effect.duration, value: effectValue, sourceId: hero.instanceId })
                  emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
                }
              }
            }
          }
          break
        }
      }
    }

    // Process end of turn effects
    processEndOfTurnEffects(hero)

    setTimeout(() => {
      advanceTurnIndex()
      startNextTurn()
    }, 600)
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
          heroTarget.currentHp = Math.max(0, heroTarget.currentHp - damage)
          totalDamage += damage
          emitCombatEffect(heroTarget.instanceId, 'hero', 'damage', damage)

          // Apply debuffs to each hero if applicable
          if (skill.effects) {
            for (const effect of skill.effects) {
              if (effect.target === 'enemy' || effect.target === 'hero') {
                applyEffect(heroTarget, effect.type, { duration: effect.duration, value: effect.value, sourceId: enemy.id })
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
            if (effect.target === 'self') {
              applyEffect(enemy, effect.type, { duration: effect.duration, value: effect.value, sourceId: enemy.id })
              emitCombatEffect(enemy.id, 'enemy', 'buff', 0)
            } else if (effect.target === 'all_allies') {
              for (const ally of enemies.value.filter(e => e.currentHp > 0)) {
                if (effect.excludeSelf && ally.id === enemy.id) continue
                applyEffect(ally, effect.type, { duration: effect.duration, value: effect.value, sourceId: enemy.id })
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
            if (effect.target === 'enemy' || effect.target === 'hero') {
              applyEffect(target, effect.type, { duration: effect.duration, value: effect.value, sourceId: enemy.id })
              emitCombatEffect(target.instanceId, 'hero', 'debuff', 0)
            } else if (effect.target === 'self') {
              applyEffect(enemy, effect.type, { duration: effect.duration, value: effect.value, sourceId: enemy.id })
              emitCombatEffect(enemy.id, 'enemy', 'buff', 0)
            } else if (effect.target === 'all_allies') {
              for (const ally of enemies.value.filter(e => e.currentHp > 0)) {
                if (effect.excludeSelf && ally.id === enemy.id) continue
                applyEffect(ally, effect.type, { duration: effect.duration, value: effect.value, sourceId: enemy.id })
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
        target.currentHp = Math.max(0, target.currentHp - damage)
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
            if (effect.target === 'enemy' || effect.target === 'hero') {
              applyEffect(target, effect.type, { duration: effect.duration, value: effect.value, sourceId: enemy.id })
              emitCombatEffect(target.instanceId, 'hero', 'debuff', 0)
            } else if (effect.target === 'self') {
              applyEffect(enemy, effect.type, { duration: effect.duration, value: effect.value, sourceId: enemy.id })
              emitCombatEffect(enemy.id, 'enemy', 'buff', 0)
            } else if (effect.target === 'all_allies') {
              for (const ally of enemies.value.filter(e => e.currentHp > 0)) {
                if (effect.excludeSelf && ally.id === enemy.id) continue
                applyEffect(ally, effect.type, { duration: effect.duration, value: effect.value, sourceId: enemy.id })
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
      target.currentHp = Math.max(0, target.currentHp - damage)
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
        enemy.currentHp = Math.max(0, enemy.currentHp - thornsDamage)
        addLog(`${enemy.template.name} takes ${thornsDamage} retaliation damage!`)
        emitCombatEffect(enemy.id, 'enemy', 'damage', thornsDamage)
        if (enemy.currentHp <= 0) {
          addLog(`${enemy.template.name} defeated!`)
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

  function calculateHeal(atk, description) {
    const match = description.match(/(\d+)%/)
    if (match) {
      return Math.floor(atk * parseInt(match[1]) / 100)
    }
    return Math.floor(atk)
  }

  function parseSkillMultiplier(description) {
    const match = description.match(/(\d+)%/)
    if (match) {
      return parseInt(match[1]) / 100
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
        currentMp: hero.currentMp
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
    // Effect helpers (for UI)
    getEffectiveStat,
    hasEffect,
    // Constants
    BattleState,
    EffectType
  }
})
