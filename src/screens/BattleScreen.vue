<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useBattleStore, useQuestsStore, useHeroesStore, useGachaStore, useInventoryStore, useGenusLociStore, useExplorationsStore, BattleState } from '../stores'
import HeroCard from '../components/HeroCard.vue'
import EnemyCard from '../components/EnemyCard.vue'
import DamageNumber from '../components/DamageNumber.vue'
import ImpactIcon from '../components/ImpactIcon.vue'
import StatBar from '../components/StatBar.vue'
import ItemCard from '../components/ItemCard.vue'
import FocusIndicator from '../components/FocusIndicator.vue'
import ValorBar from '../components/ValorBar.vue'
import RageBar from '../components/RageBar.vue'
import VerseIndicator from '../components/VerseIndicator.vue'
import SkillPanel from '../components/SkillPanel.vue'
import ActionBar from '../components/ActionBar.vue'
import { getItem } from '../data/items.js'
import { getQuestNode, getAllQuestNodes } from '../data/questNodes.js'
import { getHeroTemplate } from '../data/heroTemplates.js'
import { getGenusLoci } from '../data/genusLoci.js'
import { useTipsStore } from '../stores/tips.js'
import { useTooltip } from '../composables/useTooltip.js'

const { onClick: showEffectTooltip } = useTooltip()

function getEffectTooltipText(effect) {
  const lines = []
  if (effect.sourceName) {
    lines.push(`From: ${effect.sourceName}`)
  }
  const def = effect.definition
  if (!def) return lines.join('\n') || 'Unknown effect'

  // Describe the effect value
  if (def.stat) {
    const direction = def.isBuff ? 'increased' : 'decreased'
    lines.push(`${def.stat.toUpperCase()} ${direction} by ${effect.value}%`)
  } else if (effect.type === 'poison' || effect.type === 'burn') {
    const label = effect.type === 'poison' ? 'Poison' : 'Burn'
    lines.push(`${label} dealing ${effect.atkPercent || effect.value}% ATK per turn`)
  } else if (effect.type === 'shield') {
    lines.push(`Absorbs ${effect.shieldHp || effect.value} damage`)
  } else if (effect.type === 'thorns') {
    lines.push(`Reflects ${effect.value}% of damage back to attacker`)
  } else if (effect.type === 'evasion') {
    lines.push(`${effect.value}% chance to dodge attacks`)
  } else if (effect.type === 'damage_reduction') {
    lines.push(`Reduces incoming damage by ${effect.value}%`)
  } else if (effect.type === 'marked') {
    lines.push(`Takes ${effect.value}% increased damage`)
  } else if (effect.type === 'regen') {
    lines.push(`Heals ${effect.value}% max HP per turn`)
  } else if (effect.type === 'stun') {
    lines.push('Cannot act this turn')
  } else if (effect.type === 'sleep') {
    lines.push('Cannot act. Removed when attacked.')
  } else if (effect.type === 'taunt') {
    lines.push('Enemies must target this unit')
  } else if (effect.type === 'guardian_link') {
    lines.push(`${effect.redirectPercent || effect.value}% of damage redirected to guardian`)
  } else if (effect.type === 'divine_sacrifice') {
    lines.push(`Intercepts all ally damage. ${effect.damageReduction || 0}% DR.`)
  } else if (effect.type === 'flame_shield') {
    lines.push(`Burns attackers for ${effect.burnDamage || effect.value} damage`)
  } else if (effect.type === 'damage_store') {
    lines.push(`Storing damage: ${effect.storedDamage || 0}. Releases on expiry.`)
  } else if (def.name) {
    lines.push(def.name)
  }

  lines.push(`${effect.duration} turn${effect.duration !== 1 ? 's' : ''} remaining`)
  return lines.join('\n')
}

const props = defineProps({
  genusLociContext: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['navigate', 'battleEnd'])

const battleStore = useBattleStore()
const questsStore = useQuestsStore()
const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()
const inventoryStore = useInventoryStore()
const genusLociStore = useGenusLociStore()
const explorationsStore = useExplorationsStore()
const tipsStore = useTipsStore()

const showVictoryModal = ref(false)
const defeatPhase = ref(null) // null | 'fading' | 'reveal' | 'complete'
const defeatFlavorText = ref('')
let defeatTimers = []

const DEFEAT_LINES = [
  'The darkness claims another party.',
  'Even legends fall.',
  'Silence where battle cries once echoed.',
  'The road ends here... for now.',
  'They gave everything. It wasn\'t enough.',
]
const rewards = ref(null)
const levelUps = ref([])
const displayedGems = ref(0)
const displayedExp = ref(0)
const displayedGold = ref(0)
const displayedExpPerHero = ref(0)
const showXpFloaters = ref(false)
const skillPanelOpen = ref(false)
const revealedItemCount = ref(0)
const selectedItem = ref(null) // For item detail popup
const victoryStep = ref(1) // 1 = rewards, 2 = xp/level ups
const shardDropDisplay = ref(null) // For displaying shard drops in victory
const inspectedHero = ref(null) // For hero stats popup
const lastClickedHero = ref(null) // Track for double-click detection
const genusLociRewards = ref(null) // For Genus Loci victory rewards

// Computed to check if this is a Genus Loci battle
const isGenusLociBattle = computed(() => battleStore.battleType === 'genusLoci')

const currentGenusLociName = computed(() => {
  if (!isGenusLociBattle.value || !battleStore.genusLociMeta) return ''
  const enemy = battleStore.enemies?.[0]
  return enemy?.name || battleStore.genusLociMeta.genusLociId
})

const genusLociPortraitUrl = computed(() => {
  if (!isGenusLociBattle.value || !battleStore.genusLociMeta) return null
  const bossId = battleStore.genusLociMeta.genusLociId
  const portraitPath = `../assets/enemies/${bossId}_portrait.png`
  return enemyPortraits[portraitPath] || null
})

// Combat visual effects
const damageNumbers = ref([])
const heroHitEffects = ref({}) // { instanceId: 'damage' | 'heal' | 'buff' | 'debuff' }
const enemyHitEffects = ref({}) // { id: 'damage' | 'heal' | 'buff' | 'debuff' }
const heroImpactIcons = ref({}) // { instanceId: 'attack' | 'magic' | 'heal' | ... }
const enemyImpactIcons = ref({}) // { id: 'attack' | 'magic' | 'heal' | ... }
const attackingEnemies = ref({}) // { id: true } - enemies currently in attack animation
const leaderActivating = ref(null) // instanceId of leader during skill activation
const leaderSkillName = ref(null) // name of activating leader skill
const finaleActivating = ref(null)
const finaleName = ref(null)
const enemySkillDisplay = ref({}) // { [enemyId]: skillName }

const currentNode = computed(() => questsStore.currentNode)
const currentBattleIndex = computed(() => questsStore.currentBattleIndex)
const totalBattles = computed(() => questsStore.totalBattlesInCurrentNode)

const currentHero = computed(() => {
  if (!battleStore.isPlayerTurn) return null
  return battleStore.currentUnit
})

// Get all skills for current hero (supports both 'skill' and 'skills')
const heroSkills = computed(() => {
  if (!currentHero.value) return []
  const template = currentHero.value.template
  if (template?.skills) return template.skills
  if (template?.skill) return [template.skill]
  return []
})

// Filter to only unlocked skills based on hero level
const availableSkills = computed(() => {
  if (!currentHero.value) return []
  const heroLevel = currentHero.value.level
  return heroSkills.value.filter(skill => {
    const unlockLevel = skill.skillUnlockLevel ?? 1
    return heroLevel >= unlockLevel
  })
})

// Check if current hero is a ranger (uses Focus)
const isCurrentHeroRanger = computed(() => {
  return currentHero.value?.class?.resourceType === 'focus'
})

// Check if current hero is a knight (uses Valor)
const isCurrentHeroKnight = computed(() => {
  return currentHero.value?.class?.resourceType === 'valor'
})

// Check if current hero is a berserker (uses Rage)
const isCurrentHeroBerserker = computed(() => {
  return currentHero.value?.class?.resourceType === 'rage'
})

// Check if current hero is a bard (uses Verse)
const isCurrentHeroBard = computed(() => {
  return currentHero.value?.class?.resourceType === 'verse'
})

// Check if inspected hero is a ranger (uses Focus)
const isInspectedHeroRanger = computed(() => {
  return inspectedHero.value?.class?.resourceType === 'focus'
})

// Check if inspected hero is a knight (uses Valor)
const isInspectedHeroKnight = computed(() => {
  return inspectedHero.value?.class?.resourceType === 'valor'
})

// Check if inspected hero is a berserker (uses Rage)
const isInspectedHeroBerserker = computed(() => {
  return inspectedHero.value?.class?.resourceType === 'rage'
})

// Check if inspected hero is a bard (uses Verse)
const isInspectedHeroBard = computed(() => {
  return inspectedHero.value?.class?.resourceType === 'verse'
})

// Helper functions for skill display
function getSkillDescription(skill) {
  // Check cooldown first (applies to all classes)
  const cd = currentHero.value?.currentCooldowns?.[skill.name]
  if (cd > 0) {
    return `On cooldown (${cd} round${cd > 1 ? 's' : ''})`
  }
  if (isCurrentHeroKnight.value && skill.valorRequired && (currentHero.value.currentValor || 0) < skill.valorRequired) {
    return `Requires ${skill.valorRequired} Valor`
  }
  if (isCurrentHeroRanger.value && !currentHero.value.hasFocus) {
    return 'Requires Focus'
  }
  if (isCurrentHeroBerserker.value) {
    const rageCost = skill.rageCost ?? 0
    if ((currentHero.value.currentRage || 0) < rageCost) {
      return `Requires ${rageCost} Rage`
    }
  }
  if (isCurrentHeroBard.value && currentHero.value.lastSkillName === skill.name) {
    return 'Cannot repeat the same song!'
  }
  return skill.description
}

function getSkillCost(skill) {
  if (isCurrentHeroKnight.value) {
    return skill.valorRequired || null
  }
  if (isCurrentHeroRanger.value) {
    return null
  }
  if (isCurrentHeroBerserker.value) {
    return skill.rageCost || 0
  }
  if (isCurrentHeroBard.value) {
    return null
  }
  return skill.mpCost
}

function getSkillCostLabel(skill) {
  if (isCurrentHeroKnight.value && skill.valorRequired) {
    return 'Valor'
  }
  if (isCurrentHeroRanger.value) {
    return null
  }
  if (isCurrentHeroBerserker.value) {
    return 'Rage'
  }
  if (isCurrentHeroBard.value) {
    return null
  }
  return currentHero.value?.class?.resourceName
}

// Check if a specific skill can be used (has enough MP, Focus, or Valor)
function canUseSkill(skill) {
  if (!currentHero.value || !skill) return false

  // Check cooldown (applies to all classes)
  if (currentHero.value.currentCooldowns?.[skill.name] > 0) return false

  // Knights check Valor requirement
  if (isCurrentHeroKnight.value) {
    if (skill.valorRequired) {
      return (currentHero.value.currentValor || 0) >= skill.valorRequired
    }
    return true // No valorRequired means always available
  }

  // Rangers use Focus instead of MP
  if (isCurrentHeroRanger.value) {
    return currentHero.value.hasFocus === true
  }

  // Berserkers check Rage cost
  if (isCurrentHeroBerserker.value) {
    const rageCost = skill.rageCost ?? 0
    return (currentHero.value.currentRage || 0) >= rageCost
  }

  // Bards can always use skills, except can't repeat same skill consecutively
  if (isCurrentHeroBard.value) {
    // 1-skill bards have no restrictions
    if (availableSkills.value.length <= 1) return true
    // Can't repeat same skill consecutively
    if (currentHero.value.lastSkillName === skill.name) return false
    return true
  }

  return currentHero.value.currentMp >= skill.mpCost
}

// Prepare skills data for SkillPanel component
const skillsForPanel = computed(() => {
  return availableSkills.value.map((skill, index) => ({
    name: skill.name,
    cost: getSkillCost(skill),
    costLabel: getSkillCostLabel(skill),
    disabled: !canUseSkill(skill),
    disabledReason: !canUseSkill(skill) ? getSkillDescription(skill) : null,
    fullDescription: skill.description,
    targetType: skill.targetType || 'enemy'
  }))
})

// Get class color for skill panel theming
const heroClassColor = computed(() => {
  if (!currentHero.value) return '#3b82f6'
  return currentHero.value.class?.color || '#3b82f6'
})

// Get hero role for ActionBar
const heroRole = computed(() => {
  if (!currentHero.value) return 'dps'
  return currentHero.value.class?.role || 'dps'
})

// Check if hero is stunned
const heroIsStunned = computed(() => {
  if (!currentHero.value) return false
  return currentHero.value.effects?.some(e => e.type === 'stun') || false
})

// Check if we're waiting for target selection
const isSelectingTarget = computed(() => {
  return battleStore.isPlayerTurn &&
         battleStore.selectedAction !== null &&
         battleStore.needsTargetSelection
})

// Check if enemies are targetable (for enemy-targeting actions)
const enemiesTargetable = computed(() => {
  return isSelectingTarget.value && battleStore.currentTargetType === 'enemy'
})

// Check if allies are targetable (for ally-targeting actions)
const alliesTargetable = computed(() => {
  return isSelectingTarget.value && battleStore.currentTargetType === 'ally'
})

// Check if dead allies are targetable (for revive skills)
const deadAlliesTargetable = computed(() => {
  return isSelectingTarget.value && battleStore.currentTargetType === 'dead_ally'
})

// Prompt text based on current state
const targetPrompt = computed(() => {
  if (!battleStore.selectedAction) return 'Choose an action'
  if (!battleStore.needsTargetSelection) return 'Executing...'
  if (battleStore.currentTargetType === 'ally') return 'Select an ally'
  if (battleStore.currentTargetType === 'dead_ally') return 'Select a fallen ally'
  return 'Select an enemy'
})

// Rotated turn order (current unit at top)
const rotatedTurnOrder = computed(() => {
  const order = battleStore.turnOrder
  const index = battleStore.currentTurnIndex
  if (order.length === 0) return []

  // Rotate array so current index is first
  const rotated = [...order.slice(index), ...order.slice(0, index)]

  // Map to include unit details
  return rotated.map((turn, i) => {
    const isCurrent = i === 0
    if (turn.type === 'hero') {
      const hero = battleStore.heroes.find(h => h.instanceId === turn.id)
      return {
        id: turn.id,
        type: 'hero',
        name: hero?.template?.name || 'Unknown',
        templateId: hero?.template?.id || null,
        rarity: hero?.template?.rarity || 1,
        isDead: hero?.currentHp <= 0,
        isCurrent
      }
    } else {
      const enemy = battleStore.enemies.find(e => e.id === turn.id)
      return {
        id: turn.id,
        type: 'enemy',
        name: enemy?.template?.name || 'Unknown',
        templateId: enemy?.template?.id || null,
        rarity: null,
        isDead: enemy?.currentHp <= 0,
        isCurrent
      }
    }
  })
})

// Start battle when component mounts
onMounted(() => {
  startCurrentBattle()

  // Show first-time combat tips based on current node
  const nodeId = questsStore.currentRun?.nodeId
  if (nodeId === 'forest_01') {
    tipsStore.showTip('combat_intro')
  } else if (nodeId === 'forest_02') {
    tipsStore.showTip('hero_inspect_intro')
  }
})

function startCurrentBattle() {
  // Check if this is a Genus Loci battle
  if (props.genusLociContext) {
    const { genusLociId, powerLevel, partyState } = props.genusLociContext
    battleStore.initBattle(partyState, [], { genusLociId, powerLevel })
    return
  }

  // Normal quest battle
  const battle = questsStore.currentBattle
  if (!battle) {
    emit('navigate', 'worldmap')
    return
  }

  const partyState = questsStore.currentRun?.partyState || {}
  battleStore.initBattle(partyState, battle.enemies)
}

// Watch for battle end
watch(() => battleStore.state, (newState) => {
  if (newState === BattleState.VICTORY) {
    handleVictory()
  } else if (newState === BattleState.DEFEAT) {
    handleDefeat()
  }
})

function handleVictory() {
  // Handle Genus Loci victory separately
  if (isGenusLociBattle.value) {
    handleGenusLociVictory()
    return
  }

  // Save party state for next battle
  const partyState = battleStore.getPartyState()

  // Check if more battles in this node
  if (currentBattleIndex.value < totalBattles.value - 1) {
    // Apply between-battle recovery
    const heroStats = {}
    for (const hero of battleStore.heroes) {
      heroStats[hero.instanceId] = hero.stats
    }
    const recoveredState = questsStore.applyBetweenBattleRecovery(partyState, heroStats)
    questsStore.updatePartyState(recoveredState)
    questsStore.advanceBattle()

    // Small delay then start next battle
    setTimeout(() => {
      battleStore.endBattle()
      startCurrentBattle()
    }, 1000)
  } else {
    // Node complete!
    rewards.value = questsStore.completeRun()
    explorationsStore.incrementFightCount()
    if (rewards.value) {
      gachaStore.addGems(rewards.value.gems)
      gachaStore.addGold(rewards.value.gold || 0)
      levelUps.value = heroesStore.addExpToParty(rewards.value.exp)
      // Capture shard drop for display
      if (rewards.value.shardDrop) {
        shardDropDisplay.value = {
          template: getHeroTemplate(rewards.value.shardDrop.templateId),
          count: rewards.value.shardDrop.count
        }
        tipsStore.showTip('shard_drop_intro')
      } else {
        shardDropDisplay.value = null
      }
    }
    displayedGems.value = 0
    displayedExp.value = 0
    displayedGold.value = 0
    displayedExpPerHero.value = 0
    showXpFloaters.value = false
    victoryStep.value = 1
    showVictoryModal.value = true
    animateRewards()
    // Show XP floaters after a short delay
    setTimeout(() => {
      showXpFloaters.value = true
    }, 300)
    // Reveal items sequentially
    revealedItemCount.value = 0
    if (rewards.value?.items?.length > 0) {
      const revealNext = () => {
        if (revealedItemCount.value < rewards.value.items.length) {
          revealedItemCount.value++
          setTimeout(revealNext, 200)
        }
      }
      setTimeout(revealNext, 800) // Start after gems/exp animate
    }
  }
}

function animateRewards() {
  if (!rewards.value) return

  const targetGems = rewards.value.gems
  const targetExp = rewards.value.exp
  const targetGold = rewards.value.gold || 0
  const duration = 1500 // 1.5 seconds
  const steps = 60
  const interval = duration / steps

  let step = 0
  const timer = setInterval(() => {
    step++
    const progress = step / steps
    // Ease out cubic for satisfying deceleration
    const eased = 1 - Math.pow(1 - progress, 3)

    displayedGems.value = Math.floor(targetGems * eased)
    displayedExp.value = Math.floor(targetExp * eased)
    displayedGold.value = Math.floor(targetGold * eased)

    if (step >= steps) {
      clearInterval(timer)
      displayedGems.value = targetGems
      displayedExp.value = targetExp
      displayedGold.value = targetGold
    }
  }, interval)
}

function handleDefeat() {
  if (!isGenusLociBattle.value) {
    questsStore.failRun()
  }

  // Pick random flavor text
  defeatFlavorText.value = DEFEAT_LINES[Math.floor(Math.random() * DEFEAT_LINES.length)]

  // Phase 1: Start battlefield fade
  defeatTimers.forEach(clearTimeout)
  defeatTimers = []
  defeatPhase.value = 'fading'

  // Phase 2: After fade completes, reveal defeat content
  const t1 = setTimeout(() => {
    defeatPhase.value = 'reveal'

    // Phase 3: Mark complete after staggered reveals finish
    const t2 = setTimeout(() => {
      defeatPhase.value = 'complete'
    }, 800)
    defeatTimers.push(t2)
  }, 1500)
  defeatTimers.push(t1)
}

function handleGenusLociVictory() {
  const meta = battleStore.genusLociMeta
  if (!meta) return

  const bossData = getGenusLoci(meta.genusLociId)
  if (!bossData) return

  // Record victory in genus loci store
  const { isFirstClear } = genusLociStore.recordVictory(meta.genusLociId, meta.powerLevel)

  // Mark quest node as completed (unlocks crest shop sections, etc.)
  const glNode = getAllQuestNodes().find(n => n.genusLociId === meta.genusLociId)
  if (glNode && !questsStore.completedNodes.includes(glNode.id)) {
    questsStore.completedNodes.push(glNode.id)
  }

  // Calculate rewards
  const baseRewards = bossData.currencyRewards?.base || {}
  const perLevelRewards = bossData.currencyRewards?.perLevel || {}

  const goldReward = (baseRewards.gold || 0) +
    (perLevelRewards.gold || 0) * (meta.powerLevel - 1)

  let gemsReward = (baseRewards.gems || 0) +
    (perLevelRewards.gems || 0) * (meta.powerLevel - 1)

  if (isFirstClear && bossData.firstClearBonus) {
    gemsReward += bossData.firstClearBonus.gems || 0
  }

  // Award currency
  if (goldReward > 0) {
    gachaStore.addGold(goldReward)
  }
  if (gemsReward > 0) {
    gachaStore.addGems(gemsReward)
  }

  // Award unique drop
  const itemsDrop = []
  if (bossData.uniqueDrop) {
    inventoryStore.addItem(bossData.uniqueDrop.itemId, 1)
    itemsDrop.push({
      item: getItem(bossData.uniqueDrop.itemId),
      count: 1
    })
  }

  // Set up rewards for display
  genusLociRewards.value = {
    gold: goldReward,
    gems: gemsReward,
    isFirstClear,
    powerLevel: meta.powerLevel,
    bossName: bossData.name,
    items: itemsDrop
  }

  // Use similar display flow as normal victory
  displayedGems.value = 0
  displayedGold.value = 0
  displayedExp.value = 0
  displayedExpPerHero.value = 0
  revealedItemCount.value = 0
  victoryStep.value = 1
  showVictoryModal.value = true
  animateGenusLociRewards()

  // Reveal items sequentially
  if (itemsDrop.length > 0) {
    const revealNext = () => {
      if (revealedItemCount.value < itemsDrop.length) {
        revealedItemCount.value++
        setTimeout(revealNext, 200)
      }
    }
    setTimeout(revealNext, 800)
  }
}

function animateGenusLociRewards() {
  if (!genusLociRewards.value) return

  const targetGold = genusLociRewards.value.gold
  const targetGems = genusLociRewards.value.gems
  const duration = 1500
  const steps = 60
  const interval = duration / steps

  let step = 0
  const timer = setInterval(() => {
    step++
    const progress = step / steps
    const eased = 1 - Math.pow(1 - progress, 3)

    displayedGold.value = Math.floor(targetGold * eased)
    displayedGems.value = Math.floor(targetGems * eased)

    if (step >= steps) {
      clearInterval(timer)
      displayedGold.value = targetGold
      displayedGems.value = targetGems
    }
  }, interval)
}

function selectAction(action) {
  battleStore.selectAction(action)
}

function openSkillPanel() {
  skillPanelOpen.value = true
}

function closeSkillPanel() {
  skillPanelOpen.value = false
}

function handleSkillSelect(index) {
  selectAction(`skill_${index}`)
  closeSkillPanel()
}

function selectEnemyTarget(enemy) {
  if (enemy.currentHp <= 0) return

  // If no action selected yet, clicking enemy executes basic attack immediately
  if (battleStore.isPlayerTurn && !battleStore.selectedAction) {
    selectAction('attack')
    // Target is this enemy, so also set target and execute
    battleStore.selectTarget(enemy.id, 'enemy')
    return
  }

  if (enemiesTargetable.value) {
    battleStore.selectTarget(enemy.id, 'enemy')
  }

  // Close skill panel when target is selected
  if (skillPanelOpen.value) {
    skillPanelOpen.value = false
  }
}

function isHeroTargetable(hero) {
  if (!alliesTargetable.value || hero.currentHp <= 0) return false
  if (battleStore.currentSkillExcludesSelf && hero.instanceId === battleStore.currentUnit?.instanceId) return false
  return true
}

function selectHeroTarget(hero) {
  if (isHeroTargetable(hero)) {
    battleStore.selectTarget(hero.instanceId, 'ally')
  }

  // Close skill panel when target is selected
  if (skillPanelOpen.value) {
    skillPanelOpen.value = false
  }
}

function selectDeadHeroTarget(hero) {
  if (deadAlliesTargetable.value && hero.currentHp <= 0) {
    battleStore.selectTarget(hero.instanceId, 'dead_ally')
  }

  // Close skill panel when target is selected
  if (skillPanelOpen.value) {
    skillPanelOpen.value = false
  }
}

function returnToMap() {
  defeatTimers.forEach(clearTimeout)
  defeatTimers = []
  defeatPhase.value = null
  explorationsStore.checkCompletions()
  battleStore.endBattle()
  emit('navigate', 'worldmap')
}

function returnHome() {
  defeatTimers.forEach(clearTimeout)
  defeatTimers = []
  defeatPhase.value = null
  explorationsStore.checkCompletions()
  battleStore.endBattle()
  emit('navigate', 'home')
}

function replayStage() {
  // Use lastVisitedNode since currentRun is null after completeRun()
  const nodeId = questsStore.lastVisitedNode
  if (!nodeId) return

  explorationsStore.checkCompletions()

  // Hide modal and reset victory state first
  showVictoryModal.value = false
  rewards.value = null
  levelUps.value = []
  victoryStep.value = 1
  shardDropDisplay.value = null

  // End current battle
  battleStore.endBattle()

  // Start fresh run after state settles
  setTimeout(() => {
    questsStore.startRun(nodeId)
    startCurrentBattle()
  }, 50)
}

function nextVictoryStep() {
  victoryStep.value = 2
  showXpFloaters.value = false
  displayedExpPerHero.value = 0
  setTimeout(() => {
    showXpFloaters.value = true
    animateExpPerHero()
  }, 300)
}

function animateExpPerHero() {
  const target = expPerHero.value
  if (target === 0) return

  const duration = 600
  const interval = 16
  const steps = Math.floor(duration / interval)
  let step = 0

  const timer = setInterval(() => {
    step++
    const progress = step / steps
    const eased = 1 - Math.pow(1 - progress, 3)
    displayedExpPerHero.value = Math.floor(target * eased)

    if (step >= steps) {
      clearInterval(timer)
      displayedExpPerHero.value = target
    }
  }, interval)
}

function prevVictoryStep() {
  victoryStep.value = 1
}

// Hero images
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroPortraits = import.meta.glob('../assets/heroes/*_portrait.png', { eager: true, import: 'default' })

// Enemy images
const enemyImages = import.meta.glob('../assets/enemies/*.png', { eager: true, import: 'default' })
const enemyPortraits = import.meta.glob('../assets/enemies/*_portrait.png', { eager: true, import: 'default' })

// Get portrait for turn order display with fallback chain
function getTurnOrderPortrait(unit) {
  const templateId = unit.templateId
  if (!templateId) return null

  if (unit.type === 'hero') {
    // Check for portrait first
    const portraitPath = `../assets/heroes/${templateId}_portrait.png`
    if (heroPortraits[portraitPath]) return heroPortraits[portraitPath]
    // Fall back to full image
    const imagePath = `../assets/heroes/${templateId}.png`
    return heroImages[imagePath] || null
  } else {
    // Check for portrait first
    const portraitPath = `../assets/enemies/${templateId}_portrait.png`
    if (enemyPortraits[portraitPath]) return enemyPortraits[portraitPath]
    // Fall back to full image
    const imagePath = `../assets/enemies/${templateId}.png`
    return enemyImages[imagePath] || null
  }
}

function getEnemyImageUrl(enemy) {
  const templateId = enemy.template?.id || enemy.templateId
  if (!templateId) return null
  const imagePath = `../assets/enemies/${templateId}.png`
  return enemyImages[imagePath] || null
}

function getEnemyImageSize(enemy) {
  const size = enemy.template?.imageSize
  if (!size) return { width: '100px', height: '100px' }
  if (typeof size === 'number') return { width: `${size}px`, height: `${size}px` }
  return {
    width: `${size.width || 100}px`,
    height: `${size.height || 100}px`
  }
}

// Battle backgrounds
const battleBackgrounds = import.meta.glob('../assets/battle_backgrounds/*.png', { eager: true, import: 'default' })

const battleBackgroundUrl = computed(() => {
  const nodeId = currentNode.value?.id || questsStore.lastVisitedNode
  if (nodeId) {
    const imagePath = `../assets/battle_backgrounds/${nodeId}.png`
    if (battleBackgrounds[imagePath]) {
      return battleBackgrounds[imagePath]
    }
  }
  // Fallback to default
  const defaultPath = '../assets/battle_backgrounds/default.png'
  return battleBackgrounds[defaultPath] || null
})

// Victory screen helpers
const partyHeroesForVictory = computed(() => {
  return heroesStore.party
    .filter(Boolean)
    .map(instanceId => heroesStore.getHeroFull(instanceId))
    .filter(Boolean)
})

const itemDropsWithData = computed(() => {
  if (!rewards.value?.items) return []
  return rewards.value.items.map(drop => ({
    ...getItem(drop.itemId),
    count: drop.count
  }))
})

function heroLeveledUp(instanceId) {
  return levelUps.value.find(lu => lu.instanceId === instanceId)
}

const expPerHero = computed(() => {
  if (!rewards.value) return 0
  const partySize = partyHeroesForVictory.value.length
  return partySize > 0 ? Math.floor(rewards.value.exp / partySize) : 0
})

function getHeroExpPercent(hero) {
  // XP required = 100 * level
  const expRequired = 100 * hero.level
  return Math.min(100, Math.floor((hero.exp / expRequired) * 100))
}

function getHeroImageUrl(hero) {
  const templateId = hero.template?.id
  if (!templateId) return null
  const imagePath = `../assets/heroes/${templateId}.png`
  return heroImages[imagePath] || null
}

// Map effect type to impact icon type
function getImpactIconType(effectType) {
  switch (effectType) {
    case 'damage': return 'attack'
    case 'heal': return 'heal'
    case 'buff': return 'buff'
    case 'debuff': return 'debuff'
    default: return 'attack'
  }
}

// Watch for combat effects and trigger visual feedback
watch(() => battleStore.combatEffects.length, () => {
  const effects = battleStore.combatEffects
  if (effects.length === 0) return

  for (const effect of effects) {
    const iconType = getImpactIconType(effect.effectType)

    // Trigger impact icon and hit effect on target
    if (effect.targetType === 'hero') {
      heroImpactIcons.value[effect.targetId] = iconType
      heroHitEffects.value[effect.targetId] = effect.effectType

      // Flip the attacking enemy when they act on a hero
      const attackingEnemy = battleStore.currentUnit
      if (attackingEnemy && !attackingEnemy.instanceId && !attackingEnemies.value[attackingEnemy.id]) {
        // It's an enemy (enemies don't have instanceId)
        attackingEnemies.value[attackingEnemy.id] = true
        setTimeout(() => {
          delete attackingEnemies.value[attackingEnemy.id]
        }, 400)
      }

      setTimeout(() => {
        delete heroHitEffects.value[effect.targetId]
        delete heroImpactIcons.value[effect.targetId]
      }, 400)
    } else if (effect.targetType === 'enemy') {
      enemyImpactIcons.value[effect.targetId] = iconType
      enemyHitEffects.value[effect.targetId] = effect.effectType
      setTimeout(() => {
        delete enemyHitEffects.value[effect.targetId]
        delete enemyImpactIcons.value[effect.targetId]
      }, 400)
    }

    // Add damage number if there's a value or it's a miss
    if (effect.value > 0 || effect.effectType === 'miss') {
      damageNumbers.value.push({
        id: effect.id,
        value: effect.value,
        type: effect.effectType,
        targetId: effect.targetId,
        targetType: effect.targetType
      })
    }
  }

  // Clear processed effects
  battleStore.clearCombatEffects()
})

// Watch for leader skill activation
watch(() => battleStore.leaderSkillActivation, (activation) => {
  if (!activation) return

  leaderActivating.value = activation.leaderId
  leaderSkillName.value = activation.skillName

  setTimeout(() => {
    leaderActivating.value = null
    leaderSkillName.value = null
    battleStore.leaderSkillActivation = null
  }, 1500)
})

// Watch for Bard Finale activation
watch(() => battleStore.finaleActivation, (activation) => {
  if (!activation) return

  finaleActivating.value = activation.bardId
  finaleName.value = activation.finaleName

  setTimeout(() => {
    finaleActivating.value = null
    finaleName.value = null
    battleStore.finaleActivation = null
  }, 1500)
})

// Watch for enemy skill activation
watch(() => battleStore.enemySkillActivation, (activation) => {
  if (!activation) return

  enemySkillDisplay.value[activation.enemyId] = activation.skillName

  setTimeout(() => {
    delete enemySkillDisplay.value[activation.enemyId]
    battleStore.enemySkillActivation = null
  }, 2000)
})

function removeDamageNumber(id) {
  damageNumbers.value = damageNumbers.value.filter(d => d.id !== id)
}

function getHeroHitEffect(instanceId) {
  return heroHitEffects.value[instanceId] || null
}

function getEnemyHitEffect(enemyId) {
  return enemyHitEffects.value[enemyId] || null
}

function isEnemyAttacking(enemyId) {
  return attackingEnemies.value[enemyId] || false
}

function showItemDetail(item) {
  selectedItem.value = item
}

function closeItemDetail() {
  selectedItem.value = null
}

function handleHeroClick(hero) {
  // If clicking same hero twice, show stats
  if (lastClickedHero.value === hero.instanceId) {
    inspectedHero.value = hero
    lastClickedHero.value = null
  } else {
    lastClickedHero.value = hero.instanceId
    // Clear after a short delay if no second click
    setTimeout(() => {
      if (lastClickedHero.value === hero.instanceId) {
        lastClickedHero.value = null
      }
    }, 500)
  }

  // Also handle ally targeting if applicable
  if (isHeroTargetable(hero)) {
    selectHeroTarget(hero)
  }

  // Handle dead ally targeting for revive skills
  if (deadAlliesTargetable.value && hero.currentHp <= 0) {
    selectDeadHeroTarget(hero)
  }
}

function closeHeroInspect() {
  inspectedHero.value = null
}

function getHeroEffectiveStats(hero) {
  if (!hero) return null
  return {
    atk: battleStore.getEffectiveStat(hero, 'atk'),
    def: battleStore.getEffectiveStat(hero, 'def'),
    spd: battleStore.getEffectiveStat(hero, 'spd')
  }
}

function getStatChange(hero, stat) {
  if (!hero) return 0
  const base = hero.stats[stat] || 0
  const effective = battleStore.getEffectiveStat(hero, stat)
  return effective - base
}
</script>

<template>
  <div class="battle-screen" :class="{ 'battle-defeat-fading': defeatPhase }">
    <!-- Turn Order Portrait Strip -->
    <aside class="turn-order-strip">
      <div
        v-for="unit in rotatedTurnOrder"
        :key="unit.id"
        :class="[
          'turn-order-entry',
          unit.type,
          { current: unit.isCurrent, dead: unit.isDead }
        ]"
      >
        <div class="portrait-wrapper">
          <img
            v-if="getTurnOrderPortrait(unit)"
            :src="getTurnOrderPortrait(unit)"
            :alt="unit.name"
            class="portrait"
          />
          <div
            v-else
            :class="['portrait-fallback', unit.type]"
          >
            <span class="fallback-icon">{{ unit.type === 'hero' ? '⚔' : '💀' }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Enemy Area -->
    <section class="enemy-area">
      <div
        v-if="battleBackgroundUrl"
        class="enemy-area-background"
        :style="{ backgroundImage: `url(${battleBackgroundUrl})` }"
      ></div>
      <div class="battle-header-overlay">
        <div class="node-info">
          <span class="node-name">{{ currentNode?.name || (questsStore.lastVisitedNode ? getQuestNode(questsStore.lastVisitedNode)?.name : 'Battle') }}</span>
          <span class="battle-progress">Battle {{ currentBattleIndex + 1 }}/{{ totalBattles }}</span>
        </div>
        <div class="round-info">
          Round {{ battleStore.roundNumber }}
        </div>
      </div>
      <div
        v-for="(enemy, enemyIndex) in battleStore.enemies"
        :key="enemy.id"
        :class="[
          'enemy-wrapper',
          { 'has-image': getEnemyImageUrl(enemy) }
        ]"
      >
        <!-- Enemy name tooltip on hover -->
        <div class="enemy-name-tooltip">{{ enemy.template?.name || enemy.name }}</div>

        <!-- Enemy skill name announcement -->
        <div v-if="enemySkillDisplay[enemy.id]" class="enemy-skill-announce">
          {{ enemySkillDisplay[enemy.id] }}
        </div>

        <!-- Enemy with image -->
        <div
          v-if="getEnemyImageUrl(enemy)"
          :class="[
            'enemy-image-display',
            { active: battleStore.currentUnit?.id === enemy.id },
            { targetable: enemiesTargetable || (battleStore.isPlayerTurn && !battleStore.selectedAction) },
            { selected: battleStore.selectedTarget?.id === enemy.id },
            { dead: enemy.currentHp <= 0 },
            { attacking: isEnemyAttacking(enemy.id) },
            getEnemyHitEffect(enemy.id) ? `hit-${getEnemyHitEffect(enemy.id)}` : ''
          ]"
          @click="selectEnemyTarget(enemy)"
        >
          <img
            :src="getEnemyImageUrl(enemy)"
            :alt="enemy.template?.name"
            class="enemy-image"
            :style="{
              animationDelay: `${enemyIndex * 1.5}s`,
              ...getEnemyImageSize(enemy)
            }"
          />
          <div class="enemy-image-stats">
            <StatBar
              :current="enemy.currentHp"
              :max="enemy.maxHp"
              color="red"
              size="sm"
            />
            <div v-if="enemy.statusEffects?.length > 0" class="enemy-image-effects">
              <div
                v-for="(effect, index) in enemy.statusEffects"
                :key="index"
                class="effect-badge"
                :class="{ buff: effect.definition?.isBuff, debuff: !effect.definition?.isBuff }"
                :title="`${effect.definition?.name} (${effect.duration} turns)`"
              >
                <span class="effect-icon">{{ effect.definition?.icon }}</span>
                <span class="effect-duration">{{ effect.duration }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Enemy without image (fallback to card) -->
        <EnemyCard
          v-else
          :enemy="enemy"
          :active="battleStore.currentUnit?.id === enemy.id"
          :targetable="enemiesTargetable || (battleStore.isPlayerTurn && !battleStore.selectedAction)"
          :selected="battleStore.selectedTarget?.id === enemy.id"
          :hitEffect="getEnemyHitEffect(enemy.id)"
          @click="selectEnemyTarget(enemy)"
        />
        <DamageNumber
          v-for="dmg in damageNumbers.filter(d => d.targetType === 'enemy' && d.targetId === enemy.id)"
          :key="dmg.id"
          :value="dmg.value"
          :type="dmg.type"
          @complete="removeDamageNumber(dmg.id)"
        />
        <ImpactIcon
          v-if="enemyImpactIcons[enemy.id]"
          :type="enemyImpactIcons[enemy.id]"
        />
      </div>
    </section>

    <!-- Hero Area -->
    <section class="hero-area">
      <div
        v-for="hero in battleStore.heroes"
        :key="hero.instanceId"
        :class="['hero-wrapper', {
          active: battleStore.currentUnit?.instanceId === hero.instanceId,
          targetable: alliesTargetable && hero.currentHp > 0 && !(battleStore.currentSkillExcludesSelf && hero.instanceId === battleStore.currentUnit?.instanceId),
          'dead-ally-targetable': deadAlliesTargetable && hero.currentHp <= 0,
          selected: battleStore.selectedTarget?.id === hero.instanceId,
          'leader-activating': leaderActivating === hero.instanceId,
          'finale-activating': finaleActivating === hero.instanceId,
          dead: hero.currentHp <= 0
        }]"
        @click="handleHeroClick(hero)"
      >
        <!-- Leader Skill Announcement -->
        <div v-if="leaderActivating === hero.instanceId" class="leader-skill-announce">
          {{ leaderSkillName }}
        </div>
        <div v-if="finaleActivating === hero.instanceId" class="finale-announce">
          {{ finaleName }}
        </div>
        <div class="hero-image-container">
          <img
            v-if="getHeroImageUrl(hero)"
            :src="getHeroImageUrl(hero)"
            :alt="hero.template?.name"
            class="hero-image"
          />
          <div v-else class="hero-image-placeholder"></div>
        </div>
        <HeroCard
          :hero="hero"
          :active="battleStore.currentUnit?.instanceId === hero.instanceId"
          :hitEffect="getHeroHitEffect(hero.instanceId)"
          showBars
          compact
        />
        <DamageNumber
          v-for="dmg in damageNumbers.filter(d => d.targetType === 'hero' && d.targetId === hero.instanceId)"
          :key="dmg.id"
          :value="dmg.value"
          :type="dmg.type"
          @complete="removeDamageNumber(dmg.id)"
        />
        <ImpactIcon
          v-if="heroImpactIcons[hero.instanceId]"
          :type="heroImpactIcons[hero.instanceId]"
        />
      </div>
    </section>

    <!-- Action Area -->
    <section v-if="battleStore.isPlayerTurn && currentHero" class="action-area">
      <ActionBar
        :heroName="currentHero.template.name"
        :classColor="heroClassColor"
        :role="heroRole"
        :hasSkills="availableSkills.length > 0"
        :isStunned="heroIsStunned"
        @open-skills="openSkillPanel"
      />
    </section>

    <!-- Skill Panel (outside action-area for proper z-index) -->
    <SkillPanel
      v-if="currentHero"
      :hero="currentHero"
      :skills="skillsForPanel"
      :isOpen="skillPanelOpen"
      :classColor="heroClassColor"
      @select-skill="handleSkillSelect"
      @close="closeSkillPanel"
    />

    <!-- Waiting indicator -->
    <section v-else-if="!battleStore.isBattleOver" class="waiting-area">
      <p v-if="battleStore.state === BattleState.ENEMY_TURN">
        Enemy turn...
      </p>
      <p v-else-if="battleStore.state === BattleState.ANIMATING">
        ...
      </p>
    </section>

    <!-- Battle Log -->
    <section class="battle-log">
      <div class="log-entries">
        <p v-for="(entry, index) in battleStore.battleLog.slice(-5)" :key="index">
          {{ entry.message }}
        </p>
      </div>
    </section>

    <!-- Victory Modal -->
    <div v-if="showVictoryModal" class="modal-overlay">
      <div class="modal victory-modal" :class="{ 'genus-loci-victory': isGenusLociBattle }">
        <h2>Victory!</h2>

        <!-- Genus Loci Victory -->
        <template v-if="isGenusLociBattle && genusLociRewards">
          <p class="node-complete genus-loci-complete">
            {{ genusLociRewards.bossName }} Defeated!
            <span v-if="genusLociRewards.isFirstClear" class="first-clear-badge">First Clear!</span>
          </p>
          <p class="power-level-badge">Power Level {{ genusLociRewards.powerLevel }}</p>

          <div class="rewards-row rewards-row-centered">
            <div v-if="genusLociRewards.gold > 0" class="reward-block reward-gold">
              <span class="reward-icon">🪙</span>
              <span class="reward-value">+{{ displayedGold }}</span>
              <span class="reward-label">Gold</span>
            </div>
            <div v-if="genusLociRewards.gems > 0" class="reward-block reward-gems">
              <span class="reward-icon">💎</span>
              <span class="reward-value">+{{ displayedGems }}</span>
              <span class="reward-label">Gems</span>
            </div>
          </div>

          <div v-if="genusLociRewards.items.length > 0" class="item-drops">
            <div class="drops-header">Unique Drop</div>
            <div class="drops-grid">
              <div
                v-for="(drop, index) in genusLociRewards.items"
                :key="drop.item.id"
                :class="['drop-item', { revealed: index < revealedItemCount }]"
                @click="showItemDetail(drop.item)"
              >
                <ItemCard :item="drop.item" compact />
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-primary" @click="returnHome">Continue</button>
          </div>
        </template>

        <!-- Normal Quest Victory -->
        <template v-else>
          <p class="node-complete">
            {{ questsStore.lastVisitedNode ? getQuestNode(questsStore.lastVisitedNode)?.name : '' }} Complete!
            <span v-if="rewards?.isFirstClear" class="first-clear-badge">First Clear!</span>
          </p>

          <div class="victory-steps-container">
            <!-- Step 1: Rewards -->
            <div :class="['victory-step', { active: victoryStep === 1 }]">
              <div v-if="rewards" class="rewards-row">
                <div class="reward-block reward-gems">
                  <span class="reward-icon">💎</span>
                  <span class="reward-value">+{{ displayedGems }}</span>
                  <span class="reward-label">Gems</span>
                </div>
                <div class="reward-block reward-gold">
                  <span class="reward-icon">🪙</span>
                  <span class="reward-value">+{{ displayedGold }}</span>
                  <span class="reward-label">Gold</span>
                </div>
                <div class="reward-block reward-exp">
                  <span class="reward-icon">⭐</span>
                  <span class="reward-value">+{{ displayedExp }}</span>
                  <span class="reward-label">EXP</span>
                </div>
              </div>

              <div v-if="itemDropsWithData.length > 0" class="item-drops">
                <div class="drops-header">Items Found</div>
                <div class="drops-grid">
                  <div
                    v-for="(item, index) in itemDropsWithData"
                    :key="item.id"
                    :class="['drop-item', { revealed: index < revealedItemCount }]"
                    @click="showItemDetail(item)"
                  >
                    <ItemCard :item="item" compact />
                  </div>
                </div>
              </div>

              <!-- Shard Drop -->
              <div v-if="shardDropDisplay" class="shard-drop-section">
                <div class="shard-drop">
                  <span class="shard-icon">💎</span>
                  <span class="shard-hero">{{ shardDropDisplay.template.name }}</span>
                  <span class="shard-count">x{{ shardDropDisplay.count }}</span>
                </div>
              </div>

              <button class="btn-next" @click="nextVictoryStep">
                Party Results →
              </button>
            </div>

            <!-- Step 2: XP & Level Ups -->
            <div :class="['victory-step', { active: victoryStep === 2 }]">
              <div class="step-header-fancy">
                <span class="step-header-icon">⚔️</span>
                <span>Your Heroes Grew!</span>
              </div>
              <div class="victory-party">
                <div
                  v-for="(hero, index) in partyHeroesForVictory"
                  :key="hero.instanceId"
                  :class="['victory-hero-card', { 'leveled-up': heroLeveledUp(hero.instanceId) }]"
                  :style="{ '--reveal-delay': `${index * 100}ms` }"
                >
                  <div class="hero-portrait-wrap">
                    <HeroCard :hero="hero" compact />
                    <div v-if="heroLeveledUp(hero.instanceId)" class="level-up-burst">✦</div>
                  </div>
                  <div class="hero-growth-info">
                    <div class="hero-name-small">{{ hero.name }}</div>
                    <div v-if="heroLeveledUp(hero.instanceId)" class="level-transition">
                      <span class="old-level">Lv {{ heroLeveledUp(hero.instanceId).oldLevel }}</span>
                      <span class="level-arrow">→</span>
                      <span class="new-level">Lv {{ heroLeveledUp(hero.instanceId).newLevel }}</span>
                    </div>
                    <div v-else class="xp-progress-row">
                      <div class="xp-progress-bar">
                        <div class="xp-progress-fill" :style="{ width: getHeroExpPercent(hero) + '%' }"></div>
                      </div>
                      <span class="xp-progress-label">+{{ displayedExpPerHero }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button class="btn-back" @click="prevVictoryStep">
                ← Rewards
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-primary btn-full" @click="returnToMap">Continue</button>
            <button v-if="rewards && !rewards.isFirstClear" class="btn-text" @click="replayStage">Replay Battle</button>
          </div>
        </template>
      </div>
    </div>

    <!-- Item Detail Dialog -->
    <div v-if="selectedItem" class="item-dialog-overlay" @click="closeItemDetail">
      <div class="item-dialog" @click.stop>
        <button class="item-dialog-close" @click="closeItemDetail">×</button>
        <div class="item-dialog-header">
          <span class="item-dialog-name">{{ selectedItem.name }}</span>
          <span class="item-dialog-stars">{{ '★'.repeat(selectedItem.rarity) }}</span>
        </div>
        <p class="item-dialog-description">{{ selectedItem.description }}</p>
        <div class="item-dialog-stats">
          <div v-if="selectedItem.xpValue" class="item-stat">
            <span class="stat-label">XP Value</span>
            <span class="stat-value">+{{ selectedItem.xpValue }}</span>
          </div>
          <div v-if="selectedItem.sellReward?.gems" class="item-stat">
            <span class="stat-label">Sell Value</span>
            <span class="stat-value">💎 {{ selectedItem.sellReward.gems }}</span>
          </div>
          <div v-if="selectedItem.sellReward?.gold" class="item-stat">
            <span class="stat-label">Sell Value</span>
            <span class="stat-value sell-gold">🪙 {{ selectedItem.sellReward.gold }}</span>
          </div>
          <div v-if="selectedItem.count > 1" class="item-stat">
            <span class="stat-label">Quantity</span>
            <span class="stat-value">×{{ selectedItem.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Hero Inspect Dialog -->
    <div v-if="inspectedHero" class="hero-inspect-overlay" @click="closeHeroInspect">
      <div class="hero-inspect-dialog" @click.stop>
        <button class="hero-inspect-close" @click="closeHeroInspect">×</button>

        <div class="hero-inspect-header">
          <span class="hero-inspect-name">{{ inspectedHero.template?.name }}</span>
          <span class="hero-inspect-level">Lv. {{ inspectedHero.level }}</span>
        </div>

        <div class="hero-inspect-bars">
          <div class="inspect-bar-row">
            <span class="bar-label">HP</span>
            <StatBar
              :current="inspectedHero.currentHp"
              :max="inspectedHero.maxHp"
              color="green"
              size="md"
            />
            <span class="bar-numbers">{{ inspectedHero.currentHp }} / {{ inspectedHero.maxHp }}</span>
          </div>
          <div v-if="isInspectedHeroRanger" class="inspect-bar-row">
            <span class="bar-label">Focus</span>
            <FocusIndicator :hasFocus="inspectedHero.hasFocus" size="md" />
          </div>
          <div v-else-if="isInspectedHeroKnight" class="inspect-bar-row">
            <span class="bar-label">Valor</span>
            <ValorBar :currentValor="inspectedHero.currentValor || 0" size="md" />
          </div>
          <div v-else-if="isInspectedHeroBerserker" class="inspect-bar-row">
            <span class="bar-label">Rage</span>
            <RageBar :currentRage="inspectedHero.currentRage || 0" size="md" />
          </div>
          <div v-else-if="isInspectedHeroBard" class="inspect-bar-row">
            <span class="bar-label">Verse</span>
            <VerseIndicator :currentVerses="inspectedHero.currentVerses || 0" size="md" />
          </div>
          <div v-else class="inspect-bar-row">
            <span class="bar-label">{{ inspectedHero.class?.resourceName || 'MP' }}</span>
            <StatBar
              :current="inspectedHero.currentMp"
              :max="inspectedHero.maxMp"
              color="blue"
              size="md"
            />
            <span class="bar-numbers">{{ inspectedHero.currentMp }} / {{ inspectedHero.maxMp }}</span>
          </div>
        </div>

        <div class="hero-inspect-stats">
          <div class="inspect-stat">
            <span class="inspect-stat-label">ATK</span>
            <span :class="['inspect-stat-value', { buffed: getStatChange(inspectedHero, 'atk') > 0, debuffed: getStatChange(inspectedHero, 'atk') < 0 }]">
              {{ getHeroEffectiveStats(inspectedHero)?.atk }}
              <span v-if="getStatChange(inspectedHero, 'atk') !== 0" class="stat-change">
                ({{ getStatChange(inspectedHero, 'atk') > 0 ? '+' : '' }}{{ getStatChange(inspectedHero, 'atk') }})
              </span>
            </span>
          </div>
          <div class="inspect-stat">
            <span class="inspect-stat-label">DEF</span>
            <span :class="['inspect-stat-value', { buffed: getStatChange(inspectedHero, 'def') > 0, debuffed: getStatChange(inspectedHero, 'def') < 0 }]">
              {{ getHeroEffectiveStats(inspectedHero)?.def }}
              <span v-if="getStatChange(inspectedHero, 'def') !== 0" class="stat-change">
                ({{ getStatChange(inspectedHero, 'def') > 0 ? '+' : '' }}{{ getStatChange(inspectedHero, 'def') }})
              </span>
            </span>
          </div>
          <div class="inspect-stat">
            <span class="inspect-stat-label">SPD</span>
            <span :class="['inspect-stat-value', { buffed: getStatChange(inspectedHero, 'spd') > 0, debuffed: getStatChange(inspectedHero, 'spd') < 0 }]">
              {{ getHeroEffectiveStats(inspectedHero)?.spd }}
              <span v-if="getStatChange(inspectedHero, 'spd') !== 0" class="stat-change">
                ({{ getStatChange(inspectedHero, 'spd') > 0 ? '+' : '' }}{{ getStatChange(inspectedHero, 'spd') }})
              </span>
            </span>
          </div>
        </div>

        <div v-if="inspectedHero.statusEffects?.length > 0" class="hero-inspect-effects">
          <div class="effects-header">Status Effects</div>
          <div class="effects-list">
            <div
              v-for="(effect, index) in inspectedHero.statusEffects"
              :key="index"
              :class="['effect-item', 'effect-clickable', { buff: effect.definition?.isBuff, debuff: !effect.definition?.isBuff }]"
              @click.stop="showEffectTooltip($event, getEffectTooltipText(effect))"
            >
              <span class="effect-icon">{{ effect.definition?.icon }}</span>
              <span class="effect-name">{{ effect.definition?.name }}</span>
              <span class="effect-duration">{{ effect.duration }} turns</span>
            </div>
          </div>
        </div>
        <div v-else class="hero-inspect-no-effects">
          No active effects
        </div>
      </div>
    </div>
  </div>

  <!-- Defeat Scene (outside battle-screen to avoid grayscale filter) -->
  <div v-if="defeatPhase" class="defeat-scene">
    <!-- Genus Loci: Boss portrait looming above -->
    <div v-if="isGenusLociBattle && genusLociPortraitUrl" class="defeat-boss-portrait"
         :class="{ visible: defeatPhase !== 'fading' }">
      <img :src="genusLociPortraitUrl" :alt="currentGenusLociName" />
    </div>

    <!-- Fallen party -->
    <div class="defeat-fallen-party" :class="{ visible: defeatPhase !== 'fading' }">
      <div
        v-for="(hero, index) in battleStore.heroes"
        :key="hero.instanceId"
        class="fallen-hero"
        :style="{ '--tilt': (index % 2 === 0 ? (-3 - index) : (3 + index)) + 'deg' }"
      >
        <img
          v-if="getHeroImageUrl(hero)"
          :src="getHeroImageUrl(hero)"
          :alt="hero.template?.name"
          class="fallen-hero-img"
        />
        <div v-else class="fallen-hero-placeholder">
          {{ hero.template?.name?.[0] || '?' }}
        </div>
      </div>
    </div>

    <!-- Defeat text -->
    <div class="defeat-text" :class="{ visible: defeatPhase === 'reveal' || defeatPhase === 'complete' }">
      <h2 class="defeat-heading">DEFEAT</h2>
      <p class="defeat-flavor">
        <template v-if="isGenusLociBattle">
          {{ currentGenusLociName }} stands victorious.
        </template>
        <template v-else>
          {{ defeatFlavorText }}
        </template>
      </p>
    </div>

    <!-- Actions -->
    <div class="defeat-actions" :class="{ visible: defeatPhase === 'complete' }">
      <button class="defeat-btn-primary" @click="returnToMap">Try Again</button>
      <button class="defeat-btn-secondary" @click="returnHome">Home</button>
    </div>
  </div>
</template>

<style scoped>
.battle-screen {
  min-height: 100vh;
  padding: 16px;
  padding-left: 70px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: filter 1.5s ease-out;
}

.battle-defeat-fading {
  filter: grayscale(1) brightness(0.3);
}

/* Turn Order Portrait Strip */
.turn-order-strip {
  position: fixed;
  left: 12px;
  top: 16px;
  width: 50px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 50;
}

.turn-order-entry {
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.turn-order-entry.current {
  transform: translateX(8px);
}

.portrait-wrapper {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

/* Hero/Enemy border colors */
.turn-order-entry.hero .portrait-wrapper {
  border-color: #3b82f6;
}

.turn-order-entry.enemy .portrait-wrapper {
  border-color: #ef4444;
}

/* Current unit styling */
.turn-order-entry.current .portrait-wrapper {
  border-color: #fbbf24;
  transform: scale(1.1);
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
}

.turn-order-entry.current::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 40px;
  background: rgba(251, 191, 36, 0.15);
  border-radius: 20px;
  z-index: -1;
}

/* Dead unit styling */
.turn-order-entry.dead .portrait-wrapper {
  filter: grayscale(100%);
  opacity: 0.5;
}

/* Portrait image */
.portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

/* Fallback when no image */
.portrait-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.portrait-fallback.hero {
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
}

.portrait-fallback.enemy {
  background: linear-gradient(135deg, #5f1e1e 0%, #dc2626 100%);
}

.fallback-icon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

/* Battle Header Overlay (inside enemy area) */
.battle-header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px 10px 12px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 60%, transparent 100%);
  border-radius: 12px 12px 0 0;
  z-index: 0;
}

.node-info {
  display: flex;
  flex-direction: column;
}

.node-name {
  font-weight: 600;
  color: #f3f4f6;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.battle-progress {
  font-size: 0.8rem;
  color: #9ca3af;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.round-info {
  padding: 4px 10px;
  border-radius: 6px;
  color: #d1d5db;
  font-size: 0.85rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.enemy-area {
  position: relative;
  display: flex;
  justify-content: center;
  align-content: center;
  gap: 12px;
  padding: 40px 20px 100px 20px;
  flex-wrap: wrap;
  height: 450px;
  border-radius: 12px;
  overflow: visible;
}

.enemy-area-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  z-index: 0;
  opacity: 0.7;
}

.enemy-wrapper {
  position: relative;
  z-index: 1;
}

.enemy-name-tooltip {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  background: rgba(0, 0, 0, 0.85);
  color: #f3f4f6;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 100;
  border: 1px solid #4b5563;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.enemy-wrapper:hover .enemy-name-tooltip {
  opacity: 1;
}

.enemy-skill-announce {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.85rem;
  font-weight: 700;
  color: #e2e8f0;
  text-shadow: 0 0 8px rgba(148, 163, 184, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8);
  z-index: 30;
  animation: enemySkillFloat 2s ease-out forwards;
  pointer-events: none;
  user-select: none;
}

@keyframes enemySkillFloat {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
  10% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  70% {
    opacity: 1;
    transform: translateX(-50%) translateY(-8px);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}

/* Enemy Image Display */
.enemy-image-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  user-select: none;
}

.enemy-image-display.targetable {
  cursor: pointer;
}

.enemy-image-display.targetable:hover {
  border-color: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

.enemy-image-display.selected {
  border-color: #ef4444;
}

.enemy-image-display.active {
  border-color: #fbbf24;
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.4);
}

.enemy-image-display.dead {
  opacity: 0.4;
  cursor: not-allowed;
}

.enemy-image-display.attacking {
  animation: enemyAttackFlip 0.4s ease-out;
}

@keyframes enemyAttackFlip {
  0% { transform: scaleX(1); }
  30% { transform: scaleX(-1) translateX(10px); }
  70% { transform: scaleX(-1) translateX(10px); }
  100% { transform: scaleX(1); }
}

.enemy-image {
  object-fit: contain;
  image-rendering: pixelated;
  animation: enemyIdle 6s ease-in-out infinite;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
}

.enemy-image-display.attacking .enemy-image,
.enemy-image-display.dead .enemy-image {
  animation: none;
}

@keyframes enemyIdle {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-2px, 1px); }
  50% { transform: translate(1px, -2px); }
  75% { transform: translate(2px, 1px); }
}

.enemy-image-stats {
  width: 100%;
  margin-top: 8px;
}

.enemy-image-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
  justify-content: center;
}

.enemy-image-display .effect-badge {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.enemy-image-display .effect-badge.buff {
  border: 1px solid rgba(34, 197, 94, 0.5);
  background-color: rgba(34, 197, 94, 0.2);
}

.enemy-image-display .effect-badge.debuff {
  border: 1px solid rgba(239, 68, 68, 0.5);
  background-color: rgba(239, 68, 68, 0.2);
}

.enemy-image-display .effect-icon {
  font-size: 0.8rem;
}

.enemy-image-display .effect-duration {
  color: #d1d5db;
  font-size: 0.65rem;
  font-weight: 600;
}

/* Hit Effects for enemy images */
.enemy-image-display.hit-damage {
  animation: hitDamage 0.3s ease-out;
}

.enemy-image-display.hit-heal {
  animation: hitHeal 0.4s ease-out;
}

.enemy-image-display.hit-buff {
  animation: hitBuff 0.4s ease-out;
}

.enemy-image-display.hit-debuff {
  animation: hitDebuff 0.3s ease-out;
}

@keyframes hitDamage {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(-4px); background-color: rgba(239, 68, 68, 0.3); }
  30% { transform: translateX(4px); }
  50% { transform: translateX(-3px); }
  70% { transform: translateX(2px); }
  90% { transform: translateX(-1px); }
}

@keyframes hitHeal {
  0% { box-shadow: inset 0 0 0 rgba(34, 197, 94, 0); }
  50% { box-shadow: inset 0 0 20px rgba(34, 197, 94, 0.4); }
  100% { box-shadow: inset 0 0 0 rgba(34, 197, 94, 0); }
}

@keyframes hitBuff {
  0% { box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
  50% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.6); }
  100% { box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
}

@keyframes hitDebuff {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(168, 85, 247, 0.3); }
}

.battle-log {
  background: #1f2937;
  border-radius: 8px;
  padding: 12px;
  min-height: 80px;
  max-height: 100px;
  overflow-y: auto;
}

.log-entries {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-entries p {
  margin: 0;
  font-size: 0.85rem;
  color: #9ca3af;
}

.log-entries p:last-child {
  color: #f3f4f6;
}

.hero-area {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  flex-wrap: nowrap;
  margin-top: -90px;
  position: relative;
  z-index: 2;
}

.hero-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.hero-wrapper.active {
  transform: translateY(-12px);
}

.hero-wrapper.active .hero-image-container {
  height: 85px;
}

.hero-image-container {
  width: 100px;
  height: 67px; /* Shows top 2/3 of a 100x100 image */
  overflow: hidden;
  border-radius: 8px 8px 0 0;
  transition: transform 0.2s ease, height 0.2s ease;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
}

.hero-image {
  width: 100%;
  height: auto;
  display: block;
}

.hero-image-placeholder {
  width: 100%;
  height: 100%;
  background: #374151;
}

.hero-wrapper.dead .hero-image-container {
  filter: grayscale(100%) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
  opacity: 0.6;
}

.hero-wrapper.targetable {
  cursor: pointer;
  box-shadow: 0 0 0 2px transparent;
}

.hero-wrapper.targetable:hover {
  box-shadow: 0 0 0 2px #22c55e;
  transform: translateY(-2px);
}

.hero-wrapper.selected {
  box-shadow: 0 0 0 2px #22c55e;
}

/* Dead ally targeting for revive skills */
.hero-wrapper.dead-ally-targetable {
  cursor: pointer;
  box-shadow: 0 0 0 2px transparent;
  opacity: 0.7;
  filter: grayscale(50%);
}

.hero-wrapper.dead-ally-targetable:hover {
  box-shadow: 0 0 0 2px #a855f7;
  transform: translateY(-2px);
  opacity: 0.9;
  filter: grayscale(30%);
}

.hero-wrapper.dead-ally-targetable.selected {
  box-shadow: 0 0 0 2px #a855f7;
  opacity: 0.9;
}

.action-area {
  margin-top: auto;
  padding: 16px;
  background: #1f2937;
  border-radius: 12px;
}

.action-prompt {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #9ca3af;
  font-size: 0.9rem;
}

.action-prompt span:first-child {
  color: #f3f4f6;
  font-weight: 600;
}

.waiting-area {
  margin-top: auto;
  text-align: center;
  padding: 24px;
  color: #6b7280;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
  animation: overlayFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes overlayFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal {
  background: #1f2937;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.victory-steps-container {
  display: grid;
}

.victory-step {
  grid-row: 1;
  grid-column: 1;
  display: flex;
  flex-direction: column;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.victory-step.active {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
}

.step-header {
  font-size: 1rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-next,
.btn-back {
  display: block;
  width: 100%;
  padding: 12px;
  margin-top: auto;
  flex-shrink: 0;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-next:hover,
.btn-back:hover {
  background: #374151;
  color: #f3f4f6;
  border-color: #6b7280;
}

.modal h2 {
  margin: 0 0 8px 0;
  font-size: 2rem;
}

.victory-modal h2 {
  color: #22c55e;
  animation: victoryBurst 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes victoryBurst {
  0% {
    opacity: 0;
    transform: scale(0.7);
    text-shadow: 0 0 0 transparent;
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
    text-shadow:
      0 0 20px rgba(251, 191, 36, 0.8),
      0 0 40px rgba(251, 191, 36, 0.4);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    text-shadow:
      0 0 8px rgba(34, 197, 94, 0.4),
      0 0 16px rgba(34, 197, 94, 0.2);
  }
}

.victory-modal.genus-loci-victory h2 {
  color: #9333ea;
  animation: victoryBurstPurple 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes victoryBurstPurple {
  0% {
    opacity: 0;
    transform: scale(0.7);
    text-shadow: 0 0 0 transparent;
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
    text-shadow:
      0 0 20px rgba(251, 191, 36, 0.8),
      0 0 40px rgba(251, 191, 36, 0.4);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    text-shadow:
      0 0 8px rgba(147, 51, 234, 0.5),
      0 0 16px rgba(147, 51, 234, 0.25);
  }
}

.genus-loci-complete {
  color: #c084fc;
}

.power-level-badge {
  display: inline-block;
  background: linear-gradient(135deg, #9333ea 0%, #6b21a8 100%);
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 16px;
  margin-bottom: 16px;
}

.node-complete {
  color: #9ca3af;
  margin-bottom: 24px;
}

/* Rewards - Bold trophy display */
.rewards-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.rewards-row-centered {
  justify-content: center;
}

.reward-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.reward-icon {
  font-size: 1.8rem;
  line-height: 1;
  margin-bottom: 4px;
}

.reward-value {
  font-weight: 800;
  font-size: 1.4rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.reward-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
  margin-top: 2px;
}

/* Gem rewards - blue */
.reward-gems .reward-value {
  color: #60a5fa;
}
.reward-gems {
  background: rgba(96, 165, 250, 0.08);
}

/* Gold rewards - amber */
.reward-gold .reward-value {
  color: #fbbf24;
}
.reward-gold {
  background: rgba(251, 191, 36, 0.08);
}

/* EXP rewards - green */
.reward-exp .reward-value {
  color: #4ade80;
}
.reward-exp {
  background: rgba(74, 222, 128, 0.08);
}

.first-clear-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 10px;
  animation: firstClearGlow 1.5s ease-in-out infinite;
}

@keyframes firstClearGlow {
  0%, 100% {
    box-shadow: 0 0 4px rgba(251, 191, 36, 0.4);
  }
  50% {
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.8);
  }
}

/* Step header with personality */
.step-header-fancy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 16px;
}

.step-header-icon {
  font-size: 1.2rem;
}

/* Victory party - hero cards with growth info */
.victory-party {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.victory-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0;
  animation: heroReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: var(--reveal-delay, 0ms);
}

@keyframes heroReveal {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Leveled up heroes get promoted */
.victory-hero-card.leveled-up {
  animation: heroRevealLevelUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: var(--reveal-delay, 0ms);
}

@keyframes heroRevealLevelUp {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1.08);
  }
}

.hero-portrait-wrap {
  position: relative;
}

/* Level up burst star */
.level-up-burst {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 1.4rem;
  color: #fbbf24;
  animation: burstSpin 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: var(--reveal-delay, 0ms);
  filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.8));
}

@keyframes burstSpin {
  from {
    opacity: 0;
    transform: scale(0) rotate(-180deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* Hero growth info below card */
.hero-growth-info {
  text-align: center;
  min-width: 70px;
}

.hero-name-small {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

/* Level transition for leveled heroes */
.level-transition {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 700;
  font-size: 0.85rem;
}

.old-level {
  color: #6b7280;
}

.level-arrow {
  color: #fbbf24;
  animation: arrowPulse 0.4s ease-out;
}

@keyframes arrowPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.new-level {
  color: #fbbf24;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
}

/* XP progress for non-leveled heroes */
.xp-progress-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.xp-progress-bar {
  width: 50px;
  height: 4px;
  background: #374151;
  border-radius: 2px;
  overflow: hidden;
}

.xp-progress-fill {
  height: 100%;
  background: #4ade80;
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.xp-progress-label {
  font-size: 0.65rem;
  color: #4ade80;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #374151;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #374151;
  color: #f3f4f6;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-full {
  flex: none;
  width: 100%;
}

.btn-text {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 0.9rem;
  padding: 8px;
  cursor: pointer;
  transition: color 0.15s ease;
}

.btn-text:hover {
  color: #d1d5db;
}

/* ===== Leader Skill Activation ===== */
.hero-wrapper.leader-activating {
  animation: leaderGlow 1.5s ease-out;
  z-index: 20;
}

@keyframes leaderGlow {
  0% {
    filter: drop-shadow(0 0 0 transparent);
    transform: scale(1);
  }
  30% {
    filter: drop-shadow(0 0 20px #f59e0b) drop-shadow(0 0 40px #f59e0b);
    transform: scale(1.05);
  }
  70% {
    filter: drop-shadow(0 0 15px #f59e0b) drop-shadow(0 0 30px #f59e0b);
    transform: scale(1.03);
  }
  100% {
    filter: drop-shadow(0 0 0 transparent);
    transform: scale(1);
  }
}

.leader-skill-announce {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 0 10px #f59e0b, 0 2px 4px rgba(0, 0, 0, 0.8);
  z-index: 30;
  animation: skillNameFloat 1.5s ease-out forwards;
  pointer-events: none;
  user-select: none;
}

@keyframes skillNameFloat {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  15% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  70% {
    opacity: 1;
    transform: translateX(-50%) translateY(-15px);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-30px);
  }
}

/* ===== Item Drops ===== */
.item-drops {
  margin-bottom: 16px;
}

.drops-header {
  font-size: 0.8rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.drops-grid {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.drop-item {
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
}

.drop-item.revealed {
  opacity: 1;
  transform: scale(1);
  animation: itemPop 0.3s ease;
}

@keyframes itemPop {
  0% { transform: scale(0.5); }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* ===== Shard Drop ===== */
.shard-drop-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #374151;
}

.shard-drop {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #1f2937, #2a2340);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #a855f7;
}

.shard-icon {
  font-size: 1.25rem;
}

.shard-hero {
  flex: 1;
  color: #a855f7;
  font-weight: 500;
}

.shard-count {
  color: #a855f7;
}

/* ===== Item Detail Dialog ===== */
.item-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.item-dialog {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 12px;
  padding: 20px;
  min-width: 280px;
  max-width: 320px;
  border: 1px solid #374151;
  position: relative;
}

.item-dialog-close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 4px 8px;
}

.item-dialog-close:hover {
  color: #f3f4f6;
}

.item-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.item-dialog-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
}

.item-dialog-stars {
  color: #f59e0b;
  font-size: 0.9rem;
}

.item-dialog-description {
  color: #d1d5db;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 12px 0 16px 0;
  font-style: italic;
}

.item-dialog-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #374151;
}

.item-stat {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.stat-label {
  color: #9ca3af;
}

.stat-value {
  color: #22c55e;
  font-weight: 600;
}

.stat-value.sell-gold {
  color: #f59e0b;
}

.drop-item {
  cursor: pointer;
}

.drop-item:hover {
  transform: scale(1.05);
}

/* ===== Hero Inspect Dialog ===== */
.hero-inspect-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.hero-inspect-dialog {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 12px;
  padding: 20px;
  min-width: 300px;
  max-width: 360px;
  border: 1px solid #374151;
  position: relative;
}

.hero-inspect-close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 4px 8px;
}

.hero-inspect-close:hover {
  color: #f3f4f6;
}

.hero-inspect-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #374151;
}

.hero-inspect-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f3f4f6;
}

.hero-inspect-level {
  font-size: 0.9rem;
  color: #9ca3af;
  background: #374151;
  padding: 4px 10px;
  border-radius: 12px;
}

.hero-inspect-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.inspect-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-label {
  width: 30px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
}

.inspect-bar-row .stat-bar {
  flex: 1;
}

.bar-numbers {
  font-size: 0.8rem;
  color: #d1d5db;
  min-width: 70px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.hero-inspect-stats {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.inspect-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.inspect-stat-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.inspect-stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
}

.inspect-stat-value.buffed {
  color: #22c55e;
}

.inspect-stat-value.debuffed {
  color: #ef4444;
}

.stat-change {
  font-size: 0.75rem;
  font-weight: 500;
}

.hero-inspect-effects {
  border-top: 1px solid #374151;
  padding-top: 12px;
  user-select: none;
}

.effects-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.effect-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.effect-item.buff {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.effect-item.debuff {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.effect-icon {
  font-size: 1.1rem;
}

.effect-name {
  flex: 1;
  color: #f3f4f6;
  font-weight: 500;
}

.effect-clickable {
  cursor: pointer;
  transition: background 0.15s ease;
}

.effect-clickable:active {
  opacity: 0.7;
}

.effect-duration {
  color: #9ca3af;
  font-size: 0.75rem;
}

.hero-inspect-no-effects {
  text-align: center;
  color: #6b7280;
  font-size: 0.85rem;
  padding: 12px;
  border-top: 1px solid #374151;
  margin-top: 12px;
}

/* ===== Bard Finale Activation ===== */
.hero-wrapper.finale-activating {
  animation: finaleGlow 1.5s ease-out;
  z-index: 20;
}

@keyframes finaleGlow {
  0% {
    filter: drop-shadow(0 0 0 transparent);
    transform: scale(1);
  }
  30% {
    filter: drop-shadow(0 0 20px #fbbf24) drop-shadow(0 0 40px #fbbf24);
    transform: scale(1.05);
  }
  70% {
    filter: drop-shadow(0 0 15px #fbbf24) drop-shadow(0 0 30px #fbbf24);
    transform: scale(1.03);
  }
  100% {
    filter: drop-shadow(0 0 0 transparent);
    transform: scale(1);
  }
}

.finale-announce {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 0 10px #f59e0b, 0 2px 4px rgba(0, 0, 0, 0.8);
  z-index: 30;
  animation: finaleNameFloat 1.5s ease-out forwards;
  pointer-events: none;
  user-select: none;
}

@keyframes finaleNameFloat {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  15% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-15px);
  }
}

/* ===== Defeat Scene ===== */
.defeat-scene {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 20px;
  user-select: none;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.85) 100%);
}

/* Genus Loci boss portrait */
.defeat-boss-portrait {
  opacity: 0;
  transition: opacity 0.6s ease-out;
}

.defeat-boss-portrait.visible {
  opacity: 1;
}

.defeat-boss-portrait img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  box-shadow: 0 0 40px rgba(153, 27, 27, 0.5);
}

/* Fallen heroes */
.defeat-fallen-party {
  display: flex;
  gap: 8px;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.6s ease-out;
}

.defeat-fallen-party.visible {
  opacity: 1;
}

.fallen-hero {
  filter: grayscale(1);
  opacity: 0.6;
  transform: rotate(var(--tilt, 0deg));
}

.fallen-hero-img {
  width: 72px;
  height: auto;
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
}

.fallen-hero-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  background: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #6b7280;
}

/* Defeat text */
.defeat-text {
  text-align: center;
  opacity: 0;
  transition: opacity 0.5s ease-out 0.2s;
}

.defeat-text.visible {
  opacity: 1;
}

.defeat-heading {
  color: #b91c1c;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 8px 0;
}

.defeat-flavor {
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 0;
}

/* Action buttons */
.defeat-actions {
  display: flex;
  gap: 12px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease-out 0.3s;
}

.defeat-actions.visible {
  opacity: 1;
  pointer-events: auto;
}

.defeat-btn-primary {
  padding: 10px 24px;
  border: 1px solid #6b7280;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.defeat-btn-primary:hover {
  background: #374151;
  color: #f3f4f6;
  border-color: #9ca3af;
}

.defeat-btn-secondary {
  padding: 10px 24px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.defeat-btn-secondary:hover {
  background: #1f2937;
  color: #9ca3af;
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .modal-overlay {
    animation: none;
    opacity: 1;
  }
  .modal {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .victory-modal h2,
  .victory-modal.genus-loci-victory h2 {
    animation: none;
    opacity: 1;
    transform: none;
    text-shadow:
      0 0 8px rgba(34, 197, 94, 0.4),
      0 0 16px rgba(34, 197, 94, 0.2);
  }
  .victory-modal.genus-loci-victory h2 {
    text-shadow:
      0 0 8px rgba(147, 51, 234, 0.5),
      0 0 16px rgba(147, 51, 234, 0.25);
  }
  .victory-hero-card,
  .victory-hero-card.leveled-up {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .victory-hero-card.leveled-up {
    transform: scale(1.08);
  }
  .level-up-burst {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .level-arrow {
    animation: none;
  }
}
</style>
