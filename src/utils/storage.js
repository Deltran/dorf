const SAVE_KEY = 'dorf_save'
const SAVE_VERSION = 10  // Bump version for gem shop

export function saveGame(stores) {
  const { heroes, gacha, quests, inventory, shards, genusLoci, explorations, shops, equipment, intro, codex, colosseum, gemShop } = stores

  const saveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    heroes: heroes.saveState(),
    gacha: gacha.saveState(),
    quests: quests.saveState(),
    inventory: inventory?.saveState() || { items: {} },
    shards: shards?.saveState() || { huntingSlots: [null, null, null, null, null], unlocked: false },
    genusLoci: genusLoci?.saveState() || { progress: {} },
    explorations: explorations?.saveState() || { activeExplorations: {}, completedHistory: [] },
    shops: shops?.saveState() || { purchases: {} },
    equipment: equipment?.saveState() || { ownedEquipment: {}, equippedGear: {}, blacksmithUnlocked: false },
    intro: intro?.saveState() || { isIntroComplete: false },
    codex: codex?.saveState() || { unlockedTopics: [], readEntries: [] },
    colosseum: colosseum?.saveState() || { highestBout: 0, laurels: 0, colosseumUnlocked: false, lastDailyCollection: null, shopPurchases: {} },
    gemShop: gemShop?.saveState() || { lastPurchaseDate: null, purchasedToday: [] }
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
  const { heroes, gacha, quests, inventory, shards, genusLoci, explorations, shops, equipment, intro, codex, colosseum, gemShop } = stores

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
    if (saveData.inventory && inventory) inventory.loadState(saveData.inventory)
    if (saveData.shards && shards) shards.loadState(saveData.shards)
    if (saveData.genusLoci && genusLoci) genusLoci.loadState(saveData.genusLoci)
    if (saveData.explorations && explorations) explorations.loadState(saveData.explorations)
    if (saveData.shops && shops) shops.loadState(saveData.shops)
    if (saveData.equipment && equipment) equipment.loadState(saveData.equipment)
    if (saveData.intro && intro) intro.loadState(saveData.intro)
    if (saveData.codex && codex) codex.loadState(saveData.codex)
    if (saveData.colosseum && colosseum) colosseum.loadState(saveData.colosseum)
    if (saveData.gemShop && gemShop) gemShop.loadState(saveData.gemShop)

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
