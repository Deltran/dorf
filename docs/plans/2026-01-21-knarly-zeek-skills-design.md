# Knarly Zeek Skills Design

## Overview

Expand Knarly Zeek, the 3-star Mage (hedge wizard), from 2 skills to 5 skills. Also rename existing skills to fit his crude hedge magic style.

## Character Fantasy

**Hedge magic trickster** - A scrappy wizard who learned magic outside the academy. His spells have crude, funny names and focus on stacking jinxes and curses on enemies, then detonating them for massive damage.

## Design Pillars

- Stacking debuffs (DEF down, stun, SPD down, poison)
- Crude/funny naming
- Ultimate payoff for patient curse-stacking

## Skills

| Level | Skill | Effect | MP Cost |
|-------|-------|--------|---------|
| 1 | Crumble Curse | 100% ATK + -10% DEF for 4 turns | 14 |
| 1 | Prickly Protection | 50% Thorns for 4 turns | 16 |
| 3 | Fumblefingers | 90% ATK damage. 50% chance to stun for 1 turn. | 12 |
| 6 | The Ickies | Apply -3 SPD and Poison (20% ATK) for 3 turns | 14 |
| 12 | Knarly's Special | Deal 120% ATK + 30% per debuff on target. Removes all debuffs. | 22 |

### Skill Details

**Crumble Curse** (Level 1) - renamed from "Destructive Charm"
- *"Armor falls apart at my touch."*
- Damage + DEF debuff to soften targets

**Prickly Protection** (Level 1) - renamed from "Retaliatory Protection"
- *"Touch at your own risk."*
- Self-thorns for punishing attackers

**Fumblefingers** (Level 3)
- *"Trip on yer own feet, why don'tcha?"*
- Cheap damage with 50% stun chance for disruption

**The Ickies** (Level 6)
- *"Ooh, that's gonna spread."*
- Slows and poisons in one nasty package

**Knarly's Special** (Level 12)
- *"Save the best for last!"*
- With 4 debuffs stacked, deals 240% ATK then clears them all
- Rewards patient debuff stacking throughout the fight

## Implementation

Update `src/data/heroTemplates.js`:

```js
hedge_wizard: {
  id: 'hedge_wizard',
  name: 'Knarly Zeek',
  rarity: 3,
  classId: 'mage',
  baseStats: { hp: 70, atk: 35, def: 15, spd: 12, mp: 60 },
  skills: [
    {
      name: 'Crumble Curse',
      description: 'Deal 100% ATK damage and reduce enemy DEF by 10% for 4 turns',
      mpCost: 14,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      effects: [
        { type: EffectType.DEF_DOWN, target: 'enemy', duration: 4, value: 10 }
      ]
    },
    {
      name: 'Prickly Protection',
      description: 'Gain a barrier that deals 50% ATK damage to attackers for 4 turns',
      mpCost: 16,
      skillUnlockLevel: 1,
      targetType: 'self',
      noDamage: true,
      effects: [
        { type: EffectType.THORNS, target: 'self', duration: 4, value: 50 }
      ]
    },
    {
      name: 'Fumblefingers',
      description: '90% ATK damage. 50% chance to stun for 1 turn.',
      mpCost: 12,
      skillUnlockLevel: 3,
      targetType: 'enemy',
      damageMultiplier: 0.9,
      effects: [
        { type: EffectType.STUN, target: 'enemy', duration: 1, chance: 50 }
      ]
    },
    {
      name: 'The Ickies',
      description: 'Apply -3 SPD and Poison (20% ATK) for 3 turns',
      mpCost: 14,
      skillUnlockLevel: 6,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'enemy', duration: 3, value: 3 },
        { type: EffectType.POISON, target: 'enemy', duration: 3, atkPercent: 20 }
      ]
    },
    {
      name: "Knarly's Special",
      description: 'Deal 120% ATK + 30% per debuff on target. Removes all debuffs.',
      mpCost: 22,
      skillUnlockLevel: 12,
      targetType: 'enemy',
      damageMultiplier: 1.2,
      bonusDamagePerDebuff: 30,
      consumeDebuffs: true
    }
  ]
}
```

## Implementation Considerations

1. **Fumblefingers stun chance** - battle.js needs to handle `chance` property on effects (50% chance to apply stun)

2. **Knarly's Special** - battle.js needs:
   - `bonusDamagePerDebuff` - count debuffs on target, add to damage multiplier
   - `consumeDebuffs` - remove all debuffs from target after damage

3. **Skill renaming** - Just change the `name` property, no mechanical changes needed for Crumble Curse and Prickly Protection
