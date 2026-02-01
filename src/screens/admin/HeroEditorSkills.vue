<script setup>
const model = defineModel()
</script>

<template>
  <div class="skills-tab">
    Skills - {{ model?.name }}
  </div>
</template>

<style scoped>
.skills-tab {
  color: #9ca3af;
}
</style>
