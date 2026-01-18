# Admin Interface Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Content management interface for editing game data without touching code.

**Architecture:** Hidden `/admin` route (dev mode only) with Vite plugin backend for reading/writing source data files.

**Tech Stack:** Vue 3, Vite dev server plugin, existing data file structure

---

## Overview

**What It Is**
- Admin interface at `/admin` route, only exists in dev mode
- Sidebar navigation with sections for each content type
- Hybrid editing: forms for common fields, JSON editor for advanced
- Full CRUD operations with validation

**Content Types Managed**
| Type | Source File |
|------|-------------|
| Heroes | `src/data/heroTemplates.js` |
| Enemies | `src/data/enemyTemplates.js` |
| Classes | `src/data/classes.js` |
| Status Effects | `src/data/statusEffects.js` |
| Quest Nodes | `src/data/questNodes.js` |
| Items | `src/data/items.js` |

---

## Vite Plugin Backend

**Plugin Responsibilities**
- Expose API endpoints only during dev server (not in build)
- Read data files, parse the exported arrays/objects
- Write back formatted JS with preserved structure

**API Endpoints**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/:contentType` | GET | Fetch all entries for a content type |
| `/api/admin/:contentType` | POST | Create new entry |
| `/api/admin/:contentType/:id` | PUT | Update existing entry |
| `/api/admin/:contentType/:id` | DELETE | Delete entry |

**File Parsing Strategy**
- Data files export arrays/objects (e.g., `export const heroTemplates = [...]`)
- Plugin uses regex or AST parsing to extract the data portion
- On save, reconstructs the file with updated data
- Preserves imports at top of file (for assets like images)

**File Location**
- `vite-plugin-admin.js` in project root or `plugins/` folder

---

## Admin UI Structure

**Route & Layout**
- `/admin` route, only registered when `import.meta.env.DEV`
- Full-page layout with fixed sidebar (no game header/footer)

**Sidebar Navigation**
- Heroes
- Enemies
- Classes
- Status Effects
- Quest Nodes (with Regions subsection)
- Items

**List View (per content type)**
- Table/list of all entries with key columns (id, name, rarity, etc.)
- Search/filter input at top
- "New" button to create entry
- Click row to edit

**Edit View**
- Form panel (slide-in or inline) with fields for the selected entry
- "JSON" tab to switch to raw JSON editor
- Save / Cancel / Delete buttons
- Validation errors displayed inline

**Form Fields (example: Hero)**
- Basic: id, name, classId (dropdown), rarity (1-5 selector)
- Stats: baseHp, baseAtk, baseDef, baseSpd (number inputs)
- Skills: Repeatable section with skill sub-forms
- Leader Skill: Conditional section (only for 5-star)

---

## Validation Rules

**Basic Validation (all content types)**
- Required fields must be present (id, name)
- IDs must be unique within content type
- IDs must be valid format (lowercase, underscores, no spaces)
- Numbers must be positive where appropriate

**Reference Validation**
| Field | Must Reference |
|-------|----------------|
| Hero `classId` | Valid class in `classes.js` |
| Hero skill `effectType` | Valid effect in `statusEffects.js` |
| Enemy `classId` | Valid class in `classes.js` |
| Quest node `connections` | Valid node IDs in same region |
| Quest node `battles[].enemies` | Valid enemy IDs |
| Item `type` | One of: `xp`, `junk` |

**Game Logic Validation**
- Heroes with rarity 5 should have `leaderSkill` defined
- Quest node connections should be bidirectional (warning, not error)
- Skill `mpCost` / `rageCost` / `focusCost` matches class resource type
- Status effect durations must be positive integers

**Validation UX**
- Validate on save attempt
- Show errors inline next to fields
- Block save until errors resolved
- Warnings (non-blocking) shown in yellow

---

## Files to Create

| File | Purpose |
|------|---------|
| `vite-plugin-admin.js` | Vite plugin with file read/write API |
| `src/screens/AdminScreen.vue` | Main admin layout with sidebar |
| `src/screens/admin/HeroesAdmin.vue` | Hero list and edit forms |
| `src/screens/admin/EnemiesAdmin.vue` | Enemy list and edit forms |
| `src/screens/admin/ClassesAdmin.vue` | Class list and edit forms |
| `src/screens/admin/StatusEffectsAdmin.vue` | Status effect list and edit forms |
| `src/screens/admin/QuestsAdmin.vue` | Quest nodes and regions |
| `src/screens/admin/ItemsAdmin.vue` | Item list and edit forms |
| `src/components/admin/JsonEditor.vue` | Reusable JSON editor component |
| `src/components/admin/AdminForm.vue` | Reusable form wrapper with validation |
| `src/utils/adminValidation.js` | Validation rules and helpers |

## Files to Modify

| File | Change |
|------|--------|
| `vite.config.js` | Register admin plugin |
| `src/router/index.js` | Add `/admin` route (dev only) |
