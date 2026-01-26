# Coral Depths Region Design

## Overview

Coral Depths is the first region in the Aquarias super region. It's an underwater cavern filled with coral, serving as a roundabout back-door passage to Aquaria. Unlocked after completing Gate to Aquaria (defeating the Kraken at aqua_08).

## Region Definition

- **ID**: coral_depths
- **Super Region**: aquarias
- **Size**: 800x500
- **Nodes**: 6 (linear progression)
- **Theme**: Tight coral cave tunnels, natural underwater passage

## Node Layout

Linear path — no branching, fits the tunnel/passage feel:

```
coral_01 → coral_02 → coral_03 → coral_04 → coral_05 → coral_06
```

| Node | Name | Battles | Difficulty |
|------|------|---------|-----------|
| coral_01 | Coral Tunnels | 3 | Entry |
| coral_02 | Barnacle Narrows | 4 | Moderate |
| coral_03 | Eel Hollows | 4 | Moderate+ |
| coral_04 | Collapsed Grotto | 5 | Hard |
| coral_05 | Reef Labyrinth | 5 | Hard |
| coral_06 | The Back Gate | 6 | Very Hard |

## New Enemies

All new enemies for Coral Depths (no reuse from Gate to Aquaria):

### Cave Crab (cave_crab)
- **Role**: Tank
- **Stats**: 280 HP / 42 ATK / 45 DEF / 5 SPD
- **Skill**: Shell Slam — 140% ATK, 30% chance to stun
- Slow but extremely durable. Regional tank replacing coral_golem.

### Moray Eel (moray_eel)
- **Role**: Ambusher / Glass cannon
- **Stats**: 160 HP / 58 ATK / 16 DEF / 20 SPD
- **Skill**: Lunge — 170% ATK to one target
- Fastest enemy in the region, hits hard but fragile.

### Barnacle Cluster (barnacle_cluster)
- **Role**: Debuffer
- **Stats**: 140 HP / 40 ATK / 30 DEF / 8 SPD
- **Skill**: Encrust — DEF down 35% for 2 turns on all enemies
- AoE debuffer that makes other enemies more dangerous. Low individual threat.

### Reef Warden (reef_warden)
- **Role**: Support
- **Stats**: 200 HP / 44 ATK / 28 DEF / 12 SPD
- **Skill**: Coral Shield — Grants shield (80 HP) to one ally
- Shield-based support instead of direct heals, distinct from tide_priest.

## Battle Compositions

### coral_01 — Coral Tunnels (3 battles)
1. cave_crab, moray_eel, moray_eel
2. barnacle_cluster, cave_crab, reef_warden
3. moray_eel, moray_eel, barnacle_cluster, cave_crab

### coral_02 — Barnacle Narrows (4 battles)
1. barnacle_cluster, barnacle_cluster, cave_crab
2. moray_eel, moray_eel, reef_warden
3. cave_crab, cave_crab, barnacle_cluster
4. reef_warden, moray_eel, barnacle_cluster, cave_crab

### coral_03 — Eel Hollows (4 battles)
1. moray_eel, moray_eel, moray_eel
2. cave_crab, moray_eel, reef_warden
3. moray_eel, moray_eel, barnacle_cluster, barnacle_cluster
4. moray_eel, moray_eel, cave_crab, reef_warden

### coral_04 — Collapsed Grotto (5 battles)
1. cave_crab, cave_crab, reef_warden
2. barnacle_cluster, moray_eel, moray_eel, cave_crab
3. reef_warden, reef_warden, cave_crab
4. moray_eel, barnacle_cluster, cave_crab, cave_crab
5. cave_crab, cave_crab, reef_warden, moray_eel, moray_eel

### coral_05 — Reef Labyrinth (5 battles)
1. barnacle_cluster, barnacle_cluster, reef_warden, cave_crab
2. moray_eel, moray_eel, moray_eel, barnacle_cluster
3. reef_warden, cave_crab, cave_crab, moray_eel
4. barnacle_cluster, reef_warden, moray_eel, moray_eel
5. cave_crab, cave_crab, reef_warden, barnacle_cluster, moray_eel

### coral_06 — The Back Gate (6 battles)
1. cave_crab, cave_crab, barnacle_cluster, reef_warden
2. moray_eel, moray_eel, moray_eel, moray_eel
3. reef_warden, reef_warden, cave_crab, cave_crab
4. barnacle_cluster, barnacle_cluster, moray_eel, cave_crab, reef_warden
5. cave_crab, cave_crab, cave_crab, reef_warden, reef_warden
6. moray_eel, moray_eel, cave_crab, cave_crab, reef_warden, barnacle_cluster

## Rewards

| Node | Gems | Gold | Exp | First Clear |
|------|------|------|-----|-------------|
| coral_01 | 100 | 1600 | 1600 | 50 gems |
| coral_02 | 100 | 1650 | 1650 | 50 gems |
| coral_03 | 100 | 1700 | 1700 | 50 gems |
| coral_04 | 100 | 1750 | 1750 | 75 gems |
| coral_05 | 100 | 1800 | 1800 | 75 gems |
| coral_06 | 100 | 1900 | 1900 | 100 gems |

**Item drops** (all nodes):
- tome_large: 80% chance, 1-2
- shard_dragon_heart: 5% chance, 1

## Stat Scaling Context

Gate to Aquaria enemies for reference:
- merfolk_warrior: 140 HP / 48 ATK / 24 DEF / 14 SPD
- coral_golem: 260 HP / 45 ATK / 40 DEF / 6 SPD
- sea_serpent: 200 HP / 50 ATK / 26 DEF / 15 SPD

Coral Depths enemies are slightly above this, with cave_crab being the toughest tank (280 HP, 45 DEF) and moray_eel being the deadliest striker (58 ATK, 20 SPD).
