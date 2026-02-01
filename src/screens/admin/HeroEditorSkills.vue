<script setup>
import { ref, computed, watch } from 'vue'
import { DROPDOWN_OPTIONS } from '../../utils/heroValidator.js'
import { classes } from '../../data/classes.js'
import { effectDefinitions } from '../../data/statusEffects.js'
import SkillEffectEditor from './SkillEffectEditor.vue'

const model = defineModel()

// Track which skill is selected
const selectedIndex = ref(0)

// Get current class data
const classData = computed(() => {
  if (!model.value?.classId) return null
  return classes[model.value.classId] || null
})

// Determine resource cost type based on class
const resourceCostType = computed(() => {
  if (!classData.value) return 'mp'
  const classId = model.value.classId

  // Classes with special resource systems
  if (classId === 'berserker') return 'rage'
  if (classId === 'knight') return 'valor'
  if (classId === 'alchemist') return 'essence'
  if (classId === 'bard') return 'none' // Bards have free skills
  if (classId === 'ranger') return 'none' // Rangers use Focus (binary)

  // Standard MP classes
  return 'mp'
})

const resourceLabel = computed(() => {
  const type = resourceCostType.value
  if (type === 'rage') return 'Rage Cost'
  if (type === 'valor') return 'Valor Required'
  if (type === 'essence') return 'Essence Cost'
  if (type === 'mp') return 'MP Cost'
  return null
})

const resourceField = computed(() => {
  const type = resourceCostType.value
  if (type === 'rage') return 'rageCost'
  if (type === 'valor') return 'valorRequired'
  if (type === 'essence') return 'essenceCost'
  if (type === 'mp') return 'mpCost'
  return null
})

// Get the currently selected skill
const selectedSkill = computed(() => {
  if (!model.value?.skills || selectedIndex.value >= model.value.skills.length) {
    return null
  }
  return model.value.skills[selectedIndex.value]
})

// Watch for skill array changes to keep selection valid
watch(() => model.value?.skills?.length, (newLen) => {
  if (newLen && selectedIndex.value >= newLen) {
    selectedIndex.value = Math.max(0, newLen - 1)
  }
})

function selectSkill(index) {
  selectedIndex.value = index
}

function addSkill() {
  if (!model.value.skills) {
    model.value.skills = []
  }
  model.value.skills.push({
    name: 'New Skill',
    description: '',
    skillUnlockLevel: 1,
    targetType: 'enemy',
    effects: []
  })
  selectedIndex.value = model.value.skills.length - 1
}

function removeSkill(index) {
  if (model.value.skills.length <= 1) return // Keep at least one skill
  model.value.skills.splice(index, 1)
  if (selectedIndex.value >= model.value.skills.length) {
    selectedIndex.value = model.value.skills.length - 1
  }
}

function addEffect() {
  if (!selectedSkill.value) return
  if (!selectedSkill.value.effects) {
    selectedSkill.value.effects = []
  }
  selectedSkill.value.effects.push({
    type: '',
    target: 'enemy',
    duration: 2
  })
}

function removeEffect(index) {
  if (!selectedSkill.value?.effects) return
  selectedSkill.value.effects.splice(index, 1)
}

// Get cost value for current skill
function getSkillCost(skill) {
  if (!skill || !resourceField.value) return ''
  const val = skill[resourceField.value]
  if (val === 'all') return 'ALL'
  return val || ''
}

// Set cost value for current skill
function setSkillCost(skill, value) {
  if (!skill || !resourceField.value) return

  // Clear old cost fields to avoid conflicts
  delete skill.mpCost
  delete skill.rageCost
  delete skill.valorRequired
  delete skill.essenceCost

  if (value === '' || value === null) {
    return
  }

  // Handle 'all' for berserker rage
  if (resourceCostType.value === 'rage' && String(value).toLowerCase() === 'all') {
    skill.rageCost = 'all'
  } else {
    skill[resourceField.value] = Number(value) || 0
  }
}
</script>

<template>
  <div class="skills-tab">
    <!-- Left panel: skill list -->
    <div class="skill-list">
      <div class="list-header">
        <span class="list-title">Skills</span>
        <button class="add-skill-btn" @click="addSkill" title="Add skill">+</button>
      </div>

      <div class="skill-items">
        <div
          v-for="(skill, index) in model?.skills || []"
          :key="index"
          :class="['skill-item', { active: index === selectedIndex }]"
          @click="selectSkill(index)"
        >
          <span class="skill-number">{{ index + 1 }}.</span>
          <span class="skill-name">{{ skill.name || 'Unnamed' }}</span>
          <button
            v-if="model?.skills?.length > 1"
            class="remove-skill-btn"
            @click.stop="removeSkill(index)"
            title="Remove skill"
          >
            X
          </button>
        </div>
      </div>
    </div>

    <!-- Right panel: skill detail -->
    <div v-if="selectedSkill" class="skill-detail">
      <div class="form-group">
        <label for="skill-name">Name</label>
        <input
          id="skill-name"
          type="text"
          v-model="selectedSkill.name"
          placeholder="Skill name"
        />
      </div>

      <div class="form-group">
        <label for="skill-desc">Description</label>
        <textarea
          id="skill-desc"
          v-model="selectedSkill.description"
          rows="3"
          placeholder="Skill description"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="skill-unlock">Unlock Level</label>
          <select id="skill-unlock" v-model.number="selectedSkill.skillUnlockLevel">
            <option
              v-for="level in DROPDOWN_OPTIONS.skillUnlockLevels"
              :key="level"
              :value="level"
            >
              {{ level }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="skill-target">Target</label>
          <select id="skill-target" v-model="selectedSkill.targetType">
            <option
              v-for="target in DROPDOWN_OPTIONS.targetTypes"
              :key="target"
              :value="target"
            >
              {{ target }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="skill-damage">Damage %</label>
          <input
            id="skill-damage"
            type="number"
            v-model.number="selectedSkill.damagePercent"
            min="0"
            placeholder="e.g., 120"
          />
        </div>

        <div class="form-group">
          <label for="skill-ignore-def">Ignore DEF %</label>
          <input
            id="skill-ignore-def"
            type="number"
            v-model.number="selectedSkill.ignoreDef"
            min="0"
            max="100"
            placeholder="e.g., 50"
          />
        </div>
      </div>

      <!-- Resource cost section (dynamic based on class) -->
      <div v-if="resourceCostType !== 'none'" class="form-row">
        <div class="form-group">
          <label for="skill-cost">{{ resourceLabel }}</label>
          <input
            id="skill-cost"
            type="text"
            :value="getSkillCost(selectedSkill)"
            @input="setSkillCost(selectedSkill, $event.target.value)"
            :placeholder="resourceCostType === 'rage' ? 'e.g., 50 or ALL' : 'e.g., 20'"
          />
          <span v-if="resourceCostType === 'rage'" class="hint">Use "ALL" for rage-consuming skills</span>
        </div>
      </div>

      <div v-if="resourceCostType === 'none'" class="resource-note">
        <span v-if="model?.classId === 'bard'">Bards have free skills (Verse system)</span>
        <span v-else-if="model?.classId === 'ranger'">Rangers use Focus (binary state)</span>
      </div>

      <!-- Effects section -->
      <div class="effects-section">
        <div class="section-header">
          <span class="section-title">Effects</span>
          <button class="add-effect-btn" @click="addEffect">+ Add Effect</button>
        </div>

        <div v-if="selectedSkill.effects && selectedSkill.effects.length > 0" class="effects-list">
          <SkillEffectEditor
            v-for="(effect, index) in selectedSkill.effects"
            :key="index"
            v-model="selectedSkill.effects[index]"
            @remove="removeEffect(index)"
          />
        </div>
        <div v-else class="no-effects">
          No effects. Click "Add Effect" to add status effects to this skill.
        </div>
      </div>
    </div>

    <div v-else class="no-selection">
      <p>No skill selected. Add a skill to get started.</p>
    </div>
  </div>
</template>

<style scoped>
.skills-tab {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 400px;
}

/* Skill list (left panel) */
.skill-list {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #374151;
  border-bottom: 1px solid #4b5563;
}

.list-title {
  font-size: 13px;
  font-weight: 600;
  color: #f3f4f6;
}

.add-skill-btn {
  padding: 2px 8px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.add-skill-btn:hover {
  background: #2563eb;
}

.skill-items {
  flex: 1;
  overflow-y: auto;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid #374151;
  cursor: pointer;
  transition: background-color 0.15s;
}

.skill-item:hover {
  background: #374151;
}

.skill-item.active {
  background: #3b82f6;
}

.skill-number {
  font-size: 12px;
  color: #9ca3af;
  min-width: 18px;
}

.skill-item.active .skill-number {
  color: rgba(255, 255, 255, 0.7);
}

.skill-name {
  flex: 1;
  font-size: 13px;
  color: #d1d5db;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skill-item.active .skill-name {
  color: white;
}

.remove-skill-btn {
  padding: 2px 6px;
  background: transparent;
  border: 1px solid #4b5563;
  border-radius: 3px;
  color: #9ca3af;
  font-size: 10px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.skill-item:hover .remove-skill-btn {
  opacity: 1;
}

.skill-item.active .remove-skill-btn {
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.7);
}

.remove-skill-btn:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}

/* Skill detail (right panel) */
.skill-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #d1d5db;
}

input,
select,
textarea {
  padding: 10px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 14px;
  font-family: inherit;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

input::placeholder,
textarea::placeholder {
  color: #6b7280;
}

textarea {
  resize: vertical;
  min-height: 60px;
}

.hint {
  font-size: 11px;
  color: #6b7280;
}

.resource-note {
  padding: 10px 12px;
  background: #1f2937;
  border-radius: 6px;
  font-size: 12px;
  color: #9ca3af;
}

/* Effects section */
.effects-section {
  margin-top: 8px;
  border-top: 1px solid #374151;
  padding-top: 14px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #f3f4f6;
}

.add-effect-btn {
  padding: 6px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #d1d5db;
  font-size: 12px;
  cursor: pointer;
}

.add-effect-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.no-effects {
  padding: 16px;
  background: #1f2937;
  border-radius: 6px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}

/* No selection state */
.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 14px;
}
</style>
