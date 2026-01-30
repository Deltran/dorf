# Cacophon, the Beautiful Disaster — 5-Star Bard Design

**Date:** 2026-01-30
**Status:** Approved for implementation

## Overview

Cacophon is a 5-star Bard with a unique "friendly fire" support identity. Her skills hurt allies (% max HP cost) but provide overtuned offensive buffs and "forbidden" effects not available elsewhere. She's the "murder enabler" support — you bring her when you want things to die fast, and you pay in blood for that privilege.

## Core Identity

- **Friendly fire mechanic:** All skills cost ally HP (flat % of target's max HP)
- **Cacophon is immune:** She doesn't take her own chip damage — eye of the storm
- **Forbidden effects:** Offers buffs that don't exist elsewhere (bonus damage vs debuffed, turn order manipulation, AoE conversion)
- **Finale payoff:** Accumulated ally HP loss throughout the battle converts to a powerful team buff

## Stats

| Stat | Base Value | Notes |
|------|------------|-------|
| HP | 95 | Lower than other 5-stars — she's safe from self-damage but squishy if targeted |
| ATK | 25 | Moderate — her value is in buffs, not personal damage |
| DEF | 22 | Low-average |
| SPD | 16 | Mid-speed |
| MP | 60 | Standard (unused — Bards use Verse) |

**Rarity:** 5-star
**Class:** Bard
**Role:** Support

## Leader Skill: "Harmonic Bleeding"

*Her music empowers and wounds as one.*

All allies gain a "Discordant Resonance" effect at battle start:
- +15% damage dealt
- -30% healing received
- **Counts as a debuff** — cleansing removes BOTH effects

**Design notes:**
- Power level matches Aurora's +15% DEF (offensive equivalent)
- The -30% healing creates real team-building tension
- Debuff classification adds counterplay (enemy cleanse removes your damage buff) and self-risk (ally cleanse can accidentally strip it)
- Anti-synergy with healers is intentional — she wants you bleeding, not healed

## Finale: "Suffering's Crescendo"

*Your pain was not in vain.*

**Trigger:** Auto-triggers at start of turn when Cacophon has 3/3 Verses

**Effect:**
- Track total HP lost by all allies during the battle (from all sources)
- Base: +10% ATK and +10% DEF to all allies for 3 turns
- Bonus: +1% ATK/DEF per 150 HP lost by allies (cap: +25% bonus)
- Maximum total: +35% ATK and +35% DEF for 3 turns

**Design notes:**
- Rewards long, bloody fights — her chip damage is an investment, not just a tax
- Soft cap prevents degenerate "take damage on purpose" strategies
- In realistic play, expect +20-30% total from Finale
- Synergizes with her own skills, enemy damage, and self-damage allies (Berserkers)

## Skills

### Skill 1: "Discordant Anthem"
**Unlock:** Level 1

*A rising chord that cuts as it lifts.*

| Property | Value |
|----------|-------|
| Target | All allies |
| HP Cost | 5% of each ally's max HP |
| Effect | +25% ATK for 2 turns |

**Design notes:** Bread-and-butter buff skill. Reliable, always useful, good for verse cycling.

---

### Skill 2: "Vicious Verse"
**Unlock:** Level 1

*She names your enemy's weakness, and you believe her.*

| Property | Value |
|----------|-------|
| Target | Single ally |
| HP Cost | 5% of target's max HP |
| Effect | Grant "Vicious" for 2 turns |

**Vicious buff:**
- +30% bonus damage against enemies with any debuff

**Design notes:** Requires setup (ally or enemy must apply debuffs). Pairs naturally with Penny Whistler, poison/burn teams, or any DEF/ATK down applicators.

---

### Skill 3: "Tempo Shatter"
**Unlock:** Level 3

*The rhythm breaks. You move while they stumble.*

| Property | Value |
|----------|-------|
| Target | Single ally |
| HP Cost | 6% of target's max HP |
| Effect | Grant "Shattered Tempo" for 1 turn |

**Shattered Tempo buff:**
- Target acts in the **top 2** of turn order next round
- Ignores normal SPD calculation for ordering
- Does not guarantee absolute first (another "top 2" effect or very specific circumstances could contest)

**Design notes:** Powerful turn manipulation. Sets up burst windows by letting slow, heavy hitters act before enemies can respond. Higher cost (6%) reflects the power.

---

### Skill 4: "Screaming Echo"
**Unlock:** Level 6

*One note becomes a thousand.*

| Property | Value |
|----------|-------|
| Target | Single ally |
| HP Cost | 6% of target's max HP |
| Effect | Grant "Echoing" for 1 turn |

**Echoing buff:**
- Next **single-hit** damaging skill hits ALL enemies
- Damage to additional targets is at **50%** effectiveness
- Multi-hit skills (e.g., Crushing Eternity) do NOT convert — only single-hit

**Design notes:** Turns single-target carries into AoE threats. The single-hit restriction prevents the most degenerate cases (3-hit skills becoming 3-hit AoE). 50% effectiveness is strong but not overwhelming.

---

### Skill 5: "Warding Noise"
**Unlock:** Level 12

*Even chaos can protect, if you scream loud enough.*

| Property | Value |
|----------|-------|
| Target | Single ally |
| HP Cost | 5% of target's max HP |
| Effect | Grant shield equal to 25% of target's max HP for 2 turns |

**Design notes:** Defensive option that still fits her identity (costs HP). Net gain is +20% max HP in protection. Gives her flexibility when pure offense isn't the answer.

---

## HP Cost Summary

| Skill | Cost | Typical Use |
|-------|------|-------------|
| Discordant Anthem | 5% (all allies) | Opening buff, verse filler |
| Vicious Verse | 5% | Debuff-heavy teams |
| Tempo Shatter | 6% | Burst setup |
| Screaming Echo | 6% | AoE conversion |
| Warding Noise | 5% | Emergency defense |

**Average per-skill cost:** ~5.4% of target's max HP

**Typical 3-skill Finale cycle:** ~16% max HP lost per ally (feeds Finale scaling)

## Synergies

**Strong with:**
- **Penny Whistler:** Debuff stacking enables Vicious Verse
- **Shadow King:** Self-damage + Screaming Echo AoE conversion
- **Any Berserker:** They already hurt themselves, might as well commit
- **Rangers:** Tempo Shatter guarantees Focus-charged shots land first
- **High-ATK carries:** Discordant Anthem's +25% ATK scales with their damage

**Anti-synergy with:**
- **Healers:** Leader skill reduces healing by 30%
- **Debuff cleansers:** Can accidentally remove leader skill buff from allies
- **Slow, sustained teams:** She wants fast kills, not attrition

## New Systems Required

### 1. Ally HP Cost Mechanic
Skills that deal flat % max HP damage to allies as part of their effect. Must:
- Apply before the buff/effect
- Trigger damage numbers/animations
- Feed into Finale tracking
- Not trigger "on damage taken" effects from enemies (it's self-inflicted)

### 2. Finale HP Tracking
Track cumulative HP lost by all allies during battle:
- Includes: Cacophon's skill costs, enemy damage, self-damage (Berserker poison, etc.)
- Excludes: Nothing — all sources count
- Persists until Finale triggers, then resets

### 3. "Top N Turn Order" Effect
New buff type that modifies turn order calculation:
- Units with this effect are sorted to positions 1-N regardless of SPD
- If multiple units have conflicting "top N" effects, resolve by SPD among them
- Effect consumed after the modified turn

### 4. "Echoing" AoE Conversion
New buff type that modifies next skill:
- Check if skill is single-hit damaging skill
- If yes: Apply primary damage to selected target, apply 50% damage to all other enemies
- Consume buff after skill resolves

### 5. Leader Skill as Debuff
Leader skill effect should:
- Apply as a status effect with `isBuff: false` (debuff classification)
- Contain both the damage bonus and healing penalty
- Be removable by cleanse effects
- Re-apply at start of each round? (TBD — or just once at battle start)

## Implementation Notes

### Skill Data Structure
```javascript
export const cacophon = {
  id: 'cacophon',
  name: 'Cacophon, the Beautiful Disaster',
  rarity: 5,
  classId: 'bard',
  baseStats: { hp: 95, atk: 25, def: 22, spd: 16, mp: 60 },
  finale: {
    name: "Suffering's Crescendo",
    description: 'Convert accumulated ally suffering into power. +10% ATK/DEF to all allies, +1% per 150 HP lost (max +25% bonus).',
    target: 'all_allies',
    effects: [
      { type: 'suffering_crescendo', baseBuff: 10, hpPerPercent: 150, maxBonus: 25, duration: 3 }
    ]
  },
  skills: [
    // ... skill definitions
  ],
  leaderSkill: {
    name: 'Harmonic Bleeding',
    description: 'All allies deal +15% damage but receive -30% healing. (Counts as debuff — can be cleansed.)',
    effects: [
      {
        type: 'battle_start_debuff',
        target: 'all_allies',
        apply: {
          effectType: 'discordant_resonance',
          damageBonus: 15,
          healingPenalty: 30
        }
      }
    ]
  }
}
```

## Balance Rationale

| Aspect | Comparison | Verdict |
|--------|------------|---------|
| Leader skill (+15% dmg) | Aurora +15% DEF | Equivalent power, offensive vs defensive |
| Finale (max +35% ATK/DEF) | Shadow King +25% ATK (2 turns) | Stronger but requires setup and 3 turns to trigger |
| HP costs (5-6%) | Unique mechanic | Real cost that scales into late game |
| Screaming Echo (50% AoE) | No direct comparison | Strong but restricted to single-hit skills |
| Tempo Shatter (top 2) | No direct comparison | Powerful but not absolute; costs 6% |

## Open Questions

1. **Leader skill reapplication:** Does Discordant Resonance reapply each round, or just once at battle start? (Recommendation: Once at battle start — cleansing it should be a meaningful counterplay)

2. **Finale HP tracking display:** Should players see the accumulated HP lost number during battle? (Recommendation: Yes — show it on Cacophon's verse counter area)

3. **Art direction:** "Beautiful Disaster" suggests someone visually striking but unsettling. Possible directions:
   - Elegant conductor whose instruments are cracked/broken
   - Beautiful singer with visible sound waves that distort reality
   - Masked performer where the mask is cracking
