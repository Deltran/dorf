# Bertan the Gatherer Skills Design

## Overview

Add skills to Bertan the Gatherer, the 2-star Druid (herb gatherer), who currently has only one skill. The design gives him a nature's apothecary identity with healing, cleansing, and sustenance.

## Character Fantasy

**Nature's apothecary** - A humble herb gatherer who heals over time, cures ailments with herbal antidotes, and provides sustenance. Simple, practical, reliable.

## Design Pillars

- Practical naming (skills named for what they do)
- DoT cleansing (antidotes for poison/burn/bleed)
- Heal-over-time (slow but steady recovery)
- Resource sustenance (health + mana)

## Skills

| Level | Skill | Effect | MP Cost |
|-------|-------|--------|---------|
| 1 | Herbal Remedy | Heal one ally for 120% ATK | 12 |
| 3 | Antidote | Remove poison, burn, and bleed from one ally | 10 |
| 6 | Herbal Tonic | Apply regeneration to one ally (45% ATK heal per turn for 3 turns) | 14 |
| 12 | Nature's Bounty | Heal one ally for 150% ATK and restore 15 MP. Rangers regain Focus. | 18 |

### Skill Details

**Antidote** (Level 3)
- *Bertan produces a small vial from his pouch.*
- Removes damage-over-time effects only (poison, burn, bleed)
- `targetType: 'ally'`, `noDamage: true`, `cleanse: 'dots'`

**Herbal Tonic** (Level 6)
- *A slow-brewed remedy that works over time.*
- Total healing potential of 135% ATK across 3 turns
- `targetType: 'ally'`, `noDamage: true`
- Uses `EffectType.REGEN` with `atkPercent: 45`

**Nature's Bounty** (Level 12)
- *The forest provides for those who know where to look.*
- Strong heal plus MP recovery, and grants Focus to rangers
- `targetType: 'ally'`, `mpRestore: 15`, `grantsFocus: true`

## Implementation

Update `src/data/heroTemplates.js`:

```js
herb_gatherer: {
  id: 'herb_gatherer',
  name: 'Bertan the Gatherer',
  rarity: 2,
  classId: 'druid',
  baseStats: { hp: 65, atk: 15, def: 18, spd: 10, mp: 55 },
  skills: [
    {
      name: 'Herbal Remedy',
      description: 'Heal one ally for 120% ATK',
      mpCost: 12,
      skillUnlockLevel: 1,
      targetType: 'ally'
    },
    {
      name: 'Antidote',
      description: 'Remove poison, burn, and bleed from one ally',
      mpCost: 10,
      skillUnlockLevel: 3,
      targetType: 'ally',
      noDamage: true,
      cleanse: 'dots'
    },
    {
      name: 'Herbal Tonic',
      description: 'Apply regeneration to one ally (45% ATK heal per turn for 3 turns)',
      mpCost: 14,
      skillUnlockLevel: 6,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.REGEN, target: 'ally', duration: 3, atkPercent: 45 }
      ]
    },
    {
      name: "Nature's Bounty",
      description: 'Heal one ally for 150% ATK and restore 15 MP. Rangers regain Focus.',
      mpCost: 18,
      skillUnlockLevel: 12,
      targetType: 'ally',
      mpRestore: 15,
      grantsFocus: true
    }
  ]
}
```

## Implementation Considerations

1. **Antidote** uses `cleanse: 'dots'` - battle.js needs support to cleanse only DoT effects (poison, burn, bleed) as opposed to all debuffs

2. **Herbal Tonic** uses `EffectType.REGEN` - verify this effect type exists in statusEffects.js, or add it if missing

3. **Nature's Bounty** uses `grantsFocus: true` - battle.js should check if target `isRanger()` and call `grantFocus(target)` when processing ally-targeted skills with this flag
