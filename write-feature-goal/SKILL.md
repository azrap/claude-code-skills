---
name: write-feature-goal
description: Write a well-formed `/goal` completion condition for a multi-step or autonomous task — especially side-effecting code (money, auth, external webhooks, migrations) where "tests pass" alone is not real verification. Use whenever drafting a `/goal` invocation, or reviewing one someone else wrote.
---

# Writing a `/goal`

`/goal <condition>` loops until the condition is true, with no opinion on how to phrase it. A
vague condition lets the model declare victory the moment something superficially resembles done.

## Open-question gate

Before finalizing a runnable goal:

1. Research answers available from the codebase and official documentation.
2. Identify every material unknown across the outcome, inputs, external contracts, side-effect
   order, failure behavior, constraints, boundaries, and verification surface.
3. Ask the user questions until no material decisions remain. Ask only what cannot be established
   from evidence; do not make the user answer discoverable repo or documentation questions.

Do not present a goal as final or ready to run while material questions remain. A preliminary
version must be labeled **Draft — blocked on open questions** and list what still needs an answer.

## Required skills gate

Before finalizing a runnable goal, identify which skills apply and add a **Required skills**
section to the goal. For each skill, state what it must be used for. If no skills apply, write
`Required skills: none`.

Examples:

- `gcf-conventions` — use before writing or reviewing a Google Cloud Function.
- `gcf-emulator-test` — use before writing or running an emulator verification script.
- `write-feature-goal` — use to draft or review the goal itself.

## Seven elements

1. **Outcome** — name the function/feature and the exact external trigger or input it handles.
2. **Verification surface** — tests/scripts/artifacts that prove it's done. Must be
   evidence-audited, not self-assessed by the model doing the work — a passing test against a
   guessed shape isn't evidence the real thing works.
3. **Constraints** — already-shipped files/functions that must not change.
4. **Boundaries** — allowed resources, and explicitly forbidden ones (deploys, prod secrets,
   external dashboard config) — those are manual, human-gated steps, not autonomous-loop actions.
5. **Iteration policy** — usually left implicit; spell out only if the task's ordering is
   genuinely non-obvious.
6. **Blocked-stop condition** — stop and report an impasse instead of guessing. Most often needed
   when the goal depends on an external contract (a vendor's documented webhook/API behavior)
   that isn't yet confirmed — if live behavior disagrees with the docs, stop and report rather
   than silently adapting and declaring success.
7. **Give-up condition** — stop after 3 consecutive verification-surface runs where the set of
   failing checks hasn't changed (not just "ran 3 times" — specifically, no check flipped from
   fail to pass between runs). Report which checks are still red and what was tried. This is a
   different trigger than blocked-stop: blocked-stop fires on an external ambiguity (something to
   ask about); give-up fires on internal thrashing (the same approach isn't converging, and
   another identical attempt won't either — a different strategy would be a new attempt, not a
   retry).

## Hard rule: tests + lint are necessary, not sufficient

For money/auth/external-input code, "tests and lint pass" proves correctness-in-isolation and
style — not the behaviors that matter in production. Check the verification surface against each
category below and decide explicitly whether it applies:

- **Idempotency** — duplicate request → one side effect, not two.
- **Auth/security rejection** — bad credential rejected; good credential accepted.
- **Correct targeting** — the side effect lands on the *correct* record, not just *a* record
  (e.g. a reverse-lookup hitting the right ID).
- **Response-contract correctness** — status/return shape matches what the real caller expects
  on success vs. pending vs. failure.
- **Graceful degradation** — missing/orphaned referenced data doesn't crash; fail-open or
  fail-closed, chosen deliberately.
- **Out-of-scope input handling** — an unexpected event/field value: ignore-and-log vs. error,
  decided explicitly.
- **Partial-failure tolerance** — if a secondary write (e.g. an audit log) fails after the
  primary side effect succeeded, does the function still report success? Decide explicitly.
- **State consistency** — after a successful run, are *all* stores that should be updated
  actually updated? For multi-system writes (e.g. Stripe + Firestore), verify both, not just
  the primary. A partial state (Stripe credited, Firestore doc missing) is a failure even if
  the function returned 200.
- **Replay safety under partial failure** — if the primary side effect succeeded but a secondary
  write failed, and the caller retries, does the retry skip the primary rather than re-applying
  it? Distinct from idempotency (which covers clean duplicate events): this is the
  partial-failure-then-retry path. Best covered in a mocked unit test where the secondary write
  can be selectively failed, then the handler re-invoked.
- **Provenance check** — before treating a field's value as fact (especially one read from an
  external system), trace it back to the code that sets it. If nothing in the codebase writes
  that value, it doesn't exist — flag the gap, don't write code or review findings that assume
  it does.

If a category's applicability can't be determined from the code alone (e.g. you can't tell
whether an external system is idempotent without knowing its documented behavior), ask the user
before writing the verification surface. Don't skip it or guess.

If a category can't be exercised through the verification layer you're using (e.g. an emulator
script can't selectively break one Firestore write while an earlier read still works), name the
layer that *can* — push it into a mocked unit test instead, and say so in the goal text rather
than dropping the check.

## After the checks run

Writing a good verification surface isn't the end of the story — checks running green, and fixes
made in response to findings, need their own scrutiny:

- **Flag unverified claims, especially ones already marked resolved.** A claim phrased as fact
  in a doc or comment is not the same as a claim someone traced back to where it's verified. If
  a goal or its supporting docs assert something about external behavior, check for a citation
  (a doc link, a test, an actual code path) — not just confident wording. "Resolved"/"confirmed"
  labels need the same scrutiny as unlabeled claims, since a wrong label is what makes a false
  claim stick.
- **Dedup ≠ retry-blocker.** A dedup guard should only skip a request that already *succeeded*.
  If it skips based on "any record exists" — including failed ones — it accidentally blocks
  retries forever.

  Example: a webhook tries to credit a user, Stripe is briefly down, code writes
  `status: "failed"`. The webhook retries a minute later. A guard that checks "does a record
  exist?" sees the failed doc and skips — the user never gets credited, ever. Fix: check
  `status === "applied"` specifically. A failed doc doesn't match, so the retry goes through and
  tries Stripe again.
- **Re-run the full verification surface after every fix, not just the fastest layer.** Tests
  passing on a fix is not evidence the fix works against the real system the goal cares about —
  same principle as the hard rule above, extended to apply after changes, not only to the
  original code.
- **A flaky verification script produces a false signal against the code, not against itself.**
  If a verification script talks to a real external system, give it the same uniqueness/replay
  hygiene a production idempotency key would need — otherwise a failure caused by the script's
  own state collisions gets debugged as if it were a bug in the code under test.

## Worked example

A webhook handler crediting a referring user on a `fulfilment_pending` vendor event:

```
/goal

Outcome: applyStripeReferralReward() handles the FirstPromoter fulfilment_pending webhook end to
end.

Verification surface: npm test and npm run lint pass. A single emulator script
(functions/test-scripts/referrals/emulator-verify-referral-reward.js, same one-file-per-function
pattern as emulator-verify-referral-credit.js) runs all of the following as sequential
assertions:
- Idempotency: duplicate event -> one credit, not two.
- Auth rejection: missing/wrong secret header -> rejected; correct header -> accepted.
- Correct targeting: credit lands on the right Firebase uid via the firstPromoterId
  reverse-lookup.
- Response-contract correctness: 200 only after the credit is actually applied.
- Graceful degradation: an orphaned promoter.id (no matching firstPromoterId) -> failed doc +
  non-2xx, no crash.
- Out-of-scope input handling: non-credit reward units (e.g. free_months) -> log + 200, no
  credit.
- Partial-failure tolerance: a Firestore audit-doc failure after a successful Stripe credit
  still returns 200 with a loud logged error (core success doesn't depend on the log write).
- State consistency: after a successful credit, both the Stripe balance (= -$30) and the
  referralRewards doc (status = "applied") are verified — not just the HTTP 200.
- Replay safety under partial failure: covered in a mocked Jest test — Firestore write fails
  after Stripe succeeds, handler re-invoked with the same fulfilment id, Stripe called exactly
  once total (idempotency key prevents double-apply on retry).
- Provenance check: every field read from the webhook and treated as fact (especially
  promoter.cust_id) is traced back to the code that actually sets it before being relied on.

Doc-code consistency: REFERRAL_BE_ENG_PLAN.md's auth and payload TBDs are marked resolved.

Constraints: do not modify applyStripeReferralCredit.js, validateReferralCode.js,
registerReferral.js, or firstPromoterClient.js.

Boundaries: no deploys, no FirstPromoter dashboard changes, no prod secrets.

Give-up condition: after 3 consecutive emulator-script runs with the same checks still failing,
stop and report which checks are red and what was tried.
```

Each clause is one element or one hard-rule category: the opening sentence is the **outcome**;
the emulator-script paragraph is the **verification surface**, with each parenthetical mapping to
a category (idempotency, auth rejection, reverse-lookup → targeting, response codes → contract,
orphaned promoter → graceful degradation, non-credit units → out-of-scope input, the Firestore
clause → partial-failure tolerance, the balance+doc clause → state consistency — those last two
checks actually live in mocked Jest tests, not the emulator script: partial-failure tolerance
because the emulator's real Firestore connection couldn't be selectively broken for one write,
and replay safety because re-invoking the handler after a selectively-failed write requires the
same mock control; the goal text says so instead of dropping either check). The TBD-resolution sentence
is part of the outcome (doc-code consistency). The "do not modify" list is **constraints**. "No
deploys/dashboard/secrets" is **boundaries**. The final sentence is the **give-up condition**.

This was drafted as a table first — check, what it proves — before being folded into one
paragraph:

| Check | Proves |
|---|---|
| Duplicate event posted twice → one credit | Idempotency |
| Missing/wrong secret header → rejected; correct header → accepted | Auth actually works |
| Seeded `firstPromoterId` → credit lands on that exact uid | Reverse-lookup correctness |
| 200 only after credit applied | Matches the vendor's retry contract |
| Orphaned `promoter.id` (no matching record) → failed doc + non-2xx, no crash | Graceful failure, not silent drop |
| Non-credit `unit` (e.g. `free_months`) → log + 200, no credit applied | Doesn't misapply wrong reward type |
| Stripe credit succeeds, Firestore log write fails → still returns 200, logs loudly | Core success ≠ logging success |
| Stripe balance = -$30 AND referralRewards doc status = "applied" after success | Both stores consistent, not just primary |
| Firestore write fails after Stripe succeeds → retry → Stripe called once total | Replay safety: idempotency key prevents double-apply |
| Eng-plan TBDs marked resolved | Doc-code consistency |

All these checks lived in **one** emulator script as sequential assertions, not one script per
check — matching this repo's one-file-per-function test-script pattern.

## Before finalizing

- [ ] No material open questions remain; every unresolved decision was researched or answered by
      the user before the goal was finalized.
- [ ] Required skills are listed in the goal, with what each one must be used for; or the goal
      explicitly says `Required skills: none`.
- [ ] Outcome is concrete — names the function and its exact trigger, not just "works."
- [ ] Every hard-rule category has been explicitly considered (applies / doesn't apply / covered
      in a different layer than expected).
- [ ] Constraints name the specific already-shipped files that must not change.
- [ ] Boundaries forbid deploys, prod secrets, and dashboard changes unless truly needed.
- [ ] Any unconfirmed external contract (vendor API/webhook shape) was verified against real
      documentation, not assumed — with an implied blocked-stop if live behavior disagrees.
- [ ] After any fix, the verification surface was re-run end-to-end (not just the fastest/mocked
      layer) before calling the fix done.
- [ ] A give-up condition is stated: stop after N consecutive runs with no check flipping from
      fail to pass (default N=3), and report what's still red instead of continuing to guess.
- [ ] Any category whose applicability couldn't be determined from the code was clarified with
      the user before the verification surface was written — not skipped or guessed.

## Keep this skill current

If you hit a verification gap this skill didn't cover — a hard-rule category that didn't fit, a
give-up threshold that was wrong for the situation, an external contract quirk worth recording —
find a solution for the task at hand, then propose an addition to this file (don't edit it
directly) and wait for approval before applying it.
