/**
 * Parse battle log messages into per-hero stats.
 * @param {Array<{message: string}>} logEntries
 * @param {Array<{name: string, rarity: number, isLeader: boolean}>} party
 * @returns {Array<{name, rarity, isLeader, damageDealt, healingDone, kills, deaths, damageIntercepted}>}
 */
export function parseLogStats(logEntries, party) {
  if (!logEntries?.length || !party?.length) return []

  const heroNames = new Set(party.map(h => h.name))
  const stats = {}

  for (const hero of party) {
    stats[hero.name] = {
      name: hero.name,
      rarity: hero.rarity,
      isLeader: hero.isLeader,
      damageDealt: 0,
      healingDone: 0,
      kills: 0,
      deaths: 0,
      damageIntercepted: 0
    }
  }

  let lastHeroActor = null

  for (const entry of logEntries) {
    const msg = entry.message
    let m

    // === ACTOR TRACKING ===

    m = msg.match(/^(.+?)'s turn$/)
    if (m) {
      lastHeroActor = heroNames.has(m[1]) ? m[1] : null
      continue
    }

    // Update actor from attacks/uses (fall through — same message has stats)
    m = msg.match(/^(.+?) (?:attacks|uses) /)
    if (m && heroNames.has(m[1])) {
      lastHeroActor = m[1]
    }

    // === DAMAGE DEALT ===

    // Basic attack: "X attacks Y for N damage!"
    m = msg.match(/^(.+?) attacks .+ for (\d+) damage!/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageDealt += parseInt(m[2])
      continue
    }

    // Single-target skill: "X uses Y on Z for N damage!"
    m = msg.match(/^(.+?) uses .+ on .+ for (\d+) damage!/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageDealt += parseInt(m[2])
      continue
    }

    // Multi-hit/AoE summary: "X deals N total damage"
    m = msg.match(/^(.+?) deals (\d+) total damage/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageDealt += parseInt(m[2])
      continue
    }

    // Burn detonate: "X detonates N burns for N total damage!"
    m = msg.match(/^(.+?) detonates \d+ burns for (\d+) total damage!/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageDealt += parseInt(m[2])
      continue
    }

    // True damage: "X deals N true damage"
    m = msg.match(/^(.+?) deals (\d+) true damage/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageDealt += parseInt(m[2])
      continue
    }

    // Shadow damage: "X deals N shadow damage"
    m = msg.match(/^(.+?) deals (\d+) shadow damage/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageDealt += parseInt(m[2])
      continue
    }

    // Damage store release: "X releases N stored damage"
    m = msg.match(/^(.+?) releases (\d+) stored damage/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageDealt += parseInt(m[2])
      continue
    }

    // Riposte: "X ripostes Y for N damage!"
    m = msg.match(/^(.+?) ripostes .+ for (\d+) damage!/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageDealt += parseInt(m[2])
      continue
    }

    // Reflect: "X reflects N damage back to Y!"
    m = msg.match(/^(.+?) reflects (\d+) damage back to/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageDealt += parseInt(m[2])
      continue
    }

    // Retaliation/thorns on enemy: "X takes N retaliation damage!" or "X takes N thorns damage!"
    m = msg.match(/takes (\d+) (?:retaliation|thorns) damage!/)
    if (m && lastHeroActor && stats[lastHeroActor]) {
      stats[lastHeroActor].damageDealt += parseInt(m[1])
      continue
    }

    // Chain lightning: "Lightning chains to X for N damage!"
    m = msg.match(/Lightning chains to .+ for (\d+) damage!/)
    if (m && lastHeroActor && stats[lastHeroActor]) {
      stats[lastHeroActor].damageDealt += parseInt(m[1])
      continue
    }

    // Splash: "X splashes to Y for N damage!"
    m = msg.match(/ splashes to .+ for (\d+) damage!/)
    if (m && lastHeroActor && stats[lastHeroActor]) {
      stats[lastHeroActor].damageDealt += parseInt(m[1])
      continue
    }

    // Echo: "Echoing damage strikes N enemies for M each!"
    m = msg.match(/Echoing damage strikes (\d+) .+ for (\d+) each!/)
    if (m && lastHeroActor && stats[lastHeroActor]) {
      stats[lastHeroActor].damageDealt += parseInt(m[1]) * parseInt(m[2])
      continue
    }

    // === HEALING DONE ===

    // Targeted heal skill: "X uses Y on Z, healing for N HP!"
    m = msg.match(/^(.+?) uses .+ on .+, healing for (\d+) HP!/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].healingDone += parseInt(m[2])
      continue
    }

    // Self-heal/lifesteal: "X heals for N" or "X heals N HP from lifesteal/environment!"
    m = msg.match(/^(.+?) heals (?:for )?(\d+)/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].healingDone += parseInt(m[2])
      continue
    }

    // Regeneration: "X regenerates N HP!"
    m = msg.match(/^(.+?) regenerates (\d+) HP/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].healingDone += parseInt(m[2])
      continue
    }

    // Divine Sacrifice self-heal: "Divine Sacrifice heals X for N!"
    m = msg.match(/^Divine Sacrifice heals (.+?) for (\d+)/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].healingDone += parseInt(m[2])
      continue
    }

    // Target healed: "X is healed for N" → attribute to lastHeroActor
    m = msg.match(/^(.+?) is healed for (\d+)/)
    if (m && lastHeroActor && stats[lastHeroActor] && !msg.includes('Well Fed')) {
      stats[lastHeroActor].healingDone += parseInt(m[2])
      continue
    }

    // === KILLS ===

    // "X defeated!" or "X executed!" — attribute to lastHeroActor
    m = msg.match(/^(.+?) (?:defeated|executed)!$/)
    if (m && lastHeroActor && stats[lastHeroActor] && !heroNames.has(m[1])) {
      stats[lastHeroActor].kills += 1
      continue
    }

    // === DEATHS ===

    m = msg.match(/^(.+?) has fallen!$/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].deaths += 1
      continue
    }

    // === DAMAGE INTERCEPTED ===

    // Ally save (killing blow) — check before general intercept
    m = msg.match(/^(.+?) intercepts the killing blow on .+, taking (\d+) damage!/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageIntercepted += parseInt(m[2])
      continue
    }

    // Divine Sacrifice: "X intercepts N damage meant for Y"
    m = msg.match(/^(.+?) intercepts (\d+) damage meant for/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageIntercepted += parseInt(m[2])
      continue
    }

    // Guardian Link: "X absorbs N damage for Y"
    m = msg.match(/^(.+?) absorbs (\d+) damage for/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageIntercepted += parseInt(m[2])
      continue
    }

    // Guard redirect: "X takes N damage protecting Y"
    m = msg.match(/^(.+?) takes (\d+) damage protecting/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageIntercepted += parseInt(m[2])
      continue
    }

    // Damage sharing: "X shares N damage for Y"
    m = msg.match(/^(.+?) shares (\d+) damage for/)
    if (m && heroNames.has(m[1])) {
      stats[m[1]].damageIntercepted += parseInt(m[2])
      continue
    }
  }

  return Object.values(stats)
    .filter(s => s.damageDealt > 0 || s.healingDone > 0 || s.kills > 0 || s.deaths > 0 || s.damageIntercepted > 0)
    .sort((a, b) => b.damageDealt - a.damageDealt)
}
