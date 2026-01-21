# Vagrant Bil Skills Design

## Overview

Add skills to Vagrant Bil, the 1-star Cleric (beggar monk), who currently has only one skill. The design gives him a street-wise monk identity that combines weak healing with low-cost curses.

## Character Fantasy

**Street-wise monk** - A beggar who's learned that desperate prayers sometimes come out as curses. Self-deprecating and humble, his muttered words somehow find their mark. Not powerful, but reliable and cheap to use.

## Design Pillars

- Low MP costs (8-16 per skill)
- Weak but consistent debuffs (-10%)
- Modest durations (2-3 turns)
- Self-deprecating flavor in skill names

## Skills

| Level | Skill | Effect | MP Cost |
|-------|-------|--------|---------|
| 1 | Minor Heal | Heal one ally for 80% ATK | 10 |
| 3 | Worthless Words | Apply -10% ATK to one enemy for 2 turns | 8 |
| 6 | Nobody's Curse | Apply -10% DEF to one enemy for 3 turns | 8 |
| 12 | Beggar's Prayer | Heal all allies for 50% ATK. Apply -10% ATK to all enemies for 2 turns. | 16 |

### Skill Details

**Worthless Words** (Level 3)
- *"Bil mutters something under his breath. It shouldn't hurt, but it does."*
- A cheap, spammable ATK debuff to reduce incoming damage
- `targetType: 'enemy'`, `noDamage: true`

**Nobody's Curse** (Level 6)
- *"A curse from someone so lowly, enemies don't notice until it's too late."*
- Slightly longer duration (3 turns) since DEF down is more offensive
- `targetType: 'enemy'`, `noDamage: true`

**Beggar's Prayer** (Level 12)
- *"A desperate prayer that asks for nothing and somehow gets everything."*
- Capstone skill combining both healing and cursing themes
- AoE heal to allies + AoE ATK debuff to enemies
- `targetType: 'all_allies'` with effects targeting `'all_enemies'`

## Implementation

Update `src/data/heroTemplates.js`:

```js
beggar_monk: {
  id: 'beggar_monk',
  name: 'Vagrant Bil',
  rarity: 1,
  classId: 'cleric',
  baseStats: { hp: 60, atk: 12, def: 15, spd: 9, mp: 45 },
  skills: [
    {
      name: 'Minor Heal',
      description: 'Heal one ally for 80% ATK',
      mpCost: 10,
      skillUnlockLevel: 1,
      targetType: 'ally'
    },
    {
      name: 'Worthless Words',
      description: 'Apply -10% ATK to one enemy for 2 turns',
      mpCost: 8,
      skillUnlockLevel: 3,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'enemy', duration: 2, value: 10 }
      ]
    },
    {
      name: "Nobody's Curse",
      description: 'Apply -10% DEF to one enemy for 3 turns',
      mpCost: 8,
      skillUnlockLevel: 6,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'enemy', duration: 3, value: 10 }
      ]
    },
    {
      name: "Beggar's Prayer",
      description: 'Heal all allies for 50% ATK. Apply -10% ATK to all enemies for 2 turns.',
      mpCost: 16,
      skillUnlockLevel: 12,
      targetType: 'all_allies',
      effects: [
        { type: EffectType.ATK_DOWN, target: 'all_enemies', duration: 2, value: 10 }
      ]
    }
  ]
}
```

## Notes

- Change from singular `skill` property to `skills` array
- All existing skill patterns (effects, targetType, noDamage) are already supported by the battle system
- Beggar's Prayer may need battle.js verification to ensure heal + enemy debuff combo works correctly with `all_allies` target type
