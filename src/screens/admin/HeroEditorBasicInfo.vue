<script setup>
const model = defineModel()
</script>

<template>
  <div class="basic-info-tab">
    Basic Info - {{ model?.name }}
  </div>
</template>

<style scoped>
.basic-info-tab {
  color: #9ca3af;
}
</style>
