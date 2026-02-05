# Hero Design: The Grand Tournament Banner

**Date:** 2026-02-05
**Request:** July banner — weird dark medieval tournament (jousting, mage duels, beast taming, miracle casting, esoteric). One 5★, one 4★, one 3★. Characters can be combatants OR auxiliary (royalty, attendants, bookies, etc.)

---

## Roster Context

### Critical Gaps Identified

| Gap | Priority | Notes |
|-----|----------|-------|
| **5★ Mage** | Highest | Zero coverage. No legendary mage exists. |
| **5★ Alchemist** | High | Zero coverage despite two 4★ Alchemists. |
| **5★ Cleric** | High | Zero coverage. No legendary healer (Cleric class). |
| **4★ Druid** | High | Zero coverage. Gap between 3★ Bones McCready and three 5★ Druids. |
| **4★ Paladin** | Medium | Zero coverage. Only Aurora at 5★. |
| **3★ Ranger** | High | Zero coverage. Gap between 2★ Fennick and 4★ Swift Arrow/Shinobi Jin. |
| **3★ Alchemist** | Medium | Zero coverage. |

### Missing Leader Skill Types

- SPD passive (no "+X% SPD to all allies")
- MP/Resource regeneration
- Turn manipulation ("allies act first")
- Debuff protection (immunity or cleanse)

---

## Ideas Considered

### From Ideation Agent

| Name | Rarity | Class | Conventionality | Core Hook |
|------|--------|-------|-----------------|-----------|
| Sir Mordecai, The King's Champion | 5★ | Knight | ~80% (Safe) | Jousting charge counters, positional fantasy |
| Lady Elsbeth, Mistress of the Lists | 4★ | Bard | ~45% | Turn order manipulation, performance tracking |
| Tormund the Beast-Master | 4★ | Ranger | ~35% | Delayed beast attacks, timing puzzles |
| Beggar Prince Osric | 3★ | Cleric | ~25% | Wager-based healing with risk/reward |
| The King's Severed Hand | 5★ | Alchemist | ~3% (Tail) | Single-champion anointing, dramatic all-in |

### Gap Analysis Conflict

The ideation concepts don't align with roster gaps:
- **Sir Mordecai (Knight)**: Knights are oversaturated (6 already). Cynic warns against "generic jouster."
- **Lady Elsbeth (Bard)**: Bards have 3 at 4★ already (Chroma, Vraxx, one more).
- **Tormund (Ranger)**: Rangers have 2 at 4★ (Swift Arrow, Shinobi Jin).
- **Beggar Prince Osric (Cleric)**: Cleric has 3★ coverage (Village Healer).
- **The King's Severed Hand (Alchemist)**: **FILLS A REAL GAP** — zero 5★ Alchemists.

---

## Risks & Concerns

### Cynic Warnings

**Tournament Traps to Avoid:**
- Generic jouster/lance knight (Sir Gallan and Philemon already exist)
- "Honorable champion" archetype (Aurora fills noble protector space)
- Counter-attack specialists (reactive, slow SPD tension, 3★ Kensin already has Riposte)
- "Duel" mechanics that isolate heroes from party synergy
- Conditional rules ("if no ally has died") that punish losing states

**5★ Requirements:**
- Must have unique mechanic (Heartbreak, Valor scaling, Verse, coinflip)
- Leader skill needs a "moment" — not just passive numbers
- Must justify pulling over existing 5★s (Shadow King, Aurora, Mara, etc.)

**Dark Fantasy Pitfalls:**
- Edgy without mechanical tie = surface-level
- Grimdark overload breaks tonal balance (need humor: Grateful Dead's politeness, Copper Jack's luck)
- "Weird" needs player control and visual clarity

**Mechanical Red Flags:**
- Overly conditional kits (arbitrary turn numbers, exact buff counts)
- High cost / low payoff skills
- Self-damage without recovery
- "Consume all X" without "build X" skills

---

## Recommended Design

### Approach: Fill Gaps + Keep Best Weird Concept

Based on roster gaps, cynic warnings, and fun factor:

| Slot | Class | Rationale |
|------|-------|-----------|
| **5★** | **Alchemist** | Zero 5★ Alchemists. The King's Severed Hand is memorably weird and fills this gap. |
| **4★** | **Druid** | Zero 4★ Druids. Adapt beast-taming theme to nature magic. Healer role provides value. |
| **3★** | **Ranger** | Zero 3★ Rangers. Adapt gambling concept to archer who bets on his own shots. |

---

### 5★: THE KING'S SEVERED HAND (Alchemist, Support)

**Concept:** A disembodied royal hand, animated by dark alchemy, that crawled into the tournament seeking to crown a champion worthy of its "blessing." Part omen, part curse, part king-maker.

**Kit Philosophy:** Single-champion enabler. The Hand doesn't attack — it anoints one ally and bets everything on them. Uses Essence/Volatility system meaningfully.

**Leader Skill — Divine Right:**
At battle start, automatically anoint the highest ATK ally with +15% ATK for 3 turns. That ally cannot be healed by other allies (only self-healing works).

**Skill Progression:**

| Level | Skill | Type | Description |
|-------|-------|------|-------------|
| 1 | Anoint | Active | Grant target ally +20% ATK for 2 turns. Cost: 15 Essence. |
| 1 | Royal Blessing | Passive | When an anointed ally kills an enemy, the Hand recovers 10 Essence. |
| 3 | Consecrate | Active | Grant target ally Death Prevention (1 turn). Cost: 25 Essence. |
| 6 | Mark of Succession | Active | All damage dealt by target ally heals them for 15% for 2 turns. Cost: 20 Essence. |
| 12 | Coronation | Active | Consume ALL Essence. Grant one ally: +50% ATK, Death Prevention, and Debuff Immunity for 3 turns. If that ally dies during those 3 turns, the Hand dies too. Cost: All Essence (minimum 40). |

**Volatility Integration:**
- Repeated anointings push Essence high → Volatile tier (+30% damage to allies when buffing, but 5% self-damage per skill)
- Creates tension: buff aggressively and risk self-destruction, or conserve and lose power

**Why This Works:**
- Fills 5★ Alchemist gap
- Deeply weird aesthetic (crawling severed hand) fits dark fantasy
- "Coronation" is a dramatic "feel moment" — bet everything on one ally
- Creates new team archetype: "chosen one" comps
- Risk/reward through Volatility is player-controlled

**Cynic Concerns Addressed:**
- Single-target focus could feel limiting → but Leader Skill is automatic, no setup required
- "All-in" could backfire → but Coronation's Death Prevention protects the investment

---

### 4★: THORNWEALD, THE ARENA DRUID (Druid, Healer)

**Concept:** The silent groundskeeper who maintains the tournament arena's magical wards and heals wounded combatants between bouts. He communes with the arena itself — an ancient stone circle that drinks blood and grows thorns. Not a competitor, but the arena is his domain.

**Kit Philosophy:** Delayed healing and battlefield control. His heals grow stronger over time (like thorns growing). Nature resource system (MP-style).

**Skill Progression:**

| Level | Skill | Type | Description |
|-------|-------|------|-------------|
| 1 | Thorn Salve | Active | Heal target ally for 80% ATK. Apply Regeneration (5% max HP/turn for 2 turns). Cost: 20 MP. |
| 1 | Bloodroot | Active | Deal 70% ATK damage to target enemy. If they're below 50% HP, heal lowest HP ally for damage dealt. Cost: 15 MP. |
| 3 | Arena's Embrace | Active | Grant target ally +20% DEF and Thorns (reflect 15% damage taken) for 2 turns. Cost: 25 MP. |
| 6 | Overgrowth | Active | All allies gain Regeneration (3% max HP/turn for 3 turns). Cost: 30 MP. |
| 12 | The Arena Remembers | Active | For 2 turns, whenever an ally takes damage, the attacker takes 20% of that damage as retaliation (arena thorns). Cost: 35 MP. |

**Why This Works:**
- Fills 4★ Druid gap
- Distinct from 5★ Druids (Yggra = regen/nature, Onibaba = soul harvest, Grandmother Rot = poison)
- Thornweald is defensive healer with reflect mechanics — different niche
- "Arena groundskeeper" is non-combatant thematically but integrated mechanically
- Not trying to be "5★ lite" — has own identity (thorns + delayed healing)

**Cynic Concerns Addressed:**
- Could feel passive → Bloodroot provides offensive option tied to healing
- Thorns builds on existing mechanic (Grateful Dead has it) but scales for healer

---

### 3★: LUCKY LYAM, THE BETTING ARCHER (Ranger, DPS)

**Concept:** A tournament archer who bets on his own shots. Former errand boy who discovered he could make more money gambling on himself than running messages. Cocky, scrappy, always calculating odds.

**Kit Philosophy:** Focus-based Ranger with wager mechanics. Bet on your shots — hit the target and gain bonus effects, miss (lose Focus) and take penalties. Simpler than Korrath/Swift Arrow but with its own minigame.

**Skill Progression:**

| Level | Skill | Type | Description |
|-------|-------|------|-------------|
| 1 | Called Shot | Active | Deal 90% ATK damage. If this kills the target, gain +15% ATK for 2 turns. Requires Focus. |
| 3 | Double or Nothing | Active | Deal 110% ATK damage. If target survives, lose Focus. If target dies, recover Focus immediately. Requires Focus. |
| 6 | Trick Shot | Active | Deal 80% ATK damage to target and 50% ATK to adjacent enemy. Apply SPD Down (-15%) for 2 turns. Requires Focus. |
| 12 | All In | Active | Deal 150% ATK damage. If this kills the target, repeat on a random enemy (max 3 times). Requires Focus. |

**Why This Works:**
- Fills 3★ Ranger gap
- Introduces Focus mechanic at accessible rarity
- "Gambling archer" has character (scrappy, calculating) without being edgy
- Clear progression: Called Shot → Double or Nothing → All In
- Early value (Called Shot is solid at level 1) + late-game payoff (All In chain kills)
- Different from Swift Arrow (tempo/debuffs) and Korrath (execute stacking)

**Cynic Concerns Addressed:**
- Could feel like "worse Swift Arrow" → but wager mechanic is distinct identity
- Kill-dependent could frustrate → but bonuses are gravy, base damage is functional
- 3★ stat budget is tight → kit doesn't require high stats to function

---

## Implementation Notes

### New Mechanics Required

**None for core functionality.** All concepts use existing systems:
- Essence/Volatility (Alchemist) — already implemented
- Focus (Ranger) — already implemented
- MP (Druid) — already implemented
- Thorns effect — already exists (Grateful Dead)
- Regeneration effect — already exists
- Death Prevention — already exists

### New Effect Consideration

**Anoint Status (optional):** Could track which ally is "anointed" by The King's Severed Hand for visual clarity. Alternatively, just stack buffs directly without new effect type.

### Stat Budget Guidelines

| Hero | HP | ATK | DEF | SPD | Notes |
|------|-----|-----|-----|-----|-------|
| The King's Severed Hand | Low (100-110) | Mid (40-45) | Low (20-25) | Mid (12-14) | Support, not meant to take hits |
| Thornweald | Mid (120-130) | Mid (35-40) | Mid (25-30) | Low (10-12) | Healer survivability |
| Lucky Lyam | Low-Mid (90-100) | Mid-High (45-50) | Low (18-22) | High (16-18) | Glass cannon archer |

### Banner Theming

**The Grand Tournament — July**
- 5★ The King's Severed Hand (Alchemist) — the cursed blessing
- 4★ Thornweald, The Arena Druid (Druid) — the groundskeeper
- 3★ Lucky Lyam, The Betting Archer (Ranger) — the scrappy gambler

All three are non-traditional tournament participants: a severed hand seeking a champion, a silent groundskeeper, and an errand boy turned gambling archer. Dark fantasy tone with character variety (cosmic horror, quiet nature magic, cocky underdog).

---

## Alternative Directions

### If You Want a Traditional 5★

Replace The King's Severed Hand with a **5★ Mage** (tournament arcane duelist):

**THE ARBITER** — A masked judge who settles disputes through magical combat. First to introduce "magic damage" leader skill (+20% magic damage for all allies).

### If You Want More Weird

Replace Thornweald with **THE ARENA ITSELF** — a 4★ Druid that IS the sentient tournament grounds. Skills are "The Arena Shifts" (position manipulation), "Blood Drinks Deep" (heal from enemy damage), etc.

### If You Want Comedy Relief

Replace Lucky Lyam with **TICKET SCALPER TOM** — a 3★ Ranger who somehow ended up in the tournament bracket and is desperately trying to survive. Skills are about evasion and running away.
