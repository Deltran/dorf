<script setup>
const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="goods-markets-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">&#8249;</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Goods & Markets</h1>
      <div class="spacer"></div>
    </header>

    <div class="options-grid">
      <button
        class="option-card inventory-card"
        @click="emit('navigate', 'inventory')"
      >
        <div class="option-icon-wrapper inventory">
          <span class="option-icon">📦</span>
        </div>
        <div class="option-content">
          <span class="option-label">Inventory</span>
          <span class="option-hint">View and sell items</span>
        </div>
        <div class="option-arrow">&#8250;</div>
      </button>

      <button
        class="option-card shops-card"
        @click="emit('navigate', 'shops')"
      >
        <div class="option-icon-wrapper shops">
          <span class="option-icon">🏪</span>
        </div>
        <div class="option-content">
          <span class="option-label">Shops</span>
          <span class="option-hint">Buy items with gold</span>
        </div>
        <div class="option-arrow">&#8250;</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.goods-markets-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  overflow: hidden;
}

/* Animated Background */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-gradient {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e3a5f 25%,
    #1e1b4b 50%,
    #1e3a5f 75%,
    #0f172a 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  opacity: 0.03;
  background-image:
    radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  z-index: -1;
}

/* Header */
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

.spacer {
  width: 80px;
}

/* Options Grid */
.options-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
  flex: 1;
  padding-top: 20px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.option-card:hover {
  border-color: #4b5563;
  transform: translateX(6px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.option-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-icon-wrapper.inventory {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.option-icon-wrapper.shops {
  background: linear-gradient(135deg, #854d0e 0%, #f59e0b 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.option-icon {
  font-size: 1.8rem;
}

.option-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.option-label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #f3f4f6;
}

.option-hint {
  color: #6b7280;
  font-size: 0.85rem;
  margin-top: 2px;
}

.option-arrow {
  font-size: 1.5rem;
  color: #4b5563;
  transition: transform 0.3s ease, color 0.3s ease;
}

.option-card:hover .option-arrow {
  transform: translateX(4px);
  color: #6b7280;
}
</style>
