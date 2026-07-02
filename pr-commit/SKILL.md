---
name: pr-commit
description: Creates a commit for PR review feedback fixes — runs tests and lint scoped to changed files, checks for stale rename terms and missing test coverage, then commits with a conventional-format message and pushes to the remote.
---

You are creating a commit for PR review feedback fixes.

Follow these steps:

0. Review the changes being committed — flag anything over-engineered, inconsistent, or that could be simpler. If found, tell the user before proceeding.
0.5. Preflight — run `git status --short` and show it to the user. Confirm what's staged, unstaged, and untracked before staging or committing anything, so there's no ambiguity about what will be included.
1. Run `git branch --show-current` to check the current branch. If on `main` or `master`, STOP and warn the user: "You're on main — switch to a feature branch before committing." Do NOT proceed with any commit.
2. Detect and run tests before committing. Look for the nearest test runner:
   - If `functions/package.json` exists and changed files are under `functions/`: run `cd functions && npm test`
   - If `pubspec.yaml` exists and changed files are Dart: run `flutter test`
   - If tests fail, STOP and show the failures. Do NOT proceed with the commit.
   - If no test runner is found or no test files exist for the changed code, skip this step.
2.5. Detect and run the linter before committing. Look for the nearest linter, scoped to changed files only:
   - If `functions/package.json` has a `lint` script and changed files are under `functions/`: run `cd functions && npx eslint <changed .js files>` (not the whole directory — scope to files actually in this diff, same approach as CI)
   - If `pubspec.yaml` exists and changed files are Dart: run `flutter analyze` (or `dart analyze`)
   - If lint errors are found in the changed files, STOP and show them. Do NOT proceed with the commit.
   - Do NOT run or report repo-wide lint. Pre-existing lint failures in files outside this diff are known and out of scope — do not fix them or flag them unless the task is explicitly a lint cleanup.
   - If no linter is configured, skip this step.
3. Consistency check — detect stale terms from renames:
   - Look at the diff for lines removed (old terms) and lines added (new terms)
   - If a rename is detected (e.g., `referrerUserId` removed, `referringUserId` added), grep ALL changed files for the old term
   - Check code files, test files, doc files, comments, and console.log strings
   - If the old term still appears anywhere in the changed files, flag it as a missed rename
   - List all findings and ask the user whether to fix before committing or proceed anyway
   - If no renames detected in the diff, skip this step
4. Test coverage check — for each new or modified source file in the diff:
   - Check if a corresponding test file exists (e.g., `applyStripeReferralCredit.js` → `applyStripeReferralCredit.test.js`)
   - If a test file exists, check if new functions/exports/code paths added in the diff have matching test cases
   - Flag any untested new code and suggest what tests to add
   - Ask the user whether to write the missing tests before committing or proceed anyway
   - Skip for doc-only or config-only changes
5. Run `git status` and `git diff` to see all changes
6. Analyze the changes to identify what was fixed
7. Create a single-line commit message using conventional commit format:
   - `fix:` for bug fixes
   - `refactor:` for code improvements without behavior changes
   - `docs:` for documentation changes
   - `test:` for test updates
8. Stage all changes with `git add .`
9. Create the commit with your generated message
10. Push the commit:
    - If the current branch has an upstream (`git rev-parse --abbrev-ref --symbolic-full-name @{upstream}` succeeds), run `git push`.
    - If there is no upstream, ask the user before running `git push -u origin <branch>` — don't set one silently.
    - If the push is rejected (e.g. remote has new commits), STOP and show the error — do not force-push.
11. Report back with the commit hash, message, and push result

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
