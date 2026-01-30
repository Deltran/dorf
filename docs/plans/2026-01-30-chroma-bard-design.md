# Chroma, the Curious — 4-Star Bard Design

**Date:** 2026-01-30
**Status:** Approved for implementation

## Overview

Chroma is a 4-star Bard with a unique "misdirection control" identity. A curious, playful cuttlefish who treats battle like a fascinating experiment, Chroma manipulates the battlefield through hypnotic color pulses, ink clouds, and pressure waves. Enemies miss their attacks, target the wrong allies, and generally fail to land hits. Chroma doesn't heal or shield — it simply makes attacks *not land*.

## Core Identity

- **Creature type:** Human-sized cuttlefish, hovering at eye level
- **Personality:** Curious, playful, scientific observer
- **Communication:** Color pulses, pressure waves, ink patterns (no speech)
- **Mechanical theme:** Misdirection — Blind debuffs, Evasion buffs, forced targeting
- **No healing, no shields, no DR** — Pure "attacks don't land" identity

## Stats

| Stat | Base Value | Notes |
|------|------------|-------|
| HP | 82 | Mid-range, between Harl (75) and Cacophon (95) |
| ATK | 22 | Low-moderate — support, not damage |
| DEF | 18 | Low — relies on evasion, not armor |
| SPD | 17 | Faster than Cacophon — wants to set up control first |
| MP | 60 | Standard (unused — Bards use Verse) |

**Rarity:** 4-star
**Class:** Bard
**Role:** Support (Control)

## Finale: "The Dazzling"

*Every color, every pattern, every pulse at once. The enemy team loses their senses.*

**Trigger:** Auto-triggers at start of turn when Chroma has 3/3 Verses

**Effect:**
- Apply Blind (30% miss chance) to ALL enemies for 1 turn

**Design notes:**
- Intentionally restrained — Chroma's value is in the verse cycle, not the Finale payoff
- AoE Blind at lower potency than single-target Ink Flare
- Statistically 1-2 enemies might whiff; nice bonus, not fight-ending

## Skills

### Skill 1: "Ink Flare"
**Unlock:** Level 1

*A burst of ink and light overwhelms an enemy's senses.*

| Property | Value |
|----------|-------|
| Target | Single enemy |
| Effect | Apply Blind for 1 turn |
| Blind miss chance | 50% |

**Design notes:** Chroma's signature control skill. High single-target impact, requires timing due to short duration.

---

### Skill 2: "Resonance"
**Unlock:** Level 1

*Chroma attunes to an ally's rhythm and amplifies it.*

| Property | Value |
|----------|-------|
| Target | Single ally |
| Effect | Restore 20 MP/Focus/Valor/Rage |

**Design notes:** Strong single-target resource restore. Double Harl's per-target rate (Harl does 10 AoE), but single-target only. Pairs with any resource-hungry ally.

---

### Skill 3: "Fixation Pattern"
**Unlock:** Level 3

*Chroma pulses a hypnotic pattern that forces enemies to fixate on one ally.*

| Property | Value |
|----------|-------|
| Target | Single ally |
| Effect | Apply Taunt for 1 turn |

**Design notes:** Pseudo-taunt applicator. Can make any ally the target — put it on your Knight, or on someone with Evasion and watch enemies whiff. Short duration requires tactical timing.

---

### Skill 4: "Chromatic Fade"
**Unlock:** Level 6

*Chroma's colors shift and blur until it simply... isn't there.*

| Property | Value |
|----------|-------|
| Target | Self |
| Effect | Gain 75% Evasion for 2 turns |

**Design notes:** Self-preservation. The curious observer doesn't want to become part of the experiment. High evasion, not guaranteed immunity — fits the "miss chance" theme.

---

### Skill 5: "Refraction"
**Unlock:** Level 12

*Light bends around the ally. Attacks pass through where they seem to be.*

| Property | Value |
|----------|-------|
| Target | Single ally |
| Effect | Grant 50% Evasion for 2 turns |

**Design notes:** Defensive gift to an ally. Lower than self-buff (Chroma knows its own tricks best). Pairs naturally with Fixation Pattern — make someone the target AND hard to hit.

---

## Skill Summary

| Skill | Target | Effect | Duration |
|-------|--------|--------|----------|
| Ink Flare | Enemy | 50% Blind | 1 turn |
| Resonance | Ally | +20 resource | Instant |
| Fixation Pattern | Ally | Taunt | 1 turn |
| Chromatic Fade | Self | 75% Evasion | 2 turns |
| Refraction | Ally | 50% Evasion | 2 turns |
| **The Dazzling** | All enemies | 30% Blind | 1 turn |

## New Systems Required

### 1. BLIND Status Effect

New debuff type that causes attacks to miss:

```javascript
BLIND: 'blind'

// In effectDefinitions:
[EffectType.BLIND]: {
  name: 'Blinded',
  icon: '🌫️',  // or '👁️‍🗨️' or similar
  color: '#6b7280',
  isBuff: false,  // Debuff - counts for Penny/Vicious synergy
  isBlind: true,
  stackable: false
}
```

**Mechanics:**
- When a blinded unit attacks, roll against miss chance
- If miss: Attack deals no damage, applies no effects, show "MISS" floating text
- Miss check happens before damage calculation
- Does NOT affect skills that don't target enemies (self-buffs, ally heals)

### 2. Battle.js Integration

Add miss chance check in attack resolution:

```javascript
function checkBlindMiss(attacker) {
  const blindEffect = attacker.statusEffects?.find(e => e.type === EffectType.BLIND)
  if (!blindEffect) return false

  const missChance = blindEffect.value / 100  // e.g., 50 -> 0.5
  return Math.random() < missChance
}
```

Call before damage calculation in `executeAttack` or equivalent.

## Synergies

**Strong with:**
- **Penny Whistler:** Blind is a debuff; Street Racket's +25% per debuff scales with it
- **Cacophon:** Vicious Verse (+30% vs debuffed) triggers on Blinded enemies
- **Knights (Sir Gallan):** Fixation Pattern + their natural tankiness = fortress
- **Squishy carries:** Refraction gives dodge chance to glass cannons
- **High-SPD teams:** Chroma's control is short-duration; fast teams capitalize before it expires

**Anti-synergy with:**
- **Self-taunt tanks:** Redundant Taunt application
- **Slow teams:** Short buff/debuff durations expire before allies act

## Balance Rationale

| Aspect | Comparison | Verdict |
|--------|------------|---------|
| Ink Flare (50% Blind) | No direct comparison | Strong single-target control, balanced by 1-turn duration |
| Fixation Pattern (Taunt) | Knights self-Taunt | Adds flexibility — any ally can be target |
| Resonance (20 resource) | Harl's 10 AoE | 2x per-target but single-target; fair tradeoff |
| Chromatic Fade (75% Evasion) | Standard Evasion buffs | High but self-only; Chroma needs survival |
| Refraction (50% Evasion) | Lower than self-buff | Appropriate for ally application |
| The Dazzling (30% AoE) | Intentionally weak | Finale is bonus, not main value |

## Design Philosophy

Chroma fills a unique niche: **surgical battlefield control through misdirection**.

- Every effect is about making attacks not land (Blind, Evasion, redirect)
- Short durations require reading the battle and timing skills
- No healing or shields — Chroma doesn't *fix* damage taken, it *prevents* damage
- Finale is modest because Chroma's value is the skill cycle, not the payoff
- Creature identity (cuttlefish) informs every skill name and effect

## Art Direction

**Visual concept:** A human-sized cuttlefish hovering at eye level with the party. Tentacles trail like a gown, large alien eyes track the battlefield. Chromatophores ripple across its mantle — colors pulse and shift to communicate.

**Animation notes:**
- Idle: Gentle tentacle drift, slow color ripples
- Ink Flare: Rapid color burst, ink jet toward enemy
- Fixation Pattern: Hypnotic spiral pattern across body
- Chromatic Fade: Colors wash out to near-transparency
- Refraction: Extends tentacle toward ally, color pulse transfers
- The Dazzling: Full-body kaleidoscope explosion, all colors at once

## Open Questions

1. **Miss visual feedback:** What does a "MISS" look like? Floating text? Attack animation whiffs? Both?

2. **Blind icon:** 🌫️ (fog), 👁️‍🗨️ (eye with speech), 💫 (dizzy — but that's Stun), or something else?

3. **Blind + multi-hit skills:** Does Blind roll once per skill or once per hit? (Recommendation: Once per skill — simpler, more impactful)
