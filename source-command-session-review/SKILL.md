---
name: "source-command-session-review"
description: "End-of-session review — proposes updates to skills, AGENTS.md, and memory based on what happened in this conversation."
---

# source-command-session-review

Use this skill when the user asks to run the migrated source command `session-review`.

## Command Template

Review the current session and propose updates. Scan the conversation for these signals:

## What to Scan For

1. **Tool calls that were rejected** — user pushed back → capture as feedback memory or skill fix
2. **Same tool/command invoked 3+ times** — repetitive workflow → propose automation
3. **Edits to skills/commands files** — skills were already modified → verify they're complete and consistent
4. **Edits to AGENTS.md** — context was added → verify it's still accurate
5. **Memory files written** — decisions were captured → check if AGENTS.md needs matching updates
6. **Renames or terminology changes** — check all files for stale terms
7. **User corrections** — "no, do it this way" → should this be a memory or a skill step?
8. **Repeated explanations** — user asked "what does this do" multiple times → comments or docs missing

## Scope

Review both global and project-level config:

**Global (applies to all projects):**
- `~/.Codex/AGENTS.md` — personal global instructions
- `~/.Codex/commands/` — global skills/commands
- `~/.Codex/skills/` — global skills library

**Project-level (current repo only):**
- `./AGENTS.md` — project-specific instructions
- `./.Codex/commands/` — project-specific commands (if exists)
- `./.Codex/skills/` — project-specific skills (if exists)
- Memory files — project-specific memory

## Output Format

### Global Skills/Commands Updates
For each finding:
- **File:** path to skill
- **Change:** what to modify (before → after) or new skill to create
- **Why:** what happened in this session that triggered this

### Global AGENTS.md Updates
For each finding:
- **Section:** which section to update or add
- **Change:** what to add, remove, or modify
- **Why:** what new context was learned

### Project AGENTS.md Updates
For each finding:
- **Section:** which section to update or add
- **Change:** what to add, remove, or modify
- **Why:** what new project context was learned (design decisions, invariants, conventions)

### Memory Updates
For each finding:
- **Type:** user / feedback / project / reference
- **Content:** what to save
- **Why:** what happened that should be remembered

## Skill vs AGENTS.md Decision Guide
- **AGENTS.md:** Conventions, patterns, principles — things to follow while working (e.g., "every GCF must have auth check")
- **Skill:** Multi-step workflows — things to execute in sequence (e.g., "run tests → check consistency → commit")

## Rules
- Only propose changes that would have prevented a real problem in THIS session
- Don't propose speculative improvements — every suggestion must trace back to a specific moment
- Show all proposals and wait for approval before making any changes
- If nothing needs updating, say so
