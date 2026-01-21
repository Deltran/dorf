<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useBattleStore, useQuestsStore, useHeroesStore, useGachaStore, BattleState } from '../stores'
import HeroCard from '../components/HeroCard.vue'
import EnemyCard from '../components/EnemyCard.vue'
import ActionButton from '../components/ActionButton.vue'
import DamageNumber from '../components/DamageNumber.vue'
import ImpactIcon from '../components/ImpactIcon.vue'
import StatBar from '../components/StatBar.vue'
import ItemCard from '../components/ItemCard.vue'
import FocusIndicator from '../components/FocusIndicator.vue'
import ValorBar from '../components/ValorBar.vue'
import RageBar from '../components/RageBar.vue'
import { getItem } from '../data/items.js'
import { getQuestNode } from '../data/questNodes.js'
import { getHeroTemplate } from '../data/heroTemplates.js'

const emit = defineEmits(['navigate', 'battleEnd'])

const battleStore = useBattleStore()
const questsStore = useQuestsStore()
const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()

const showVictoryModal = ref(false)
const showDefeatModal = ref(false)
const rewards = ref(null)
const levelUps = ref([])
const displayedGems = ref(0)
const displayedExp = ref(0)
const displayedGold = ref(0)
const showXpFloaters = ref(false)
const revealedItemCount = ref(0)
const selectedItem = ref(null) // For item detail popup
const victoryStep = ref(1) // 1 = rewards, 2 = xp/level ups
const shardDropDisplay = ref(null) // For displaying shard drops in victory
const inspectedHero = ref(null) // For hero stats popup
const lastClickedHero = ref(null) // Track for double-click detection

// Combat visual effects
const damageNumbers = ref([])
const heroHitEffects = ref({}) // { instanceId: 'damage' | 'heal' | 'buff' | 'debuff' }
const enemyHitEffects = ref({}) // { id: 'damage' | 'heal' | 'buff' | 'debuff' }
const heroImpactIcons = ref({}) // { instanceId: 'attack' | 'magic' | 'heal' | ... }
const enemyImpactIcons = ref({}) // { id: 'attack' | 'magic' | 'heal' | ... }
const attackingEnemies = ref({}) // { id: true } - enemies currently in attack animation
const leaderActivating = ref(null) // instanceId of leader during skill activation
const leaderSkillName = ref(null) // name of activating leader skill

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

// Helper functions for skill display
function getSkillDescription(skill) {
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
  return currentHero.value?.class?.resourceName
}

// Check if a specific skill can be used (has enough MP, Focus, or Valor)
function canUseSkill(skill) {
  if (!currentHero.value || !skill) return false

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

  return currentHero.value.currentMp >= skill.mpCost
}

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

// Prompt text based on current state
const targetPrompt = computed(() => {
  if (!battleStore.selectedAction) return 'Choose an action'
  if (!battleStore.needsTargetSelection) return 'Executing...'
  if (battleStore.currentTargetType === 'ally') return 'Select an ally'
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
})

function startCurrentBattle() {
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
      } else {
        shardDropDisplay.value = null
      }
    }
    displayedGems.value = 0
    displayedExp.value = 0
    displayedGold.value = 0
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
  questsStore.failRun()
  showDefeatModal.value = true
}

function selectAction(action) {
  battleStore.selectAction(action)
}

function selectEnemyTarget(enemy) {
  if (enemy.currentHp <= 0) return

  // If no action selected yet, clicking enemy selects attack
  if (battleStore.isPlayerTurn && !battleStore.selectedAction) {
    selectAction('attack')
    return
  }

  if (enemiesTargetable.value) {
    battleStore.selectTarget(enemy.id, 'enemy')
  }
}

function selectHeroTarget(hero) {
  if (alliesTargetable.value && hero.currentHp > 0) {
    battleStore.selectTarget(hero.instanceId, 'ally')
  }
}

function returnToMap() {
  battleStore.endBattle()
  emit('navigate', 'worldmap')
}

function returnHome() {
  battleStore.endBattle()
  emit('navigate', 'home')
}

function replayStage() {
  // Use lastVisitedNode since currentRun is null after completeRun()
  const nodeId = questsStore.lastVisitedNode
  if (!nodeId) return

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
  setTimeout(() => {
    showXpFloaters.value = true
  }, 300)
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
  const nodeId = currentNode.value?.id
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

    // Add damage number if there's a value
    if (effect.value > 0) {
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
  if (alliesTargetable.value && hero.currentHp > 0) {
    selectHeroTarget(hero)
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
  <div class="battle-screen">
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

    <!-- Battle Header -->
    <header class="battle-header">
      <div class="node-info">
        <span class="node-name">{{ currentNode?.name || 'Battle' }}</span>
        <span class="battle-progress">Battle {{ currentBattleIndex + 1 }}/{{ totalBattles }}</span>
      </div>
      <div class="round-info">
        Round {{ battleStore.roundNumber }}
      </div>
    </header>

    <!-- Enemy Area -->
    <section class="enemy-area">
      <div
        v-if="battleBackgroundUrl"
        class="enemy-area-background"
        :style="{ backgroundImage: `url(${battleBackgroundUrl})` }"
      ></div>
      <div
        v-for="(enemy, enemyIndex) in battleStore.enemies"
        :key="enemy.id"
        :class="[
          'enemy-wrapper',
          { 'has-image': getEnemyImageUrl(enemy) }
        ]"
      >
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
          targetable: alliesTargetable && hero.currentHp > 0,
          selected: battleStore.selectedTarget?.id === hero.instanceId,
          'leader-activating': leaderActivating === hero.instanceId,
          dead: hero.currentHp <= 0
        }]"
        @click="handleHeroClick(hero)"
      >
        <!-- Leader Skill Announcement -->
        <div v-if="leaderActivating === hero.instanceId" class="leader-skill-announce">
          {{ leaderSkillName }}
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
      <div class="action-prompt">
        <span>{{ currentHero.template.name }}'s turn</span>
        <span>{{ targetPrompt }}</span>
      </div>

      <div class="action-buttons">
        <ActionButton
          label="Attack"
          description="Basic attack"
          :selected="battleStore.selectedAction === 'attack'"
          @click="selectAction('attack')"
        />
        <ActionButton
          v-for="(skill, index) in availableSkills"
          :key="skill.name"
          :label="skill.name"
          :description="getSkillDescription(skill)"
          :cost="getSkillCost(skill)"
          :costLabel="getSkillCostLabel(skill)"
          :disabled="!canUseSkill(skill)"
          :selected="battleStore.selectedAction === `skill_${index}`"
          variant="primary"
          @click="selectAction(`skill_${index}`)"
        />
      </div>
    </section>

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
      <div class="modal victory-modal">
        <h2>Victory!</h2>
        <p class="node-complete">
          {{ questsStore.lastVisitedNode ? getQuestNode(questsStore.lastVisitedNode)?.name : '' }} Complete!
          <span v-if="rewards?.isFirstClear" class="first-clear-badge">First Clear!</span>
        </p>

        <!-- Step 1: Rewards -->
        <div v-if="victoryStep === 1" class="victory-step">
          <div v-if="rewards" class="rewards">
            <div class="reward-item">
              <span>💎 Gems</span>
              <span class="reward-value">+{{ displayedGems }}</span>
            </div>
            <div class="reward-item gold-reward">
              <span>🪙 Gold</span>
              <span class="reward-value">+{{ displayedGold }}</span>
            </div>
            <div class="reward-item">
              <span>⭐ EXP</span>
              <span class="reward-value">+{{ displayedExp }}</span>
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
        <div v-if="victoryStep === 2" class="victory-step">
          <div class="step-header">Party Results</div>
          <div class="victory-party">
            <div
              v-for="hero in partyHeroesForVictory"
              :key="hero.instanceId"
              :class="['victory-hero', { 'leveled-up': heroLeveledUp(hero.instanceId) }]"
            >
              <HeroCard :hero="hero" compact />
              <div v-if="showXpFloaters" class="xp-floater">
                +{{ expPerHero }} XP
              </div>
              <div v-if="heroLeveledUp(hero.instanceId)" class="level-up-badge">
                Level Up!
              </div>
            </div>
          </div>

          <button class="btn-back" @click="prevVictoryStep">
            ← Rewards
          </button>
        </div>

        <div class="modal-actions">
          <button class="btn-primary" @click="returnToMap">Continue</button>
          <button v-if="rewards && !rewards.isFirstClear" class="btn-secondary" @click="replayStage">Replay</button>
          <button class="btn-secondary" @click="returnHome">Home</button>
        </div>
      </div>
    </div>

    <!-- Defeat Modal -->
    <div v-if="showDefeatModal" class="modal-overlay">
      <div class="modal defeat-modal">
        <h2>Defeat</h2>
        <p>Your party has been wiped out...</p>

        <div class="modal-actions">
          <button class="btn-primary" @click="returnToMap">Try Again</button>
          <button class="btn-secondary" @click="returnHome">Home</button>
        </div>
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
              :class="['effect-item', { buff: effect.definition?.isBuff, debuff: !effect.definition?.isBuff }]"
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
</template>

<style scoped>
.battle-screen {
  min-height: 100vh;
  padding: 16px;
  padding-left: 70px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #1f2937;
  border-radius: 8px;
}

.node-info {
  display: flex;
  flex-direction: column;
}

.node-name {
  font-weight: 600;
  color: #f3f4f6;
}

.battle-progress {
  font-size: 0.8rem;
  color: #6b7280;
}

.round-info {
  background: #374151;
  padding: 6px 12px;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 0.9rem;
}

.enemy-area {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  flex-wrap: wrap;
  min-height: 180px;
  border-radius: 12px;
  overflow: hidden;
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
  z-index: 0;
  opacity: 0.7;
}

.enemy-wrapper {
  position: relative;
  z-index: 1;
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
  filter: grayscale(100%);
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

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.action-buttons > * {
  flex: 1 1 calc(50% - 6px);
  max-width: calc(50% - 6px);
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
}

.modal {
  background: #1f2937;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.victory-step {
  min-height: 200px;
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
  margin-top: 16px;
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
}

.defeat-modal h2 {
  color: #ef4444;
}

.node-complete {
  color: #9ca3af;
  margin-bottom: 24px;
}

.rewards {
  background: #374151;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.reward-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: #f3f4f6;
}

.reward-item + .reward-item {
  border-top: 1px solid #4b5563;
}

.reward-item.gold-reward .reward-value {
  color: #f59e0b;
}

.reward-value {
  font-weight: 700;
  font-size: 1.1rem;
  color: #22c55e;
  font-variant-numeric: tabular-nums;
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

.victory-party {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.victory-hero {
  position: relative;
}

.victory-hero.leveled-up {
  animation: levelUpGlow 1.5s ease-in-out infinite;
}

.xp-floater {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 700;
  font-size: 1rem;
  color: #ffffff;
  pointer-events: none;
  user-select: none;
  z-index: 100;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.8);
  animation: xpFloatUp 1.5s ease-out forwards;
}

@keyframes xpFloatUp {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(5px) scale(0.8);
  }
  15% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1.1);
  }
  30% {
    transform: translateX(-50%) translateY(-3px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-25px) scale(1);
  }
}

.level-up-badge {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #1f2937;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 10px;
  white-space: nowrap;
  animation: badgePulse 1s ease-in-out infinite;
}

@keyframes levelUpGlow {
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.9));
  }
}

@keyframes badgePulse {
  0%, 100% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(1.1);
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
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

.defeat-modal p {
  color: #9ca3af;
  margin-bottom: 24px;
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
</style>
