import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHeroesStore } from './heroes.js'
import { getEnemyTemplate } from '../data/enemyTemplates.js'

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
  const heroes = ref([]) // { instanceId, templateId, currentHp, maxHp, currentMp, maxMp, stats, template, class }
  const enemies = ref([]) // { id, templateId, currentHp, maxHp, stats, template, currentCooldowns }
  const turnOrder = ref([]) // Array of { type: 'hero'|'enemy', id }
  const currentTurnIndex = ref(0)
  const roundNumber = ref(1)
  const battleLog = ref([])
  const selectedAction = ref(null) // 'attack' or 'skill'
  const selectedTarget = ref(null)

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

  // Get the target type for the currently selected action
  const currentTargetType = computed(() => {
    if (selectedAction.value === 'attack') {
      return 'enemy'
    }
    if (selectedAction.value === 'skill' && currentUnit.value?.template?.skill) {
      return currentUnit.value.template.skill.targetType || 'enemy'
    }
    return null
  })

  // Check if the current action needs manual target selection
  const needsTargetSelection = computed(() => {
    const targetType = currentTargetType.value
    return targetType === 'enemy' || targetType === 'ally'
  })

  // Actions
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
        currentHp: savedState?.currentHp ?? heroFull.stats.hp,
        maxHp: heroFull.stats.hp,
        currentMp: savedState?.currentMp ?? Math.floor(heroFull.stats.mp * 0.3), // Start at 30% MP
        maxMp: heroFull.stats.mp,
        stats: heroFull.stats,
        template: heroFull.template,
        class: heroFull.class
      })
    }

    // Initialize enemies
    let enemyIndex = 0
    for (const templateId of enemyTemplateIds) {
      const template = getEnemyTemplate(templateId)
      if (!template) continue

      const cooldowns = {}
      if (template.skill) {
        cooldowns[template.skill.name] = 0 // Ready to use
      }

      enemies.value.push({
        id: `enemy_${enemyIndex++}`,
        templateId,
        currentHp: template.stats.hp,
        maxHp: template.stats.hp,
        stats: template.stats,
        template,
        currentCooldowns: cooldowns
      })
    }

    // Calculate turn order based on speed
    calculateTurnOrder()

    state.value = BattleState.STARTING
    addLog(`Battle start! Round ${roundNumber.value}`)

    // Start first turn
    setTimeout(() => startNextTurn(), 500)
  }

  function calculateTurnOrder() {
    const units = []

    for (const hero of heroes.value) {
      if (hero.currentHp > 0) {
        units.push({ type: 'hero', id: hero.instanceId, spd: hero.stats.spd })
      }
    }

    for (const enemy of enemies.value) {
      if (enemy.currentHp > 0) {
        units.push({ type: 'enemy', id: enemy.id, spd: enemy.stats.spd })
      }
    }

    // Sort by speed (highest first)
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
          state.value = BattleState.PLAYER_TURN
          selectedAction.value = null
          selectedTarget.value = null
          addLog(`${hero.template.name}'s turn`)
          return
        }
      } else {
        const enemy = enemies.value.find(e => e.id === turn.id)
        if (enemy && enemy.currentHp > 0) {
          state.value = BattleState.ENEMY_TURN
          addLog(`${enemy.template.name}'s turn`)
          setTimeout(() => executeEnemyTurn(enemy), 800)
          return
        }
      }

      // Move to next in order
      advanceTurnIndex()
      attempts++
    }
  }

  function advanceTurnIndex() {
    currentTurnIndex.value++
    if (currentTurnIndex.value >= turnOrder.value.length) {
      // New round
      currentTurnIndex.value = 0
      roundNumber.value++
      addLog(`--- Round ${roundNumber.value} ---`)

      // MP recovery at start of round (10% max)
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

      // Recalculate turn order (units may have died)
      calculateTurnOrder()
    }
  }

  function selectAction(action) {
    if (state.value !== BattleState.PLAYER_TURN) return
    selectedAction.value = action

    // For skills that don't need target selection, execute immediately
    if (action === 'skill') {
      const skill = currentUnit.value?.template?.skill
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
      // Basic attack always targets enemy
      const target = enemies.value.find(e => e.id === selectedTarget.value?.id)
      if (!target || target.currentHp <= 0) {
        addLog('Invalid target')
        state.value = BattleState.PLAYER_TURN
        return
      }

      const damage = calculateDamage(hero.stats.atk, 1.0, target.stats.def)
      target.currentHp = Math.max(0, target.currentHp - damage)
      addLog(`${hero.template.name} attacks ${target.template.name} for ${damage} damage!`)

      if (target.currentHp <= 0) {
        addLog(`${target.template.name} defeated!`)
      }
    } else if (selectedAction.value === 'skill') {
      const skill = hero.template.skill
      if (hero.currentMp < skill.mpCost) {
        addLog(`Not enough ${hero.class.resourceName}!`)
        state.value = BattleState.PLAYER_TURN
        return
      }

      hero.currentMp -= skill.mpCost
      const targetType = skill.targetType || 'enemy'

      switch (targetType) {
        case 'enemy': {
          const target = enemies.value.find(e => e.id === selectedTarget.value?.id)
          if (!target || target.currentHp <= 0) {
            addLog('Invalid target')
            hero.currentMp += skill.mpCost // Refund
            state.value = BattleState.PLAYER_TURN
            return
          }
          const multiplier = parseSkillMultiplier(skill.description)
          const damage = calculateDamage(hero.stats.atk, multiplier, target.stats.def)
          target.currentHp = Math.max(0, target.currentHp - damage)
          addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name} for ${damage} damage!`)
          if (target.currentHp <= 0) {
            addLog(`${target.template.name} defeated!`)
          }
          break
        }

        case 'ally': {
          const target = heroes.value.find(h => h.instanceId === selectedTarget.value?.id)
          if (!target || target.currentHp <= 0) {
            addLog('Invalid target')
            hero.currentMp += skill.mpCost // Refund
            state.value = BattleState.PLAYER_TURN
            return
          }
          const healAmount = calculateHeal(hero.stats.atk, skill.description)
          const oldHp = target.currentHp
          target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount)
          const actualHeal = target.currentHp - oldHp
          addLog(`${hero.template.name} uses ${skill.name} on ${target.template.name}, healing for ${actualHeal} HP!`)
          break
        }

        case 'self': {
          // Self-targeting skills (buffs)
          addLog(`${hero.template.name} uses ${skill.name}!`)
          // For now, just log the skill use. Full buff implementation would require a status effect system.
          break
        }

        case 'all_enemies': {
          const multiplier = parseSkillMultiplier(skill.description)
          let totalDamage = 0
          for (const target of aliveEnemies.value) {
            const damage = calculateDamage(hero.stats.atk, multiplier, target.stats.def)
            target.currentHp = Math.max(0, target.currentHp - damage)
            totalDamage += damage
            if (target.currentHp <= 0) {
              addLog(`${target.template.name} defeated!`)
            }
          }
          addLog(`${hero.template.name} uses ${skill.name}, dealing ${totalDamage} total damage!`)
          break
        }

        case 'all_allies': {
          // Party-wide buff/heal
          addLog(`${hero.template.name} uses ${skill.name} on all allies!`)
          // Check if it's a heal
          if (skill.description.toLowerCase().includes('heal')) {
            const healAmount = calculateHeal(hero.stats.atk, skill.description)
            for (const target of aliveHeroes.value) {
              target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount)
            }
          }
          break
        }
      }
    }

    // End turn
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

    // Pick a random alive hero as target
    const targets = aliveHeroes.value
    if (targets.length === 0) {
      advanceTurnIndex()
      startNextTurn()
      return
    }

    const target = targets[Math.floor(Math.random() * targets.length)]

    // Check if skill is available
    const skill = enemy.template.skill
    const skillReady = skill && enemy.currentCooldowns[skill.name] === 0

    if (skillReady) {
      // Use skill
      const multiplier = parseSkillMultiplier(skill.description)
      const damage = calculateDamage(enemy.stats.atk, multiplier, target.stats.def)
      target.currentHp = Math.max(0, target.currentHp - damage)
      addLog(`${enemy.template.name} uses ${skill.name} on ${target.template.name} for ${damage} damage!`)

      // Set cooldown
      enemy.currentCooldowns[skill.name] = skill.cooldown
    } else {
      // Basic attack
      const damage = calculateDamage(enemy.stats.atk, 1.0, target.stats.def)
      target.currentHp = Math.max(0, target.currentHp - damage)
      addLog(`${enemy.template.name} attacks ${target.template.name} for ${damage} damage!`)
    }

    // Check if hero died
    if (target.currentHp <= 0) {
      addLog(`${target.template.name} has fallen!`)
    }

    // End turn
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
    // Extract percentage from "Heal ... for X% ATK"
    const match = description.match(/(\d+)%/)
    if (match) {
      return Math.floor(atk * parseInt(match[1]) / 100)
    }
    return Math.floor(atk) // Default to 100% ATK
  }

  function parseSkillMultiplier(description) {
    // Extract percentage from "Deal X% ATK damage"
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

  function getPartyState() {
    // Return current HP/MP for all heroes (for saving between battles)
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
    // Constants
    BattleState
  }
})
