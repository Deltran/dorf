# Hero Editor Admin Feature

Design document for an admin-side hero data editor with guided form UI and raw code editing.

## Overview

Extend the existing AdminScreen with a Hero Editor that allows editing hero stats and skills through an intuitive guided interface, with an optional raw code view for direct file editing.

**Primary use case:** Content authoring workflow — creating or overhauling heroes with a more guided experience than editing raw JS files.

**Secondary use case:** Live tuning during playtesting — tweak stats/skills on the fly to see how they feel.

## Key Features

- Dropdowns and autocomplete for all valid options (targetTypes, EffectTypes, classIds)
- Validation to catch structural errors before saving
- Toggle between guided form view and raw code editor
- Direct file saving to `src/data/heroes/{rarity}/{hero_id}.js`

## Admin Menu Structure

The AdminScreen gets a left sidebar menu with two categories:

```
┌──────────────┐
│  DATA        │
│  ▸ Heroes    │  ← New editor
│  ▸ Enemies   │  ← Disabled/coming soon
│              │
│  ASSETS      │
│  ▸ Hero Art  │  ← Existing viewers
│  ▸ Enemy Art │
│  ▸ Battle BG │
│  ▸ Map Art   │
└──────────────┘
```

**DATA** section is for editors that modify game data files. **ASSETS** section contains the existing image/asset viewers.

"Enemies" appears in the menu but is disabled until that feature is built.

## Hero Selection View

When "Heroes" is selected from the DATA menu:

- Search input for filtering heroes by name
- Rarity dropdown filter (All / 5-star / 4-star / etc.)
- Grid of compact hero cards (reuse HeroCard component)
- Clicking a hero opens the editor view

## Editor Layout

### Header

```
← Back    [Hero Name]                     [Save]
```

- Back button returns to hero selection
- Save button validates and writes to file

### Mode Toggle

```
○ Guided    ● Raw Code
```

Toggle between form-based editing and raw code editing. Both modes stay in sync.

### Tabs

```
[ Basic Info ] [ Stats ] [ Skills ] [ Leader Skill ] [ Finale* ]
```

*Finale tab only appears for Bard class heroes.

Tabs work in both modes:
- **Guided mode:** Each tab shows relevant form fields
- **Raw code mode:** Clicking a tab scrolls to that section in the code

## Guided Mode: Tab Details

### Basic Info Tab

| Field | Type | Notes |
|-------|------|-------|
| ID | Read-only text | Cannot change (would require file rename) |
| Name | Text input | Display name |
| Epithet | Text input | Optional, e.g., "The Radiant Protector" |
| Intro Quote | Text input | Optional, e.g., "Light shall prevail!" |
| Rarity | Dropdown | 1-5 stars with labels (Common, Uncommon, Rare, Epic, Legendary) |
| Class | Dropdown | Pulls from `classes.js` definitions |

### Stats Tab

| Field | Type | Notes |
|-------|------|-------|
| HP | Number input | Required, positive integer |
| ATK | Number input | Required, positive integer |
| DEF | Number input | Required, positive integer |
| SPD | Number input | Required, positive integer |
| MP | Number input | Required, positive integer |

Contextual note below MP explaining what it means for the selected class (e.g., "MP is used for Faith resource (Paladin)").

### Skills Tab

**Layout:** List + detail panel

- Left side: Ordered list of skill names (1-4 typically)
- Right side: Detail panel for selected skill

**Skill Detail Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Name | Text input | Skill display name |
| Description | Textarea | User-facing description |
| Unlock Level | Dropdown | 1 / 3 / 6 / 12 |
| Target | Dropdown | enemy, ally, self, all_enemies, all_allies, random_enemies |

**Damage Section:**

| Field | Type | Notes |
|-------|------|-------|
| Damage % | Number | Percentage of ATK as damage |
| Ignore DEF % | Number | Optional, percentage of target DEF to ignore |
| Use Stat | Dropdown | Optional override: atk, def, spd |
| Multi-hit | Number | Optional, number of attacks |

**Cost Section (dynamic based on class):**

| Class | Fields Shown |
|-------|--------------|
| Paladin, Mage, Cleric, Druid | MP Cost |
| Berserker | Rage Cost (number or "all") |
| Knight | Valor Required |
| Alchemist | Essence Cost |
| Ranger, Bard | No cost fields (skills are free) |

**Healing Section (optional fields):**

| Field | Type | Notes |
|-------|------|-------|
| Heal % | Number | Heal target as % of caster's ATK |
| Heal Self % | Number | Lifesteal as % of damage dealt |
| Heal Allies % | Number | Heal all allies as % of damage dealt |

**Effects Section:**

Inline list of effect cards. Each effect card contains:

| Field | Type | Notes |
|-------|------|-------|
| Type | Dropdown | All EffectTypes from statusEffects.js, with icon |
| Target | Dropdown | self, enemy, ally, all_enemies, all_allies |
| Duration | Number | Turns the effect lasts |
| (Dynamic fields) | Varies | Based on effect type |

**Dynamic fields by effect type:**

| Effect Type | Additional Fields |
|-------------|-------------------|
| ATK_UP, DEF_UP, SPD_UP, etc. | value (%) |
| BURN | burnDamage (% ATK per turn) |
| POISON | value (% ATK per turn) |
| SHIELD | shieldHp |
| DAMAGE_REDUCTION | value (%) |
| EVASION | value (%) |
| GUARDIAN_LINK | redirectPercent, guardianId |
| DIVINE_SACRIFICE | damageReduction, healPerTurn |
| STUN, SLEEP | (no extra fields) |
| TAUNT | (no extra fields) |
| MARKED | value (% increased damage taken) |
| THORNS | value (% reflect) |
| REGEN | value (% max HP per turn) |

Actions:
- [+ Add Effect] button with effect type dropdown
- [× Remove] button on each effect card

### Leader Skill Tab

**For 5-star heroes:**

| Field | Type | Notes |
|-------|------|-------|
| Name | Text input | Leader skill name |
| Description | Textarea | User-facing description |

**Effects list** (similar to skill effects, but with leader-specific types):

| Field | Type | Notes |
|-------|------|-------|
| Type | Dropdown | passive, timed, passive_regen |

**Dynamic fields by type:**

| Type | Fields |
|------|--------|
| passive | stat (dropdown), value (%), condition (optional) |
| timed | triggerRound, target, apply (nested effect config) |
| passive_regen | target, percentMaxHp |

**Condition builder (for passive type):**

| Field | Type | Notes |
|-------|------|-------|
| Filter by | Dropdown | Class, Role |
| Class/Role | Dropdown | Specific value |
| Exclude? | Checkbox | If checked, applies to NOT the selected value |

**For non-5-star heroes:**

Display disabled message: "Leader skills are only available for 5-star (Legendary) heroes."

### Finale Tab (Bards Only)

Only visible when class is Bard.

| Field | Type | Notes |
|-------|------|-------|
| Name | Text input | Finale name |
| Description | Textarea | User-facing description |
| Target | Dropdown | all_allies, all_enemies |

**Effects list:** Same structure as skill effects.

## Raw Code Mode

Full-file text editor with:

- Monospace font
- Line numbers
- Syntax highlighting (if feasible)
- Tab navigation scrolls to relevant section
- Live syntax error display below editor

Changes sync bidirectionally with guided mode.

## Validation

### Field-Level (Guided Mode)

Inline error messages below fields:
- "Must be a number"
- "Required field"
- "Invalid value"

### Save-Time Validation

Full schema validation before writing file:

**Required fields:**
- id, name, rarity, classId
- baseStats: hp, atk, def, spd, mp
- At least 1 skill

**Type checks:**
- Numbers are valid positive integers
- Strings are non-empty where required

**Enum checks:**
- targetType must be valid value
- EffectType must exist in statusEffects.js
- classId must exist in classes.js
- Rarity must be 1-5

**Effect-specific validation:**
- BURN requires burnDamage
- SHIELD requires shieldHp
- GUARDIAN_LINK requires redirectPercent
- Duration required for most effects

**Error display:**

```
❌ Cannot save - 3 errors:

• Skills[2] "Guardian Link": Missing duration on GUARDIAN_LINK effect
• Skills[3] "Radiant Burst": damagePercent must be a positive number
• baseStats.hp: Required field
```

### Success Feedback

Toast notification: "✓ Saved aurora_the_dawn.js"

## File Structure

New/modified files:

```
src/
  screens/
    AdminScreen.vue          # Modify: add sidebar menu, hero editor section
  components/
    admin/
      AdminSidebar.vue       # New: left sidebar menu
      HeroEditor.vue         # New: main editor container
      HeroEditorBasicInfo.vue    # New: Basic Info tab
      HeroEditorStats.vue        # New: Stats tab
      HeroEditorSkills.vue       # New: Skills tab with list+detail
      HeroEditorLeaderSkill.vue  # New: Leader Skill tab
      HeroEditorFinale.vue       # New: Finale tab (Bards)
      HeroEditorRawCode.vue      # New: Raw code editor
      SkillEffectEditor.vue      # New: Reusable effect card editor
  utils/
    heroValidator.js         # New: validation logic
    heroSerializer.js        # New: convert between object and JS file string
```

## Future Considerations

- **Enemy Editor:** Same patterns, different data shape. Sidebar already accommodates this.
- **Balance auditing:** Could add comparative stats view (average stats by rarity, etc.)
- **Undo/redo:** Not in initial scope, but could add history stack
- **Diff view:** Show changes before saving
