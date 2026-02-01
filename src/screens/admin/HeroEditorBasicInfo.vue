<script setup>
import { computed } from 'vue'
import { DROPDOWN_OPTIONS } from '../../utils/heroValidator.js'
import { classes } from '../../data/classes.js'

const model = defineModel()

const rarityLabels = {
  1: '1-star (Common)',
  2: '2-star (Uncommon)',
  3: '3-star (Rare)',
  4: '4-star (Epic)',
  5: '5-star (Legendary)'
}

const selectedClassResource = computed(() => {
  if (!model.value?.classId) return null
  const classData = classes[model.value.classId]
  return classData?.resourceName || null
})
</script>

<template>
  <div class="basic-info-tab">
    <div class="form-group disabled">
      <label for="hero-id">ID</label>
      <input
        id="hero-id"
        type="text"
        :value="model?.id"
        disabled
      />
      <span class="hint">Cannot be changed (would require file rename)</span>
    </div>

    <div class="form-group">
      <label for="hero-name">Name</label>
      <input
        id="hero-name"
        type="text"
        v-model="model.name"
      />
    </div>

    <div class="form-group">
      <label for="hero-epithet">Epithet</label>
      <input
        id="hero-epithet"
        type="text"
        v-model="model.epithet"
        placeholder="e.g., The Dawn, World Root"
      />
    </div>

    <div class="form-group">
      <label for="hero-intro">Intro Quote</label>
      <input
        id="hero-intro"
        type="text"
        v-model="model.introQuote"
        placeholder="e.g., Light shall prevail!"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="hero-rarity">Rarity</label>
        <select id="hero-rarity" v-model="model.rarity">
          <option
            v-for="rarity in DROPDOWN_OPTIONS.rarities"
            :key="rarity"
            :value="rarity"
          >
            {{ rarityLabels[rarity] }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="hero-class">Class</label>
        <select id="hero-class" v-model="model.classId">
          <option
            v-for="classId in DROPDOWN_OPTIONS.classIds"
            :key="classId"
            :value="classId"
          >
            {{ classes[classId].title }}
          </option>
        </select>
        <span v-if="selectedClassResource" class="hint">
          Resource: {{ selectedClassResource }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.basic-info-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: flex;
  flex-direction: row;
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
select {
  padding: 10px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 14px;
}

input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
}

input::placeholder {
  color: #6b7280;
}

.hint {
  font-size: 11px;
  color: #6b7280;
}

.disabled input {
  background: #1f2937;
  color: #6b7280;
  cursor: not-allowed;
}
</style>
