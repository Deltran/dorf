<script setup>
import { computed } from 'vue'
import { classes } from '../../data/classes.js'

const props = defineProps({
  hero: {
    type: Object,
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  gifUrl: {
    type: String,
    default: null
  },
  portraitUrl: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select'])

const heroClass = computed(() => {
  return classes[props.hero.classId] || null
})

const roleIcons = {
  tank: '\u{1F6E1}\uFE0F',
  dps: '\u2694\uFE0F',
  healer: '\u{1F49A}',
  support: '\u2728'
}

const effectiveRole = computed(() => {
  return props.hero.role || heroClass.value?.role
})

const roleIcon = computed(() => {
  return roleIcons[effectiveRole.value] || '\u2753'
})

const classBadge = computed(() => {
  const title = heroClass.value?.title || 'Unknown'
  const roleName = effectiveRole.value
    ? effectiveRole.value.charAt(0).toUpperCase() + effectiveRole.value.slice(1)
    : 'Unknown'
  return `${title} / ${roleName}`
})

const rarityClass = computed(() => {
  return `rarity-${props.hero.rarity || 1}`
})

const isMissingPng = computed(() => {
  return !props.imageUrl
})

const displayImage = computed(() => {
  return props.gifUrl || props.imageUrl || null
})
</script>

<template>
  <div
    :class="[
      'hero-asset-card',
      rarityClass,
      { 'missing-png': isMissingPng }
    ]"
    @click="emit('select', hero)"
  >
    <div class="image-area">
      <img
        v-if="displayImage"
        :src="displayImage"
        :alt="hero.name"
        class="hero-image"
      />
      <div v-else class="image-placeholder">?</div>
    </div>

    <div class="hero-name">{{ hero.name }}</div>

    <div class="class-badge">
      <span class="role-icon">{{ roleIcon }}</span>
      {{ classBadge }}
    </div>

    <div class="status-icons">
      <span
        class="status-indicator"
        :class="imageUrl ? 'status-ok' : 'status-missing'"
        title="PNG image"
      >PNG</span>
      <span
        class="status-indicator"
        :class="gifUrl ? 'status-ok' : 'status-missing'"
        title="GIF animation"
      >GIF</span>
      <span
        class="status-indicator"
        :class="portraitUrl ? 'status-ok' : 'status-missing'"
        title="Portrait image"
      >PRT</span>
    </div>
  </div>
</template>

<style scoped>
.hero-asset-card {
  background: #1f2937;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.hero-asset-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.hero-asset-card.missing-png {
  border-style: dashed;
  opacity: 0.7;
}

/* Rarity borders and backgrounds */
.rarity-1 { border-color: #9ca3af; background: linear-gradient(135deg, #1f2937 0%, #262d36 100%); }
.rarity-2 { border-color: #22c55e; background: linear-gradient(135deg, #1f2937 0%, #1f3329 100%); }
.rarity-3 { border-color: #3b82f6; background: linear-gradient(135deg, #1f2937 0%, #1f2a3d 100%); }
.rarity-4 { border-color: #a855f7; background: linear-gradient(135deg, #1f2937 0%, #2a2340 100%); }
.rarity-5 { border-color: #f59e0b; background: linear-gradient(135deg, #1f2937 0%, #302a1f 100%); }

.image-area {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  overflow: hidden;
  background: #111827;
}

.hero-image {
  width: 64px;
  height: 64px;
  object-fit: cover;
}

.image-placeholder {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #4b5563;
  background: #111827;
  border-radius: 6px;
}

.hero-name {
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.85rem;
  text-align: center;
  line-height: 1.2;
}

.class-badge {
  font-size: 0.7rem;
  color: #9ca3af;
  text-align: center;
}

.role-icon {
  font-size: 0.75rem;
}

.status-icons {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.status-indicator {
  font-size: 0.6rem;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  letter-spacing: 0.5px;
}

.status-ok {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-missing {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
}
</style>
