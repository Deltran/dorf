<script setup>
import { computed } from 'vue'
import { classes } from '@/data/classes'

const model = defineModel()

const selectedClass = computed(() => {
  if (!model.value?.classId) return null
  return classes[model.value.classId] || null
})

const resourceName = computed(() => {
  return selectedClass.value?.resourceName || 'MP'
})

const classTitle = computed(() => {
  return selectedClass.value?.title || 'Unknown'
})
</script>

<template>
  <div class="stats-tab">
    <h3>Base Stats (Level 1)</h3>

    <div class="stats-grid">
      <div class="form-group">
        <label for="stat-hp">HP</label>
        <input
          id="stat-hp"
          type="number"
          v-model.number="model.baseStats.hp"
          min="1"
        />
      </div>

      <div class="form-group">
        <label for="stat-atk">ATK</label>
        <input
          id="stat-atk"
          type="number"
          v-model.number="model.baseStats.atk"
          min="1"
        />
      </div>

      <div class="form-group">
        <label for="stat-def">DEF</label>
        <input
          id="stat-def"
          type="number"
          v-model.number="model.baseStats.def"
          min="0"
        />
      </div>

      <div class="form-group">
        <label for="stat-spd">SPD</label>
        <input
          id="stat-spd"
          type="number"
          v-model.number="model.baseStats.spd"
          min="1"
        />
      </div>

      <div class="form-group">
        <label for="stat-mp">MP</label>
        <input
          id="stat-mp"
          type="number"
          v-model.number="model.baseStats.mp"
          min="0"
        />
      </div>
    </div>

    <div v-if="selectedClass" class="resource-note">
      <span>MP is used for {{ resourceName }} resource ({{ classTitle }})</span>
    </div>
  </div>
</template>

<style scoped>
.stats-tab {
  max-width: 400px;
}

h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #f3f4f6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #d1d5db;
}

input[type="number"] {
  padding: 10px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 14px;
}

input[type="number"]:focus {
  outline: none;
  border-color: #6366f1;
}

.resource-note {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #1f2937;
  border-radius: 6px;
  font-size: 13px;
  color: #9ca3af;
  margin-top: 16px;
}
</style>
