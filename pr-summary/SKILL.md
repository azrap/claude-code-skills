---
name: pr-summary
description: Generate a brief, structured PR summary in markdown format when user asks to summarize changes or create PR documentation
---

# PR Summary Generator

Generate a brief, structured PR summary in markdown format.

## Usage

When user asks to "create a PR summary" or "summarize the PR":

1. Resolve the requested PR and read its current title, body, base, head, and status.
   Use its actual diff, including for merged PRs; do not substitute the current branch.
2. Inspect changed files and recorded checks. Find the project purpose and Linear
   project link in the request or existing project records when applicable.
3. Analyze the key changes
4. Use the requested PR. Only when none was specified, check the current branch:
   `gh pr view --json number,url,body 2>/dev/null`.
   - If a PR exists: write the body to a temp file (via HEREDOC or Write tool)
     and run `gh pr edit --body-file <path>` for that PR to replace its description.
     A connected GitHub tool may do the same body-only update if the CLI is unavailable.
     Read the saved body back and validate it against the checklist below.
     Show the user the new body and the PR URL after.
   - If no PR exists: push the branch if needed (`git push -u origin HEAD`),
     then run `gh pr create --title "..." --body-file <path>` targeting main.
     Ask the user for a title first if it isn't obvious from the commits.
5. Do not write `PR_SUMMARY.md` or any other local file as the output — the
   GitHub PR description is the only artifact.

## Format

- Use [Matriarch backend PR #10](https://github.com/MatriarchHealth/matriarch-backend/pull/10)
  as the canonical structure and level of detail.
- Start `## Summary` with the larger project goal and verified Linear link when
  applicable, followed by what this PR adds. For HTTP endpoints, name the method,
  full path, caller, and result. State deferred or inactive wiring accurately.
- Add `### Changed file tree` with changed production and documentation paths only.
  Do not include test files or package marker files.
- Add separate `### Review order` bullets for significant production files: entry
  point or orchestrator first, then the files it calls in execution order, then
  shared dependencies. Use exactly one file and one concise sentence per bullet.
- Put documentation changes in their own `### Docs` section.
- End with `## Test plan`. Describe covered behavior and recorded results without
  listing individual test files.

```markdown
## Summary

[Larger project goal and verified Linear project link when applicable.]

[What this PR adds, including endpoint method, path, caller, result, and deferred work.]

### Changed file tree

```text
.
├── [production path]
└── [documentation path]
```

### Review order

- `[entry-point file]` — [What starts or coordinates the flow.]
- `[next production file]` — [What it does next.]
- `[shared dependency]` — [What shared behavior it provides.]

### [Important behavior, if it needs explanation]

- [Short explanation of the behavior, risk, or boundary.]

### Docs

Updates `[documentation path]` to match the implemented behavior and remaining work.

## Test plan

- [x] [Recorded command or check] — [result]
- [x] [Important behavior covered, without listing test files]
```

Keep one sentence per production file or behavior. Leave out internal argument names,
before/after implementation narration, test-file lists, package marker files, and stats.

## Guidelines

- **Write for a human with no project context**: Apply plain English to every
  section, including file descriptions and tests. Say who does what and what
  happens. Replace technical shorthand or explain it where needed.
- For example, write "repeated reports do not create duplicates; keep any provider
  confirmation already received" rather than "idempotent webhook-first persistence."
- Put production files in review order and explain behavior in execution order.
  Separate work in this PR from later work.
- Use Bug Fixes only for application bugs that existed before this PR. Omit the
  section otherwise.
- Omit self-review fixes entirely. Do not describe fixes made while implementing
  or reviewing this PR's new code.
- **Be concise**: Focus on WHAT changed, and WHY it changed, not HOW (code details)
- **No internal names**: Don't name constants, env vars, or internal function args in the summary — describe behavior, not implementation
- **Highlight key files**: Only mention files with significant changes
- **Show the changed structure**: Include a production-and-docs file tree before
  the review-order bullets; omit tests and package marker files
- **Group related changes**: Use subsections for organization
- **Include test coverage**: Summarize covered behavior and recorded results, but
  do not list individual test files
- **Explain feature flow**: Use short behavior subsections when the flow needs context
- **No stats section**: Do not include line counts, file counts, or diff stats
- Never merge the PR.

## Final validation checklist

- [ ] Summary starts with the larger goal and verified Linear project link when applicable.
- [ ] Summary states what this diff adds, not just what the project will do.
- [ ] Each added or changed HTTP endpoint has its method and full path stated.
- [ ] Caller permissions, saved data, and inactive or deferred work match the code.
- [ ] A changed-file tree shows production and documentation paths only; test and
      package marker files are omitted.
- [ ] Separate bullets describe significant production files in reviewer order,
      with exactly one file and one concise sentence per bullet.
- [ ] Documentation changes have their own section.
- [ ] Every file description explains behavior, not just a list of mechanisms.
- [ ] Read the entire summary as an unfamiliar reviewer: actors, fields, outcomes,
      and necessary technical terms are clear, and flow steps are in order.
- [ ] Bug Fixes is absent unless this PR fixes a pre-existing application bug.
- [ ] Self-review fixes are omitted entirely, with no exceptions or asides.
- [ ] Tests reported as passed have recorded results; planned or unrun tests are
      not described as passed. Preserve useful existing limitations and status.
- [ ] Read back the saved GitHub body and confirm the same structure and facts.

## Example Prompts

- "Create a PR summary"
- "Summarize this PR"
- "Write a brief PR description"
- "Generate PR summary markdown"

## Output

Always write the summary directly into the GitHub PR description via `gh pr edit`
or `gh pr create` (see Usage) — never a local markdown file. Confirm before
pushing the branch or creating a PR if neither exists yet.
