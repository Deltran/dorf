<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useBattleStore, useQuestsStore, useHeroesStore, useGachaStore, BattleState } from '../stores'
import HeroCard from '../components/HeroCard.vue'
import EnemyCard from '../components/EnemyCard.vue'
import ActionButton from '../components/ActionButton.vue'

const emit = defineEmits(['navigate', 'battleEnd'])

const battleStore = useBattleStore()
const questsStore = useQuestsStore()
const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()

const showVictoryModal = ref(false)
const showDefeatModal = ref(false)
const rewards = ref(null)

const currentNode = computed(() => questsStore.currentNode)
const currentBattleIndex = computed(() => questsStore.currentBattleIndex)
const totalBattles = computed(() => questsStore.totalBattlesInCurrentNode)

const currentHero = computed(() => {
  if (!battleStore.isPlayerTurn) return null
  return battleStore.currentUnit
})

const canUseSkill = computed(() => {
  if (!currentHero.value) return false
  const skill = currentHero.value.template?.skill
  if (!skill) return false
  return currentHero.value.currentMp >= skill.mpCost
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

// Prompt text based on current state
const targetPrompt = computed(() => {
  if (!battleStore.selectedAction) return 'Choose an action'
  if (!battleStore.needsTargetSelection) return 'Executing...'
  if (battleStore.currentTargetType === 'ally') return 'Select an ally'
  return 'Select an enemy'
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
      heroesStore.addExpToParty(rewards.value.exp)
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
  if (enemiesTargetable.value && enemy.currentHp > 0) {
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
</script>

<template>
  <div class="battle-screen">
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
      <EnemyCard
        v-for="enemy in battleStore.enemies"
        :key="enemy.id"
        :enemy="enemy"
        :active="battleStore.currentUnit?.id === enemy.id"
        :targetable="enemiesTargetable"
        :selected="battleStore.selectedTarget?.id === enemy.id"
        @click="selectEnemyTarget(enemy)"
      />
    </section>

    <!-- Battle Log -->
    <section class="battle-log">
      <div class="log-entries">
        <p v-for="(entry, index) in battleStore.battleLog.slice(-5)" :key="index">
          {{ entry.message }}
        </p>
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
        <HeroCard
          :hero="hero"
          :active="battleStore.currentUnit?.instanceId === hero.instanceId"
          showBars
          compact
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
          :label="currentHero.template.skill.name"
          :description="currentHero.template.skill.description"
          :cost="currentHero.template.skill.mpCost"
          :costLabel="currentHero.class.resourceName"
          :disabled="!canUseSkill"
          :selected="battleStore.selectedAction === 'skill'"
          variant="primary"
          @click="selectAction('skill')"
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
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  flex-wrap: wrap;
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
  gap: 12px;
  padding: 12px;
  flex-wrap: wrap;
}

.hero-wrapper {
  border-radius: 10px;
  transition: all 0.2s ease;
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
  gap: 12px;
}

.action-buttons > * {
  flex: 1;
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
