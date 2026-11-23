---
name: project-build-process
description: >-
  Build a full-stack project, or one PR of it, with our 9-step build process: PRD,
  research, plan, build, Claude review, Codex review, PR, real-app check, merge.
  Use when the user invokes /project-build-process, starts a major or small
  project, asks to plan its PRs, asks to build, review or check a PR "with the
  build process", or asks which step comes next.
---

# Project Build Process

**Purpose:** These are the steps we use to build a full-stack project with Claude
and Codex. For now it has the backend steps only. We add the web steps later, after
backend work is underway. We make the product and technical requirements clear
first. Then the build runs with little help from the owner. The owner is needed only
at the planned stops, or when a decision needs the owner.

"The owner" is the engineer who owns the project and gives the two yeses.

## Summary

- Steps 1 to 3 run once for the project: PRD, research, plan. Steps 4 to 9 run once
  for each PR.
- Each major project starts with a PRD. We answer the product questions and write
  the PRD before we plan (step 1).
- We try unknowns about an outside service on a test account to verify PRD
  feasibility before we plan (step 2).
- Claude plans (step 3), builds (step 4), and reviews (step 5). Codex reviews
  (step 6). Each fix round in steps 5 and 6 ends with `scripts/check.sh` and the
  emulator tests again. If Claude tokens run short, Codex builds (step 4). The owner
  approves (steps 3, 9).
- We identify PRs that can run in parallel ahead of time, then plan and build them
  at the same time in separate sessions and worktrees when they can be parallelized.
  Each PR has its own worktree.
- Each PR does one thing and passes all checks on its base: main, or the PR below it
  in a stack. We merge a stack from the bottom up and undo it from the top down. We
  build the PRs of a stack in order, not in parallel. The PR text links each PR of
  the stack (`pr-summary`).
- We stop for the owner's yes two times: the plan and the merge. Claude does the
  push and PR, with no stop.
- The agent makes each critical technical choice that usually needs an engineer (for
  example, a custom library or an SDK). It logs the choice and the reason. After the
  PR is open (step 7), Claude and the owner work through each logged choice
  together, one at a time.
- Each PR has pass/fail done-checks in its spec, in plain words. Step 8 checks each
  one on the real service.
- A review ends when no Medium or higher finding is left. Max 3 rounds.
- Each PR gets a real-app check before the merge. It uses the test project and the
  test account of each outside service the PR touches. The result goes in one local
  file that is not pushed. The owner reads it and can delete it.

## Project first, then PRs

- A major project starts with a PRD. No PR work starts before the PRD is written.
- A small project has no PRD. It starts at step 3 with a spec.
- Steps 1 to 3 run once for the project: PRD, research, plan.
- The plan splits the project into PRs.
- Steps 4 to 9 run once for each PR.

## The 9 steps

Steps 3 and 9 are stops. Work continues only after the owner's yes.

Each step shows the suggested model. When a newer equivalent model is available (for
example Fable 5.1 to Fable 5.2), flag that to the owner when beginning a new PR,
then determine together if it should be used or not.

### 1. PRD (product gate)

- **Who:** the owner and the product team.
- **Model:** Fable 5.2.
- **What happens:** We answer the product questions that block the work and write a
  PRD. Claude interviews the owner, one question at a time, until no product
  question is open. The owner takes a question to the product team when needed.
- **Done when:** The PRD is written. No blocking question is open. The answers are
  in Linear.

### 2. Research and test-account check

- **Who:** Claude reads docs. The owner and Claude run checks.
- **Model:** Fable 5.2, or Opus 5.5 if out.
- **What happens:** We try each unknown about an outside service. Claude first needs
  read access to the test keys of that service: the role "Secret Manager Secret
  Accessor" on those secrets in the test project. The project owner gives it.
- **Done when:** Each unknown has a result from the docs or the test account. The
  research notes list each fact with its source or test result.

### 3. Plan (stop)

- **Who:** Claude.
- **Model:** Fable 5.2.
- **What happens:** Claude splits the PRD into PRs and writes one spec per PR. Each
  spec has a short list of pass/fail done-checks in plain words. For a PR that
  touches login, permissions, money or member data, the list has a check for each:
  who can call it, what happens on a repeat request, and what must not change.
- **Done when:** The owner approves the plan.

### 4. Build and commit

- **Who:** Claude. Codex (`codex exec`) only if Claude tokens run short.
- **Model:** Claude: Opus 5.5, medium for easy work, high for complex or critical
  work (for example payments) or work with database writes. Codex fallback: Sol 6.1
  high.
- **What happens:** The builder writes the code, unit tests, and emulator tests for
  one PR in its own worktree. It builds to the done-checks in the spec and does not
  add its own. The builder logs each critical technical choice as one line in
  `.context/critical-choices.md`: what it decided, why, and what it costs if wrong.
  A fresh agent compares the code with the spec (`find-unknowns --checkpoint`). The
  builder builds each part that is not built. Then the builder runs `/verify`: it
  builds the service, runs it, and observes the change.
- **Done when:** `scripts/check.sh` passes. The emulator tests pass. `/verify` ran
  the service and the change worked.

### 5. Code review and fix

- **Who:** Claude.
- **Model:** Fable 5.2 high.
- **What happens:** Claude runs `code-review-mega`, then `code-review-loop`. After
  each fix round, Claude runs `scripts/check.sh` and the emulator tests again, then
  `/verify`.
- **Done when:** 3 rounds. Fix Medium or higher findings. Document all fixes and
  remaining opens. All checks pass after the last fix.

### 6. Codex review and fix

- **Who:** Codex (`codex exec`), then Claude for `/verify`.
- **Model:** Astra 6.2 high. Opus 5.5 for `/verify`.
- **What happens:** Codex reviews the PR after Claude's review. Codex fixes Medium
  or higher findings itself. After each fix round, Codex runs `scripts/check.sh` and
  the emulator tests again. After the last round, Claude runs `/verify`.
- **Done when:** Max 3 rounds. No Medium or higher finding is left, or the open ones
  are documented. All checks pass after the last fix.

### 7. Push and open PR

- **Who:** Claude.
- **What happens:** Claude commits and pushes with `pr-commit`, then opens the PR
  with `pr-summary`. The PR lists the logged critical choices. Claude and the owner
  then work through each one together, one at a time. No stop.
- **Done when:** The PR is open. CI passes.

### 8. Real-app check (each PR)

- **Who:** A second Claude agent that Claude starts. Not the builder.
- **Model:** Opus 5.5 high.
- **What happens:** The second agent does the check, not the builder. Claude first
  deploys the PR to the test service with its own URL, then deletes the revisions of
  older PRs. For each done-check, the agent sends a real request, then reads the
  saved data and the outside service's test account. Never production. The agent
  writes the result to a local file in the PR worktree
  (`.context/real-app-check.md`). The file is not pushed. After that, Claude removes
  the PR URL. The main URL stays on its old revision. Claude deletes this PR
  revision at the next PR deploy, because Cloud Run does not delete the newest
  revision.
- **Done when:** The result file has pass or fail, and one plain line for each
  done-check. The owner reads only this file. The PR URL is removed. The main URL is
  on the same revision as before.

### 9. Merge (stop)

- **Who:** the owner.
- **What happens:** The owner says yes to the merge, one PR at a time. After the
  merge, Claude updates Linear and removes the worktree. Claude also adds one line
  for the PR to the build process log (one Claude doc): the times the owner had to
  step in, and the problems found at the merge.
- **Done when:** The PR is merged.

## Rules during a run

Stop during a run: the agent stops and asks the owner only in the cases below. In
all other cases it picks, logs the choice, and continues.

1. The spec has no answer, and a wrong guess puts member data or money at risk, or
   forces a rebuild of most of the PR.
2. A choice that we cannot undo, for example a data migration. This is a rule
   already ("When the owner reverses a choice").
3. An action on production: a deploy, a data write, or a change of a setting.
4. The work needs real member data, a secret, or access that the agent does not
   have. The agent does not go around a block.
5. The spec is wrong: a done-check cannot pass as written, or two parts of the spec
   disagree.
6. The change breaks a caller outside the PR (the web app or the Flutter app), or it
   needs work outside the spec of the PR.
7. A check still fails after 3 tries.

When a check fails, at any step, the agent finds the cause and fixes it. It has 3
tries. If the check still fails, the agent stops at that step and tells the owner
what fails and what it tried.

No cheating: the agent fixes the code, not the test. It does not delete, skip or
weaken a test, turn off a check, or add code that only makes a test pass. It changes
a test only when the test is wrong or the spec changed, and it logs the reason.

We never put a password, a key or a member email in a doc or in chat.

## When the owner reverses a choice

- We change the spec first.
- A change of a value or a name: Claude edits the code.
- A change of structure (for example, an SDK to a custom library): Claude builds the
  affected part again from the spec. No patch on top of the old code.
- Steps 5 and 6 run again. They also check that no part of the old choice is left.
- The agent does not make a choice that we cannot undo (for example, a data
  migration). It stops and asks the owner first.
- Edit CLAUDE.md, a skill file, or whichever doc file is most relevant, to ensure
  this type of mistake doesn't happen again.

## Step 8: PR deploy and clean-up on the test service

This is the deploy part of step 8. Claude does items 1, 2, 4 and 5. Item 3 is the
check in step 8. Never the production project.

The names, commands and test login of a repo are in that repo's own file, not in
this skill. The repo's CLAUDE.md points to the file. For the backend it is
`docs/backend-setup/build-process-step8.md`.

1. **Deploy the PR with its own URL.** Claude runs this in the PR worktree, after
   step 7. The worktree must be clean and at the pushed PR commit, because the
   command sends the files on disk, not a commit. The main URL does not change. The
   deploy has no traffic, the tag `pr-<number>`, and the revision suffix
   `pr<number>-<short commit>`.
2. **Delete the revisions of older PRs.** Claude first removes each tag that is on
   the revision of a merged or closed PR (the command in item 4). Then Claude
   deletes each revision with a name of the form `<service>-pr<number>-<commit>`
   that has no tag and no traffic. Cloud Run permits the delete now, because the new
   PR revision is the newest one.
3. **Run the check** on the PR URL (step 8).
4. **Remove the PR URL** after the result file is written.
5. **Keep the PR revision** until the next PR deploy. Item 2 of that deploy deletes
   it. Until then it has no URL and gets no traffic.

Rules:

- A tag on the revision of an open PR shows that a check is in progress. Claude
  never deletes a revision that has a tag. Each PR has its own URL.
- After a deploy by hand that must go to the main URL, run
  `gcloud run services update-traffic <service> --to-latest` directly after it, or
  the main URL stays on the old revision.
- The login for the check: the test project has one test member, made for this
  check. Only the step 8 check uses it. For each check, the agent sets a new random
  password, signs in, and does not save or show the password. In the test database,
  the agent writes only the records of this member.
