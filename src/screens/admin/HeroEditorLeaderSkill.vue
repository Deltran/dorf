<script setup>
const model = defineModel()
</script>

<template>
  <div class="leader-skill-tab">
    Leader Skill - {{ model?.name }}
  </div>
</template>

<style scoped>
.leader-skill-tab {
  color: #9ca3af;
}
</style>
