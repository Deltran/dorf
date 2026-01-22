# Sir Gallan - Fortress Stance Design

## Overview

Add Sir Gallan's 5th and final skill: **Fortress Stance**, a powerful defensive ultimate that reduces damage, reflects it back, and grants debuff immunity at high Valor.

## Hero Context

- **Name:** Sir Gallan
- **Rarity:** 4-star
- **Class:** Knight (uses Valor)
- **Role:** Tank/Protector

## Current Skills

| Skill | Unlock | Valor | Effect |
|-------|--------|-------|--------|
| Challenge | 1 | 0 | Taunt 2 turns, +10% DEF at 100 Valor |
| Shield Bash | 1 | 25 | 80% ATK dmg + ATK debuff (scales) |
| Valorous Strike | 3 | 50 | 110-140% damage (scales with Valor) |
| Defensive Footwork | 6 | 25 | 100% DEF dmg, pre-buff if attacked |

## New Skill: Fortress Stance

- **Unlock:** Level 12
- **Valor Required:** 50
- **Target:** Self
- **Duration:** 2 turns

**Effects:**
- Reduce all incoming damage by 50%
- Reflect 30% of damage taken back to attackers
- At 100 Valor: also immune to debuffs

**Skill Definition:**
```js
{
  name: 'Fortress Stance',
  description: 'Reduce damage taken by 50% and reflect 30% back to attackers for 2 turns. At 100 Valor: also immune to debuffs.',
  skillUnlockLevel: 12,
  valorRequired: 50,
  targetType: 'self',
  noDamage: true,
  defensive: true,
  effects: [
    { type: EffectType.DAMAGE_REDUCTION, target: 'self', duration: 2, value: 50 },
    { type: EffectType.REFLECT, target: 'self', duration: 2, value: 30 },
    { type: EffectType.DEBUFF_IMMUNE, target: 'self', duration: 2, valorThreshold: 100 }
  ]
}
```

## New Effect Types

### DAMAGE_REDUCTION
- Reduces incoming damage by `value` percent
- Applied during damage calculation, before damage is dealt
- Stacks additively with other damage reduction sources (if any)
- Visual: Shield icon or damage number shows reduced amount

### REFLECT
- After taking damage, deal `value`% of the damage taken back to the attacker
- Triggers after damage reduction is applied
- Does not trigger on DoT (poison/burn)
- Visual: Counter-attack animation or damage number on attacker

### DEBUFF_IMMUNE
- Prevents new debuffs from being applied
- Does not remove existing debuffs
- Visual: "Immune" text when debuff is blocked

## Implementation Notes

1. Add three new effect types to `statusEffects.js`
2. Modify damage calculation in `battle.js` to check for DAMAGE_REDUCTION
3. Add reflect logic after damage is dealt in `battle.js`
4. Add debuff immunity check before applying debuffs in `battle.js`
5. Add Fortress Stance to Sir Gallan's skills in `heroTemplates.js`
