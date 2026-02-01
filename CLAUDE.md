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

## Action Bar Backgrounds

Located in `src/assets/action_backgrounds/`:
- `classes/{class_id}.png` - Class-based backgrounds (berserker, knight, etc.)
- `heroes/{hero_id}.png` - Hero-specific overrides

**Image specs:** 480x60 (1x) or 960x120 (2x retina), displayed with `background-size: cover`

**Loading priority:**
1. Hero-specific override (`heroes/{hero_id}.png`)
2. Hero template `actionBackground` field (if set, looks for `heroes/{actionBackground}.png`)
3. Class-based background (`classes/{class_id}.png`)
4. Fallback: solid color `#111827` with class-colored left border

**Hero template override:**
```js
{
  id: 'aurora_the_dawn',
  actionBackground: 'custom_bg_name',  // Optional override
  // ...
}
```

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
- `src/data/heroes/` - Hero definitions (split by rarity: 5star/, 4star/, etc.)
- `src/data/enemies/` - Enemy definitions (split by area: forest.js, cave.js, etc.)
- `src/data/quests/` - Quest nodes and regions (split by region: whispering_woods.js, etc.)
- `src/data/genusLoci.js` - Genus Loci boss definitions
- `src/data/genusLociAbilities.js` - Genus Loci abilities and passives
- `src/data/classes.js` - Class definitions (role, resource name)
- `src/data/statusEffects.js` - Buff/debuff definitions
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

**Passive Regen** - Per-round healing based on each ally's max HP:
```js
leaderSkill: {
  name: 'Ancient Awakening',
  description: 'All allies regenerate 3% of their max HP at the start of each round',
  effects: [{
    type: 'passive_regen',
    target: 'all_allies',
    percentMaxHp: 3
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

Each class uses a unique resource system. Classes with `resourceType` in `classes.js` have custom mechanics; others use standard MP.

| Class | Resource | Type | Mechanic |
|-------|----------|------|----------|
| Berserker | Rage | Build & Spend | Starts at 0. +10 on attack, +10 when hit. Skills cost `rageCost`. `rageCost: 'all'` consumes all for scaling damage. |
| Ranger | Focus | Binary State | Starts focused. Loses Focus when hit or debuffed. Cannot use skills without Focus. Regains from ally buffs or crits. |
| Knight | Valor | Build & Scale | Starts at 0. +5 when redirecting damage. Skills have `valorRequired` minimum and scale at tiers (0/25/50/75/100). |
| Bard | Verse | Build to Finale | All skills free, +1 Verse each. At 3/3 Verses, Finale auto-triggers next turn. No consecutive skill repeats. |
| Alchemist | Essence | Volatility | Starts at 50%, +10/turn regen. Skills cost `essenceCost`. Volatility tiers: Stable (0-20), Reactive (21-40, +15% dmg), Volatile (41+, +30% dmg, 5% HP self-damage). |
| Paladin | Faith | Standard MP | Starts at 30%. Skills cost `mpCost`. |
| Mage | Mana | Standard MP | Starts at 30%. Skills cost `mpCost`. |
| Cleric | Devotion | Standard MP | Starts at 30%. Skills cost `mpCost`. |
| Druid | Nature | Standard MP | Starts at 30%. Skills cost `mpCost`. |

### Key Battle State Properties

```js
// Rage (Berserker)
hero.currentRage  // 0-100

// Focus (Ranger)
hero.hasFocus  // true/false

// Valor (Knight)
hero.currentValor  // 0-100

// Verse (Bard)
hero.currentVerses  // 0-3
hero.lastSkillName  // prevents repeats

// Essence (Alchemist)
hero.currentEssence  // 0 to maxEssence
hero.maxEssence  // from hero's MP stat

// MP (standard classes)
hero.currentMp  // 0 to maxMp
hero.maxMp
```

### Skill Cost Properties

```js
// Berserker
{ rageCost: 50 }        // Costs 50 Rage
{ rageCost: 'all' }     // Consumes all Rage, damage scales with amount

// Knight
{ valorRequired: 25 }   // Minimum 25 Valor to use
{ valorCost: 'all' }    // Consumes all Valor, effects scale

// Alchemist
{ essenceCost: 12 }     // Costs 12 Essence
{ usesVolatility: true } // Gains Volatility damage bonus

// Standard MP
{ mpCost: 20 }          // Costs 20 MP
```

## Bard Verse System

Bards use a unique Verse resource that replaces MP. All Bard skills are free to use, but each skill adds +1 Verse (0-3 max). When a Bard reaches 3/3 Verses, a **Finale** auto-triggers at the start of their next turn.

**Key rules:**
- Skills have no cost (no `mpCost`)
- Cannot repeat the same skill on consecutive turns
- 1-skill Bards have no repeat restriction and don't build Verses
- Finale auto-triggers at start of turn with 3/3 Verses (free action, Bard still gets normal turn)
- Finale resets Verses to 0 and clears `lastSkillName`
- Verses are preserved when stunned/CC'd (no decay)
- Verses reset to 0 on death/revive

**Finale** is defined per hero in the template:
```js
finale: {
  name: 'Standing Ovation',
  description: 'Restore resources to all allies and heal.',
  target: 'all_allies',  // or 'all_enemies'
  effects: [
    { type: 'resource_grant', rageAmount: 15, focusGrant: true, valorAmount: 10, mpAmount: 15, verseAmount: 1 },
    { type: 'heal', value: 5 }  // % of Bard's ATK
  ]
}
```

**Battle state properties:**
- `hero.currentVerses` — 0-3 counter
- `hero.lastSkillName` — tracks last skill for repeat prevention
- `finaleActivation` ref — `{ bardId, finaleName }` for UI visual

## Alchemist Essence System

Alchemists use Essence with a Volatility mechanic that rewards risk-taking.

**Key rules:**
- `maxEssence` = hero's MP stat (or 60 default)
- Starts at 50% of maxEssence
- Regenerates +10 Essence per turn
- Skills cost `essenceCost`

**Volatility Tiers:**
| Tier | Essence Range | Damage Bonus | Self-Damage |
|------|---------------|--------------|-------------|
| Stable | 0-20 | +0% | None |
| Reactive | 21-40 | +15% | None |
| Volatile | 41+ | +30% | 5% max HP per skill |

**Skill properties:**
```js
{
  name: 'Tainted Tonic',
  essenceCost: 10,
  usesVolatility: true,  // Gains Volatility damage bonus
  damagePercent: 90
}
```

**Battle.js functions:**
- `getVolatilityTier(hero)` — returns 'stable', 'reactive', or 'volatile'
- `getVolatilityDamageBonus(hero)` — returns 0, 15, or 30
- `getVolatilitySelfDamage(hero)` — returns 0 or 5

**Example Heroes:** Penny Dreadful, Zina the Desperate (4-star Alchemists)

## Hero Roster

| Rarity | Heroes |
|--------|--------|
| 5-star | Aurora the Dawn (Paladin), Shadow King (Berserker), Yggra the World Root (Druid), Cacophon (Bard), Rosara the Unmoved (Knight), Onibaba (Druid), Fortuna Inversus (Bard), Mara Thornheart (Berserker), Grandmother Rot (Druid), Korrath Hollow Ear (Ranger) |
| 4-star | Sir Gallan (Knight), Ember Witch (Mage), Lady Moonwhisper (Cleric), Swift Arrow (Ranger), Chroma (Bard), Zina the Desperate (Alchemist), Shinobi Jin (Ranger), Copper Jack (Berserker), Philemon the Ardent (Knight), Penny Dreadful (Alchemist), Vraxx Thunderskin (Bard) |
| 3-star | Town Guard (Knight), Hedge Wizard (Mage), Village Healer (Cleric), Wandering Bard (Bard), Vashek the Unrelenting (Knight), Matsuda (Berserker), Bones McCready (Druid), The Grateful Dead (Knight), Torga Bloodbeat (Berserker) |
| 2-star | Militia Soldier (Knight), Apprentice Mage (Mage), Herb Gatherer (Druid), Fennick (Ranger) |
| 1-star | Farm Hand (Berserker), Street Urchin (Ranger), Beggar Monk (Cleric), Street Busker (Bard) |

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

## Design Context

### Users

Dorf targets a mix of casual mobile gamers and gacha enthusiasts. Players range from those who want quick satisfying sessions to those who enjoy min-maxing party compositions and mastering combat mechanics. The game is played on mobile (Android via Capacitor) in a portrait-oriented, 600px-max layout. Players are here to collect heroes, build teams, and progress through a dark fantasy world.

### Brand Personality

**Bold, dark, scrappy.** Dorf takes its dark fantasy setting seriously with moody backgrounds and dramatic battle effects, but doesn't take *itself* too seriously — tongue-in-cheek hero names (Knarly Zeek, Vagrant Bil, Harl the Handsom) and emoji icons keep things grounded and characterful. It's a game that feels hand-crafted and rough-edged rather than corporate-polished. Think "indie dark fantasy with personality."

Three words: **Gritty. Spirited. Unapologetic.**

### Aesthetic Direction

**Visual tone:** Dark fantasy with retro RPG soul. Inspired by early Final Fantasy — the feeling of a deep world communicated through constrained, evocative visuals rather than lavish production. Rich dark backgrounds (#111827 base) with rarity-driven color accents that pop against the darkness.

**What it IS:** Dark, atmospheric, information-dense, animated with purpose, tactile card-based UI, fantasy-grounded color palette (golds, deep blues, blood reds, forest greens).

**What it is NOT:** Pastel or soft. Neon or cyberpunk. Flat/Material design utility-app aesthetic. Over-polished gacha with excessive particle effects. Generic mobile game template.

**Theme:** Dark mode only. No light mode planned or desired.

**References:** Early Final Fantasy (retro RPG charm, world-building through constraint), with modern gacha collection/progression loops.

### Design Principles

1. **Dark canvas, vivid accents** — The UI lives on deep dark backgrounds. Color is used sparingly and intentionally: rarity colors, damage types, resource states. When color appears, it means something.

2. **Information through density, not clutter** — Cards pack stats, bars, badges, and state into compact spaces. Every pixel earns its place. Small type sizes are acceptable when they serve information density. No decorative filler.

3. **Animation serves feedback** — Shake on hit, float on damage, pulse on resource gain, glow on buff. Animations communicate game state changes, not decoration. Keep them fast (0.2-0.4s) and functional.

4. **Rarity drives visual hierarchy** — The 5-tier rarity system (gray/green/blue/purple/gold) is the backbone of visual theming. Card borders, gradients, star ratings, and glow effects all reinforce rarity at a glance.

5. **Scrappy over slick** — Emoji icons over icon libraries. Hand-tuned CSS over design system tokens. The aesthetic should feel crafted by someone who cares, not generated by a framework. Rough edges are acceptable; generic is not.

### Accessibility Baseline

- Maintain reasonable color contrast for text readability on dark backgrounds
- Keyboard navigation where sensible for interactive elements
- No formal WCAG compliance target, but avoid gratuitously inaccessible patterns
- Avoid relying solely on color to communicate state (pair with icons/text)

### Technical Style Constraints

- **No CSS frameworks** — All styling is component-scoped `<style scoped>` in Vue SFCs
- **No icon libraries** — Emoji-based iconography throughout
- **System font stack** — `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`
- **Mobile-first** — 600px max-width constraint, no desktop breakpoints
- **Dark only** — No theme switching, all colors optimized for dark backgrounds
