# Tip Popup System Design

## Overview

A reusable one-time popup notification system for tutorial tips and contextual help messages. Tips appear once per player, are dismissed by tapping anywhere or clicking a button, and persist across sessions.

## Requirements

- **Trigger modes:** Both automatic (first encounter of screens/features) AND manual (call from code)
- **Dismissal:** Tap anywhere on overlay OR click "Got it" button
- **Re-viewing:** No - once dismissed, tips are gone forever
- **Visual style:** Speech bubble pointing to anchor element if provided, centered modal if not
- **Persistence:** New Pinia store with localStorage sync

## Architecture

### Files to Create

1. `src/stores/tips.js` - Pinia store for tip state and persistence
2. `src/data/tips.js` - Registry of all tip definitions
3. `src/components/TipPopup.vue` - Global popup component

### Files to Modify

1. `src/App.vue` - Mount TipPopup component globally
2. `src/stores/index.js` - Export tips store
3. `src/components/index.js` - Export TipPopup component
4. Various screens - Add automatic tip triggers on first visit

## Data Structure

### Tip Definition (`src/data/tips.js`)

```js
export const tips = {
  genus_loci_intro: {
    title: 'Genus Loci',
    message: 'These tougher than normal boss fights require a key to access, but yield greater rewards for your merging and summoning needs.',
    anchor: 'genus-loci-list'  // optional - element ID to point at
  },
  explorations_intro: {
    title: 'Explorations',
    message: 'Send heroes on expeditions to gather resources while you\'re away. Higher rank explorations yield better rewards.',
    anchor: 'exploration-panel'
  }
}
```

### Store State (`src/stores/tips.js`)

```js
// Persisted state
seenTips: Set<string>  // Tip IDs the player has dismissed

// Transient state (not persisted)
activeTip: {
  id: string,
  title: string,
  message: string,
  anchor?: string
} | null
anchorElement: HTMLElement | null
```

### Store Actions

- `showTip(tipId, options?)` - Show tip if not already seen. Options can override anchor.
- `dismissTip()` - Mark current tip as seen and hide it
- `loadTips()` - Load seenTips from localStorage on app start
- `saveTips()` - Persist seenTips to localStorage

### LocalStorage

- Key: `dorf_seen_tips`
- Value: Array of tip IDs (serialized Set)

## Component Design

### TipPopup.vue

**Template Structure:**
```
<div class="tip-overlay" @click="dismiss">
  <div class="tip-card" :class="{ 'has-anchor': hasAnchor }" :style="positionStyle" @click.stop>
    <div class="tip-pointer" v-if="hasAnchor"></div>
    <h3 class="tip-title">{{ tip.title }}</h3>
    <p class="tip-message">{{ tip.message }}</p>
    <button class="tip-button" @click="dismiss">Got it</button>
  </div>
</div>
```

**Positioning Logic:**

1. If no anchor or anchor not found: center the card
2. If anchor found:
   - Get anchor's bounding rect
   - Preferred position: below anchor, horizontally centered
   - Flip to above if not enough space below
   - Keep 16px padding from viewport edges
   - Position pointer triangle to point at anchor center

**Styling:**
- Overlay: `rgba(0, 0, 0, 0.7)`
- Card background: `#1f2937`
- Card border: `1px solid #374151`
- Title: White, bold, `1.1rem`
- Message: `#9ca3af`, `0.95rem`
- Button: Gold accent `#f59e0b`, matches existing action buttons
- Pointer: CSS triangle using borders
- Card max-width: `320px`
- Card padding: `16px`
- Border radius: `8px`

## Usage Examples

### Automatic Trigger (in screen component)

```js
// GenusLociListScreen.vue
import { useTipsStore } from '../stores/tips'

onMounted(() => {
  const tipsStore = useTipsStore()
  tipsStore.showTip('genus_loci_intro')
})
```

### Manual Trigger with Custom Anchor

```js
// Show tip pointing at a specific element
tipsStore.showTip('some_tip', { anchor: 'custom-element-id' })
```

### Adding Anchor IDs to Elements

```vue
<div id="genus-loci-list" class="genus-loci-container">
  <!-- content -->
</div>
```

## Initial Tips to Implement

| Tip ID | Screen | Title | Anchor |
|--------|--------|-------|--------|
| `genus_loci_intro` | GenusLociListScreen | Genus Loci | `genus-loci-list` |
| `explorations_intro` | ExplorationsScreen | Explorations | `exploration-panel` |

## Edge Cases

- **Anchor element not in DOM:** Fall back to centered positioning
- **Multiple tips triggered simultaneously:** Only show first one (queue not needed for MVP)
- **Tip shown during battle:** Should still work, overlay covers battle UI
- **Window resize while tip shown:** Recalculate position on resize
