# Fennick Kit Design

Complete the skill kit for Fennick, a 2-star Ranger evasion tank (fox with a bow).

## Fennick Overview

- **Rarity:** 2-star
- **Class:** Ranger (Focus resource)
- **Role:** Tank (override from Ranger's default DPS)
- **Fantasy:** Evasion tank — taunts enemies, dodges attacks, punishes attackers

## Complete Skill Kit (4 skills)

### Skill 1: Come and Get Me (existing, unchanged)

- **Unlock:** Level 1
- **Target:** Self, no damage
- **Effects:** Taunt all enemies (2t), +30% evasion (2t)

### Skill 2: Counter-shot (new)

- **Unlock:** Level 3
- **Target:** Enemy, 90% ATK damage
- **Effects:** Apply THORNS to self (2t, 30% reflect)
- **Synergy:** Taunt forces enemies to attack Fennick; thorns punishes them

### Skill 3: Fox's Cunning (new)

- **Unlock:** Level 6
- **Target:** Self, no damage
- **Effects:** +20% evasion (3t), +3 SPD (3t)
- **Stacking:** Evasion stacks additively with Come and Get Me (30% + 20% = 50%)

### Skill 4: Pin Down (new)

- **Unlock:** Level 12
- **Target:** Enemy, 100% ATK damage
- **Effects:** Stun (1t)
- **Role:** Crowd control to shut down threatening enemies

## Evasion Stacking Change

Currently, `applyDamage` in battle.js uses `.find()` to get a single EVASION effect. Change to `.filter()` + sum all evasion values additively, capped at 100%.

### battle.js change

```js
// Sum all evasion effects
const evasionEffects = (unit.statusEffects || []).filter(e => e.type === EffectType.EVASION)
if (evasionEffects.length > 0) {
  const totalEvasion = evasionEffects.reduce((sum, e) => sum + (e.value || 0), 0)
  const evasionChance = Math.min(totalEvasion, 100) / 100
  // ... existing dodge roll logic
}
```

### statusEffects.js change

Set `stackable: true` on the EVASION effect definition.

## Files to Change

| File | Change |
|------|--------|
| `src/data/heroTemplates.js` | Replace Fennick's skills array with 4 skills |
| `src/stores/battle.js` | Change evasion check to sum multiple effects |
| `src/data/statusEffects.js` | Set EVASION `stackable: true` |
