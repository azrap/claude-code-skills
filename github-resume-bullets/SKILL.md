---
name: github-resume-bullets
description: Generate resume bullets from GitHub commit history for a specific user
author: azra
version: 1.0.0
---

# GitHub Resume Bullets Generator

Generate resume-worthy bullets by analyzing your GitHub commits.

## Usage
/github-resume-bullets

The skill will ask for the org name or repo URLs after invocation.

## Instructions

### Step 1: Get the authenticated GitHub username
Run: `gh api user --jq '.login'`
Store this as USER.

### Step 2: Ask for org or repo
Ask the user: "Which GitHub org or repo URLs should I analyze?"

### Step 3: List repos in the org
Run: `gh repo list <org> --limit 50 --json name,isPrivate,pushedAt`

### Step 4: For each repo, count user's commits
Run: `gh api repos/<org>/<repo>/commits --paginate --jq '[.[] | select(.author.login == "USER")] | length'`

CRITICAL: Only use `select(.author.login == "USER")` — never attribute other contributors' work.

Skip repos where user has 0 commits.

### Step 5: Fetch user's commit messages
For repos with commits, run:
`gh api repos/<org>/<repo>/commits --paginate --jq '.[] | select(.author.login == "USER") | .commit.message | split("\n")[0]'`

### Step 6: Analyze and group commits
- Identify major features and systems built
- Group by theme (e.g., "email system", "auth", "API migration")
- Ignore trivial commits (formatting, typos, "it works", merge commits)
- Look for PR titles which often summarize features

### Step 7: Generate draft bullets
For each theme, write 1-2 bullets that:
- Are specific and technical
- Do not fabricate metrics or numbers unless found in commits
- Use appropriate jargon for the target audience

### Step 8: Present draft and ask
After generating draft bullets, ask the user:
1. What is your role/title for this position?
2. What type of job are you targeting?
3. Any metrics you want to add?
4. Any bullets to cut, combine, or expand?

### Step 9: Refine based on feedback
Iterate until user is satisfied.

## Rules
- NEVER attribute commits from other team members to the user
- NEVER fabricate numbers, metrics, or technologies not evidenced in commits
- ALWAYS filter by `.author.login == "<username>"`
- Be honest about contribution level (sole developer vs. contributor)
- Flag when user's work is iteration on someone else's foundation
