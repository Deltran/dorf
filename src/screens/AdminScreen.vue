<script setup>
import { ref, watch, computed } from 'vue'
import AssetViewerHeroes from './admin/AssetViewerHeroes.vue'
import AssetViewerEnemies from './admin/AssetViewerEnemies.vue'
import AssetViewerBackgrounds from './admin/AssetViewerBackgrounds.vue'
import AssetViewerMaps from './admin/AssetViewerMaps.vue'

const activeSection = ref(
  import.meta.env.DEV ? (sessionStorage.getItem('dorf_dev_admin_section') || 'hero-editor') : 'hero-editor'
)

if (import.meta.env.DEV) {
  watch(activeSection, (val) => sessionStorage.setItem('dorf_dev_admin_section', val))
}

const menuSections = [
  {
    label: 'Data',
    items: [
      { id: 'hero-editor', label: 'Heroes' },
      { id: 'enemy-editor', label: 'Enemies', disabled: true }
    ]
  },
  {
    label: 'Assets',
    items: [
      { id: 'heroes', label: 'Hero Art' },
      { id: 'enemies', label: 'Enemy Art' },
      { id: 'backgrounds', label: 'Battle BG' },
      { id: 'maps', label: 'Map Art' }
    ]
  }
]

const allItems = computed(() => menuSections.flatMap(s => s.items))

const activeLabel = computed(() => {
  const item = allItems.value.find(i => i.id === activeSection.value)
  return item?.label || ''
})

const emit = defineEmits(['navigate'])

function exitAdmin() {
  emit('navigate', 'home')
}

function selectSection(item) {
  if (!item.disabled) {
    activeSection.value = item.id
  }
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
        <div v-for="section in menuSections" :key="section.label" class="nav-section">
          <div class="section-label">{{ section.label }}</div>
          <button
            v-for="item in section.items"
            :key="item.id"
            :class="['nav-item', { active: activeSection === item.id, disabled: item.disabled }]"
            @click="selectSection(item)"
          >
            {{ item.label }}
            <span v-if="item.disabled" class="coming-soon">soon</span>
          </button>
        </div>
      </nav>
    </aside>

    <main class="content">
      <div class="content-header">
        <h1>{{ activeLabel }}</h1>
      </div>

      <div class="content-body">
        <div v-if="activeSection === 'hero-editor'" class="placeholder">
          Hero Editor coming next...
        </div>
        <AssetViewerHeroes v-else-if="activeSection === 'heroes'" />
        <AssetViewerEnemies v-else-if="activeSection === 'enemies'" />
        <AssetViewerBackgrounds v-else-if="activeSection === 'backgrounds'" />
        <AssetViewerMaps v-else-if="activeSection === 'maps'" />
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

.nav-section {
  margin-bottom: 8px;
}

.section-label {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.nav-item:hover:not(.disabled) {
  background: #374151;
  color: #f3f4f6;
}

.nav-item.active {
  background: #3b82f6;
  color: white;
}

.nav-item.disabled {
  color: #4b5563;
  cursor: not-allowed;
}

.coming-soon {
  font-size: 10px;
  padding: 2px 6px;
  background: #374151;
  border-radius: 4px;
  color: #6b7280;
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
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
  font-size: 16px;
  background: #1f2937;
  border-radius: 8px;
  border: 1px dashed #374151;
}
</style>
