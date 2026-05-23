---
name: skills-commit-gh
description: Commit and push pending changes in the Claude Code skills repo (~/code/claude-code-skills) and return to the user's current directory. Use when the user wants to ship updates to their skills without typing git commands. Triggers include "/skills-commit-gh", "commit my skills", "push my skills", "update skills repo".
---

# skills-commit-gh

You are committing and pushing pending changes in the user's Claude Code skills repo. The user wants this to feel like one command — they should not need to type anything else.

## Procedure

1. **Save the user's current working directory.** Capture it with `pwd` before doing anything else. You will return here at the end.

2. **Move into the skills repo.** `cd ~/code/claude-code-skills`.

3. **Check repo state.** Run:
   ```sh
   git status --short
   git diff --stat
   git diff
   ```
   - If `git status --short` is empty AND `git status -sb` shows the branch is not ahead of origin → nothing to do. Report "Skills repo is clean and in sync with origin/main, nothing to commit." Return to the saved directory. Stop.
   - If the working tree is clean but the branch is ahead of origin (committed locally, not pushed) → skip to step 6 (push only).

4. **Generate a commit message from the diff.** Read what actually changed and write a message that reflects it.
   - Format: short imperative subject line (under 70 chars), optional body for context if multiple things changed.
   - Examples of good subjects:
     - `tighten pr-plan clarifying-questions step`
     - `add prd-generator examples`
     - `fix typo in mvp skill`
     - `remove repo-review skill`
     - `add skills-commit-gh skill`
   - If multiple unrelated skills changed, use a body to list them:
     ```
     update multiple skills

     - pr-plan: add self-review checklist
     - mvp: tighten Stage 2 description
     - README: update skill index
     ```

5. **CRITICAL — message rules:**
   - **NEVER** include "Generated with Claude Code", "Co-Authored-By: Claude", or any reference to AI/Claude/assistant authorship in the message.
   - **NEVER** add Anthropic links or attribution footers.
   - Write the message as if the user typed it themselves.
   - Keep it factual and matter-of-fact — no marketing language, no "improve" without specifics, no "enhance".

6. **Stage, commit, push:**
   ```sh
   git add -A
   git commit -m "$(cat <<'EOF'
   <your generated message>
   EOF
   )"
   git push
   ```
   Use the HEREDOC form so multi-line messages work correctly.

7. **Return to the user's original directory.** `cd` back to the path captured in step 1.

8. **Report concisely:**
   - One line stating the commit subject and that the push succeeded
   - The short SHA
   - The remote URL (https://github.com/azrap/claude-code-skills)
   - Confirm you're back in their original directory

   Example:
   ```
   Pushed: "tighten pr-plan clarifying-questions step" (a3f2b1c)
   → https://github.com/azrap/claude-code-skills
   Back in /Users/azra/some/project
   ```

## Rules

- Do not prompt the user for the commit message — generate it. They explicitly want zero typing beyond invoking the skill.
- Do not ask for confirmation before pushing. They asked for one command.
- If `git push` fails (network, auth, conflict), report the exact error and stop. Do not retry, do not force-push, do not rebase.
- If there are merge conflicts or the local branch is behind origin, halt and tell the user — let them resolve manually. Do not auto-pull.
- The repo path is hardcoded to `~/code/claude-code-skills`. If that path doesn't exist or isn't a git repo, halt and report.
- Never use `git commit --amend`, `--no-verify`, or `git push --force`.
- Do not run `git add` with specific filenames unless the user asked you to exclude something — `git add -A` covers new, modified, and deleted files in one step.

## Why this skill exists

The user maintains their Claude Code skills as a git repo at `~/code/claude-code-skills`, symlinked into `~/.claude/skills`. Edits happen organically as they work in other directories. This skill removes the friction of `cd`-ing over, crafting a message, committing, pushing, and `cd`-ing back.
