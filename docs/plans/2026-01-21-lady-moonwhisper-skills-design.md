# Lady Moonwhisper Skills Design

## Overview

Expand Lady Moonwhisper's skill kit from 3 to 5 skills, adding level 6 and level 12 abilities that reinforce her identity as a protective single-target healer.

## Hero Context

- **Rarity:** 4-star (Epic)
- **Class:** Cleric
- **Role:** Protective single-target healer
- **Base Stats:** HP 95, ATK 25, DEF 30, SPD 11, MP 80

## Complete Skill Kit

### Existing Skills (unchanged)

| Level | Skill | MP | Target | Effect |
|-------|-------|-----|--------|--------|
| 1 | Lunar Blessing | 22 | ally | Heal 150% ATK, +20% DEF for 2 turns |
| 1 | Moonveil | 20 | ally | Untargetable for 2 turns |
| 3 | Purifying Light | 18 | ally | Remove all stat debuffs |

### New Skills

| Level | Skill | MP | Target | Effect |
|-------|-------|-----|--------|--------|
| 6 | Silver Mist | 18 | ally | 40% evasion for 3 turns. Missed attacks restore 5 MP to Lady Moonwhisper |
| 12 | Full Moon's Embrace | 35 | dead ally | Revive at 40% HP with untargetable for 1 turn |

## Skill Details

### Silver Mist (Level 6)

**Description:** Shroud an ally in silver mist, granting 40% evasion for 3 turns. When enemies miss, Lady Moonwhisper restores 5 MP.

**Implementation Notes:**
- New effect type: `EVASION` - percentage chance to completely avoid an attack
- On miss, trigger MP restore to the caster (Lady Moonwhisper)
- Evasion check happens before damage calculation
- Visual: miss should show "Miss!" floating text

**Data Structure:**
```js
{
  name: 'Silver Mist',
  description: 'Grant ally 40% evasion for 3 turns. Missed attacks restore 5 MP to Lady Moonwhisper.',
  mpCost: 18,
  skillUnlockLevel: 6,
  targetType: 'ally',
  noDamage: true,
  effects: [
    { type: EffectType.EVASION, target: 'ally', duration: 3, value: 40, onEvade: { restoreMp: 5, to: 'caster' } }
  ]
}
```

### Full Moon's Embrace (Level 12)

**Description:** Call upon the full moon to revive a fallen ally at 40% HP, granting them untargetable for 1 turn.

**Implementation Notes:**
- New targeting type: `dead_ally` - can only target fallen party members
- If no dead allies, skill should be disabled/grayed out
- Revive sets HP to 40% of max HP
- Immediately applies untargetable buff after revive
- Visual: strong lunar glow effect on revived ally

**Data Structure:**
```js
{
  name: "Full Moon's Embrace",
  description: 'Revive a fallen ally at 40% HP with untargetable for 1 turn.',
  mpCost: 35,
  skillUnlockLevel: 12,
  targetType: 'dead_ally',
  noDamage: true,
  revive: { hpPercent: 40 },
  effects: [
    { type: EffectType.UNTARGETABLE, target: 'ally', duration: 1 }
  ]
}
```

## New Systems Required

### Evasion System

1. Add `EffectType.EVASION` to statusEffects.js
2. In battle.js damage calculation, check for evasion before applying damage
3. Roll against evasion percentage; if evaded, skip damage and show "Miss!"
4. Trigger any `onEvade` effects (like MP restore)

### Revive System

1. Add `dead_ally` target type handling
2. Track dead party members separately (they should remain in party but marked as dead)
3. Revive action: restore HP to percentage, mark as alive, apply post-revive effects
4. UI: show dead allies as selectable targets when using revive skills

## Design Rationale

- **Silver Mist** adds a unique evasion mechanic not present elsewhere in the roster, differentiating her from other healers while providing meaningful protection
- **Full Moon's Embrace** gives her a powerful ultimate befitting a 4-star hero, providing clutch saves in difficult battles
- Both skills reinforce her lunar theme and single-target protective identity
- MP costs balanced against her high MP pool (80 base)
