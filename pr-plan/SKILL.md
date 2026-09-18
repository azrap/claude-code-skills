---
name: pr-plan
description: "Create a repository-grounded PR implementation plan, resolve real ambiguities one at a time, review the plan, and save it after approval."
---

# PR Plan

Create a verified implementation plan. Do not change implementation files.

## 1. Explore

Before asking questions:

- Read `AGENTS.md`, `CLAUDE.md`, and relevant `docs/`.
- Inspect the affected code, tests, configuration, and similar implementations.
- Verify every referenced file, function, type, field, and dependency.
- Search for shared code that we should reuse.
- Use the exploration tools available in the current environment.
- Delegate a bounded exploration task only when agent tools are available and useful.

Do not require a specific tool or agent.

## 2. Resolve Ambiguities

Separate findings into:

- Verified facts
- Decisions required
- Unresolved facts

Verify facts from the repository before asking the user.

When a decision is required:

- Ask one question at a time.
- Give the valid options and tradeoffs.
- Recommend one option.
- Apply the answer before asking the next question.

Do not ask about choices already established by repository conventions.

If a fact cannot be verified, mark it as unresolved. Do not invent it.

## 3. Run Relevant Checks

Always check:

- Existing code that can be reused
- Callers and dependencies affected by the change
- Tests and documentation that must change
- Simpler approaches
- Duplicate logic

Apply these checks only when relevant:

- API changes: inputs, validation, authorization, errors, and repeat requests
- Database changes: schema, types, queries, indexes, and migrations
- External services: current API version, failure handling, and retries
- Renames: direct references, types, strings, imports, exports, tests, and mocks

## 4. Draft the Plan

Use this structure:

# PR Implementation Plan: [Feature]

## Executive Summary

- One line for each decision.

## File Tree

Use these markers:

- `UPDATE`
- `NEW`
- `DELETE`

## Current Behavior

- State the verified behavior that will change.

## Shared Code Survey

- List existing code and patterns we will reuse.
- State any duplication we will remove or avoid.

## File-by-File Changes

For each file:

- Full path and action
- Exact behavior change
- Relevant validation and error handling
- Dependencies and side effects
- A short code snippet only when it clarifies the change

## Validation

- Tests
- Type checks
- Lint and format checks
- Emulators or external verification when required
- Documentation consistency checks

## Risks and Unresolved Facts

- List only items that remain unresolved.

## 5. Review

Before presenting the plan, verify:

- Every referenced item exists or is marked unresolved.
- The plan follows repository conventions.
- The design is the simplest solution that meets the requirement.
- Existing code is reused.
- Validation and failure handling are covered when relevant.
- Tests and documentation remain consistent with the code.

Revise the plan when the review finds a problem.

## 6. Present and Save

- Show the reviewed plan in chat.
- Ask for approval before writing the Markdown file.
- After approval, save it to the agreed project path.
- Report the saved path.
