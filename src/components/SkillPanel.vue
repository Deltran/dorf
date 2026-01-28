<script setup>
import { ref, computed } from 'vue'
import StatBar from './StatBar.vue'
import VerseIndicator from './VerseIndicator.vue'
import ValorBar from './ValorBar.vue'
import RageBar from './RageBar.vue'
import FocusIndicator from './FocusIndicator.vue'

const props = defineProps({
  hero: {
    type: Object,
    required: true
  },
  skills: {
    type: Array,
    default: () => []
  },
  selectedSkillIndex: {
    type: Number,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-skill', 'select-attack', 'close'])

// Resource type detection
const resourceType = computed(() => props.hero?.class?.resourceType || 'mp')
const resourceName = computed(() => props.hero?.class?.resourceName || 'MP')

// Tooltip state and handlers
const tooltipSkill = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })
let longPressTimer = null

function startLongPress(skill, event) {
  longPressTimer = setTimeout(() => {
    tooltipSkill.value = skill
    // Position tooltip above the touch point
    const rect = event.target.getBoundingClientRect()
    tooltipPosition.value = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    }
  }, 500) // 500ms long press
}

function endLongPress() {
  clearTimeout(longPressTimer)
  longPressTimer = null
}

function closeTooltip() {
  tooltipSkill.value = null
}

// Resource-specific values
const currentMp = computed(() => props.hero?.currentMp || 0)
const maxMp = computed(() => props.hero?.maxMp || 0)
const currentRage = computed(() => props.hero?.currentRage || 0)
const currentValor = computed(() => props.hero?.currentValor || 0)
const currentVerses = computed(() => props.hero?.currentVerses || 0)
const hasFocus = computed(() => props.hero?.hasFocus || false)
const lastSkillName = computed(() => props.hero?.lastSkillName || null)
</script>

<template>
  <div class="skill-panel-container">
    <!-- Backdrop -->
    <Transition name="backdrop">
      <div
        v-if="isOpen"
        class="skill-panel-backdrop"
        @click="emit('close')"
      ></div>
    </Transition>

    <!-- Slide-up Panel -->
    <Transition name="slide-up">
      <div v-if="isOpen" class="skill-panel">
        <div class="skill-panel-header">
          <button class="close-btn" @click="emit('close')">✕</button>
          <span class="panel-title">Skills</span>
        </div>

        <!-- Resource Display -->
        <div class="resource-display">
          <!-- MP-based classes -->
          <template v-if="resourceType === 'mp'">
            <span class="resource-label">{{ resourceName }}</span>
            <StatBar :current="currentMp" :max="maxMp" color="blue" size="sm" :showValues="false" />
            <span class="resource-numbers">{{ currentMp }}/{{ maxMp }}</span>
          </template>

          <!-- Ranger Focus -->
          <template v-else-if="resourceType === 'focus'">
            <span class="resource-label">Focus</span>
            <FocusIndicator :hasFocus="hasFocus" size="sm" />
          </template>

          <!-- Knight Valor -->
          <template v-else-if="resourceType === 'valor'">
            <span class="resource-label">Valor</span>
            <ValorBar :currentValor="currentValor" size="sm" />
          </template>

          <!-- Berserker Rage -->
          <template v-else-if="resourceType === 'rage'">
            <span class="resource-label">Rage</span>
            <RageBar :currentRage="currentRage" size="sm" />
          </template>

          <!-- Bard Verses -->
          <template v-else-if="resourceType === 'verse'">
            <span class="resource-label">Verses</span>
            <VerseIndicator :currentVerses="currentVerses" size="sm" />
            <span v-if="lastSkillName" class="last-skill-note">Last: {{ lastSkillName }}</span>
          </template>
        </div>

        <!-- Skills List -->
        <div class="skills-list">
          <button
            v-for="(skill, index) in skills"
            :key="skill.name"
            :class="['skill-row', {
              selected: selectedSkillIndex === index,
              disabled: skill.disabled
            }]"
            :disabled="skill.disabled"
            @click="emit('select-skill', index)"
            @mousedown="startLongPress(skills[index], $event)"
            @mouseup="endLongPress"
            @mouseleave="endLongPress"
            @touchstart.passive="startLongPress(skills[index], $event)"
            @touchend="endLongPress"
            @touchcancel="endLongPress"
          >
            <span class="skill-name">{{ skill.name }}</span>
            <span v-if="skill.cost !== null" class="skill-cost">
              {{ skill.cost }} {{ skill.costLabel }}
            </span>
            <span v-if="skill.disabled && skill.disabledReason" class="skill-disabled-reason">
              {{ skill.disabledReason }}
            </span>
          </button>
        </div>

        <!-- Skill Tooltip -->
        <Teleport to="body">
          <Transition name="tooltip">
            <div
              v-if="tooltipSkill"
              class="skill-tooltip"
              :style="{
                left: tooltipPosition.x + 'px',
                top: tooltipPosition.y + 'px'
              }"
              @click="closeTooltip"
            >
              <div class="tooltip-content">
                <strong>{{ tooltipSkill.name }}</strong>
                <p>{{ tooltipSkill.fullDescription || 'No description available.' }}</p>
              </div>
            </div>
          </Transition>
        </Teleport>

        <!-- Basic Attack fallback -->
        <button class="attack-fallback" @click="emit('select-attack')">
          Basic Attack
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.skill-panel-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  pointer-events: none;
}

.skill-panel-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  pointer-events: auto;
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.skill-panel {
  position: relative;
  background: #1f2937;
  border-radius: 16px 16px 0 0;
  padding: 16px;
  pointer-events: auto;
  max-height: 60vh;
  overflow-y: auto;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.skill-panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover {
  color: #f3f4f6;
}

.panel-title {
  font-weight: 600;
  color: #f3f4f6;
}

.resource-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 12px;
}

.resource-label {
  font-size: 0.8rem;
  color: #9ca3af;
  min-width: 50px;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.skill-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #374151;
  border: 2px solid transparent;
  border-radius: 8px;
  color: #f3f4f6;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.skill-row:hover:not(.disabled) {
  background: #4b5563;
  border-color: #6b7280;
}

.skill-row.selected {
  border-color: #3b82f6;
  background: #1e3a5f;
}

.skill-row.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.skill-cost {
  font-size: 0.8rem;
  color: #60a5fa;
  background: #1e3a5f;
  padding: 4px 8px;
  border-radius: 4px;
}

.skill-disabled-reason {
  font-size: 0.75rem;
  color: #f87171;
}

.attack-fallback {
  width: 100%;
  padding: 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.attack-fallback:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.resource-numbers {
  font-size: 0.8rem;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
}

.last-skill-note {
  font-size: 0.7rem;
  color: #9ca3af;
  font-style: italic;
}

.skill-tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  z-index: 1000;
  pointer-events: auto;
}

.tooltip-content {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 12px;
  max-width: 250px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.tooltip-content strong {
  display: block;
  color: #f3f4f6;
  margin-bottom: 4px;
}

.tooltip-content p {
  color: #9ca3af;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.4;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .backdrop-enter-active,
  .backdrop-leave-active,
  .slide-up-enter-active,
  .slide-up-leave-active,
  .tooltip-enter-active,
  .tooltip-leave-active {
    transition: none;
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: none;
  }
}
</style>
