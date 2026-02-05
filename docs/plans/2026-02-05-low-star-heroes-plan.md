# Low-Star Hero Expansion Plan

**Date:** 2026-02-05
**Status:** Ready for implementation
**Goal:** Add 2 new 1-star and 2 new 2-star heroes to fill critical roster gaps

## Summary

| Rarity | Name | Class | Role | Gap Filled |
|--------|------|-------|------|------------|
| 1-star | Gromm, Ditch Digger | Knight | Tank | No 1-star tanks exist |
| 1-star | Veska, Rat Catcher | Mage | DPS | No 1-star mages exist |
| 2-star | Knuckle Bess | Berserker | DPS | 2-tier gap (1-star to 3-star) |
| 2-star | Cobb Rattlebag | Bard | Support | No 2-star supports exist |

---

## Hero 1: Gromm, Ditch Digger

**File:** `src/data/heroes/1star/ditch_digger.js`
**Export:** `ditch_digger`

### Concept
Conscripted trench-digger who grabbed a fallen soldier's shield during a rout. Too stubborn to run, too dumb to know better. He's not brave - he just doesn't process fear fast enough to act on it.

### Stats
```js
baseStats: { hp: 75, atk: 15, def: 22, spd: 10 }
```
*Tankiest 1-star, slow but durable. No mp (Knight uses Valor).*

### Skills

**1. Dig In** (Level 1, valorRequired: 0)
- Description: "Brace behind the shield. Gain +20% DEF for 2 turns."
- targetType: 'self'
- noDamage: true
- effects: [{ type: DEF_UP, target: 'self', duration: 2, value: 20 }]

**2. Shield Bash** (Level 3, valorRequired: 0)
- Description: "Deal 90% ATK damage to one enemy."
- targetType: 'enemy'
- damagePercent: 90

**3. Provoke** (Level 6, valorRequired: 0)
- Description: "Taunt all enemies for 1 turn. Gain +10% DEF."
- targetType: 'self'
- noDamage: true
- effects: [{ type: TAUNT, target: 'self', duration: 1 }, { type: DEF_UP, target: 'self', duration: 2, value: 10 }]

**4. Last Stand** (Level 12, valorRequired: 25)
- Description: "Deal 100% ATK damage to one enemy. If below 50% HP, also gain DAMAGE_REDUCTION 20% for 2 turns."
- targetType: 'enemy'
- damagePercent: 100
- conditionalSelfBuff: { conditional: { condition: { stat: 'hpPercent', below: 50 }, effect: { type: 'damage_reduction', duration: 2, value: 20 } } }

### Lore
```
epithet: 'The Immovable Oaf'
introQuote: 'They said hold the line. Didn't say for how long.'
lore: 'Gromm was digging latrines when the enemy broke through. He picked up a dead man's shield because it was closer than his shovel. Three hours later, he was still standing in the same spot, confused but unbroken. The officers called it heroism. Gromm calls it "not knowing where else to go."'
```

---

## Hero 2: Veska, Rat Catcher

**File:** `src/data/heroes/1star/rat_catcher.js`
**Export:** `rat_catcher`

### Concept
Sewer worker who inhaled so much toxic miasma that she developed an affinity for poison magic. She doesn't cast spells so much as exhale concentrated filth. The rats follow her now, though she's not sure why.

### Stats
```js
baseStats: { hp: 45, atk: 25, def: 8, spd: 11, mp: 45 }
```
*Glass cannon. Lowest HP of any 1-star but decent ATK for her rarity.*

### Skills

**1. Noxious Breath** (Level 1, mpCost: 8)
- Description: "Deal 100% ATK damage to one enemy."
- targetType: 'enemy'
- damagePercent: 100

**2. Sewer Gas** (Level 3, mpCost: 12)
- Description: "Deal 60% ATK damage to all enemies."
- targetType: 'all_enemies'
- damagePercent: 60

**3. Plague Touch** (Level 6, mpCost: 14)
- Description: "Deal 80% ATK damage and poison the target for 15% ATK for 2 turns."
- targetType: 'enemy'
- damagePercent: 80
- effects: [{ type: POISON, target: 'enemy', duration: 2, atkPercent: 15 }]

**4. Rat Swarm** (Level 12, mpCost: 20)
- Description: "Deal 40% ATK damage 4 times to random enemies."
- targetType: 'random_enemies'
- damagePercent: 40
- hits: 4

### Lore
```
epithet: 'The Miasma'
introQuote: 'You get used to the smell. Eventually.'
lore: 'Veska spent fifteen years in the sewers beneath the capital, breathing air that would kill a normal person in minutes. Something changed in her lungs, her blood, her very essence. Now she exhales poison and communes with vermin. The Rat Catchers' Guild considers her their greatest success and their most disturbing failure.'
```

---

## Hero 3: Knuckle Bess

**File:** `src/data/heroes/2star/knuckle_bess.js`
**Export:** `knuckle_bess`

### Concept
Bare-knuckle pit fighter who fought her way out of debt, one broken nose at a time. She's not angry - she's methodical. Violence is just work, and Bess has always been a hard worker.

### Stats
```js
baseStats: { hp: 85, atk: 38, def: 15, spd: 9 }
```
*Higher ATK than Farm Hand, slightly tankier. Classic Berserker stat line.*

### Skills

**1. Jab-Jab** (Level 1, rageCost: 15)
- Description: "Deal 50% ATK damage twice to one enemy."
- targetType: 'enemy'
- damagePercent: 50
- multiHit: 2

**2. Body Blow** (Level 3, rageCost: 25)
- Description: "Deal 110% ATK damage to one enemy. Reduce their ATK by 10% for 2 turns."
- targetType: 'enemy'
- damagePercent: 110
- effects: [{ type: ATK_DOWN, target: 'enemy', duration: 2, value: 10 }]

**3. Roll With It** (Level 6, rageCost: 20)
- Description: "Gain +15% DEF and +10% ATK for 2 turns."
- targetType: 'self'
- noDamage: true
- effects: [{ type: DEF_UP, target: 'self', duration: 2, value: 15 }, { type: ATK_UP, target: 'self', duration: 2, value: 10 }]

**4. Haymaker** (Level 12, rageCost: 'all')
- Description: "Deal 80-200% ATK damage based on Rage consumed. Minimum 40 Rage."
- targetType: 'enemy'
- rageScaling: { minRage: 40, minDamage: 80, maxDamage: 200 }

### Lore
```
epithet: 'The Debt Collector'
introQuote: 'Nothing personal. Just business.'
lore: 'Bess owed money to the wrong people. They gave her a choice: the fighting pits or the bottom of the river. Fifty-seven fights later, she walked out debt-free with a reputation that follows her like a shadow. She doesn't enjoy violence, but she's very, very good at it.'
```

---

## Hero 4: Cobb Rattlebag

**File:** `src/data/heroes/2star/cobb_rattlebag.js`
**Export:** `cobb_rattlebag`

### Concept
Former executioner's assistant who read death sentences and announced hangings. The Gibbet Crow. His voice carries the weight of every soul he's helped send off. He doesn't sing - he pronounces doom.

### Stats
```js
baseStats: { hp: 75, atk: 20, def: 22, spd: 15, mp: 60 }
```
*Supportive stat line - decent bulk, high SPD to get debuffs out early. Low ATK is fine for a debuffer.*

### Finale
```js
finale: {
  name: 'The Sentence',
  description: 'Pronounce final judgment on all enemies, marking them for death.',
  target: 'all_enemies',
  effects: [
    { type: EffectType.MARKED, duration: 2, value: 15 },
    { type: EffectType.ATK_DOWN, duration: 2, value: 10 }
  ]
}
```

### Skills

**1. Read the Charges** (Level 1)
- Description: "Mark one enemy, increasing damage they take by 15% for 2 turns."
- targetType: 'enemy'
- noDamage: true
- effects: [{ type: MARKED, target: 'enemy', duration: 2, value: 15 }]

**2. Toll the Bell** (Level 3)
- Description: "A solemn toll that slows all enemies. Apply -10% SPD for 2 turns."
- targetType: 'all_enemies'
- noDamage: true
- effects: [{ type: SPD_DOWN, target: 'enemy', duration: 2, value: 10 }]

**3. Final Warning** (Level 6)
- Description: "Pronounce doom on one enemy. Apply -15% ATK and -10% DEF for 2 turns."
- targetType: 'enemy'
- noDamage: true
- effects: [{ type: ATK_DOWN, target: 'enemy', duration: 2, value: 15 }, { type: DEF_DOWN, target: 'enemy', duration: 2, value: 10 }]

**4. The Long Drop** (Level 12)
- Description: "Deal 100% ATK damage to one enemy. If target is MARKED, also apply STUN for 1 turn."
- targetType: 'enemy'
- damagePercent: 100
- conditionalEffects: [{ condition: 'target_has_effect', effectType: 'marked', effects: [{ type: STUN, duration: 1 }] }]

### Lore
```
epithet: 'The Gibbet Crow'
introQuote: 'By order of the court, you are found guilty.'
lore: 'Cobb spent twenty years at the gallows, reading charges and pulling levers. He knows the weight of words - how a sentence can crush hope, how a name read aloud becomes a death. He left the executioner's trade, but the trade never left him. When he speaks, people listen. When he pronounces doom, doom tends to follow.'
```

---

## Implementation Notes

### File Structure
```
src/data/heroes/
  1star/
    ditch_digger.js     (new)
    rat_catcher.js      (new)
    index.js            (update exports)
  2star/
    knuckle_bess.js     (new)
    cobb_rattlebag.js   (new)
    index.js            (update exports)
```

### Index Updates

**1star/index.js** - Add:
```js
export { ditch_digger } from './ditch_digger.js'
export { rat_catcher } from './rat_catcher.js'
```

**2star/index.js** - Add:
```js
export { knuckle_bess } from './knuckle_bess.js'
export { cobb_rattlebag } from './cobb_rattlebag.js'
```

### No New Mechanics Required
All skills use existing battle.js patterns:
- Standard damage/effects
- Taunt
- Rage costs and scaling
- Bard Verse/Finale system
- conditionalSelfBuff (existing pattern from Street Urchin)
- conditionalEffects with target_has_effect (existing pattern)

### Testing
- Verify stat ranges fit within rarity expectations
- Test Knight Valor builds correctly when Gromm takes damage
- Test Bard Verse accumulation and Finale trigger for Cobb
- Test Berserker Rage scaling for Bess's Haymaker
- Verify heroes appear in gacha pool

---

## Design Rationale

### Why These Four?

**Gromm (1-star Knight):** Critical gap - no 1-star tank existed. New players couldn't build a proper frontline until 2-star pulls. Simple valorRequired: 0 kit teaches Knight basics without complexity.

**Veska (1-star Mage):** Mage class didn't appear until 2-star. Introduces MP-based damage dealing at the lowest rarity with straightforward nuke/AoE/DoT kit.

**Knuckle Bess (2-star Berserker):** Two-tier gap between Farm Hand (1-star) and Matsuda (3-star). Rage system actually benefits from low survivability (getting hit builds Rage), so this works well at 2-star.

**Cobb Rattlebag (2-star Bard):** Support role was completely absent at 2-star. Debuff-focused kit (not buff/heal) means low ATK doesn't undermine effectiveness. Distinct from Penny Whistler's "annoying musician" comedy through solemn doom-caller tone.

### Character Design Notes

All four heroes follow the established Dorf pattern of "specific person with specific circumstances" rather than generic fantasy archetypes:
- Gromm isn't "peasant soldier" - he's a confused ditch-digger who didn't know when to stop
- Veska isn't "apprentice mage" - she's a sewer worker mutated by her environment
- Bess isn't "angry barbarian" - she's a methodical professional who treats violence as work
- Cobb isn't "dark bard" - he's a civil servant whose job was announcing deaths
