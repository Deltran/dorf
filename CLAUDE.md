# Claude Development Notes

Notes for AI assistants working on this project.

## Project Overview

Dorf is a Vue 3 gacha hero battler with turn-based combat. See `README.md` for full documentation and `docs/plans/2026-01-14-dorf-design.md` for the original design document.

## Hero Images

Located in `src/assets/heroes/{hero_id}.png` (static) or `{hero_id}.gif` (animated). Not all heroes have images.

**Heroes with images:** `militia_soldier`, `apprentice_mage`, `herb_gatherer`, `farm_hand`, `street_urchin`, `beggar_monk`, `wandering_bard`

**Heroes with animated GIFs:** `shadow_king`, `aurora_the_dawn`

**Loading pattern (Vite glob import with GIF priority):**
```js
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })

function getHeroImageUrl(heroId) {
  const gifPath = `../assets/heroes/${heroId}.gif`
  if (heroGifs[gifPath]) return heroGifs[gifPath]
  const pngPath = `../assets/heroes/${heroId}.png`
  return heroImages[pngPath] || null
}
```

## Enemy/Genus Loci Images

Located in `src/assets/enemies/{enemy_id}.png` for full images and `{enemy_id}_portrait.png` for turn tracker portraits.

**Loading pattern for portraits:**
```js
const enemyPortraits = import.meta.glob('../assets/enemies/*_portrait.png', { eager: true, import: 'default' })

function getEnemyPortraitUrl(enemyId) {
  const portraitPath = `../assets/enemies/${enemyId}_portrait.png`
  return enemyPortraits[portraitPath] || null
}
```

Portraits are used in:
- Turn order tracker (BattleScreen)
- Home page Genus Loci display
- World map node markers (for Genus Loci nodes)
- Quest detail popups

## Rarity System

| Rarity | Color | Gradient End (for backgrounds) |
|--------|-------|-------------------------------|
| 1-star (Common) | `#9ca3af` | `#262d36` |
| 2-star (Uncommon) | `#22c55e` | `#1f3329` |
| 3-star (Rare) | `#3b82f6` | `#1f2a3d` |
| 4-star (Epic) | `#a855f7` | `#2a2340` |
| 5-star (Legendary) | `#f59e0b` | `#302a1f` |

Base background color: `#1f2937`

**Card backgrounds:** Diagonal gradient (135deg) from base to tinted color
**Detail panel:** Horizontal gradient bar (4px) at top, rarity color fading to base

## Role Icons

```js
const roleIcons = {
  tank: '🛡️',
  dps: '⚔️',
  healer: '💚',
  support: '✨'
}
```

## Key Files

### Stores
- `src/stores/heroes.js` - Hero collection, party management, party leader
- `src/stores/battle.js` - Combat state machine, leader skill processing, damage interception
- `src/stores/gacha.js` - Pull logic, pity counters, gems and gold currency
- `src/stores/quests.js` - Quest progress, node unlocks, `lastVisitedNode` tracking
- `src/stores/inventory.js` - Item storage and management

**Key battle.js exports:**
- `applyDamage(unit, damage, type, source)` - Main damage application with all interception checks
- `calculateGuardianLinkDamage(target, damage, heroes)` - Split damage for Guardian Link
- `checkDivineSacrifice(target, heroes)` - Find hero with Divine Sacrifice active
- `releaseDamageStore(hero, enemies)` - Release stored damage as AoE
- `calculateHealSelfPercent(damage, percent)` - Calculate lifesteal healing

### Data
- `src/data/heroTemplates.js` - Hero definitions with skills and leader skills
- `src/data/enemyTemplates.js` - Enemy definitions
- `src/data/genusLoci.js` - Genus Loci boss definitions
- `src/data/genusLociAbilities.js` - Genus Loci abilities and passives
- `src/data/classes.js` - Class definitions (role, resource name)
- `src/data/statusEffects.js` - Buff/debuff definitions
- `src/data/questNodes.js` - Quest node definitions, region data
- `src/data/items.js` - Item definitions (XP tomes, junk items, keys, region tokens)

### Components
- `src/components/HeroCard.vue` - Hero display card
- `src/components/EnemyCard.vue` - Enemy display card
- `src/components/ItemCard.vue` - Item display card
- `src/components/MapCanvas.vue` - World map container with SVG trails
- `src/components/NodeMarker.vue` - Clickable quest node markers

## Leader Skills

5-star (Legendary) heroes have leader skills that activate when set as party leader.

### Leader Skill Types

**Passive** - Always active stat bonuses:
```js
leaderSkill: {
  name: "Dawn's Protection",
  description: 'Non-knight allies gain +15% DEF',
  effects: [{
    type: 'passive',
    stat: 'def',
    value: 15,
    condition: { classId: { not: 'knight' } }
  }]
}
```

**Timed** - Trigger at specific round:
```js
leaderSkill: {
  name: 'Lord of Shadows',
  description: 'On round 1, all allies gain +25% ATK for 2 turns',
  effects: [{
    type: 'timed',
    triggerRound: 1,
    target: 'all_allies',
    apply: {
      effectType: 'atk_up',
      duration: 2,
      value: 25
    }
  }]
}
```

**Timed Heal** - Round-triggered healing based on leader's ATK:
```js
leaderSkill: {
  name: 'Ancient Awakening',
  description: "On round 1, all allies are healed for 10% of Yggra's ATK",
  effects: [{
    type: 'timed',
    triggerRound: 1,
    target: 'all_allies',
    apply: {
      effectType: 'heal',
      value: 10  // Percentage of leader's ATK
    }
  }]
}
```

### Condition System

Conditions filter which units receive effects:
- `{ classId: 'knight' }` - Only knights
- `{ classId: { not: 'knight' } }` - All except knights
- `{ role: 'dps' }` - Only DPS role
- `{ role: { not: 'healer' } }` - All except healers

### Leader Skill Visual Effects

- **Timed skills**: Golden glow on leader card + floating skill name (1.5s)
- **Passive skills**: Brief green pulse on affected heroes at battle start (1.2s)

### Setting Party Leader

In `heroes.js` store:
- `partyLeader` ref holds the instanceId of the leader
- `setPartyLeader(instanceId)` to set (must be in party)
- `leaderHero` computed returns the full hero object
- HeroesScreen shows crown icon (👑) on leader's party slot

## Currency System

Two currencies managed in `gacha.js`:
- **Gems** (`gems`) - Premium currency for gacha pulls, starting at 1000
- **Gold** (`gold`) - Common currency for merging, starting at 10000

```js
gachaStore.addGems(amount)
gachaStore.spendGems(amount) // Returns false if insufficient
gachaStore.addGold(amount)
gachaStore.spendGold(amount) // Returns false if insufficient
```

## Item System

### Item Structure

```js
{
  id: 'tome_medium',
  name: 'Knowledge Tome',
  description: 'A well-preserved collection of teachings.',
  type: 'xp',        // 'xp' or 'junk'
  rarity: 2,         // 1-5
  xpValue: 200,      // For XP items
  sellReward: { gems: 40 }
}
```

### Inventory Store

```js
inventoryStore.addItem(itemId, count)
inventoryStore.removeItem(itemId, count)
inventoryStore.getItemCount(itemId)
inventoryStore.sellItem(itemId, count)  // Gives sellReward
inventoryStore.itemList  // Computed: sorted array of items with counts
```

### Item Drops

Quest nodes can drop items. In `questNodes.js`:
```js
rewards: { gems: 50, exp: 80, gold: 100 },
itemDrops: [
  { itemId: 'tome_small', chance: 0.3 },
  { itemId: 'useless_rock', chance: 0.5 }
]
```

Victory screen shows item drops with sequential reveal animation.

### Region Tokens

Tokens are consumable items that instantly collect rewards from a completed quest without replaying the battle. Each region has its own token.

**Token Structure:**
```js
{
  id: 'token_whispering_woods',
  name: 'Whispering Woods Token',
  description: 'Instantly collect rewards from a completed Whispering Woods quest.',
  type: 'token',
  rarity: 3,
  region: 'Whispering Woods'  // Must match region name exactly
}
```

**Token Drop Pattern:**
Tokens drop from the NEXT region in progression, rewarding players for advancing:

| Token For | Drops From |
|-----------|------------|
| Whispering Woods | Whisper Lake quests |
| Whisper Lake | Echoing Caverns quests |
| Echoing Caverns | Stormwind Peaks quests |
| Stormwind Peaks | Blistering Cliffsides quests |
| Blistering Cliffsides | The Summit quests |
| The Summit | Summit exploration |

Exploration nodes drop tokens for their region AND the previous region (e.g., cave_exploration drops both Whispering Woods and Echoing Caverns tokens).

**Helper Function:**
```js
import { getTokenForRegion } from '@/data/items'

const token = getTokenForRegion('Whispering Woods')
// Returns the token item object or undefined
```

**Using Tokens:**
```js
import { useQuestsStore } from '@/stores/quests'

const questsStore = useQuestsStore()
const result = questsStore.collectWithToken(nodeId, tokenItemId)
// Returns { success, rewards: { gold, gems, xp, items }, message }
```

The WorldMapScreen shows a "Use Token" button on completed quest nodes when the player has a matching token.

## World Map System

The world map displays quest nodes as an interactive graph with dotted trail connections.

### Region Data Structure

```js
{
  id: 'whispering_woods',
  name: 'Whispering Woods',
  startNode: 'forest_01',
  width: 800,              // Native canvas size
  height: 500,
  backgroundColor: '#1a2f1a',
  backgroundImage: whisperingWoodsMap  // Imported asset
}
```

### Quest Node Structure

```js
{
  id: 'forest_01',
  name: 'Dark Thicket',
  region: 'Whispering Woods',
  x: 100,                  // Position on region map (native coordinates)
  y: 250,
  battles: [...],
  connections: ['forest_02'],  // Drives trail rendering
  rewards: { gems: 50, exp: 80, gold: 100 },
  firstClearBonus: { gems: 30 },
  itemDrops: [{ itemId: 'tome_small', chance: 0.3 }]
}
```

### Map Background Images

Located in `src/assets/maps/{region_id}.png`. Import and assign to region's `backgroundImage` property.

```js
import whisperingWoodsMap from '../assets/maps/whispering_woods.png'
// Then in regions array:
backgroundImage: whisperingWoodsMap
```

Recommended size: 800x500 pixels (matches region width/height).

### Trail Visibility Logic

- Both nodes unlocked: Full visibility trail
- One node unlocked: Faded trail (teaser effect)
- Neither unlocked: Hidden

## Battle Backgrounds

Located in `src/assets/battle_backgrounds/{node_id}.png`. Loaded via glob import in BattleScreen.

The `quests.js` store tracks `lastVisitedNode` to show the most recent battle background on the home screen party section.

## UI Patterns

### Placement Mode (HeroesScreen)
When adding a hero to party:
1. Set `placingHero` to the hero being placed
2. Hide the detail panel (`v-if="selectedHero && !placingHero"`)
3. Show compact placement bar with hero name and cancel button
4. On slot click: place hero and clear `placingHero`
5. On cancel: clear `placingHero` (returns to detail view)

### Combat vs Non-Combat Display (HeroCard)
- `showBars` prop indicates combat mode (HP/MP bars visible)
- Hero images in card header are hidden during combat (`v-if="!showBars && ..."`)

### Non-Selectable Floating Text

Damage numbers, healing numbers, and XP floaters use `user-select: none` to prevent accidental text selection during combat.

### Sequential Reveal Animation

Used in GachaScreen (summon results) and BattleScreen (item drops):
```js
const revealedCount = ref(0)

watch(showResults, (show) => {
  if (show) {
    revealedCount.value = 0
    const revealNext = () => {
      if (revealedCount.value < items.length) {
        revealedCount.value++
        setTimeout(revealNext, 200)
      }
    }
    setTimeout(revealNext, 300)
  }
})
```

Template uses `v-if="index < revealedCount"` to control visibility.

## Damage Interception System

The `applyDamage` function in `battle.js` checks protection effects in this order:

1. **Evasion** - Roll for dodge chance, skip all damage if successful
2. **Divine Sacrifice** - If any ally has this, intercept ALL damage to other allies
3. **Guardian Link** - Redirect percentage of damage to the linked guardian
4. **Guarded By** - Full damage redirect to guarding unit
5. **Damage Reduction** - Apply percentage reduction
6. **Shield** - Absorb damage with shield HP
7. **Marked** - Increase damage taken
8. **Normal damage** - Apply remaining damage to HP

```js
// Example: checkDivineSacrifice returns hero with active Divine Sacrifice
const sacrificer = checkDivineSacrifice(target, heroes.value)
if (sacrificer) {
  // Intercept damage, apply DR, heal per turn
}

// Example: calculateGuardianLinkDamage splits damage
const { allyDamage, guardianDamage, guardian } = calculateGuardianLinkDamage(target, damage, heroes)
```

## Skill Properties

Skills can have these special properties:

| Property | Type | Description |
|----------|------|-------------|
| `damagePercent` | number | ATK multiplier (100 = 100% ATK) |
| `healSelfPercent` | number | Lifesteal - heal % of damage dealt |
| `healAlliesPercent` | number | Heal all allies for % of damage dealt |
| `healPercent` | number | Heal target for % of caster's ATK |
| `noDamage` | boolean | Skill applies effects only, no damage |
| `targetType` | string | `'enemy'`, `'ally'`, `'self'`, `'all_enemies'`, `'all_allies'` |
| `effects` | array | Status effects to apply |

```js
// Lifesteal skill example (Aurora's Holy Strike)
{
  name: 'Holy Strike',
  damagePercent: 120,
  healSelfPercent: 50,  // Heal for 50% of damage dealt
  targetType: 'enemy'
}

// Buff skill example (Aurora's Guardian Link)
{
  name: 'Guardian Link',
  targetType: 'ally',
  noDamage: true,
  effects: [
    { type: EffectType.GUARDIAN_LINK, target: 'ally', duration: 3, redirectPercent: 40 }
  ]
}
```

## Status Effect Types

Effects are defined in `src/data/statusEffects.js`. Key categories:

**Protection Effects** (checked in applyDamage):
- `DIVINE_SACRIFICE` - Intercepts all ally damage, has `damageReduction` and `healPerTurn`
- `GUARDIAN_LINK` - Redirects damage to guardian, has `guardianId` and `redirectPercent`
- `DAMAGE_REDUCTION` - Flat % damage reduction, has `value`
- `SHIELD` - Absorbs damage, has `shieldHp`
- `EVASION` - Dodge chance, has `value` (percentage)
- `DEATH_PREVENTION` - Survive fatal hit at 1 HP (one-time)

**Damage Storage** (accumulate and release):
- `DAMAGE_STORE` - Tracks `storedDamage`, releases to all enemies when duration expires

**Reactive Effects** (trigger when hit):
- `FLAME_SHIELD` - Burns attacker, has `burnDamage` and `burnDuration`
- `THORNS` - Reflects damage, has `value` (percentage)
- `RIPOSTE` - Counter-attack if attacker has lower DEF

**Triggered Effects**:
- `WELL_FED` - Heals when HP drops below `threshold`, has `healPercent`

**Control Effects**:
- `STUN` - Skips turn, cannot act
- `SLEEP` - Skips turn, removed when attacked (used by Hibernation mechanic)

```js
// Creating a protection effect
{
  type: EffectType.DIVINE_SACRIFICE,
  duration: 2,
  damageReduction: 50,  // 50% DR
  healPerTurn: 15       // Heal 15% max HP per turn
}

// Creating a damage store effect
{
  type: EffectType.DAMAGE_STORE,
  duration: 2,
  storedDamage: 0  // Accumulates as hero takes damage
}
```

## Class Resource Systems

Each class has a unique resource besides MP:

| Class | Resource | Mechanic |
|-------|----------|----------|
| Berserker | Rage | Builds on damage taken/kills, increases ATK, reduces DEF |
| Ranger | Focus | Builds per turn, spent on powerful shots |
| Knight | Valor | Builds when protecting allies, enables defensive skills |
| Paladin | Faith | Standard MP-like resource |
| Mage | Mana | Standard MP |
| Cleric | Divine Power | Standard MP |
| Druid | Nature | Standard MP |
| Bard | Inspiration | Standard MP |

## Hero Roster

| Rarity | Heroes |
|--------|--------|
| 5-star | Aurora the Dawn (Paladin), Shadow King (Berserker), Yggra the World Root (Druid) |
| 4-star | Sir Gallan (Knight), Shasha Ember Witch (Mage), Lady Moonwhisper (Cleric), Swift Arrow (Ranger) |
| 3-star | Kensin Squire (Knight), Knarly Zeek (Mage), Grandma Helga (Cleric), Harl the Handsom (Bard) |
| 2-star | Sorju Gate Guard (Knight), Calisus (Mage), Bertan the Gatherer (Druid) |
| 1-star | Darl (Berserker), Salia (Ranger), Vagrant Bil (Cleric) |

## Genus Loci System

Genus Loci are boss enemies defined in `src/data/genusLoci.js` with abilities in `src/data/genusLociAbilities.js`.

### Genus Loci Structure

```js
{
  id: 'great_troll',
  name: 'Great Troll',
  baseStats: { hp: 2500, atk: 180, def: 100, spd: 40 },
  abilities: [crushingBlow, boulderToss, hibernation, unstoppable],
  passiveAbilities: [regenerativeSleep, thickHide, rageAwakening]
}
```

### Passive Abilities

Passives are checked during battle flow in `battle.js`:

```js
// Damage reduction passive (checked in applyDamage)
{
  id: 'thick_hide',
  isPassive: true,
  damageReduction: 15  // 15% flat DR
}

// Heal while sleeping (checked in processStartOfTurnEffects)
{
  id: 'regenerative_sleep',
  isPassive: true,
  healWhileSleeping: { percentMaxHp: 10 }  // Heal 10% max HP per turn while SLEEP
}

// Counterattack when woken (checked in applyDamage when SLEEP removed)
{
  id: 'rage_awakening',
  isPassive: true,
  triggerCondition: 'woken_from_sleep',
  retaliatePercent: 200  // 200% ATK counter-attack
}
```

### Skill Use Conditions

Skills can have `useCondition` to restrict when they're available:

```js
{
  name: 'Hibernation',
  useCondition: 'hp_below_50',  // Only usable when HP < 50%
  effects: [{ type: EffectType.SLEEP, target: 'self', duration: 2 }]
}
```

Conditions are checked in `executeEnemyTurn`:
- `hp_below_50` - HP percentage below 50%

### Quest Node with Genus Loci

```js
{
  id: 'hibernation_den',
  name: 'Hibernation Den',
  type: 'genusLoci',
  genusLociId: 'great_troll',
  battles: [{ enemies: ['great_troll'], isGenusLoci: true }],
  rewards: { gems: 200, exp: 500, gold: 1000 },
  itemDrops: [{ itemId: 'great_troll_crest', chance: 0.15 }]
}
```
