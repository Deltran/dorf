<script setup>
import { computed } from 'vue'

const props = defineProps({
  region: { type: Object, required: true },
  imageUrl: { type: String, default: null },
  nodeCount: { type: Number, default: 0 }
})

const emit = defineEmits(['select'])

const hasPng = computed(() => !!props.imageUrl)
</script>

<template>
  <div
    :class="['map-asset-card', { 'missing-png': !hasPng }]"
    @click="emit('select', region)"
  >
    <div class="image-area">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="region.name"
        class="map-image"
      />
      <div
        v-else
        class="image-placeholder"
        :style="{ backgroundColor: region.backgroundColor || '#1a1a2a' }"
      >?</div>
    </div>

    <div class="card-info">
      <div class="region-name">{{ region.name }}</div>
      <div class="region-id">{{ region.id }}</div>
      <div class="node-count">{{ nodeCount }} nodes</div>
    </div>

    <div class="status-row">
      <span :class="['status-indicator', hasPng ? 'status-ok' : 'status-missing']">PNG</span>
    </div>
  </div>
</template>

<style scoped>
.map-asset-card {
  border: 2px solid #374151;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #1f2937 0%, #1a2030 100%);
}

.map-asset-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.map-asset-card.missing-png {
  border-style: dashed;
  opacity: 0.7;
}

.image-area {
  width: 200px;
  height: 125px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111827;
  border-radius: 4px;
  overflow: hidden;
}

.map-image {
  width: 200px;
  height: 125px;
  image-rendering: pixelated;
  object-fit: cover;
}

.image-placeholder {
  width: 200px;
  height: 125px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #4b5563;
  user-select: none;
}

.card-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.region-name {
  font-size: 13px;
  font-weight: 600;
  color: #f3f4f6;
  line-height: 1.2;
}

.region-id {
  font-size: 11px;
  color: #6b7280;
  font-family: monospace;
}

.node-count {
  font-size: 11px;
  color: #9ca3af;
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
