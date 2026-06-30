---
name: code-review-high-fix
description: Shortcut for running the code-review skill at high effort with auto-fix. Use when the user types /code-review-high-fix or asks to "code review and fix" without specifying effort level.
---

# Code Review (High, Auto-Fix)

Shortcut for `/code-review high --fix`.

## Usage

When invoked, run the `code-review` skill with:
- effort level: `high`
- `--fix` flag (apply findings to the working tree after review)

Do not ask the user for effort level or whether to fix — both are fixed by this shortcut.

## Applying findings

- **CONFIRMED**: apply directly.
- **PLAUSIBLE**: reason through whether the change is actually an improvement before applying. If the reasoning doesn't hold up, reject the finding — don't apply it.
