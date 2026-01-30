# Aquaria Super Region Design

Complete design for the Aquaria super region, including 10 main story regions, 5 branch regions, all enemies, mini-bosses, and the final Genus Loci.

## Overview

**Story Summary:** The party finds a back way to the underwater city of Aquaria through coral-lined caves. They infiltrate the city's outer district, make their way to the slums where they acquire a pass to the Coral Castle, fight through to the throne room, and defeat the king—only to discover he was being mind-controlled by an ancient horror in the abyss. After defeating the true enemy, they escape through a magical portal to the next land.

**Structure:**
- 10 main story regions (56 nodes)
- 5 branch regions for future mechanics (25 nodes)
- **Total: 81 quest nodes**

**Branches:** Dead-end regions that unlock future game mechanics (mechanics out of scope for this design).

---

## Main Regions Summary

| # | Region Name | Nodes | Story Beat | Branch |
|---|-------------|-------|------------|--------|
| 1 | Coral Depths (exists) | 6 | Back way in through coral caves | → Drowned Prison |
| 2 | Tidewall Ruins | 5 | First glimpse of the city's decay | |
| 3 | Outer Currents | 6 | Martial law discovered | → Sunken Shipyard |
| 4 | The Murk | 5 | Twilight zone, outcasts lurk | |
| 5 | Beggar's Reef | 6 | Slums, acquire castle pass | → Blackfin Den |
| 6 | Pearlgate Plaza | 5 | Grand castle entrance | |
| 7 | Coral Castle Halls | 6 | Royal stronghold | → Forbidden Archives |
| 8 | Throne Approach | 6 | King fight, mind-control revealed | |
| 9 | Scalding Traverse | 5 | Thermal vents to the abyss | → Primordial Nursery |
| 10 | The Abyssal Maw | 6 | Big bad fight, portal escape | |

---

## Main Region Details

### Region 1: Coral Depths (Exists)

Already implemented with 6 nodes. Needs connection from `coral_03` to the Drowned Prison branch.

**Existing nodes:** coral_01 through coral_06

**Required change:** Add `drowned_prison_01` to `coral_03` connections.

---

### Region 2: Tidewall Ruins (5 nodes)

*The crumbling outer walls where the party first enters Aquaria proper. Signs of decay and abandonment hint that something is deeply wrong.*

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
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| tidewall_01 | The Breach | Collapsed section of outer wall; entry point | tidewall_02 |
| tidewall_02 | Abandoned Watchtower | Guard post left to rot, old warnings etched in coral | tidewall_03 |
| tidewall_03 | Algae-Choked Avenue | Main street overtaken by growth, scavengers lurk | tidewall_04 |
| tidewall_04 | Silent Marketplace | Deserted bazaar, stalls overturned, hasty evacuation | tidewall_05 |
| tidewall_05 | The Sealed Gate | Massive gate to inner city, must find another route | currents_01 |

---

### Region 3: Outer Currents (6 nodes)

*Patrolled waterways reveal the city is under martial law. Guards are brutal, citizens terrified.*

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
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| currents_01 | Patrol Crossing | First encounter with Aquarian enforcers | currents_02 |
| currents_02 | Propaganda Plaza | Public square with ominous decrees from the king | currents_03 |
| currents_03 | Checkpoint Wreckage | Destroyed guard post—someone is fighting back | currents_04 |
| currents_04 | The Whisper Tunnels | Secret passages, meet resistance contacts | currents_05 |
| currents_05 | Barracks Perimeter | Skirting the military quarter | currents_06 |
| currents_06 | Shipyard Junction | Crossroads where smugglers operate; **BOSS: Commander Tideclaw** | murk_01, shipyard_01 |

**Branch connection:** `currents_06` → `shipyard_01` (Sunken Shipyard)

---

### Region 4: The Murk (5 nodes)

*The light fades here. This twilight zone between the outer city and slums is home to exiles, outcasts, and those who've given up.*

```js
export const regionMeta = {
  id: 'the_murk',
  name: 'The Murk',
  superRegion: 'aquarias',
  startNode: 'murk_01',
  width: 800,
  height: 500,
  backgroundColor: '#0a1a25'
}
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| murk_01 | Dimlight Passage | Bioluminescence fails, darkness creeps in | murk_02 |
| murk_02 | Outcast Hollow | Makeshift camp of exiles, wary but not hostile | murk_03 |
| murk_03 | The Silt Beds | Murky waters, ambush territory, poor visibility | murk_04 |
| murk_04 | Faded Lantern Row | Abandoned residential block, flickering lights | murk_05 |
| murk_05 | The Drop-Off | Literal cliff descent into the slums below | beggar_01 |

---

### Region 5: Beggar's Reef (6 nodes)

*The slums. Desperate, sick, forgotten by the crown. Here the party meets a contact who provides the item granting castle access.*

```js
export const regionMeta = {
  id: 'beggars_reef',
  name: "Beggar's Reef",
  superRegion: 'aquarias',
  startNode: 'beggar_01',
  width: 800,
  height: 500,
  backgroundColor: '#12202a'
}
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| beggar_01 | Shanty Sprawl | Ramshackle homes built from wreckage and coral | beggar_02 |
| beggar_02 | Beggar's Court | Central gathering place, hollow-eyed residents | beggar_03 |
| beggar_03 | The Sick Ward | Makeshift hospital, plague victims abandoned | beggar_04 |
| beggar_04 | Peddler's Maze | Tight alley market, stolen and forbidden goods | beggar_05 |
| beggar_05 | The Fence's Alcove | Contact provides castle pass; **STORY MILESTONE** | beggar_06 |
| beggar_06 | Drainage Tunnels | Exit toward castle district; **BOSS: The Blightmother** | pearlgate_01, blackfin_01 |

**Branch connection:** `beggar_06` → `blackfin_01` (Blackfin Den)

---

### Region 6: Pearlgate Plaza (5 nodes)

*The grand entrance to the castle district. Wealth and splendor in stark contrast to the slums. Heavy guard presence, but the pass gets you through—barely.*

```js
export const regionMeta = {
  id: 'pearlgate_plaza',
  name: 'Pearlgate Plaza',
  superRegion: 'aquarias',
  startNode: 'pearlgate_01',
  width: 800,
  height: 500,
  backgroundColor: '#1a3040'
}
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| pearlgate_01 | Pearlgate Approach | Ornate gates loom ahead, checkpoints everywhere | pearlgate_02 |
| pearlgate_02 | Credential Check | The pass is tested; tense passage through security | pearlgate_03 |
| pearlgate_03 | Noble's Promenade | Pristine streets, oblivious aristocrats, hidden rot | pearlgate_04 |
| pearlgate_04 | Servant's Corridor | Back passages used by castle staff | pearlgate_05 |
| pearlgate_05 | Castle Forecourt | Grand entrance to Coral Castle itself | castle_01 |

---

### Region 7: Coral Castle Halls (6 nodes)

*Inside the royal stronghold. Beautiful architecture twisted by paranoia—barricades, elite guards, whispers of the king's madness.*

```js
export const regionMeta = {
  id: 'coral_castle_halls',
  name: 'Coral Castle Halls',
  superRegion: 'aquarias',
  startNode: 'castle_01',
  width: 800,
  height: 500,
  backgroundColor: '#1a2a45'
}
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| castle_01 | Grand Foyer | Cavernous entry hall, coral pillars, heavy patrols | castle_02 |
| castle_02 | Gallery of Tides | Portraits of past rulers; current king's is defaced | castle_03 |
| castle_03 | Abandoned Banquet | Rotting feast left mid-meal, something drove them out | castle_04 |
| castle_04 | Elite Barracks | King's personal guard quarters, fierce resistance | castle_05 |
| castle_05 | Archive Wing | Sealed knowledge chambers | castle_06, archives_01 |
| castle_06 | Inner Sanctum Gate | Final checkpoint before the throne; **BOSS: Lord Coralhart** | throne_01 |

**Branch connection:** `castle_05` → `archives_01` (Forbidden Archives)

---

### Region 8: Throne Approach (6 nodes)

*The inner sanctum. The king's most loyal—or most controlled—defenders stand between you and the truth. The final node reveals the king was a puppet all along.*

```js
export const regionMeta = {
  id: 'throne_approach',
  name: 'Throne Approach',
  superRegion: 'aquarias',
  startNode: 'throne_01',
  width: 800,
  height: 500,
  backgroundColor: '#1a2550'
}
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| throne_01 | Royal Antechamber | Opulent waiting hall, tense silence | throne_02 |
| throne_02 | King's Guard Hall | The elite Coralsworn make their stand | throne_03 |
| throne_03 | Chapel of Tides | Desecrated shrine, dark prayers etched in walls | throne_04 |
| throne_04 | Privy Council Chamber | Advisors' corpses still seated; no one questioned the king | throne_05 |
| throne_05 | Throne Room Vestibule | Last line of defense, fanatical guards | throne_06 |
| throne_06 | The Coral Throne | **BOSS: King Meridius the Hollow**; mind-control revealed | scalding_01 |

---

### Region 9: Scalding Traverse (5 nodes)

*Beyond the castle, the ocean floor gives way to volcanic hellscape. Thermal vents, scalding water, and ancient things that thrive in the heat.*

```js
export const regionMeta = {
  id: 'scalding_traverse',
  name: 'Scalding Traverse',
  superRegion: 'aquarias',
  startNode: 'scalding_01',
  width: 800,
  height: 500,
  backgroundColor: '#2a1a15'
}
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| scalding_01 | Boiling Gates | Castle's hidden exit into the volcanic wastes | scalding_02 |
| scalding_02 | Vent Field Crossing | Dodging eruptions, fighting heat-adapted creatures | scalding_03 |
| scalding_03 | Obsidian Labyrinth | Cooled lava tubes, claustrophobic and winding | scalding_04 |
| scalding_04 | The Scorched Beds | Primordial spawning grounds | scalding_05, nursery_01 |
| scalding_05 | Abyssal Threshold | The water turns black and cold—you've reached the deep | abyss_01 |

**Branch connection:** `scalding_04` → `nursery_01` (Primordial Nursery)

---

### Region 10: The Abyssal Maw (6 nodes)

*The true darkness. Crushing pressure, no light, and an ancient intelligence that has been pulling strings for centuries. Here lies the puppet master—and its escape route.*

```js
export const regionMeta = {
  id: 'the_abyssal_maw',
  name: 'The Abyssal Maw',
  superRegion: 'aquarias',
  startNode: 'abyss_01',
  width: 800,
  height: 500,
  backgroundColor: '#0a0a15'
}
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| abyss_01 | The Sunless Depths | Light dies completely; bioluminescent horrors guide the way | abyss_02 |
| abyss_02 | Boneyard Trench | Graveyard of leviathans, picked clean over millennia | abyss_03 |
| abyss_03 | The Whispering Dark | Psychic pressure mounts; the creature knows you're coming | abyss_04 |
| abyss_04 | Idol of the Deep | Shrine where Aquarians once worshipped it—willingly | abyss_05 |
| abyss_05 | The Mind's Eye | **GENUS LOCI: Thalassion, the Deep Mind** | abyss_06 |
| abyss_06 | The Rift Beyond | Portal the creature created; heroes escape to the next land | (end) |

---

## Branch Regions

### Branch 1: Drowned Prison (5 nodes)

*Branches from Coral Depths (coral_03). Where Aquaria keeps surface-dwellers and political dissidents. Brutal conditions, forced labor.*

```js
export const regionMeta = {
  id: 'drowned_prison',
  name: 'Drowned Prison',
  superRegion: 'aquarias',
  startNode: 'prison_01',
  width: 800,
  height: 500,
  backgroundColor: '#151a20'
}
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| prison_01 | Prisoner Intake | Processing area, chains and despair | prison_02 |
| prison_02 | Chain Gang Tunnels | Forced labor excavating coral | prison_03 |
| prison_03 | The Flooded Cells | Cramped cages, water up to the neck | prison_04 |
| prison_04 | The Oubliette | Deep isolation pit for the "forgotten" | prison_05 |
| prison_05 | Warden's Sanctum | Cruel overseer's quarters | (dead end) |

---

### Branch 2: Sunken Shipyard (5 nodes)

*Branches from Outer Currents (currents_06). Graveyard of vessels from ages past. Scavengers pick the bones; treasures remain.*

```js
export const regionMeta = {
  id: 'sunken_shipyard',
  name: 'Sunken Shipyard',
  superRegion: 'aquarias',
  startNode: 'shipyard_01',
  width: 800,
  height: 500,
  backgroundColor: '#1a2530'
}
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| shipyard_01 | Hull Graveyard | Rotting ship carcasses, barnacle-crusted | shipyard_02 |
| shipyard_02 | Scavenger's Claim | Territorial gangs fighting over salvage | shipyard_03 |
| shipyard_03 | The Dry Dock | Ancient construction bay, massive chains | shipyard_04 |
| shipyard_04 | Cargo Hold Maze | Sunken holds full of forgotten goods | shipyard_05 |
| shipyard_05 | The Flagship Wreck | Colossal warship from a forgotten war | (dead end) |

---

### Branch 3: Blackfin Den (5 nodes)

*Branches from Beggar's Reef (beggar_06). The thieves' guild headquarters. What happens here, stays here—or you stay here forever.*

```js
export const regionMeta = {
  id: 'blackfin_den',
  name: 'Blackfin Den',
  superRegion: 'aquarias',
  startNode: 'blackfin_01',
  width: 800,
  height: 500,
  backgroundColor: '#15151f'
}
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| blackfin_01 | The Blind Eye | Entry checkpoint; see nothing, say nothing | blackfin_02 |
| blackfin_02 | Contraband Corridor | Stolen goods from across the ocean | blackfin_03 |
| blackfin_03 | The Betting Pits | Blood sport and high-stakes gambling | blackfin_04 |
| blackfin_04 | Fence's Vault | Where treasures are appraised and sold | blackfin_05 |
| blackfin_05 | Guildmaster's Throne | The Blackfin herself holds court | (dead end) |

---

### Branch 4: Forbidden Archives (5 nodes)

*Branches from Coral Castle Halls (castle_05). Sealed chambers holding knowledge too dangerous for the public. Guarded by constructs and oaths.*

```js
export const regionMeta = {
  id: 'forbidden_archives',
  name: 'Forbidden Archives',
  superRegion: 'aquarias',
  startNode: 'archives_01',
  width: 800,
  height: 500,
  backgroundColor: '#1a1a2a'
}
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| archives_01 | The Sealed Stacks | Entrance ward, magical barriers | archives_02 |
| archives_02 | Hall of Heresy | Banned philosophies, forbidden histories | archives_03 |
| archives_03 | Drowned Scriptorium | Flooded writing chambers, ink clouds the water | archives_04 |
| archives_04 | Vault of Minds | Memory containers—thoughts too dangerous to remember | archives_05 |
| archives_05 | The Index | Central catalog; the archivists guard it with their lives | (dead end) |

---

### Branch 5: Primordial Nursery (5 nodes)

*Branches from Scalding Traverse (scalding_04). Where ancient deep-sea creatures spawn. Life at its most raw and violent.*

```js
export const regionMeta = {
  id: 'primordial_nursery',
  name: 'Primordial Nursery',
  superRegion: 'aquarias',
  startNode: 'nursery_01',
  width: 800,
  height: 500,
  backgroundColor: '#2a1510'
}
```

| Node ID | Name | Story/Location | Connections |
|---------|------|----------------|-------------|
| nursery_01 | The Spawn Pools | Bubbling pits of eggs and larvae | nursery_02 |
| nursery_02 | Incubation Vents | Thermal jets warming massive egg sacs | nursery_03 |
| nursery_03 | Juvenile Feeding Grounds | Young predators learning to kill | nursery_04 |
| nursery_04 | The Matriarch's Hollow | Ancient mother-beast, fiercely protective | nursery_05 |
| nursery_05 | Genesis Core | The volcanic heart where life ignites | (dead end) |

---

## Enemies

### Existing Enemies (Coral Depths - Region 1)

| Enemy | HP | ATK | DEF | SPD | Ability |
|-------|-----|-----|-----|-----|---------|
| Cave Crab | 280 | 42 | 45 | 5 | Shell Slam — 140% ATK, stun 1 turn |
| Moray Eel | 160 | 58 | 16 | 20 | Lunge — 170% ATK |
| Barnacle Cluster | 140 | 40 | 30 | 8 | Encrust — All heroes DEF −35% for 2 turns |
| Reef Warden | 200 | 44 | 28 | 12 | Coral Armor — Ally DEF +40% for 2 turns |

---

### Region 2: Tidewall Ruins

*Synergy: Corrosion debuffs → exploiting weakened targets*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Ruin Scavenger | 180 | 52 | 20 | 22 | Striker | Opportunist — +50% damage to DEF down targets |
| Decay Jelly | 150 | 45 | 18 | 8 | Debuffer | Corrosive Touch — Target DEF −25% for 3 turns |
| Corroded Sentinel | 320 | 48 | 50 | 4 | Tank | Rusted Slam — Taunts 2 turns, 120% ATK |
| Tide Lurker | 200 | 55 | 22 | 18 | Ambusher | Ambush — First attack deals 180% ATK |

---

### Region 3: Outer Currents

*Synergy: Coordinated military tactics — marks + buffs + focus fire*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Aquarian Enforcer | 240 | 58 | 32 | 14 | Soldier | Trident Thrust — 150% ATK, +30% if target Marked |
| Current Mage | 170 | 62 | 20 | 16 | Caster | Riptide Mark — Marks target 2 turns (+30% damage taken) |
| Patrol Shark | 260 | 65 | 25 | 20 | Beast | Blood Frenzy — +20% ATK per enemy below 50% HP |
| Checkpoint Warden | 300 | 50 | 45 | 10 | Support | Rally — All allies +25% ATK for 2 turns |

---

### Region 4: The Murk

*Synergy: Blind targets → assassins deal devastating follow-up*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Murk Stalker | 220 | 68 | 24 | 24 | Assassin | Shadowstrike — 200% ATK to Blinded, 130% otherwise |
| Blind Angler | 200 | 55 | 28 | 12 | Disruptor | Lure Light — Blinds target 2 turns (50% miss chance) |
| Outcast Thug | 280 | 60 | 35 | 10 | Brawler | Desperate Swing — 140% ATK; +40% ATK below 50% HP |
| Shadow Eel | 190 | 72 | 18 | 26 | Glass cannon | Darting Strike — 160% ATK, gains 30% Evasion 1 turn |

---

### Region 5: Beggar's Reef

*Synergy: Stack Plague DoTs → extend duration → punish AoE*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Plague Bearer | 240 | 58 | 30 | 11 | Infector | Spreading Sickness — Plague to target + adjacent (5% max HP/turn, 3 turns) |
| Desperate Vagrant | 180 | 65 | 22 | 15 | Fodder | Nothing to Lose — On death, 80% ATK to random hero |
| Slum Enforcer | 320 | 62 | 40 | 8 | Tank | Shakedown — 130% ATK, steals target's shield |
| Reef Rat Swarm | 160 | 50 | 15 | 20 | Multi-hit | Gnawing Frenzy — 4×40% ATK; each hit on Plagued extends duration +1 |

---

### Region 6: Pearlgate Plaza

*Synergy: Bodyguards protect VIPs → VIPs buff and heal the squad*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Pearl Guard | 300 | 72 | 42 | 14 | Elite | Ceremonial Strike — 150% ATK; +50% if ally died |
| Noble's Bodyguard | 380 | 60 | 55 | 12 | Protector | Intercept — Guards lowest HP ally 2 turns |
| Court Mage | 220 | 78 | 28 | 16 | Support | Tidal Blessing — Heals ally 20% max HP, +30% DEF 2 turns |
| Gilded Construct | 350 | 68 | 50 | 6 | Juggernaut | Gilded Slam — 170% ATK to all heroes (4-turn CD) |

---

### Region 7: Coral Castle Halls

*Synergy: Knight marks prey → Hound shreds marked → Sentinel locks down threats*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Coralsworn Knight | 340 | 80 | 48 | 13 | Elite | Marked for Death — 140% ATK, marks target (+40% beast damage) |
| King's Hound | 280 | 88 | 32 | 22 | Hunter | Savage Pursuit — 180% to marked (120% otherwise); double attack below 30% |
| Castle Sentinel | 420 | 65 | 60 | 5 | Lockdown | Coral Chains — Stuns target 1 turn, self-stuns 1 turn |
| Royal Caster | 250 | 82 | 30 | 15 | Mage | King's Mandate — All allies +20% ATK/SPD 2 turns |

---

### Region 8: Throne Approach

*Synergy: Debuff heroes → Zealots exploit weakness → killing Corrupted backfires*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Throne Guardian | 480 | 75 | 65 | 8 | Wall | Unbreaking Vigil — Taunts all 2 turns, −25% damage taken |
| Mind-Touched Advisor | 280 | 85 | 35 | 14 | Controller | Psychic Fray — Target ATK/DEF −30% 2 turns |
| Fanatical Zealot | 300 | 105 | 28 | 18 | Berserker | Ecstatic Strike — 200% to debuffed (130% otherwise), 15% recoil |
| The Corrupted | 350 | 90 | 40 | 12 | Punisher | Dying Curse — On death, curses killer (−25% all stats 3 turns) |

---

### Region 9: Scalding Traverse

*Synergy: Stack burns → trigger eruption → sustain from burning heroes*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Vent Crawler | 380 | 92 | 55 | 10 | Brawler | Superheated Claws — 150% ATK, Burn 2 turns (4% max HP/turn) |
| Magma Eel | 320 | 100 | 35 | 20 | Striker | Searing Lunge — 170% ATK; spreads Burn to adjacent if target Burning |
| Volcanic Polyp | 280 | 80 | 45 | 4 | Artillery | Eruption — All Burning heroes take 60% ATK (3-turn CD) |
| Thermal Elemental | 400 | 95 | 42 | 14 | Sustain | Heat Absorption — Heals 10% max HP per Burning hero at turn start |

---

### Region 10: The Abyssal Maw

*Synergy: Drain + weaken → swarm the weak → execute low HP → punish grouping*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Abyssal Lurker | 420 | 110 | 50 | 22 | Executioner | Pressure Crush — 150% ATK; instant kill below 15% HP |
| Mind Leech | 300 | 95 | 38 | 16 | Drain | Psychic Siphon — Drains 10% current HP, heals self, −20% ATK 2 turns |
| Void Angler | 500 | 105 | 55 | 6 | AoE | Abyssal Lure — Pulls all heroes, then 130% ATK to all (4-turn CD) |
| Spawn of the Maw | 250 | 100 | 30 | 18 | Swarm | Endless Hunger — 140% ATK; if kills, summons another Spawn |

---

### Branch 1: Drowned Prison

*Synergy: Weaken → slow → stun (extended) → execute helpless*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Prison Warden | 260 | 48 | 40 | 10 | Controller | Lockdown — Stuns 1 turn; +1 turn if target debuffed |
| Chain Golem | 320 | 44 | 52 | 4 | Tank | Binding Chains — Taunts, −50% SPD 2 turns |
| Drowner | 180 | 52 | 25 | 14 | Executioner | Held Under — 160% to stunned, 100% otherwise |
| Taskmaster | 200 | 50 | 30 | 12 | Debuffer | Break Spirit — Target ATK/DEF −20% 3 turns |

---

### Branch 2: Sunken Shipyard

*Synergy: Steal buffs → block healing → force friendly fire → punish focus*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Wreck Scavenger | 220 | 62 | 28 | 18 | Thief | Plunder — 130% ATK, steals target's buffs |
| Drowned Sailor | 280 | 58 | 35 | 10 | Haunt | Ghostly Grasp — 120% ATK, target can't heal 2 turns |
| Barnacle Titan | 380 | 55 | 55 | 5 | Wall | Encrusted Shell — 30% DR 2 turns, reflects 20% damage |
| Shipwreck Siren | 200 | 68 | 22 | 16 | Disruptor | Luring Song — Forces target to attack ally next turn |

---

### Branch 3: Blackfin Den

*Synergy: Stealth + backstab → poison stacks → snowballing pit fighter*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Blackfin Cutthroat | 260 | 75 | 30 | 20 | Assassin | Backstab — 200% from stealth (120% otherwise); starts stealthed |
| Pit Fighter | 340 | 70 | 38 | 14 | Brawler | Crowd Pleaser — 150% ATK; +15% ATK permanently on kill |
| Guild Poisoner | 220 | 65 | 28 | 16 | DoT | Coated Blade — 110% ATK, stacking poison (3%/turn, 5x max) |
| Blackfin Fence | 280 | 60 | 35 | 12 | Support | Dirty Deal — Heals all 15%; random ally gains stealth 1 turn |

---

### Branch 4: Forbidden Archives

*Synergy: Silence caster → blind them too → drain MP → copy skills against you*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Archive Construct | 380 | 75 | 55 | 8 | Guardian | Restricted Access — 140% ATK, Silences 2 turns |
| Ink Specter | 280 | 85 | 30 | 18 | Caster | Redacted — 160% ATK; if Silenced, also Blinds 1 turn |
| Tome Mimic | 300 | 80 | 40 | 14 | Trickster | Forbidden Page — Copies last hero skill, uses against them |
| Knowledge Warden | 350 | 78 | 48 | 12 | Anti-mage | Mind Seal — All heroes lose 20% current MP; +10% ATK per MP drained |

---

### Branch 5: Primordial Nursery

*Synergy: Endless spawns → protecting/healing young → rage when young die*

| Enemy | HP | ATK | DEF | SPD | Role | Ability |
|-------|-----|-----|-----|-----|------|---------|
| Juvenile Horror | 200 | 88 | 28 | 22 | Swarm | Feeding Frenzy — 130% ATK; attacks twice if another Juvenile died this turn |
| Brood Tender | 340 | 82 | 45 | 10 | Spawner | Nurture — Summons 2 Juveniles; if present, heals them 30% instead |
| Egg Cluster | 450 | 0 | 60 | 0 | Objective | Hatching — Can't attack. Spawns 1 Juvenile/turn. If killed, all allies +30% ATK 2 turns |
| The Matriarch | 480 | 98 | 50 | 12 | Elite | Mother's Wrath — 180% ATK to all; +50% if any Juvenile/Egg died this battle |

---

## Mini-Bosses

### Commander Tideclaw (Region 3: Outer Currents)

*The iron fist of martial law.*

| Stat | Value |
|------|-------|
| HP | 1,800 |
| ATK | 85 |
| DEF | 50 |
| SPD | 16 |

**Skill 1: Marshal's Command** (3-turn CD)
All allies +40% ATK/SPD 2 turns. Commander taunts 1 turn.

**Skill 2: Executioner's Verdict** (4-turn CD)
200% ATK to lowest HP hero. If kills, all allies heal 15% max HP.

---

### The Blightmother (Region 5: Beggar's Reef)

*She spreads disease as mercy—death ends suffering.*

| Stat | Value |
|------|-------|
| HP | 2,000 |
| ATK | 78 |
| DEF | 42 |
| SPD | 12 |

**Skill 1: Epidemic** (3-turn CD)
Plagues ALL heroes (5% max HP/turn, 3 turns). Heals self 10% per hero infected.

**Skill 2: Mercy's End** (4-turn CD)
180% ATK. If target Plagued, resets duration and +50% damage.

---

### Lord Coralhart (Region 7: Coral Castle Halls)

*The king's most loyal knight—loyal to a fault.*

| Stat | Value |
|------|-------|
| HP | 2,400 |
| ATK | 95 |
| DEF | 60 |
| SPD | 14 |

**Skill 1: For the Crown!** (3-turn CD)
Summons 2 Coralsworn Knights. If Knights present, +50% ATK instead.

**Skill 2: Oathbound Strike** (4-turn CD)
220% ATK. +30% damage per fallen ally (including summons).

---

### King Meridius the Hollow (Region 8: Throne Approach)

*The king fights, but his eyes are empty. Something else moves his hand.*

| Stat | Value |
|------|-------|
| HP | 2,800 |
| ATK | 100 |
| DEF | 55 |
| SPD | 15 |

**Skill 1: Crown's Burden** (3-turn CD)
150% ATK to all heroes. King takes 10% max HP recoil. *(He's fighting the control.)*

**Skill 2: Puppet's Fury** (4-turn CD)
250% ATK to one target. *(King whispers "run" before striking.)*

---

## Genus Loci: Thalassion, the Deep Mind

*The ancient horror lurking in the abyss. It has controlled Aquarian kings for centuries, feeding on the city's despair.*

### Base Stats

| Stat | Value |
|------|-------|
| HP | 4,500 |
| ATK | 120 |
| DEF | 70 |
| SPD | 18 |

### Active Abilities

| Ability | Cooldown | Description |
|---------|----------|-------------|
| Psychic Crush | 0 | 150% ATK, −15% ATK debuff 2 turns |
| Mind Flay | 3 | 120% ATK to ALL heroes; 30% chance Confused 1 turn each |
| Dominate | 5 | Controls one hero 2 turns; hero uses strongest skill against allies |
| Call of the Deep | 4 | Summons 2 Spawn of the Maw; if 3+ Spawns exist, all Spawns attack instead |
| Abyssal Reckoning | 6 | Only below 30% HP. 200% ATK to all; heroes below 50% HP Terrified 2 turns (−40% ATK/DEF, can't buff) |

### Passive Abilities

| Passive | Effect |
|---------|--------|
| Psychic Aura | All heroes −10% ATK/SPD while Thalassion lives |
| Endless Dreaming | Heals 5% max HP each round; 10% if any hero Dominated or Confused |
| The Mind Unshackled | Below 30% HP: +30% ATK, +20% SPD, unlocks Abyssal Reckoning |

### Fight Phases

**Phase 1 (100%–30% HP):**
- Mind Flay softens party with confusion
- Dominate turns your strongest hero against you
- Call of the Deep floods field with multiplying Spawns
- Endless Dreaming sustains through mind-control

**Phase 2 (Below 30% HP):**
- Enrages via The Mind Unshackled
- Abyssal Reckoning devastates low-HP parties
- Race to finish before Dominate + Reckoning wipes you

---

## Implementation Notes

### Files to Create

**Quest regions (src/data/quests/):**
- `tidewall_ruins.js`
- `outer_currents.js`
- `the_murk.js`
- `beggars_reef.js`
- `pearlgate_plaza.js`
- `coral_castle_halls.js`
- `throne_approach.js`
- `scalding_traverse.js`
- `the_abyssal_maw.js`
- `drowned_prison.js`
- `sunken_shipyard.js`
- `blackfin_den.js`
- `forbidden_archives.js`
- `primordial_nursery.js`

**Enemy files (src/data/enemies/):**
- `tidewall.js`
- `currents.js`
- `murk.js`
- `beggar.js`
- `pearlgate.js`
- `castle.js`
- `throne.js`
- `scalding.js`
- `abyss.js`
- `prison.js`
- `shipyard.js`
- `blackfin.js`
- `archives.js`
- `nursery.js`

**Genus Loci:**
- Add Thalassion to `src/data/genusLoci.js`
- Add abilities to `src/data/genusLociAbilities.js`

### Required Changes to Existing Files

1. **coral_depths.js**: Add `prison_01` to `coral_03` connections
2. **regions.js**: Import and add all new regions
3. **index.js** (quests): Export all new nodes
4. **index.js** (enemies): Export all new enemies

### Assets Required

**Map backgrounds (src/assets/maps/):**
- `tidewall_ruins.png`
- `outer_currents.png`
- `the_murk.png`
- `beggars_reef.png`
- `pearlgate_plaza.png`
- `coral_castle_halls.png`
- `throne_approach.png`
- `scalding_traverse.png`
- `the_abyssal_maw.png`
- `drowned_prison.png`
- `sunken_shipyard.png`
- `blackfin_den.png`
- `forbidden_archives.png`
- `primordial_nursery.png`

**Battle backgrounds (src/assets/battle_backgrounds/):**
- One per node (81 total) or shared per region (15 total)

**Enemy portraits (src/assets/enemies/):**
- Portrait for each new enemy type
