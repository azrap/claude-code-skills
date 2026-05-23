---
name: pr-summary
description: Generate a brief, structured PR summary in markdown format when user asks to summarize changes or create PR documentation
---

# PR Summary Generator

Generate a brief, structured PR summary in markdown format.

## Usage

When user asks to "create a PR summary" or "summarize the PR":

1. Run `git log origin/main..HEAD --oneline` to get commits
2. Run `git diff origin/main --stat` to get file changes
3. Analyze the key changes
4. Create a markdown file named `PR_SUMMARY.md` in project root

## Format

```markdown
# PR Summary: [Feature/Fix Name]

## Overview
[1-2 sentence description of what this PR does and why]

## Key Changes

### Core Implementation
- **[File.swift]** (+X lines): [What it does]
- **[File2.swift]**: [Changes made]
  - [Bullet point details if needed]

### Testing
- **[TestFile.swift]** (+X lines): [Test coverage description]

### Data Flow (if applicable)
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Bug Fixes (if applicable)
- [Fix 1]
- [Fix 2]

## Stats
- **+X lines** / **-Y lines**
- **N files changed**
- **X lines of tests**
```

## Guidelines

- **Be concise**: Focus on WHAT changed, and WHY it changed, not HOW (code details)
- **Highlight key files**: Only mention files with significant changes
- **Group related changes**: Use subsections for organization
- **Include test coverage**: Always mention test files if present
- **Data flow for features**: Add step-by-step flow for new features
- **Stats at the end**: From `git diff --stat`

## Example Prompts

- "Create a PR summary"
- "Summarize this PR"
- "Write a brief PR description"
- "Generate PR summary markdown"

## Output

Always create an editable markdown file at:
`./PR_SUMMARY.md`
