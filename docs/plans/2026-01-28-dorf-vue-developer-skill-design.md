# Dorf Vue Developer Skill Design

## Overview

A project-specific skill that provides Vue 3 expertise tailored to the Dorf codebase. Covers component architecture, composable extraction, reactivity best practices, performance, and accessibility.

## Location

`.claude/skills/dorf-vue-developer.md`

## Design Decisions

### Model: Opus
Chosen for maximum capability on architectural decisions and component decomposition.

### Scope: Vue & Architecture
Covers component/template/reactivity concerns. JavaScript logic concerns are handled by the separate `dorf-javascript-developer` skill.

### Pattern-Based Guidance Over Static Snapshots
Rather than listing specific files that need refactoring, the skill teaches patterns to watch for (e.g., "screens exceeding ~300 lines"). This prevents the skill from going stale as the codebase evolves.

### Decomposition Guidelines
Concrete size targets and decision criteria for when to extract:
- Child components: visual identity, reuse, independence
- Composables: logic reuse, cohesive state clusters, testability

### Accessibility
Includes minimum standards and Dorf-specific considerations. Not exhaustive, but establishes a baseline for game UI elements (cards, modals, combat actions).

### Superpowers Integration
References the same four workflow skills as `dorf-javascript-developer`:
- `superpowers:systematic-debugging`
- `superpowers:test-driven-development`
- `superpowers:verification-before-completion`
- `superpowers:receiving-code-review`

## Companion Skills

- `dorf-javascript-developer` - For JS logic, store patterns, data layer

## Future Considerations

- Could add CSS/styling guidance section if needed
- Could expand accessibility section as game UI grows
- Could add animation patterns section (transitions, combat effects)
