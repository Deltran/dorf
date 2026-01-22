# Aurora the Dawn Skills Design

## Overview

Expand Aurora's skill kit from a single skill to a full 5-star paladin kit. She becomes the Divine Protector - a tank who absorbs damage meant for allies, then converts that punishment into retribution.

## Character Fantasy

**Divine Protector** - Aurora stands between her allies and harm. She links herself to vulnerable allies, taking their pain as her own. Her faith sustains her through the onslaught, and when the storm passes, she unleashes all that absorbed suffering back at her enemies.

## Design Pillars

- Protection through damage sharing (unique mechanic)
- Self-sustain to survive redirected damage
- Defense converts to offense via Judgment's Echo
- Ultimate provides total team protection in emergencies

## Skills

| Level | Skill | MP | Target | Effect |
|-------|-------|----|--------|--------|
| 1 | Holy Strike | 15 | One enemy | Deal 120% ATK damage. Heal self for 50% of damage dealt. |
| 1 | Guardian Link | 20 | One ally | Link for 3 turns. Aurora takes 40% of damage dealt to them. |
| 3 | Consecrated Ground | 18 | One ally | Grant 25% damage reduction for 3 turns. |
| 6 | Judgment's Echo | 25 | Self | For 2 turns, store all damage Aurora takes. Then deal stored damage to all enemies. |
| 12 | Divine Sacrifice | 35 | Self | For 2 turns, Aurora takes ALL ally damage. Gain 50% DR and heal 15% max HP per turn. |

### Skill Details

**Holy Strike** (Level 1)
- *The dawn's light sears the wicked and restores the righteous.*
- Basic sustain tool - she needs self-healing since she takes damage for allies
- `targetType: 'enemy'`, `damagePercent: 120`, `healSelfPercent: 50`

**Guardian Link** (Level 1)
- *A golden tether binds protector and protected.*
- Core identity skill - damage sharing mechanic
- 40% of damage to linked ally redirects to Aurora
- Link breaks if Aurora dies
- `targetType: 'ally'`, `noDamage: true`
- Uses `EffectType.GUARDIAN_LINK` with `redirectPercent: 40`, `duration: 3`

**Consecrated Ground** (Level 3)
- *Holy ground where evil's touch is weakened.*
- Flat damage reduction stacks with Guardian Link
- Ally with both takes 75% damage, Aurora takes 40% of that
- `targetType: 'ally'`, `noDamage: true`
- Uses `EffectType.DAMAGE_REDUCTION` with `value: 25`, `duration: 3`

**Judgment's Echo** (Level 6)
- *Every blow absorbed is remembered. Every wound repaid.*
- Converts defense into offense
- Stores ALL damage Aurora takes for 2 turns
- On expiration, deals stored amount as AoE
- Synergy: Use during Divine Sacrifice for massive stored damage
- `targetType: 'self'`, `noDamage: true`
- Uses `EffectType.DAMAGE_STORE` with `duration: 2`, `releaseTarget: 'all_enemies'`

**Divine Sacrifice** (Level 12)
- *None shall fall while the dawn still stands.*
- Emergency total protection
- Intercepts 100% of ALL ally damage
- Aurora gains 50% damage reduction and 15% max HP regen per turn
- If Aurora dies, effect ends
- `targetType: 'self'`, `noDamage: true`
- Uses `EffectType.DIVINE_SACRIFICE` with `duration: 2`, `damageReduction: 50`, `healPerTurn: 15`

## Playstyle

1. **Setup phase:** Apply Guardian Link to squishiest ally (mage, healer)
2. **Layer protection:** Add Consecrated Ground on priority targets
3. **Sustain:** Use Holy Strike to recover HP from redirected damage
4. **Counter window:** Activate Judgment's Echo before heavy enemy turns
5. **Emergency:** Divine Sacrifice when multiple allies are in danger

## New Mechanics Required

### GUARDIAN_LINK Status Effect

A buff placed on an ally that redirects damage to Aurora.

```js
GUARDIAN_LINK: 'guardian_link'

[EffectType.GUARDIAN_LINK]: {
  name: 'Guardian Link',
  icon: '🔗',
  color: '#fbbf24',
  isBuff: true,
  isGuardianLink: true,
  stackable: false
}
```

**Battle integration:**
```js
// In damage application, before applying damage to target
const guardianLink = target.statusEffects?.find(e => e.type === EffectType.GUARDIAN_LINK)
if (guardianLink && aurora.currentHp > 0) {
  const redirectAmount = Math.floor(damage * guardianLink.redirectPercent / 100)
  const remainingDamage = damage - redirectAmount
  applyDamage(aurora, redirectAmount, 'redirect', source)
  applyDamage(target, remainingDamage, type, source)
  addLog(`Aurora absorbs ${redirectAmount} damage for ${target.template.name}!`)
}
```

### DAMAGE_REDUCTION Status Effect

A buff that reduces incoming damage by a percentage.

```js
DAMAGE_REDUCTION: 'damage_reduction'

[EffectType.DAMAGE_REDUCTION]: {
  name: 'Damage Reduction',
  icon: '🛡️',
  color: '#fbbf24',
  isBuff: true,
  isDamageReduction: true,
  stackable: false
}
```

**Battle integration:**
```js
// In damage calculation
const drEffect = target.statusEffects?.find(e => e.type === EffectType.DAMAGE_REDUCTION)
if (drEffect) {
  damage = Math.floor(damage * (100 - drEffect.value) / 100)
}
```

### DAMAGE_STORE Status Effect

A buff on Aurora that accumulates damage taken, then releases it.

```js
DAMAGE_STORE: 'damage_store'

[EffectType.DAMAGE_STORE]: {
  name: "Judgment's Echo",
  icon: '⚡',
  color: '#fbbf24',
  isBuff: true,
  isDamageStore: true,
  stackable: false
}
```

**Battle integration:**
```js
// When Aurora takes damage while DAMAGE_STORE is active
const damageStore = aurora.statusEffects?.find(e => e.type === EffectType.DAMAGE_STORE)
if (damageStore) {
  damageStore.storedDamage = (damageStore.storedDamage || 0) + damage
  addLog(`Aurora stores ${damage} damage! (Total: ${damageStore.storedDamage})`)
}

// On buff expiration (in processStatusEffects)
if (effect.type === EffectType.DAMAGE_STORE && effect.duration === 0) {
  const stored = effect.storedDamage || 0
  if (stored > 0) {
    for (const enemy of aliveEnemies.value) {
      applyDamage(enemy, stored, 'attack', aurora)
      emitCombatEffect(enemy.id, 'enemy', 'damage', stored)
    }
    addLog(`Aurora releases ${stored} stored damage to all enemies!`)
  }
}
```

### DIVINE_SACRIFICE Status Effect

A buff on Aurora that intercepts all ally damage.

```js
DIVINE_SACRIFICE: 'divine_sacrifice'

[EffectType.DIVINE_SACRIFICE]: {
  name: 'Divine Sacrifice',
  icon: '✨',
  color: '#fbbf24',
  isBuff: true,
  isDivineSacrifice: true,
  stackable: false
}
```

**Battle integration:**
```js
// When ANY ally would take damage, check if Aurora has Divine Sacrifice
const divineSacrifice = aurora?.statusEffects?.find(e => e.type === EffectType.DIVINE_SACRIFICE)
if (divineSacrifice && target !== aurora && aurora.currentHp > 0) {
  // Apply DR to Aurora
  let redirectedDamage = Math.floor(damage * (100 - divineSacrifice.damageReduction) / 100)
  applyDamage(aurora, redirectedDamage, 'redirect', source)
  addLog(`Aurora intercepts ${damage} damage meant for ${target.template.name}!`)
  return // Target takes no damage
}

// Heal per turn in processStatusEffects
if (effect.type === EffectType.DIVINE_SACRIFICE) {
  const healAmount = Math.floor(aurora.stats.hp * effect.healPerTurn / 100)
  aurora.currentHp = Math.min(aurora.stats.hp, aurora.currentHp + healAmount)
  addLog(`Divine Sacrifice heals Aurora for ${healAmount}!`)
}
```

### healSelfPercent Skill Property

After dealing damage, heal caster for percentage of damage dealt.

```js
// After damage is dealt
if (skill.healSelfPercent) {
  const healAmount = Math.floor(damageDealt * skill.healSelfPercent / 100)
  hero.currentHp = Math.min(hero.stats.hp, hero.currentHp + healAmount)
  emitCombatEffect(hero.instanceId, 'hero', 'heal', healAmount)
  addLog(`${hero.template.name} heals for ${healAmount}!`)
}
```

## Data Structure

```js
aurora_the_dawn: {
  id: 'aurora_the_dawn',
  name: 'Aurora the Dawn',
  rarity: 5,
  classId: 'paladin',
  baseStats: { hp: 150, atk: 35, def: 50, spd: 12, mp: 60 },
  skills: [
    {
      name: 'Holy Strike',
      description: 'Deal 120% ATK damage to one enemy. Heal self for 50% of damage dealt.',
      mpCost: 15,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 120,
      healSelfPercent: 50
    },
    {
      name: 'Guardian Link',
      description: 'Link to one ally for 3 turns. Aurora takes 40% of damage dealt to them.',
      mpCost: 20,
      skillUnlockLevel: 1,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.GUARDIAN_LINK, target: 'ally', duration: 3, redirectPercent: 40 }
      ]
    },
    {
      name: 'Consecrated Ground',
      description: 'Grant one ally 25% damage reduction for 3 turns.',
      mpCost: 18,
      skillUnlockLevel: 3,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.DAMAGE_REDUCTION, target: 'ally', duration: 3, value: 25 }
      ]
    },
    {
      name: "Judgment's Echo",
      description: 'For 2 turns, store all damage Aurora takes. Then deal stored damage as holy damage to all enemies.',
      mpCost: 25,
      skillUnlockLevel: 6,
      targetType: 'self',
      noDamage: true,
      effects: [
        { type: EffectType.DAMAGE_STORE, target: 'self', duration: 2, releaseTarget: 'all_enemies' }
      ]
    },
    {
      name: 'Divine Sacrifice',
      description: 'For 2 turns, Aurora takes ALL damage meant for allies. Gain 50% damage reduction and heal 15% max HP per turn.',
      mpCost: 35,
      skillUnlockLevel: 12,
      targetType: 'self',
      noDamage: true,
      effects: [
        { type: EffectType.DIVINE_SACRIFICE, target: 'self', duration: 2, damageReduction: 50, healPerTurn: 15 }
      ]
    }
  ],
  leaderSkill: {
    name: "Dawn's Protection",
    description: 'Non-knight allies gain +15% DEF',
    effects: [
      {
        type: 'passive',
        stat: 'def',
        value: 15,
        condition: { classId: { not: 'knight' } }
      }
    ]
  }
}
```

## Files to Modify

1. `src/data/heroTemplates.js` - Update Aurora from single `skill` to `skills` array
2. `src/data/statusEffects.js` - Add GUARDIAN_LINK, DAMAGE_REDUCTION, DAMAGE_STORE, DIVINE_SACRIFICE
3. `src/stores/battle.js` - Implement all new mechanics

## Implementation Complexity

This is the most mechanically complex hero in the game. Recommended implementation order:

1. **DAMAGE_REDUCTION** - Simplest, just a damage modifier
2. **healSelfPercent** - Straightforward post-damage heal
3. **GUARDIAN_LINK** - Damage redirection foundation
4. **DIVINE_SACRIFICE** - Builds on Guardian Link concepts
5. **DAMAGE_STORE** - Most complex, needs buff expiration trigger system

## Notes

- Paladins use Faith (MP); all skills have mpCost
- Guardian Link and Divine Sacrifice require Aurora to be alive
- DAMAGE_STORE needs a new "on buff expire" trigger in processStatusEffects
- Divine Sacrifice + Judgment's Echo combo is intentionally powerful (ultimate synergy)
- DAMAGE_REDUCTION is a generic effect that could be reused by other heroes
