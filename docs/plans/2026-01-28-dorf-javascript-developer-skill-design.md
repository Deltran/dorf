# Dorf JavaScript Developer Skill Design

## Overview

A project-specific skill that provides JavaScript expertise tailored to the Dorf codebase. When invoked, it transforms the assistant into a Dorf JS expert with knowledge of project patterns, anti-patterns, and integration with superpowers workflows.

## Location

`.claude/skills/dorf-javascript-developer.md`

## Design Decisions

### Model: Opus
Chosen for maximum capability on expert-level code analysis and implementation.

### Flat Architecture
Single specialist skill rather than hierarchical agents (frontend-developer → vue-expert → js-expert). Reduces token cost and latency while maintaining expertise.

### Skill vs Subagent
Implemented as a skill (not a registered subagent type) because:
- Collaborative work benefits from conversation context
- Superpowers workflows (debugging, TDD) need interactive feedback
- Can still be used as subagent prompt via Task tool when needed

### Dorf-Specific Knowledge
Embeds:
- Project structure conventions
- Critical code patterns (glob imports, Pinia stores, EffectType constants)
- Anti-patterns to avoid

### Superpowers Integration
References these skills for invocation:
- `superpowers:systematic-debugging` - For bug investigation
- `superpowers:test-driven-development` - For feature implementation
- `superpowers:verification-before-completion` - Before claiming done
- `superpowers:receiving-code-review` - When getting feedback

## Usage

Invoke when doing JS-heavy work in Dorf:
- Debugging battle system calculations
- Implementing new store logic
- Refactoring data layer code
- Understanding complex async patterns

## Future Considerations

- Could add a `dorf-vue-developer` skill for component/template work
- Could register as a formal subagent type if dispatch pattern becomes common
- Could expand anti-patterns section as new issues are discovered
