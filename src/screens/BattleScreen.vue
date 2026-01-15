<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useBattleStore, useQuestsStore, useHeroesStore, useGachaStore, BattleState } from '../stores'
import HeroCard from '../components/HeroCard.vue'
import EnemyCard from '../components/EnemyCard.vue'
import ActionButton from '../components/ActionButton.vue'
import DamageNumber from '../components/DamageNumber.vue'
import ImpactIcon from '../components/ImpactIcon.vue'
import StatBar from '../components/StatBar.vue'

const emit = defineEmits(['navigate', 'battleEnd'])

const battleStore = useBattleStore()
const questsStore = useQuestsStore()
const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()

const showVictoryModal = ref(false)
const showDefeatModal = ref(false)
const rewards = ref(null)
const levelUps = ref([])

// Combat visual effects
const damageNumbers = ref([])
const heroHitEffects = ref({}) // { instanceId: 'damage' | 'heal' | 'buff' | 'debuff' }
const enemyHitEffects = ref({}) // { id: 'damage' | 'heal' | 'buff' | 'debuff' }
const heroImpactIcons = ref({}) // { instanceId: 'attack' | 'magic' | 'heal' | ... }
const enemyImpactIcons = ref({}) // { id: 'attack' | 'magic' | 'heal' | ... }

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

// Check if a specific skill can be used (has enough MP)
function canUseSkill(skill) {
  if (!currentHero.value || !skill) return false
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
        rarity: hero?.template?.rarity || 1,
        isCurrent
      }
    } else {
      const enemy = battleStore.enemies.find(e => e.id === turn.id)
      return {
        id: turn.id,
        type: 'enemy',
        name: enemy?.template?.name || 'Unknown',
        rarity: null,
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
      levelUps.value = heroesStore.addExpToParty(rewards.value.exp)
    }
    showVictoryModal.value = true
  }
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

// Hero images
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })

// Enemy images
const enemyImages = import.meta.glob('../assets/enemies/*.png', { eager: true, import: 'default' })

function getEnemyImageUrl(enemy) {
  const templateId = enemy.template?.id || enemy.templateId
  if (!templateId) return null
  const imagePath = `../assets/enemies/${templateId}.png`
  return enemyImages[imagePath] || null
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

function heroLeveledUp(instanceId) {
  return levelUps.value.find(lu => lu.instanceId === instanceId)
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

function removeDamageNumber(id) {
  damageNumbers.value = damageNumbers.value.filter(d => d.id !== id)
}

function getHeroHitEffect(instanceId) {
  return heroHitEffects.value[instanceId] || null
}

function getEnemyHitEffect(enemyId) {
  return enemyHitEffects.value[enemyId] || null
}
</script>

<template>
  <div class="battle-screen">
    <!-- Turn Order Panel -->
    <aside class="turn-order-panel">
      <div class="turn-order-header">Turn Order</div>
      <div class="turn-order-list">
        <div
          v-for="unit in rotatedTurnOrder"
          :key="unit.id"
          :class="[
            'turn-order-entry',
            unit.type,
            { current: unit.isCurrent },
            unit.type === 'hero' ? `rarity-${unit.rarity}` : ''
          ]"
        >
          <span v-if="unit.isCurrent" class="current-indicator">►</span>
          <span class="unit-name">{{ unit.name }}</span>
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
        v-for="enemy in battleStore.enemies"
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
            getEnemyHitEffect(enemy.id) ? `hit-${getEnemyHitEffect(enemy.id)}` : ''
          ]"
          @click="selectEnemyTarget(enemy)"
        >
          <img
            :src="getEnemyImageUrl(enemy)"
            :alt="enemy.template?.name"
            class="enemy-image"
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
          targetable: alliesTargetable && hero.currentHp > 0,
          selected: battleStore.selectedTarget?.id === hero.instanceId
        }]"
        @click="selectHeroTarget(hero)"
      >
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
          :description="skill.description"
          :cost="skill.mpCost"
          :costLabel="currentHero.class.resourceName"
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
        <p class="node-complete">{{ currentNode?.name }} Complete!</p>

        <div v-if="rewards" class="rewards">
          <div class="reward-item">
            <span>💎 Gems</span>
            <span>+{{ rewards.gems }}</span>
          </div>
          <div class="reward-item">
            <span>⭐ EXP</span>
            <span>+{{ rewards.exp }}</span>
          </div>
          <div v-if="rewards.isFirstClear" class="first-clear">
            First Clear Bonus!
          </div>
        </div>

        <div class="victory-party">
          <div
            v-for="hero in partyHeroesForVictory"
            :key="hero.instanceId"
            :class="['victory-hero', { 'leveled-up': heroLeveledUp(hero.instanceId) }]"
          >
            <HeroCard :hero="hero" compact />
            <div v-if="heroLeveledUp(hero.instanceId)" class="level-up-badge">
              Level Up!
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-primary" @click="returnToMap">Continue</button>
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
  </div>
</template>

<style scoped>
.battle-screen {
  min-height: 100vh;
  padding: 16px;
  padding-left: 130px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Turn Order Panel */
.turn-order-panel {
  position: fixed;
  left: 12px;
  top: 16px;
  width: 110px;
  background: #1f2937;
  border-radius: 8px;
  padding: 8px;
  z-index: 50;
}

.turn-order-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 8px;
  border-bottom: 1px solid #374151;
  margin-bottom: 8px;
}

.turn-order-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.turn-order-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.turn-order-entry.current {
  background: #374151;
}

.current-indicator {
  color: #fbbf24;
  font-size: 0.7rem;
}

.unit-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Enemy styling */
.turn-order-entry.enemy .unit-name {
  color: #f87171;
}

/* Hero rarity gradients */
.turn-order-entry.rarity-1 .unit-name {
  color: #9ca3af;
}

.turn-order-entry.rarity-2 .unit-name {
  color: #60a5fa;
}

.turn-order-entry.rarity-3 .unit-name {
  color: #c084fc;
}

.turn-order-entry.rarity-4 .unit-name {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fcd34d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
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

.enemy-image {
  width: 100px;
  height: 100px;
  object-fit: contain;
  image-rendering: pixelated;
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

.hero-image-container {
  width: 100px;
  height: 67px; /* Shows top 2/3 of a 100x100 image */
  overflow: hidden;
  border-radius: 8px 8px 0 0;
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
  padding: 32px;
  text-align: center;
  max-width: 400px;
  width: 100%;
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
  margin-bottom: 24px;
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

.first-clear {
  margin-top: 12px;
  color: #fbbf24;
  font-weight: 600;
}

.victory-party {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.victory-hero {
  position: relative;
}

.victory-hero.leveled-up {
  animation: levelUpGlow 1.5s ease-in-out infinite;
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
</style>
