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
        <!-- Description Panel (left) -->
        <Transition name="description">
          <div v-if="hoveredSkill" class="description-panel">
            <div class="description-content">
              <h3 class="skill-title" :style="{ color: classColor }">
                {{ hoveredSkill.name }}
              </h3>
              <p class="skill-cost">{{ formatCost(hoveredSkill) }}</p>
              <p class="skill-desc">
                {{ hoveredSkill.fullDescription || 'No description available.' }}
              </p>
              <span v-if="formatTargetType(hoveredSkill)" class="target-tag">
                {{ formatTargetType(hoveredSkill) }}
              </span>
            </div>
          </div>
        </Transition>

        <!-- Skills Column (right) -->
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

          <!-- Skill rows -->
          <div class="skills-list">
            <button
              v-for="(skill, index) in skills"
              :key="skill.name"
              :class="['skill-row', {
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
              <span v-if="getSkillCostNumber(skill)" class="skill-cost">{{ getSkillCostNumber(skill) }}</span>
            </button>
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
  justify-content: flex-end;
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

/* Skills Column (right side) */
.skills-column {
  width: 50%;
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

.skills-list {
  display: flex;
  flex-direction: column;
}

.skill-row {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-left: 2px solid transparent;
  border-bottom: 1px solid #374151;
  color: #f3f4f6;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: transform 0.1s ease, border-color 0.1s ease;
}

.skill-row:last-child {
  border-bottom: none;
}

.skill-row:hover:not(.disabled),
.skill-row.hovered:not(.disabled) {
  transform: translateX(4px);
  border-left-color: var(--class-color);
}

.skill-row.disabled {
  cursor: not-allowed;
}

.skill-row.disabled .skill-name {
  text-decoration: line-through;
  color: #6b7280;
}

.skill-name {
  flex: 1;
}

.skill-cost {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  font-weight: 600;
  color: #9ca3af;
  background: rgba(17, 24, 39, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
}

/* Description Panel (left side) */
.description-panel {
  width: 50%;
  padding-right: 8px;
}

.description-content {
  background: #111827;
  border: 1px solid #374151;
  border-right: none;
  padding: 12px;
  height: 100%;
  position: relative;
}

/* Left edge gradient */
.description-content::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to right, rgba(55, 65, 81, 0.5), transparent);
}

.description-enter-active,
.description-leave-active {
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.description-enter-from,
.description-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}

.skill-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.skill-cost {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0 0 8px 0;
}

.skill-desc {
  font-size: 0.85rem;
  color: #9ca3af;
  line-height: 1.5;
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

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .backdrop-enter-active,
  .backdrop-leave-active,
  .panel-enter-active,
  .panel-leave-active,
  .description-enter-active,
  .description-leave-active {
    transition: none;
  }

  .panel-enter-from,
  .panel-leave-to,
  .description-enter-from,
  .description-leave-to {
    transform: none;
  }

  .skill-row {
    transition: none;
  }
}
</style>
