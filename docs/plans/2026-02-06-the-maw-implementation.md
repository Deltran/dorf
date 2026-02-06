# The Maw — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement The Maw, a daily roguelike combat challenge with 11 escalating waves, boon drafting between fights, Dregs currency, and a Dregs shop.

**Architecture:** The Maw is a new game mode built on the existing battle engine and Fight-Level Effects (Phase 1, already complete). It adds a `maw.js` Pinia store for run/daily state, a seeded RNG utility, boon data definitions, expanded `getPartyState()` for full resource carryover, and a new `MawScreen.vue` for the UI. Boons are Fight-Level Effects accumulated across the run and re-applied each wave via `setFightLevelEffects`.

**Tech Stack:** Vue 3 (Composition API), Pinia, Vitest, vanilla CSS (scoped), no router (ref-based navigation)

**Design Doc:** `docs/plans/2026-02-05-gauntlet-design.md`

---

## Phase 1: Foundation — Seeded RNG + Data Layer

### Task 1: Seeded RNG Utility

**Files:**
- Create: `src/utils/seededRandom.js`
- Test: `src/utils/__tests__/seededRandom.test.js`

**Step 1: Write the failing test**

```js
// src/utils/__tests__/seededRandom.test.js
import { describe, it, expect } from 'vitest'
import { SeededRandom } from '../seededRandom.js'

describe('SeededRandom', () => {
  it('produces deterministic output for the same seed', () => {
    const rng1 = new SeededRandom(12345)
    const rng2 = new SeededRandom(12345)
    const results1 = Array.from({ length: 10 }, () => rng1.next())
    const results2 = Array.from({ length: 10 }, () => rng2.next())
    expect(results1).toEqual(results2)
  })

  it('produces different output for different seeds', () => {
    const rng1 = new SeededRandom(12345)
    const rng2 = new SeededRandom(54321)
    const r1 = rng1.next()
    const r2 = rng2.next()
    expect(r1).not.toEqual(r2)
  })

  it('next() returns values between 0 and 1', () => {
    const rng = new SeededRandom(42)
    for (let i = 0; i < 100; i++) {
      const val = rng.next()
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })

  it('int(min, max) returns integers in range (inclusive)', () => {
    const rng = new SeededRandom(99)
    for (let i = 0; i < 100; i++) {
      const val = rng.int(1, 6)
      expect(val).toBeGreaterThanOrEqual(1)
      expect(val).toBeLessThanOrEqual(6)
      expect(Number.isInteger(val)).toBe(true)
    }
  })

  it('pick(array) returns an element from the array', () => {
    const rng = new SeededRandom(42)
    const items = ['a', 'b', 'c', 'd']
    for (let i = 0; i < 20; i++) {
      expect(items).toContain(rng.pick(items))
    }
  })

  it('shuffle(array) returns all elements in different order', () => {
    const rng = new SeededRandom(42)
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    const shuffled = rng.shuffle([...items])
    expect(shuffled).toHaveLength(items.length)
    expect(shuffled.sort()).toEqual(items.sort())
  })

  it('chance(percent) returns boolean based on probability', () => {
    const rng = new SeededRandom(42)
    // With 100% should always be true
    expect(rng.chance(100)).toBe(true)
    // With 0% should always be false
    expect(rng.chance(0)).toBe(false)
  })

  it('weightedPick selects from weighted options', () => {
    const rng = new SeededRandom(42)
    const options = [
      { item: 'common', weight: 70 },
      { item: 'rare', weight: 25 },
      { item: 'epic', weight: 5 }
    ]
    const result = rng.weightedPick(options)
    expect(['common', 'rare', 'epic']).toContain(result.item)
  })

  it('createSeed generates consistent seed from string', () => {
    const { createSeed } = await import('../seededRandom.js')
    const seed1 = createSeed('2026-02-06', 1, 'abc123')
    const seed2 = createSeed('2026-02-06', 1, 'abc123')
    expect(seed1).toBe(seed2)
    const seed3 = createSeed('2026-02-07', 1, 'abc123')
    expect(seed1).not.toBe(seed3)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/__tests__/seededRandom.test.js`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```js
// src/utils/seededRandom.js

// Mulberry32 — fast, high-quality 32-bit PRNG
export class SeededRandom {
  constructor(seed) {
    this.state = seed | 0
  }

  next() {
    this.state |= 0
    this.state = this.state + 0x6D2B79F5 | 0
    let t = Math.imul(this.state ^ this.state >>> 15, 1 | this.state)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }

  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  pick(array) {
    return array[Math.floor(this.next() * array.length)]
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  chance(percent) {
    return this.next() * 100 < percent
  }

  weightedPick(options) {
    const totalWeight = options.reduce((sum, o) => sum + o.weight, 0)
    let roll = this.next() * totalWeight
    for (const option of options) {
      roll -= option.weight
      if (roll <= 0) return option
    }
    return options[options.length - 1]
  }
}

// Generate deterministic seed from date + tier + player salt
export function createSeed(dateStr, tier, playerSalt) {
  const input = `${dateStr}:${tier}:${playerSalt}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/__tests__/seededRandom.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/seededRandom.js src/utils/__tests__/seededRandom.test.js
git commit -m "feat(maw): add seeded RNG utility for deterministic daily runs"
```

---

### Task 2: Boon Data Definitions

**Files:**
- Create: `src/data/maw/boons.js`
- Test: `src/data/__tests__/maw-boons.test.js`

**Step 1: Write the failing test**

```js
// src/data/__tests__/maw-boons.test.js
import { describe, it, expect } from 'vitest'
import { getAllBoons, getBoon, getBoonsByCategory, getBoonsByRarity, getSeedBoons, getPayoffBoons, getPayoffsForSeed } from '../maw/boons.js'

describe('Maw Boon Definitions', () => {
  it('exports a non-empty boon pool', () => {
    const boons = getAllBoons()
    expect(boons.length).toBeGreaterThan(0)
  })

  it('each boon has required fields', () => {
    const boons = getAllBoons()
    for (const boon of boons) {
      expect(boon.id).toBeTruthy()
      expect(boon.name).toBeTruthy()
      expect(boon.description).toBeTruthy()
      expect(['offensive', 'defensive', 'tactical', 'synergy']).toContain(boon.category)
      expect(['common', 'rare', 'epic']).toContain(boon.rarity)
      expect(['heroes', 'enemies', 'all']).toContain(boon.scope)
      expect(boon.hook).toBeTruthy()
      expect(boon.effect).toBeTruthy()
      expect(boon.effect.type).toBeTruthy()
    }
  })

  it('getBoon returns a boon by id', () => {
    const boons = getAllBoons()
    const first = boons[0]
    expect(getBoon(first.id)).toEqual(first)
  })

  it('getBoon returns null for unknown id', () => {
    expect(getBoon('nonexistent_boon')).toBeNull()
  })

  it('getBoonsByCategory filters correctly', () => {
    const offensive = getBoonsByCategory('offensive')
    offensive.forEach(b => expect(b.category).toBe('offensive'))
  })

  it('getBoonsByRarity filters correctly', () => {
    const commons = getBoonsByRarity('common')
    commons.forEach(b => expect(b.rarity).toBe('common'))
  })

  it('seed boons have seedTags', () => {
    const seeds = getSeedBoons()
    seeds.forEach(b => {
      expect(b.isSeed).toBe(true)
      expect(Array.isArray(b.seedTags)).toBe(true)
      expect(b.seedTags.length).toBeGreaterThan(0)
    })
  })

  it('payoff boons have payoffTags', () => {
    const payoffs = getPayoffBoons()
    payoffs.forEach(b => {
      expect(b.isPayoff).toBe(true)
      expect(Array.isArray(b.payoffTags)).toBe(true)
      expect(b.payoffTags.length).toBeGreaterThan(0)
    })
  })

  it('getPayoffsForSeed returns boons matching seed tags', () => {
    const seeds = getSeedBoons()
    if (seeds.length > 0) {
      const seed = seeds[0]
      const payoffs = getPayoffsForSeed(seed)
      payoffs.forEach(p => {
        const overlap = p.payoffTags.some(t => seed.seedTags.includes(t))
        expect(overlap).toBe(true)
      })
    }
  })

  it('has a reasonable rarity distribution', () => {
    const boons = getAllBoons()
    const commons = boons.filter(b => b.rarity === 'common')
    const rares = boons.filter(b => b.rarity === 'rare')
    const epics = boons.filter(b => b.rarity === 'epic')
    // Should have more commons than rares, more rares than epics
    expect(commons.length).toBeGreaterThan(rares.length)
    expect(rares.length).toBeGreaterThanOrEqual(epics.length)
  })

  it('boon effects use valid FLE effect types', () => {
    const validTypes = [
      'damage_multiplier', 'damage_reduction',
      'damage_percent_max_hp', 'heal_percent_max_hp',
      'apply_status', 'heal_percent_damage',
      'grant_shield', 'grant_resource'
    ]
    const boons = getAllBoons()
    for (const boon of boons) {
      expect(validTypes).toContain(boon.effect.type)
    }
  })

  it('all boon ids are unique', () => {
    const boons = getAllBoons()
    const ids = boons.map(b => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/maw-boons.test.js`
Expected: FAIL — module not found

**Step 3: Write implementation**

```js
// src/data/maw/boons.js

// Boon definitions — Fight-Level Effects used as Maw boons
// Each boon maps to the FLE data shape: { hook, effect: { type, value, ... }, scope }

const boons = [
  // === OFFENSIVE (Red) ===
  // Common
  {
    id: 'keen_edge',
    name: 'Keen Edge',
    description: 'Heroes deal 10% more damage.',
    category: 'offensive',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: 10 }
  },
  {
    id: 'sharp_strikes',
    name: 'Sharp Strikes',
    description: 'Heroes deal 15% more damage.',
    category: 'offensive',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: 15 }
  },
  {
    id: 'enemy_frailty',
    name: 'Enemy Frailty',
    description: 'Enemies take 10% more damage.',
    category: 'offensive',
    rarity: 'common',
    scope: 'enemies',
    hook: 'on_pre_damage',
    effect: { type: 'damage_reduction', value: -10 }
  },
  // Rare
  {
    id: 'brutal_force',
    name: 'Brutal Force',
    description: 'Heroes deal 25% more damage.',
    category: 'offensive',
    rarity: 'rare',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: 25 }
  },
  {
    id: 'savage_blows',
    name: 'Savage Blows',
    description: 'Enemies take 20% more damage.',
    category: 'offensive',
    rarity: 'rare',
    scope: 'enemies',
    hook: 'on_pre_damage',
    effect: { type: 'damage_reduction', value: -20 }
  },
  // Epic
  {
    id: 'overwhelming_power',
    name: 'Overwhelming Power',
    description: 'Heroes deal 40% more damage.',
    category: 'offensive',
    rarity: 'epic',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: 40 }
  },

  // === DEFENSIVE (Blue) ===
  // Common
  {
    id: 'iron_skin',
    name: 'Iron Skin',
    description: 'Heroes take 10% less damage.',
    category: 'defensive',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_reduction', value: 10 }
  },
  {
    id: 'natural_recovery',
    name: 'Natural Recovery',
    description: 'Heroes heal 3% max HP at start of turn.',
    category: 'defensive',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_turn_start',
    effect: { type: 'heal_percent_max_hp', value: 3 }
  },
  {
    id: 'toughened_hide',
    name: 'Toughened Hide',
    description: 'Heroes take 15% less damage.',
    category: 'defensive',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_reduction', value: 15 }
  },
  // Rare
  {
    id: 'fortified',
    name: 'Fortified',
    description: 'Heroes take 25% less damage.',
    category: 'defensive',
    rarity: 'rare',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_reduction', value: 25 }
  },
  {
    id: 'regeneration',
    name: 'Regeneration',
    description: 'Heroes heal 5% max HP at start of turn.',
    category: 'defensive',
    rarity: 'rare',
    scope: 'heroes',
    hook: 'on_turn_start',
    effect: { type: 'heal_percent_max_hp', value: 5 }
  },
  // Epic
  {
    id: 'unyielding',
    name: 'Unyielding',
    description: 'Heroes take 35% less damage.',
    category: 'defensive',
    rarity: 'epic',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_reduction', value: 35 }
  },

  // === TACTICAL (Green) ===
  // Common
  {
    id: 'cursed_ground',
    name: 'Cursed Ground',
    description: 'Enemies take 2% max HP damage at start of turn.',
    category: 'tactical',
    rarity: 'common',
    scope: 'enemies',
    hook: 'on_turn_start',
    effect: { type: 'damage_percent_max_hp', value: 2 }
  },
  {
    id: 'weakening_aura',
    name: 'Weakening Aura',
    description: 'Enemies deal 10% less damage.',
    category: 'tactical',
    rarity: 'common',
    scope: 'enemies',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: -10 }
  },
  {
    id: 'erosion',
    name: 'Erosion',
    description: 'Enemies take 3% max HP damage at start of turn.',
    category: 'tactical',
    rarity: 'common',
    scope: 'enemies',
    hook: 'on_turn_start',
    effect: { type: 'damage_percent_max_hp', value: 3 }
  },
  // Rare
  {
    id: 'sapping_field',
    name: 'Sapping Field',
    description: 'Enemies deal 20% less damage.',
    category: 'tactical',
    rarity: 'rare',
    scope: 'enemies',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: -20 }
  },
  {
    id: 'blight',
    name: 'Blight',
    description: 'Enemies take 5% max HP damage at start of turn.',
    category: 'tactical',
    rarity: 'rare',
    scope: 'enemies',
    hook: 'on_turn_start',
    effect: { type: 'damage_percent_max_hp', value: 5 }
  },
  // Epic
  {
    id: 'suffocating_miasma',
    name: 'Suffocating Miasma',
    description: 'Enemies deal 30% less damage and take 3% max HP at turn start.',
    category: 'tactical',
    rarity: 'epic',
    scope: 'enemies',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: -30 }
  },

  // === SYNERGY (Purple) — Seed/Payoff chains ===
  // Burn chain
  {
    id: 'searing_strikes',
    name: 'Searing Strikes',
    description: 'Hero attacks have a 15% chance to burn enemies for 2 turns.',
    category: 'synergy',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_post_damage',
    isSeed: true,
    seedTags: ['burn'],
    effect: { type: 'apply_status', statusType: 'burn', chance: 15, duration: 2, value: 10 }
  },
  {
    id: 'fan_the_flames',
    name: 'Fan the Flames',
    description: 'Burning enemies take 15% more damage.',
    category: 'synergy',
    rarity: 'rare',
    scope: 'enemies',
    hook: 'on_pre_damage',
    isPayoff: true,
    payoffTags: ['burn'],
    effect: { type: 'damage_reduction', value: -15 }
  },
  {
    id: 'wildfire',
    name: 'Wildfire',
    description: 'Hero attacks have a 25% chance to burn enemies.',
    category: 'synergy',
    rarity: 'rare',
    scope: 'heroes',
    hook: 'on_post_damage',
    isSeed: true,
    seedTags: ['burn'],
    effect: { type: 'apply_status', statusType: 'burn', chance: 25, duration: 2, value: 15 }
  },

  // Poison chain
  {
    id: 'toxic_coating',
    name: 'Toxic Coating',
    description: 'Hero attacks have a 15% chance to poison enemies for 3 turns.',
    category: 'synergy',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_post_damage',
    isSeed: true,
    seedTags: ['poison'],
    effect: { type: 'apply_status', statusType: 'poison', chance: 15, duration: 3, value: 8 }
  },
  {
    id: 'virulence',
    name: 'Virulence',
    description: 'Poisoned enemies take 15% more damage.',
    category: 'synergy',
    rarity: 'rare',
    scope: 'enemies',
    hook: 'on_pre_damage',
    isPayoff: true,
    payoffTags: ['poison'],
    effect: { type: 'damage_reduction', value: -15 }
  },

  // Slow chain
  {
    id: 'chilling_presence',
    name: 'Chilling Presence',
    description: 'Hero attacks have a 20% chance to slow enemies for 2 turns.',
    category: 'synergy',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_post_damage',
    isSeed: true,
    seedTags: ['slow'],
    effect: { type: 'apply_status', statusType: 'spd_down', chance: 20, duration: 2, value: 20 }
  },
  {
    id: 'frozen_prey',
    name: 'Frozen Prey',
    description: 'Slowed enemies take 20% more damage.',
    category: 'synergy',
    rarity: 'rare',
    scope: 'enemies',
    hook: 'on_pre_damage',
    isPayoff: true,
    payoffTags: ['slow'],
    effect: { type: 'damage_reduction', value: -20 }
  },

  // Lifesteal chain
  {
    id: 'vampiric_touch',
    name: 'Vampiric Touch',
    description: 'Heroes heal for 5% of damage dealt.',
    category: 'synergy',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_post_damage',
    isSeed: true,
    seedTags: ['lifesteal'],
    effect: { type: 'heal_percent_damage', value: 5 }
  },
  {
    id: 'blood_feast',
    name: 'Blood Feast',
    description: 'Heroes heal for 15% of damage dealt.',
    category: 'synergy',
    rarity: 'epic',
    scope: 'heroes',
    hook: 'on_post_damage',
    isPayoff: true,
    payoffTags: ['lifesteal'],
    effect: { type: 'heal_percent_damage', value: 15 }
  },

  // Shield chain
  {
    id: 'arcane_barrier',
    name: 'Arcane Barrier',
    description: 'Heroes gain a shield equal to 5% max HP at start of turn.',
    category: 'synergy',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_turn_start',
    isSeed: true,
    seedTags: ['shield'],
    effect: { type: 'grant_shield', value: 5 }
  },
  {
    id: 'empowered_shields',
    name: 'Empowered Shields',
    description: 'Heroes deal 20% more damage while shielded.',
    category: 'synergy',
    rarity: 'rare',
    scope: 'heroes',
    hook: 'on_pre_damage',
    isPayoff: true,
    payoffTags: ['shield'],
    effect: { type: 'damage_multiplier', value: 20 }
  }
]

export function getAllBoons() {
  return boons
}

export function getBoon(id) {
  return boons.find(b => b.id === id) || null
}

export function getBoonsByCategory(category) {
  return boons.filter(b => b.category === category)
}

export function getBoonsByRarity(rarity) {
  return boons.filter(b => b.rarity === rarity)
}

export function getSeedBoons() {
  return boons.filter(b => b.isSeed)
}

export function getPayoffBoons() {
  return boons.filter(b => b.isPayoff)
}

export function getPayoffsForSeed(seed) {
  if (!seed.seedTags) return []
  return boons.filter(b =>
    b.isPayoff && b.payoffTags?.some(t => seed.seedTags.includes(t))
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/maw-boons.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/maw/boons.js src/data/__tests__/maw-boons.test.js
git commit -m "feat(maw): add boon definitions with seed/payoff synergy system"
```

---

### Task 3: Dregs Shop Data

**Files:**
- Create: `src/data/maw/shop.js`
- Test: `src/data/__tests__/maw-shop.test.js`

**Step 1: Write the failing test**

```js
// src/data/__tests__/maw-shop.test.js
import { describe, it, expect } from 'vitest'
import { getMawShopItems, getMawShopItem } from '../maw/shop.js'

describe('Maw Shop Items', () => {
  it('exports a non-empty shop item list', () => {
    const items = getMawShopItems()
    expect(items.length).toBeGreaterThan(0)
  })

  it('each item has required fields', () => {
    const items = getMawShopItems()
    for (const item of items) {
      expect(item.id).toBeTruthy()
      expect(item.name).toBeTruthy()
      expect(item.description).toBeTruthy()
      expect(item.cost).toBeGreaterThan(0)
      expect(item.type).toBeTruthy()
    }
  })

  it('getMawShopItem returns item by id', () => {
    const items = getMawShopItems()
    const first = items[0]
    expect(getMawShopItem(first.id)).toEqual(first)
  })

  it('getMawShopItem returns null for unknown id', () => {
    expect(getMawShopItem('fake_item')).toBeNull()
  })

  it('all item ids are unique', () => {
    const items = getMawShopItems()
    const ids = items.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/maw-shop.test.js`
Expected: FAIL

**Step 3: Write implementation**

```js
// src/data/maw/shop.js

const shopItems = [
  {
    id: 'dregs_tome_small',
    name: 'Faded Tome',
    description: 'A worn book of teachings.',
    type: 'xp_tome',
    cost: 15,
    maxStock: 10,
    reward: { itemId: 'tome_small', count: 1 }
  },
  {
    id: 'dregs_tome_medium',
    name: 'Knowledge Tome',
    description: 'A well-preserved collection.',
    type: 'xp_tome',
    cost: 40,
    maxStock: 5,
    reward: { itemId: 'tome_medium', count: 1 }
  },
  {
    id: 'dregs_tome_large',
    name: 'Ancient Codex',
    description: 'A thick volume of forgotten lore.',
    type: 'xp_tome',
    cost: 100,
    maxStock: 3,
    reward: { itemId: 'tome_large', count: 1 }
  },
  {
    id: 'dregs_gold_pack',
    name: 'Bag of Gold',
    description: '500 gold pieces from the depths.',
    type: 'currency',
    cost: 20,
    reward: { gold: 500 }
  },
  {
    id: 'dregs_gem_pack',
    name: 'Cursed Gems',
    description: '50 gems salvaged from the Maw.',
    type: 'currency',
    cost: 60,
    maxStock: 5,
    reward: { gems: 50 }
  }
]

export function getMawShopItems() {
  return shopItems
}

export function getMawShopItem(id) {
  return shopItems.find(i => i.id === id) || null
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/maw-shop.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/maw/shop.js src/data/__tests__/maw-shop.test.js
git commit -m "feat(maw): add Dregs shop item definitions"
```

---

### Task 4: Wave Configuration Data

**Files:**
- Create: `src/data/maw/waves.js`
- Test: `src/data/__tests__/maw-waves.test.js`

**Step 1: Write the failing test**

```js
// src/data/__tests__/maw-waves.test.js
import { describe, it, expect } from 'vitest'
import { getWaveConfig, TIER_CONFIG, WAVE_COUNT, BOSS_WAVE } from '../maw/waves.js'

describe('Maw Wave Configuration', () => {
  it('has 11 total waves (10 + boss)', () => {
    expect(WAVE_COUNT).toBe(11)
    expect(BOSS_WAVE).toBe(11)
  })

  it('has 5 difficulty tiers', () => {
    expect(Object.keys(TIER_CONFIG)).toHaveLength(5)
    for (let tier = 1; tier <= 5; tier++) {
      expect(TIER_CONFIG[tier]).toBeTruthy()
      expect(TIER_CONFIG[tier].rewardMultiplier).toBeGreaterThan(0)
      expect(TIER_CONFIG[tier].levelRange).toBeTruthy()
      expect(TIER_CONFIG[tier].levelRange.min).toBeLessThan(TIER_CONFIG[tier].levelRange.max)
    }
  })

  it('getWaveConfig returns config for each wave', () => {
    for (let wave = 1; wave <= 11; wave++) {
      const config = getWaveConfig(wave)
      expect(config).toBeTruthy()
      expect(config.phase).toBeTruthy()
      expect(config.enemyCount).toBeTruthy()
    }
  })

  it('wave phases progress correctly', () => {
    // 1-3: warmup, 4-7: pressure, 8-10: danger, 11: boss
    for (let w = 1; w <= 3; w++) expect(getWaveConfig(w).phase).toBe('warmup')
    for (let w = 4; w <= 7; w++) expect(getWaveConfig(w).phase).toBe('pressure')
    for (let w = 8; w <= 10; w++) expect(getWaveConfig(w).phase).toBe('danger')
    expect(getWaveConfig(11).phase).toBe('boss')
  })

  it('enemy count increases with phase', () => {
    const warmup = getWaveConfig(1).enemyCount
    const pressure = getWaveConfig(5).enemyCount
    const danger = getWaveConfig(9).enemyCount
    expect(warmup.max).toBeLessThanOrEqual(pressure.max)
    expect(pressure.max).toBeLessThanOrEqual(danger.max)
  })

  it('milestone waves identified correctly', () => {
    expect(getWaveConfig(5).isMilestone).toBe(true)
    expect(getWaveConfig(10).isMilestone).toBe(true)
    expect(getWaveConfig(11).isMilestone).toBe(true)
    expect(getWaveConfig(3).isMilestone).toBeFalsy()
  })

  it('dregs rewards scale superlinearly', () => {
    const dregs3 = getWaveConfig(3).dregsReward
    const dregs5 = getWaveConfig(5).dregsReward
    const dregs7 = getWaveConfig(7).dregsReward
    const dregs10 = getWaveConfig(10).dregsReward
    expect(dregs5).toBeGreaterThan(dregs3)
    expect(dregs7).toBeGreaterThan(dregs5)
    expect(dregs10).toBeGreaterThan(dregs7)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/maw-waves.test.js`
Expected: FAIL

**Step 3: Write implementation**

```js
// src/data/maw/waves.js

export const WAVE_COUNT = 11
export const BOSS_WAVE = 11

export const TIER_CONFIG = {
  1: { levelRange: { min: 10, max: 30 }, rewardMultiplier: 1, unlockCondition: null },
  2: { levelRange: { min: 25, max: 55 }, rewardMultiplier: 1.5, unlockCondition: { tier: 1, cleared: true } },
  3: { levelRange: { min: 50, max: 90 }, rewardMultiplier: 2, unlockCondition: { tier: 2, cleared: true } },
  4: { levelRange: { min: 80, max: 140 }, rewardMultiplier: 3, unlockCondition: { tier: 3, cleared: true } },
  5: { levelRange: { min: 130, max: 200 }, rewardMultiplier: 4, unlockCondition: { tier: 4, cleared: true } }
}

const waveConfigs = {
  1:  { phase: 'warmup',   enemyCount: { min: 1, max: 2 }, dregsReward: 2,  goldReward: 20 },
  2:  { phase: 'warmup',   enemyCount: { min: 1, max: 2 }, dregsReward: 3,  goldReward: 25 },
  3:  { phase: 'warmup',   enemyCount: { min: 1, max: 2 }, dregsReward: 5,  goldReward: 30 },
  4:  { phase: 'pressure', enemyCount: { min: 2, max: 3 }, dregsReward: 7,  goldReward: 30 },
  5:  { phase: 'pressure', enemyCount: { min: 2, max: 3 }, dregsReward: 10, goldReward: 35, isMilestone: true },
  6:  { phase: 'pressure', enemyCount: { min: 2, max: 3 }, dregsReward: 12, goldReward: 35 },
  7:  { phase: 'pressure', enemyCount: { min: 2, max: 3 }, dregsReward: 18, goldReward: 40 },
  8:  { phase: 'danger',   enemyCount: { min: 3, max: 4 }, dregsReward: 22, goldReward: 40 },
  9:  { phase: 'danger',   enemyCount: { min: 3, max: 4 }, dregsReward: 26, goldReward: 45 },
  10: { phase: 'danger',   enemyCount: { min: 3, max: 4 }, dregsReward: 30, goldReward: 50, isMilestone: true },
  11: { phase: 'boss',     enemyCount: { min: 1, max: 1 }, dregsReward: 50, goldReward: 100, isMilestone: true }
}

export function getWaveConfig(wave) {
  return waveConfigs[wave] || null
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/maw-waves.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/maw/waves.js src/data/__tests__/maw-waves.test.js
git commit -m "feat(maw): add wave configuration and tier definitions"
```

---

## Phase 2: Battle Engine Extensions

### Task 5: Expand getPartyState for Full Resource Carryover

**Files:**
- Modify: `src/stores/battle.js:5139-5149` (getPartyState)
- Modify: `src/stores/battle.js:2585-2590` (initBattle savedState restoration)
- Test: `src/stores/__tests__/battle-party-state.test.js`

**Step 1: Write the failing test**

```js
// src/stores/__tests__/battle-party-state.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { useHeroesStore } from '../heroes.js'

describe('getPartyState — full resource carryover', () => {
  let battleStore, heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function setupHero(templateId) {
    const instance = heroesStore.addHero(templateId)
    heroesStore.setPartySlot(0, instance.instanceId)
    return instance
  }

  it('saves HP, MP, and Rage (existing behavior)', () => {
    const instance = setupHero('farm_hand') // berserker
    battleStore.initBattle(null, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    hero.currentHp = 50
    hero.currentMp = 10
    hero.currentRage = 75

    const state = battleStore.getPartyState()
    expect(state[instance.instanceId].currentHp).toBe(50)
    expect(state[instance.instanceId].currentMp).toBe(10)
    expect(state[instance.instanceId].currentRage).toBe(75)
  })

  it('saves currentEssence for alchemists', () => {
    const instance = setupHero('penny_dreadful') // alchemist
    battleStore.initBattle(null, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    hero.currentEssence = 42

    const state = battleStore.getPartyState()
    expect(state[instance.instanceId].currentEssence).toBe(42)
  })

  it('saves currentValor for knights', () => {
    const instance = setupHero('town_guard') // knight
    battleStore.initBattle(null, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    hero.currentValor = 60

    const state = battleStore.getPartyState()
    expect(state[instance.instanceId].currentValor).toBe(60)
  })

  it('saves currentVerses and lastSkillName for bards', () => {
    const instance = setupHero('street_busker') // bard
    battleStore.initBattle(null, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    hero.currentVerses = 2
    hero.lastSkillName = 'Bardic Tune'

    const state = battleStore.getPartyState()
    expect(state[instance.instanceId].currentVerses).toBe(2)
    expect(state[instance.instanceId].lastSkillName).toBe('Bardic Tune')
  })

  it('saves hasFocus for rangers', () => {
    const instance = setupHero('street_urchin') // ranger
    battleStore.initBattle(null, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    hero.hasFocus = false

    const state = battleStore.getPartyState()
    expect(state[instance.instanceId].hasFocus).toBe(false)
  })

  it('restores full resources when initBattle receives savedState', () => {
    const instance = setupHero('town_guard') // knight
    const savedState = {
      [instance.instanceId]: {
        currentHp: 80,
        currentMp: 15,
        currentValor: 50
      }
    }
    battleStore.initBattle(savedState, ['goblin_scout'])
    const hero = battleStore.heroes[0]
    expect(hero.currentHp).toBe(80)
    expect(hero.currentMp).toBe(15)
    expect(hero.currentValor).toBe(50)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/battle-party-state.test.js`
Expected: Tests checking Essence/Valor/Verses/Focus saving should FAIL

**Step 3: Modify getPartyState in battle.js**

In `src/stores/battle.js`, replace `getPartyState()` (lines 5139-5149):

```js
  function getPartyState() {
    const partyState = {}
    for (const hero of heroes.value) {
      partyState[hero.instanceId] = {
        currentHp: hero.currentHp,
        currentMp: hero.currentMp,
        currentRage: hero.currentRage,
        currentEssence: hero.currentEssence,
        currentValor: hero.currentValor,
        currentVerses: hero.currentVerses,
        lastSkillName: hero.lastSkillName,
        hasFocus: hero.hasFocus
      }
    }
    return partyState
  }
```

Also modify `initBattle` hero initialization (around lines 2585-2590) to restore the additional resources from savedState:

```js
        hasFocus: heroFull.class?.resourceType === 'focus' ? (savedState?.hasFocus ?? true) : undefined,
        currentValor: heroFull.class?.resourceType === 'valor' ? (savedState?.currentValor ?? 0) : undefined,
        currentRage: heroFull.class?.resourceType === 'rage' ? (savedState?.currentRage ?? 0) : undefined,
        currentVerses: heroFull.class?.resourceType === 'verse' ? (savedState?.currentVerses ?? 0) : undefined,
        lastSkillName: heroFull.class?.resourceType === 'verse' ? (savedState?.lastSkillName ?? null) : undefined,
```

**Note:** The Alchemist's Essence is initialized via `initializeEssence(battleHero)` at line 2602. Check that function and ensure it respects `savedState?.currentEssence` when present. If not, add a line after `initializeEssence(battleHero)` to override:

```js
      // Override Essence from saved state if present
      if (savedState?.currentEssence !== undefined && hero.currentEssence !== undefined) {
        battleHero.currentEssence = savedState.currentEssence
      }
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/stores/__tests__/battle-party-state.test.js`
Expected: PASS

**Step 5: Run all existing battle tests to ensure no regression**

Run: `npx vitest run src/stores/__tests__/battle`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-party-state.test.js
git commit -m "feat(maw): expand getPartyState for full resource carryover"
```

---

### Task 6: FLE Phase 2 — Additional Hooks and Effect Types

The Maw needs `heal_percent_damage` and `grant_shield` effect types at minimum. These run at `on_post_damage` and `on_turn_start` respectively.

**Files:**
- Modify: `src/stores/battle.js` (processPostDamage, processTurnStartEffects)
- Test: `src/stores/__tests__/battle-fle-phase2.test.js`

**Step 1: Write the failing test**

```js
// src/stores/__tests__/battle-fle-phase2.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { useHeroesStore } from '../heroes.js'

describe('FLE Phase 2 — heal_percent_damage', () => {
  let battleStore, heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function setupBattle() {
    const instance = heroesStore.addHero('militia_soldier')
    heroesStore.setPartySlot(0, instance.instanceId)
    battleStore.initBattle(null, ['goblin_scout'])
    return { hero: battleStore.heroes[0], enemy: battleStore.enemies[0] }
  }

  it('heal_percent_damage heals attacker for percentage of damage dealt', () => {
    const { hero, enemy } = setupBattle()
    battleStore.setFightLevelEffects([
      { hook: 'on_post_damage', scope: 'heroes', effect: { type: 'heal_percent_damage', value: 20 } }
    ])

    hero.currentHp = 50
    hero.maxHp = 200
    const skill = hero.template.skills[0]
    battleStore.executeHeroSkill(hero, skill, enemy)

    // Hero should have healed for 20% of damage dealt
    expect(hero.currentHp).toBeGreaterThan(50)
  })
})

describe('FLE Phase 2 — grant_shield', () => {
  let battleStore, heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function setupBattle() {
    const instance = heroesStore.addHero('militia_soldier')
    heroesStore.setPartySlot(0, instance.instanceId)
    battleStore.initBattle(null, ['goblin_scout'])
    return { hero: battleStore.heroes[0], enemy: battleStore.enemies[0] }
  }

  it('grant_shield gives shield based on max HP percentage at turn start', () => {
    const { hero } = setupBattle()
    battleStore.setFightLevelEffects([
      { hook: 'on_turn_start', scope: 'heroes', effect: { type: 'grant_shield', value: 10 } }
    ])

    battleStore.processTurnStartEffects(hero)

    // Hero should have a shield effect
    const shieldEffect = hero.statusEffects?.find(e => e.type === 'shield')
    expect(shieldEffect).toBeTruthy()
    expect(shieldEffect.shieldHp).toBe(Math.floor(hero.maxHp * 0.10))
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/battle-fle-phase2.test.js`
Expected: FAIL — heal_percent_damage and grant_shield not handled

**Step 3: Implement in battle.js**

Add `heal_percent_damage` handling to `processPostDamage`:

```js
  function processPostDamage(attacker, target) {
    for (const fle of fightLevelEffects.value) {
      if (fle.hook !== 'on_post_damage') continue

      if (fle.effect.type === 'apply_status' && matchesScope(fle.scope, attacker)) {
        const chance = fle.effect.chance || 100
        if (Math.random() * 100 < chance) {
          applyEffect(target, fle.effect.statusType, {
            duration: fle.effect.duration || 2,
            value: fle.effect.value || 0
          })
        }
      }

      if (fle.effect.type === 'heal_percent_damage' && matchesScope(fle.scope, attacker)) {
        // Heal is calculated by the caller who knows the damage amount
        // We store the percentage; the caller applies it
        // (This is handled in applyDamage where actualDamage is known)
      }
    }
  }
```

**Note:** The `heal_percent_damage` FLE needs access to `actualDamage` — which is only known inside `applyDamage`. The cleanest approach: after HP reduction in `applyDamage`, check for `heal_percent_damage` FLEs and heal the attacker. This is similar to how `processPostDamage` already fires there.

Add inside `applyDamage`, after the HP reduction block where `processPostDamage` is called:

```js
      // FLE: heal_percent_damage — heal attacker for % of actual damage
      if (actualDamage > 0 && attacker) {
        for (const fle of fightLevelEffects.value) {
          if (fle.hook === 'on_post_damage' && fle.effect.type === 'heal_percent_damage' && matchesScope(fle.scope, attacker)) {
            const healAmount = Math.floor(actualDamage * fle.effect.value / 100)
            if (healAmount > 0 && attacker.currentHp > 0) {
              attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount)
              addLog(`${attacker.template?.name || 'Attacker'} heals ${healAmount} HP from lifesteal!`)
            }
          }
        }
      }
```

Add `grant_shield` handling to `processTurnStartEffects`:

```js
      if (fle.effect.type === 'grant_shield' && matchesScope(fle.scope, unit)) {
        const shieldAmount = Math.floor(unit.maxHp * fle.effect.value / 100)
        applyEffect(unit, 'shield', { shieldHp: shieldAmount, duration: 99 })
      }
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/stores/__tests__/battle-fle-phase2.test.js`
Expected: PASS

**Step 5: Run existing FLE tests to ensure no regression**

Run: `npx vitest run src/stores/__tests__/battle-fight-level-effects.test.js`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-fle-phase2.test.js
git commit -m "feat(maw): add heal_percent_damage and grant_shield FLE types"
```

---

## Phase 3: Maw Store — Core Run Logic

### Task 7: Maw Store — State, Daily Reset, Tier Selection

**Files:**
- Create: `src/stores/maw.js`
- Test: `src/stores/__tests__/maw-store.test.js`

**Step 1: Write the failing test**

```js
// src/stores/__tests__/maw-store.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMawStore } from '../maw.js'

describe('Maw Store — Daily State', () => {
  let mawStore

  beforeEach(() => {
    setActivePinia(createPinia())
    mawStore = useMawStore()
  })

  it('initializes with default state', () => {
    expect(mawStore.selectedTier).toBeNull()
    expect(mawStore.bestDepth).toBe(0)
    expect(mawStore.pendingRewards).toBeNull()
    expect(mawStore.closed).toBe(false)
    expect(mawStore.dregs).toBe(0)
    expect(mawStore.tierUnlocks[1]).toBe(true)
    expect(mawStore.activeRun).toBeNull()
  })

  it('generates playerSalt on first use if not set', () => {
    expect(mawStore.playerSalt).toBeNull()
    mawStore.ensurePlayerSalt()
    expect(mawStore.playerSalt).toBeTruthy()
    expect(typeof mawStore.playerSalt).toBe('string')
  })

  it('selectTier locks in a tier for the day', () => {
    mawStore.ensurePlayerSalt()
    const result = mawStore.selectTier(1)
    expect(result.success).toBe(true)
    expect(mawStore.selectedTier).toBe(1)
  })

  it('selectTier rejects locked tiers', () => {
    const result = mawStore.selectTier(2)
    expect(result.success).toBe(false)
    expect(mawStore.selectedTier).toBeNull()
  })

  it('selectTier rejects if already selected today', () => {
    mawStore.ensurePlayerSalt()
    mawStore.selectTier(1)
    const result = mawStore.selectTier(1)
    expect(result.success).toBe(false)
  })

  it('selectTier rejects if closed for the day', () => {
    mawStore.ensurePlayerSalt()
    mawStore.selectTier(1)
    mawStore.closed = true
    mawStore.selectedTier = null
    const result = mawStore.selectTier(1)
    expect(result.success).toBe(false)
  })

  it('checkDailyReset clears daily state on new day', () => {
    mawStore.ensurePlayerSalt()
    mawStore.selectTier(1)
    mawStore.bestDepth = 5
    mawStore.closed = true
    mawStore.lastPlayDate = '2026-02-05'

    // Simulate next day by calling reset
    mawStore.checkDailyReset()

    expect(mawStore.selectedTier).toBeNull()
    expect(mawStore.bestDepth).toBe(0)
    expect(mawStore.closed).toBe(false)
    expect(mawStore.pendingRewards).toBeNull()
    expect(mawStore.activeRun).toBeNull()
  })

  it('checkDailyReset does nothing if same day', () => {
    mawStore.ensurePlayerSalt()
    mawStore.lastPlayDate = new Date().toISOString().split('T')[0]
    mawStore.selectedTier = 1
    mawStore.bestDepth = 5

    mawStore.checkDailyReset()

    expect(mawStore.selectedTier).toBe(1)
    expect(mawStore.bestDepth).toBe(5)
  })

  it('tracks days skipped for rest bonus', () => {
    mawStore.ensurePlayerSalt()
    // Simulate 2 days skipped
    mawStore.lastPlayDate = '2026-02-04'
    // Mock today as 2026-02-06
    vi.spyOn(mawStore, 'getTodayDate').mockReturnValue('2026-02-06')
    mawStore.checkDailyReset()

    expect(mawStore.daysSkipped).toBe(2)
  })

  it('caps rest bonus at 3 days', () => {
    mawStore.ensurePlayerSalt()
    mawStore.lastPlayDate = '2026-01-20'
    vi.spyOn(mawStore, 'getTodayDate').mockReturnValue('2026-02-06')
    mawStore.checkDailyReset()

    expect(mawStore.daysSkipped).toBe(3)
  })

  it('calculates rest bonus multiplier', () => {
    mawStore.daysSkipped = 0
    expect(mawStore.getRestBonusMultiplier()).toBe(1.0)
    mawStore.daysSkipped = 1
    expect(mawStore.getRestBonusMultiplier()).toBe(1.9)
    mawStore.daysSkipped = 2
    expect(mawStore.getRestBonusMultiplier()).toBe(2.8)
    mawStore.daysSkipped = 3
    expect(mawStore.getRestBonusMultiplier()).toBe(3.7)
  })
})

describe('Maw Store — Persistence', () => {
  let mawStore

  beforeEach(() => {
    setActivePinia(createPinia())
    mawStore = useMawStore()
  })

  it('saveState returns all persisted fields', () => {
    mawStore.dregs = 100
    mawStore.tierUnlocks = { 1: true, 2: true }
    mawStore.playerSalt = 'test123'

    const saved = mawStore.saveState()
    expect(saved.dregs).toBe(100)
    expect(saved.tierUnlocks[2]).toBe(true)
    expect(saved.playerSalt).toBe('test123')
  })

  it('loadState restores from saved data', () => {
    mawStore.loadState({
      dregs: 250,
      tierUnlocks: { 1: true, 2: true, 3: true },
      playerSalt: 'saved_salt',
      shopPurchases: { dregs_gold_pack: 3 }
    })

    expect(mawStore.dregs).toBe(250)
    expect(mawStore.tierUnlocks[3]).toBe(true)
    expect(mawStore.playerSalt).toBe('saved_salt')
    expect(mawStore.shopPurchases.dregs_gold_pack).toBe(3)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/maw-store.test.js`
Expected: FAIL — store not found

**Step 3: Write the store**

```js
// src/stores/maw.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createSeed, SeededRandom } from '../utils/seededRandom.js'
import { getAllBoons, getPayoffsForSeed, getSeedBoons } from '../data/maw/boons.js'
import { getWaveConfig, TIER_CONFIG, WAVE_COUNT, BOSS_WAVE } from '../data/maw/waves.js'
import { getMawShopItem } from '../data/maw/shop.js'

export const useMawStore = defineStore('maw', () => {
  // Daily state
  const selectedTier = ref(null)
  const bestDepth = ref(0)
  const pendingRewards = ref(null)
  const closed = ref(false)
  const lastPlayDate = ref(null)
  const daysSkipped = ref(0)

  // Active run
  const activeRun = ref(null)

  // Permanent state
  const tierUnlocks = ref({ 1: true })
  const dregs = ref(0)
  const playerSalt = ref(null)
  const shopPurchases = ref({})

  function getTodayDate() {
    return new Date().toISOString().split('T')[0]
  }

  function ensurePlayerSalt() {
    if (!playerSalt.value) {
      playerSalt.value = Math.random().toString(36).substring(2, 10)
    }
  }

  function selectTier(tier) {
    if (closed.value) return { success: false, message: 'The Maw is closed for today.' }
    if (selectedTier.value !== null) return { success: false, message: 'Tier already selected today.' }
    if (!tierUnlocks.value[tier]) return { success: false, message: 'Tier not unlocked.' }

    ensurePlayerSalt()
    selectedTier.value = tier
    lastPlayDate.value = getTodayDate()
    return { success: true }
  }

  function checkDailyReset() {
    const today = getTodayDate()
    if (lastPlayDate.value && lastPlayDate.value !== today) {
      // Calculate days skipped
      const lastDate = new Date(lastPlayDate.value)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24)) - 1
      daysSkipped.value = Math.min(Math.max(diffDays, 0), 3)

      // Auto-bank best run rewards if not closed
      if (pendingRewards.value && !closed.value) {
        // Auto-close with pending rewards (rest bonus applied at claim time)
      }

      // Reset daily state
      selectedTier.value = null
      bestDepth.value = 0
      pendingRewards.value = null
      closed.value = false
      activeRun.value = null
      lastPlayDate.value = today
    }
  }

  function getRestBonusMultiplier() {
    // 0 days: 1.0, 1 day: 1.9, 2 days: 2.8, 3 days: 3.7
    return 1.0 + (daysSkipped.value * 0.9)
  }

  function getDailySeed() {
    ensurePlayerSalt()
    return createSeed(getTodayDate(), selectedTier.value || 1, playerSalt.value)
  }

  // === Run Management ===

  function startRun() {
    if (!selectedTier.value) return { success: false, message: 'No tier selected.' }
    if (closed.value) return { success: false, message: 'Maw is closed for today.' }

    activeRun.value = {
      tier: selectedTier.value,
      wave: 1,
      boons: [],
      partyState: null,
      rewards: { gold: 0, gems: 0, dregs: 0, items: [] },
      pendingBoonSelection: false,
      boonOfferings: null
    }

    return { success: true }
  }

  function completeWave(partyState) {
    if (!activeRun.value) return { success: false }

    const wave = activeRun.value.wave
    const waveConfig = getWaveConfig(wave)
    const tierConfig = TIER_CONFIG[activeRun.value.tier]

    // Accrue rewards
    activeRun.value.rewards.gold += Math.floor(waveConfig.goldReward * tierConfig.rewardMultiplier)
    activeRun.value.rewards.dregs += Math.floor(waveConfig.dregsReward * tierConfig.rewardMultiplier)

    // Save party state
    activeRun.value.partyState = partyState

    // Update best depth
    if (wave > bestDepth.value) {
      bestDepth.value = wave
      pendingRewards.value = { ...activeRun.value.rewards }
    }

    // Check if boss beaten
    if (wave === BOSS_WAVE) {
      // Unlock next tier
      const nextTier = activeRun.value.tier + 1
      if (nextTier <= 5 && !tierUnlocks.value[nextTier]) {
        tierUnlocks.value = { ...tierUnlocks.value, [nextTier]: true }
      }
      return { success: true, runComplete: true }
    }

    // Generate boon offerings for selection
    activeRun.value.pendingBoonSelection = true
    activeRun.value.boonOfferings = generateBoonOfferings()

    return { success: true, runComplete: false, boonOfferings: activeRun.value.boonOfferings }
  }

  function generateBoonOfferings() {
    const seed = getDailySeed()
    const wave = activeRun.value.wave
    const rng = new SeededRandom(seed + wave * 1000)

    const allBoons = getAllBoons()
    const pickedIds = new Set(activeRun.value.boons.map(b => b.id))
    const available = allBoons.filter(b => !pickedIds.has(b.id))

    if (available.length < 3) return available

    // Weighted by rarity
    const rarityWeights = { common: 60, rare: 30, epic: 10 }

    // Check if player has any seed boons — if so, try to offer a payoff
    const playerSeeds = activeRun.value.boons.filter(b => b.isSeed)
    let guaranteedPayoff = null

    if (playerSeeds.length > 0) {
      const allPayoffs = []
      for (const seed of playerSeeds) {
        const payoffs = getPayoffsForSeed(seed).filter(p => !pickedIds.has(p.id))
        allPayoffs.push(...payoffs)
      }
      if (allPayoffs.length > 0) {
        guaranteedPayoff = rng.pick(allPayoffs)
      }
    }

    const offerings = []

    if (guaranteedPayoff) {
      offerings.push(guaranteedPayoff)
    }

    // Fill remaining slots
    const remaining = available.filter(b => !offerings.some(o => o.id === b.id))
    const weighted = remaining.map(b => ({
      item: b,
      weight: rarityWeights[b.rarity] || 60
    }))

    while (offerings.length < 3 && weighted.length > 0) {
      const pick = rng.weightedPick(weighted)
      offerings.push(pick.item)
      const idx = weighted.indexOf(pick)
      if (idx !== -1) weighted.splice(idx, 1)
    }

    return offerings
  }

  function selectBoon(boonId) {
    if (!activeRun.value?.pendingBoonSelection) return { success: false }

    const offering = activeRun.value.boonOfferings?.find(b => b.id === boonId)
    if (!offering) return { success: false, message: 'Invalid boon selection.' }

    activeRun.value.boons.push(offering)
    activeRun.value.pendingBoonSelection = false
    activeRun.value.boonOfferings = null
    activeRun.value.wave += 1

    return { success: true }
  }

  function endRun() {
    if (!activeRun.value) return { success: false }
    activeRun.value = null
    return { success: true }
  }

  function closeMaw() {
    if (closed.value) return { success: false, message: 'Already closed.' }
    if (!pendingRewards.value) return { success: false, message: 'No rewards to claim.' }

    const multiplier = getRestBonusMultiplier()
    const rewards = {
      gold: Math.floor(pendingRewards.value.gold * multiplier),
      gems: Math.floor((pendingRewards.value.gems || 0) * multiplier),
      dregs: Math.floor(pendingRewards.value.dregs * multiplier)
    }

    dregs.value += rewards.dregs
    closed.value = true
    activeRun.value = null
    daysSkipped.value = 0

    return { success: true, rewards }
  }

  // === Between-Wave Recovery ===

  function applyBetweenWaveRecovery(partyState) {
    // +10% max HP, +5% max MP, all other resources preserved
    const recovered = {}
    for (const [instanceId, state] of Object.entries(partyState)) {
      recovered[instanceId] = { ...state }
      // HP recovery: heal 10% of maxHp (maxHp not in partyState, will be resolved at init)
      recovered[instanceId].hpRecoveryPercent = 10
      recovered[instanceId].mpRecoveryPercent = 5
    }
    return recovered
  }

  // === Dregs Shop ===

  function purchaseShopItem(itemId) {
    const item = getMawShopItem(itemId)
    if (!item) return { success: false, message: 'Item not found.' }

    if (item.maxStock) {
      const purchased = shopPurchases.value[itemId] || 0
      if (purchased >= item.maxStock) return { success: false, message: 'Out of stock.' }
    }

    if (dregs.value < item.cost) return { success: false, message: 'Insufficient Dregs.' }

    dregs.value -= item.cost
    shopPurchases.value = {
      ...shopPurchases.value,
      [itemId]: (shopPurchases.value[itemId] || 0) + 1
    }

    return { success: true, reward: item.reward }
  }

  function getShopItemStock(itemId) {
    const item = getMawShopItem(itemId)
    if (!item) return 0
    if (!item.maxStock) return Infinity
    return item.maxStock - (shopPurchases.value[itemId] || 0)
  }

  // === Persistence ===

  function saveState() {
    return {
      selectedTier: selectedTier.value,
      bestDepth: bestDepth.value,
      pendingRewards: pendingRewards.value,
      closed: closed.value,
      lastPlayDate: lastPlayDate.value,
      daysSkipped: daysSkipped.value,
      activeRun: activeRun.value,
      tierUnlocks: tierUnlocks.value,
      dregs: dregs.value,
      playerSalt: playerSalt.value,
      shopPurchases: shopPurchases.value
    }
  }

  function loadState(savedState) {
    if (savedState?.selectedTier !== undefined) selectedTier.value = savedState.selectedTier
    if (savedState?.bestDepth !== undefined) bestDepth.value = savedState.bestDepth
    if (savedState?.pendingRewards !== undefined) pendingRewards.value = savedState.pendingRewards
    if (savedState?.closed !== undefined) closed.value = savedState.closed
    if (savedState?.lastPlayDate !== undefined) lastPlayDate.value = savedState.lastPlayDate
    if (savedState?.daysSkipped !== undefined) daysSkipped.value = savedState.daysSkipped
    if (savedState?.activeRun !== undefined) activeRun.value = savedState.activeRun
    if (savedState?.tierUnlocks !== undefined) tierUnlocks.value = savedState.tierUnlocks
    if (savedState?.dregs !== undefined) dregs.value = savedState.dregs
    if (savedState?.playerSalt !== undefined) playerSalt.value = savedState.playerSalt
    if (savedState?.shopPurchases !== undefined) shopPurchases.value = savedState.shopPurchases
  }

  return {
    // State
    selectedTier, bestDepth, pendingRewards, closed,
    lastPlayDate, daysSkipped, activeRun,
    tierUnlocks, dregs, playerSalt, shopPurchases,
    // Actions
    getTodayDate, ensurePlayerSalt, selectTier,
    checkDailyReset, getRestBonusMultiplier, getDailySeed,
    startRun, completeWave, selectBoon, endRun, closeMaw,
    applyBetweenWaveRecovery, generateBoonOfferings,
    purchaseShopItem, getShopItemStock,
    // Persistence
    saveState, loadState
  }
})
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/stores/__tests__/maw-store.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/maw.js src/stores/__tests__/maw-store.test.js
git commit -m "feat(maw): add Maw store with daily state, tier selection, and persistence"
```

---

### Task 8: Maw Store — Run Flow (Start, Wave, Boon, Close)

**Files:**
- Test: `src/stores/__tests__/maw-run-flow.test.js`
- Modify: `src/stores/maw.js` (if needed based on test results)

**Step 1: Write the failing test**

```js
// src/stores/__tests__/maw-run-flow.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMawStore } from '../maw.js'

describe('Maw Run Flow', () => {
  let mawStore

  beforeEach(() => {
    setActivePinia(createPinia())
    mawStore = useMawStore()
    mawStore.ensurePlayerSalt()
    mawStore.selectTier(1)
  })

  it('startRun creates an active run', () => {
    const result = mawStore.startRun()
    expect(result.success).toBe(true)
    expect(mawStore.activeRun).toBeTruthy()
    expect(mawStore.activeRun.wave).toBe(1)
    expect(mawStore.activeRun.boons).toEqual([])
    expect(mawStore.activeRun.tier).toBe(1)
  })

  it('startRun rejects without tier selected', () => {
    mawStore.selectedTier = null
    const result = mawStore.startRun()
    expect(result.success).toBe(false)
  })

  it('completeWave accrues rewards', () => {
    mawStore.startRun()
    const mockPartyState = { hero1: { currentHp: 100 } }
    const result = mawStore.completeWave(mockPartyState)

    expect(result.success).toBe(true)
    expect(mawStore.activeRun.rewards.gold).toBeGreaterThan(0)
    expect(mawStore.activeRun.rewards.dregs).toBeGreaterThan(0)
  })

  it('completeWave updates bestDepth', () => {
    mawStore.startRun()
    mawStore.completeWave({})
    expect(mawStore.bestDepth).toBe(1)
  })

  it('completeWave offers 3 boons after non-boss wave', () => {
    mawStore.startRun()
    const result = mawStore.completeWave({})
    expect(result.runComplete).toBe(false)
    expect(mawStore.activeRun.pendingBoonSelection).toBe(true)
    expect(mawStore.activeRun.boonOfferings).toHaveLength(3)
  })

  it('selectBoon adds boon and advances wave', () => {
    mawStore.startRun()
    mawStore.completeWave({})
    const boonId = mawStore.activeRun.boonOfferings[0].id

    const result = mawStore.selectBoon(boonId)
    expect(result.success).toBe(true)
    expect(mawStore.activeRun.boons).toHaveLength(1)
    expect(mawStore.activeRun.wave).toBe(2)
    expect(mawStore.activeRun.pendingBoonSelection).toBe(false)
  })

  it('selectBoon rejects invalid boon id', () => {
    mawStore.startRun()
    mawStore.completeWave({})
    const result = mawStore.selectBoon('totally_fake_boon')
    expect(result.success).toBe(false)
  })

  it('full run through 11 waves', () => {
    mawStore.startRun()

    for (let wave = 1; wave <= 10; wave++) {
      const result = mawStore.completeWave({})
      expect(result.success).toBe(true)

      if (wave < 10) {
        // Not boss wave — pick a boon
        expect(result.runComplete).toBeFalsy()
        const boon = mawStore.activeRun.boonOfferings[0]
        mawStore.selectBoon(boon.id)
      } else {
        // Wave 10 complete — pick boon, then next is boss
        mawStore.selectBoon(mawStore.activeRun.boonOfferings[0].id)
      }
    }

    // Wave 11 — boss
    expect(mawStore.activeRun.wave).toBe(11)
    const bossResult = mawStore.completeWave({})
    expect(bossResult.runComplete).toBe(true)
    expect(mawStore.bestDepth).toBe(11)
  })

  it('completeWave on boss unlocks next tier', () => {
    mawStore.startRun()

    // Run through all waves
    for (let wave = 1; wave <= 10; wave++) {
      mawStore.completeWave({})
      mawStore.selectBoon(mawStore.activeRun.boonOfferings[0].id)
    }
    mawStore.completeWave({}) // Boss wave 11

    expect(mawStore.tierUnlocks[2]).toBe(true)
  })

  it('closeMaw banks rewards with rest bonus', () => {
    mawStore.daysSkipped = 1 // 1.9x multiplier
    mawStore.startRun()
    mawStore.completeWave({})
    mawStore.selectBoon(mawStore.activeRun.boonOfferings[0].id)

    const result = mawStore.closeMaw()
    expect(result.success).toBe(true)
    expect(result.rewards.dregs).toBeGreaterThan(0)
    expect(mawStore.dregs).toBe(result.rewards.dregs)
    expect(mawStore.closed).toBe(true)
    expect(mawStore.daysSkipped).toBe(0) // consumed
  })

  it('closeMaw rejects if no rewards', () => {
    const result = mawStore.closeMaw()
    expect(result.success).toBe(false)
  })

  it('endRun clears active run', () => {
    mawStore.startRun()
    mawStore.endRun()
    expect(mawStore.activeRun).toBeNull()
  })

  it('boon offerings are deterministic (same seed = same offerings)', () => {
    mawStore.startRun()
    mawStore.completeWave({})
    const offerings1 = [...mawStore.activeRun.boonOfferings]

    // End and restart — same seed
    mawStore.endRun()
    mawStore.startRun()
    mawStore.completeWave({})
    const offerings2 = [...mawStore.activeRun.boonOfferings]

    expect(offerings1.map(b => b.id)).toEqual(offerings2.map(b => b.id))
  })
})

describe('Maw Store — Shop', () => {
  let mawStore

  beforeEach(() => {
    setActivePinia(createPinia())
    mawStore = useMawStore()
    mawStore.dregs = 500
  })

  it('purchaseShopItem deducts dregs and tracks purchase', () => {
    const result = mawStore.purchaseShopItem('dregs_gold_pack')
    expect(result.success).toBe(true)
    expect(result.reward).toBeTruthy()
    expect(mawStore.dregs).toBe(480) // 500 - 20
    expect(mawStore.shopPurchases.dregs_gold_pack).toBe(1)
  })

  it('purchaseShopItem rejects if insufficient dregs', () => {
    mawStore.dregs = 5
    const result = mawStore.purchaseShopItem('dregs_gold_pack')
    expect(result.success).toBe(false)
  })

  it('purchaseShopItem respects stock limits', () => {
    // Buy max stock of gem packs (maxStock: 5)
    for (let i = 0; i < 5; i++) {
      mawStore.purchaseShopItem('dregs_gem_pack')
    }
    const result = mawStore.purchaseShopItem('dregs_gem_pack')
    expect(result.success).toBe(false)
  })

  it('getShopItemStock returns remaining stock', () => {
    expect(mawStore.getShopItemStock('dregs_gem_pack')).toBe(5)
    mawStore.purchaseShopItem('dregs_gem_pack')
    expect(mawStore.getShopItemStock('dregs_gem_pack')).toBe(4)
  })

  it('unlimited stock items always available', () => {
    expect(mawStore.getShopItemStock('dregs_gold_pack')).toBe(Infinity)
    for (let i = 0; i < 10; i++) {
      mawStore.purchaseShopItem('dregs_gold_pack')
    }
    expect(mawStore.getShopItemStock('dregs_gold_pack')).toBe(Infinity)
  })
})
```

**Step 2: Run test to verify it passes** (store was already implemented in Task 7)

Run: `npx vitest run src/stores/__tests__/maw-run-flow.test.js`
Expected: PASS (or fix any issues discovered)

**Step 3: Fix any issues and commit**

```bash
git add src/stores/__tests__/maw-run-flow.test.js
git commit -m "test(maw): add comprehensive run flow and shop tests"
```

---

## Phase 4: Integration — Wiring Maw to Battle Engine

### Task 9: App.vue Integration (Store Registration + Navigation)

**Files:**
- Modify: `src/App.vue` (imports, persistedStores, navigate)
- Modify: `src/utils/storage.js` (add maw to save/load)

**Step 1: Add maw store import and registration**

In `src/App.vue`:
- Add import: `import { useMawStore } from './stores/maw.js'`
- Add store init: `const mawStore = useMawStore()`
- Add to `persistedStores`: `maw: mawStore`
- Add navigate case: `} else if (screen === 'maw') { /* no special param needed */ }`

In `src/utils/storage.js`:
- Add `maw` to the destructured stores in both `saveGame` and `loadGame`
- Add save line: `maw: maw?.saveState() || { tierUnlocks: { 1: true }, dregs: 0 }`
- Add load line: `if (saveData.maw && maw) maw.loadState(saveData.maw)`
- Bump `SAVE_VERSION` to 12

**Step 2: Commit**

```bash
git add src/App.vue src/utils/storage.js
git commit -m "feat(maw): register Maw store and navigation in App.vue"
```

---

### Task 10: MawScreen.vue — Entry Screen

**Files:**
- Create: `src/screens/MawScreen.vue`
- Modify: `src/App.vue` (add to template)

This is the entry point for The Maw. Shows:
- Tier selection (or locked-in tier display)
- Today's best depth
- Rest bonus indicator
- "Close The Maw" button
- "Resume Run" if active run exists

**Step 1: Create the screen component**

Use the `impeccable:frontend-design` skill for the UI design. The screen should follow the dark fantasy aesthetic with:
- Dark background matching the Maw theme (sickly greens/purples)
- Tier buttons showing lock state, level range, reward multiplier
- Best depth progress bar (0-11 waves)
- Rest bonus badge if days skipped > 0
- Close button to bank rewards

**Step 2: Wire into App.vue template**

Add `<MawScreen v-else-if="currentScreen === 'maw'" @navigate="navigate" />` to the template.

**Step 3: Commit**

```bash
git add src/screens/MawScreen.vue src/App.vue
git commit -m "feat(maw): add MawScreen entry UI with tier selection"
```

---

### Task 11: BattleScreen Integration — Maw Battle Flow

**Files:**
- Modify: `src/screens/BattleScreen.vue`
- Test: Manual testing (BattleScreen is a Vue component)

The BattleScreen needs to:
1. Detect `battleType === 'maw'` (set by the MawScreen before navigating to battle)
2. After victory: call `mawStore.completeWave(battleStore.getPartyState())`
3. Apply FLEs from accumulated boons: `battleStore.setFightLevelEffects(mawStore.activeRun.boons)`
4. Show wave indicator (e.g., "Wave 3/11")
5. On defeat: navigate back to MawScreen (run ends, best depth preserved)

**Key integration points in BattleScreen.vue:**
- After `initBattle`, apply boons as FLEs
- Override victory handler to route to boon selection instead of rewards
- Between waves: apply `applyBetweenWaveRecovery` to party state
- Show active boon count in header

**Step 1: Implement integration**

Add to BattleScreen's battle initialization:
```js
// After initBattle for Maw battles
if (props.battleType === 'maw') {
  const mawStore = useMawStore()
  if (mawStore.activeRun?.boons.length > 0) {
    battleStore.setFightLevelEffects(mawStore.activeRun.boons)
  }
}
```

Add to victory handler:
```js
if (props.battleType === 'maw') {
  const partyState = battleStore.getPartyState()
  const result = mawStore.completeWave(partyState)
  if (result.runComplete) {
    emit('navigate', 'maw') // Boss beaten, back to entry
  } else {
    // Show boon selection overlay
    showBoonSelection.value = true
    boonOfferings.value = result.boonOfferings
  }
  return
}
```

**Step 2: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat(maw): integrate Maw battle flow with BattleScreen"
```

---

### Task 12: Boon Selection UI

**Files:**
- Create: `src/components/BoonSelectionOverlay.vue`
- Modify: `src/screens/BattleScreen.vue` (or `MawScreen.vue`)

Full-screen overlay showing 3 boon cards with:
- Boon name, description, rarity glow
- Category color accent (red/blue/green/purple)
- Seed/payoff tag badges for synergy visibility
- Highlight payoff boons that match drafted seeds
- Tap to select, brief confirmation

Use the `impeccable:frontend-design` skill for the design.

**Step 1: Create the component**
**Step 2: Wire into the battle/maw flow**
**Step 3: Commit**

```bash
git add src/components/BoonSelectionOverlay.vue
git commit -m "feat(maw): add boon selection overlay with synergy highlights"
```

---

### Task 13: Dregs Shop Screen

**Files:**
- Create: `src/components/DregsShopPanel.vue` (or integrate into MawScreen)

Shows Dregs balance, shop items with cost/stock, purchase buttons.
Follows existing shop patterns (ColosseumScreen shop section).

**Step 1: Create the component**
**Step 2: Wire into MawScreen**
**Step 3: Commit**

```bash
git add src/components/DregsShopPanel.vue src/screens/MawScreen.vue
git commit -m "feat(maw): add Dregs shop UI"
```

---

## Phase 5: Enemy Wave Generation

### Task 14: Wave Enemy Generation

**Files:**
- Create: `src/data/maw/enemies.js`
- Test: `src/data/__tests__/maw-enemies.test.js`

The Maw draws enemies from the existing enemy template pool. The daily seed determines enemy compositions per wave. Enemy stats are scaled based on the tier's level range and wave progression.

**Step 1: Write the failing test**

```js
// src/data/__tests__/maw-enemies.test.js
import { describe, it, expect } from 'vitest'
import { generateWaveEnemies } from '../maw/enemies.js'
import { SeededRandom } from '../../utils/seededRandom.js'

describe('Maw Wave Enemy Generation', () => {
  it('generates enemies for a wave', () => {
    const rng = new SeededRandom(42)
    const enemies = generateWaveEnemies(rng, 1, 1) // wave 1, tier 1
    expect(enemies.length).toBeGreaterThan(0)
    enemies.forEach(e => {
      expect(e.templateId).toBeTruthy()
      expect(e.level).toBeGreaterThan(0)
    })
  })

  it('generates more enemies in later phases', () => {
    const rng1 = new SeededRandom(42)
    const rng2 = new SeededRandom(42)
    const wave1 = generateWaveEnemies(rng1, 1, 1)
    // Advance rng2 past wave 1
    generateWaveEnemies(rng2, 1, 1)
    const wave9 = generateWaveEnemies(rng2, 9, 1)
    expect(wave9.length).toBeGreaterThanOrEqual(wave1.length)
  })

  it('scales enemy level with tier', () => {
    const rng1 = new SeededRandom(42)
    const rng2 = new SeededRandom(42)
    const tier1 = generateWaveEnemies(rng1, 1, 1)
    const tier3 = generateWaveEnemies(rng2, 1, 3)
    // Tier 3 enemies should have higher levels
    expect(tier3[0].level).toBeGreaterThan(tier1[0].level)
  })

  it('is deterministic with same seed', () => {
    const rng1 = new SeededRandom(42)
    const rng2 = new SeededRandom(42)
    const enemies1 = generateWaveEnemies(rng1, 1, 1)
    const enemies2 = generateWaveEnemies(rng2, 1, 1)
    expect(enemies1.map(e => e.templateId)).toEqual(enemies2.map(e => e.templateId))
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/maw-enemies.test.js`

**Step 3: Write implementation**

```js
// src/data/maw/enemies.js
import { getAllEnemyTemplates } from '../enemies/index.js'
import { getWaveConfig, TIER_CONFIG } from './waves.js'

// Enemy pool for The Maw — draw from existing templates
// Exclude summoned enemies and Genus Loci bosses
function getEnemyPool() {
  return getAllEnemyTemplates().filter(e =>
    !e.isSummon && !e.isGenusLoci
  )
}

export function generateWaveEnemies(rng, wave, tier) {
  const config = getWaveConfig(wave)
  const tierConfig = TIER_CONFIG[tier]
  const pool = getEnemyPool()

  if (pool.length === 0) return []

  const enemyCount = rng.int(config.enemyCount.min, config.enemyCount.max)
  const levelRange = tierConfig.levelRange
  // Scale level within tier range based on wave progression
  const waveProgress = wave / 11
  const baseLevel = Math.floor(levelRange.min + (levelRange.max - levelRange.min) * waveProgress)

  const enemies = []
  for (let i = 0; i < enemyCount; i++) {
    const template = rng.pick(pool)
    const level = baseLevel + rng.int(-2, 2)
    enemies.push({
      templateId: template.id,
      level: Math.max(1, level)
    })
  }

  return enemies
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/maw-enemies.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/maw/enemies.js src/data/__tests__/maw-enemies.test.js
git commit -m "feat(maw): add seeded wave enemy generation"
```

---

## Phase 6: Polish and Verification

### Task 15: Run All Tests

Run: `npx vitest run`
Expected: All tests PASS

Fix any regressions.

### Task 16: Verify Persistence Round-Trip

Write a quick integration test ensuring the Maw store survives save/load:

```js
// In maw-store.test.js — add to persistence describe block
it('round-trips through save/load', () => {
  mawStore.dregs = 100
  mawStore.ensurePlayerSalt()
  mawStore.selectTier(1)
  mawStore.startRun()
  mawStore.completeWave({})
  mawStore.selectBoon(mawStore.activeRun.boonOfferings[0].id)

  const saved = mawStore.saveState()

  // Create fresh store
  const freshPinia = createPinia()
  setActivePinia(freshPinia)
  const freshStore = useMawStore()
  freshStore.loadState(saved)

  expect(freshStore.dregs).toBe(100)
  expect(freshStore.selectedTier).toBe(1)
  expect(freshStore.activeRun.wave).toBe(2)
  expect(freshStore.activeRun.boons).toHaveLength(1)
})
```

### Task 17: Final Commit and Verification

Run all tests one final time, commit any remaining changes.

```bash
npx vitest run
git add -A
git commit -m "feat(maw): complete The Maw implementation — daily roguelike challenge"
```

---

## Summary of All New Files

| File | Purpose |
|------|---------|
| `src/utils/seededRandom.js` | Deterministic RNG for daily seeds |
| `src/utils/__tests__/seededRandom.test.js` | Tests for seeded RNG |
| `src/data/maw/boons.js` | Boon definitions with seed/payoff system |
| `src/data/maw/shop.js` | Dregs shop item definitions |
| `src/data/maw/waves.js` | Wave configuration and tier definitions |
| `src/data/maw/enemies.js` | Seeded wave enemy generation |
| `src/data/__tests__/maw-boons.test.js` | Boon data tests |
| `src/data/__tests__/maw-shop.test.js` | Shop data tests |
| `src/data/__tests__/maw-waves.test.js` | Wave config tests |
| `src/data/__tests__/maw-enemies.test.js` | Enemy generation tests |
| `src/stores/maw.js` | Maw game mode store |
| `src/stores/__tests__/maw-store.test.js` | Store state/daily/persistence tests |
| `src/stores/__tests__/maw-run-flow.test.js` | Run flow/shop tests |
| `src/stores/__tests__/battle-party-state.test.js` | Full resource carryover tests |
| `src/stores/__tests__/battle-fle-phase2.test.js` | New FLE type tests |
| `src/screens/MawScreen.vue` | Maw entry UI |
| `src/components/BoonSelectionOverlay.vue` | Boon picker UI |
| `src/components/DregsShopPanel.vue` | Dregs shop UI |

## Modified Files

| File | Change |
|------|--------|
| `src/stores/battle.js` | Expand `getPartyState`, restore resources in `initBattle`, add FLE types |
| `src/screens/BattleScreen.vue` | Maw battle flow, wave indicator, boon selection routing |
| `src/App.vue` | Import MawScreen, register maw store, add navigation |
| `src/utils/storage.js` | Add maw to save/load, bump version |
