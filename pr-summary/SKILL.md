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

```

## Example (good level of detail)

```markdown
# PR Summary: Referral Program — Backend (PR2)

## Overview
Adds the backend for Matriarch's two-sided referral program: validating a referral code at checkout, registering new users with FirstPromoter, and gating the signup credit on a real, non-blocked code.

## Key Changes

### Core Implementation
- **`functions/referral/validateReferralCode.js`**: Validates a code at checkout — Firestore lookup plus a FirstPromoter status check, failing open if FirstPromoter is down.
- **`functions/referral/registerReferral.js`**: Registers the user with FirstPromoter, records attribution, and saves their referral code to Firestore. Non-blocking and idempotent.
- **`functions/referral/firstPromoterClient.js`**: Shared FirstPromoter API client — create/lookup/track/status calls, with retry and timeout handling.
- **`functions/referral/applyStripeReferralCredit.js`**: Now gates the $30 credit on server-side validation instead of trusting the client's call order.
- **`functions/shared/utils.js`**: Shared retry and normalization helpers used across the referral GCFs.

### Testing
- Full Jest coverage for all three GCFs (auth, idempotency, self-referral, retries, outages).
- Manual emulator scripts that exercise the real functions against live FirstPromoter/Stripe test accounts.

### Data Flow
1. User enters a referral code at checkout → validated before proceeding.
2. Subscription created (unchanged).
3. $30 credit applied, re-validating the code server-side.
4. User registered with FirstPromoter; attribution recorded if referred.
5. Referrer is credited later via a FirstPromoter webhook (PR 3, separate).

### Bug Fixes
- Self-referral guard.
- Case-insensitive email matching.
- Promoter status check now scoped to the correct campaign.
- FirstPromoter fetch timeout raised after live calls were timing out on success.
```

Note what this example deliberately leaves out: no internal constant/env-var names (e.g. no `FIRST_PROMOTER_CAMPAIGN_NUMERIC_ID`), no before/after implementation comparisons, no line counts. One sentence per file, one sentence per fix. That level of detail belongs in code comments or an eng-plan doc, not here.

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

Always create an editable markdown file at:
`./PR_SUMMARY.md`
