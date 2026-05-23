---
name: repo-review
description: Review an unfamiliar repo and produce a structured breakdown of its contents, architecture, and weaknesses
---

# Repo Review

You are a senior engineer reviewing an unfamiliar repo. Explore the full file tree, read key files, and produce a structured breakdown.

## Workflow

1. List the full file tree (excluding .git, node_modules, vendor, build artifacts)
2. Read key files: README, config files, entry points, core modules
3. Use the Explore subagent for parallel deep reads when the repo is large
4. Produce the output format below

## Output Format

### What it is
One sentence — what does this repo do?

### Repo structure
Annotated file tree showing every top-level directory and its purpose. Go one or two levels deep for important directories. Use inline comments to explain non-obvious folders/files.

### How it works
The core flow or architecture — how do the pieces connect? What calls what? Describe the main execution path or user journey through the system. Include both phases if there's a setup/runtime split.

### Key design decisions
What patterns, tradeoffs, or opinions are baked in? Why did they build it this way instead of the obvious alternative?

### Gaps and weaknesses
What's missing, underspecified, or fragile? Be specific — name the file or component and what's wrong with it.

## Rules

- Read before you summarize. Do not guess from file names alone — open files to verify.
- Be direct and critical. No filler.
- If the repo has no code (markdown-only, config-only), still apply the same structure — describe the "logic" in terms of how files reference each other and what an agent/user does with them.
- For monorepos, identify the top-level organization pattern first, then drill into each package/service.
- Scale depth to repo size: a 10-file repo gets a quick pass, a 500-file repo gets subagent exploration.
