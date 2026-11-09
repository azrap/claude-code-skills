---
name: code-review-loop
description: Loop code-review-mega and fixes until the review finds no Medium, High, or Critical issues. Fixes obvious findings itself, stops to ask when a fix needs the user's judgment, and ends with a list of every issue fixed and how. Use when the user invokes /code-review-loop, or asks to review and fix "until clean", "until no medium issues", or to loop a review.
---

# Code Review Loop

Review, fix the obvious findings, verify, and review again until no finding rated
Medium or higher is left.

## Inputs

- Scope: a PR number, branch, or the current diff. If none is given, use the current
  branch's open PR, else the working-tree and staged diff.
- Optional `--max-rounds N` (default 3).

## Before the first round

- Check the branch. Never edit `main` or `master`; work on the scope's branch or a
  worktree of it.
- Find the repo's validation command: a documented check script (for example
  `scripts/check.sh`), else every configured typecheck, lint, format, and test command.
- Find emulator or integration scripts that the repo's docs tie to the changed code.

## Each round

1. Run `/code-review-mega` in report-only mode on the scope. Use the repo's own pass
   skills where they exist, as that skill says.
2. Take every surfaced finding rated Medium, High, or Critical, from both
   **Confirmed** and **Confirmed after second review**.
3. Sort each finding:
   - **Obvious**: the code and docs show one correct fix, and it changes no product
     behavior, public API, or recorded decision. Fix it.
   - **Needs judgment**: a product or design choice, a change to a recorded decision,
     or more than one reasonable fix. Stop the loop. Ask the user one question at a
     time, with the options and a recommendation. Apply the answer, then continue.
4. Fix only what the finding needs. No unrelated refactors.
5. When a fix adds or changes a test, prove the test fails on the problem it guards
   against (break it on purpose in a scratch script, not in the repo), then passes.
6. Run the full validation command and the relevant emulator scripts.
7. Record each fix: round, severity, issue, fix, `path:line`, and how it was verified.
8. Start the next round with a fresh review of the updated code.

## Stop conditions

- **Done**: the latest review lists 0 findings rated Medium or higher, and validation
  passes.
- **Ask the user**: a finding needs judgment, a check fails and the cause is not
  clear, or a fix would change a recorded decision.
- **Stuck**: the same finding comes back after 2 fix attempts, or `--max-rounds` is
  reached. Report it and stop.

## Rules

- Do not loop on Low findings. List them at the end; fix them only if the user asks.
- Never merge. Commit or push only when the user asked for it, and only after
  validation passes.
- Never report a check as passed unless it ran and passed in the last round.

## Final report

When done or stopped, give the user:

```markdown
## Fixed
| Round | Severity | Issue | Fix | Location | Verified by |
|---|---|---|---|---|---|

## Needs your decision
- ... (or "None.")

## Low findings not fixed
- ... (or "None.")

## Checks (last round)
- `{command}` — pass | fail

Rounds: N. Result: clean | stopped — reason.
```

List every fixed issue, including ones found and fixed in earlier rounds.
