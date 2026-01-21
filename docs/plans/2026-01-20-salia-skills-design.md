# Salia Skills Design

Update Salia (street_urchin) with 4 skills that unlock at different levels, introducing two new battle mechanics: extra turns and HP-conditional buffs.

## Skills

| Level | Skill | Effect |
|-------|-------|--------|
| 1 | Quick Throw | Deal 80% damage to one enemy. Get an extra turn. |
| 3 | Desperation | Deal 150% damage to one enemy. Receive -15% DEF debuff. |
| 6 | But Not Out | Gain 20% ATK buff for 2 turns. If below 50% HP, gain 30% ATK buff for 3 turns instead. |
| 12 | In The Crowd | Deal 120% damage to target enemy. Become untargetable until end of next round. |

## Skill Data Structure

```js
street_urchin: {
  id: 'street_urchin',
  name: 'Salia',
  rarity: 1,
  classId: 'ranger',
  baseStats: { hp: 50, atk: 18, def: 8, spd: 14, mp: 30 },
  skills: [
    {
      name: 'Quick Throw',
      description: 'Deal 80% ATK damage to one enemy. Get an extra turn.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      grantsExtraTurn: true
    },
    {
      name: 'Desperation',
      description: 'Deal 150% ATK damage to one enemy. Receive a -15% DEF debuff.',
      skillUnlockLevel: 3,
      targetType: 'enemy',
      effects: [
        { type: EffectType.DEF_DOWN, target: 'self', duration: 2, value: 15 }
      ]
    },
    {
      name: 'But Not Out',
      description: 'Gain a 20% ATK buff for 2 turns. If below 50% health, instead gain a 30% ATK buff for 3 turns.',
      skillUnlockLevel: 6,
      targetType: 'self',
      noDamage: true,
      conditionalSelfBuff: {
        default: { type: EffectType.ATK_UP, duration: 2, value: 20 },
        conditional: {
          condition: { stat: 'hpPercent', below: 50 },
          effect: { type: EffectType.ATK_UP, duration: 3, value: 30 }
        }
      }
    },
    {
      name: 'In The Crowd',
      description: 'Deal 120% ATK damage to target enemy. Become untargetable until the end of next round.',
      skillUnlockLevel: 12,
      targetType: 'enemy',
      effects: [
        { type: EffectType.UNTARGETABLE, target: 'self', duration: 2, value: 0 }
      ]
    }
  ]
}
```

## New Battle Mechanics

### Extra Turn (`grantsExtraTurn`)

After skill execution, check if skill grants extra turn. If so, skip `advanceTurnIndex()` and reset to player turn state:

```js
if (skill?.grantsExtraTurn && hero.currentHp > 0) {
  addLog(`${hero.template.name} gets an extra turn!`)
  setTimeout(() => {
    selectedAction.value = null
    selectedTarget.value = null
    state.value = BattleState.PLAYER_TURN
  }, 600)
} else {
  setTimeout(() => {
    advanceTurnIndex()
    startNextTurn()
  }, 600)
}
```

### Conditional Self Buff (`conditionalSelfBuff`)

Evaluator function (supports `hpPercent` with `below`):

```js
function evaluateCondition(condition, hero) {
  if (condition.stat === 'hpPercent') {
    const value = (hero.currentHp / hero.maxHp) * 100
    if (condition.below) return value < condition.below
  }
  return false
}
```

Processing in `case 'self':`:

```js
if (skill.conditionalSelfBuff) {
  const { default: defaultBuff, conditional } = skill.conditionalSelfBuff
  const buff = evaluateCondition(conditional.condition, hero)
    ? conditional.effect
    : defaultBuff

  applyEffect(hero, buff.type, {
    duration: buff.duration,
    value: buff.value,
    sourceId: hero.instanceId
  })
}
```

## Files to Modify

1. `src/data/heroTemplates.js` - Update Salia to skills array
2. `src/stores/battle.js` - Add evaluateCondition(), conditionalSelfBuff processing, grantsExtraTurn check

## Notes

- UNTARGETABLE and DEF_DOWN effects already exist in statusEffects.js
- Rangers lose Focus on skill use; extra turn doesn't restore it
- Extra turn only granted if hero survives the action
