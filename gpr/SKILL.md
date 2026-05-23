---
name: gpr
description: Git pull rebase - update current branch with latest main and resolve conflicts
---

# Git Pull Rebase

Sync your feature branch with the latest main branch.

## Steps

When user runs `/gpr`:

1. Note the current branch name: `git branch --show-current`
2. Stash any uncommitted changes: `git stash`
3. Checkout main: `git checkout main`
4. Pull latest with rebase: `git pull --rebase origin main`
5. Checkout back to feature branch: `git checkout <original-branch>`
6. Merge main into feature branch: `git merge main`
7. Pop stashed changes if any: `git stash pop` (only if stash was created)

## Conflict Resolution

If merge conflicts occur:

1. List conflicting files: `git diff --name-only --diff-filter=U`
2. For each conflicting file:
   - Read the file to understand the conflict
   - Prefer changes from the current feature branch when in doubt
   - Ensure the resulting code compiles (no syntax errors)
   - Use the Edit tool to resolve conflicts by removing conflict markers
3. Stage resolved files: `git add <file>`
4. Complete the merge: `git commit -m "merge: sync with main"`

## Safety

- Always stash uncommitted changes before switching branches
- Never force push or use destructive git commands
- If something goes wrong, inform the user and suggest `git merge --abort`
