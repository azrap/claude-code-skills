---
name: code-review-quality
description: Review a diff against our core code quality standards — duplicate code, comment bloat, overcomplicated logic, unintuitive naming, and inconsistent patterns. Language-agnostic; covers Flutter and functions/ alike. Use when the user invokes /code-review-quality, asks for a quality or readability review, or as a pass inside /code-review-mega.
---

# Code Review — Quality Standards

Review the diff against our five standing quality checks. This is a readability and
consistency pass, not a bug hunt and not a security review.

## Scope

- Review only new additions and changes in the diff, not entire files.
- Applies to every language in the repo — Dart/Flutter and `functions/` alike.
- Preserve the user's requested diff, branch, PR, commit, or file scope. If none is
  given, review the current working-tree and staged diff.

## What to check

### 1. Unnecessary or duplicate code

- Logic that duplicates an existing util or helper. Grep for the behavior before
  flagging — point at the existing definition.
- The same logic repeated in 2+ places in the diff; should be extracted.
- Dead code, unused variables, unreachable branches, leftover debug code.

### 2. Unnecessary comments or bloat

- Comments that restate what the code already says.
- Commented-out code left behind.
- A comment is worth keeping only when it explains a WHY that the code cannot.

### 3. Overly complicated logic that can be simplified

- Nesting that a guard clause or early return would flatten.
- A chain of conditionals that collapses to one expression.
- Clever code where plain code reads the same. Prefer a for-loop over recursion when
  the behavior is identical.

### 4. Unintuitive or inconsistent naming

- A name that does not say what the thing does or returns.
- A name whose style differs from its siblings in the same file or module
  (e.g. `getUserData` next to `fetch_profile`).
- Boolean names that do not read as a question or state (`flag`, `check`).
- Abbreviations that only the author will recognize.
- The same concept given two different names across the diff.

### 5. Inconsistent coding patterns

- New code that does not match the module around it: a different error shape, a
  different return convention, a different file structure than its siblings.
- Mixed idioms for the same job inside one diff (e.g. some async/await, some `.then`).
- Formatting or structure that fights the file's existing convention.

Repo-declared convention drift (`console.log` vs `functions.logger`, module-scope
`defineSecret().value()`, logic in `functions/index.js`) belongs to
`code-review-backend-architecture`. Do not duplicate those findings here.

## Reporting

For each issue:

1. Cite the specific `path:line`.
2. State the problem in one line.
3. Give the concrete improvement — the replacement name, the extracted helper, the
   flattened form. Not "consider refactoring".

Group by the five check numbers above. Report only issues grounded in the diff. If a
check has no findings, say so in one line rather than omitting it.

Report only. Do not modify any file unless the user asked for a fix.
