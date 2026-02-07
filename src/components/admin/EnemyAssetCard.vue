<script setup>
import { computed } from 'vue'

const props = defineProps({
  enemy: { type: Object, required: true },
  imageUrl: { type: String, default: null },
  portraitUrl: { type: String, default: null },
  isGenusLoci: { type: Boolean, default: false }
})

const emit = defineEmits(['select'])

const hasPng = computed(() => !!props.imageUrl)
const hasPortrait = computed(() => !!props.portraitUrl)
const isMissingPng = computed(() => !props.imageUrl)

const displayImage = computed(() => props.imageUrl || null)
</script>

<template>
  <div
    :class="['enemy-asset-card', { 'missing-png': isMissingPng, 'genus-loci': isGenusLoci }]"
    @click="emit('select', enemy)"
  >
    <div class="image-area">
      <img
        v-if="displayImage"
        :src="displayImage"
        :alt="enemy.name"
        class="enemy-image"
      />
      <div v-else class="image-placeholder">?</div>
    </div>

    <div class="enemy-name">{{ enemy.name }}</div>

    <div v-if="isGenusLoci" class="type-badge genus-loci-badge">Genus Loci</div>
    <div v-else class="type-badge">Enemy</div>

    <div class="status-row">
      <span :class="['status-indicator', hasPng ? 'status-ok' : 'status-missing']" title="PNG image">PNG</span>
      <span :class="['status-indicator', hasPortrait ? 'status-ok' : 'status-missing']" title="Portrait">PRT</span>
    </div>
  </div>
</template>

<style scoped>
.enemy-asset-card {
  border: 2px solid #374151;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #1f2937 0%, #2d1f1f 100%);
}

.enemy-asset-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.enemy-asset-card.missing-png {
  border-style: dashed;
  opacity: 0.7;
}

.enemy-asset-card.genus-loci {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #1f2937 0%, #302a1f 100%);
}

.image-area {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111827;
  border-radius: 4px;
}

.enemy-image {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
  object-fit: contain;
}

.image-placeholder {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #4b5563;
}

.enemy-name {
  font-size: 13px;
  font-weight: 600;
  color: #f3f4f6;
  text-align: center;
  line-height: 1.2;
}

.type-badge {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
}

.genus-loci-badge {
  color: #f59e0b;
  font-weight: 600;
}

.status-row {
  display: flex;
  gap: 6px;
}

.status-indicator {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
}

.status-indicator.status-ok {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
}

.status-indicator.status-missing {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}
</style>
