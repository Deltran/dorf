<script setup>
import { computed } from 'vue'
import { DROPDOWN_OPTIONS } from '../../utils/heroValidator.js'
import { classes } from '../../data/classes.js'

const model = defineModel()

const isLegendary = computed(() => model.value?.rarity === 5)

const leaderSkillTypes = ['passive', 'timed', 'passive_regen']
const stats = ['atk', 'def', 'spd']
const roles = ['tank', 'dps', 'healer', 'support']

function initLeaderSkill() {
  if (!model.value.leaderSkill) {
    model.value.leaderSkill = {
      name: '',
      description: '',
      effects: [{
        type: 'passive',
        stat: 'atk',
        value: 10
      }]
    }
  }
}

function removeLeaderSkill() {
  model.value.leaderSkill = undefined
}

function addEffect() {
  if (!model.value.leaderSkill.effects) {
    model.value.leaderSkill.effects = []
  }
  model.value.leaderSkill.effects.push({
    type: 'passive',
    stat: 'atk',
    value: 10
  })
}

function removeEffect(index) {
  model.value.leaderSkill.effects.splice(index, 1)
}

function setConditionType(effect, type) {
  if (!type) {
    effect.condition = undefined
  } else if (type === 'classId') {
    effect.condition = { classId: DROPDOWN_OPTIONS.classIds[0] }
  } else if (type === 'role') {
    effect.condition = { role: roles[0] }
  }
}

function getConditionType(effect) {
  if (!effect.condition) return ''
  if (effect.condition.classId !== undefined) return 'classId'
  if (effect.condition.role !== undefined) return 'role'
  return ''
}

function isExcludeCondition(condition) {
  if (!condition) return false
  const key = Object.keys(condition)[0]
  return typeof condition[key] === 'object' && condition[key].not !== undefined
}

function getConditionValue(condition) {
  if (!condition) return ''
  const key = Object.keys(condition)[0]
  const val = condition[key]
  return typeof val === 'object' ? val.not : val
}

function updateCondition(effect, value, exclude) {
  const type = getConditionType(effect)
  if (!type) return
  effect.condition = {
    [type]: exclude ? { not: value } : value
  }
}
</script>

<template>
  <div class="leader-skill-tab">
    <template v-if="isLegendary">
      <div v-if="!model.leaderSkill" class="no-leader-skill">
        <p>This hero has no leader skill defined.</p>
        <button @click="initLeaderSkill" class="init-btn">Add Leader Skill</button>
      </div>

      <template v-else>
        <div class="header-actions">
          <button class="remove-leader-btn" @click="removeLeaderSkill">Remove Leader Skill</button>
        </div>

        <div class="form-group">
          <label>Name</label>
          <input type="text" v-model="model.leaderSkill.name" />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="model.leaderSkill.description" rows="2"></textarea>
        </div>

        <div class="section-header">
          Effects
          <button class="add-btn" @click="addEffect">+ Add</button>
        </div>

        <div class="effects-list">
          <div v-for="(effect, i) in model.leaderSkill.effects" :key="i" class="effect-card">
            <div class="effect-header">
              <select v-model="effect.type">
                <option v-for="t in leaderSkillTypes" :key="t" :value="t">
                  {{ t }}
                </option>
              </select>
              <button class="remove-btn" @click="removeEffect(i)">×</button>
            </div>

            <!-- Passive type fields -->
            <template v-if="effect.type === 'passive'">
              <div class="form-row">
                <div class="form-group">
                  <label>Stat</label>
                  <select v-model="effect.stat">
                    <option v-for="s in stats" :key="s" :value="s">{{ s.toUpperCase() }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Value %</label>
                  <input type="number" v-model.number="effect.value" />
                </div>
              </div>

              <div class="form-group">
                <label>Condition (optional)</label>
                <div class="condition-builder">
                  <select :value="getConditionType(effect)" @change="setConditionType(effect, $event.target.value)">
                    <option value="">No condition</option>
                    <option value="classId">Filter by Class</option>
                    <option value="role">Filter by Role</option>
                  </select>

                  <template v-if="getConditionType(effect) === 'classId'">
                    <select
                      :value="getConditionValue(effect.condition)"
                      @change="updateCondition(effect, $event.target.value, isExcludeCondition(effect.condition))"
                    >
                      <option v-for="c in DROPDOWN_OPTIONS.classIds" :key="c" :value="c">
                        {{ classes[c]?.title || c }}
                      </option>
                    </select>
                    <label class="exclude-label">
                      <input
                        type="checkbox"
                        :checked="isExcludeCondition(effect.condition)"
                        @change="updateCondition(effect, getConditionValue(effect.condition), $event.target.checked)"
                      />
                      Exclude
                    </label>
                  </template>

                  <template v-if="getConditionType(effect) === 'role'">
                    <select
                      :value="getConditionValue(effect.condition)"
                      @change="updateCondition(effect, $event.target.value, isExcludeCondition(effect.condition))"
                    >
                      <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
                    </select>
                    <label class="exclude-label">
                      <input
                        type="checkbox"
                        :checked="isExcludeCondition(effect.condition)"
                        @change="updateCondition(effect, getConditionValue(effect.condition), $event.target.checked)"
                      />
                      Exclude
                    </label>
                  </template>
                </div>
              </div>
            </template>

            <!-- Timed type fields -->
            <template v-else-if="effect.type === 'timed'">
              <div class="form-row">
                <div class="form-group">
                  <label>Trigger Round</label>
                  <input type="number" v-model.number="effect.triggerRound" min="1" />
                </div>
                <div class="form-group">
                  <label>Target</label>
                  <select v-model="effect.target">
                    <option value="all_allies">All Allies</option>
                    <option value="all_enemies">All Enemies</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Apply Effect Type</label>
                <input type="text" v-model="effect.apply.effectType" placeholder="e.g., atk_up" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Duration</label>
                  <input type="number" v-model.number="effect.apply.duration" min="1" />
                </div>
                <div class="form-group">
                  <label>Value %</label>
                  <input type="number" v-model.number="effect.apply.value" />
                </div>
              </div>
            </template>

            <!-- Passive regen fields -->
            <template v-else-if="effect.type === 'passive_regen'">
              <div class="form-row">
                <div class="form-group">
                  <label>Target</label>
                  <select v-model="effect.target">
                    <option value="all_allies">All Allies</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>% Max HP</label>
                  <input type="number" v-model.number="effect.percentMaxHp" />
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </template>

    <div v-else class="not-legendary">
      <span class="icon">ℹ️</span>
      Leader skills are only available for 5-star (Legendary) heroes.
    </div>
  </div>
</template>

<style scoped>
.leader-skill-tab {
  max-width: 500px;
}

.not-legendary, .no-leader-skill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  background: #1f2937;
  border-radius: 8px;
  color: #9ca3af;
  text-align: center;
}

.no-leader-skill p {
  margin: 0;
}

.icon {
  font-size: 24px;
}

.init-btn {
  padding: 10px 20px;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.init-btn:hover {
  background: #2563eb;
}

.header-actions {
  margin-bottom: 16px;
}

.remove-leader-btn {
  padding: 6px 12px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
}

.remove-leader-btn:hover {
  background: #dc2626;
  color: white;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #d1d5db;
}

input, select, textarea {
  padding: 10px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 14px;
}

textarea {
  resize: vertical;
  font-family: inherit;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  padding: 12px 0;
  border-top: 1px solid #374151;
  margin-top: 8px;
}

.add-btn {
  padding: 4px 8px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
}

.add-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.effect-card {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 12px;
}

.effect-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.effect-header select {
  flex: 1;
}

.remove-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #dc2626;
  color: white;
}

.condition-builder {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.condition-builder select {
  flex: 1;
  min-width: 120px;
}

.exclude-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
  cursor: pointer;
}

.exclude-label input {
  width: auto;
  padding: 0;
}
</style>
