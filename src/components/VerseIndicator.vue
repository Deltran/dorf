<script setup>
defineProps({
  currentVerses: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    default: 'sm'
  }
})
</script>

<template>
  <div
    :class="['verse-indicator', size, { primed: currentVerses >= 3 }]"
    role="status"
    :aria-label="`Verse: ${currentVerses} of 3`"
  >
    <div class="verse-pips">
      <span
        v-for="i in 3"
        :key="i"
        :class="['verse-pip', { filled: i <= currentVerses }]"
      >&#9679;</span>
    </div>
    <span class="verse-label">Verse</span>
  </div>
</template>

<style scoped>
.verse-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all 0.3s ease;
}

.verse-pips {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.verse-pip {
  font-size: 0.7rem;
  color: #4b5563;
  transition: all 0.3s ease;
  user-select: none;
}

.sm .verse-pip {
  font-size: 0.6rem;
}

.md .verse-pip {
  font-size: 0.8rem;
  gap: 8px;
}

.verse-pip.filled {
  color: #fbbf24;
  text-shadow: 0 0 6px #f59e0b88;
  animation: versePulse 2s ease-in-out infinite;
}

.primed .verse-pip.filled {
  animation: versePrimePulse 1s ease-in-out infinite;
  text-shadow: 0 0 10px #f59e0bcc;
}

.verse-label {
  font-size: 0.6rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: color 0.3s ease;
}

.sm .verse-label {
  font-size: 0.55rem;
}

.primed .verse-label {
  color: #fbbf24;
  text-shadow: 0 0 6px #f59e0b66;
}

@keyframes versePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

@keyframes versePrimePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.15); }
}
</style>
