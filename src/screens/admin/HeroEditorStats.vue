<script setup>
const model = defineModel()
</script>

<template>
  <div class="stats-tab">
    Stats - {{ model?.name }}
  </div>
</template>

<style scoped>
.stats-tab {
  color: #9ca3af;
}
</style>
