# The Maw — Daily Roguelike Combat Challenge

## Overview

The Maw is a cursed, haunted battleground — a place that shouldn't exist, drawing fighters deeper with each wave. Players fight 11 escalating waves (10 fights + 1 boss), drafting boons between fights to build synergistic power. One run per day, unlimited attempts to improve, but rewards are banked only once — from your best attempt — when you "close" The Maw or the day resets.

**Currency:** Dregs — the residue left by the cursed ground.

## Core Loop

1. **Select a difficulty tier** (1-5, unlocked progressively) — locked in for the day
2. **Fight wave 1** — standard turn-based combat
3. **Pick 1 of 3 boons** — build-defining synergies across picks
4. **Party carries over** — HP/MP/all resources persist, small recovery between waves
5. **Repeat** through 10 waves + 1 boss (wave 11)
6. **Review results** — see depth reached and reward preview
7. **Try again or close** — attempt again to go deeper, or bank today's rewards

## Difficulty Tiers

Player selects a tier before starting. **Once selected, that tier is locked in for the day.** Higher tiers have stronger enemies and better rewards. Tiers unlock permanently by reaching the boss (wave 11) on the tier below.

| Tier | Enemy Level Range | Reward Multiplier | Unlock Condition |
|------|-------------------|-------------------|------------------|
| 1 | ~10-30 | 1x | Available at Maw unlock |
| 2 | ~25-55 | 1.5x | Beat Tier 1 boss |
| 3 | ~50-90 | 2x | Beat Tier 2 boss |
| 4 | ~80-140 | 3x | Beat Tier 3 boss |
| 5 | ~130-200+ | 4x | Beat Tier 4 boss |

## Daily Seed

Each day generates a unique Maw per tier, per player:
- **Same waves all day** — enemy compositions, stat scaling, and boon offerings are fixed for the day
- **Each tier has its own seed** — can't preview a higher tier by running a lower one
- **Per-player seed** — derived from date + tier + player-specific salt (e.g., save ID). No two players share the same Maw.
- **Repeat attempts see the same offerings** — players can plan boon picks across attempts
- **Resets daily** — fresh Maw every day

## Wave Structure

11 waves total: 10 standard fights + 1 boss.

| Wave | Phase | Enemies | Feel |
|------|-------|---------|------|
| 1-3 | Warm-up | 1-2 weak enemies | Easy wins, start collecting boons |
| 4-7 | Pressure | 2-3 enemies, mixed kits, buffs appear | Need a plan |
| 8-10 | Danger | 3-4 enemies with synergistic kits, debuffs | Boon build matters now |
| 11 | Boss | Tier-specific boss encounter | The climax — can your build handle it? |

**Run time:** ~20 minutes per full attempt.

### Between Waves

- **All resources carry over** — HP, MP, Rage, Valor, Verses, Essence, Focus
- Recovery: +10% max HP, +5% max MP (same as quest between-battle recovery)
- Pick 1 of 3 boons (10 total boon picks before the boss)

### Resource Carryover

Unlike quest multi-battles (which only persist HP/MP/Rage), The Maw persists all class resources between waves. This requires an expanded `getPartyState()` that saves Valor, Verses, Essence, Focus, and `lastSkillName`. The between-wave recovery function for The Maw preserves all resources while applying the standard HP/MP recovery.

**Note on balance:** Full resource carryover means Knights can enter the boss with 100 Valor and Bards can Finale on turn 1 of later waves. This is accepted — bosses should be tuned to handle maxed-out resources. If specific classes become too dominant, consider resource resets at difficulty breakpoints (e.g., Valor resets to 0 at wave 8 when Danger phase begins). This is a tuning lever, not a launch requirement.

### Mid-Run Save/Resume

**Mandatory for mobile.** Players must be able to leave The Maw between waves and resume later. A run in progress is saved after each wave completes (before boon selection or after boon selection — TBD, but the safe point is after the wave ends and before the next begins).

**Save points:**
- After a wave victory (party state + boons saved)
- After boon selection (chosen boon added to run state)
- NOT mid-battle — if the app dies during combat, that wave restarts from the beginning

**Resume flow:**
- On entering The Maw with an `activeRun` in state, show "Resume Run" (wave X, N boons active) instead of tier selection
- Player can resume or abandon (abandoning banks best-run rewards if the current run isn't the best)

**Daily reset with active run:**
- If the day resets while a run is in progress, the active run is abandoned and best-run rewards are auto-banked
- The `activeRun` is cleared on reset

This ensures a phone call on wave 9 doesn't cost 15 minutes of progress.

### Boss Wave (Wave 11)

Each tier has its own boss template. The boss is the climax of the run — a single powerful enemy (or small elite group) tuned to test the builds players have drafted across 10 boon picks. Boss identity is determined by the daily seed.

### Enemy Composition

Enemies are drawn from existing enemy templates. The daily seed selects compositions that escalate in synergy:
- Early waves: random individual enemies
- Mid waves: enemies with complementary kits (tank + healer, debuffer + DPS)
- Late waves: full synergy teams, multiple enemies with buff/debuff coordination
- Boss: tier-specific, designed to pressure specific strategies

## Boon System

Boons are **Fight-Level Effects** — encounter-level modifiers defined in the standalone Fight-Level Effects system (see `2026-02-05-fight-level-effects-design.md`). They are NOT status effects, cannot be cleansed, and persist for the entire run.

After each wave, pick 1 of 3 boons. By the boss wave, you have 10 boons active. Each boon is added to the encounter via `addFightLevelEffect` between waves.

**Dependency:** The Maw requires the Fight-Level Effects engine (at minimum Phase 1) before implementation can begin.

### Boon Categories

| Category | Examples | Color Accent |
|----------|---------|--------------|
| Offensive | Bonus damage to debuffed targets, multi-hit chance, damage on kill | Red |
| Defensive | Heal between waves, damage reduction, shield at low HP | Blue |
| Tactical | Extend buff durations, resource boost at wave start, SPD effects | Green |
| Synergy | Burn on hit, bonus vs burning, lifesteal on kills | Purple |

### Seed & Payoff Synergies

The build-defining heart of the system. Some boons are "seeds" that create a condition, others are "payoffs" that reward it:

**Example chains:**
- **Seed:** "Your attacks apply SPD_DOWN for 1 turn" → **Payoff:** "Deal +30% damage to slowed targets"
- **Seed:** "Heroes gain Shield (10% max HP) at start of each wave" → **Payoff:** "While shielded, deal 20% more damage"
- **Seed:** "Apply burn on hit (5% chance)" → **Payoff:** "Burning enemies take 25% more damage" → **Payoff 2:** "Burn damage heals the attacker"

Picking unrelated boons gives incremental power. Picking seed + payoff chains gives dramatic power spikes — that's the roguelike thrill.

### Boon Offering Generation

Boon offerings are **seeded but smart-filtered**, not pure random. When generating the 3 boon options for a wave:

- If the player has drafted a seed boon, at least one of the 3 offerings should be a matching payoff (if one exists in the pool). This prevents dead-end builds where you take a burn seed and never see a burn payoff.
- The remaining slots are drawn from the seeded pool normally.
- This is a soft guarantee, not a hard one — the seed determines the pool order, and the filter nudges toward synergy without making it deterministic.

The exact filtering algorithm needs deep design before implementation — the boon pool, seed/payoff tag system, and offering generation are tightly coupled and should be designed together as a unit.

### Boon Rarity

| Rarity | Appearance Rate | Power Level |
|--------|----------------|-------------|
| Common | ~60% | Small outcome bumps, minor effects |
| Rare | ~30% | Meaningful bonuses, single synergy pieces |
| Epic | ~10% | Strong payoffs, multi-synergy enablers |

Since the daily seed is per-player and fixed, players learn when the epic boons appear and can plan earlier picks around them on subsequent attempts.

### Boon Data Shape

```js
{
  id: 'searing_strikes',
  name: 'Searing Strikes',
  description: 'Your attacks have a 5% chance to burn.',
  category: 'synergy',     // 'offensive' | 'defensive' | 'tactical' | 'synergy'
  rarity: 'common',        // 'common' | 'rare' | 'epic'
  scope: 'heroes',         // 'heroes' | 'enemies' | 'all'
  isSeed: true,
  seedTags: ['burn'],       // For synergy highlighting in UI
  trigger: 'on_hit',        // When the effect activates
  effect: {                  // What happens
    type: 'apply_status',
    statusType: 'BURN',
    chance: 0.05,
    duration: 2
  }
}
```

Boons with visual-only effects (screen shake on hit, flash on kill) use the same trigger system with `effect.type: 'visual'`.

## Rewards

### Per-Wave Accrual

Small rewards that stack as you go deeper. All rewards come from your **best run only** (deepest wave reached), not accumulated across attempts.

| Resource | Per Wave | Notes |
|----------|----------|-------|
| Gold | 20-50 (scales with tier) | Bread and butter |
| Gems | 0-5 (rare chance) | Not guaranteed every wave |

### Milestone Drops (Waves 5, 10, Boss)

- XP tomes (small at wave 5, medium at wave 10, large at boss)
- Occasional item drops from the existing item pool

### Gauntlet Currency: Dregs

Earned based on deepest wave reached in your best run:

| Depth | Dregs (Tier 1) | Tier 3 (2x) | Tier 5 (4x) |
|-------|----------------|-------------|-------------|
| Wave 3 | 5 | 10 | 20 |
| Wave 5 | 10 | 20 | 40 |
| Wave 7 | 18 | 36 | 72 |
| Wave 10 | 30 | 60 | 120 |
| Boss clear | 50 | 100 | 200 |

Scaling is slightly superlinear — each wave deeper is worth more than the last. Boss clear gives a significant bonus.

### Rest Bonus (Anti-FOMO)

Players who skip days accumulate a reward bonus, reducing pressure to play daily:

| Days Skipped | Bonus on Next Run |
|---|---|
| 1 | +90% |
| 2 | +180% |
| 3+ | +270% (cap) |

The bonus applies to **all rewards** (gold, gems, Dregs, milestone drops) when the run is claimed — whether through completion, closing, or daily timeout. The bonus is consumed on claim.

**Reward comparison over 4 days:**

| Pattern | Total Rewards |
|---|---|
| Play every day | 100 + 100 + 100 + 100 = 400% |
| Skip 1, play day 2 | 0 + 190 + 100 + 100 = 390% |
| Skip 2, play day 3 | 0 + 0 + 280 + 100 = 380% |
| Skip 3, play day 4 | 0 + 0 + 0 + 370 = 370% |

Daily players earn ~8% more than once-every-4-days players. Consistency is rewarded without punishing breaks.

### Close Mechanic

- Player selects a tier at start of day — **locked in for the day**
- **Unlimited attempts** to improve your best run on that tier
- **"Close The Maw"** banks your best run's rewards
- If you don't close manually, daily reset auto-closes with your best
- Once closed, no more runs until tomorrow
- Preview your pending rewards (including rest bonus) before committing

## Dregs Shop

A dedicated shop spending Dregs:

- **Hero shards** — exclusive or hard-to-get hero shards (long-term grind goal)
- **XP tomes** — convenience option for leveling
- **Gold packs** — bulk gold for merging/upgrades
- **Gem packs** — small gem amounts
- **Rare items** — items not easily found elsewhere

Shop stock can rotate weekly or be permanent — TBD based on economy balance.

## Unlock Condition

The Maw unlocks in the second super-region alongside shards and equipment, giving players a new active combat activity to complement those progression systems.

Exact unlock node: TBD (requires a quest node or milestone in the second super-region).

## How The Maw Differs from Other Activities

| | Quests | Colosseum | Genus Loci | Explorations | **The Maw** |
|---|---|---|---|---|---|
| **Format** | Multi-battle chain, fixed enemies | Single bout vs AI heroes | Single scalable boss | Passive, no combat | 11-wave survival + boss |
| **Enemies** | Pre-set compositions | Hero templates with AI | Unique boss with passives | None | Seeded random compositions |
| **Progression** | Permanent (clear nodes) | Permanent (push ladder) | Permanent (power levels) | Rankable | Daily (re-earn each day) |
| **Unique mechanic** | Story, region unlocks | Hero vs hero, Laurels | Scaling difficulty, passives | Hero locking, time/fight | **Boon drafting** |
| **Session length** | ~5 min | ~3 min per bout | ~5-10 min | Zero (passive) | ~20 min |
| **Currency** | Gold/gems/XP | Laurels | Crests | Gold/gems/XP | **Dregs** |
| **Daily obligation** | None | Collect Laurels (passive) | None | Check completions | One run (with rest bonus for skipping) |

## Theme

**Setting:** The Maw is cursed ground — a place that draws fighters in and gets worse the deeper you go. Dark fantasy horror. Not the generic "astral broken realm" of other gacha games — this is a wound in the earth that leaks wrongness.

**Tone:** Gritty, atmospheric, unsettling. The deeper waves should feel oppressive. The boss should feel like you've disturbed something that was better left alone.

**Visual direction:** Dark, muted palette with sickly accent colors (greens, purples, dim reds) that contrast with the rarity-driven boon card colors. Between-wave boon selection should feel like a brief respite — slightly lighter background, then back into the dark.

## UI Flow

1. **Maw entry screen** — tier selection (or locked-in tier display), today's best depth, rest bonus indicator, close button
2. **Pre-battle** — wave number, enemy preview, active boons list
3. **Battle** — standard BattleScreen with Maw wave indicator and active boon count
4. **Boon selection** — full-screen pick from 3 boons with descriptions, rarity glow, synergy highlights for seed/payoff connections
5. **Boss intro** (wave 11) — brief dramatic intro before the boss fight
6. **Run end** — depth reached, rewards preview (with rest bonus if applicable), "Try Again" / "Close The Maw" buttons
7. **Dregs shop** — separate tab/screen accessible from Maw entry

All screens follow mobile-first design (600px max-width), safe-area padding (`calc(Xpx + var(--safe-area-top))`), and touch-friendly tap targets (44px minimum). Boon selection uses tap/click, no swipe gestures.

## Technical Notes

### Battle Integration
- Uses existing battle engine — `battleType: 'maw'` flag
- Party state persists between waves with **full resource carryover** (expanded `getPartyState()`)
- Between-wave recovery: +10% HP, +5% MP, all other resources preserved as-is
- Boons are Fight-Level Effects — stored on the run state, not on units, not subject to cleanse/dispel

### Full Resource Carryover

`getPartyState()` saves all resources (HP, MP, Rage, Valor, Verses, Essence, Focus, lastSkillName). This is a change from current behavior which only saves HP/MP/Rage. The expanded save is used for The Maw; quest multi-battles continue using the current subset (or could optionally be upgraded later).

A Maw-specific `applyBetweenWaveRecovery()` function applies +10% HP, +5% MP recovery while preserving all other resources intact.

### Fight-Level Effects Engine

Boons use the standalone Fight-Level Effects system (see `2026-02-05-fight-level-effects-design.md`). The Maw sets effects via `addFightLevelEffect` between waves. Effects accumulate across the run and are cleared when the run ends.

### Daily Seed
- Seed generated per-player: `seed = hash(YYYY-MM-DD + tier + playerSalt)`
- `playerSalt` is a random value generated on first save, never changes
- Seed determines: enemy compositions per wave, boon offerings per wave, boss identity
- Deterministic RNG from seed so all attempts for that player are identical

### Persistence
- Own store: `src/stores/maw.js`
- State shape:
  ```js
  {
    // Daily state
    selectedTier: null,          // Locked-in tier for today (null = not started)
    bestDepth: 0,                // Deepest wave reached today
    pendingRewards: null,        // Rewards from best run, waiting to be claimed
    closed: false,               // Whether today's rewards have been banked
    lastPlayDate: null,          // 'YYYY-MM-DD' for daily reset detection
    daysSkipped: 0,              // For rest bonus calculation (cap at 3)

    // Active run state (persisted for save/resume)
    activeRun: null,             // null when not in a run
    // activeRun shape when running:
    // {
    //   tier, wave, boons: [],
    //   partyState: {},          // Full resource snapshot from last completed wave
    //   rewards: { gold, gems, items },
    //   pendingBoonSelection: bool,  // True if wave done but boon not yet picked
    //   boonOfferings: []        // The 3 boons offered (seeded, so reproducible, but cached for resume)
    // }

    // Permanent state
    tierUnlocks: { 1: true },    // Which tiers are permanently unlocked
    dregs: 0,                    // Currency balance
    playerSalt: null,            // Generated once, never changes

    // Shop
    shopPurchases: {}            // { itemId: count }
  }
  ```
- Key actions: `selectTier(tier)`, `startRun()`, `completeWave()`, `selectBoon(boonId)`, `endRun()`, `closeMaw()`, `checkDailyReset()`, `purchaseItem(itemId)`

### New Data Needed
- Boon definitions (`src/data/maw/boons.js`)
- Boss templates per tier (`src/data/maw/bosses.js`)
- Maw enemy pool per tier (or reuse quest enemy templates with level scaling)
- Dregs currency + shop inventory (`src/data/maw/shop.js`)
- Seeded RNG utility function
