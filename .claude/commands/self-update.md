---
description: Update CLAUDE.md with notes and patterns from the current session
---

# Self-Update CLAUDE.md

Review the current session and update the `CLAUDE.md` file with any new notes, patterns, or important information that would be useful for future development sessions.

## Instructions

1. **Read the current CLAUDE.md file** to understand the existing structure and content.

2. **Review the current session** and identify:
   - New code patterns established (loading data, UI patterns, etc.)
   - New helper functions or utilities created
   - Design decisions made
   - Important file changes or additions
   - Any conventions or standards followed

3. **For each piece of new information:**
   - Determine which section of CLAUDE.md it belongs to
   - Check if similar information already exists
   - If there's a conflict with existing content, present both versions to the user and ask:
     - "Keep existing" - discard the new note
     - "Replace with new" - update with new information
     - "Merge" - combine both pieces of information
   - If no conflict, add the information to the appropriate section

4. **Formatting rules:**
   - Match the existing style and formatting of CLAUDE.md
   - Use code blocks for code patterns
   - Use tables where appropriate (like the rarity table)
   - Keep notes concise and actionable

5. **After making changes:**
   - Show a summary of what was added or updated
   - Do not commit the changes automatically - let the user decide

## Sections in CLAUDE.md

- **Project Overview** - High-level project description
- **Hero Images** - Image locations and loading patterns
- **Rarity System** - Colors and styling for rarities
- **Role Icons** - Icon mappings
- **UI Patterns** - Reusable UI/UX patterns
- **Key Files** - Important files and their purposes

If new information doesn't fit existing sections, propose a new section name to the user before adding it.
