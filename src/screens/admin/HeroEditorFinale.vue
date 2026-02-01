<script setup>
const model = defineModel()

const finaleEffectTypes = ['heal', 'resource_grant', 'buff']

function initFinale() {
  if (!model.value.finale) {
    model.value.finale = {
      name: '',
      description: '',
      target: 'all_allies',
      effects: []
    }
  }
}

function removeFinale() {
  model.value.finale = undefined
}

function addEffect() {
  if (!model.value.finale.effects) {
    model.value.finale.effects = []
  }
  model.value.finale.effects.push({ type: 'heal', value: 10 })
}

function removeEffect(index) {
  model.value.finale.effects.splice(index, 1)
}
</script>

<template>
  <div class="finale-tab">
    <div v-if="!model.finale" class="no-finale">
      <p>This Bard has no Finale defined.</p>
      <button @click="initFinale" class="init-btn">Add Finale</button>
    </div>

    <template v-else>
      <div class="header-actions">
        <button class="remove-finale-btn" @click="removeFinale">Remove Finale</button>
      </div>

      <div class="form-group">
        <label>Name</label>
        <input type="text" v-model="model.finale.name" />
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea v-model="model.finale.description" rows="2"></textarea>
      </div>

      <div class="form-group">
        <label>Target</label>
        <select v-model="model.finale.target">
          <option value="all_allies">All Allies</option>
          <option value="all_enemies">All Enemies</option>
        </select>
      </div>

      <div class="section-header">
        Effects
        <button class="add-btn" @click="addEffect">+ Add</button>
      </div>

      <div class="effects-list">
        <div v-for="(effect, i) in model.finale.effects" :key="i" class="effect-card">
          <div class="effect-header">
            <select v-model="effect.type">
              <option v-for="t in finaleEffectTypes" :key="t" :value="t">
                {{ t }}
              </option>
            </select>
            <button class="remove-btn" @click="removeEffect(i)">×</button>
          </div>

          <!-- Heal type -->
          <template v-if="effect.type === 'heal'">
            <div class="form-group">
              <label>Heal % (of ATK)</label>
              <input type="number" v-model.number="effect.value" min="0" />
            </div>
          </template>

          <!-- Resource grant type -->
          <template v-else-if="effect.type === 'resource_grant'">
            <div class="form-row">
              <div class="form-group">
                <label>MP Amount</label>
                <input type="number" v-model.number="effect.mpAmount" min="0" />
              </div>
              <div class="form-group">
                <label>Valor Amount</label>
                <input type="number" v-model.number="effect.valorAmount" min="0" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Rage Amount</label>
                <input type="number" v-model.number="effect.rageAmount" min="0" />
              </div>
              <div class="form-group">
                <label>Verse Amount</label>
                <input type="number" v-model.number="effect.verseAmount" min="0" />
              </div>
            </div>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" v-model="effect.focusGrant" />
                Grant Focus
              </label>
            </div>
          </template>

          <!-- Buff type -->
          <template v-else-if="effect.type === 'buff'">
            <div class="form-row">
              <div class="form-group">
                <label>Effect Type</label>
                <input type="text" v-model="effect.effectType" placeholder="e.g., atk_up" />
              </div>
              <div class="form-group">
                <label>Value %</label>
                <input type="number" v-model.number="effect.value" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>Duration</label>
              <input type="number" v-model.number="effect.duration" min="1" />
            </div>
          </template>
        </div>
      </div>

      <div v-if="!model.finale.effects?.length" class="no-effects">
        No effects added yet
      </div>
    </template>
  </div>
</template>

<style scoped>
.finale-tab {
  max-width: 500px;
}

.no-finale {
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

.no-finale p {
  margin: 0;
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

.remove-finale-btn {
  padding: 6px 12px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
}

.remove-finale-btn:hover {
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

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
  padding: 0;
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

.no-effects {
  color: #6b7280;
  font-style: italic;
  text-align: center;
  padding: 20px;
}
</style>
