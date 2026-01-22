# Dorf

A browser-based gacha hero collector with turn-based tactical combat. Summon heroes, build parties, and battle through quest nodes on a world map.

## Features

- **Gacha System**: Summon heroes with 1-5 star rarities, featuring soft pity at 50 pulls and hard pity at 90 pulls
- **Hero Collection**: Collect and manage a roster of unique heroes across multiple classes (Knight, Mage, Cleric, Ranger, Berserker, Bard, Druid, Paladin)
- **Party Building**: Assemble a team of 4 heroes with complementary roles (Tank, DPS, Healer, Support)
- **Leader Skills**: Designate a 5-star hero as party leader to unlock powerful team-wide bonuses
- **Turn-Based Combat**: Strategic battles with speed-based turn order, skills, and status effects
- **World Map Progression**: Battle through connected quest nodes with multi-fight encounters
- **Item System**: Collect XP tomes and items from battles to power up your heroes
- **Dual Currency**: Earn gems for summoning and gold for hero upgrades
- **Local Save**: Progress is automatically saved to browser local storage

## Tech Stack

- **Vue 3** with Composition API
- **Pinia** for state management
- **Vite** for development and building

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/deltran/dorf.git
   cd dorf
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Game

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

Then open your browser to `http://localhost:5173` (or the URL shown in the terminal).

### Production Build

Build for production:

```bash
npm run build
```

This creates optimized files in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
dorf/
├── src/
│   ├── main.js              # Vue app entry point
│   ├── App.vue              # Root component, handles screen navigation
│   ├── assets/
│   │   ├── heroes/          # Hero portrait images (named by hero ID)
│   │   ├── enemies/         # Enemy images
│   │   ├── maps/            # World map background images
│   │   └── battle_backgrounds/  # Battle scene backgrounds
│   ├── components/          # Reusable UI components
│   │   ├── HeroCard.vue     # Hero display card
│   │   ├── EnemyCard.vue    # Enemy display card
│   │   ├── ItemCard.vue     # Item display card
│   │   ├── StatBar.vue      # HP/MP bar component
│   │   ├── StarRating.vue   # Rarity star display
│   │   ├── ActionButton.vue # Battle action buttons
│   │   ├── MapCanvas.vue    # World map with SVG trails
│   │   └── NodeMarker.vue   # Quest node markers
│   ├── screens/             # Full-page views
│   │   ├── HomeScreen.vue   # Main hub
│   │   ├── GachaScreen.vue  # Hero summoning
│   │   ├── HeroesScreen.vue # Collection and party management
│   │   ├── WorldMapScreen.vue # Quest node selection
│   │   └── BattleScreen.vue # Combat interface
│   ├── stores/              # Pinia state stores
│   │   ├── heroes.js        # Hero collection, party, and leader
│   │   ├── gacha.js         # Pull logic, pity counters, currency
│   │   ├── quests.js        # World map and progress
│   │   ├── battle.js        # Combat state machine
│   │   └── inventory.js     # Item storage
│   ├── data/                # Static game data
│   │   ├── heroTemplates.js # Hero definitions
│   │   ├── enemyTemplates.js # Enemy definitions
│   │   ├── questNodes.js    # World map nodes
│   │   ├── classes.js       # Hero class definitions
│   │   ├── statusEffects.js # Buff/debuff definitions
│   │   └── items.js         # Item definitions
│   └── utils/
│       └── storage.js       # Local storage helpers
├── docs/
│   └── plans/               # Design documents
├── index.html               # HTML entry point
├── package.json
└── vite.config.js
```

## Game Mechanics

### Gacha Rates

| Rarity | Rate |
|--------|------|
| 1-star (Common) | 40% |
| 2-star (Uncommon) | 30% |
| 3-star (Rare) | 20% |
| 4-star (Epic) | 8% |
| 5-star (Legendary) | 2% |

- **Soft pity**: 5-star rate increases by 2% per pull after 50 pulls
- **Hard pity**: Guaranteed 5-star at 90 pulls
- **4-star pity**: Guaranteed 4-star or higher every 10 pulls

### Currency

| Currency | Use | Starting Amount |
|----------|-----|-----------------|
| Gems | Gacha pulls, premium purchases | 1000 |
| Gold | Hero merging, upgrades | 10000 |

### Combat

- Turn order is determined by speed stat (highest acts first)
- Heroes start battles with full HP and 30% MP
- MP regenerates 10% per round
- Basic attacks are free; skills cost MP
- Status effects (buffs/debuffs) last for a set number of turns
- Heroes unlock additional skills at levels 2 and 3

### Leader Skills

5-star (Legendary) heroes have unique leader skills that activate when designated as party leader:

| Hero | Leader Skill | Effect |
|------|--------------|--------|
| Aurora the Dawn | Dawn's Protection | Non-knight allies gain +15% DEF |
| Shadow King | Lord of Shadows | Round 1: All allies gain +25% ATK for 2 turns |
| Yggra, the World Root | Ancient Awakening | Round 1: Heal all allies for 10% of Yggra's ATK |

### Status Effects

| Type | Description |
|------|-------------|
| POISON | Damage over time (flat or ATK%) |
| BURN | Damage over time (flat or ATK%) |
| REGEN | Heal over time |
| MP_REGEN | MP restoration over time |
| ATK_UP/DOWN | Percentage modifier to attack |
| DEF_UP/DOWN | Percentage modifier to defense |
| SPD_UP/DOWN | Percentage modifier to speed |
| STUN | Skip turn (control effect) |
| TAUNT | Force enemies to target this hero |
| UNTARGETABLE | Cannot be targeted by enemies |
| EVASION | Chance to completely avoid attacks |
| THORNS | Reflect damage when attacked |
| RIPOSTE | Counter-attack when hit by lower DEF enemy |
| SHIELD | Absorbs damage before HP |
| DAMAGE_REDUCTION | Reduces incoming damage by percentage |
| MARKED | Increases damage taken from all sources |
| GUARDIAN_LINK | Redirects portion of damage to linked guardian |
| DAMAGE_STORE | Stores damage taken, releases as AoE on expiration |
| DIVINE_SACRIFICE | Intercepts all ally damage with damage reduction |
| FLAME_SHIELD | Burns attackers when hit |
| WELL_FED | Auto-heals when HP drops below threshold |
| DEATH_PREVENTION | Prevents fatal damage once |

- Stat modifiers stack additively (two 20% DEF downs = 40% reduction)
- DoT/HoT effects can scale with caster's ATK via `atkPercent`
- Cleanse effects can remove debuffs; some enemy skills remove buffs
- Protection effects (Divine Sacrifice, Guardian Link) are checked before normal damage

### Items

Items drop from quest battles and can be used or sold:

| Type | Items | Use |
|------|-------|-----|
| XP | Faded Tome, Knowledge Tome, Ancient Codex | Grant hero experience |
| Junk | Useless Rock, Shiny Pebble, Goblin Trinket | Sell for gems |

### Progression

- Complete quest nodes to unlock connected nodes
- Each node contains multiple battles with HP/MP carrying over
- Earn gems, gold, EXP, and items as rewards
- First-time node completion grants bonus gems

### World Regions

| Region | Difficulty | Enemies |
|--------|------------|---------|
| Whispering Woods | Early | Goblin Scout, Goblin Warrior, Forest Wolf, Dire Wolf, Forest Spider |
| Echoing Caverns | Mid | Cave Bat, Rock Golem, Dark Cultist, Dark Caster, Cave Troll |
| Stormwind Peaks | Late | Harpy, Frost Elemental, Storm Giant |

Each region has a boss node with unique mechanics and better rewards.

### Heroes

| Rarity | Heroes |
|--------|--------|
| 5-star | Aurora the Dawn (Paladin), Shadow King (Berserker), Yggra the World Root (Druid) |
| 4-star | Sir Gallan (Knight), Shasha Ember Witch (Mage), Lady Moonwhisper (Cleric), Swift Arrow (Ranger) |
| 3-star | Kensin Squire (Knight), Knarly Zeek (Mage), Grandma Helga (Cleric), Harl the Handsom (Bard) |
| 2-star | Sorju Gate Guard (Knight), Calisus (Mage), Bertan the Gatherer (Druid) |
| 1-star | Darl (Berserker), Salia (Ranger), Vagrant Bil (Cleric) |

### Featured 5-Star Heroes

**Aurora the Dawn** (Paladin) - Divine Protector
- **Holy Strike**: 120% ATK damage with 50% lifesteal
- **Guardian Link**: Link to an ally, absorbing 40% of their damage
- **Consecrated Ground**: Grant ally 25% damage reduction
- **Judgment's Echo**: Store all damage taken for 2 turns, then release as AoE
- **Divine Sacrifice**: Intercept ALL ally damage with 50% DR and self-healing

**Shadow King** (Berserker) - Rage-Fueled Warrior
- Builds Rage when taking damage or killing enemies
- Rage increases ATK but reduces DEF
- Ultimate abilities consume Rage for massive damage

**Yggra the World Root** (Druid) - Nature's Guardian
- **Nature's Grasp**: Root enemies and deal damage over time
- **Verdant Shield**: Grant ally death prevention (survive fatal hit at 1 HP)
- **Nature's Reclamation**: Damage enemies and heal all allies from the damage

## New Player Start

- Begin with 1000 gems and 10000 gold
- One guaranteed 3-star hero
- Tutorial quest node unlocked
