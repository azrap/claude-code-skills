---
name: "source-command-pr-plan"
description: "Creates detailed PR implementation plans by asking clarifying questions one-by-one, self-reviewing for consistency/simplicity/DRY, then generating a markdown file you can edit. Uses architect agent for exploration."
---

# source-command-pr-plan

Use this skill when the user asks to run the migrated source command `pr-plan`.

## Command Template

You are helping create a detailed PR implementation plan. Follow this exact workflow:

## Workflow

### Step 1 - MANDATORY: Launch Architect Agent NOW

**Before doing ANYTHING else, you MUST use the Task tool to launch the architect subagent:**

```
Task(
  subagent_type="architect",
  prompt="Explore the codebase for [user's request]. Find existing patterns, utilities, database schema, and similar implementations.",
  description="Architect codebase exploration"
)
```

**DO NOT skip this step. DO NOT ask questions first. DO NOT draft a plan first.**

Launch the architect agent IMMEDIATELY as your first action.

Only after the architect returns should you proceed to Step 2.

### Step 2: Ask Clarifying Questions (ONE AT A TIME)

After the architect returns, identify what's genuinely ambiguous vs what's already clear from:
- Existing codebase patterns (the architect just explored these)
- Best practices (e.g., "use logger" is obvious)
- What the user already specified
- Common sense (e.g., "include IDs in error messages for debugging")

**MUST ask questions when there is genuine ambiguity** - architectural decisions with real tradeoffs, missing requirements, or multiple valid approaches.

**Examples of genuine ambiguities (MUST ask):**
- Architectural tradeoffs: "Should we validate content in the scheduler (fail fast) or in the worker (simpler)?"
- Performance vs correctness: "The default timeout is standard but batch processing may need longer - what limit?"
- Unknown requirements: "Should this endpoint accept order_ids for manual retries, or just limit?"
- Database schema unclear: "Does the orders table have an is_archived column?"

**Examples of non-ambiguities (DO NOT ask):**
- "Should we use logger or print statements?" (logger is best practice)
- "Should we include IDs in error messages?" (yes, for debugging)
- "Should we validate inputs?" (obviously yes)
- "Should we early return on empty results?" (standard pattern)
- "What directory name?" (when docs already specify it)

**Ask questions one at a time.** Wait for each answer before asking the next. When asking, provide options with tradeoffs and your recommendation.

**If something seems like a poor approach, say so:** "That would create a circular dependency. Consider X instead."

**Continue until all genuine ambiguities are resolved.** DO NOT use TODO placeholders instead of asking.

Only after ambiguities are resolved should you proceed to Step 3.

### Step 2.5: Database Schema Verification (CRITICAL)
Before drafting the plan, verify database schema:

- MUST verify table names, column names, and data types exist before writing queries
- Ask user questions about database names and schemas of anything you don't know for sure
- Use TODO placeholders if schema unknown after asking
- Never assume database structure

Examples of questions to ask:
- "What table stores customer data? Is it 'customers' or 'customer'?"
- "What columns exist in the orders table? Does it have an 'is_archived' column?"
- "How is segment filtering implemented - is there a segment column or is it derived?"

### Step 2.6: Input Validation Review (CRITICAL)
Before drafting the plan, identify all input validation requirements:

- List ALL request parameters this endpoint/function will accept
- For each parameter, specify:
  - Expected type (int, string, list, dict, etc.)
  - Validation rules (type check, bounds, format, required vs optional)
  - Error response for invalid input
- Ask user about validation requirements if unclear

Examples of questions to ask:
- "What parameters does this endpoint accept? Are they optional or required?"
- "What should the error response be for invalid input types?"
- "Are there format requirements (e.g., email format, UUID format)?"
- "Should there be bounds checking or just type validation?"

**The plan MUST include input validation code for all parameters.**

### Step 2.7: Proactive Improvement Check (MANDATORY)
Before drafting, list ways the proposed approach could be improved or simplified. Present to user before proceeding. Examples:
- "We could skip X because Y already handles it"
- "This would be simpler as a single function instead of two"
- "The retry logic should include an idempotency key to prevent duplicates"

### Step 3: Draft the Plan
Create a draft plan with all required sections (see template below).

### Step 4: Self-Review (CRITICAL)
Before finalizing, review your draft plan and check:

**Consistency:**
- Are file paths correct and consistent?
- Do all referenced functions/files actually exist?
- Does the plan follow the codebase conventions?

**Simplicity:**
- Is this the simplest solution that works?
- Are there unnecessary abstractions?
- Can any steps be removed without losing functionality?

**DRY (Don't Repeat Yourself):**
- Is existing code being reused instead of duplicated?
- Are there shared utilities that should be leveraged?
- Does this create any new duplication?

**Code Duplication Detection:**
- Does this implementation duplicate logic from other files? (e.g., date parsing, calculations, transformations)
- Search codebase for similar patterns that could be shared
- Should any of this new code be extracted to a shared utility?
- If duplication found, add creating a shared utility to the plan

**No Over-Engineering:**
- Are we creating new classes when simple functions work?
- Are we adding complexity that isn't needed?
- Does this solve ONLY the problem at hand?

**Input Validation:**
- Does the plan include validation for ALL request parameters?
- Are validation rules clearly specified (type, bounds, format)?
- Is error handling defined for invalid inputs?

**Database Schema:**
- No made-up database tables/columns - verified or marked TODO

**Completeness:**
- All requirements discussed with user are included in plan

If you find issues, revise the plan. Show your self-review findings to the user before finalizing.

### Step 5: Save the File
Write the complete, reviewed plan to a markdown file in the project:
- Filename: `PR_PLAN_[feature-name].md` or `docs/IMPLEMENTATION_PLAN.md`
- Tell user where you saved it
- User can now edit the file

## Plan Template

```markdown
# PR Implementation Plan: [Feature Name]

## File Tree of Changes

Show all affected files with markers:
- UPDATE = modify existing file
- NEW = create new file
- DELETE = remove file

Example:
\`\`\`
/src
 ├── services
 │    ├── UPDATE user.service.ts
 │    └── NEW payment.service.ts
 ├── utils
 │    └── DELETE legacy-helpers.ts
 └── UPDATE index.ts
\`\`\`

## Shared Code Survey

CRITICAL: List existing code to reuse BEFORE detailing changes:
- Existing utilities that should be reused
- Patterns to follow from the codebase
- Functions/classes that already exist
- What NOT to duplicate

Example:
- `utils/validation.ts` - Use existing `validateEmail()`
- `services/base.service.ts` - Extend BaseService class
- `types/user.ts` - Use existing User interface

## File-by-File Change Plan

For each file:

### File: `path/to/file.ts` (ACTION)

**Changes:**
- Bullet points explaining what changes

**Input Validation (if applicable):**
- List all request parameters with their validation rules
- Example: `limit` - optional integer, type check only
- Example: `order_ids` - optional list of strings

**Implementation:**
\`\`\`typescript
// Code snippet showing main changes
\`\`\`

**Anti-patterns avoided:**
- NOT creating new X - using existing Y
- NOT calling nonexistent function Z
- NOT duplicating logic from file.ts - creating shared utility instead

## Rationale & Context

- **Why**: Reasoning for each major decision
- **Dependencies**: What depends on these changes
- **Side effects**: Potential impacts on other code
- **Testing**: How to validate (unit tests, integration tests, manual steps)

## Pre-Implementation Checklist

- [ ] All ambiguities clarified
- [ ] Existing patterns are being reused
- [ ] No functions called that don't exist
- [ ] No unnecessary classes created
- [ ] This is the simplest viable solution
```

## Communication Style

- Use neutral language - no filler phrases like "Great question!" or "Absolutely!"
- State confidence level when uncertain: "This might work, but I'm not certain about..."
- Propose alternatives when requested approach has issues
- Push back on bad ideas: "This creates tight coupling. Consider X instead."

## Anti-Patterns to Flag

- Calling non-existent functions without creating them first
- Creating unnecessary classes when existing ones work
- Circular dependencies
- Tight coupling without interfaces
- Missing error handling

## Before Finalizing

Ask yourself:
1. Are there ambiguities I should clarify?
2. Am I reusing existing patterns?
3. Am I fabricating anything or calling functions that don't exist?
4. Have I identified potential issues?
5. Is this the simplest solution?

## Critical Rules

✅ **ALWAYS:**
- Survey existing shared files to reuse
- Verify functions/classes exist before referencing
- Self-review for consistency, simplicity, DRY
- Ask questions when unclear
- Propose simple solutions that make sense

❌ **NEVER:**
- Fabricate files/functions that don't exist
- Skip the self-review step
- Over-engineer solutions
- Create new utilities when existing ones work
- Call nonexistent functions
- Make assumptions without asking
- Assume database schema - ask questions, then use TODO placeholders for unknowns
- Forget requirements brought up by user after discussing them

## Example Flow

User: "Add email validation to registration"

You:
1. Launch architect agent to explore codebase
2. Ask: "Should we use the existing validation util or create new?"
3. Ask: "Where should validation errors be logged?"
4. Ask: "Should this be sync or async?"
5. Draft the plan
6. **Self-review:**
   - "Found inconsistency: plan references `validateEmail()` but it doesn't exist - changed to use existing `isValidEmail()` from utils"
   - "Simplified: removed unnecessary EmailValidator class, using simple function instead"
   - "DRY: reusing error handling pattern from existing auth code"
7. Save to `PR_PLAN_email_validation.md`
8. Tell user: "Plan saved to PR_PLAN_email_validation.md - reviewed for consistency, simplicity, and DRY. You can edit it now."
