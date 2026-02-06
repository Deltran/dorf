# Dorf


A browser-based gacha hero collector with turn-based tactical combat. Summon heroes, build parties, and battle through a dark fantasy world across two continents. Playable on web and Android.

## Features

- **Gacha Summoning**: Pull heroes from rotating banners with pity system (soft pity at 50, guaranteed 5-star at 90)
- **38 Collectible Heroes**: 9 classes across 5 rarity tiers, each with unique skills and resource mechanics
- **Multi-Party System**: Build and switch between 3 independent parties of 4 heroes
- **9 Class Resource Systems**: Rage, Focus, Valor, Verse, Essence, and MP -- each class plays differently
- **Leader Skills**: 5-star heroes unlock powerful team-wide bonuses when set as party leader
- **Turn-Based Combat**: Speed-based turn order, 20+ status effects, damage interception chains, fight-level encounter modifiers, and conditional skill mechanics
- **28 Quest Regions**: Two continents (Western Veros and Aquarias) with connected node-based progression
- **4 Genus Loci Bosses**: Unique boss encounters with passive abilities and special mechanics
- **Colosseum Arena**: 50-bout PvP gauntlet with laurel currency and exclusive shop
- **Explorations**: Time-gated expeditions with rank progression and reward multipliers
- **Equipment System**: 60 gear items across 12 slot types with blacksmith upgrades
- **Shard Hunting**: Target specific heroes through shard collection and tier upgrades
- **Banner Rotation**: Standard banner + 3 rotating limited banners + monthly Black Market banners
- **Codex**: Field Guide (game mechanics tutorials) and Compendium (hero/enemy/region discovery tracking with gem rewards)
- **Hero Fusion**: Merge duplicate heroes to increase star level
- **Multiple Shops**: Blacksmith, Laurel Shop, Gem Shop (daily rotation), Gold Shop
- **New Player Intro**: Guided introduction with starter hero, gifted 4-star pull, and tutorial battle
- **Local Save**: Progress auto-saved to browser local storage
- **Mobile-First**: Portrait layout, touch-optimized, Android APK via Capacitor

## Tech Stack

- **Vue 3** with Composition API
- **Pinia** for state management
- **Vite** for development and building
- **Vitest** for testing
- **Capacitor** for Android builds

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

### Tests

Run the test suite:

```bash
npm test
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
npm run build:apk
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

Transfer this file to your phone and install it (enable "Install from unknown sources" in your phone's settings).

## Project Structure

- `src/screens/` - 26 full-page views (Home, Battle, Gacha, World Map, Colosseum, Codex, etc.)
- `src/components/` - Reusable UI components (cards, bars, resource indicators, admin panel)
- `src/stores/` - 14 Pinia stores (heroes, battle, gacha, quests, equipment, colosseum, etc.)
- `src/data/` - Static game data: heroes (by rarity), enemies (by region), quests (by region), equipment, banners, status effects
- `src/assets/` - Hero portraits, enemy sprites, battle backgrounds, region maps, banner images
- `scripts/` - AI asset generation tools (Pixellab, Gemini)
- `docs/plans/` - Design documents

## Asset Generation

Generate missing enemy sprites and battle backgrounds using AI APIs.

### Pixellab (Enemy Sprites)

```bash
# Setup: add PIXELLAB_TOKEN to .env

# List all missing assets
npm run generate-assets -- list

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

### Gemini (Backgrounds & Maps)

```bash
# Setup: add VITE_GEMINI_API_KEY to .env

# Generate all missing battle backgrounds (600x1000)
npm run generate-battle-backgrounds

# Generate all missing region maps (600x1000)
npm run generate-region-maps
```

### Asset Sizes

- **Enemies**: 64x64 (regular) or 128x128 (bosses/large creatures)
- **Backgrounds**: 600x1000
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

### Banners

| Banner Type | Availability | Description |
|-------------|--------------|-------------|
| **Standard** | Always | Full hero pool, all rarities |
| **Rotating Limited** | 10-day cycle | 3 themed banners cycle (Shields of Valor, Flames of War, Nature's Call) |
| **Monthly** | 1 per month | Featured heroes with rate-up (Musical Mayhem, Voices of Change, Oriental Fighters, Golden Showers, Deplorable Companions, Drums of the Old Blood) |
| **Black Market** | Hidden entrance | Access to last month, next month, and a daily vault banner |

### Currency

| Currency | Use | Starting Amount |
|----------|-----|-----------------|
| Gems | Gacha pulls, shop purchases | 1000 |
| Gold | Hero merging, equipment upgrades | 10000 |
| Laurels | Colosseum shop purchases | Earned from arena |

### Combat

- Turn order determined by speed stat (highest acts first)
- Heroes start battles with full HP and 30% of their resource (MP, Essence)
- Basic attacks are free; skills cost resources (varies by class)
- Status effects (buffs/debuffs) last for a set number of turns
- Heroes unlock additional skills at levels 2 and 3
- Damage interception chain: Evasion > Divine Sacrifice > Guardian Link > Guarded By > Damage Reduction > Shield > Marked > Normal
- Fight-Level Effects: Encounter modifiers (environmental damage, damage multipliers, burn-on-hit) that persist for the entire battle and cannot be cleansed

### Class Resource Systems

Each class uses a unique resource system that defines their combat rhythm:

| Class | Resource | Type | Mechanic |
|-------|----------|------|----------|
| **Berserker** | Rage | Build & Spend | Starts at 0, gains +10 on attack or taking damage. Capped at 100. Skills consume Rage for powerful attacks. |
| **Ranger** | Focus | Binary State | Starts battle focused. Loses Focus when hit or debuffed. Cannot use skills without Focus. Regains Focus from ally buffs or critical hits. |
| **Knight** | Valor | Build & Scale | Starts at 0, gains +5 when redirecting damage. Skills have minimum Valor requirements and scale effects at tiers (0/25/50/75/100). |
| **Bard** | Verse | Build to Finale | All skills free but add +1 Verse (0-3 max). Cannot repeat same skill consecutively. At 3 Verses, Finale auto-triggers as a free action. |
| **Alchemist** | Essence | Manage Volatility | Starts at 50%, regenerates +10 per turn. Volatility tiers: Stable (0-20, no bonus), Reactive (21-40, +15% damage), Volatile (41+, +30% damage but 5% max HP self-damage). |
| **Paladin** | Faith | Standard MP | Starts at 30%, skills cost MP. |
| **Mage** | Mana | Standard MP | Starts at 30%, skills cost MP. |
| **Cleric** | Devotion | Standard MP | Starts at 30%, skills cost MP. |
| **Druid** | Nature | Standard MP | Starts at 30%, skills cost MP. |

### Multi-Party System

- Manage 3 independent parties of 4 heroes each
- Switch active party on the home screen via swipe carousel
- Rename parties with long-press
- Each party has its own leader slot
- Select which party to bring into battle from quest details

### Equipment

- 5 gear slots per hero: weapon, armor, ring, cloak, and class-specific item
- Class-specific slots: Shield (Knight), War Trophy (Berserker), Bow (Ranger), Staff (Mage), Holy Symbol (Cleric), Holy Relic (Paladin), Totem (Druid), Instrument (Bard)
- Equipment ranges from rarity 1-5 with upgrade paths
- Blacksmith upgrades use gold + materials (Weapon Stones, Armor Plates, Gem Shards, Class Tokens)

### Hero Progression

- **Leveling**: Use XP tomes (Faded Tome 50 XP, Knowledge Tome 200 XP, Ancient Codex 500 XP) to level heroes
- **Merging**: Fuse duplicate heroes to increase star level (1 > 2 > 3 > 4 > 5)
- **Shards**: Hunt shards for specific heroes through 5 hunting slots with tier upgrades (0-3)
- **Equipment**: Gear stat bonuses (ATK, DEF, HP, SPD) applied to heroes

### Colosseum

A 50-bout PvP gauntlet against AI-controlled hero parties:
- Progressive difficulty from 1-star through 5-star opponents
- First-clear bonuses scale from 10-50 laurels per bout
- Daily laurel income from cleared bouts (2-5 laurels/day each)
- Laurel shop with exclusive items and limited stock

### Explorations

Time-gated expeditions for passive rewards:
- Send parties on hour-long missions
- Rank system (E through S) with reward multipliers
- Rank up using materials earned from exploration
- Shard drops available for targeted heroes

### Leader Skills

5-star (Legendary) heroes have unique leader skills that activate when set as party leader:

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
| DEBUFF_IMMUNE | Immune to debuffs for duration |
| SWIFT_MOMENTUM | Stacking SPD buff (max 5 stacks) |

- Stat modifiers stack additively (two 20% DEF downs = 40% reduction)
- Effects can use counter-based stacking with `maxStacks` (e.g., Swift Momentum)
- DoT/HoT effects can scale with caster's ATK via `atkPercent`
- Cleanse effects can remove debuffs; some enemy skills remove buffs
- Protection effects (Divine Sacrifice, Guardian Link) are checked before normal damage

### Fight-Level Effects

Encounter-level modifiers that apply to the entire battle based on where you're fighting. Unlike status effects, they cannot be cleansed, dispelled, or removed.

| Hook | Effect | Description |
|------|--------|-------------|
| Pre-Damage | Damage Multiplier | Multiply outgoing damage for heroes, enemies, or all |
| Pre-Damage | Damage Reduction | Reduce incoming damage (caps at 80%) |
| Turn Start | % Max HP Damage | Deal periodic damage based on max HP |
| Turn Start | % Max HP Heal | Heal periodically based on max HP |
| Post-Damage | Apply Status | Chance to inflict a status effect on hit |

- Scoped to `heroes`, `enemies`, or `all` combatants
- Multiple effects of the same type stack additively
- Set per quest node, boss arena, or added mid-battle by source systems
- Cleared automatically when the battle ends

### Items

Items drop from quest battles and can be used or sold:

| Type | Items | Use |
|------|-------|-----|
| XP Tomes | Faded Tome (50), Knowledge Tome (200), Ancient Codex (500) | Grant hero experience |
| Junk | Useless Rock, Shiny Pebble, Goblin Trinket, Magical Rocks | Sell for gems or gold |
| Region Tokens | 1 per region | Instantly collect rewards from a completed quest |
| Upgrade Materials | Weapon Stones, Armor Plates, Gem Shards, Class Tokens | Blacksmith equipment upgrades |
| Genus Loci Crests | Valinar, Great Troll, Pyroclast, Thalassion | Boss-specific drops |
| Keys | Lake Tower, Den, Eruption Vent, Abyss | Unlock Genus Loci encounters |

### Progression

- Complete quest nodes to unlock connected nodes
- Each node contains multiple battles with HP/MP carrying over
- Earn gems, gold, EXP, and items as rewards
- First-time node completion grants bonus gems
- Region tokens let you instant-collect rewards from cleared nodes without replaying

### World Regions

28 quest areas across two super-regions:

- **Western Veros** (13 regions) - The starting continent, ranging from the Whispering Woods through volcanic cliffs and ancient catacombs, ending at the Gate to Aquaria. Includes 3 Genus Loci boss encounters (Valinar, Great Troll, Pyroclast).
- **Aquarias** (15 regions) - An underwater realm unlocked after completing the Gate to Aquaria. 10 main-path regions leading to the final boss Thalassion, plus 5 branch regions with optional content.

### Genus Loci Bosses

Genus Loci are powerful boss enemies with unique abilities, passives, and scaling power levels (1-20):

| Boss | Region | Key Mechanics |
|------|--------|---------------|
| Valinar, Lake Tower Guardian | Whisper Lake | Iron Guard, Shield Bash, Counterattack Stance |
| The Great Troll Vurgorol | Hibernation Den | Hibernation (self-inflicted SLEEP with 10% HP regen), counterattack when woken |
| Pyroclast, the Living Eruption | Eruption Vent | Fire-based attacks, volcanic mechanics |
| Thalassion, the Deep Mind | The Abyssal Maw | Deep sea abilities, final boss |

### Codex

The in-game knowledge system with two sections:

- **Field Guide**: Categorized tutorials covering combat basics, classes, resources, status effects, leader skills, damage interception, equipment, and more. Unlocking topics awards gems.
- **Compendium**: Encyclopedia tracking discovery of heroes (Roster), enemies (Bestiary), and regions (Atlas). Reading new entries awards gems (50 per hero, 10 per enemy).

### Heroes

38 heroes across 9 classes:

| Rarity | Heroes |
|--------|--------|
| 5-star (10) | Aurora the Dawn (Paladin), Shadow King (Berserker), Yggra the World Root (Druid), Cacophon (Bard), Rosara the Unmoved (Knight), Onibaba (Druid), Fortuna Inversus (Bard), Mara Thornheart (Berserker), Grandmother Rot (Druid), Korrath Hollow Ear (Ranger) |
| 4-star (11) | Sir Gallan (Knight), Ember Witch (Mage), Lady Moonwhisper (Cleric), Swift Arrow (Ranger), Chroma (Bard), Zina the Desperate (Alchemist), Shinobi Jin (Ranger), Copper Jack (Berserker), Philemon the Ardent (Knight), Penny Dreadful (Alchemist), Vraxx Thunderskin (Bard) |
| 3-star (9) | Town Guard (Knight), Hedge Wizard (Mage), Village Healer (Cleric), Wandering Bard (Bard), Vashek the Unrelenting (Knight), Matsuda (Berserker), Bones McCready (Druid), The Grateful Dead (Knight), Torga Bloodbeat (Berserker) |
| 2-star (4) | Militia Soldier (Knight), Apprentice Mage (Mage), Herb Gatherer (Druid), Fennick (Ranger) |
| 1-star (4) | Farm Hand (Berserker), Street Urchin (Ranger), Beggar Monk (Cleric), Street Busker (Bard) |

**Class distribution:** Knight (7), Berserker (6), Bard (6), Ranger (5), Druid (5), Mage (3), Cleric (3), Alchemist (2), Paladin (1)

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

**Mara Thornheart** (Berserker) - Seething Fury
- Rage-fueled berserker with lifesteal and pain-triggered power spikes
- **Heartbreak**: Damage that chains conditional effects on debuffed targets
- Leader skill grants team lifesteal and ATK boost when allies are wounded

**Fortuna Inversus** (Bard) - Lady of Upturned Fates
- Gambler bard with fortune-themed verse skills
- **Finale - Fortune Swap**: Redistributes team HP for dramatic reversals
- Leader skill buffs allies below 50% HP

**Grandmother Rot** (Druid) - The Hungry Grandmother
- Poison and decomposition specialist
- **The Great Composting**: Unique damage-over-time mechanics
- Leader skill extends poison duration and heals allies off poisoned enemies

**Onibaba** (Druid) - The Mountain Crone
- Soul-draining support druid
- Leader skill auto-triggers Soul Siphon when allies drop below 30% HP

**Yggra the World Root** (Druid) - Ancient Support
- Nature-based healer and buffer
- Leader skill provides passive HP regen to all allies each round

## New Player Start

- Guided introduction with narrative about the world of Veros
- One guaranteed 3-star hero (Town Guard) as starter
- One gifted random 4-star hero from the standard banner
- Tutorial battle teaching combat basics
- Begin with 1000 gems and 10000 gold
- Whispering Woods quest region unlocked

## Admin Tools

A development-only admin panel (`AdminScreen`) accessible in dev mode:

- **Hero Editor**: Create and modify hero templates with full stat/skill editing
- **Quest Node Editor**: Create regions, add nodes, configure battles and rewards
- **Asset Viewers**: Browse hero portraits, enemy sprites, battle backgrounds, and region maps
