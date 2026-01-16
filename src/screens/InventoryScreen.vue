<script setup>
// Placeholder InventoryScreen - to be implemented in Task 8
const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="inventory-screen">
    <header class="screen-header">
      <button class="back-btn" @click="emit('navigate', 'home')">← Back</button>
      <h1>Inventory</h1>
    </header>
    <div class="placeholder">
      <p>Inventory screen coming soon...</p>
    </div>
  </div>
</template>

<style scoped>
.inventory-screen {
  min-height: 100vh;
  background: #111827;
  padding: 16px;
}

.screen-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.screen-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.back-btn {
  background: #374151;
  border: none;
  color: #f3f4f6;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #6b7280;
}
</style>
