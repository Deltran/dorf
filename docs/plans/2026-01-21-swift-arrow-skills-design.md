# Swift Arrow Skills Design

Update Swift Arrow with 5 skills that unlock at different levels, introducing two new battle mechanics: Hunter's Mark (vulnerability debuff) and DEF penetration.

## Fantasy & Playstyle

**Fantasy:** Elite archer who overwhelms enemies with a relentless hail of arrows while marking priority targets for the team.

**Playstyle:** High-output DPS who burns through Focus quickly. Needs healer/support allies to keep firing. Rewards team coordination with vulnerability marks that amplify everyone's damage.

## Skills

| Level | Skill | Effect |
|-------|-------|--------|
| 1 | Volley | Deal 70% ATK damage 3× to random enemies |
| 1 | Hunter's Mark | Mark enemy for 3 turns; marked enemies take +20% damage from all sources |
| 3 | Barrage | Deal 60% ATK damage to all enemies |
| 6 | Piercing Shot | Deal 180% ATK damage to one enemy; ignores 50% of target's DEF |
| 12 | Arrow Storm | Deal 50% ATK damage 5× to random enemies; marked enemies are targeted first |

## Skill Data Structure

```js
swift_arrow: {
  id: 'swift_arrow',
  name: 'Swift Arrow',
  rarity: 4,
  classId: 'ranger',
  baseStats: { hp: 90, atk: 42, def: 22, spd: 20, mp: 55 },
  skills: [
    {
      name: 'Volley',
      description: 'Deal 70% ATK damage three times to random enemies.',
      skillUnlockLevel: 1,
      targetType: 'all_enemies',
      multiHit: { count: 3, damage: 70, targeting: 'random' }
    },
    {
      name: "Hunter's Mark",
      description: 'Mark an enemy for 3 turns. Marked enemies take 20% increased damage from all sources.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.MARKED, target: 'enemy', duration: 3, value: 20 }
      ]
    },
    {
      name: 'Barrage',
      description: 'Deal 60% ATK damage to all enemies.',
      skillUnlockLevel: 3,
      targetType: 'all_enemies'
    },
    {
      name: 'Piercing Shot',
      description: 'Deal 180% ATK damage to one enemy. Ignores 50% of target DEF.',
      skillUnlockLevel: 6,
      targetType: 'enemy',
      ignoreDefPercent: 50
    },
    {
      name: 'Arrow Storm',
      description: 'Deal 50% ATK damage five times to random enemies. Marked enemies are targeted first.',
      skillUnlockLevel: 12,
      targetType: 'all_enemies',
      multiHit: { count: 5, damage: 50, targeting: 'random', prioritizeMarked: true }
    }
  ]
}
```

## New Battle Mechanics

### MARKED Status Effect

A debuff that increases all damage taken by the target.

**In `statusEffects.js`:**
```js
marked: {
  id: 'marked',
  name: 'Marked',
  type: 'debuff',
  description: 'Takes increased damage from all sources',
  icon: '🎯'
}
```

**Damage calculation integration:**
When calculating damage, check if target has MARKED effect and multiply final damage by `(1 + value/100)`.

```js
// In damage calculation
const markedEffect = target.statusEffects?.find(e => e.type === EffectType.MARKED)
if (markedEffect) {
  damage = Math.floor(damage * (1 + markedEffect.value / 100))
}
```

### DEF Penetration (`ignoreDefPercent`)

Skill property that bypasses a percentage of target's DEF in damage calculation.

```js
// In damage calculation
let effectiveDef = target.currentDef
if (skill?.ignoreDefPercent) {
  effectiveDef = Math.floor(effectiveDef * (1 - skill.ignoreDefPercent / 100))
}
```

### Multi-Hit with Marked Priority (`prioritizeMarked`)

When `multiHit.prioritizeMarked` is true, the random target selection prefers marked enemies.

```js
function selectRandomTarget(enemies, prioritizeMarked = false) {
  const alive = enemies.filter(e => e.currentHp > 0)
  if (prioritizeMarked) {
    const marked = alive.filter(e => e.statusEffects?.some(s => s.type === EffectType.MARKED))
    if (marked.length > 0) {
      return marked[Math.floor(Math.random() * marked.length)]
    }
  }
  return alive[Math.floor(Math.random() * alive.length)]
}
```

## Files to Modify

1. `src/data/heroTemplates.js` - Update Swift Arrow to skills array
2. `src/data/statusEffects.js` - Add MARKED effect type
3. `src/stores/battle.js` - Add MARKED damage amp, DEF penetration, and prioritizeMarked logic

## Notes

- Rangers use Focus (boolean); all skills consume Focus on use
- No self-sustaining Focus mechanics; Swift Arrow relies on team support
- MARKED does not stack with itself; reapplying refreshes duration
- Barrage damage (60%) intentionally lower than Volley total (210%) for AoE tradeoff
