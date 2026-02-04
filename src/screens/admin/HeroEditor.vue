<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { validateHero } from '../../utils/heroValidator.js'
import { serializeHero, parseHeroFile } from '../../utils/heroSerializer.js'
import { useHeroesStore } from '../../stores/heroes.js'
import HeroEditorBasicInfo from './HeroEditorBasicInfo.vue'
import HeroEditorStats from './HeroEditorStats.vue'
import HeroEditorSkills from './HeroEditorSkills.vue'
import HeroEditorLeaderSkill from './HeroEditorLeaderSkill.vue'
import HeroEditorFinale from './HeroEditorFinale.vue'
import HeroEditorRawCode from './HeroEditorRawCode.vue'

const props = defineProps({
  heroId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['back'])

// Cheat tools
const heroesStore = useHeroesStore()
const addLevel = ref(1)
const addMessage = ref('')

function addToRoster() {
  const level = parseInt(addLevel.value)
  if (isNaN(level) || level < 1 || level > 250) return

  const instance = heroesStore.addHero(props.heroId)
  if (!instance) return

  // Pump XP to reach target level
  // XP per level = 100 * currentLevel, so we need the sum for levels 1 to (target-1)
  if (level > 1) {
    let totalXp = 0
    for (let l = 1; l < level; l++) {
      totalXp += 100 * l
    }
    heroesStore.addExp(instance.instanceId, totalXp)
  }

  addMessage.value = 'Added!'
  setTimeout(() => { addMessage.value = '' }, 1500)
}

// State
const hero = ref(null)
const rawCode = ref('')
const mode = ref('guided') // 'guided' or 'raw'
const activeTab = ref('basic')
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const saveMessage = ref('')
const validationErrors = ref([])

// Computed
const isBard = computed(() => hero.value?.classId === 'bard')

const tabs = computed(() => {
  const baseTabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'stats', label: 'Stats' },
    { id: 'skills', label: 'Skills' },
    { id: 'leader', label: 'Leader Skill' }
  ]
  if (isBard.value) {
    baseTabs.push({ id: 'finale', label: 'Finale' })
  }
  return baseTabs
})

// Load hero data on mount
onMounted(async () => {
  await loadHero()
})

async function loadHero() {
  loading.value = true
  error.value = null

  try {
    const response = await fetch(`/__admin/hero/${props.heroId}`)
    if (!response.ok) {
      throw new Error(`Failed to load hero: ${response.statusText}`)
    }
    const data = await response.json()
    hero.value = parseHeroFile(data.content)
    rawCode.value = data.content
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Sync rawCode when hero changes in guided mode
watch(hero, (newHero) => {
  if (mode.value === 'guided' && newHero) {
    rawCode.value = serializeHero(newHero)
  }
}, { deep: true })

// Parse rawCode when editing in raw mode
function syncFromRawCode() {
  try {
    const parsed = parseHeroFile(rawCode.value)
    hero.value = parsed
    validationErrors.value = []
  } catch (err) {
    validationErrors.value = [`Parse error: ${err.message}`]
  }
}

// Save handler
async function save() {
  // Sync from raw code if in raw mode
  if (mode.value === 'raw') {
    syncFromRawCode()
  }

  // Validate
  const errors = validateHero(hero.value)
  if (errors.length > 0) {
    validationErrors.value = errors
    saveMessage.value = ''
    return
  }

  validationErrors.value = []
  saving.value = true
  saveMessage.value = ''

  try {
    const content = serializeHero(hero.value)
    const response = await fetch(`/__admin/hero/${props.heroId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })

    if (!response.ok) {
      throw new Error(`Failed to save: ${response.statusText}`)
    }

    saveMessage.value = 'Saved!'
    setTimeout(() => {
      saveMessage.value = ''
    }, 2000)
  } catch (err) {
    saveMessage.value = `Error: ${err.message}`
  } finally {
    saving.value = false
  }
}

function goBack() {
  emit('back')
}
</script>

<template>
  <div class="hero-editor">
    <!-- Header -->
    <header class="editor-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">Back</button>
        <h2 class="hero-name">{{ hero?.name || 'Loading...' }}</h2>
      </div>
      <div class="header-right">
        <span v-if="saveMessage" :class="['save-message', { error: saveMessage.startsWith('Error') }]">
          {{ saveMessage }}
        </span>
        <button
          class="save-btn"
          :disabled="saving || loading"
          @click="save"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </header>

    <!-- Cheat tools -->
    <div class="cheat-bar">
      <span class="cheat-label">Add to Roster</span>
      <label class="level-input-group">
        Lv
        <input
          v-model="addLevel"
          type="number"
          min="1"
          max="250"
          class="level-input"
        />
      </label>
      <button
        class="add-btn"
        :disabled="isNaN(parseInt(addLevel)) || parseInt(addLevel) < 1 || parseInt(addLevel) > 250"
        @click="addToRoster"
      >
        Add
      </button>
      <span v-if="addMessage" class="add-message">{{ addMessage }}</span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      Loading hero data...
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      {{ error }}
    </div>

    <!-- Editor content -->
    <template v-else>
      <!-- Mode toggle -->
      <div class="mode-toggle">
        <label class="mode-option">
          <input
            v-model="mode"
            type="radio"
            value="guided"
            name="editor-mode"
          />
          <span class="mode-label">Guided</span>
        </label>
        <label class="mode-option">
          <input
            v-model="mode"
            type="radio"
            value="raw"
            name="editor-mode"
          />
          <span class="mode-label">Raw Code</span>
        </label>
      </div>

      <!-- Validation errors -->
      <div v-if="validationErrors.length > 0" class="validation-errors">
        <div class="error-title">Validation Errors:</div>
        <ul>
          <li v-for="(err, index) in validationErrors" :key="index">{{ err }}</li>
        </ul>
      </div>

      <!-- Guided mode tabs -->
      <template v-if="mode === 'guided'">
        <nav class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>

        <div class="tab-content">
          <HeroEditorBasicInfo v-if="activeTab === 'basic'" v-model="hero" />
          <HeroEditorStats v-if="activeTab === 'stats'" v-model="hero" />
          <HeroEditorSkills v-if="activeTab === 'skills'" v-model="hero" />
          <HeroEditorLeaderSkill v-if="activeTab === 'leader'" v-model="hero" />
          <HeroEditorFinale v-if="activeTab === 'finale' && isBard" v-model="hero" />
        </div>
      </template>

      <!-- Raw mode -->
      <template v-else>
        <div class="raw-code-container">
          <HeroEditorRawCode v-model="rawCode" @blur="syncFromRawCode" />
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.hero-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #1f2937;
  border-bottom: 1px solid #374151;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  padding: 6px 12px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 0.85rem;
  cursor: pointer;
}

.back-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.hero-name {
  margin: 0;
  font-size: 1.25rem;
  color: #f3f4f6;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-message {
  font-size: 0.85rem;
  color: #22c55e;
}

.save-message.error {
  color: #ef4444;
}

.save-btn {
  padding: 8px 16px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
}

.save-btn:hover:not(:disabled) {
  background: #2563eb;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #9ca3af;
  font-size: 1rem;
}

.error-state {
  color: #ef4444;
}

.mode-toggle {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: #1f2937;
  border-bottom: 1px solid #374151;
}

.mode-option {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.mode-option input {
  display: none;
}

.mode-label {
  padding: 6px 16px;
  background: #374151;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.mode-option input:checked + .mode-label {
  background: #3b82f6;
  color: white;
}

.mode-option:hover .mode-label {
  background: #4b5563;
  color: #f3f4f6;
}

.mode-option input:checked + .mode-label:hover {
  background: #2563eb;
}

.validation-errors {
  margin: 12px 16px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 6px;
}

.error-title {
  font-weight: 600;
  color: #ef4444;
  margin-bottom: 8px;
}

.validation-errors ul {
  margin: 0;
  padding-left: 20px;
  color: #fca5a5;
  font-size: 0.85rem;
}

.validation-errors li {
  margin-bottom: 4px;
}

.tab-bar {
  display: flex;
  gap: 4px;
  padding: 0 16px;
  background: #1f2937;
  border-bottom: 1px solid #374151;
}

.tab {
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab:hover {
  color: #f3f4f6;
}

.tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.raw-code-container {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

.cheat-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #1a1a2e;
  border-bottom: 1px solid #374151;
}

.cheat-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.level-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #9ca3af;
}

.level-input {
  width: 56px;
  padding: 4px 6px;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 0.85rem;
  text-align: center;
}

.level-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.add-btn {
  padding: 4px 12px;
  background: #22c55e;
  border: none;
  border-radius: 4px;
  color: #111827;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.add-btn:hover:not(:disabled) {
  background: #16a34a;
}

.add-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.add-message {
  font-size: 0.8rem;
  color: #22c55e;
  font-weight: 600;
}
</style>
