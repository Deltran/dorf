# Shasha Ember Witch Skills Design

Update Shasha Ember Witch with 3 additional skills (she already has Fireball and Ignite), completing her burn specialist kit with defensive burns, burn spreading, and burn detonation.

## Fantasy & Playstyle

**Fantasy:** Pyromaniac who sets the battlefield ablaze, spreading fire between enemies, then detonates all burns for massive burst damage.

**Playstyle:** DoT-focused mage with a satisfying burst window. Apply burns with Ignite, spread with Spreading Flames, then detonate everything with Conflagration. Flame Shield provides survivability.

**Core Combo:** Ignite → Spreading Flames → Conflagration

## Skills

| Level | Skill | Effect |
|-------|-------|--------|
| 1 | Fireball | Deal 130% ATK damage to one enemy, 50% ATK to adjacent enemies (existing) |
| 1 | Flame Shield | Gain protective flames for 3 turns. Enemies who attack Shasha are burned for 2 turns. |
| 3 | Ignite | Apply 3-turn burn to one enemy (existing) |
| 6 | Spreading Flames | Deal 80% ATK damage to one enemy. If burning, spread their burn to all other enemies. |
| 12 | Conflagration | Consume all burns on all enemies. Deal instant damage equal to remaining burn damage +10% ATK per burn consumed. |

## Skill Data Structure

```js
ember_witch: {
  id: 'ember_witch',
  name: 'Shasha Ember Witch',
  rarity: 4,
  classId: 'mage',
  baseStats: { hp: 85, atk: 45, def: 20, spd: 14, mp: 70 },
  skills: [
    {
      name: 'Fireball',
      description: 'Deal 130% ATK damage to one enemy and 50% ATK damage to adjacent enemies.',
      mpCost: 20,
      skillUnlockLevel: 1,
      targetType: 'enemy'
    },
    {
      name: 'Flame Shield',
      description: 'Surround yourself with protective flames for 3 turns. Enemies who attack you are burned for 2 turns.',
      mpCost: 18,
      skillUnlockLevel: 1,
      targetType: 'self',
      noDamage: true,
      effects: [
        { type: EffectType.FLAME_SHIELD, target: 'self', duration: 3, burnDuration: 2 }
      ]
    },
    {
      name: 'Ignite',
      description: 'Set an enemy ablaze for 3 turns (burns for ATK×0.5 per turn).',
      mpCost: 15,
      skillUnlockLevel: 3,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.BURN, target: 'enemy', duration: 3, atkPercent: 50 }
      ]
    },
    {
      name: 'Spreading Flames',
      description: 'Deal 80% ATK damage to one enemy. If the target is burning, spread their burn to all other enemies.',
      mpCost: 22,
      skillUnlockLevel: 6,
      targetType: 'enemy',
      spreadBurn: true
    },
    {
      name: 'Conflagration',
      description: 'Consume all burns on all enemies. Deal instant damage equal to the remaining burn damage plus 10% ATK per burn consumed.',
      mpCost: 30,
      skillUnlockLevel: 12,
      targetType: 'all_enemies',
      consumeBurns: true,
      consumeBurnAtkBonus: 10
    }
  ]
}
```

## New Battle Mechanics

### FLAME_SHIELD Status Effect

A buff that triggers when the unit is attacked, applying a burn to the attacker.

**In `statusEffects.js`:**
```js
FLAME_SHIELD: 'flame_shield'

[EffectType.FLAME_SHIELD]: {
  name: 'Flame Shield',
  icon: '🔥',
  color: '#f97316',
  isBuff: true,
  isFlameShield: true,
  stackable: false
}
```

**Battle integration:**
When a unit with FLAME_SHIELD is attacked, apply a burn to the attacker:

```js
// After damage is dealt to a unit
const flameShieldEffect = target.statusEffects?.find(e => e.type === EffectType.FLAME_SHIELD)
if (flameShieldEffect && attacker.currentHp > 0) {
  const burnDuration = flameShieldEffect.burnDuration || 2
  applyEffect(attacker, EffectType.BURN, {
    duration: burnDuration,
    casterAtk: target.currentAtk,
    atkPercent: 50,
    sourceId: target.instanceId
  })
  addLog(`${attacker.template.name} is burned by ${target.template.name}'s Flame Shield!`)
}
```

### Spread Burn (`spreadBurn`)

After dealing damage, if target has a burn effect, copy it to all other enemies who don't have burn.

```js
if (skill.spreadBurn && target.currentHp > 0) {
  const burnEffect = target.statusEffects?.find(e => e.type === EffectType.BURN)
  if (burnEffect) {
    const otherEnemies = aliveEnemies.value.filter(e => e.id !== target.id)
    for (const enemy of otherEnemies) {
      const hasBurn = enemy.statusEffects?.some(e => e.type === EffectType.BURN)
      if (!hasBurn) {
        applyEffect(enemy, EffectType.BURN, {
          duration: burnEffect.duration,
          casterAtk: burnEffect.casterAtk,
          atkPercent: burnEffect.atkPercent,
          sourceId: hero.instanceId
        })
        addLog(`Burn spreads to ${enemy.template.name}!`)
      }
    }
  }
}
```

### Consume Burns (`consumeBurns`)

Remove all burn effects from all enemies and deal instant damage based on remaining burn damage plus ATK bonus.

```js
if (skill.consumeBurns) {
  let totalDamage = 0
  let burnsConsumed = 0

  for (const enemy of aliveEnemies.value) {
    const burnEffects = enemy.statusEffects?.filter(e => e.type === EffectType.BURN) || []

    for (const burn of burnEffects) {
      // Calculate remaining burn damage
      const burnDamagePerTick = Math.floor((burn.casterAtk || effectiveAtk) * (burn.atkPercent || 50) / 100)
      const remainingDamage = burnDamagePerTick * burn.duration

      // Add ATK bonus per burn
      const atkBonus = Math.floor(effectiveAtk * (skill.consumeBurnAtkBonus || 0) / 100)

      totalDamage += remainingDamage + atkBonus
      burnsConsumed++
    }

    // Remove all burns from this enemy
    if (burnEffects.length > 0) {
      enemy.statusEffects = enemy.statusEffects.filter(e => e.type !== EffectType.BURN)
    }
  }

  // Distribute damage across all enemies who had burns
  // Or deal total damage as AoE - design decision
  if (burnsConsumed > 0) {
    for (const enemy of aliveEnemies.value) {
      applyDamage(enemy, Math.floor(totalDamage / aliveEnemies.value.length), 'attack', hero)
      emitCombatEffect(enemy.id, 'enemy', 'damage', Math.floor(totalDamage / aliveEnemies.value.length))
    }
    addLog(`${hero.template.name} detonates ${burnsConsumed} burns for ${totalDamage} total damage!`)
  }
}
```

## Files to Modify

1. `src/data/heroTemplates.js` - Update Shasha skills array
2. `src/data/statusEffects.js` - Add FLAME_SHIELD effect type
3. `src/stores/battle.js` - Add Flame Shield trigger, spreadBurn, consumeBurns mechanics

## Notes

- Mages use MP; all skills have mpCost
- Burns already exist in the game (Ignite uses them)
- Flame Shield burn uses the defender's ATK, not the attacker's
- Spreading Flames only spreads to enemies without existing burns (no overwrite)
- Conflagration damage is distributed evenly to all alive enemies
