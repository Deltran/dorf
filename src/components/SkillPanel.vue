<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  hero: {
    type: Object,
    required: true
  },
  skills: {
    type: Array,
    default: () => []
  },
  isOpen: {
    type: Boolean,
    default: false
  },
  classColor: {
    type: String,
    default: '#3b82f6'
  }
})

const emit = defineEmits(['select-skill', 'close'])

// Hovered skill for description panel
const hoveredSkill = ref(null)
const hoveredIndex = ref(null)

// Touch handling - keep description visible until panel closes or another skill touched
let isTouchDevice = false

function handleSkillEnter(skill, index, event) {
  if (event.type === 'touchstart') {
    isTouchDevice = true
  }
  hoveredSkill.value = skill
  hoveredIndex.value = index
}

function handleSkillLeave() {
  // On touch devices, don't hide on leave - only on panel close or new touch
  if (!isTouchDevice) {
    hoveredSkill.value = null
    hoveredIndex.value = null
  }
}

function handleSkillSelect(index) {
  emit('select-skill', index)
}

// Clear hover state when panel closes
watch(() => props.isOpen, (open) => {
  if (!open) {
    hoveredSkill.value = null
    hoveredIndex.value = null
    isTouchDevice = false
  }
})

// Resource display
const resourceType = computed(() => props.hero?.class?.resourceType || 'mp')

const resourceDisplay = computed(() => {
  const h = props.hero
  if (!h) return null

  switch (resourceType.value) {
    case 'rage':
      return { icon: '🔥', value: h.currentRage || 0, max: 100 }
    case 'focus':
      return { icon: '🎯', value: h.hasFocus ? 'Ready' : '—', max: null }
    case 'valor':
      return { icon: '⚜️', value: h.currentValor || 0, max: 100 }
    case 'verse':
      return { icon: '🎵', value: `${h.currentVerses || 0}/3`, max: null }
    default:
      return { icon: '⚡', value: h.currentMp || 0, max: h.maxMp || 0 }
  }
})

// Cost formatting for description panel
function formatCost(skill) {
  if (skill.cost === null || skill.cost === undefined) return 'Free'
  if (skill.cost === 0) return 'Free'
  return `${skill.cost} ${skill.costLabel || ''}`
}

// Simple cost number for skill row (only for MP, Rage, Valor)
function getSkillCostNumber(skill) {
  if (skill.cost === null || skill.cost === undefined || skill.cost === 0) return null
  // Only show for resource-costing skills
  if (!skill.costLabel) return null
  return skill.cost
}

// Target type formatting
function formatTargetType(skill) {
  const types = {
    'enemy': 'Single Enemy',
    'all_enemies': 'All Enemies',
    'ally': 'Single Ally',
    'all_allies': 'All Allies',
    'self': 'Self'
  }
  return types[skill.targetType] || ''
}
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="isOpen"
        class="skill-panel-backdrop"
        @click="emit('close')"
      />
    </Transition>
  </Teleport>

  <div
    :class="['skill-panel-container', { open: isOpen }]"
    :style="{ '--class-color': classColor }"
  >
    <Transition name="panel">
      <div v-if="isOpen" class="skill-panel">
        <!-- Skills Column (full width) -->
        <div class="skills-column">
          <!-- Resource indicator -->
          <div v-if="resourceDisplay" class="resource-line">
            <span class="resource-icon">{{ resourceDisplay.icon }}</span>
            <span class="resource-value">
              {{ resourceDisplay.value }}
              <template v-if="resourceDisplay.max && typeof resourceDisplay.value === 'number'">
                /{{ resourceDisplay.max }}
              </template>
            </span>
          </div>

          <!-- Skill grid with floating tooltip -->
          <div class="skills-grid-container">
            <!-- Floating tooltip (above buttons) -->
            <Transition name="tooltip">
              <div v-if="hoveredSkill" class="skill-tooltip">
                <h3 class="tooltip-title" :style="{ color: classColor }">
                  {{ hoveredSkill.name }}
                </h3>
                <p class="tooltip-cost">{{ formatCost(hoveredSkill) }}</p>
                <p class="tooltip-desc">
                  {{ hoveredSkill.fullDescription || 'No description available.' }}
                </p>
                <span v-if="formatTargetType(hoveredSkill)" class="target-tag">
                  {{ formatTargetType(hoveredSkill) }}
                </span>
              </div>
            </Transition>

            <!-- Skill grid -->
            <div class="skills-grid">
              <button
                v-for="(skill, index) in skills"
                :key="skill.name"
                :class="['skill-btn', {
                  disabled: skill.disabled,
                  hovered: hoveredIndex === index
                }]"
                :disabled="skill.disabled"
                @mouseenter="handleSkillEnter(skill, index, $event)"
                @mouseleave="handleSkillLeave"
                @touchstart.passive="handleSkillEnter(skill, index, $event)"
                @click="handleSkillSelect(index)"
              >
                <span class="skill-name">{{ skill.name }}</span>
                <span v-if="getSkillCostNumber(skill)" class="skill-cost-badge">{{ getSkillCostNumber(skill) }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Noise texture as data URI */
.skill-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  border-radius: inherit;
}

.skill-panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 40;
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.skill-panel-container {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  pointer-events: none;
  box-sizing: border-box;
}

.skill-panel {
  position: relative;
  display: flex;
  pointer-events: auto;
}

.panel-enter-active,
.panel-leave-active {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-enter-from,
.panel-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Skills Column (full width) */
.skills-column {
  width: 100%;
  background: #111827;
  border-left: 3px solid var(--class-color);
  border-top: 1px solid #374151;
  border-bottom: 1px solid #374151;
  border-right: 1px solid #374151;
  clip-path: polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px);
  position: relative;
  padding: 12px;
}

/* Chamfered corner effect */
.skills-column::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, transparent 50%, #111827 50%);
  border-top: 1px solid #374151;
  transform: rotate(0deg);
}

.resource-line {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #374151;
  font-size: 0.85rem;
}

.resource-icon {
  font-size: 0.9rem;
}

.resource-value {
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
}

/* Skills grid container with tooltip */
.skills-grid-container {
  position: relative;
}

/* Floating tooltip (absolutely positioned above grid) */
.skill-tooltip {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 8px;
  background: #1f2937;
  border: 1px solid #374151;
  border-left: 3px solid var(--class-color);
  padding: 12px;
  z-index: 10;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.tooltip-enter-from,
.tooltip-leave-to {
  transform: translateY(8px);
  opacity: 0;
}

.tooltip-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.tooltip-cost {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0 0 8px 0;
}

.tooltip-desc {
  font-size: 0.85rem;
  color: #9ca3af;
  line-height: 1.4;
  margin: 0 0 8px 0;
}

.target-tag {
  display: inline-block;
  font-size: 0.7rem;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 2-column skill grid */
.skills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.skill-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 56px;
  padding: 16px 12px;
  background: rgba(55, 65, 81, 0.3);
  border: 1px solid #374151;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.1s ease, border-color 0.1s ease, transform 0.1s ease;
}

.skill-btn:hover:not(.disabled),
.skill-btn.hovered:not(.disabled) {
  background: rgba(55, 65, 81, 0.5);
  border-color: var(--class-color);
  transform: scale(1.02);
}

.skill-btn:active:not(.disabled) {
  transform: scale(0.98);
}

.skill-btn.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.skill-btn.disabled .skill-name {
  text-decoration: line-through;
  color: #6b7280;
}

.skill-btn .skill-name {
  line-height: 1.2;
}

.skill-cost-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  background: rgba(17, 24, 39, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .backdrop-enter-active,
  .backdrop-leave-active,
  .panel-enter-active,
  .panel-leave-active,
  .tooltip-enter-active,
  .tooltip-leave-active {
    transition: none;
  }

  .panel-enter-from,
  .panel-leave-to,
  .tooltip-enter-from,
  .tooltip-leave-to {
    transform: none;
  }

  .skill-btn {
    transition: none;
  }
}
</style>
