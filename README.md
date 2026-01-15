# Dorf

A browser-based gacha hero collector with turn-based tactical combat. Summon heroes, build parties, and battle through quest nodes on a world map.

## Features

- **Gacha System**: Summon heroes with 1-5 star rarities, featuring soft pity at 50 pulls and hard pity at 90 pulls
- **Hero Collection**: Collect and manage a roster of unique heroes across multiple classes (Knight, Mage, Cleric, Ranger, Berserker, Bard, Druid)
- **Party Building**: Assemble a team of 4 heroes with complementary roles (Tank, DPS, Healer, Support)
- **Turn-Based Combat**: Strategic battles with speed-based turn order, skills, and status effects
- **World Map Progression**: Battle through connected quest nodes with multi-fight encounters
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
│   │   └── heroes/          # Hero portrait images (named by hero ID)
│   ├── components/          # Reusable UI components
│   │   ├── HeroCard.vue     # Hero display card
│   │   ├── EnemyCard.vue    # Enemy display card
│   │   ├── StatBar.vue      # HP/MP bar component
│   │   ├── StarRating.vue   # Rarity star display
│   │   └── ActionButton.vue # Battle action buttons
│   ├── screens/             # Full-page views
│   │   ├── HomeScreen.vue   # Main hub
│   │   ├── GachaScreen.vue  # Hero summoning
│   │   ├── HeroesScreen.vue # Collection and party management
│   │   ├── WorldMapScreen.vue # Quest node selection
│   │   └── BattleScreen.vue # Combat interface
│   ├── stores/              # Pinia state stores
│   │   ├── heroes.js        # Hero collection and party
│   │   ├── gacha.js         # Pull logic and pity counters
│   │   ├── quests.js        # World map and progress
│   │   └── battle.js        # Combat state machine
│   ├── data/                # Static game data
│   │   ├── heroTemplates.js # Hero definitions
│   │   ├── enemyTemplates.js # Enemy definitions
│   │   ├── questNodes.js    # World map nodes
│   │   ├── classes.js       # Hero class definitions
│   │   └── statusEffects.js # Buff/debuff definitions
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

### Combat

- Turn order is determined by speed stat (highest acts first)
- Heroes start battles with full HP and 30% MP
- MP regenerates 10% per round
- Basic attacks are free; skills cost MP
- Status effects (buffs/debuffs) last for a set number of turns

### Progression

- Complete quest nodes to unlock connected nodes
- Each node contains multiple battles with HP/MP carrying over
- Earn gems and EXP as rewards
- First-time node completion grants bonus gems

## New Player Start

- Begin with 1000 gems
- One guaranteed 3-star hero
- Tutorial quest node unlocked
