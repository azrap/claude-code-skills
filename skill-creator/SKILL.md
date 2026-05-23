---
name: skill-creator
description: Creates new Claude skills with proper SKILL.md structure, YAML frontmatter, and templates when user wants to create a skill
---

# Skill Creator

When creating a new Claude skill, follow this structure and process.

## Process

1. Ask the user for:
   - Skill name (kebab-case)
   - Description
   - Keywords/patterns that should trigger it
   - Instructions Claude should follow

2. Create the skill directory structure:
   ```
   ~/.claude/skills/<skill-name>/
     └── SKILL.md
   ```

3. Generate `SKILL.md` with YAML frontmatter and instructions:
   - YAML frontmatter at the top with name and description
   - Clear title
   - Purpose statement
   - Step-by-step instructions
   - Examples if applicable
   - Constraints/rules if applicable

## Template Structure

### SKILL.md Template
```markdown
---
name: skill-name
description: Clear description of what this skill does and when it should be triggered
---

# Skill Name

[Brief description of what this skill does]

## When to Use

[Describe when this skill should be activated]

## Instructions

1. [First step]
2. [Second step]
3. [Third step]

## Examples

[Provide usage examples]

## Constraints

- [Any limitations or rules]
```

## Important Notes

- Skills in `~/.claude/skills/` are global (all projects)
- Skills in `<project>/.claude/skills/` are project-specific
- Skill names should be kebab-case
- File MUST be named `SKILL.md` (uppercase, case-sensitive)
- YAML frontmatter MUST have `---` delimiters
- Description field is critical for Claude to know when to activate the skill
- Instructions should be clear and actionable
