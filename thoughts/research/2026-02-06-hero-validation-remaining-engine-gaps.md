# Research: Hero Validation Engine Gaps

**Date**: 2026-02-06
**Git Commit**: 36b730d6422e03157db8b78f7602a6a019489810
**Branch**: main

## Research Question

What engine fixes remain after Area 8 (name mismatches), selfDamagePercentMaxHp, effect.target === 'self' in ally path, and rageGain/valorGain processing have been fixed? Focus on Areas 2, 4, 5, 6, and 9 (Onibaba).

## Summary

27 unimplemented skill properties across 12 heroes require engine work. Most are medium-complexity additions to battle.js targeting system. Key gaps:

- **Area 2 (Unimplemented skill properties)**: 11 properties across 6 heroes
- **Area 4 (Knight/Bard resource issues)**: 7 properties across 4 heroes
- **Area 5 (Generic onKill handler)**: 4 different onKill patterns across 4 heroes
- **Area 6 (Unimplemented passive types)**: 5 passive types across 5 heroes
- **Area 9 (Onibaba)**: 7 unique properties concentrated in one hero

## Detailed Findings

### AREA 2: Unimplemented Skill Properties

#### Vashek the Unrelenting (3-star Knight)

**Hold the Line** (`src/data/heroes/3star/vashek_the_unrelenting.js:10-21`)
```javascript
conditionalBonusDamage: {
  condition: 'anyAllyBelowHalfHp',
  bonusPercent: { base: 20, at50: 25, at75: 30, at100: 35 }
}
```
- Skill checks if any ally HP < 50%, adds bonus damage if true
- Needs Valor-tier scaling (base/at25/at50/at75/at100)
- **Engine gap**: No `conditionalBonusDamage` handler in battle.js

**Shoulder to Shoulder** (`src/data/heroes/3star/vashek_the_unrelenting.js:78-89`)
```javascript
effects: [
  {
    type: EffectType.ATK_UP,
    valuePerAlly: { base: 5, at75: 7, at100: 8 }  // Per surviving ally
  }
]
```
- Buff value scales with alive ally count AND Valor tier
- **Engine gap**: `valuePerAlly` not read in `resolveEffectValue()`

#### The Grateful Dead (3-star Knight)

**A Minor Inconvenience** (`src/data/heroes/3star/the_grateful_dead.js:26-30`)
```javascript
cleanseSelf: ['stun', 'sleep', 'heal_block']
```
- Cleanses specific effect types from self
- **Engine gap**: `cleanseSelf` not processed in 'self' targetType path

**Bygone Valor** (`src/data/heroes/3star/the_grateful_dead.js:62-69`)
```javascript
bonusDamagePerValor: 1,      // +1% per Valor consumed
maxBonusDamage: 100,         // Cap at +100%
at100Valor: {
  effects: [{ type: 'def_down', target: 'enemy', duration: 2, value: 20 }]
}
```
- Consumes all Valor, damage scales with amount consumed
- If exactly 100 Valor consumed, apply extra effects to all enemies
- **Engine gap**: `bonusDamagePerValor`, `maxBonusDamage`, `at100Valor` not handled in all_enemies path

#### Matsuda the Masterless (3-star Berserker)

**Death Before Dishonor** (`src/data/heroes/3star/matsuda.js:50-51`)
```javascript
conditionalDamage: { hpBelow50: 180, hpBelow25: 220 },
conditionalEvasion: { hpBelow25: 30 }
```
- Damage changes based on user HP threshold
- Grants evasion buff if below 25% HP
- **Engine gap**: `conditionalDamage` and `conditionalEvasion` not read

**Glorious End** (`src/data/heroes/3star/matsuda.js:61`)
```javascript
bonusDamagePerMissingHpPercent: 1  // +1% per 1% HP missing
```
- Damage increases with missing HP (100% HP = +0%, 1% HP = +99% bonus)
- **Engine gap**: `bonusDamagePerMissingHpPercent` not calculated

#### Torga Bloodbeat (3-star Berserker)

**Blood Echo** (`src/data/heroes/3star/torga_bloodbeat.js:44-45`)
```javascript
bonusDamagePerBloodTempo: 30,  // +30% per Blood Tempo use
maxBloodTempoBonus: 90          // Cap at +90% (3 uses)
```
- Tracks how many times "Blood Tempo" skill was used this battle
- `processSkillForBloodTempoTracking()` exists but bonus not applied
- **Engine gap**: Tracking exists, bonus calculation missing

**Finale of Fury** (`src/data/heroes/3star/torga_bloodbeat.js:62-63`)
```javascript
baseDamagePercent: 50,
damagePerRage: 2  // +2% per Rage consumed
```
- Found in battle.js:3327 for multiHit skills with rageCost: 'all'
- **Status**: ALREADY IMPLEMENTED for multiHit path
- **Gap**: Not implemented for single-target consumeAll skills

#### Shinobi Jin (4-star Ranger)

**Kunai** (`src/data/heroes/4star/shinobi_jin.js:24`)
```javascript
ifMarked: { extendDuration: 1 }  // Poison lasts 3 turns if target is Marked
```
- If target has MARKED effect, extend effect duration
- **Engine gap**: `ifMarked` not checked before `applyEffect()`

**Kusari Fundo** (`src/data/heroes/4star/shinobi_jin.js:49`)
```javascript
ifMarked: { damagePercent: 90 }  // Override base 70% if target is Marked
```
- Conditional damage override based on target status
- **Engine gap**: `ifMarked.damagePercent` not checked in all_enemies path

**Ansatsu** (`src/data/heroes/4star/shinobi_jin.js:59-62`)
```javascript
executeThreshold: 30,  // Kill enemies below 30% HP
ifMarked: {
  executeThreshold: 35,      // Increase threshold if Marked
  onExecute: { resetCooldown: true }  // Reset cooldown if executed
}
```
- Instant-kill mechanic with conditional threshold boost
- Cooldown reset on successful execute
- **Engine gap**: `executeThreshold`, `ifMarked.executeThreshold`, `ifMarked.onExecute` not implemented

#### Fennick (2-star Ranger)

**All skills use standard properties** - no unimplemented patterns.

### AREA 4: Knight/Bard Resource Issues

#### Chroma (4-star Bard)

**Resonance** (`src/data/heroes/4star/chroma.js:31`)
```javascript
resourceRestore: 20  // Restores MP/Focus/Valor/Rage to target
```
- **Status**: ALREADY IMPLEMENTED at battle.js:3963-3999
- Handles Berserker (Rage), Ranger (Focus), Knight (Valor), MP classes (Mage/Cleric/Paladin/Druid/Alchemist)
- **Gap**: Comment at 3988 says "Alchemist" but code only checks `!isBard(target)` for MP restoration
- **Actual status**: WORKS - Alchemist uses currentMp/maxMp, so this is fine

#### Vraxx Thunderskin (4-star Bard)

**Finale: Thunderclap Crescendo** (`src/data/heroes/4star/vraxx_thunderskin.js:14-19`)
```javascript
effects: [{
  type: 'consume_excess_rage',
  rageThreshold: 50,
  damagePerRagePercent: 3,
  fallbackBuff: { type: 'atk_up', value: 25, duration: 2 }
}]
```
- Consumes Rage above 50 from all Berserker allies
- Deals damage per Rage consumed to all enemies
- If no Rage consumed, grants ATK buff instead
- **Engine gap**: Custom finale effect type `consume_excess_rage` not implemented

**Fury Beat** (`src/data/heroes/4star/vraxx_thunderskin.js:40-44`)
```javascript
effects: [{
  type: 'conditional_resource_or_buff',
  rageGrant: { classCondition: 'berserker', amount: 15 },
  fallbackBuff: { type: EffectType.ATK_UP, duration: 2, value: 15 }
}]
```
- Grants Rage to Berserkers, ATK buff to non-Berserkers
- **Engine gap**: Custom effect type `conditional_resource_or_buff` not implemented

**Drums of the Old Blood** (`src/data/heroes/4star/vraxx_thunderskin.js:79`)
```javascript
effects: [
  { type: EffectType.ATK_UP, target: 'all_allies', duration: 3, value: 25 },
  { type: 'rage_grant', classCondition: 'berserker', amount: 25 }
]
```
- Second effect grants Rage only to Berserkers
- **Engine gap**: Custom effect type `rage_grant` with `classCondition` not implemented

#### Philemon the Ardent (4-star Knight)

**Devoted Strike** (`src/data/heroes/4star/philemon_the_ardent.js:17`)
```javascript
valorGainBonusIfGuarding: 5  // +5 bonus Valor if currently guarding an ally
```
- Base valorGain: 10, bonus +5 if GUARDING effect active
- **Engine gap**: `valorGainBonusIfGuarding` not checked

**Heart's Shield** (`src/data/heroes/4star/philemon_the_ardent.js:35`)
```javascript
selfBuffWhileGuarding: { type: 'def_up', value: 20, duration: 2 }
```
- Grants self-buff when GUARDING effect is applied
- **Engine gap**: `selfBuffWhileGuarding` not processed

**Stolen Glance** (`src/data/heroes/4star/philemon_the_ardent.js:60`)
```javascript
valorGainOnUse: 10  // Gain 10 Valor after using this skill
```
- Skill grants Valor after execution (not valorGain, which is processed before)
- **Engine gap**: `valorGainOnUse` not processed after skill execution

**Heartsworn Bulwark** (`src/data/heroes/4star/philemon_the_ardent.js:96`)
```javascript
selfBuffWhileShieldsActive: { type: 'def_up', value: 25 }
```
- Continuous buff while ANY ally has shield from this skill
- **Engine gap**: `selfBuffWhileShieldsActive` not tracked/applied

### AREA 5: Generic onKill Handler

Four heroes use `onKill` with different patterns. Currently only `onKillGrantHeartbreakStacks` is implemented (Mara-specific, battle.js:3737).

#### Korrath Hollow Ear (5-star Ranger)

**The Last Drumbeat** (`src/data/heroes/5star/korrath_hollow_ear.js:57`)
```javascript
onKill: { resetTurnOrder: true }  // Reset to top of turn order on kill
```
- If skill kills target, move Korrath to front of turn order
- **Engine gap**: `onKill.resetTurnOrder` not implemented

#### Shinobi Jin (4-star Ranger)

**Shi no In** (`src/data/heroes/4star/shinobi_jin.js:40`)
```javascript
onKill: { type: 'stealth', target: 'self', duration: 1 }  // Gain Stealth on kill
```
- Apply STEALTH effect to self if skill kills target
- **Engine gap**: `onKill` with effect application not implemented

#### Matsuda the Masterless (3-star Berserker)

**Glorious End** (`src/data/heroes/3star/matsuda.js:62`)
```javascript
onKill: { healPercent: 20, bypassReluctance: true }
```
- Heal for 20% of caster's ATK on kill
- Bypasses Reluctance passive (Matsuda-specific anti-healing mechanic)
- **Engine gap**: `onKill.healPercent` and `bypassReluctance` flag not implemented

#### Torga Bloodbeat (3-star Berserker)

**Finale of Fury** (`src/data/heroes/3star/torga_bloodbeat.js:64`)
```javascript
onKill: { rageGain: 50 }  // Gain 50 Rage on kill
```
- Grant Rage to self if skill kills target
- **Engine gap**: `onKill.rageGain` not implemented

### AREA 6: Unimplemented Passive Types

Five heroes have `passive` or `passiveType` that aren't handled in battle.js.

#### Vashek the Unrelenting (3-star Knight)

**Unyielding** (`src/data/heroes/3star/vashek_the_unrelenting.js:67-68`)
```javascript
isPassive: true,
passiveType: 'allySaveOnce',
saveAllyOnDeath: { vashekMinHpPercent: 50, damageSharePercent: 50, oncePerBattle: true }
```
- When ally would die and Vashek > 50% HP, intercept 50% of killing blow
- Ally survives at 1 HP, Vashek takes shared damage
- Once per battle (needs tracking flag like `vashekSaveUsed`)
- **Engine gap**: No `passiveType: 'allySaveOnce'` handling in death prevention flow

#### Shinobi Jin (4-star Ranger)

**Kage no Mai** (`src/data/heroes/4star/shinobi_jin.js:91`)
```javascript
passive: {
  onSkillUse: { type: 'evasion', value: 10, duration: 1, maxStacks: 30 }
}
```
- After using any skill, gain +10% Evasion for 1 turn (stacks to 30%)
- **Engine gap**: `passive.onSkillUse` not processed after skill execution

#### Village Healer (3-star Cleric)

**No passive** - all skills use implemented properties (healPercent, wellFedEffect).

**wellFedEffect** (`src/data/heroes/3star/village_healer.js:73`)
```javascript
wellFedEffect: { duration: 3, atkPercent: 100, threshold: 30 }
```
- **Status**: ALREADY IMPLEMENTED at battle.js:4637-4640 (skill application) and battle.js:2105-2114 (trigger check)

#### The Grateful Dead (3-star Knight)

**Already Dead** (`src/data/heroes/3star/the_grateful_dead.js:76-82`)
```javascript
isPassive: true,
passiveType: 'valorThreshold',
thresholds: [
  { valor: 25, stat: 'def', value: 10 },
  { valor: 50, stat: 'atk', value: 15 },
  { valor: 75, riposteLifesteal: 10 },
  { valor: 100, deathPrevention: true, oncePerBattle: true }
]
```
- Grants bonuses as Valor accumulates
- At 75 Valor: Riposte heals for 10% of damage dealt
- At 100 Valor: Survive one fatal hit per battle
- **Partial implementation**: `valorThreshold` check exists at battle.js:1340 for effect application
- **Engine gap**: No passive handler for stat bonuses or riposteLifesteal mechanic

#### Matsuda the Masterless (3-star Berserker)

**Bushido** (`src/data/heroes/3star/matsuda.js:67-70`)
```javascript
passive: {
  atkPerMissingHpPercent: 0.5,  // +1% ATK per 2% HP missing
  maxAtkBonus: 50,              // Cap at +50% ATK
  onHealed: { type: 'reluctance', stacks: 1 }  // Gain Reluctance on heal
}
```
- `atkPerMissingHpPercent` needs implementation in `getEffectiveStat()` ATK calculation
- `onHealed` trigger when hero receives healing (any source)
- **Engine gap**: `passive.onHealed` not hooked into healing flow

### AREA 9: Onibaba (5-star Druid)

Concentrated in one hero. 7 unique unimplemented properties.

#### Soul Siphon (`src/data/heroes/5star/onibaba.js:17`)
```javascript
healLowestAllyPercent: 100  // Heal lowest HP ally for 100% of damage dealt
```
- After dealing damage, find ally with lowest HP%, heal them
- **Engine gap**: `healLowestAllyPercent` not processed

#### Grudge Hex (`src/data/heroes/5star/onibaba.js:32`)
```javascript
effects: [{
  type: EffectType.POISON,
  atkPercent: 40,
  doubleIfAttacksCaster: true  // Poison damage doubles if enemy attacks Onibaba
}]
```
- Poison effect property that triggers conditional damage amplification
- **Engine gap**: `doubleIfAttacksCaster` not checked in Poison tick processing

#### Spirit Ward (`src/data/heroes/5star/onibaba.js:48`)
```javascript
effects: [{
  type: EffectType.SHIELD,
  casterMaxHpPercent: 20  // Shield value = 20% of Onibaba's max HP
}]
```
- Shield based on caster's max HP, not target's
- **Engine gap**: `casterMaxHpPercent` not read (only `shieldPercentMaxHp` for target exists)

#### Wailing Mask (`src/data/heroes/5star/onibaba.js:63-66`)
```javascript
selfHpCostPercent: 20,      // Sacrifice 20% current HP
dealHpCostAsDamage: true,   // Deal that HP as damage
ignoresDef: true,           // True damage
healAlliesPercent: 50       // Heal all allies for 50% of damage dealt
```
- Pay HP as cost, deal that exact amount as damage (ignoring DEF)
- Heal all allies for % of damage dealt
- **Engine gap**: `selfHpCostPercent`, `dealHpCostAsDamage`, `ignoresDef` properties not processed
- **Note**: `healAlliesPercent` exists at battle.js:3562 for single-target, not all_enemies

#### The Crone's Gift (`src/data/heroes/5star/onibaba.js:75-84`)
```javascript
selfHpCostPercent: 30,
grantLifesteal: { value: 20, duration: 3 }
```
- HP cost already unimplemented (same as Wailing Mask)
- Grant lifesteal as status effect (not just one-time heal)
- **Engine gap**: `grantLifesteal` not applied as effect

#### Grandmother's Vigil (Leader Skill) (`src/data/heroes/5star/onibaba.js:91`)
```javascript
leaderSkill: {
  effects: [{
    type: 'ally_low_hp_auto_attack',
    hpThreshold: 30,
    autoSkill: 'Soul Siphon',
    oncePerAlly: true
  }]
}
```
- When any ally drops below 30% HP, auto-cast Soul Siphon
- Once per ally per battle (needs tracking)
- **Engine gap**: Entire reactive leader skill system unimplemented

#### Hungry Ghost (Passive) (`src/data/heroes/5star/onibaba.js:94`)
```javascript
passive: {
  lifestealOnDamage: 15  // Heal for 15% of all damage dealt
}
```
- Global lifesteal on all damage (not skill-specific)
- **Engine gap**: `passive.lifestealOnDamage` not hooked into `applyDamage()`

## Prioritized Implementation List

### QUICK FIXES (1-2 hours each)

1. **cleanseSelf** (Grateful Dead) - Add array loop in 'self' path before effects
2. **valorGainBonusIfGuarding** (Philemon) - Check for GUARDING effect, add to valorGain
3. **valorGainOnUse** (Philemon) - Process after skill execution, same as rageGain fix
4. **bonusDamagePerMissingHpPercent** (Matsuda) - Calculate missing HP%, add to multiplier
5. **bonusDamagePerBloodTempo** (Torga) - Tracking exists, add bonus to damage calc
6. **damagePerRage for single-target** (Torga Finale) - Extend existing multiHit logic
7. **healLowestAllyPercent** (Onibaba) - Find lowest HP ally, apply heal after damage
8. **casterMaxHpPercent for shields** (Onibaba) - Read caster.maxHp instead of target.maxHp

### MEDIUM COMPLEXITY (3-6 hours each)

9. **conditionalBonusDamage** (Vashek) - Check ally HP, resolve Valor-scaled bonus, add to damage
10. **valuePerAlly** (Vashek) - Count alive allies, multiply value, integrate with Valor scaling
11. **bonusDamagePerValor + at100Valor** (Grateful Dead) - Calculate bonus from consumed Valor, check exact 100 for extra effects in all_enemies path
12. **conditionalDamage + conditionalEvasion** (Matsuda) - Check hero HP%, override damagePercent, apply evasion buff conditionally
13. **ifMarked property suite** (Shinobi Jin) - Check target for MARKED effect, apply extendDuration/damagePercent/executeThreshold/resetCooldown
14. **executeThreshold** (Shinobi Jin) - Check target HP%, instant-kill if below threshold
15. **onKill generic handler** (4 heroes) - Hook into death check, dispatch to resetTurnOrder/healPercent/rageGain/applyEffect
16. **onSkillUse passive** (Shinobi Jin) - Hook after skill execution, apply stacking evasion effect
17. **passive.onHealed** (Matsuda) - Hook into all healing flows, apply Reluctance effect
18. **valorThreshold passive bonuses** (Grateful Dead) - Check Valor in getEffectiveStat, apply stat bonuses per tier
19. **riposteLifesteal** (Grateful Dead at 75 Valor) - Modify Riposte damage reflection to heal attacker
20. **selfBuffWhileGuarding** (Philemon) - Apply self-buff when GUARDING applied, remove when expires
21. **doubleIfAttacksCaster** (Onibaba) - Check attacker in Poison tick, double damage if matches sourceId

### COMPLEX (8+ hours each)

22. **selfHpCostPercent + dealHpCostAsDamage + ignoresDef** (Onibaba) - Pay HP cost, bypass DEF calculation, deal exact HP as damage
23. **grantLifesteal effect** (Onibaba) - Create new LIFESTEAL status effect type, hook into all damage flows
24. **lifestealOnDamage passive** (Onibaba) - Hook into applyDamage for all damage sources, apply passive lifesteal
25. **selfBuffWhileShieldsActive** (Philemon) - Track which allies have shields from skill, maintain buff while any exist
26. **Vraxx finale + resource grant effects** (3 custom effect types) - Implement consume_excess_rage finale, conditional_resource_or_buff, rage_grant with classCondition
27. **ally_low_hp_auto_attack leader skill** (Onibaba) - HP threshold monitoring, auto-skill triggering, once-per-ally tracking

## Code References

### Battle.js Damage Calculation Paths

- Enemy single-target: battle.js:3284-3699
- Random enemies (multiHit): battle.js:4270-4323
- All enemies (AoE): battle.js:4325-4539
- All allies: battle.js:4542-4725
- Self: battle.js:3930-4031
- Ally: battle.js:3796-3928

### Valor-Consuming Skills

- Single-hit: battle.js:3366-3408 (Judgment of Steel pattern)
- Multi-hit: battle.js:3327-3363 (Crushing Eternity pattern)

### Effect Application

- resolveEffectValue: battle.js:1300-1370 (handles Valor scaling)
- applyEffect: battle.js:1400-1580
- shouldApplyEffect: battle.js:1340-1345 (valorThreshold check)

### Resource Restoration

- resourceRestore: battle.js:3963-3999 (handles Rage/Focus/Valor/MP/Essence)

### Tracking Systems

- Blood Tempo: battle.js:3251 (processSkillForBloodTempoTracking)
- Heartbreak stacks: battle.js:3737 (onKillGrantHeartbreakStacks)

## Architecture Notes

### Damage Calculation Pattern

All damage paths follow this structure:
1. Calculate base multiplier (damagePercent, Valor scaling, or parse description)
2. Add shard bonus
3. Add conditional bonuses (Heartbreak, Volatility, etc.)
4. Calculate damage with DEF reduction
5. Apply crit and spell amp
6. Process FLE pre-damage
7. applyDamage() with interception chain
8. Post-damage effects (lifesteal, heal allies, etc.)

### Missing Conditional Systems

- Target status checks (ifMarked, ifDebuffed, etc.) happen BEFORE damage calc
- Caster status checks (conditionalDamage based on hero HP) also before calc
- Post-hit effects (onKill, onSkillUse) happen AFTER applyDamage

### Valor Scaling Resolver

`getSkillDamage(skill, hero)` at battle.js:~1220 handles Valor-tier resolution. Returns:
- `damage.base` if Valor 0-24
- `damage.at25` if Valor 25-49
- `damage.at50` if Valor 50-74
- `damage.at75` if Valor 75-99
- `damage.at100` if Valor 100
- null if skill has no Valor scaling

Same pattern should work for `conditionalBonusDamage.bonusPercent`, `valuePerAlly`, etc.

## Open Questions

1. **Vashek's allySaveOnce**: Where in damage flow should interception happen? Before applyDamage (like Divine Sacrifice)? Or inside applyDamage death check?

2. **Grateful Dead's riposteLifesteal**: Riposte currently reflects damage to attacker. Should lifesteal heal the Riposte user (defender) or the attacker? Assume defender.

3. **Onibaba's Grandmother's Vigil**: Should auto-skill consume MP? Assume yes (uses Soul Siphon's mpCost: 0, so no issue).

4. **Philemon's selfBuffWhileShieldsActive**: Should buff persist after shields break? Or only while shields exist? Assume only while shields exist.

5. **Matsuda's Reluctance bypass**: Is Reluctance a status effect or passive property? Check if RELUCTANCE exists in statusEffects.js. If not, implement as stacking debuff.

6. **Shinobi Jin's executeThreshold**: Should execute bypass Death Prevention effects? Assume yes (instant kill = HP set to 0).

7. **Torga's damagePerRage**: Should this work for both multiHit AND single-target rageCost: 'all' skills? Hero only has one skill (Finale of Fury, single-target). Extend pattern.

## Next Steps

1. **Prioritize by hero impact**: Onibaba (5-star), Korrath (5-star), Shinobi Jin (4-star), Philemon (4-star) are higher-rarity heroes with more complex kits
2. **Group by engine area**: Implement all onKill handlers together, all ifMarked checks together, etc.
3. **Test-driven**: Write failing tests for each property, implement until green
4. **Update triage doc**: Mark completed areas after implementation
