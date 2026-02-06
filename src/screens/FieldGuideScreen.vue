<script setup>
import { computed } from 'vue'
import { useCodexStore } from '../stores'
import { getTopicsByCategory } from '../data/codex/topics.js'

const emit = defineEmits(['navigate', 'back'])
const codexStore = useCodexStore()

const categories = computed(() => {
  const all = getTopicsByCategory()
  const result = {}
  for (const [category, topics] of Object.entries(all)) {
    const visible = topics.filter(t => codexStore.isTopicUnlocked(t.id))
    if (visible.length > 0) {
      result[category] = visible
    }
  }
  return result
})

function openTopic(topicId) {
  emit('navigate', 'field-guide-article', topicId)
}
</script>

<template>
  <div class="field-guide-screen">
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('back')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Field Guide</h1>
      <div class="header-spacer"></div>
    </header>

    <div class="topic-list">
      <div v-for="(topics, category) in categories" :key="category" class="category-group">
        <h2 class="category-title">{{ category }}</h2>
        <button
          v-for="topic in topics"
          :key="topic.id"
          class="topic-row"
          @click="openTopic(topic.id)"
        >
          <span class="topic-icon">{{ topic.icon }}</span>
          <span class="topic-title">{{ topic.title }}</span>
          <span class="topic-arrow">›</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-guide-screen {
  min-height: 100vh;
  padding: 20px;
  padding-top: calc(20px + var(--safe-area-top));
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, #0a0a0a 0%, #111827 100%);
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.8) 100%);
  pointer-events: none;
  z-index: 0;
}

.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.screen-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.header-spacer {
  width: 70px;
}

/* Topic list */
.topic-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
  padding-bottom: 20px;
}

.category-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 4px 4px;
}

.topic-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid #1e293b;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.topic-row:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: #334155;
}

.topic-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.topic-title {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 500;
  color: #e5e7eb;
}

.topic-arrow {
  font-size: 1.2rem;
  color: #4b5563;
  flex-shrink: 0;
}

.topic-row:hover .topic-arrow {
  color: #6b7280;
}
</style>
