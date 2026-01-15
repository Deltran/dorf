const SAVE_KEY = 'dorf_save'
const SAVE_VERSION = 1

export function saveGame(stores) {
  const { heroes, gacha, quests } = stores

  const saveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    heroes: heroes.saveState(),
    gacha: gacha.saveState(),
    quests: quests.saveState()
  }

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
    return true
  } catch (e) {
    console.error('Failed to save game:', e)
    return false
  }
}

export function loadGame(stores) {
  const { heroes, gacha, quests } = stores

  try {
    const saved = localStorage.getItem(SAVE_KEY)
    if (!saved) return false

    const saveData = JSON.parse(saved)

    // Version check for future migrations
    if (saveData.version !== SAVE_VERSION) {
      console.warn(`Save version mismatch: ${saveData.version} vs ${SAVE_VERSION}`)
      // Could add migration logic here
    }

    if (saveData.heroes) heroes.loadState(saveData.heroes)
    if (saveData.gacha) gacha.loadState(saveData.gacha)
    if (saveData.quests) quests.loadState(saveData.quests)

    return true
  } catch (e) {
    console.error('Failed to load game:', e)
    return false
  }
}

export function hasSaveData() {
  return localStorage.getItem(SAVE_KEY) !== null
}

export function resetGame() {
  localStorage.removeItem(SAVE_KEY)
}

export function exportSave() {
  const saved = localStorage.getItem(SAVE_KEY)
  if (!saved) return null
  return saved
}

export function importSave(saveString) {
  try {
    // Validate it's valid JSON
    JSON.parse(saveString)
    localStorage.setItem(SAVE_KEY, saveString)
    return true
  } catch (e) {
    console.error('Invalid save data:', e)
    return false
  }
}
