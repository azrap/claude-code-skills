---
name: write-prd
description: >-
  Interview the owner one question at a time, then write a short PRD for a major
  engineering project: jobs to be done, the north star metric and the input the
  project moves, user stories with pass/fail acceptance criteria, scope, unknowns
  about outside services, and open questions. Use when the user invokes /write-prd,
  starts a major project, runs step 1 of project-build-process, or asks to
  interview them for a PRD.
---

# Write PRD

**Purpose:** We make the product requirements of a major project clear before we
plan it. Claude interviews the owner, then writes a short PRD that the plan can be
split from.

"The owner" is the engineer who owns the project.

## When to use

- A major project. This is step 1 of `project-build-process`.
- Not for a small project. A small project has no PRD. It starts with a spec.
- Not for a market study or a strategy document.

## Interview rules

- Read first, ask second. Read the repo docs, the tracker tickets and older PRDs.
  Ask only what these cannot answer.
- Ask one question at a time. Apply the answer, then ask the next question.
- Give a recommendation with each question when the evidence supports one.
- Ask product questions only. A technical choice belongs to the research and the
  plan.
- Do not guess what an outside service can do. Write it in "Unknowns about outside
  services".
- Do not invent a fact. A metric, a number or a type of user comes from the owner
  or the repo.
- When the owner cannot answer, the owner takes the question to the product team.
  Write it in "Open questions" with who answers it.
- Stop the interview when no question that blocks the plan is open.

## Interview order

Follow this order. Skip a part that the repo or the tracker answers already.

1. The problem, and who has it.
2. The jobs to be done.
3. The north star metric, and the input this project moves.
4. The user stories and their acceptance criteria.
5. What is in scope and what is out of scope.
6. The outside services the project touches.
7. The parts that touch login, permissions, money or user data.

## The three frames

### Job story (the problem)

```
When [situation], I want to [motivation], so I can [outcome].
```

- Write the situation, not the type of person. The situation is the cause of the
  need.
- Write one job story for each real situation.
- More than five job stories is a sign that the project is two projects. Ask the
  owner.
- Source: "How we accidentally invented Job Stories" (Intercom, 2016).

### North star (the reason)

- The north star metric is the one metric that best shows the value customers get
  from the product. It belongs to the product, not to one project.
- Find it in the repo docs first. If it is not there, ask the owner once.
- If the product has none, write "None yet". Then write how the owner will know
  that this project worked.
- The PRD names four things: the metric, the input this project moves, the change
  we expect, and where we read the number.
- Source: North Star Playbook (Amplitude).

### User story (the requirement)

```
As a [type of user], I want to [action], so that [benefit].
```

- Each user story serves one job story. Name the job.
- Each user story has acceptance criteria. Each criterion is pass or fail, in plain
  words, and a person can check it.
- Use a number in place of "fast" or "easy".
- Write what the user can do, not how we build it.
- For a story that touches login, permissions, money or user data, add three
  criteria:
  - Who can do it, and who cannot.
  - What happens when the same request comes two times.
  - What must not change.

## The PRD

- Write the PRD where the owner says. If the repo does not say, ask once. Use a
  document the team can edit and comment on, not only the chat.
- Keep it short. State each decision one time, with at most one line of reason.
- When a section does not fit the project, write "None" and one line of reason.
- Delete an open question when it has an answer, and put the answer in its section.

```markdown
# <Project name>: PRD

## Summary
**Purpose:** <one line>
- <each decision, one line>

## Problem
<what is wrong today, and who has the problem>

## Jobs to be done
- When <situation>, I want to <motivation>, so I can <outcome>.

## North star
- Metric: <the product's north star metric, or "None yet">
- Input this project moves: <input>
- Change we expect: <direction, and size if known>
- Where we read it: <report, query or dashboard>

## User stories
### <short name>
As a <type of user>, I want to <action>, so that <benefit>.
- Job: <the job story it serves>
- Acceptance criteria:
  - <pass/fail check>

## Scope
- In: <item>
- Out: <item, with one line of reason>

## Unknowns about outside services
| Unknown | Service | What it changes |
|---|---|---|

## Open questions
| Question | Who answers | Blocks the plan |
|---|---|---|
```

## Done when

- No question that blocks the plan is open.
- Each user story has acceptance criteria.
- The owner has read the PRD.
- The answers are in the tracker.

## What comes next

- The research step takes "Unknowns about outside services" and tries each one.
- The plan step splits the PRD into PRs. Each acceptance criterion becomes a
  pass/fail done-check in the spec of one PR.

## Keep this skill current

If you hit a gap this skill didn't cover, find a solution for the task at hand, then
propose an addition to this file (don't edit it directly) and wait for approval
before applying it.
