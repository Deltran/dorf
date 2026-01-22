# Grandma Helga Skills Design

## Overview

Expand Grandma Helga, the 3-star Cleric (village healer), from 2 skills to 5 skills.

## Character Fantasy

**Nurturing grandmother** - A warm, caring healer who keeps everyone alive through comfort and love. Chicken soup, warm blankets, and "there, there dear."

## Design Pillars

- Pure healer focused on keeping allies alive
- Cozy, comforting skill names
- Mix of single-target, HoT, and AoE healing
- Ultimate provides a safety net mechanic

## Skills

| Level | Skill | Effect | MP Cost |
|-------|-------|--------|---------|
| 1 | Healing Touch | Heal one ally for 120% ATK | 15 |
| 1 | Cup of Tea | Grant regen (25% ATK per turn) for 3 turns | 12 |
| 3 | Mana Spring | Grant MP regen (5 MP per turn) for 3 turns | 10 |
| 6 | There There, Dear | Heal ally for 90% ATK + grant 15% ATK buff for 2 turns | 18 |
| 12 | Second Helping | Heal all allies for 80% ATK. Grant "Well Fed" for 3 turns - if HP drops below 30%, auto-heal for 100% ATK once. | 28 |

### Skill Details

**Healing Touch** (Level 1) - existing skill
- Basic single-target heal

**Cup of Tea** (Level 1) - new
- *"Sit down and have a nice cup, dear."*
- HoT for sustained recovery

**Mana Spring** (Level 3) - existing skill
- MP sustain for the team

**There There, Dear** (Level 6) - new
- *"There there, dear. You'll be just fine."*
- Heal + ATK buff combo for encouragement

**Second Helping** (Level 12) - new
- *"You're looking thin! Have another plate."*
- AoE heal with safety net buff
- "Well Fed" triggers once when ally drops below 30% HP

## Implementation

### heroTemplates.js Changes

```js
village_healer: {
  id: 'village_healer',
  name: 'Grandma Helga',
  rarity: 3,
  classId: 'cleric',
  baseStats: { hp: 80, atk: 18, def: 25, spd: 9, mp: 65 },
  skills: [
    {
      name: 'Healing Touch',
      description: 'Heal one ally for 120% ATK',
      mpCost: 15,
      skillUnlockLevel: 1,
      targetType: 'ally'
    },
    {
      name: 'Cup of Tea',
      description: 'Grant an ally regeneration (25% ATK per turn for 3 turns)',
      mpCost: 12,
      skillUnlockLevel: 1,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.REGEN, target: 'ally', duration: 3, atkPercent: 25 }
      ]
    },
    {
      name: 'Mana Spring',
      description: 'Grant an ally MP regeneration (5 MP per turn for 3 turns)',
      mpCost: 10,
      skillUnlockLevel: 3,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.MP_REGEN, target: 'ally', duration: 3, value: 5 }
      ]
    },
    {
      name: 'There There, Dear',
      description: 'Heal ally for 90% ATK and grant +15% ATK for 2 turns',
      mpCost: 18,
      skillUnlockLevel: 6,
      targetType: 'ally',
      effects: [
        { type: EffectType.ATK_UP, target: 'ally', duration: 2, value: 15 }
      ]
    },
    {
      name: 'Second Helping',
      description: 'Heal all allies for 80% ATK. Grant "Well Fed" for 3 turns - auto-heals for 100% ATK if HP drops below 30%.',
      mpCost: 28,
      skillUnlockLevel: 12,
      targetType: 'all_allies',
      effects: [
        { type: EffectType.WELL_FED, target: 'all_allies', duration: 3, atkPercent: 100, threshold: 30 }
      ]
    }
  ]
}
```

### statusEffects.js Changes

Add new WELL_FED effect type:

```js
WELL_FED: {
  name: 'Well Fed',
  description: 'Auto-heals when HP drops below threshold',
  isBuff: true,
  isTriggered: true  // Triggers on HP threshold
}
```

### battle.js Changes

In `applyDamage()`, after reducing HP, check for WELL_FED effect:

```js
// Check for Well Fed trigger (auto-heal below threshold)
if (unit.currentHp > 0 && unit.currentHp < unit.maxHp * 0.3) {
  const wellFedEffect = unit.statusEffects?.find(e => e.type === EffectType.WELL_FED)
  if (wellFedEffect && !wellFedEffect.triggered) {
    // Calculate heal based on stored ATK percent and caster's ATK
    const healAmount = Math.floor(wellFedEffect.casterAtk * wellFedEffect.atkPercent / 100)
    unit.currentHp = Math.min(unit.maxHp, unit.currentHp + healAmount)
    wellFedEffect.triggered = true
    addLog(`${unitName} is Well Fed! Auto-healed for ${healAmount} HP!`)
    emitCombatEffect(targetId, targetType, 'heal', healAmount)
  }
}
```

When applying WELL_FED effect, store caster's ATK for later heal calculation.
