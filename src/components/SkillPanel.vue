<script setup>
import { ref, computed, watch } from 'vue'
import GameIcon from './GameIcon.vue'

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
      return { icon: '🔥', iconName: 'fire', name: 'Rage', value: h.currentRage || 0, max: 100 }
    case 'focus':
      return { icon: '🎯', iconName: 'target', name: 'Focus', value: h.hasFocus ? 'Ready' : '—', max: null }
    case 'valor':
      return { icon: '⚜️', name: 'Valor', value: h.currentValor || 0, max: 100 }
    case 'verse':
      return { icon: '🎵', name: 'Verse', value: `${h.currentVerses || 0}/3`, max: null }
    case 'essence':
      return { icon: '🧪', name: 'Essence', value: h.currentEssence || 0, max: h.maxEssence || 60 }
    default:
      return { icon: '⚡', name: h.class?.resourceName || 'Mana', value: h.currentMp || 0, max: h.maxMp || 0 }
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
        <!-- Floating tooltip (outside skills-column to avoid clip-path) -->
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

        <!-- Skills Column (full width) -->
        <div class="skills-column">
          <!-- Resource indicator -->
          <div v-if="resourceDisplay" class="resource-line">
            <span class="resource-icon">
              <GameIcon v-if="resourceDisplay.iconName" :name="resourceDisplay.iconName" size="sm" inline />
              <template v-else>{{ resourceDisplay.icon }}</template>
            </span>
            <span class="resource-name">{{ resourceDisplay.name }}</span>
            <span class="resource-value">
              {{ resourceDisplay.value }}
              <template v-if="resourceDisplay.max && typeof resourceDisplay.value === 'number'">
                /{{ resourceDisplay.max }}
              </template>
            </span>
          </div>

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
    </Transition>
  </div>
</template>

<style scoped>
.skill-panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
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
  flex-direction: column;
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
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
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  border-left: 4px solid var(--class-color);
  border-top: 1px solid #374151;
  border-bottom: 1px solid #374151;
  border-right: 1px solid #374151;
  clip-path: polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px);
  position: relative;
  padding: 14px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

/* Noise texture for gritty Dorf feel */
.skills-column::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.05;
  pointer-events: none;
}

/* Chamfered corner with class-colored accent */
.skills-column::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, var(--class-color) 0%, var(--class-color) 50%, transparent 50%);
  opacity: 0.4;
}

/* Resource indicator - more integrated, badge-like */
.resource-line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 2px solid var(--class-color);
  border-radius: 4px;
  font-size: 0.85rem;
}

.resource-icon {
  font-size: 1rem;
}

.resource-name {
  color: #e5e7eb;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.resource-value {
  color: var(--class-color);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-size: 0.9rem;
}

/* Floating tooltip (above skills-column, not clipped) */
.skill-tooltip {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border: 1px solid #374151;
  border-left: 4px solid var(--class-color);
  padding: 14px;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  position: relative;
}

/* Tooltip noise texture */
.skill-tooltip::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.tooltip-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.tooltip-cost {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0 0 10px 0;
  font-weight: 500;
}

.tooltip-desc {
  font-size: 0.85rem;
  color: #d1d5db;
  line-height: 1.5;
  margin: 0 0 10px 0;
}

.target-tag {
  display: inline-block;
  font-size: 0.65rem;
  color: var(--class-color);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3px 8px;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

/* 2-column skill grid */
.skills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.skill-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 58px;
  padding: 14px 10px;
  background: linear-gradient(180deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%);
  border: 1px solid #4b5563;
  border-bottom: 2px solid #374151;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.12s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Subtle class-colored top edge on skill buttons */
.skill-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--class-color);
  opacity: 0.3;
  border-radius: 4px 4px 0 0;
}

.skill-btn:hover:not(.disabled),
.skill-btn.hovered:not(.disabled) {
  background: linear-gradient(180deg, rgba(75, 85, 99, 0.5) 0%, rgba(55, 65, 81, 0.7) 100%);
  border-color: var(--class-color);
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.skill-btn:hover:not(.disabled)::before,
.skill-btn.hovered:not(.disabled)::before {
  opacity: 0.7;
}

.skill-btn:active:not(.disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.skill-btn.disabled {
  cursor: not-allowed;
  opacity: 0.4;
  filter: grayscale(30%);
}

.skill-btn.disabled::before {
  opacity: 0.1;
}

.skill-btn.disabled .skill-name {
  text-decoration: line-through;
  color: #6b7280;
}

.skill-btn .skill-name {
  line-height: 1.2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.skill-cost-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--class-color);
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.1);
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

  .skill-btn:hover:not(.disabled),
  .skill-btn.hovered:not(.disabled) {
    transform: none;
  }
}
</style>
