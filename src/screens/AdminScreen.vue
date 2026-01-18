<script setup>
import { ref } from 'vue'

const activeSection = ref('heroes')

const sections = [
  { id: 'heroes', label: 'Heroes' },
  { id: 'enemies', label: 'Enemies' },
  { id: 'classes', label: 'Classes' },
  { id: 'statusEffects', label: 'Status Effects' },
  { id: 'questNodes', label: 'Quest Nodes' },
  { id: 'items', label: 'Items' }
]

const emit = defineEmits(['navigate'])

function exitAdmin() {
  emit('navigate', 'home')
}
</script>

<template>
  <div class="admin-screen">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Admin</h2>
        <button class="exit-btn" @click="exitAdmin">Exit</button>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="section in sections"
          :key="section.id"
          :class="['nav-item', { active: activeSection === section.id }]"
          @click="activeSection = section.id"
        >
          {{ section.label }}
        </button>
      </nav>
    </aside>

    <main class="content">
      <div class="content-header">
        <h1>{{ sections.find(s => s.id === activeSection)?.label }}</h1>
      </div>

      <div class="content-body">
        <p class="placeholder">{{ activeSection }} admin coming soon...</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-screen {
  display: flex;
  min-height: 100vh;
  background: #111827;
}

.sidebar {
  width: 200px;
  background: #1f2937;
  border-right: 1px solid #374151;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: #f3f4f6;
}

.exit-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
}

.exit-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
}

.nav-item {
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #9ca3af;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}

.nav-item:hover {
  background: #374151;
  color: #f3f4f6;
}

.nav-item.active {
  background: #3b82f6;
  color: white;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: none;
}

.content-header {
  padding: 16px 24px;
  border-bottom: 1px solid #374151;
}

.content-header h1 {
  margin: 0;
  font-size: 24px;
  color: #f3f4f6;
}

.content-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.placeholder {
  color: #6b7280;
}
</style>
