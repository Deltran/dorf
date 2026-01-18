<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  selectedId: { type: String, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  labelKey: { type: String, default: 'name' },
  searchPlaceholder: { type: String, default: 'Search...' }
})

const emit = defineEmits(['select', 'new', 'search'])

const searchText = defineModel('search', { type: String, default: '' })

const filteredItems = computed(() => {
  if (!searchText.value) return props.items
  const search = searchText.value.toLowerCase()
  return props.items.filter(item => {
    const label = item[props.labelKey] || item.id
    return label.toLowerCase().includes(search) || item.id.toLowerCase().includes(search)
  })
})
</script>

<template>
  <div class="list-panel">
    <div class="list-header">
      <input
        v-model="searchText"
        type="text"
        :placeholder="searchPlaceholder"
        class="search-input"
      />
      <button class="new-btn" @click="emit('new')">+ New</button>
    </div>

    <div class="list-body">
      <div v-if="loading && !items.length" class="loading">Loading...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div
        v-for="item in filteredItems"
        :key="item.id"
        :class="['list-item', { selected: selectedId === item.id }]"
        @click="emit('select', item.id)"
      >
        <slot name="item" :item="item">
          <span class="item-label">{{ item[labelKey] || item.id }}</span>
        </slot>
      </div>
      <div v-if="!loading && !filteredItems.length" class="empty">
        No items found
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  padding: 12px;
  border-bottom: 1px solid #374151;
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 14px;
}

.search-input::placeholder {
  color: #6b7280;
}

.new-btn {
  padding: 8px 12px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.new-btn:hover {
  background: #2563eb;
}

.list-body {
  flex: 1;
  overflow-y: auto;
}

.list-item {
  padding: 12px;
  border-bottom: 1px solid #374151;
  cursor: pointer;
}

.list-item:hover {
  background: #374151;
}

.list-item.selected {
  background: #3b82f6;
}

.item-label {
  color: #f3f4f6;
  font-size: 14px;
}

.loading, .error, .empty {
  padding: 16px;
  text-align: center;
  color: #6b7280;
}

.error {
  color: #fca5a5;
}
</style>
