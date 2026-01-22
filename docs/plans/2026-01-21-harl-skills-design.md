# Harl the Handsom Skills Design

## Overview

Complete Harl's skill kit from 2 skills to 5 skills, establishing him as a **Versatile Entertainer** - a well-rounded support bard with buffs, light healing, and a powerful single-target enabler ultimate.

## Hero Context

- **Name:** Harl the Handsom
- **ID:** `wandering_bard`
- **Rarity:** 3-star
- **Class:** Bard (Support)
- **Resource:** Inspiration
- **Base Stats:** HP 75, ATK 20, DEF 20, SPD 15, MP 70

## Skill Kit

### Skill 1: Inspiring Song (Existing)
- **Unlock:** Level 1
- **MP Cost:** 18
- **Target:** All Allies
- **Effect:** Increase all allies ATK by 15% for 2 turns

### Skill 2: Mana Melody (Existing)
- **Unlock:** Level 3
- **MP Cost:** 20
- **Target:** All Allies
- **Effect:** Restore 10 MP to all allies

### Skill 3: Soothing Serenade (New)
- **Unlock:** Level 6
- **MP Cost:** 22
- **Target:** All Allies
- **Effect:** Heal all allies for 15% of Harl's ATK
- **Design Notes:** Secondary healing capability. At 15% per target (60% total across 4 heroes), this is weaker than dedicated healers like Grandma Helga (120% single target) but provides party-wide sustain. Harl is a buffer first, healer second.

### Skill 4: Ballad of Blackwall (New)
- **Unlock:** Level 9
- **MP Cost:** 20
- **Target:** All Allies
- **Effect:** Grant all allies DEF +20% for 2 turns
- **Design Notes:** Pairs with Inspiring Song to give Harl both offensive and defensive party buffs. Makes him a "prep turn" specialist who sets up the team.

### Skill 5: Encore (New)
- **Unlock:** Level 12
- **MP Cost:** 30
- **Target:** Single Ally
- **Effect:**
  - Extend all buff durations on target by 2 turns
  - Restore 15 MP
  - Grant +10 Rage
  - Grant +10 Valor
  - Grant +15% SPD for 1 turn
- **Design Notes:** A "supercharge" button that works with any ally class. Target a Berserker for Rage + extended buffs. Target a Knight for Valor + extended buffs. Target a Ranger and SPD synergizes with their kit. Universal enabler that rewards team composition thinking.

## Design Philosophy

Harl fills the "jack of all trades" support role:
- **Buffs:** ATK (Inspiring Song) and DEF (Ballad of Blackwall) for the whole party
- **Sustain:** MP restore (Mana Melody) and light healing (Soothing Serenade)
- **Enabler:** Single-target supercharge (Encore) that makes any carry stronger

He's not the best at any one thing but brings versatility. Compared to:
- **Grandma Helga (Cleric):** Better raw healing, but Harl has better buffs
- **Other supports:** Harl's Encore gives unique cross-class synergy

## Implementation Notes

New effect types that may need implementation:
- `healPercent` - Heal based on caster's ATK percentage (may already exist)
- `extendBuffs` - Extend duration of existing buffs on target
- `grantRage` - Add flat Rage to target (for Berserkers)
- `grantValor` - Add flat Valor to target (for Knights)

Check existing effect types before implementing new ones.
