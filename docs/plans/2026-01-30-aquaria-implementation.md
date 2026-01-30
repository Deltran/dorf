# Aquaria Super Region Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the complete Aquaria super region with 14 regions (9 main + 5 branch), 75 quest nodes, ~52 new enemies, 4 mini-bosses, and 1 Genus Loci.

**Architecture:** Each region is a self-contained quest file with nodes and a regionMeta export. Enemies are grouped by thematic area. Mini-bosses use the multi-skill enemy pattern. Thalassion (Genus Loci) follows the existing genusLoci.js pattern with abilities in genusLociAbilities.js.

**Tech Stack:** Vue 3, Vite, JavaScript modules

**Parallelization:** Tasks 1-14 (enemies) are fully independent. Tasks 15-28 (regions) are mostly independent but have connection dependencies. Task 29-31 are sequential updates.

---

## Phase 1: Enemy Files (Fully Parallelizable)

Each enemy file can be created independently. Follow the pattern in `src/data/enemies/coral.js`.

### Task 1: Create Tidewall Ruins Enemies

**Files:**
- Create: `src/data/enemies/tidewall.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  ruin_scavenger: {
    id: 'ruin_scavenger',
    name: 'Ruin Scavenger',
    stats: { hp: 180, atk: 52, def: 20, spd: 22 },
    skill: {
      name: 'Opportunist',
      description: 'Deal 150% ATK damage. +50% damage to DEF down targets.',
      cooldown: 3,
      damagePercent: 150,
      bonusToDebuffed: { type: 'def_down', bonus: 50 }
    }
  },
  decay_jelly: {
    id: 'decay_jelly',
    name: 'Decay Jelly',
    stats: { hp: 150, atk: 45, def: 18, spd: 8 },
    skill: {
      name: 'Corrosive Touch',
      description: 'Reduce target DEF by 25% for 3 turns',
      cooldown: 3,
      noDamage: true,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 3, value: 25 }
      ]
    }
  },
  corroded_sentinel: {
    id: 'corroded_sentinel',
    name: 'Corroded Sentinel',
    stats: { hp: 320, atk: 48, def: 50, spd: 4 },
    skill: {
      name: 'Rusted Slam',
      description: 'Deal 120% ATK damage and taunt for 2 turns',
      cooldown: 4,
      damagePercent: 120,
      effects: [
        { type: EffectType.TAUNT, target: 'self', duration: 2 }
      ]
    }
  },
  tide_lurker: {
    id: 'tide_lurker',
    name: 'Tide Lurker',
    stats: { hp: 200, atk: 55, def: 22, spd: 18 },
    skill: {
      name: 'Ambush',
      description: 'Deal 180% ATK damage on first attack',
      cooldown: 0,
      damagePercent: 180,
      firstAttackOnly: true
    }
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/tidewall.js`
Expected: No syntax errors

---

### Task 2: Create Outer Currents Enemies

**Files:**
- Create: `src/data/enemies/currents.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  aquarian_enforcer: {
    id: 'aquarian_enforcer',
    name: 'Aquarian Enforcer',
    stats: { hp: 240, atk: 58, def: 32, spd: 14 },
    skill: {
      name: 'Trident Thrust',
      description: 'Deal 150% ATK damage. +30% to Marked targets.',
      cooldown: 3,
      damagePercent: 150,
      bonusToDebuffed: { type: 'marked', bonus: 30 }
    }
  },
  current_mage: {
    id: 'current_mage',
    name: 'Current Mage',
    stats: { hp: 170, atk: 62, def: 20, spd: 16 },
    skill: {
      name: 'Riptide Mark',
      description: 'Mark target for 2 turns (+30% damage taken)',
      cooldown: 3,
      noDamage: true,
      effects: [
        { type: EffectType.MARKED, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  patrol_shark: {
    id: 'patrol_shark',
    name: 'Patrol Shark',
    stats: { hp: 260, atk: 65, def: 25, spd: 20 },
    skill: {
      name: 'Blood Frenzy',
      description: 'Deal 160% ATK damage. +20% ATK per enemy below 50% HP.',
      cooldown: 3,
      damagePercent: 160,
      frenzyBonus: { threshold: 50, atkPerTarget: 20 }
    }
  },
  checkpoint_warden: {
    id: 'checkpoint_warden',
    name: 'Checkpoint Warden',
    stats: { hp: 300, atk: 50, def: 45, spd: 10 },
    skill: {
      name: 'Rally',
      description: 'All allies gain +25% ATK for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 25 }
      ]
    }
  },
  commander_tideclaw: {
    id: 'commander_tideclaw',
    name: 'Commander Tideclaw',
    stats: { hp: 1800, atk: 85, def: 50, spd: 16 },
    imageSize: 160,
    skills: [
      {
        name: "Marshal's Command",
        description: 'All allies +40% ATK/SPD for 2 turns. Self taunts 1 turn.',
        cooldown: 3,
        noDamage: true,
        effects: [
          { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 40 },
          { type: EffectType.SPD_UP, target: 'all_allies', duration: 2, value: 40 },
          { type: EffectType.TAUNT, target: 'self', duration: 1 }
        ]
      },
      {
        name: "Executioner's Verdict",
        description: 'Deal 200% ATK to lowest HP hero. If kills, heal all allies 15%.',
        cooldown: 4,
        damagePercent: 200,
        targetLowestHp: true,
        onKill: { healAllAllies: 15 }
      }
    ]
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/currents.js`
Expected: No syntax errors

---

### Task 3: Create The Murk Enemies

**Files:**
- Create: `src/data/enemies/murk.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  murk_stalker: {
    id: 'murk_stalker',
    name: 'Murk Stalker',
    stats: { hp: 220, atk: 68, def: 24, spd: 24 },
    skill: {
      name: 'Shadowstrike',
      description: 'Deal 200% ATK to Blinded targets, 130% otherwise',
      cooldown: 3,
      damagePercent: 130,
      bonusToDebuffed: { type: 'blind', bonus: 70 }
    }
  },
  blind_angler: {
    id: 'blind_angler',
    name: 'Blind Angler',
    stats: { hp: 200, atk: 55, def: 28, spd: 12 },
    skill: {
      name: 'Lure Light',
      description: 'Blind target for 2 turns (50% miss chance)',
      cooldown: 3,
      noDamage: true,
      effects: [
        { type: EffectType.EVASION, target: 'hero', duration: 2, value: -50, isBlind: true }
      ]
    }
  },
  outcast_thug: {
    id: 'outcast_thug',
    name: 'Outcast Thug',
    stats: { hp: 280, atk: 60, def: 35, spd: 10 },
    skill: {
      name: 'Desperate Swing',
      description: 'Deal 140% ATK. +40% ATK when below 50% HP.',
      cooldown: 3,
      damagePercent: 140,
      desperateBonus: { threshold: 50, atkBonus: 40 }
    }
  },
  shadow_eel: {
    id: 'shadow_eel',
    name: 'Shadow Eel',
    stats: { hp: 190, atk: 72, def: 18, spd: 26 },
    skill: {
      name: 'Darting Strike',
      description: 'Deal 160% ATK and gain 30% Evasion for 1 turn',
      cooldown: 3,
      damagePercent: 160,
      effects: [
        { type: EffectType.EVASION, target: 'self', duration: 1, value: 30 }
      ]
    }
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/murk.js`
Expected: No syntax errors

---

### Task 4: Create Beggar's Reef Enemies

**Files:**
- Create: `src/data/enemies/beggar.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  plague_bearer: {
    id: 'plague_bearer',
    name: 'Plague Bearer',
    stats: { hp: 240, atk: 58, def: 30, spd: 11 },
    skill: {
      name: 'Spreading Sickness',
      description: 'Plague target + adjacent (5% max HP/turn, 3 turns)',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.POISON, target: 'hero_and_adjacent', duration: 3, value: 5, isPlague: true }
      ]
    }
  },
  desperate_vagrant: {
    id: 'desperate_vagrant',
    name: 'Desperate Vagrant',
    stats: { hp: 180, atk: 65, def: 22, spd: 15 },
    skill: {
      name: 'Nothing to Lose',
      description: 'On death, deal 80% ATK to random hero',
      cooldown: 0,
      isPassive: true,
      onDeath: { damagePercent: 80, targetType: 'random_hero' }
    }
  },
  slum_enforcer: {
    id: 'slum_enforcer',
    name: 'Slum Enforcer',
    stats: { hp: 320, atk: 62, def: 40, spd: 8 },
    skill: {
      name: 'Shakedown',
      description: 'Deal 130% ATK and steal target shield',
      cooldown: 4,
      damagePercent: 130,
      stealShield: true
    }
  },
  reef_rat_swarm: {
    id: 'reef_rat_swarm',
    name: 'Reef Rat Swarm',
    stats: { hp: 160, atk: 50, def: 15, spd: 20 },
    skill: {
      name: 'Gnawing Frenzy',
      description: '4x40% ATK hits. Each hit on Plagued extends duration +1',
      cooldown: 4,
      multiHit: 4,
      damagePercent: 40,
      extendDebuff: { type: 'poison', turns: 1 }
    }
  },
  the_blightmother: {
    id: 'the_blightmother',
    name: 'The Blightmother',
    stats: { hp: 2000, atk: 78, def: 42, spd: 12 },
    imageSize: 160,
    skills: [
      {
        name: 'Epidemic',
        description: 'Plague ALL heroes (5% max HP/turn, 3 turns). Heal self 10% per infected.',
        cooldown: 3,
        noDamage: true,
        targetType: 'all_heroes',
        effects: [
          { type: EffectType.POISON, target: 'all_heroes', duration: 3, value: 5, isPlague: true }
        ],
        healPerTarget: 10
      },
      {
        name: "Mercy's End",
        description: '180% ATK. +50% and reset duration if target Plagued.',
        cooldown: 4,
        damagePercent: 180,
        bonusToDebuffed: { type: 'poison', bonus: 50, resetDuration: true }
      }
    ]
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/beggar.js`
Expected: No syntax errors

---

### Task 5: Create Pearlgate Plaza Enemies

**Files:**
- Create: `src/data/enemies/pearlgate.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  pearl_guard: {
    id: 'pearl_guard',
    name: 'Pearl Guard',
    stats: { hp: 300, atk: 72, def: 42, spd: 14 },
    skill: {
      name: 'Ceremonial Strike',
      description: 'Deal 150% ATK. +50% if an ally died this battle.',
      cooldown: 3,
      damagePercent: 150,
      bonusIfAllyDied: 50
    }
  },
  nobles_bodyguard: {
    id: 'nobles_bodyguard',
    name: "Noble's Bodyguard",
    stats: { hp: 380, atk: 60, def: 55, spd: 12 },
    skill: {
      name: 'Intercept',
      description: 'Guard lowest HP ally for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.GUARDING, target: 'lowest_hp_ally', duration: 2 }
      ]
    }
  },
  court_mage: {
    id: 'court_mage',
    name: 'Court Mage',
    stats: { hp: 220, atk: 78, def: 28, spd: 16 },
    skill: {
      name: 'Tidal Blessing',
      description: 'Heal ally 20% max HP and +30% DEF for 2 turns',
      cooldown: 4,
      noDamage: true,
      healAlly: 20,
      effects: [
        { type: EffectType.DEF_UP, target: 'ally', duration: 2, value: 30 }
      ]
    }
  },
  gilded_construct: {
    id: 'gilded_construct',
    name: 'Gilded Construct',
    stats: { hp: 350, atk: 68, def: 50, spd: 6 },
    skill: {
      name: 'Gilded Slam',
      description: 'Deal 170% ATK to all heroes',
      cooldown: 4,
      initialCooldown: 4,
      damagePercent: 170,
      targetType: 'all_heroes'
    }
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/pearlgate.js`
Expected: No syntax errors

---

### Task 6: Create Coral Castle Halls Enemies

**Files:**
- Create: `src/data/enemies/castle.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  coralsworn_knight: {
    id: 'coralsworn_knight',
    name: 'Coralsworn Knight',
    stats: { hp: 340, atk: 80, def: 48, spd: 13 },
    skill: {
      name: 'Marked for Death',
      description: 'Deal 140% ATK and mark target (+40% beast damage)',
      cooldown: 3,
      damagePercent: 140,
      effects: [
        { type: EffectType.MARKED, target: 'hero', duration: 2, value: 40, beastOnly: true }
      ]
    }
  },
  kings_hound: {
    id: 'kings_hound',
    name: "King's Hound",
    stats: { hp: 280, atk: 88, def: 32, spd: 22 },
    isBeast: true,
    skill: {
      name: 'Savage Pursuit',
      description: '180% to marked (120% otherwise). Double attack below 30% HP.',
      cooldown: 3,
      damagePercent: 120,
      bonusToDebuffed: { type: 'marked', bonus: 60 },
      doubleAttackThreshold: 30
    }
  },
  castle_sentinel: {
    id: 'castle_sentinel',
    name: 'Castle Sentinel',
    stats: { hp: 420, atk: 65, def: 60, spd: 5 },
    skill: {
      name: 'Coral Chains',
      description: 'Stun target 1 turn. Self-stun 1 turn.',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1 },
        { type: EffectType.STUN, target: 'self', duration: 1 }
      ]
    }
  },
  royal_caster: {
    id: 'royal_caster',
    name: 'Royal Caster',
    stats: { hp: 250, atk: 82, def: 30, spd: 15 },
    skill: {
      name: "King's Mandate",
      description: 'All allies +20% ATK/SPD for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 20 },
        { type: EffectType.SPD_UP, target: 'all_allies', duration: 2, value: 20 }
      ]
    }
  },
  lord_coralhart: {
    id: 'lord_coralhart',
    name: 'Lord Coralhart',
    stats: { hp: 2400, atk: 95, def: 60, spd: 14 },
    imageSize: 160,
    skills: [
      {
        name: 'For the Crown!',
        description: 'Summon 2 Coralsworn Knights. If present, +50% ATK instead.',
        cooldown: 3,
        summon: { enemyId: 'coralsworn_knight', count: 2 },
        altIfSummonsPresent: { buffSelf: { type: EffectType.ATK_UP, value: 50, duration: 2 } }
      },
      {
        name: 'Oathbound Strike',
        description: '220% ATK. +30% per fallen ally (including summons).',
        cooldown: 4,
        damagePercent: 220,
        bonusPerDeadAlly: 30
      }
    ]
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/castle.js`
Expected: No syntax errors

---

### Task 7: Create Throne Approach Enemies

**Files:**
- Create: `src/data/enemies/throne.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  throne_guardian: {
    id: 'throne_guardian',
    name: 'Throne Guardian',
    stats: { hp: 480, atk: 75, def: 65, spd: 8 },
    skill: {
      name: 'Unbreaking Vigil',
      description: 'Taunt all for 2 turns. -25% damage taken.',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.TAUNT, target: 'self', duration: 2 },
        { type: EffectType.DAMAGE_REDUCTION, target: 'self', duration: 2, value: 25 }
      ]
    }
  },
  mind_touched_advisor: {
    id: 'mind_touched_advisor',
    name: 'Mind-Touched Advisor',
    stats: { hp: 280, atk: 85, def: 35, spd: 14 },
    skill: {
      name: 'Psychic Fray',
      description: 'Target ATK/DEF -30% for 2 turns',
      cooldown: 3,
      noDamage: true,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 30 },
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  fanatical_zealot: {
    id: 'fanatical_zealot',
    name: 'Fanatical Zealot',
    stats: { hp: 300, atk: 105, def: 28, spd: 18 },
    skill: {
      name: 'Ecstatic Strike',
      description: '200% to debuffed (130% otherwise). 15% recoil.',
      cooldown: 3,
      damagePercent: 130,
      bonusToDebuffed: { type: 'any', bonus: 70 },
      recoilPercent: 15
    }
  },
  the_corrupted: {
    id: 'the_corrupted',
    name: 'The Corrupted',
    stats: { hp: 350, atk: 90, def: 40, spd: 12 },
    skill: {
      name: 'Dying Curse',
      description: 'On death, curse killer (-25% all stats, 3 turns)',
      cooldown: 0,
      isPassive: true,
      onDeath: {
        effects: [
          { type: EffectType.ATK_DOWN, target: 'killer', duration: 3, value: 25 },
          { type: EffectType.DEF_DOWN, target: 'killer', duration: 3, value: 25 },
          { type: EffectType.SPD_DOWN, target: 'killer', duration: 3, value: 25 }
        ]
      }
    }
  },
  king_meridius: {
    id: 'king_meridius',
    name: 'King Meridius the Hollow',
    stats: { hp: 2800, atk: 100, def: 55, spd: 15 },
    imageSize: 180,
    skills: [
      {
        name: "Crown's Burden",
        description: '150% ATK to all heroes. 10% max HP recoil.',
        cooldown: 3,
        damagePercent: 150,
        targetType: 'all_heroes',
        recoilPercentMaxHp: 10
      },
      {
        name: "Puppet's Fury",
        description: '250% ATK to one target.',
        cooldown: 4,
        damagePercent: 250
      }
    ]
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/throne.js`
Expected: No syntax errors

---

### Task 8: Create Scalding Traverse Enemies

**Files:**
- Create: `src/data/enemies/scalding.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  vent_crawler: {
    id: 'vent_crawler',
    name: 'Vent Crawler',
    stats: { hp: 380, atk: 92, def: 55, spd: 10 },
    skill: {
      name: 'Superheated Claws',
      description: '150% ATK. Burn 2 turns (4% max HP/turn).',
      cooldown: 3,
      damagePercent: 150,
      effects: [
        { type: EffectType.BURN, target: 'hero', duration: 2, value: 4 }
      ]
    }
  },
  magma_eel: {
    id: 'magma_eel',
    name: 'Magma Eel',
    stats: { hp: 320, atk: 100, def: 35, spd: 20 },
    skill: {
      name: 'Searing Lunge',
      description: '170% ATK. Spreads Burn to adjacent if target Burning.',
      cooldown: 3,
      damagePercent: 170,
      spreadDebuff: { type: 'burn', toAdjacent: true, ifTargetHas: true }
    }
  },
  volcanic_polyp: {
    id: 'volcanic_polyp',
    name: 'Volcanic Polyp',
    stats: { hp: 280, atk: 80, def: 45, spd: 4 },
    skill: {
      name: 'Eruption',
      description: 'All Burning heroes take 60% ATK damage',
      cooldown: 3,
      initialCooldown: 3,
      damagePercent: 60,
      targetType: 'all_heroes',
      onlyIfDebuffed: 'burn'
    }
  },
  thermal_elemental: {
    id: 'thermal_elemental',
    name: 'Thermal Elemental',
    stats: { hp: 400, atk: 95, def: 42, spd: 14 },
    skill: {
      name: 'Heat Absorption',
      description: 'Heal 10% max HP per Burning hero at turn start',
      cooldown: 0,
      isPassive: true,
      startOfTurn: { healPercentPerBurningHero: 10 }
    }
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/scalding.js`
Expected: No syntax errors

---

### Task 9: Create Abyssal Maw Enemies

**Files:**
- Create: `src/data/enemies/abyss.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  abyssal_lurker_deep: {
    id: 'abyssal_lurker_deep',
    name: 'Abyssal Lurker',
    stats: { hp: 420, atk: 110, def: 50, spd: 22 },
    skill: {
      name: 'Pressure Crush',
      description: '150% ATK. Instant kill below 15% HP.',
      cooldown: 3,
      damagePercent: 150,
      executeThreshold: 15
    }
  },
  mind_leech: {
    id: 'mind_leech',
    name: 'Mind Leech',
    stats: { hp: 300, atk: 95, def: 38, spd: 16 },
    skill: {
      name: 'Psychic Siphon',
      description: 'Drain 10% current HP, heal self, -20% ATK 2 turns',
      cooldown: 3,
      drainPercent: 10,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 20 }
      ]
    }
  },
  void_angler: {
    id: 'void_angler',
    name: 'Void Angler',
    stats: { hp: 500, atk: 105, def: 55, spd: 6 },
    skill: {
      name: 'Abyssal Lure',
      description: 'Pull all heroes, then 130% ATK to all',
      cooldown: 4,
      initialCooldown: 4,
      damagePercent: 130,
      targetType: 'all_heroes',
      pullsTargets: true
    }
  },
  spawn_of_the_maw: {
    id: 'spawn_of_the_maw',
    name: 'Spawn of the Maw',
    stats: { hp: 250, atk: 100, def: 30, spd: 18 },
    skill: {
      name: 'Endless Hunger',
      description: '140% ATK. If kills, summon another Spawn.',
      cooldown: 3,
      damagePercent: 140,
      onKill: { summon: 'spawn_of_the_maw' }
    }
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/abyss.js`
Expected: No syntax errors

---

### Task 10: Create Drowned Prison Enemies (Branch 1)

**Files:**
- Create: `src/data/enemies/prison.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  prison_warden: {
    id: 'prison_warden',
    name: 'Prison Warden',
    stats: { hp: 260, atk: 48, def: 40, spd: 10 },
    skill: {
      name: 'Lockdown',
      description: 'Stun 1 turn. +1 turn if target debuffed.',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1, bonusIfDebuffed: 1 }
      ]
    }
  },
  chain_golem: {
    id: 'chain_golem',
    name: 'Chain Golem',
    stats: { hp: 320, atk: 44, def: 52, spd: 4 },
    skill: {
      name: 'Binding Chains',
      description: 'Taunt and -50% SPD for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.TAUNT, target: 'self', duration: 2 },
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 50 }
      ]
    }
  },
  drowner: {
    id: 'drowner',
    name: 'Drowner',
    stats: { hp: 180, atk: 52, def: 25, spd: 14 },
    skill: {
      name: 'Held Under',
      description: '160% to stunned, 100% otherwise',
      cooldown: 3,
      damagePercent: 100,
      bonusToDebuffed: { type: 'stun', bonus: 60 }
    }
  },
  taskmaster: {
    id: 'taskmaster',
    name: 'Taskmaster',
    stats: { hp: 200, atk: 50, def: 30, spd: 12 },
    skill: {
      name: 'Break Spirit',
      description: 'Target ATK/DEF -20% for 3 turns',
      cooldown: 3,
      noDamage: true,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 3, value: 20 },
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 3, value: 20 }
      ]
    }
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/prison.js`
Expected: No syntax errors

---

### Task 11: Create Sunken Shipyard Enemies (Branch 2)

**Files:**
- Create: `src/data/enemies/shipyard.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  wreck_scavenger: {
    id: 'wreck_scavenger',
    name: 'Wreck Scavenger',
    stats: { hp: 220, atk: 62, def: 28, spd: 18 },
    skill: {
      name: 'Plunder',
      description: '130% ATK and steal target buffs',
      cooldown: 3,
      damagePercent: 130,
      stealBuffs: true
    }
  },
  drowned_sailor: {
    id: 'drowned_sailor',
    name: 'Drowned Sailor',
    stats: { hp: 280, atk: 58, def: 35, spd: 10 },
    skill: {
      name: 'Ghostly Grasp',
      description: "120% ATK. Target can't heal for 2 turns.",
      cooldown: 3,
      damagePercent: 120,
      effects: [
        { type: EffectType.DEBUFF_IMMUNE, target: 'hero', duration: 2, blockHealing: true }
      ]
    }
  },
  barnacle_titan: {
    id: 'barnacle_titan',
    name: 'Barnacle Titan',
    stats: { hp: 380, atk: 55, def: 55, spd: 5 },
    skill: {
      name: 'Encrusted Shell',
      description: '30% DR for 2 turns. Reflect 20% damage.',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.DAMAGE_REDUCTION, target: 'self', duration: 2, value: 30 },
        { type: EffectType.REFLECT, target: 'self', duration: 2, value: 20 }
      ]
    }
  },
  shipwreck_siren: {
    id: 'shipwreck_siren',
    name: 'Shipwreck Siren',
    stats: { hp: 200, atk: 68, def: 22, spd: 16 },
    skill: {
      name: 'Luring Song',
      description: 'Force target to attack ally next turn',
      cooldown: 4,
      noDamage: true,
      charm: true
    }
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/shipyard.js`
Expected: No syntax errors

---

### Task 12: Create Blackfin Den Enemies (Branch 3)

**Files:**
- Create: `src/data/enemies/blackfin.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  blackfin_cutthroat: {
    id: 'blackfin_cutthroat',
    name: 'Blackfin Cutthroat',
    stats: { hp: 260, atk: 75, def: 30, spd: 20 },
    startsStealthed: true,
    skill: {
      name: 'Backstab',
      description: '200% from stealth (120% otherwise)',
      cooldown: 3,
      damagePercent: 120,
      stealthBonus: 80
    }
  },
  pit_fighter: {
    id: 'pit_fighter',
    name: 'Pit Fighter',
    stats: { hp: 340, atk: 70, def: 38, spd: 14 },
    skill: {
      name: 'Crowd Pleaser',
      description: '150% ATK. +15% ATK permanently on kill.',
      cooldown: 3,
      damagePercent: 150,
      onKill: { permanentAtkBonus: 15 }
    }
  },
  guild_poisoner: {
    id: 'guild_poisoner',
    name: 'Guild Poisoner',
    stats: { hp: 220, atk: 65, def: 28, spd: 16 },
    skill: {
      name: 'Coated Blade',
      description: '110% ATK. Stacking poison (3%/turn, 5x max).',
      cooldown: 3,
      damagePercent: 110,
      effects: [
        { type: EffectType.POISON, target: 'hero', duration: 99, value: 3, stacking: true, maxStacks: 5 }
      ]
    }
  },
  blackfin_fence: {
    id: 'blackfin_fence',
    name: 'Blackfin Fence',
    stats: { hp: 280, atk: 60, def: 35, spd: 12 },
    skill: {
      name: 'Dirty Deal',
      description: 'Heal all allies 15%. Random ally gains stealth 1 turn.',
      cooldown: 4,
      noDamage: true,
      healAllAllies: 15,
      grantRandomStealth: true
    }
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/blackfin.js`
Expected: No syntax errors

---

### Task 13: Create Forbidden Archives Enemies (Branch 4)

**Files:**
- Create: `src/data/enemies/archives.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  archive_construct: {
    id: 'archive_construct',
    name: 'Archive Construct',
    stats: { hp: 380, atk: 75, def: 55, spd: 8 },
    skill: {
      name: 'Restricted Access',
      description: '140% ATK. Silence 2 turns.',
      cooldown: 4,
      damagePercent: 140,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 2, isSilence: true }
      ]
    }
  },
  ink_specter: {
    id: 'ink_specter',
    name: 'Ink Specter',
    stats: { hp: 280, atk: 85, def: 30, spd: 18 },
    skill: {
      name: 'Redacted',
      description: '160% ATK. If Silenced, also Blind 1 turn.',
      cooldown: 3,
      damagePercent: 160,
      bonusEffectIfDebuffed: {
        type: 'silence',
        apply: { type: EffectType.EVASION, duration: 1, value: -50, isBlind: true }
      }
    }
  },
  tome_mimic: {
    id: 'tome_mimic',
    name: 'Tome Mimic',
    stats: { hp: 300, atk: 80, def: 40, spd: 14 },
    skill: {
      name: 'Forbidden Page',
      description: 'Copy last hero skill. Use against them.',
      cooldown: 4,
      copyLastHeroSkill: true
    }
  },
  knowledge_warden: {
    id: 'knowledge_warden',
    name: 'Knowledge Warden',
    stats: { hp: 350, atk: 78, def: 48, spd: 12 },
    skill: {
      name: 'Mind Seal',
      description: 'All heroes lose 20% current MP. +10% ATK per MP drained.',
      cooldown: 4,
      drainMpPercent: 20,
      targetType: 'all_heroes',
      bonusAtkPerMpDrained: 10
    }
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/archives.js`
Expected: No syntax errors

---

### Task 14: Create Primordial Nursery Enemies (Branch 5)

**Files:**
- Create: `src/data/enemies/nursery.js`

**Step 1: Create the enemy file**

```js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  juvenile_horror: {
    id: 'juvenile_horror',
    name: 'Juvenile Horror',
    stats: { hp: 200, atk: 88, def: 28, spd: 22 },
    skill: {
      name: 'Feeding Frenzy',
      description: '130% ATK. Attack twice if another Juvenile died this turn.',
      cooldown: 3,
      damagePercent: 130,
      doubleIfAllyDiedThisTurn: 'juvenile_horror'
    }
  },
  brood_tender: {
    id: 'brood_tender',
    name: 'Brood Tender',
    stats: { hp: 340, atk: 82, def: 45, spd: 10 },
    skill: {
      name: 'Nurture',
      description: 'Summon 2 Juveniles. If present, heal them 30% instead.',
      cooldown: 4,
      summon: { enemyId: 'juvenile_horror', count: 2 },
      altIfSummonsPresent: { healAllSummons: 30 }
    }
  },
  egg_cluster: {
    id: 'egg_cluster',
    name: 'Egg Cluster',
    stats: { hp: 450, atk: 0, def: 60, spd: 0 },
    cannotAttack: true,
    skill: {
      name: 'Hatching',
      description: "Can't attack. Spawns 1 Juvenile/turn. If killed, all allies +30% ATK 2 turns.",
      cooldown: 0,
      isPassive: true,
      startOfTurn: { summon: 'juvenile_horror' },
      onDeath: {
        effects: [
          { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 30 }
        ]
      }
    }
  },
  the_matriarch: {
    id: 'the_matriarch',
    name: 'The Matriarch',
    stats: { hp: 480, atk: 98, def: 50, spd: 12 },
    imageSize: 140,
    skill: {
      name: "Mother's Wrath",
      description: '180% ATK to all. +50% if any Juvenile/Egg died this battle.',
      cooldown: 4,
      damagePercent: 180,
      targetType: 'all_heroes',
      bonusIfSpecificAllyDied: { enemyIds: ['juvenile_horror', 'egg_cluster'], bonus: 50 }
    }
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/enemies/nursery.js`
Expected: No syntax errors

---

## Phase 2: Quest Region Files (Parallelizable with coordination)

Each region file can be created independently. Connections between regions should use placeholder node IDs that will exist when all regions are created.

### Task 15: Create Tidewall Ruins Region

**Files:**
- Create: `src/data/quests/tidewall_ruins.js`

**Step 1: Create the region file**

```js
export const regionMeta = {
  id: 'tidewall_ruins',
  name: 'Tidewall Ruins',
  superRegion: 'aquarias',
  startNode: 'tidewall_01',
  width: 800,
  height: 500,
  backgroundColor: '#0d2a35'
}

export const nodes = {
  tidewall_01: {
    id: 'tidewall_01',
    name: 'The Breach',
    region: 'Tidewall Ruins',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['ruin_scavenger', 'decay_jelly'] },
      { enemies: ['corroded_sentinel', 'tide_lurker'] },
      { enemies: ['ruin_scavenger', 'ruin_scavenger', 'decay_jelly'] }
    ],
    connections: ['tidewall_02'],
    rewards: { gems: 100, gold: 1950, exp: 1950 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
  },
  tidewall_02: {
    id: 'tidewall_02',
    name: 'Abandoned Watchtower',
    region: 'Tidewall Ruins',
    x: 250,
    y: 180,
    battles: [
      { enemies: ['corroded_sentinel', 'decay_jelly', 'decay_jelly'] },
      { enemies: ['tide_lurker', 'tide_lurker', 'ruin_scavenger'] },
      { enemies: ['corroded_sentinel', 'ruin_scavenger', 'decay_jelly'] },
      { enemies: ['tide_lurker', 'corroded_sentinel', 'decay_jelly', 'decay_jelly'] }
    ],
    connections: ['tidewall_03'],
    rewards: { gems: 100, gold: 2000, exp: 2000 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
  },
  tidewall_03: {
    id: 'tidewall_03',
    name: 'Algae-Choked Avenue',
    region: 'Tidewall Ruins',
    x: 400,
    y: 300,
    battles: [
      { enemies: ['ruin_scavenger', 'ruin_scavenger', 'tide_lurker'] },
      { enemies: ['decay_jelly', 'decay_jelly', 'corroded_sentinel'] },
      { enemies: ['tide_lurker', 'ruin_scavenger', 'decay_jelly', 'decay_jelly'] },
      { enemies: ['corroded_sentinel', 'corroded_sentinel', 'ruin_scavenger'] }
    ],
    connections: ['tidewall_04'],
    rewards: { gems: 100, gold: 2050, exp: 2050 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
  },
  tidewall_04: {
    id: 'tidewall_04',
    name: 'Silent Marketplace',
    region: 'Tidewall Ruins',
    x: 550,
    y: 200,
    battles: [
      { enemies: ['tide_lurker', 'tide_lurker', 'tide_lurker'] },
      { enemies: ['corroded_sentinel', 'decay_jelly', 'ruin_scavenger', 'ruin_scavenger'] },
      { enemies: ['ruin_scavenger', 'ruin_scavenger', 'corroded_sentinel', 'decay_jelly'] },
      { enemies: ['tide_lurker', 'tide_lurker', 'corroded_sentinel', 'decay_jelly'] },
      { enemies: ['corroded_sentinel', 'corroded_sentinel', 'ruin_scavenger', 'ruin_scavenger'] }
    ],
    connections: ['tidewall_05'],
    rewards: { gems: 100, gold: 2100, exp: 2100 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
  },
  tidewall_05: {
    id: 'tidewall_05',
    name: 'The Sealed Gate',
    region: 'Tidewall Ruins',
    x: 700,
    y: 280,
    battles: [
      { enemies: ['corroded_sentinel', 'corroded_sentinel', 'decay_jelly', 'decay_jelly'] },
      { enemies: ['tide_lurker', 'tide_lurker', 'ruin_scavenger', 'ruin_scavenger'] },
      { enemies: ['corroded_sentinel', 'tide_lurker', 'decay_jelly', 'ruin_scavenger'] },
      { enemies: ['ruin_scavenger', 'ruin_scavenger', 'ruin_scavenger', 'corroded_sentinel'] },
      { enemies: ['corroded_sentinel', 'corroded_sentinel', 'tide_lurker', 'tide_lurker', 'decay_jelly'] }
    ],
    connections: ['currents_01'],
    rewards: { gems: 100, gold: 2150, exp: 2150 },
    firstClearBonus: { gems: 100 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/quests/tidewall_ruins.js`
Expected: No syntax errors

---

### Task 16: Create Outer Currents Region

**Files:**
- Create: `src/data/quests/outer_currents.js`

**Step 1: Create the region file**

```js
export const regionMeta = {
  id: 'outer_currents',
  name: 'Outer Currents',
  superRegion: 'aquarias',
  startNode: 'currents_01',
  width: 800,
  height: 500,
  backgroundColor: '#0a2540'
}

export const nodes = {
  currents_01: {
    id: 'currents_01',
    name: 'Patrol Crossing',
    region: 'Outer Currents',
    x: 80,
    y: 250,
    battles: [
      { enemies: ['aquarian_enforcer', 'current_mage'] },
      { enemies: ['patrol_shark', 'aquarian_enforcer'] },
      { enemies: ['checkpoint_warden', 'aquarian_enforcer', 'current_mage'] }
    ],
    connections: ['currents_02'],
    rewards: { gems: 100, gold: 2200, exp: 2200 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
  },
  currents_02: {
    id: 'currents_02',
    name: 'Propaganda Plaza',
    region: 'Outer Currents',
    x: 200,
    y: 150,
    battles: [
      { enemies: ['current_mage', 'current_mage', 'aquarian_enforcer'] },
      { enemies: ['checkpoint_warden', 'patrol_shark'] },
      { enemies: ['aquarian_enforcer', 'aquarian_enforcer', 'current_mage'] },
      { enemies: ['patrol_shark', 'current_mage', 'checkpoint_warden'] }
    ],
    connections: ['currents_03'],
    rewards: { gems: 100, gold: 2250, exp: 2250 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
  },
  currents_03: {
    id: 'currents_03',
    name: 'Checkpoint Wreckage',
    region: 'Outer Currents',
    x: 350,
    y: 280,
    battles: [
      { enemies: ['patrol_shark', 'patrol_shark'] },
      { enemies: ['aquarian_enforcer', 'aquarian_enforcer', 'checkpoint_warden'] },
      { enemies: ['current_mage', 'current_mage', 'patrol_shark'] },
      { enemies: ['checkpoint_warden', 'aquarian_enforcer', 'current_mage', 'patrol_shark'] }
    ],
    connections: ['currents_04'],
    rewards: { gems: 100, gold: 2300, exp: 2300 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
  },
  currents_04: {
    id: 'currents_04',
    name: 'The Whisper Tunnels',
    region: 'Outer Currents',
    x: 480,
    y: 180,
    battles: [
      { enemies: ['aquarian_enforcer', 'aquarian_enforcer', 'aquarian_enforcer'] },
      { enemies: ['patrol_shark', 'patrol_shark', 'current_mage'] },
      { enemies: ['checkpoint_warden', 'checkpoint_warden', 'aquarian_enforcer'] },
      { enemies: ['current_mage', 'patrol_shark', 'aquarian_enforcer', 'aquarian_enforcer'] },
      { enemies: ['patrol_shark', 'patrol_shark', 'checkpoint_warden', 'current_mage'] }
    ],
    connections: ['currents_05'],
    rewards: { gems: 100, gold: 2350, exp: 2350 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
  },
  currents_05: {
    id: 'currents_05',
    name: 'Barracks Perimeter',
    region: 'Outer Currents',
    x: 600,
    y: 300,
    battles: [
      { enemies: ['checkpoint_warden', 'aquarian_enforcer', 'aquarian_enforcer'] },
      { enemies: ['patrol_shark', 'patrol_shark', 'patrol_shark'] },
      { enemies: ['current_mage', 'current_mage', 'checkpoint_warden', 'aquarian_enforcer'] },
      { enemies: ['aquarian_enforcer', 'aquarian_enforcer', 'patrol_shark', 'current_mage'] },
      { enemies: ['checkpoint_warden', 'checkpoint_warden', 'patrol_shark', 'current_mage'] }
    ],
    connections: ['currents_06'],
    rewards: { gems: 100, gold: 2400, exp: 2400 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
  },
  currents_06: {
    id: 'currents_06',
    name: 'Shipyard Junction',
    region: 'Outer Currents',
    x: 720,
    y: 220,
    battles: [
      { enemies: ['patrol_shark', 'patrol_shark', 'checkpoint_warden', 'current_mage'] },
      { enemies: ['aquarian_enforcer', 'aquarian_enforcer', 'aquarian_enforcer', 'patrol_shark'] },
      { enemies: ['checkpoint_warden', 'checkpoint_warden', 'current_mage', 'current_mage'] },
      { enemies: ['patrol_shark', 'patrol_shark', 'aquarian_enforcer', 'aquarian_enforcer', 'current_mage'] },
      { enemies: ['commander_tideclaw'] }
    ],
    connections: ['murk_01', 'shipyard_01'],
    rewards: { gems: 100, gold: 2500, exp: 2500 },
    firstClearBonus: { gems: 100 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 3, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
  }
}
```

**Step 2: Verify file syntax**

Run: `node -c src/data/quests/outer_currents.js`
Expected: No syntax errors

---

### Task 17-28: Create Remaining Region Files

Due to document length constraints, I'm providing a condensed format. Each region follows the same pattern. Create these files:

**Task 17:** `src/data/quests/the_murk.js` - 5 nodes (murk_01 to murk_05), ends connecting to beggar_01
**Task 18:** `src/data/quests/beggars_reef.js` - 6 nodes (beggar_01 to beggar_06), boss The Blightmother at beggar_06, connects to pearlgate_01 and blackfin_01
**Task 19:** `src/data/quests/pearlgate_plaza.js` - 5 nodes (pearlgate_01 to pearlgate_05), ends connecting to castle_01
**Task 20:** `src/data/quests/coral_castle_halls.js` - 6 nodes (castle_01 to castle_06), boss Lord Coralhart at castle_06, connects to throne_01 and archives_01
**Task 21:** `src/data/quests/throne_approach.js` - 6 nodes (throne_01 to throne_06), boss King Meridius at throne_06, connects to scalding_01
**Task 22:** `src/data/quests/scalding_traverse.js` - 5 nodes (scalding_01 to scalding_05), connects to abyss_01 and nursery_01
**Task 23:** `src/data/quests/the_abyssal_maw.js` - 6 nodes (abyss_01 to abyss_06), Genus Loci Thalassion at abyss_05
**Task 24:** `src/data/quests/drowned_prison.js` - 5 nodes (prison_01 to prison_05), dead end branch
**Task 25:** `src/data/quests/sunken_shipyard.js` - 5 nodes (shipyard_01 to shipyard_05), dead end branch
**Task 26:** `src/data/quests/blackfin_den.js` - 5 nodes (blackfin_01 to blackfin_05), dead end branch
**Task 27:** `src/data/quests/forbidden_archives.js` - 5 nodes (archives_01 to archives_05), dead end branch
**Task 28:** `src/data/quests/primordial_nursery.js` - 5 nodes (nursery_01 to nursery_05), dead end branch

For each region, follow the battle composition from the design document, using enemies from the corresponding enemy file.

---

## Phase 3: Integration (Sequential)

### Task 29: Add Thalassion Genus Loci

**Files:**
- Modify: `src/data/genusLoci.js`
- Modify: `src/data/genusLociAbilities.js`

**Step 1: Add Thalassion abilities to genusLociAbilities.js**

Add at the end before the export map:

```js
// Thalassion's abilities
export const thalassionAbilities = {
  psychic_crush: {
    id: 'psychic_crush',
    name: 'Psychic Crush',
    description: 'Deal 150% ATK damage and reduce target ATK by 15% for 2 turns',
    cooldown: 2,
    damagePercent: 150,
    effects: [
      { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 15 }
    ]
  },
  mind_flay: {
    id: 'mind_flay',
    name: 'Mind Flay',
    description: 'Deal 120% ATK to all heroes. 30% chance to Confuse each.',
    cooldown: 3,
    damagePercent: 120,
    targetType: 'all_heroes',
    effects: [
      { type: EffectType.STUN, target: 'all_heroes', duration: 1, chance: 30, isConfuse: true }
    ]
  },
  dominate: {
    id: 'dominate',
    name: 'Dominate',
    description: 'Control one hero for 2 turns. Hero uses strongest skill against allies.',
    cooldown: 5,
    noDamage: true,
    charm: { duration: 2, useStrongestSkill: true }
  },
  call_of_the_deep: {
    id: 'call_of_the_deep',
    name: 'Call of the Deep',
    description: 'Summon 2 Spawn of the Maw. If 3+ Spawns exist, all attack instead.',
    cooldown: 4,
    summon: { enemyId: 'spawn_of_the_maw', count: 2 },
    altIfSummonsOver: { count: 3, allSummonsAttack: true }
  },
  abyssal_reckoning: {
    id: 'abyssal_reckoning',
    name: 'Abyssal Reckoning',
    description: 'Deal 200% ATK to all. Heroes below 50% HP are Terrified 2 turns.',
    cooldown: 6,
    useCondition: 'hp_below_30',
    damagePercent: 200,
    targetType: 'all_heroes',
    effects: [
      { type: EffectType.ATK_DOWN, target: 'heroes_below_50', duration: 2, value: 40 },
      { type: EffectType.DEF_DOWN, target: 'heroes_below_50', duration: 2, value: 40 }
    ]
  },
  psychic_aura: {
    id: 'psychic_aura',
    name: 'Psychic Aura',
    description: 'All heroes have -10% ATK/SPD while Thalassion lives.',
    isPassive: true,
    aura: {
      effects: [
        { type: EffectType.ATK_DOWN, target: 'all_heroes', value: 10 },
        { type: EffectType.SPD_DOWN, target: 'all_heroes', value: 10 }
      ]
    }
  },
  endless_dreaming: {
    id: 'endless_dreaming',
    name: 'Endless Dreaming',
    description: 'Heal 5% max HP each round. 10% if any hero Dominated or Confused.',
    isPassive: true,
    startOfTurn: { healPercent: 5, bonusIfCharm: 5 }
  },
  the_mind_unshackled: {
    id: 'the_mind_unshackled',
    name: 'The Mind Unshackled',
    description: 'Below 30% HP: +30% ATK, +20% SPD, unlocks Abyssal Reckoning.',
    isPassive: true,
    triggerCondition: 'hp_below_30',
    enrage: { atkBonus: 30, spdBonus: 20 }
  }
}
```

**Step 2: Update genusLociAbilities export**

```js
export const genusLociAbilities = {
  valinar: valinarAbilities,
  great_troll: greatTrollAbilities,
  pyroclast: pyroclastAbilities,
  thalassion: thalassionAbilities
}
```

**Step 3: Add Thalassion to genusLoci.js**

```js
thalassion: {
  id: 'thalassion',
  name: 'Thalassion, the Deep Mind',
  description: 'An ancient horror lurking in the abyss. It has controlled Aquarian kings for centuries, feeding on the city\'s despair.',
  region: 'the_abyssal_maw',
  imageSize: 200,
  nodeId: 'abyss_05',
  keyItemId: 'abyss_key',
  maxPowerLevel: 20,
  baseStats: { hp: 4500, atk: 120, def: 70, spd: 18 },
  statScaling: { hp: 1.18, atk: 1.12, def: 1.08 },
  abilities: [
    { id: 'psychic_crush', unlocksAt: 1 },
    { id: 'mind_flay', unlocksAt: 1 },
    { id: 'psychic_aura', unlocksAt: 1 },
    { id: 'endless_dreaming', unlocksAt: 1 },
    { id: 'dominate', unlocksAt: 5 },
    { id: 'call_of_the_deep', unlocksAt: 10 },
    { id: 'the_mind_unshackled', unlocksAt: 15 },
    { id: 'abyssal_reckoning', unlocksAt: 20 }
  ],
  uniqueDrop: { itemId: 'thalassion_crest', guaranteed: true },
  firstClearBonus: { gems: 50 },
  currencyRewards: {
    base: { gold: 200 },
    perLevel: { gold: 50 }
  }
}
```

---

### Task 30: Update Index Files

**Files:**
- Modify: `src/data/quests/index.js`
- Modify: `src/data/quests/regions.js`
- Modify: `src/data/enemies/index.js`

**Step 1: Update regions.js**

Add imports for all new regions and add them to the regions array.

**Step 2: Update quests/index.js**

Add imports for all new node files and spread them into questNodes.

**Step 3: Update enemies/index.js**

Add imports for all new enemy files and spread them into enemyTemplates.

---

### Task 31: Update Coral Depths Connections

**Files:**
- Modify: `src/data/quests/coral_depths.js`

**Step 1: Add connection from coral_06 to tidewall_01**

Update coral_06 connections:
```js
connections: ['tidewall_01'],
```

**Step 2: Add connection from coral_03 to prison_01 (branch)**

Update coral_03 connections:
```js
connections: ['coral_04', 'prison_01'],
```

---

## Verification

After all tasks complete:

1. **Syntax check all files:**
   ```bash
   for f in src/data/enemies/*.js src/data/quests/*.js; do node -c "$f"; done
   ```

2. **Run dev server:**
   ```bash
   npm run dev
   ```

3. **Test navigation:**
   - Navigate to world map
   - Verify Aquarias super-region appears (after completing aqua_08)
   - Verify all 15 regions appear in tabs
   - Click through node connections

4. **Test battles:**
   - Start a battle in each new region
   - Verify enemies load without errors
   - Verify mini-boss multi-skill behavior

---

## Commit Strategy

Commit after each phase:

1. `feat(aquaria): add enemy files for all Aquaria regions`
2. `feat(aquaria): add quest region files for Aquaria`
3. `feat(aquaria): add Thalassion Genus Loci`
4. `feat(aquaria): integrate Aquaria into index files`
