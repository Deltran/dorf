# Hibernation Den Design

**Goal:** Add a new quest chain to Stormwind Peaks featuring the Great Troll genus loci boss with a unique hibernation/sleep mechanic.

---

## New Status Effect: SLEEP

- Like STUN - unit skips their turn while sleeping
- Removed immediately when the sleeping unit takes any damage (wakes up)
- No built-in healing (healing is Troll-specific via passive)
- Visual: icon `💤`, color `#6366f1` (indigo)

**Implementation:**
- `statusEffects.js`: Add `SLEEP: 'sleep'` to EffectType, add definition with `isSleep: true`, `isControl: true`
- `battle.js`: Check for SLEEP in `processStartOfTurnEffects`, remove SLEEP in `applyDamage` when target is hit

---

## New Items

**den_key:**
- Key item (like lake_tower_key)
- 25% drop chance from hibernation_02 boss fight
- Required to challenge Great Troll

**great_troll_crest:**
- Genus loci unique drop (guaranteed)
- Rarity 4

---

## Great Troll Genus Loci

**Stats:**
- `baseStats: { hp: 800, atk: 50, def: 35, spd: 5 }` (tanky, slow)
- `statScaling: { hp: 1.15, atk: 1.1, def: 1.08 }`
- `maxPowerLevel: 20`

**Abilities:**

| Level | Ability | Type | Description |
|-------|---------|------|-------------|
| 1 | Crushing Blow | Active | Deal 160% ATK damage to one hero |
| 1 | Hibernation | Active | Put self to sleep for 2 turns. Only usable below 50% HP. |
| 1 | Regenerative Sleep | Passive | While sleeping, heal 10% max HP at start of each turn |
| 5 | Boulder Toss | Active | Deal 120% ATK damage to all heroes |
| 10 | Thick Hide | Passive | Permanently reduce incoming damage by 15% |
| 15 | Rage Awakening | Passive | When woken by damage, immediately counterattack for 200% ATK |
| 20 | Unstoppable | Active | Deal 250% ATK damage and remove all buffs from target |

---

## Quest Nodes

**New Region:** Hibernation Den (separate from Stormwind Peaks)

**Layout:** mountain_05 (Stormwind Peaks) → hibernation_01 → hibernation_02 → hibernation_den

**hibernation_01** - "Troll Warren"
- Position: x: 550, y: 480
- Fights:
  1. `['mountain_giant', 'harpy']`
  2. `['frost_elemental', 'frost_elemental', 'harpy']`
  3. `['mountain_giant', 'mountain_giant']`
- Rewards: `{ gems: 95, gold: 420, exp: 360 }`

**hibernation_02** - "Troll Chieftain's Cave"
- Position: x: 650, y: 400
- Fights:
  1. `['mountain_giant', 'frost_elemental', 'harpy']`
  2. `['storm_elemental', 'storm_elemental', 'mountain_giant']`
  3. `['mountain_giant', 'mountain_giant', 'frost_elemental']`
- Rewards: `{ gems: 100, gold: 450, exp: 400 }`
- Item drops: `{ itemId: 'den_key', chance: 0.25 }`

**hibernation_den** - "Hibernation Den"
- Position: x: 720, y: 340
- Type: genusLoci
- genusLociId: great_troll

---

## Battle.js Implementation

1. **SLEEP in processStartOfTurnEffects:** Check for SLEEP, log "X is asleep and cannot act!", return false

2. **SLEEP removal in applyDamage:** After damage applied, if target has SLEEP, remove it and log "X wakes up!"

3. **Regenerative Sleep passive:** In processStartOfTurnEffects, if genus loci has this passive AND has SLEEP, heal 10% maxHP

4. **Thick Hide passive:** In damage calculation, apply 15% damage reduction

5. **Rage Awakening passive:** When SLEEP removed, queue counterattack for 200% ATK against attacker

6. **Hibernation skill condition:** Only usable when HP < 50%
