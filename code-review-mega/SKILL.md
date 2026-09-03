---
name: code-review-mega
description: Run a comprehensive, high-effort review by combining simplify, security-review, code-review-backend-architecture, code-review, and code-review-quality. Use when the user invokes /code-review-mega, asks for a mega or exhaustive code review, or requests all five review passes together. Accept an optional --fix flag to fix only confirmed, high-likelihood findings while reporting verified plausible findings without fixing them.
---

# Mega Code Review

Review the current diff at high effort and write a final report.

## Parse invocation

- Treat `--fix` as the only supported flag.
- Without `--fix`, do not modify the working tree.
- With `--fix`, follow the fix policy below.
- Preserve the user's requested diff, branch, PR, commit, or file scope. If none is
  given, review the current working-tree and staged diff.

## Run review passes

Run these five passes at high effort:

1. `/simplify`
2. `/security-review`
3. `/code-review-backend-architecture`
4. `/code-review`
5. `/code-review-quality`

Use each available skill's actual instructions. Keep every pass within the same review
scope. Collect findings before changing code so later passes inspect the original
implementation.

If `/simplify` normally edits code, run it as a report-only analysis unless `--fix` was
provided.

If a pass is unavailable, inapplicable, fails, or cannot run, continue with the remaining
passes. Record the pass name and exact reason in the report's `Skipped passes` section.
Never silently omit a pass.

## Consolidate findings

- Merge duplicate findings across passes.
- Preserve the strongest evidence and most precise file and line references.
- Classify each unique finding:
  - **Confirmed / high likelihood**: direct code evidence shows the issue is present.
  - **Plausible**: the issue initially appears possible but needs another review.
  - **Rejected**: evidence disproves the issue or it is only speculative.
- Do not surface rejected findings.

## Double-review plausible findings

Review every plausible finding a second time independently:

1. Re-read the relevant diff and surrounding implementation.
2. Trace callers, callees, data flow, configuration, and tests as relevant.
3. Search for guards, validation, framework guarantees, or other context that could
   invalidate the finding.
4. Try to disprove the finding.
5. Surface it only if the second review confirms the issue is genuinely present.

Promote a verified plausible finding to **Confirmed after second review**. Reject and omit
anything that remains hypothetical, depends on unknown runtime behavior without evidence,
or cannot be tied to the reviewed code.

## Fix policy

When `--fix` is absent:

- Make no code changes.

When `--fix` is present:

- Fix confirmed or high-likelihood findings only.
- Do not fix findings that entered the plausible queue, even if the second review confirms
  them. Report those for manual review.
- Keep fixes scoped and avoid unrelated refactors.
- Run the project's typecheck and lint after fixing.
- Run every configured unit-test suite, not only tests scoped to changed files.
- Identify and run every emulator script relevant to the reviewed diff. Determine
  relevance from changed functions, features, callers, and repository testing guidance.
- Record every command, result, skipped check, and exact skip reason in the report.
- Do not claim verification succeeded if a required check fails or cannot run.
- Re-run the full applicable verification set after the final fix.
- Review the resulting diff again for regressions and unintended changes.
- If a confirmed finding cannot be fixed safely, leave it unchanged and explain why.

## Write the report

Write `MEGA_CODE_REVIEW_REPORT.md` in the repository root, replacing an older report from
this skill if present. Use this structure:

```markdown
# Mega Code Review Report

## Scope
- Reviewed: ...
- Mode: report-only | --fix

## Pass status
- simplify: completed | skipped | failed
- security-review: completed | skipped | failed
- code-review-backend-architecture: completed | skipped | failed
- code-review: completed | skipped | failed
- code-review-quality: completed | skipped | failed

## Skipped passes
- None.
```

For every skipped or failed pass, replace `None` with its name and exact reason.

Continue with:

```markdown
## Confirmed findings
### [Severity] Short title
- Location: path:line
- Found by: pass name(s)
- Evidence: ...
- Impact: ...
- Recommendation: ...
- Fix status: not requested | fixed | not fixed — reason

## Confirmed after second review
### [Severity] Short title
- Location: path:line
- Found by: pass name(s)
- Second-review evidence: ...
- Impact: ...
- Recommendation: ...
- Fix status: surfaced only; not fixed

## Fixes applied
- ...

## Verification
- Typecheck: `{command}` — pass | fail | not configured
- Lint: `{command}` — pass | fail | not configured
- Unit tests: `{command}` — pass | fail | not configured
- Emulator scripts: `{command}` — pass | fail | skipped — exact reason

## Summary
- Confirmed findings: N
- Confirmed after second review: N
- Fixed: N
- Remaining: N
```

Use `None.` for empty sections. Report only findings grounded in the reviewed code. After
writing the file, give the user a concise summary and link to the report.
