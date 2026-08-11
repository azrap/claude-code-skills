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
4. Check for an existing PR on the current branch: `gh pr view --json number,url,body 2>/dev/null`
   - If a PR exists: write the body to a temp file (via HEREDOC or Write tool)
     and run `gh pr edit --body-file <path>` to replace its description.
     Show the user the new body and the PR URL after.
   - If no PR exists: push the branch if needed (`git push -u origin HEAD`),
     then run `gh pr create --title "..." --body-file <path>` targeting main.
     Ask the user for a title first if it isn't obvious from the commits.
5. Do not write `PR_SUMMARY.md` or any other local file as the output — the
   GitHub PR description is the only artifact.

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

```

## Example (good level of detail)

```markdown
# PR Summary: Bulk CSV Import — Backend (PR2)

## Overview
Adds the backend for bulk CSV member import: validating a file at upload, registering rows with the directory provider, and gating record creation on a well-formed, non-duplicate row.

## Key Changes

### Core Implementation
- **`functions/import/validateUpload.js`**: Validates a file at upload — schema check plus a provider status call, failing open if the provider is down.
- **`functions/import/registerRows.js`**: Registers each row with the directory provider, records attribution, and saves the result. Non-blocking and idempotent.
- **`functions/import/providerClient.js`**: Shared provider API client — create/lookup/track/status calls, with retry and timeout handling.
- **`functions/import/applyRecordUpdate.js`**: Now gates record creation on server-side validation instead of trusting the client's call order.
- **`functions/shared/utils.js`**: Shared retry and normalization helpers used across the import functions.

### Testing
- Full unit coverage for all three functions (auth, idempotency, duplicate rows, retries, outages).
- Manual emulator scripts that exercise the real functions against provider test accounts.

### Data Flow
1. User uploads a CSV → validated before proceeding.
2. Job record created (unchanged).
3. Rows applied, re-validating each server-side.
4. User registered with the provider; attribution recorded if present.
5. Summary email sent later via a provider webhook (PR 3, separate).

### Bug Fixes
- Duplicate-row guard.
- Case-insensitive email matching.
- Provider status check now scoped to the correct workspace.
- Provider fetch timeout raised after live calls were timing out on success.
```

Note what this example deliberately leaves out: no internal constant/env-var names, no before/after implementation comparisons, no line counts. One sentence per file, one sentence per fix. That level of detail belongs in code comments or an eng-plan doc, not here.

## Guidelines

- **Be concise**: Focus on WHAT changed, and WHY it changed, not HOW (code details)
- **No internal names**: Don't name constants, env vars, or internal function args in the summary — describe behavior, not implementation
- **Highlight key files**: Only mention files with significant changes
- **Group related changes**: Use subsections for organization
- **Include test coverage**: Always mention test files if present
- **Data flow for features**: Add step-by-step flow for new features
- **No stats section**: Do not include line counts, file counts, or diff stats

## Example Prompts

- "Create a PR summary"
- "Summarize this PR"
- "Write a brief PR description"
- "Generate PR summary markdown"

## Output

Always write the summary directly into the GitHub PR description via `gh pr edit`
or `gh pr create` (see Usage) — never a local markdown file. Confirm before
pushing the branch or creating a PR if neither exists yet.
