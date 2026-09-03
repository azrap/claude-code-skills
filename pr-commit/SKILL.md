---
name: pr-commit
description: Creates a commit for PR review feedback fixes — reviews the diff for quality, input validation, code duplication, stale rename terms (in changed files and in docs), and missing test coverage, then runs tests and lint scoped to changed files, commits with a conventional-format message, and pushes to the remote.
---

You are creating a commit for PR review feedback fixes.

Every review check below (steps 4–8) MUST produce visible output: either the findings, or the
literal line `none — <reason>`. Never silently pass a check. When a check has findings, show them
and ask the user whether to fix before committing or proceed anyway.

Follow these steps:

1. Branch guard — run `git branch --show-current`. If on `main` or `master`, STOP and warn the user: "You're on main — switch to a feature branch before committing." Do NOT proceed with any commit.
2. Preflight — run `git status --short` and show it to the user. Confirm what's staged, unstaged, and untracked before staging or committing anything, so there's no ambiguity about what will be included.
3. Read the diff — run `git diff` (and `git diff --staged` if anything is already staged). Steps 4–8 all read this diff; do not run them before this step.
4. Quality — review the diff for anything over-engineered, inconsistent with surrounding code, or that could be simpler. Also flag unnecessary code and comments that just restate the code. Output the list, or `none — no quality issues found`.
5. Input validation — for each new or changed request parameter, function argument, or external input in the diff, list it with: its type check, its error message on invalid input, and whether it is optional or required. Flag any parameter with no validation. Output the list, or `none — no new inputs in this diff`. Skip for doc-only or config-only changes.
6. Code duplication — for each new helper, calculation, transformation, or parsing block added in the diff, grep the codebase for similar existing logic before accepting it. If the same pattern now exists in 2+ places, flag it and name the shared utility it should be extracted into. Output what was searched and what was found, or `none — no new logic to check`. Skip for doc-only or config-only changes.
7. Rename and doc consistency — detect stale terms in one pass:
   - Look at the diff for lines removed (old terms) and lines added (new terms) to build the rename list. Also note any changed schema or flow behavior, even where no identifier changed.
   - For each old term, grep ALL changed files — code, tests, docs, comments, and console.log strings. A stale term here is a missed rename.
   - For each old term, ALSO grep outside the diff: the PRD, the eng plan, and `docs/`. A stale term here is doc drift.
   - For changed flow behavior with no rename, read the matching doc section and check the description still holds.
   - Output the rename list, each location checked, and what needs updating — or `none — no renames, schema, or flow changes in this diff`.
8. Test coverage — for each new or modified source file in the diff:
   - Check if a corresponding test file exists (e.g., `userService.js` → `userService.test.js`)
   - If a test file exists, check if new functions/exports/code paths added in the diff have matching test cases
   - Output any untested new code and what tests to add, or `none — no new code paths to cover`
   - Skip for doc-only or config-only changes
   - Runs before the test run so newly written tests are included in it
9. Tests — detect and run the nearest test runner:
   - If `functions/package.json` exists and changed files are under `functions/`: run `cd functions && npm test`
   - If `pubspec.yaml` exists and changed files are Dart: run `flutter test`
   - If tests fail, STOP and show the failures. Do NOT proceed with the commit.
   - If no test runner is found or no test files exist for the changed code, skip this step.
10. Lint — detect and run the nearest linter, scoped to changed files only:
   - If `functions/package.json` has a `lint` script and changed files are under `functions/`: run `cd functions && npx eslint <changed .js files>` (not the whole directory — scope to files actually in this diff, same approach as CI)
   - If `pubspec.yaml` exists and changed files are Dart: run `flutter analyze` (or `dart analyze`)
   - If lint errors are found in the changed files, STOP and show them. Do NOT proceed with the commit.
   - Do NOT run or report repo-wide lint. Pre-existing lint failures in files outside this diff are known and out of scope — do not fix them or flag them unless the task is explicitly a lint cleanup.
   - If no linter is configured, skip this step.
11. Analyze the changes to identify what was fixed, then create a single-line commit message using conventional commit format:
   - `fix:` for bug fixes
   - `refactor:` for code improvements without behavior changes
   - `docs:` for documentation changes
   - `test:` for test updates
12. Stage all changes with `git add .`, then create the commit with your generated message.
13. Push the commit:
    - If the current branch has an upstream (`git rev-parse --abbrev-ref --symbolic-full-name @{upstream}` succeeds), run `git push`.
    - If there is no upstream, ask the user before running `git push -u origin <branch>` — don't set one silently.
    - If the push is rejected (e.g. remote has new commits), STOP and show the error — do not force-push.
14. Report back with the commit hash, message, and push result.

IMPORTANT RULES FOR COMMIT MESSAGES:
- MUST be a single line (no multi-line messages)
- Maximum 100 characters
- DO NOT include any mention of "Claude", "AI", or similar terms
- DO NOT add attribution or metadata
- Write as if a human developer wrote it
- Be professional and concise

Example good commit messages:
- "fix: make model parameter required in RevisionManager"
- "refactor: move schema util to dedicated module"
- "fix: remove max_completion_tokens parameter"

Example BAD commit messages (DO NOT USE):
- Multi-line messages with body text
- Messages with "Generated with Claude"
- Messages mentioning AI assistance
