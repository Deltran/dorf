# Dorf


A browser-based gacha hero collector with turn-based tactical combat. Summon heroes, build parties, and battle through quest nodes on a world map.

## Features

- **Gacha System**: Summon heroes with 1-5 star rarities, featuring soft pity at 50 pulls and hard pity at 90 pulls
- **Hero Collection**: Collect and manage a roster of unique heroes across multiple classes (Knight, Mage, Cleric, Ranger, Berserker, Bard, Druid, Paladin, Alchemist)
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

### Android APK Build

Build an Android APK for installing on your phone.

#### Prerequisites

- Java 21 (required by Capacitor 8)
- Android SDK (install via Android Studio)

#### WSL Setup (if using WSL with Windows Android Studio)

Create `android/local.properties` with the WSL path to your Windows SDK:

```properties
sdk.dir=/mnt/c/Users/YOUR_USERNAME/AppData/Local/Android/Sdk
```

#### Build Commands

Sync your latest code changes to the Android project, then build:

```bash
# Sync web assets to Android (run after any code changes)
npm run cap:sync

# Build the debug APK
cd android && ./gradlew assembleDebug
```

Or as a single command:

```bash
npm run cap:sync && cd android && ./gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

Transfer this file to your phone and install it (enable "Install from unknown sources" in your phone's settings).

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
├── scripts/
│   ├── generate-assets.js   # Asset generation CLI
│   └── lib/                 # Asset checker, prompt builder, Pixellab client
├── docs/
│   └── plans/               # Design documents
├── index.html               # HTML entry point
├── package.json
└── vite.config.js
```

## Asset Generation

Generate missing enemy sprites and battle backgrounds using the [Pixellab.ai](https://pixellab.ai) API.

### Setup

1. Get an API token from Pixellab.ai
2. Create a `.env` file in the project root:
   ```
   PIXELLAB_TOKEN=your-token-here
   ```

### Commands

```bash
# List all missing assets
npm run generate-assets -- list

# Preview enemy generation (no API calls)
npm run generate-assets -- enemies --dry-run

# Generate all missing enemy sprites
npm run generate-assets -- enemies

# Generate all missing battle backgrounds
npm run generate-assets -- backgrounds

# Generate everything
npm run generate-assets -- all

# Regenerate a specific asset (even if it exists)
npm run generate-assets -- enemies --id cave_leech
npm run generate-assets -- backgrounds --id forest_01
```

### Batch Generation (Gemini API)

Generate battle backgrounds and region maps using the Gemini API.

**Setup**: Add your Gemini API key to `.env`:
```
VITE_GEMINI_API_KEY=your-key-here
```

**Commands**:
```bash
# Generate all missing battle backgrounds (600x1000)
npm run generate-battle-backgrounds

# Generate all missing region maps (600x1000)
npm run generate-region-maps
```

These scripts skip assets that already exist at the correct size.

### Asset Sizes

- **Enemies**: 64x64 (regular) or 128x128 (bosses/large creatures)
- **Backgrounds**: 320x128 (Pixellab) or 600x1000 (Gemini batch)
- **Region Maps**: 600x1000

### Custom Prompts

Override auto-generated prompts in `src/data/assetPrompts.js`:

```js
export const enemyPrompts = {
  cave_leech: {
    prompt: 'A slimy cave leech. Pale white skin. Circular mouth with teeth. High fantasy.',
    size: 64
  }
}

export const backgroundPrompts = {
  forest_01: {
    prompt: 'Dense forest clearing. Sunlight through canopy. Moss-covered rocks. Dark fantasy.'
  }
}
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
- Heroes start battles with full HP and 30% of their resource (MP, Essence)
- Basic attacks are free; skills cost resources (varies by class)
- Status effects (buffs/debuffs) last for a set number of turns
- Heroes unlock additional skills at levels 2 and 3

### Class Resource Systems

Each class uses a unique resource system that defines their combat rhythm:

| Class | Resource | Type | Mechanic |
|-------|----------|------|----------|
| **Berserker** | Rage | Build & Spend | Starts at 0, gains +10 on attack or taking damage. Capped at 100. Skills consume Rage for powerful attacks. |
| **Ranger** | Focus | Binary State | Starts battle focused. Loses Focus when hit or debuffed. Cannot use skills without Focus. Regains Focus from ally buffs or critical hits. |
| **Knight** | Valor | Build & Spend | Starts at 0, gains +5 when redirecting damage (Guardian Link, blocking). Skills have minimum Valor requirements and scale effects with current Valor tier (0/25/50/75/100). |
| **Bard** | Verse | Build to Finale | All skills are free but add +1 Verse (0-3 max). Cannot repeat same skill consecutively. At 3 Verses, Finale auto-triggers next turn as a free action with powerful team effects. |
| **Alchemist** | Essence | Manage Volatility | Starts at 50%, regenerates +10 per turn. Skills cost Essence. **Volatility tiers**: Stable (0-20, no bonus), Reactive (21-40, +15% damage), Volatile (41+, +30% damage but 5% max HP self-damage per skill). |
| **Paladin** | Faith | Standard MP | Starts at 30%, skills cost MP. |
| **Mage** | Mana | Standard MP | Starts at 30%, skills cost MP. |
| **Cleric** | Devotion | Standard MP | Starts at 30%, skills cost MP. |
| **Druid** | Nature | Standard MP | Starts at 30%, skills cost MP. |

**Special Skill Costs:**
- `rageCost: 'all'` - Consumes all Rage with scaling damage (e.g., +1% per Rage consumed)
- `valorCost: 'all'` - Consumes all Valor with scaling effects
- Valor skills use `valorRequired` for minimum threshold and scale duration/strength at higher tiers

### Leader Skills

5-star (Legendary) heroes have unique leader skills that activate when designated as party leader:

| Hero | Leader Skill | Effect |
|------|--------------|--------|
| Aurora the Dawn | Dawn's Protection | Non-knight allies gain +15% DEF |
| Shadow King | Lord of Shadows | Round 1: All allies gain +25% ATK for 2 turns |
| Yggra the World Root | Ancient Awakening | All allies regenerate 3% max HP each round |
| Cacophon | Harmonic Bleeding | All allies +15% damage but -30% healing (cleansable debuff) |
| Rosara the Unmoved | The First to Stand | Lowest HP% ally gains Taunt and +25% DEF for round 1 |
| Onibaba | Grandmother's Vigil | Auto Soul Siphon when ally drops below 30% HP (once per ally) |
| Fortuna Inversus | Fortune Favors the Bold | Allies below 50% HP gain +20% ATK |
| Mara Thornheart | What Doesn't Kill Us | All allies +5% lifesteal; +15% ATK when first dropping below 50% HP |
| Grandmother Rot | The Circle Continues | Each round, if enemy has poison: heal allies 5% ATK, extend poison +1 turn |
| Korrath Hollow Ear | Blood Remembers | Round 2: All allies gain +20% ATK and +15% SPD for 3 turns |

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
| SLEEP | Skip turn, removed when attacked |
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
| Whisper Lake | Mid | Valinar, Lake Tower Guardian (Genus Loci) |
| Stormwind Peaks | Late | Harpy, Frost Elemental, Storm Giant |
| Hibernation Den | Late | Cave Troll, Great Troll (Genus Loci) |

Each region has a boss node with unique mechanics and better rewards.

### Genus Loci Bosses

Genus Loci are powerful boss enemies with unique abilities and passives:

| Boss | Region | Key Mechanics |
|------|--------|---------------|
| Valinar, Lake Tower Guardian | Whisper Lake | Iron Guard, Shield Bash, Counterattack Stance |
| Great Troll | Hibernation Den | Hibernation (self-inflicted SLEEP with 10% HP regen), counterattack when woken |

### Heroes

| Rarity | Heroes |
|--------|--------|
| 5-star | Aurora the Dawn (Paladin), Shadow King (Berserker), Yggra the World Root (Druid), Cacophon (Bard), Rosara the Unmoved (Knight), Onibaba (Druid), Fortuna Inversus (Bard), Mara Thornheart (Berserker), Grandmother Rot (Druid), Korrath Hollow Ear (Ranger) |
| 4-star | Sir Gallan (Knight), Ember Witch (Mage), Lady Moonwhisper (Cleric), Swift Arrow (Ranger), Chroma (Bard), Zina the Desperate (Alchemist), Shinobi Jin (Ranger), Copper Jack (Berserker), Philemon the Ardent (Knight), Penny Dreadful (Alchemist), Vraxx Thunderskin (Bard) |
| 3-star | Town Guard (Knight), Hedge Wizard (Mage), Village Healer (Cleric), Wandering Bard (Bard), Vashek the Unrelenting (Knight), Matsuda (Berserker), Bones McCready (Druid), The Grateful Dead (Knight), Torga Bloodbeat (Berserker) |
| 2-star | Militia Soldier (Knight), Apprentice Mage (Mage), Herb Gatherer (Druid), Fennick (Ranger) |
| 1-star | Farm Hand (Berserker), Street Urchin (Ranger), Beggar Monk (Cleric), Street Busker (Bard) |

### Featured 5-Star Heroes

**Aurora the Dawn** (Paladin) - Divine Protector
- Uses Faith (standard MP) resource
- **Guardian Link**: Link to an ally, absorbing 40% of their damage
- **Divine Sacrifice**: Intercept ALL ally damage with 50% DR and self-healing

**Shadow King** (Berserker) - Rage-Fueled Warrior
- Builds Rage (+10) when attacking or taking damage
- **Void Strike** (50 Rage): 200% ATK, ignores 50% DEF
- **Crushing Eternity** (ALL Rage): Three hits at 50% ATK + 1% per Rage consumed

**Rosara the Unmoved** (Knight) - Valor Tank
- Builds Valor by protecting allies and redirecting damage
- Skills scale with Valor tiers (0/25/50/75/100)
- **Unbroken Vow** (50+ Valor): Shield that explodes on break, buffs allies if she dies

**Cacophon** (Bard) - Discordant Support
- Uses Verse system: all skills free, build 3 Verses for Finale
- **Finale - Dissonant Crescendo**: Deal damage to all enemies based on ally damage taken
- **Warding Noise**: Costs 5% ally HP, grants 25% max HP shield

**Korrath Hollow Ear** (Ranger) - Focus Assassin
- Binary Focus state: loses Focus when hit, regains from ally buffs
- **Whisper Shot**: Single-target execute, bonus damage to low HP enemies
- Focus-dependent kit rewards positioning and protection

## New Player Start

- Begin with 1000 gems and 10000 gold
- One guaranteed 3-star hero
- Tutorial quest node unlocked
