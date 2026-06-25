---
name: write-feature-goal
description: Write a well-formed `/goal` completion condition for a multi-step or autonomous task — especially side-effecting code (money, auth, external webhooks, migrations) where "tests pass" alone is not real verification. Use whenever drafting a `/goal` invocation, or reviewing one someone else wrote.
---

# Writing a `/goal`

`/goal <condition>` loops until the condition is true, with no opinion on how to phrase it. A
vague condition lets the model declare victory the moment something superficially resembles done.

## Six elements

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
- **Provenance check** — before treating a field's value as fact (especially one read from an
  external system), trace it back to the code that sets it. If nothing in the codebase writes
  that value, it doesn't exist — flag the gap, don't write code or review findings that assume
  it does.

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
- **A dedup fix must not silently become a retry-blocker.** If a finding is "duplicate writes on
  retry," the fix should stop the *duplication*, not stop the *retry* — conflating the two turns
  a transient failure into a permanent one. State explicitly, when fixing this class of issue,
  whether retries of a still-recoverable failure remain possible after the fix.
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
- Provenance check: every field read from the webhook and treated as fact (especially
  promoter.cust_id) is traced back to the code that actually sets it before being relied on.

Doc-code consistency: REFERRAL_BE_ENG_PLAN.md's auth and payload TBDs are marked resolved.

Constraints: do not modify applyStripeReferralCredit.js, validateReferralCode.js,
registerReferral.js, or firstPromoterClient.js.

Boundaries: no deploys, no FirstPromoter dashboard changes, no prod secrets.
```

Each clause is one element or one hard-rule category: the opening sentence is the **outcome**;
the emulator-script paragraph is the **verification surface**, with each parenthetical mapping to
a category (idempotency, auth rejection, reverse-lookup → targeting, response codes → contract,
orphaned promoter → graceful degradation, non-credit units → out-of-scope input, the Firestore
clause → partial-failure tolerance — that last check actually lives in a mocked Jest test, not
the emulator script, because the emulator's real Firestore connection couldn't be selectively
broken for one write; the goal text says so instead of dropping it). The TBD-resolution sentence
is part of the outcome (doc-code consistency). The "do not modify" list is **constraints**. "No
deploys/dashboard/secrets" is **boundaries**.

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
| Eng-plan TBDs marked resolved | Doc-code consistency |

All these checks lived in **one** emulator script as sequential assertions, not one script per
check — matching this repo's one-file-per-function test-script pattern.

## Before finalizing

- [ ] Outcome is concrete — names the function and its exact trigger, not just "works."
- [ ] Every hard-rule category has been explicitly considered (applies / doesn't apply / covered
      in a different layer than expected).
- [ ] Constraints name the specific already-shipped files that must not change.
- [ ] Boundaries forbid deploys, prod secrets, and dashboard changes unless truly needed.
- [ ] Any unconfirmed external contract (vendor API/webhook shape) was verified against real
      documentation, not assumed — with an implied blocked-stop if live behavior disagrees.
- [ ] After any fix, the verification surface was re-run end-to-end (not just the fastest/mocked
      layer) before calling the fix done.
