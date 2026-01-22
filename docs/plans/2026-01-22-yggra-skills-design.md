# Yggra, the World Root - Skills Design

## Overview

Expand Yggra's skill kit from a single AoE heal to a full 5-star druid kit. She remains a healer first, but gains offensive tools (poison, thorns) that reflect the ancient forest's wrath against those who threaten it.

## Character Fantasy

**Nature's Wrath Healer** - An ancient tree spirit who nurtures life but defends the forest fiercely. Healing is her primary role, but she punishes attackers with thorns and poisons those who threaten her allies.

## Design Pillars

- Healing primary, offense secondary
- Thorns for defensive punishment (attackers hurt themselves)
- Poison for offensive pressure (damage over time)
- Ultimate protects against death itself

## Skills

| Level | Skill | MP | Target | Effect |
|-------|-------|----|--------|--------|
| 1 | Blessing of the World Root | 19 | All allies | Heal all allies for 75% ATK |
| 1 | Grasping Roots | 15 | One enemy | Poison one enemy (50% ATK per turn for 2 turns) |
| 3 | Bark Shield | 18 | One ally | Heal one ally for 50% ATK and grant 50% thorns for 3 turns |
| 6 | Nature's Reclamation | 28 | One enemy | Deal 200% ATK damage to one enemy; heal all allies for 35% of damage dealt |
| 12 | World Root's Embrace | 35 | All allies | Grant all allies death prevention for 2 turns; when triggered, heal saved ally for 50% ATK |

### Skill Details

**Blessing of the World Root** (Level 1)
- *The World Root's life force flows through all.*
- Reduced from 100% to 75% ATK to balance with expanded kit
- `targetType: 'all_allies'`

**Grasping Roots** (Level 1)
- *Ancient corruption seeps through roots that bind the unwary.*
- Heavy poison: 50% ATK per turn for 2 turns (100% total)
- `targetType: 'enemy'`, `noDamage: true`
- Uses `EffectType.POISON` with `atkPercent: 50`, `duration: 2`

**Bark Shield** (Level 3)
- *The forest wraps its children in protective bark.*
- Minor heal (50% ATK) plus thorns (50% for 3 turns)
- `targetType: 'ally'`
- Uses `EffectType.THORNS` with `value: 50`, `duration: 3`

**Nature's Reclamation** (Level 6)
- *Life flows from death. The forest reclaims what was taken.*
- Heavy single-target damage (200% ATK)
- Heals all allies for 35% of damage dealt
- `targetType: 'enemy'`, `healAlliesPercent: 35`

**World Root's Embrace** (Level 12)
- *The ancient roots will not let you fall.*
- Grants death prevention buff to all allies for 2 turns
- Each ally can only be saved once per application
- When triggered, saved ally is healed for 50% ATK
- `targetType: 'all_allies'`, `noDamage: true`
- New effect type: `EffectType.DEATH_PREVENTION`

## Implementation Notes

### Existing Support
- `EffectType.POISON` - Already exists
- `EffectType.THORNS` - Already exists (used by Shadow King)

### New Mechanics Required

**Nature's Reclamation** (`healAlliesPercent`)
- After dealing damage, calculate heal amount as percentage of damage dealt
- Apply heal to all allies
- Battle.js needs to handle `healAlliesPercent` on damage skills

**World Root's Embrace** (`EffectType.DEATH_PREVENTION`)
- New status effect that intercepts lethal damage
- When an ally would die, if they have this buff:
  1. Prevent death, set HP to 1
  2. Heal for 50% of caster's ATK
  3. Remove the buff from that ally
- Visual: Golden glow or root shield effect

## Data Structure

```js
yggra_world_root: {
  id: 'yggra_world_root',
  name: 'Yggra, the World Root',
  rarity: 5,
  classId: 'druid',
  baseStats: { hp: 120, atk: 40, def: 35, spd: 10, mp: 75 },
  skills: [
    {
      name: 'Blessing of the World Root',
      description: 'Channel the life force of the world tree to restore all allies for 75% ATK',
      mpCost: 19,
      skillUnlockLevel: 1,
      targetType: 'all_allies'
    },
    {
      name: 'Grasping Roots',
      description: 'Poison one enemy (50% ATK per turn for 2 turns)',
      mpCost: 15,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.POISON, target: 'enemy', duration: 2, atkPercent: 50 }
      ]
    },
    {
      name: 'Bark Shield',
      description: 'Heal one ally for 50% ATK and grant 50% thorns for 3 turns',
      mpCost: 18,
      skillUnlockLevel: 3,
      targetType: 'ally',
      healPercent: 50,
      effects: [
        { type: EffectType.THORNS, target: 'ally', duration: 3, value: 50 }
      ]
    },
    {
      name: "Nature's Reclamation",
      description: 'Deal 200% ATK damage to one enemy; heal all allies for 35% of damage dealt',
      mpCost: 28,
      skillUnlockLevel: 6,
      targetType: 'enemy',
      damagePercent: 200,
      healAlliesPercent: 35
    },
    {
      name: "World Root's Embrace",
      description: 'Grant all allies death prevention for 2 turns; when triggered, heal saved ally for 50% ATK',
      mpCost: 35,
      skillUnlockLevel: 12,
      targetType: 'all_allies',
      noDamage: true,
      effects: [
        { type: EffectType.DEATH_PREVENTION, target: 'all_allies', duration: 2, healOnTrigger: 50 }
      ]
    }
  ],
  leaderSkill: {
    name: 'Ancient Awakening',
    description: "On round 1, all allies are healed for 10% of Yggra's ATK",
    effects: [
      {
        type: 'timed',
        triggerRound: 1,
        target: 'all_allies',
        apply: {
          effectType: 'heal',
          value: 10
        }
      }
    ]
  }
}
```

## Files to Change

- `src/data/heroTemplates.js` - Update Yggra from single `skill` to `skills` array
- `src/data/statusEffects.js` - Add `DEATH_PREVENTION` effect type
- `src/stores/battle.js` - Handle `healAlliesPercent` and death prevention mechanics
