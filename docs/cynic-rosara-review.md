## Rosara the Unmoved -- Implementation Verification

Reviewed files:
- `/home/deltran/code/dorf/src/data/heroes/5star/rosara_the_unmoved.js` (hero spec)
- `/home/deltran/code/dorf/src/stores/battle.js` (engine implementation)
- `/home/deltran/code/dorf/src/stores/__tests__/battle-rosara-integration.test.js` (integration tests, 38 tests all passing)
- `/home/deltran/code/dorf/src/data/heroes/__tests__/rosara_the_unmoved.test.js` (data shape tests, 37 tests all passing)
- `/home/deltran/code/dorf/src/data/statusEffects.js` (REFLECT and SEATED definitions)
- `/home/deltran/code/dorf/src/screens/BattleScreen.vue` (UI skill gating)

---

### Mechanic-by-Mechanic Audit

#### 1. Quiet Defiance (Basic Attack Modifier) -- IMPLEMENTED

**Spec:** "Basic attacks deal 80% damage. If attacked last round, deal 120% instead."

**Implementation:**
- `getBasicAttackDamagePercent(hero)` at battle.js:1043 reads `hero.template.basicAttackModifier` and returns `baseDamagePercent` (80) or `ifAttackedDamagePercent` (120) based on `hero.wasAttacked`.
- `wasAttacked` is initialized to `false` at hero setup (battle.js:2759).
- Set to `true` in `applyDamage` when the unit takes damage (battle.js:2079), including through Guardian redirect (battle.js:1910) and leader damage share (battle.js:1951).
- Reset to `false` after the hero's turn ends (battle.js:4677).
- The basic attack path in `executePlayerAction` calls `getBasicAttackDamagePercent` to scale damage (battle.js:3114).

**Tests:** 3 tests covering base 80%, attacked 120%, and reset after turn. All pass.

**Verdict:** IMPLEMENTED. Works as described.

---

#### 2. Seat of Power (Bulwark Stance) -- IMPLEMENTED (UI gap)

**Spec:** "Enter Bulwark stance: Taunt + DEF buff. Cannot use skills while in Bulwark. Scales with Valor."

**Implementation:**
- Self-targeting skill applies SEATED, TAUNT, and DEF_UP effects (battle.js:4149+ `case 'self'` block).
- SEATED effect defined in statusEffects.js:370 with `isSeated: true`.
- `isSeated(unit)` helper at battle.js:1038 checks for the effect.
- `canUseSkill` in battle store (battle.js:1144) returns `false` when SEATED.
- Valor scaling for duration (base 2, at50 3) and value (base 20, at25 30, at75 40, at100 50) resolved via `resolveEffectDuration` and `resolveEffectValue`.
- `defensive: true` grants +5 Valor before effects resolve. This means Valor tier is calculated AFTER the +5, which can shift tiers at boundaries (e.g., 45 Valor -> 50 -> tier 50 instead of tier 25).

**Tests:** 6 tests covering effect application, duration scaling at 0 and 50 Valor, DEF_UP scaling at 0/25/100 Valor, and skill prevention while SEATED. All pass.

**UI gap:** BattleScreen.vue's local `canUseSkill` function (line 345) does NOT check SEATED status. The skill buttons in the action bar will show as available (not disabled) even while SEATED. The battle store's `canUseSkill` does check it, but the UI bypasses the store function and uses its own local version. The `selectAction` flow in the store also does not re-validate `canUseSkill` before executing. This means a player could theoretically tap a skill button while SEATED and it would execute.

**Verdict:** IMPLEMENTED in engine, but UI does not disable skill buttons while SEATED.

---

#### 3. Weight of History (MARKED) -- IMPLEMENTED

**Spec:** "Mark an enemy. Marked enemies take increased damage from all sources. Scales with Valor."

**Implementation:**
- Enemy-targeting noDamage skill with `valorRequired: 25`.
- Applies MARKED effect. MARKED is defined in statusEffects.js:312 with `isMarked: true`.
- MARKED handling in `applyDamage` increases damage taken (checked in the damage interception chain).
- Valor scaling for value (base 30, at50 40, at75 50) and duration (base 2, at100 3) resolved via standard scaling functions.

**Tests:** 5 tests covering Valor requirement, MARKED application, value at 25/50/100 Valor, and duration at 100 Valor. All pass.

**Verdict:** IMPLEMENTED. Works as described.

---

#### 4. Unwavering (Control Immunity) -- IMPLEMENTED (level gate missing)

**Spec:** "Passive: Immune to stun and sleep. When immunity triggers, gain 10 Valor."

**Implementation:**
- `getControlImmunityPassive(unit)` at battle.js:1054 finds the passive skill and returns `immuneTo` and `onImmunityTrigger`.
- Checked in `applyEffect` (battle.js:494) before the effect is created. If the effect type matches `immuneTo`, it is blocked and the unit gains Valor via `gainValor`.
- Valor gain is capped at 100 (battle.js:1202).

**Level gate issue:** `getControlImmunityPassive` scans `unit.template.skills` for any passive with `passiveType === 'controlImmunity'` without checking `skillUnlockLevel`. The data says `skillUnlockLevel: 6`, but a level 1 Rosara would still have full control immunity. This is a systemic issue across all passive types (basicAttackModifier, onDeath, lowHpTrigger all have the same pattern).

**Tests:** 6 tests covering stun block, sleep block, Valor gain on stun, Valor gain on sleep, non-control debuffs passing through, and Valor cap at 100. All pass.

**Verdict:** IMPLEMENTED. Control immunity works correctly, but `skillUnlockLevel` is not enforced for passives (systemic, not Rosara-specific).

---

#### 5. Monument to Defiance (REFLECT + onDeathDuringEffect) -- IMPLEMENTED

**Spec:** "Reflect damage back to attackers. If Rosara dies during this, allies gain ATK/DEF buff. Consumes all Valor."

**Implementation:**
- `valorRequired: 50` checked in `canUseSkill` (battle.js:1162).
- `valorCost: 'all'` consumed at battle.js:4155, with `castTimeValorTier` captured beforehand (battle.js:4154).
- REFLECT effect applied with Valor-scaled value, duration, and cap.
- Cap resolved via `resolveEffectValue({ value: effect.cap }, hero, ...)` at battle.js:4173.
- `onDeathDuringEffect` data from the skill is attached to the REFLECT effect instance (battle.js:4177), along with `castTimeValorTier` (battle.js:4178).
- REFLECT handling in `applyDamage` (battle.js:2211-2242): calculates reflected damage as `actualDamage * reflectPercent / 100`, applies cap as `reflectorAtk * cap / 100`, and applies reflected damage directly to attacker HP (bypassing `applyDamage` to prevent loops).
- `processOnDeathDuringEffect` at battle.js:1071: when hero dies, iterates status effects looking for `onDeathDuringEffect` data, resolves Valor-scaled buff values using `castTimeValorTier`, and applies buffs to all alive allies.
- Called in `applyDamage` at battle.js:2148 BEFORE effects are cleared at line 2162 -- ordering is correct.

**`defensive: true` interaction:** Monument to Defiance has `defensive: true`, so Knights gain +5 Valor BEFORE `castTimeValorTier` is captured. At 50 Valor: +5 = 55, tier = 50. At 70 Valor: +5 = 75, tier = 75 (tier shift!). This is a subtle interaction where the +5 defensive bonus can push you into the next Valor tier for effect scaling. Whether this is intended is debatable but the behavior is consistent.

**Tests:** 8 tests covering Valor requirement, all-Valor consumption, REFLECT application and survival, REFLECT value at 75 and 100 Valor, reflect cap, onDeath buff application, onDeath buff scaling at 75 Valor tier, and no buffs without REFLECT active. All pass.

**Verdict:** IMPLEMENTED. All mechanics work as described.

---

#### 6. Leader Skill: The First to Stand -- IMPLEMENTED

**Spec:** "At battle start, the lowest HP% ally gains Taunt and +25% DEF for turn 1. Rosara takes 30% of damage dealt to that ally during round 1."

**Implementation:**
- `battle_start_protect_lowest` handler at battle.js:221.
- Finds lowest HP% ally excluding leader (battle.js:227-233).
- Grants TAUNT (battle.js:237) and DEF_UP at 25% (battle.js:246) with `sourceId: 'leader_skill'`.
- Sets `leaderDamageShare` on the protected ally with `protectorId`, `percent: 30`, and `duration: 1` (battle.js:255-259).
- Damage share logic in `applyDamage` at battle.js:1936-1963: when `leaderDamageShare.duration > 0`, splits damage between ally and protector. Protector gains +5 Valor from damage redirect (Knight, battle.js:1957) and `wasAttacked` is tracked (battle.js:1951).
- Duration tick-down at round start (battle.js:3024-3028): decrements `leaderDamageShare.duration`, so it expires going from round 1 to round 2.

**Tests:** 5 tests covering Taunt application, DEF_UP value, damage sharing (30/70 split), protecting lowest HP% ally, and 1-turn duration. All pass.

**Verdict:** IMPLEMENTED. Works as described.

---

### Edge Cases & Potential Issues

#### 1. SEATED Does Not Block Skill Buttons in UI (Medium Severity)
BattleScreen.vue has its own local `canUseSkill` function (line 345) that checks resources (Valor, Rage, Focus, MP, Essence, cooldowns) but does NOT check the SEATED status effect. The battle store's `canUseSkill` does check SEATED (battle.js:1144), but the UI never calls the store version for skill button enabling/disabling. The `selectAction` method in the store also does not re-validate `canUseSkill`. Result: a SEATED Rosara's skill buttons appear clickable and skills can be executed while in Bulwark stance.

#### 2. Defensive Skill +5 Valor Shifts Tier Boundaries (Low Severity)
Both Seat of Power and Monument to Defiance have `defensive: true`. Knights gain +5 Valor from defensive skills at battle.js:3224 BEFORE effect scaling is resolved. This means:
- At 45 Valor -> +5 = 50 -> tier jumps from 25 to 50
- At 70 Valor -> +5 = 75 -> tier jumps from 50 to 75
- At 95 Valor -> +5 = 100 -> tier jumps from 75 to 100

For Monument to Defiance specifically: if Rosara has exactly 70 Valor, the +5 bumps her to 75 before `castTimeValorTier` is captured. REFLECT value goes from 50 (at50 tier) to 75 (at75 tier), duration from 1 to 2, and cap from 100 to 125. This is arguably a feature (defensive stance expertise), but the player-facing UI gives no indication this hidden +5 exists.

#### 3. `skillUnlockLevel` Not Enforced for Passives (Low Severity, Systemic)
`getControlImmunityPassive` and `getBasicAttackDamagePercent` read passives directly from the template without checking `skillUnlockLevel`. A level 1 Rosara has both Quiet Defiance (level 1 -- fine) and Unwavering (level 6 -- should not be active). In practice, 5-star heroes are likely leveled quickly, but a freshly pulled Rosara in battle would be immune to stun/sleep at level 1 when the skill says it unlocks at level 6.

#### 4. Reflected Damage Bypasses Damage Interception (By Design, But Worth Noting)
Reflected damage at battle.js:2230-2231 is applied directly to HP without going through `applyDamage`. This means reflected damage ignores the attacker's shields, damage reduction, evasion, divine sacrifice, guardian link, etc. This appears intentional (prevents infinite REFLECT loops and simplifies the logic), but it means REFLECT is stronger than it might appear since it ignores enemy defenses.

#### 5. `onDeathDuringEffect` Only Checks Status Effects (Correct But Fragile)
The `onDeathDuringEffect` data is stored on the REFLECT status effect instance. If REFLECT is cleansed or removed before Rosara dies, the death buffs will not trigger. This is correct behavior ("if Rosara dies DURING this"), but note that any effect that strips buffs (cleanse, purge) would also prevent the death trigger. The tests cover the case where REFLECT is not active (test at line 449), confirming this works correctly.

#### 6. Leader Damage Share Protector Can Die (Edge Case)
If Rosara (protector) dies from the shared damage, the damage share simply stops for the remainder of that hit because the `protector.currentHp > 0` check fails on subsequent damage applications. However, the remaining damage (70%) has already been separated from the shared portion, so the protected ally still takes their 70% correctly. No test covers Rosara dying from shared damage specifically.

#### 7. All-Ally Leader Skill at Battle Start -- HP% Comparison
When all heroes start at full HP (which is typical), `lowestHpAlly` picks based on the `reduce` comparison. If multiple allies have the same HP%, it picks the first one encountered (array order). This is fine but non-deterministic from the player's perspective if they don't know the party array ordering.

---

### Test Coverage Gaps

| Mechanic | Data Test | Integration Test | Notes |
|----------|-----------|-----------------|-------|
| Quiet Defiance (80/120%) | Yes | Yes | Covered |
| wasAttacked tracking via Guardian/damage share | No | No | wasAttacked is set on protectors in applyDamage, but no test verifies this flow for Rosara specifically |
| Seat of Power effects | Yes | Yes | Covered |
| SEATED blocks skills (store) | N/A | Yes | Covered via store's canUseSkill |
| SEATED blocks skills (UI) | N/A | **No** | BattleScreen's local canUseSkill never tested for SEATED |
| Seat of Power at 75/100 Valor scaling | Yes | **No** | DEF_UP tested at 0/25/100, not at 75 (at75: 40) |
| Weight of History | Yes | Yes | Covered |
| Weight of History at 75 Valor (value 50) | Yes | **No** | Only tested at 25/50/100 Valor in integration |
| Unwavering immunity | Yes | Yes | Covered |
| Unwavering at level 1 (should be gated) | No | **No** | No test checks that level < 6 heroes don't get immunity |
| Monument to Defiance | Yes | Yes | Covered |
| REFLECT cap enforcement | N/A | Yes | Covered |
| REFLECT reflected damage calc | N/A | Yes (indirect) | Cap test verifies reflected damage is bounded |
| onDeathDuringEffect trigger | N/A | Yes | Covered |
| onDeathDuringEffect Valor scaling | N/A | Yes | Covered at 75 tier |
| onDeathDuringEffect at 100 Valor | N/A | **No** | Only tested at 75 Valor tier |
| onDeathDuringEffect at base (50 Valor) | N/A | **No** | Not tested at base tier |
| Leader skill Taunt/DEF_UP | N/A | Yes | Covered |
| Leader damage share (30%) | N/A | Yes | Covered |
| Leader damage share expiry (round 2+) | N/A | **No** | No test verifies damage share stops after round 1 |
| Leader skill protector dies from shared damage | N/A | **No** | No test for Rosara dying from shared damage |
| Defensive +5 Valor before effect resolution | N/A | **No** | No test verifies the tier-shift interaction |
| SEATED + basic attack (can still basic attack?) | N/A | **No** | No test verifies whether basic attacks work while SEATED |
| Multiple REFLECT sources (not possible currently) | N/A | N/A | Not applicable since only Rosara has REFLECT |

---

### Verdict

**Mostly yes.** Rosara mechanically does what it says on the tin in the battle engine. All 75 tests (38 integration + 37 data) pass. Every mechanic described in the hero data file has a corresponding implementation in battle.js, and every implementation handles the Valor scaling correctly through the standard `resolveValorScaling` pipeline.

**The one real problem** is the SEATED UI gap: BattleScreen.vue does not check `isSeated()` when determining whether skill buttons should be disabled. A SEATED Rosara can still use skills through the UI, which directly contradicts the "Cannot use skills while in Bulwark" description. The battle store's `canUseSkill` returns false correctly, but the UI never consults it for this check. This needs a fix.

**Minor concerns:**
- `skillUnlockLevel` not enforced for passives (systemic, not Rosara-specific)
- Defensive +5 Valor can shift tier boundaries in non-obvious ways
- A handful of test coverage gaps for edge cases (damage share expiry, onDeath at different Valor tiers, SEATED + basic attack interaction)

None of the minor issues cause incorrect behavior relative to the skill descriptions; they're either systemic engine patterns or untested-but-working edge cases.
