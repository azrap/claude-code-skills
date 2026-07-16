---
name: ai-pr-review-guide
description: Guide risk-based manual review of AI-generated or AI-assisted pull requests. Use when the user asks to review a PR, walk through review, make a review guide, review AI code, prove risky claims, identify dangerous paths, or evaluate whether an AI-authored PR is safe to merge.
---

# AI PR Review Guide

Use this skill to help a reviewer evaluate an AI-generated PR without needing to
understand every line or language detail. The job is to review risky claims,
not to reread the whole diff blindly.

## Ground Rules

- Do not ask the reviewer to trust the author or agent.
- Do not use test names alone as proof.
- Do not declare a gap acceptable. Present the gap and let the reviewer decide.
- Explain code in plain English when the reviewer does not know the language.
- Prefer exact file links, line anchors, test setup, assertions, and emulator output.
- Separate proof from confidence. A passing test proves only what it actually asserts.

## Workflow

1. **Collect context.** Identify the base branch/commit, changed files, PR summary,
   and any user-stated requirements. If missing, inspect local git diff first.
2. **Make the risk scan.** Look for money, auth, user identity, client input,
   database writes, external APIs, webhooks, retries, duplicates, and concurrency.
3. **Draft invariants.** Convert the risky behavior into plain-English rules that
   must stay true. Ask the reviewer to edit or confirm the list before continuing.
4. **Build a review packet.** Include file order, risky files, claims, proof
   locations, known tradeoffs, commands run, and emulator proof output if present.
5. **Walk one invariant at a time.** Do not dump every invariant at once unless
   the user asks. For each invariant, use the template below.
6. **End with a decision summary.** List remaining gaps, explicit user decisions,
   and whether anything still needs tests, emulator coverage, or another reviewer.

## Invariant Template

For each invariant, answer exactly these questions:

```md
**Invariant:** <plain-English rule>

**How could this fail?**
- <concrete failure mode>

**What would the symptom be?**
- <what user/support/data would see>

**Code proof**
- <file:line and plain-English meaning>

**Test proof**
- <test setup and assertion, not just test name>

**Emulator proof**
- <stdout lines or exact assertion path>
- If none, say why: not needed, not possible, or missing.

**Gap / decision**
- <gap the reviewer must accept, reject, or ask to fix>
```

## Danger Checklist

Use this checklist to find invariants:

- **Client can lie:** `request.data`, cookies, headers, query params, body fields.
- **Money moves:** Stripe charges, credits, refunds, balance transactions, payouts.
- **Identity changes:** `uid`, email, customer id, promoter id, account id.
- **Data is remembered:** Firestore `.create`, `.set`, `.update`, `.add`, deletes.
- **External systems decide:** Stripe, FirstPromoter, Firebase, Stream, webhooks.
- **Same event repeats:** retry, idempotency, duplicate, concurrent, replay.

If two or more danger types overlap, review that path deeply.

## Proof Standards

- **Code proof:** cite the line and translate it. Example: `create()` means the doc
  must not already exist; ``.doc(`signup_${uid}`)`` chooses one fixed document id.
- **Test proof:** state the setup and assertions. Example: two concurrent calls,
  one Stripe key, one created doc.
- **Emulator proof:** prefer actual stdout. If assertions are silent, recommend
  short proof logs for high-risk paths.
- **Browser proof:** when behavior depends on browser cookies/scripts/storage,
  require Playwright or equivalent browser execution. Do not invent browser-owned
  values in Node.

## Review Packet Format

When asked for a full PR review packet, produce:

```md
## Scope
- <what changed>

## High-Risk Paths
- <money/auth/client input/external API paths>

## Invariants
1. <rule>
2. <rule>

## Review Order
1. tests
2. resolver/helper
3. entrypoint/money path
4. external API client
5. emulator scripts
6. docs

## Proof Matrix
| Invariant | Code proof | Unit proof | Emulator proof | Gap |
|---|---|---|---|---|

## Known Tradeoffs
- <tradeoff requiring reviewer decision>

## Suggested Final PR Summary
- <verification commands and proof logs>
```

## Interaction Style

- Guide the reviewer step by step.
- When the reviewer says a step is too hard, simplify to one concrete question.
- When the reviewer asks “prove it,” show code, test assertions, and emulator output.
- When evidence is missing, say so directly and suggest the smallest useful test/log.
- Keep outputs short unless the user asks for the full packet.
