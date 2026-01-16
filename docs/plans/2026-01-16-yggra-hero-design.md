# Yggra, the World Root - Hero Design

## Overview

Add a new legendary (5-star) druid healer with a round 1 healing leader skill.

## Hero Identity

**Name:** Yggra, the World Root

**Rarity:** 5-star (Legendary)

**Class:** Druid (Healer role)

**Resource:** Nature

**Concept:** An ancient tree spirit who has watched over the forest for millennia. Manifests as a wise, bark-skinned figure wreathed in glowing vines and moss. Protective and nurturing, drawing power from deep roots that connect all living things.

## Base Stats

| Stat | Value | Rationale |
|------|-------|-----------|
| HP   | 120   | Moderate - survivable but not a tank |
| ATK  | 40    | Higher than typical healer to benefit leader skill |
| DEF  | 35    | Decent survivability |
| SPD  | 10    | Slow - ancient and deliberate |
| MP   | 75    | High for sustained healing |

## Combat Skill

**Blessing of the World Root**
- **Cost:** 25 Nature
- **Target:** All allies
- **Effect:** Heal all allies for 100% ATK
- **Description:** "Channel the life force of the world tree to restore all allies for 100% ATK"

## Leader Skill

**Ancient Awakening**
- **Type:** Timed (round 1)
- **Effect:** Heal all allies for 10% of Yggra's ATK
- **Description:** "On round 1, all allies are healed for 10% of Yggra's ATK"

## Data Structure

```js
yggra_world_root: {
  id: 'yggra_world_root',
  name: 'Yggra, the World Root',
  rarity: 5,
  classId: 'druid',
  baseStats: { hp: 120, atk: 40, def: 35, spd: 10, mp: 75 },
  skill: {
    name: 'Blessing of the World Root',
    description: 'Channel the life force of the world tree to restore all allies for 100% ATK',
    mpCost: 25,
    targetType: 'all_allies'
  },
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

## Implementation Changes

### 1. Add Hero Template

Add `yggra_world_root` to `src/data/heroTemplates.js` in the 5-star section.

### 2. Extend Leader Skill Heal Support

Modify `applyTimedLeaderEffects` in `src/stores/battle.js` to handle heal effects:

```js
function applyTimedLeaderEffects(round) {
  const leaderSkill = getActiveLeaderSkill()
  if (!leaderSkill) return

  const heroesStore = useHeroesStore()

  for (const effect of leaderSkill.effects) {
    if (effect.type !== 'timed') continue
    if (effect.triggerRound !== round) continue

    const targets = getLeaderEffectTargets(effect.target, effect.condition)

    for (const target of targets) {
      if (effect.apply.effectType === 'heal') {
        // Heal based on leader's ATK
        const leader = heroes.value.find(h => h.instanceId === heroesStore.partyLeader)
        if (leader) {
          const leaderAtk = getEffectiveStat(leader, 'atk')
          const healAmount = Math.floor(leaderAtk * effect.apply.value / 100)
          const oldHp = target.currentHp
          target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount)
          const actualHeal = target.currentHp - oldHp
          if (actualHeal > 0) {
            emitCombatEffect(target.instanceId, 'hero', 'heal', actualHeal)
          }
        }
      } else {
        // Existing status effect application
        applyEffect(target, effect.apply.effectType, {
          duration: effect.apply.duration,
          value: effect.apply.value,
          sourceId: 'leader_skill'
        })
      }
    }

    addLog(`Leader skill: ${leaderSkill.name} activates!`)
  }
}
```

### 3. Hero Image (Optional)

Add `src/assets/heroes/yggra_world_root.png` or `.gif` if artwork is available.

## Files Changed

- `src/data/heroTemplates.js` - Add hero definition
- `src/stores/battle.js` - Add heal support to timed leader effects
- `src/assets/heroes/yggra_world_root.png` (optional)
