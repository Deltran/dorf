# Bard Verse Resource System Design

## Overview

Bards receive a unique resource system called **Verses** that replaces MP. Bard skills have no cost — instead, each skill used fills one of 3 verse slots. When all 3 slots are filled, a **Finale** automatically triggers at the start of the Bard's next turn as a free action. After Finale, verses reset to 0 and the cycle repeats.

A consecutive repeat restriction prevents the Bard from using the same skill on back-to-back turns, forcing skill rotation and rewarding a diverse toolkit.

## Core Mechanic

- **Resource:** Verse (0/3 slots)
- **Replaces:** MP — Bard skills have no resource cost
- **Builds by:** Using any skill (+1 Verse per skill)
- **Constraint:** Cannot use the same skill on consecutive turns
- **Payoff:** Finale auto-triggers at start of turn when at 3/3 Verses
- **Reset:** Verses reset to 0 after Finale fires

Basic attacks do not generate verses. Bards are incentivized to perform (use skills) every turn.

## Finale

Finale is a per-hero effect defined in the hero template. When 3/3 verses are reached, the Finale fires automatically at the start of the Bard's next turn. The Bard still gets their normal action afterward — Finale is a free bonus, not a turn cost.

Different Bard heroes have different Finales:

```js
// Example: Harl the Handsom
finale: {
  name: 'Standing Ovation',
  description: 'Restore resources to all allies and heal.',
  target: 'all_allies',
  effects: [
    { type: 'resource_grant', rageAmount: 15, focusGrant: true, valorAmount: 10, mpAmount: 15, verseAmount: 1 },
    { type: 'heal', value: 5 }  // 5% of Bard's ATK
  ]
}

// Example: An offensive Bard
finale: {
  name: 'Discordant Shriek',
  description: 'Deal damage to all enemies and reduce their ATK.',
  target: 'all_enemies',
  effects: [
    { type: 'damage', damagePercent: 80 },
    { type: EffectType.ATK_DOWN, duration: 2, value: 15 }
  ]
}
```

## Edge Cases

### 1-Skill Bards
If a Bard has only 1 skill unlocked, the Verse system is inactive:
- No repeat restriction (can use the same skill every turn)
- No verse buildup
- No Finale

The Verse system activates at 2+ unlocked skills. In practice, 3-star and higher Bards start with 2 skills at level 1, so the system is active immediately for them.

### Stun / CC
If the Bard is stunned, they cannot build verses that turn. Existing verses are preserved — they do not decay. CC delays Finale without erasing progress.

### Death and Revive
If the Bard dies and is revived, verses reset to 0.

### Bard Buffing Another Bard
A Finale that grants `+1 Verse` to other Bards in the party creates synergy in double-Bard compositions without being overpowered (still only 1 of 3 needed).

## UI

### Hero Card Resource Display
Three small circles replace the MP bar on the Bard's card:
- **Empty slots:** Dim/outlined circles
- **Filled slots:** Gold glowing circles with subtle pulse
- **3/3 (primed):** All three circles pulse brighter to indicate Finale is ready

### Skill Availability
The skill used on the previous turn appears dimmed with reduced opacity in the action bar, visually distinct from "insufficient resource" graying. A small indicator shows why it is unavailable (repeat restriction).

### Finale Visual Effect
1. Golden musical notes float up from the Bard
2. Notes scatter outward to each ally
3. Each ally briefly glows yellow
4. "Finale!" text floats above the Bard (similar to leader skill activation, 1.5s duration)

### Combat Log Messages
- On skill use: `"Harl plays Inspiring Song! (Verse 2/3)"`
- On Finale trigger: `"Harl's Finale: Standing Ovation!"`
- On repeat blocked: `"Cannot repeat the same song!"`

## Template Structure

### classes.js
```js
bard: {
  id: 'bard',
  title: 'Bard',
  role: 'support',
  resourceType: 'verse',
  resourceName: 'Verse'
}
```

### heroTemplates.js
```js
{
  id: 'harl_the_handsom',
  name: 'Harl the Handsom',
  classId: 'bard',
  rarity: 3,
  finale: {
    name: 'Standing Ovation',
    description: 'Restore resources to all allies and heal.',
    target: 'all_allies',
    effects: [
      { type: 'resource_grant', rageAmount: 15, focusGrant: true, valorAmount: 10, mpAmount: 15, verseAmount: 1 },
      { type: 'heal', value: 5 }
    ]
  },
  skills: [
    // Skills have no mpCost
    { name: 'Inspiring Song', targetType: 'all_allies', ... },
    { name: 'Mana Melody', targetType: 'all_allies', ... },
    ...
  ]
}
```

### battle.js additions
- `isBard(unit)` — checks `resourceType === 'verse'`
- `unit.currentVerses` — 0-3 counter, initialized to 0
- `unit.lastSkillIndex` — tracks last skill used for repeat prevention
- Verse gain logic in `executePlayerAction` after skill use
- Finale trigger check at start of Bard's turn in `advanceTurn`
- `canUseSkill` updated: Bards can always use skills (no MP check), but blocked if same as `lastSkillIndex`

## Comparison to Other Resources

| Resource | Class | Type | Builds From | Spent/Used |
|----------|-------|------|-------------|------------|
| Rage | Berserker | Numeric 0-100 | Attacking, taking damage | Spent on skill costs |
| Focus | Ranger | Binary | End-of-turn rest, heals, cleanses | Consumed on skill use, lost when hit |
| Valor | Knight | Numeric 0-100 | Defensive skills, absorbing damage | Never spent, unlocks scaling tiers |
| **Verse** | **Bard** | **Counter 0-3** | **Using any skill** | **Auto-consumed at 3/3, triggers Finale** |
