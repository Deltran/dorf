<script setup>
defineProps({
  rating: {
    type: Number,
    required: true,
    validator: (v) => v >= 1 && v <= 5
  },
  size: {
    type: String,
    default: 'md' // sm, md, lg
  }
})

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl'
}
</script>

<template>
  <span :class="['star-rating', sizeClasses[size]]">
    <span v-for="i in 5" :key="i" :class="i <= rating ? 'star-filled' : 'star-empty'">
      ★
    </span>
  </span>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  gap: 1px;
}

.star-filled {
  color: #fbbf24;
  text-shadow: 0 0 4px rgba(251, 191, 36, 0.5);
}

.star-empty {
  color: #4b5563;
}

.text-sm {
  font-size: 0.875rem;
}

.text-base {
  font-size: 1rem;
}

.text-xl {
  font-size: 1.25rem;
}
</style>
