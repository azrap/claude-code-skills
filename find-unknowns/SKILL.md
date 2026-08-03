---
name: find-unknowns
description: >-
  Find consequential unknowns in software-engineering work and turn the results
  into an evidence-based plan, implementation checkpoint, or post-implementation
  review. Use when the user invokes /find-unknowns, requests a blind-spot pass,
  asks what they may be missing, starts work in an unfamiliar code area, wants
  current implementation assumptions checked, or wants remaining risks explained.
  Supports --plan, --checkpoint, and --post.
---

# Find Unknowns

Find gaps between our description of the work and the repository's actual constraints.
Inspect available evidence before asking the user questions.

## Source reference

Use [A field guide to Claude Fable 5: Finding your unknowns](https://claude.com/blog/a-field-guide-to-claude-fable-finding-your-unknowns)
as the conceptual source for the four unknown categories and the before, during,
and after implementation workflow. Consult it when choosing among blind-spot
passes, prototypes, interviews, references, implementation notes, explainers,
and quizzes. Treat its model-specific examples as illustrations, not constraints.

## Choose the mode

Accept one mode:

- `--plan`: discover unknowns before implementation and write an implementation plan.
- `--checkpoint`: inspect work in progress for deviations and newly discovered unknowns.
- `--post`: explain what the completed implementation resolved and what remains unknown.

If invoked without a mode, ask:

> Which stage are we in: planning, implementation checkpoint, or post-implementation?

Do not infer a mode when the stage is ambiguous.

## Classify uncertainty

Use these buckets when they clarify the work:

- **Known knowns:** requirements and constraints supported by the request or evidence.
- **Known unknowns:** questions already recognized but unanswered.
- **Unknown knowns:** preferences the user can recognize from references or alternatives
  but has not articulated.
- **Unknown unknowns:** constraints, risks, prior art, or possibilities absent from the
  initial framing.

Do not force every observation into a bucket.

## Evidence-first policy

Before asking questions:

1. Read repository guidance, the request, relevant plans, and documentation.
2. Inspect related modules, callers, callees, tests, configuration, and recent changes.
3. Search for existing implementations and reusable patterns.
4. Check references supplied by the user.
5. Distinguish facts from assumptions.

Do not ask the user for information discoverable from repository evidence.

## Interview policy

Ask one question at a time. Ask only when different answers could materially change:

1. Product behavior or acceptance criteria
2. Architecture, data models, or public interfaces
3. Security, privacy, authentication, money, or destructive behavior
4. Compatibility, migration, or rollout
5. Scope or implementation cost
6. Verification requirements

Before asking, explain briefly what decision depends on the answer.

Useful reference-discovery questions include:

- Do we have a sample module that behaves the way this feature should behave?
- Is there an existing screen, endpoint, or workflow whose conventions should carry over?
- Is there a library or repository that implements the semantics we want?
- Do we have a design, prototype, specification, previous PR, or test to use as a
  reference?
- Which parts of the reference must match exactly?

When preferences are difficult to articulate, suggest a small brainstorm or prototype.
Do not create prototypes without approval.

## `--plan`

### Discover

1. Establish the requested outcome, scope, exclusions, and success evidence.
2. Perform a blind-spot pass over the relevant code and documentation.
3. Identify hidden dependencies, existing conventions, prior implementations, edge
   cases, security boundaries, migrations, and verification constraints.
4. Use references or small alternatives to surface unknown knowns when useful.
5. Interview the user until all discoverable and consequential questions are resolved,
   or explicitly left unresolved.

### Write the plan

Write `docs/plans/{feature-name}-plan.md`. Create `docs/plans/` when needed. Use a short,
lowercase, hyphenated feature name.

The plan must contain:

```markdown
# {Feature Name} Implementation Plan

## Outcome

## Scope

## Repository evidence

## Decisions

## File tree

## File-by-file implementation

## Verification

## Risks and rollout
```

Add this section only when material unknowns remain:

```markdown
## Unresolved unknowns

### Blocking
- ...

### Non-blocking
- Unknown:
- Conservative assumption:
- Impact if wrong:
```

Omit empty subsections and omit the entire `Unresolved unknowns` section when none
remain. Never hide a blocking unknown inside implementation details.

Lead with decisions likely to change. Put mechanical edits later. Include exact paths and
name existing code to reuse. Do not invent files, functions, commands, or interfaces.

## `--checkpoint`

Treat this as a point-in-time implementation review, not continuous monitoring.

1. Locate the request, active plan, references, implementation notes, and current diff.
2. Inspect completed, partial, and uncommitted changes.
3. Compare each material plan item with the implementation:
   - implemented as planned
   - implemented differently
   - not implemented
   - cannot verify
   - no longer applicable
4. Run relevant unit tests, typechecks, lint, and emulator or integration scripts when
   safe and configured.
5. Investigate failures and classify them as code defects, stale expectations,
   incomplete setup, environment problems, or unresolved requirements.
6. Find new dependencies, edge cases, security boundaries, migration needs, and implicit
   decisions discovered during implementation.

Classify each decision:

- **Safe and reversible:** use the conservative option and record it.
- **Material but non-blocking:** surface it without changing direction.
- **Blocking:** ask one question before implementation continues.

Do not modify production code unless the user separately requests implementation or
fixes.

Update the active plan with confirmed deviations and new decisions. Add or update its
`Unresolved unknowns` section only when unknowns remain. If no plan exists, write
`implementation-notes.md` in the repository root with:

```markdown
# Implementation Notes

## Status

## Decisions

## Deviations

## Verification

## Unresolved unknowns
```

Omit `Unresolved unknowns` when empty.

## `--post`

1. Read the request, plan, references, implementation notes, final diff, tests, and
   verification output.
2. Verify which planned outcomes are implemented.
3. Identify assumptions confirmed or disproved during implementation.
4. Explain important behavior not obvious from the diff.
5. Surface remaining risks, missing evidence, rollout concerns, and follow-up work.
6. Run relevant verification when it has not already been run against the final state.

Write `docs/plans/{feature-name}-post.md` with:

```markdown
# {Feature Name} Post-Implementation Review

## Outcome

## What changed

## Decisions and deviations

## Verification

## Remaining risks

## Follow-up work
```

Add `## Unresolved unknowns` only when material unknowns remain. Classify each as blocking
or non-blocking and state the evidence needed to resolve it.

Offer an optional one-question-at-a-time knowledge check covering behavior, failure paths,
security boundaries, data changes, rollback behavior, and limitations. Do not make the
quiz a release gate unless the user explicitly requests it.

## Reporting rules

Always distinguish:

- **Discovered fact:** supported by code, documentation, tests, or another source.
- **User decision:** explicitly chosen by the user.
- **Working assumption:** selected so work can continue.
- **Unresolved unknown:** still requires evidence or a decision.

Do not present assumptions as facts. Report failed or skipped checks explicitly. Never
claim complete coverage when evidence is missing.
