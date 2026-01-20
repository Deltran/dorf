# Region Expansion Design

Expand Echoing Caverns and Stormwind Peaks with additional mid-section nodes.

## Structure Changes

### Echoing Caverns (4 → 7 nodes)

```
Before: cave_01 → (cave_02 OR cave_03) → cave_04

After:  cave_01 → (cave_02 OR cave_03) → cave_05 → (cave_06 OR cave_07) → cave_04
```

### Stormwind Peaks (4 → 7 nodes)

```
Before: mountain_01 → (mountain_02 OR mountain_03) → mountain_04

After:  mountain_01 → (mountain_02 OR mountain_03) → mountain_05 → (mountain_06 OR mountain_07) → mountain_04
```

## New Enemies

### Echoing Caverns (Cultist Theme)

| Enemy | Role | Description |
|-------|------|-------------|
| `cultist_ritualist` | Healer/Buffer | Strengthens allies, heals cultist units |
| `corrupted_golem` | Tank | Rock golem twisted by dark magic, shadow damage |

### Stormwind Peaks (Elemental Chaos Theme)

| Enemy | Role | Description |
|-------|------|-------------|
| `storm_elemental` | DPS | Lightning-based, faster than frost, multi-target |
| `thunder_hawk` | DPS | Aerial elemental creature, charged-up harpy variant |

## New Quest Nodes

### Echoing Caverns

**cave_05 - Ritual Chamber**
- Convergence point after cave_02/cave_03
- Introduces cultist_ritualist and corrupted_golem
- Battles: cultist ritualists protecting dark casters, corrupted golems

**cave_06 - Blood Altar** (upper branch)
- Active sacrifice site, aggressive cultist magic
- Battles: heavy caster/ritualist combos
- Harder magical encounters

**cave_07 - Summoning Circle** (lower branch)
- Where cultists summon creatures from beyond
- Battles: corrupted golems and cave trolls with cultist support
- Harder physical encounters

### Stormwind Peaks

**mountain_05 - Storm Plateau**
- Convergence point after mountain_02/mountain_03
- Introduces storm_elemental and thunder_hawk
- Battles: mix of frost and storm elementals, thunder hawks

**mountain_06 - Lightning Spire** (upper branch)
- Towering peak constantly struck by lightning
- Battles: heavy storm elemental presence, thunder hawk swarms
- Pure elemental chaos, magical damage focus

**mountain_07 - Howling Cliffs** (lower branch)
- Windswept crags where giants and elementals clash
- Battles: mountain giants alongside elementals
- Mixed physical/magical, tankier encounters

## Rewards

### New Nodes

**Echoing Caverns:**

| Node | Gems | Gold | Exp | First Clear |
|------|------|------|-----|-------------|
| cave_05 (Ritual Chamber) | 95 | 270 | 220 | 75 |
| cave_06 (Blood Altar) | 100 | 285 | 235 | 75 |
| cave_07 (Summoning Circle) | 100 | 285 | 235 | 75 |

**Stormwind Peaks:**

| Node | Gems | Gold | Exp | First Clear |
|------|------|------|-----|-------------|
| mountain_05 (Storm Plateau) | 95 | 420 | 350 | 105 |
| mountain_06 (Lightning Spire) | 100 | 450 | 400 | 115 |
| mountain_07 (Howling Cliffs) | 100 | 450 | 400 | 115 |

### Existing Nodes - Gem Cap Adjustment (100 max)

| Node | Current Gems | New Gems |
|------|--------------|----------|
| cave_04 (Deep Chasm) | 120 | 100 |
| mountain_01 (Mountain Pass) | 130 | 100 |
| mountain_02 (Frozen Lake) | 150 | 100 |
| mountain_03 (Giant's Path) | 150 | 100 |
| mountain_04 (Dragon's Lair) | 200 | 100 |

First clear bonuses remain unchanged.

## Files to Modify

- `src/data/questNodes.js` - Add 6 new nodes, update connections, adjust gem rewards
- `src/data/enemyTemplates.js` - Add 4 new enemy definitions

## Connection Updates

### Echoing Caverns
- `cave_02.connections`: `['cave_04']` → `['cave_05']`
- `cave_03.connections`: `['cave_04']` → `['cave_05']`
- `cave_05.connections`: `['cave_06', 'cave_07']` (new)
- `cave_06.connections`: `['cave_04']` (new)
- `cave_07.connections`: `['cave_04']` (new)

### Stormwind Peaks
- `mountain_02.connections`: `['mountain_04']` → `['mountain_05']`
- `mountain_03.connections`: `['mountain_04']` → `['mountain_05']`
- `mountain_05.connections`: `['mountain_06', 'mountain_07']` (new)
- `mountain_06.connections`: `['mountain_04']` (new)
- `mountain_07.connections`: `['mountain_04']` (new)
