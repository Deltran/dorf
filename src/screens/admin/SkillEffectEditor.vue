<script setup>
import { computed } from 'vue'
import { DROPDOWN_OPTIONS } from '../../utils/heroValidator.js'
import { effectDefinitions } from '../../data/statusEffects.js'

const model = defineModel()
const emit = defineEmits(['remove'])

// Get effect definition for current type
const effectDef = computed(() => {
  if (!model.value?.type) return null
  return effectDefinitions[model.value.type] || null
})

// Determine which extra fields to show based on effect type
const showValueField = computed(() => {
  if (!model.value?.type) return false
  // Stat buffs/debuffs, thorns, reflect, evasion, marked, damage_reduction
  const typesWithValue = [
    'atk_up', 'atk_down', 'def_up', 'def_down', 'spd_up', 'spd_down',
    'thorns', 'reflect', 'evasion', 'marked', 'damage_reduction',
    'vicious', 'regen', 'mp_regen', 'blind'
  ]
  return typesWithValue.includes(model.value.type)
})

const showAtkPercentField = computed(() => {
  if (!model.value?.type) return false
  // DoT effects use atkPercent for damage
  return ['burn', 'poison'].includes(model.value.type)
})

const showShieldHpField = computed(() => {
  return model.value?.type === 'shield'
})

const showRedirectPercentField = computed(() => {
  return model.value?.type === 'guardian_link'
})

const showDivineSacrificeFields = computed(() => {
  return model.value?.type === 'divine_sacrifice'
})

const showFlameShieldFields = computed(() => {
  return model.value?.type === 'flame_shield'
})

const showWellFedFields = computed(() => {
  return model.value?.type === 'well_fed'
})

function handleRemove() {
  emit('remove')
}
</script>

<template>
  <div class="effect-card">
    <div class="effect-header">
      <span class="effect-icon">{{ effectDef?.icon || '?' }}</span>
      <select v-model="model.type" class="type-select">
        <option value="">Select type...</option>
        <option
          v-for="effectType in DROPDOWN_OPTIONS.effectTypes"
          :key="effectType"
          :value="effectType"
        >
          {{ effectDefinitions[effectType]?.name || effectType }}
        </option>
      </select>
      <button class="remove-btn" @click="handleRemove" title="Remove effect">X</button>
    </div>

    <div class="fields-grid">
      <!-- Target -->
      <div class="form-group">
        <label>Target</label>
        <select v-model="model.target">
          <option
            v-for="target in DROPDOWN_OPTIONS.effectTargets"
            :key="target"
            :value="target"
          >
            {{ target }}
          </option>
        </select>
      </div>

      <!-- Duration -->
      <div class="form-group">
        <label>Duration</label>
        <input
          type="number"
          v-model.number="model.duration"
          min="1"
          placeholder="Turns"
        />
      </div>

      <!-- Value field (stat buffs/debuffs) -->
      <div v-if="showValueField" class="form-group">
        <label>Value (%)</label>
        <input
          type="number"
          v-model.number="model.value"
          min="0"
          placeholder="e.g., 25"
        />
      </div>

      <!-- ATK Percent field (DoTs) -->
      <div v-if="showAtkPercentField" class="form-group">
        <label>ATK % (dmg)</label>
        <input
          type="number"
          v-model.number="model.atkPercent"
          min="0"
          placeholder="e.g., 15"
        />
      </div>

      <!-- Shield HP -->
      <div v-if="showShieldHpField" class="form-group">
        <label>Shield HP</label>
        <input
          type="number"
          v-model.number="model.shieldHp"
          min="0"
          placeholder="e.g., 100"
        />
      </div>

      <!-- Guardian Link - Redirect Percent -->
      <div v-if="showRedirectPercentField" class="form-group">
        <label>Redirect %</label>
        <input
          type="number"
          v-model.number="model.redirectPercent"
          min="0"
          max="100"
          placeholder="e.g., 40"
        />
      </div>

      <!-- Divine Sacrifice fields -->
      <template v-if="showDivineSacrificeFields">
        <div class="form-group">
          <label>Dmg Reduction %</label>
          <input
            type="number"
            v-model.number="model.damageReduction"
            min="0"
            max="100"
            placeholder="e.g., 50"
          />
        </div>
        <div class="form-group">
          <label>Heal/Turn %</label>
          <input
            type="number"
            v-model.number="model.healPerTurn"
            min="0"
            placeholder="e.g., 15"
          />
        </div>
      </template>

      <!-- Flame Shield fields -->
      <template v-if="showFlameShieldFields">
        <div class="form-group">
          <label>Burn Damage</label>
          <input
            type="number"
            v-model.number="model.burnDamage"
            min="0"
            placeholder="e.g., 20"
          />
        </div>
        <div class="form-group">
          <label>Burn Duration</label>
          <input
            type="number"
            v-model.number="model.burnDuration"
            min="1"
            placeholder="e.g., 2"
          />
        </div>
      </template>

      <!-- Well Fed fields -->
      <template v-if="showWellFedFields">
        <div class="form-group">
          <label>HP Threshold %</label>
          <input
            type="number"
            v-model.number="model.threshold"
            min="1"
            max="100"
            placeholder="e.g., 50"
          />
        </div>
        <div class="form-group">
          <label>Heal %</label>
          <input
            type="number"
            v-model.number="model.healPercent"
            min="0"
            placeholder="e.g., 20"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.effect-card {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 12px;
}

.effect-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.effect-icon {
  font-size: 18px;
  width: 28px;
  text-align: center;
}

.type-select {
  flex: 1;
  padding: 8px 10px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 13px;
}

.type-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.remove-btn {
  padding: 4px 8px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
}

.remove-btn:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-group input,
.form-group select {
  padding: 8px 10px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 13px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-group input::placeholder {
  color: #6b7280;
}
</style>
