<script setup>
const model = defineModel()
</script>

<template>
  <div class="finale-tab">
    Finale - {{ model?.name }}
  </div>
</template>

<style scoped>
.finale-tab {
  color: #9ca3af;
}
</style>
