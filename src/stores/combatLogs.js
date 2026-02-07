import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const MAX_LOGS = 5

export const useCombatLogsStore = defineStore('combatLogs', () => {
  const logs = ref([])

  const logCount = computed(() => logs.value.length)

  function addLog(record) {
    logs.value.unshift(record)
    if (logs.value.length > MAX_LOGS) {
      logs.value.splice(MAX_LOGS)
    }
  }

  function getLog(id) {
    return logs.value.find(l => l.id === id) || null
  }

  function saveState() {
    return { logs: logs.value }
  }

  function loadState(state) {
    if (state.logs) logs.value = state.logs
  }

  return {
    logs,
    logCount,
    addLog,
    getLog,
    saveState,
    loadState
  }
})
