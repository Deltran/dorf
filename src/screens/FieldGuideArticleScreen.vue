<script setup>
import { computed } from 'vue'
import { getTopic } from '../data/codex/topics.js'
import { getTopicContent } from '../data/codex/topicContent.js'

const props = defineProps({
  topicId: { type: String, required: true }
})

const emit = defineEmits(['navigate'])

const topic = computed(() => getTopic(props.topicId))
const content = computed(() => getTopicContent(props.topicId))
</script>

<template>
  <div class="article-screen">
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'field-guide')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">{{ topic?.title || 'Article' }}</h1>
      <div class="header-spacer"></div>
    </header>

    <div v-if="content" class="article-body">
      <div class="article-header">
        <span class="article-icon">{{ topic?.icon }}</span>
        <h2 class="article-title">{{ content.title }}</h2>
      </div>

      <div v-for="(section, index) in content.sections" :key="index" class="article-section">
        <h3 class="section-heading">{{ section.heading }}</h3>
        <p v-if="section.body" class="section-body">{{ section.body }}</p>
        <ul v-if="section.items" class="section-list">
          <li v-for="(item, i) in section.items" :key="i" class="section-list-item">
            <span class="item-label">{{ item.label }}</span>
            <span class="item-desc"> — {{ item.desc }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="no-content">
      <p>Article not found.</p>
    </div>
  </div>
</template>

<style scoped>
.article-screen {
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
  font-size: 1.2rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
  text-align: center;
  flex: 1;
}

.header-spacer {
  width: 70px;
}

/* Article content */
.article-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
  padding-bottom: 40px;
}

.article-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #1e293b;
}

.article-icon {
  font-size: 2rem;
}

.article-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.article-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-heading {
  font-size: 1rem;
  font-weight: 600;
  color: #d1d5db;
  margin: 0;
}

.section-body {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #9ca3af;
  margin: 0;
}

.section-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-list-item {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #9ca3af;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 6px;
}

.item-label {
  font-weight: 600;
  color: #d1d5db;
}

.no-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #6b7280;
  padding: 40px;
}
</style>
