# Kensin, Squire Ultimate Skill Design

## Overview

Add a level 12 ultimate skill to Kensin, Squire, the 3-star Knight. He currently has 4 skills focused on defense and ally protection.

## Character Fantasy

**Devoted protector** - A squire whose duty is to protect others, even at great personal cost. His ultimate embodies this by literally taking damage for an ally.

## Existing Skills

| Level | Skill | Effect |
|-------|-------|--------|
| 1 | Defensive Stance | +50% DEF for 2 turns. Scales with Valor |
| 1 | Shield Allies | +15% DEF to ally for 2 turns. Scales with Valor |
| 3 | Reinforce | Cleanse ATK/DEF debuffs + heal from DEF. Scales with Valor |
| 6 | Riposte Strike | Gain Riposte for 3 turns. Scales with Valor |

## New Skill

**Guardian's Sacrifice** (Level 12)
- *"A squire's duty is to protect, even at great cost."*
- Valor required: 0
- Target: One ally
- Effect: Redirect all damage from target ally to Kensin. Kensin gains DEF buff while active.

### Valor Scaling

| Valor | Duration | DEF Buff |
|-------|----------|----------|
| 0+ | 2 turns | +20% |
| 25+ | 2 turns | +25% |
| 50+ | 2 turns | +30% |
| 75+ | 3 turns | +30% |
| 100 | 3 turns | +35% |

## Implementation

Update `src/data/heroTemplates.js` - add to town_guard's skills array:

```js
{
  name: "Guardian's Sacrifice",
  description: 'Redirect all damage from one ally to Kensin. Gain DEF buff while active. Duration and DEF scale with Valor.',
  valorRequired: 0,
  targetType: 'ally',
  skillUnlockLevel: 12,
  noDamage: true,
  defensive: true,
  effects: [
    {
      type: EffectType.DEF_UP,
      target: 'self',
      duration: { base: 2, at75: 3 },
      value: { base: 20, at25: 25, at50: 30, at100: 35 }
    }
  ],
  redirect: {
    target: 'ally',
    percent: 100,
    duration: { base: 2, at75: 3 }
  }
}
```

## Implementation Considerations

1. **Damage redirect mechanic** - battle.js needs new logic to:
   - Track which unit is protecting which ally
   - Intercept damage to the protected ally
   - Apply that damage to the protector instead
   - Clear the redirect when duration expires

2. **Status effect tracking** - May need a new effect type like `GUARDING` or handle via a `guardedBy` property on the protected unit

3. **Edge cases**:
   - What if Kensin dies while protecting? Redirect should end
   - What if the protected ally dies? Redirect should end
   - What if Kensin is stunned? Redirect probably still works (passive protection)
   - Multiple redirects? Probably shouldn't stack (last one wins)
