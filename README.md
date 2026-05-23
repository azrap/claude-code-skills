# Claude Code Skills

Personal collection of [Claude Code](https://docs.claude.com/en/docs/claude-code) skills — reusable prompts that extend what Claude Code can do out of the box.

Each skill is a directory containing a `SKILL.md` with YAML frontmatter (name + description) and instructions Claude follows when the skill is invoked. See Anthropic's docs on skills and the post that inspired organizing them this way: [Skills are Claude Code's secret weapon](https://www.chrismdp.com/skills-are-claude-codes-secret-weapon/).

## Skills

### Engineering workflow

- **[pr-plan](./pr-plan)** — Build detailed PR implementation plans by asking clarifying questions one-by-one, self-reviewing for consistency, simplicity, and DRY before generating an editable markdown file. Uses the architect subagent for exploration.
- **[pr-summary](./pr-summary)** — Generate a brief, structured PR summary in markdown.
- **[refactor-plan](./refactor-plan)** — Produce structured refactor plans for replacing old implementations with new code, with verification steps so nothing is left half-migrated.
- **[repo-review](./repo-review)** — Walk through an unfamiliar repo and produce a structured breakdown: what it is, structure, how it works, key design decisions, and gaps. *(Third-party skill, kept for reference.)*
- **[gpr](./gpr)** — Git pull rebase. Updates the current branch with latest `main` and walks through conflict resolution.
- **[skill-creator](./skill-creator)** — Scaffolds new skills with the correct `SKILL.md` structure, YAML frontmatter, and templates.

### Product & research

- **[prd-generator](./prd-generator)** — Generate comprehensive Product Requirements Documents.
- **[last30days](./last30days)** — Research a topic across the last 30 days from Reddit, X, Bluesky, Truth Social, YouTube, TikTok, Instagram, Hacker News, Polymarket, and the web. Outputs copy-paste-ready prompts.
- **[github-resume-bullets](./github-resume-bullets)** — Generate resume bullets from a GitHub user's commit history.

### Investing

- **[10x-stock-analysis](./10x-stock-analysis)** — Screen small-cap stocks for 10x potential using Finviz filters, financial analysis, and an ethical screen.

### Business (Minimalist Entrepreneur)

- **[minimalist-entrepreneur](./minimalist-entrepreneur)** — A bundle of 9 skills channeling principles from *The Minimalist Entrepreneur* by Sahil Lavingia: `company-values`, `find-community`, `first-customers`, `grow-sustainably`, `marketing-plan`, `minimalist-review`, `mvp`, `pricing`, `validate-idea`.

## Install

Clone this repo and symlink it into `~/.claude/skills/` so Claude Code can discover it:

```sh
git clone git@github.com:azrap/claude-code-skills.git ~/code/claude-code-skills
ln -s ~/code/claude-code-skills ~/.claude/skills
```

Restart Claude Code (or just open a new session). The skills will appear in the skill list.

## Adding a new skill

```sh
cd ~/code/claude-code-skills
mkdir my-new-skill
# Use the skill-creator skill to scaffold SKILL.md
```

Each skill directory needs at least a `SKILL.md` with YAML frontmatter:

```markdown
---
name: my-new-skill
description: One-line description of what this skill does and when to use it.
---

Instructions for Claude...
```

## Layout

```
.
├── README.md
├── 10x-stock-analysis/
├── github-resume-bullets/
├── gpr/
├── last30days/
├── minimalist-entrepreneur/
├── pr-plan/
├── pr-summary/
├── prd-generator/
├── refactor-plan/
├── repo-review/
└── skill-creator/
```
