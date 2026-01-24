# Penny Whistler - Hero Design

## Overview

A 1-star Bard support hero focused on debuffing enemies. Complements Harl the Handsom (buff-focused bard) by weakening foes rather than strengthening allies.

## Character Concept

**Name:** Penny Whistler
**Rarity:** 1-star (Common)
**Class:** Bard
**Role:** Support
**Resource:** Inspiration

**Fantasy:** A scrappy street performer who learned that the best way to survive isn't making friends stronger - it's making enemies weaker. She plays a battered tin whistle for coins, and her off-key tunes are surprisingly effective at throwing enemies off their game.

**Visual concept:** Ragged but cheerful, patched clothing, a dented tin whistle, maybe a cap for collecting coins. Optimistic despite her circumstances.

## Base Stats

| HP | ATK | DEF | SPD | MP |
|----|-----|-----|-----|-----|
| 65 | 15 | 18 | 14 | 55 |

**Stat rationale:**
- Low HP/ATK (fragile, not a fighter)
- Moderate DEF (street-smart survival)
- SPD 14 ties with Salia as fastest 1-star; merging pushes her past Harl's 15
- MP 55 supports her debuff-focused kit

## Skills

### Skill 1: Jarring Whistle (Unlocked at level 1)
- **Description:** A piercing off-key note that makes enemies flinch
- **Target:** Single enemy
- **MP Cost:** 8
- **Effect:** Apply -15% DEF for 2 turns

### Skill 2: Distracting Jingle (Unlocked at level 3)
- **Description:** An annoying tune that throws off enemy timing
- **Target:** Single enemy
- **MP Cost:** 10
- **Effect:** Apply -15% SPD for 2 turns

### Skill 3: Street Racket (Unlocked at level 6)
- **Description:** A cacophony of noise that disrupts all foes
- **Target:** All enemies
- **MP Cost:** 18
- **Effect:** Apply -10% ATK and -10% DEF to all enemies for 2 turns

### Skill 4: Ear-Splitting Finale (Unlocked at level 12)
- **Description:** A piercing note that's unbearable to those already off-balance
- **Target:** Single enemy
- **MP Cost:** 20
- **Effect:** Apply -20% SPD for 2 turns. If the target has any debuff, stun them for 1 turn instead.

## Gameplay Loop

1. Open with Jarring Whistle (DEF down) or Distracting Jingle (SPD down)
2. Follow up with Ear-Splitting Finale for a guaranteed stun
3. Use Street Racket for AoE debuff pressure in multi-enemy fights

## Design Differentiation

- **vs Harl (3-star Bard):** Harl buffs allies (ATK up, MP restore, heals). Penny debuffs enemies. They complement each other.
- **vs Vagrant Bil (1-star Cleric):** Bil has ATK/DEF down but also heals. Penny has SPD down and conditional stun - pure disruption.

## Implementation Notes

- Hero template ID: `street_busker`
- Skill 4 requires checking if target has any active debuffs before applying effect
- No new status effect types needed (uses existing DEF_DOWN, SPD_DOWN, ATK_DOWN, STUN)
