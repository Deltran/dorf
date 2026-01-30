# Equipment System Design

## Overview

Equipment is a progression layer unlocked mid-game when players rescue a blacksmith in Aquaria. Heroes can equip gear across 4 slots to gain stats and effects. Equipment upgrades via merging duplicates, mirroring the hero merge system.

## Unlock

A special "rescue" quest node in Aquaria frees a captive blacksmith who joins the player's camp. After unlock:
- Blacksmith section appears in Goods & Markets
- Equipment and materials begin dropping from quest nodes
- Heroes can equip gear

Future regions will have similar special quests that upgrade explorations to produce materials (separate development).

## Equipment Slots

Every hero has 4 equipment slots:

| Slot | Type | Notes |
|------|------|-------|
| Weapon | Universal | All heroes |
| Armor | Universal | All heroes |
| Trinket | Universal | Choose Ring OR Cloak line |
| Special | Class-specific | Varies by class |

### Trinket Slot

Two competing item lines for the trinket slot:
- **Rings** — Sustain and combat trigger effects
- **Cloaks** — Resource manipulation effects

A hero equips one or the other. Both use the same upgrade materials (Gem Shards) but cannot merge with each other.

### Special Slot by Class

| Class | Special Slot |
|-------|--------------|
| Knight | Shield |
| Berserker | War Trophy |
| Ranger | Bow |
| Mage | Staff |
| Cleric | Holy Symbol |
| Paladin | Holy Relic |
| Druid | Totem |
| Bard | Instrument |

### Legendary Hero Override (Future)

5-star heroes will eventually get unique special slots instead of class defaults (e.g., Aurora gets "Dawn's Embrace" instead of Holy Relic). For v1, legendaries use their class slot.

## Template Binding

Equipment binds to hero **template**, not instance:
- Equip Kingslayer to Aurora → all Aurora copies use it
- Can unequip and move gear freely between templates
- Only one template can have a given item equipped at a time

**Rule:** Equipment does not affect heroes on expeditions.

## Upgrade System

Equipment upgrades work like hero merging:

```
Same Item + Same Item + Gold + Materials → Next Tier Item
```

Example: Rusty Shiv + Rusty Shiv + 500 Gold + 2 Common Weapon Stones → Worn Blade

Item names change per tier (not "2★ Rusty Shiv" but "Worn Blade").

### Materials

Materials are **slot-specific** AND **tier-specific** (16 types total):

| Slot | 1→2★ | 2→3★ | 3→4★ | 4→5★ |
|------|------|------|------|------|
| Weapon | Common Weapon Stone | Uncommon Weapon Stone | Rare Weapon Stone | Epic Weapon Stone |
| Armor | Common Armor Plate | Uncommon Armor Plate | Rare Armor Plate | Epic Armor Plate |
| Trinket | Common Gem Shard | Uncommon Gem Shard | Rare Gem Shard | Epic Gem Shard |
| Class | Common Class Token | Uncommon Class Token | Rare Class Token | Epic Class Token |

Gold cost scales with tier. Materials drop from quest nodes post-blacksmith unlock. Distribution TBD when Aquaria is finalized.

## Item Lines

### Weapon

| Tier | Name |
|------|------|
| 1★ | Rusty Shiv |
| 2★ | Worn Blade |
| 3★ | Steel Falchion |
| 4★ | Blackiron Cleaver |
| 5★ | Kingslayer |

### Armor

| Tier | Name |
|------|------|
| 1★ | Scrap Leather |
| 2★ | Studded Hide |
| 3★ | Chain Hauberk |
| 4★ | Blackiron Plate |
| 5★ | Warlord's Mantle |

### Ring (Trinket Line A)

| Tier | Name |
|------|------|
| 1★ | Cracked Ring |
| 2★ | Copper Charm |
| 3★ | Silver Locket |
| 4★ | Runed Talisman |
| 5★ | Soulshard Ring |

### Cloak (Trinket Line B)

| Tier | Name |
|------|------|
| 1★ | Tattered Shroud |
| 2★ | Traveler's Cape |
| 3★ | Woven Mantle |
| 4★ | Spellthief's Cloak |
| 5★ | Mantle of the Infinite |

### Knight — Shield

| Tier | Name |
|------|------|
| 1★ | Dented Buckler |
| 2★ | Wooden Kite Shield |
| 3★ | Iron Heater |
| 4★ | Blackiron Bulwark |
| 5★ | Unbreakable Aegis |

### Berserker — War Trophy

| Tier | Name |
|------|------|
| 1★ | Cracked Skull |
| 2★ | Severed Claw |
| 3★ | Warchief's Fang |
| 4★ | Demon Horn |
| 5★ | Godslayer's Heart |

### Ranger — Bow

| Tier | Name |
|------|------|
| 1★ | Bent Shortbow |
| 2★ | Hunter's Longbow |
| 3★ | Composite Bow |
| 4★ | Shadowwood Recurve |
| 5★ | Windrider's Arc |

### Mage — Staff

| Tier | Name |
|------|------|
| 1★ | Gnarled Branch |
| 2★ | Apprentice's Rod |
| 3★ | Runed Staff |
| 4★ | Crystalcore Scepter |
| 5★ | Staff of Unmaking |

### Cleric — Holy Symbol

| Tier | Name |
|------|------|
| 1★ | Tarnished Pendant |
| 2★ | Wooden Icon |
| 3★ | Silver Ankh |
| 4★ | Blessed Reliquary |
| 5★ | Martyr's Tear |

### Paladin — Holy Relic

| Tier | Name |
|------|------|
| 1★ | Faded Prayer Beads |
| 2★ | Pilgrim's Token |
| 3★ | Sanctified Censer |
| 4★ | Radiant Chalice |
| 5★ | Shard of the Divine |

### Druid — Totem

| Tier | Name |
|------|------|
| 1★ | Chipped Antler |
| 2★ | Carved Bone |
| 3★ | Spiritwood Fetish |
| 4★ | Beastlord's Effigy |
| 5★ | Heart of the Wild |

### Bard — Instrument

| Tier | Name |
|------|------|
| 1★ | Cracked Whistle |
| 2★ | Worn Lute |
| 3★ | Silver Flute |
| 4★ | Enchanted Harp |
| 5★ | Voicesteal Violin |

## Stats & Effects

### Weapon & Armor

High stats, no effects. Core four stats only: ATK, DEF, HP, SPD.

Actual values TBD during implementation (balance via `/dorf-hero-evaluation`).

### Trinkets

Medium stats plus minor effect.

**Ring Line:**

| Tier | Effect |
|------|--------|
| 1★ | +1 MP regen per turn |
| 2★ | Heal 2% max HP per turn |
| 3★ | +8% Crit Chance |
| 4★ | +5% Evasion |
| 5★ | +15% ATK when below 50% HP |

**Cloak Line:**

| Tier | Effect |
|------|--------|
| 1★ | +2 starting MP |
| 2★ | +1 MP regen per turn |
| 3★ | +5 starting Rage/Focus/Valor (whichever applies) |
| 4★ | First skill each battle costs 0 MP |
| 5★ | +20% max MP, skills cost 1 less MP |

### Class Items

Low stats plus one signature effect that scales with tier (X increases per tier):

| Class | Signature Effect |
|-------|------------------|
| Knight Shield | Block X flat damage per hit |
| Berserker Trophy | +X% ATK when below 50% HP |
| Ranger Bow | +X% chance to deal 150% damage (introduces crit) |
| Mage Staff | +X% skill damage |
| Cleric Symbol | +X% healing done |
| Paladin Relic | +X% ATK and DEF |
| Druid Totem | +X HP regen per turn |
| Bard Instrument | +X% effect to Finale |

## UI & Access Points

### Goods & Markets Screen

- New "Blacksmith" section appears after unlock
- Browse all owned equipment
- Upgrade any item (even if equipped or on expedition hero)
- See material costs and requirements

### Inventory

- Equipment appears as items in inventory
- Item detail view has "Upgrade" action button
- Shows current tier, stats, effect, and who has it equipped

### Hero Details (HeroesScreen)

- New "Equipment" section showing all 4 slots
- Tap slot to equip/unequip/swap items
- Tap equipped item to view details or upgrade directly
- Empty slots show "None" with tap to browse available gear

### Equip Flow

1. Tap empty slot on hero
2. See list of compatible unequipped items
3. Select item → equipped to this hero template
4. All copies of that hero now use it

### Unequip Flow

1. Tap equipped slot
2. "Unequip" removes it (goes back to inventory)
3. Or "Change" to swap directly to different item

## Data Model

### Equipment Item Structure

```javascript
{
  id: 'rusty_shiv',
  name: 'Rusty Shiv',
  type: 'equipment',
  slot: 'weapon',           // weapon, armor, ring, cloak, or class slot id
  rarity: 1,
  stats: { atk: 5 },
  effect: null,             // or { type: 'regen_hp', value: 2 }
  upgradesTo: 'worn_blade'  // next tier item id
}
```

### Hero Equipment State

Template-level binding in heroes store:

```javascript
equippedGear: {
  'aurora_the_dawn': {
    weapon: 'worn_blade',           // item id or null
    armor: 'scrap_leather',
    trinket: 'cracked_ring',
    special: 'faded_prayer_beads'
  }
}
```

### Blacksmith Unlock

New flag tracking rescue quest completion (in quests store or dedicated blacksmith store).

## Future Expansions

- **Legendary hero unique slots** — 5-star heroes get special slot overrides with skill modifiers
- **Exploration material production** — Special quests upgrade explorations to produce materials
- **Work orders** — Blacksmith daily tasks that reward materials
- **Equipment drop distribution** — Finalize when Aquaria region is complete

## Out of Scope for v1

- Critical hit system (except Ranger Bow introducing it for that class)
- Hero-specific skill modifications on legendary items
- Multiple item lines per universal slot
