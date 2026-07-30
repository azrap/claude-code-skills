---
name: mega-code-review
description: >-
  Run four reviews over the current diff: simplify, security-review,
  code-review-backend-architecture, and code-review at high effort. Merge the
  results into one report. With --fix, apply high-likelihood findings and surface
  double-verified plausible ones without touching them. Use when the user invokes
  /mega-code-review or asks for a full or exhaustive review before shipping.
---

# Mega Code Review

Runs four review passes over the current diff, merges them into a single deduplicated
report, and writes that report to disk.

## Usage

- `/mega-code-review` — review only. Nothing in the working tree is modified.
- `/mega-code-review --fix` — apply CONFIRMED findings; report PLAUSIBLE ones unfixed.

## Scope

All four passes review **the current diff**, not the whole codebase.

Determine the diff once, up front, and hand the same scope to every pass:

```
git diff main...HEAD --stat     # committed work on this branch
git status --short              # uncommitted work
```

If both are non-empty, the scope is the union. If the branch is `main`, scope is the
uncommitted changes only. State the resolved scope (branch, file count) before starting.

## Step 1 — Run the four passes

Run these in order. Each is a separate Skill invocation. Do not summarize between
passes — collect raw findings and merge at the end.

| # | Skill | How to invoke | Notes |
|---|---|---|---|
| 1 | `code-review` | effort `high` | Correctness and bugs. The primary pass. |
| 2 | `security-review` | default | Vulnerabilities in the pending changes. |
| 3 | `code-review-backend-architecture` | default | **Project skill — may not exist.** See below. |
| 4 | `simplify` | see below | Quality/reuse/altitude. **Applies edits by default.** |

### Pass 3 is conditional

`code-review-backend-architecture` is a project-level skill, not global. It only exists
in repos that ship it (check `.claude/skills/code-review-backend-architecture/`).

- If it is not in the available-skills list, **skip it** and record the skip (see
  "Recording skipped passes"). Do not substitute another skill for it.
- If it exists but the diff touches no backend/`functions/` files, skip it and record
  that reason.

### Pass 4 needs a mode

`simplify` applies its fixes directly — it is not a report-only reviewer.

- **With `--fix`:** let it apply as normal.
- **Without `--fix`:** instruct it to report proposed changes only and make no edits.
  The no-fix mode of this skill must leave the working tree byte-identical.

### Recording skipped passes

Any pass that does not run must be recorded and surfaced in the report — never silently
dropped. This applies to every skip reason:

- the skill is not available in this repo or session
- the diff contains nothing in the pass's scope
- the pass errored out or was interrupted mid-run
- the user declined a permission prompt the pass needed

For each, note the skill name and the specific reason. A skipped pass means that part of
the diff went unreviewed — the report must make that visible so nobody reads the result
as full coverage. If a pass errors, say so and do not retry it silently.

## Step 2 — Merge and classify

Pool every finding from every pass that ran. Then:

1. **Deduplicate.** The same defect will often be reported by two passes in different
   words (e.g. code-review calls it a missing await, backend-architecture calls it a
   broken write ordering). Merge into one entry; keep the clearest description; record
   which passes found it — agreement across passes raises confidence.
2. **Classify each finding** as CONFIRMED or PLAUSIBLE:
   - **CONFIRMED** — traced to specific lines, with a concrete failure scenario
     (inputs/state → wrong output or crash). Reading the code proves it.
   - **PLAUSIBLE** — depends on an assumption not verified in the code: an unread
     callsite, unknown runtime data, or a convention taken on faith.
3. **Rank** most severe first.

## Step 3 — Verify the PLAUSIBLE findings twice

Every PLAUSIBLE finding gets a second, adversarial read before it appears in the report.
The goal is to delete the ones that aren't real, not to justify keeping them.

For each PLAUSIBLE finding:

- Open the actual files. Read the callers and callees the finding depends on — do not
  reason from the diff alone.
- Try to **refute** it. Ask: is there a guard upstream that already prevents this? Is
  the input constrained by a type or a validator? Is the "unhandled" case unreachable?
- Default to refuted when uncertain. A finding that survives only because nothing
  disproved it is not evidence — drop it.
- If verification promotes it to CONFIRMED (a concrete failure path emerged), move it to
  CONFIRMED and treat it as such, including for `--fix`.

Report the counts: how many PLAUSIBLE findings were checked, and how many were dropped.

## Step 4 — Apply fixes (`--fix` only)

- **CONFIRMED findings:** apply the fix.
- **PLAUSIBLE findings:** do not touch. Report only, with the specific question that
  would resolve them.
- After editing, verify imports for any new type, class, or helper introduced — re-read
  the import block of each edited file.
- Run the project's typecheck and lint.
- Run every configured unit-test suite, not only tests scoped to changed files.
- Identify and run every emulator script relevant to the reviewed diff. Determine
  relevance from changed functions, features, callers, and the repository's testing
  guidance. Do not run unrelated emulator scripts merely because they exist.
- Record every command, result, skipped check, and exact skip reason in the report. If a
  required test or emulator script cannot run, fails, or is not configured, do not claim
  verification succeeded.
- Re-run the full applicable verification set after the final fix.
- Do not commit. Leave the changes in the working tree for review.

Without `--fix`, apply nothing — CONFIRMED findings are reported with the proposed fix
described, not made.

## Step 5 — Write the report

Write to `docs/reviews/mega-code-review-{branch}-{YYYY-MM-DD}.md`. If `docs/` does not
exist in the repo, write to the repo root instead. Get the date from `date +%F` — do not
guess it.

Wrap lines at 85 characters. Use "we/our" — this is a team-shareable document.

```markdown
# Mega Code Review — {branch}

**Date:** {YYYY-MM-DD}
**Scope:** {N} files ({committed on branch | uncommitted | both})
**Mode:** {report-only | --fix}

## Passes

| Pass | Status |
|---|---|
| code-review (high) | ran |
| security-review | ran |
| code-review-backend-architecture | **skipped** — {reason} |
| simplify | ran |

> **Coverage note:** we skipped {n} pass(es), so this review does not cover
> {what went unreviewed}. Omit this note entirely when every pass ran.

## Summary

| | Count |
|---|---|
| Confirmed | {n} |
| Confirmed — fixed | {n} |
| Plausible — surfaced | {n} |
| Plausible — dropped after re-verification | {n} |

## Confirmed

### 1. {short title}
- **File:** `path/to/file.ts:42`
- **Found by:** code-review, security-review
- **What breaks:** {inputs/state → wrong output or crash}
- **Fix:** {applied — what changed | proposed — what should change}

## Plausible — not fixed

### 1. {short title}
- **File:** `path/to/file.ts:88`
- **Found by:** backend-architecture
- **Claim:** {the concern}
- **Survived refutation because:** {what we checked and could not rule out}
- **To resolve:** {the specific question or missing information}

## Dropped after re-verification

- {finding} — refuted: {why it isn't real}

## Verification

- Typecheck: `{command}` — {pass | fail | not configured}
- Lint: `{command}` — {pass | fail | not configured}
- Unit tests: `{command}` — {pass | fail | not configured}
- Emulator scripts:
  - `{command}` — {pass | fail | skipped — exact reason}
```

The Passes table lists all four rows every time, including the ones that ran. Include the
"Dropped" section even when empty — it shows the second pass ran.

Repeat any skips in the chat response too, not just the written report.

## Rules

- Review only the diff. Do not audit untouched files or open a general cleanup pass.
- Never report a finding that failed re-verification, even as a footnote in another
  section.
- Report failures honestly. If a pass errored or a test failed, say so with the output —
  do not report success for a partially completed run.
- If a pass returns nothing, that's a valid result. Say "no findings" rather than
  padding the report with low-value nits. A pass that ran and found nothing is not the
  same as a skipped pass — do not conflate them in the Passes table.
