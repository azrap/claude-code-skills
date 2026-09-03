---
name: code-review-backend-architecture
description: Architectural review of a diff under app/ — traces callers and callees beyond the diff, flags single-writer violations, duplicated logic, unbounded queries, missing idempotency, and old patterns. Use on any PR where a changed function is called elsewhere or a convention may have drifted.
---

# Backend Architecture Review

Review the current diff for contract breaks, downstream impact, and pattern drift. This is
a PR review, not a cleanup pass.

## Steps

1. **Read the diff.** List every changed function, class, model, and route by name.
2. **Trace callers.** Grep for each changed symbol. Flag any caller that now expects the
   old signature or return shape.
3. **Trace callees.** For each changed function, check what it calls still matches what
   it now expects.
4. **Check the single-writer rule.** Any write to a domain's data from outside that
   domain's `service.py` is a finding, whatever the reason.
5. **Check duplication.** See below. Grep before flagging.
6. **Check the pattern table.** Flag any old pattern in changed files.
7. **Report** grouped by severity:
   - **Likely broken** — contract mismatch that will error or return wrong data
   - **Pattern drift** — old pattern where a new one is required; file and line
   - **Worth noting** — inconsistency that won't break now but should not spread

## Scope

- Only files in the diff, or files that directly call changed symbols.
- Do not infer the correct pattern from how many files use it. Use the table.

## Keep code DRY

Flag in the diff:

- Logic that duplicates an existing helper — grep for the behaviour first. Retry loops,
  date math, Firestore path builders, and token parsing are the usual repeats.
- The same validation in two routes or services. It belongs in one Pydantic model or
  one function.
- A constant (string, number, limit, collection name) already defined elsewhere. Point
  at the existing definition.
- Date and week arithmetic reimplemented per endpoint. The whole reason this backend
  exists is that every client recomputed "which week is this" by hand.

Do not flag a first use. Extract on the second, not on the first.

## Old vs new patterns

| Old (flag it) | New (enforce this) | Why |
|---|---|---|
| `print` or bare `logging` strings | Structured JSON log with `severity` and `event` | Queryable and alertable in Cloud Logging |
| Generic error codes (`error`, `invalid_input`, `failed`) | Specific codes (`member_not_found`, `not_subscribed`) | Client can branch; ops can triage |
| Server-known id accepted from the request | Look up by authenticated uid | A modified client can substitute another member's id |
| Endpoint without the auth dependency | `Depends(current_uid)` on every non-health route | Unauthenticated mutation; see VERB-037 |
| Auth disabled by flag or env var | Dependency override in tests only | A flag left in the wrong position ships |
| `os.environ` outside `app/core/config.py` | `Settings` object | One place to see what the app needs |
| Firestore write from outside the domain's `service.py` | Call the service | Single writer per kind of data |
| Unbounded `.stream()` or `.get()` on a collection | `.limit()` or a bounded range | 50k reads/day free tier; 100 × 600 docs blows it |
| Firestore read inside a loop | Batch or `in` query | N+1 |
| Firestore write inside a retry | Retry the external call only | A retried create is a duplicate |
| One `except Exception` for an external call | Separate unreachable (5xx, timeout) from rejected (4xx) | Fail open vs fail closed |
| `except: pass` or `except Exception: return None` with no log | Log with `event` and re-raise or return a typed failure | Silent swallow loses the paper trail |
| Business logic in `routes.py` | `service.py` | Routes are HTTP only |
| Bare `dict` return from a route | Pydantic response model | Contract is visible and validated |

## Architecture findings

Flag in the diff:

- A service doing more than one job. Split it.
- A webhook receiver with no idempotency guard. Double-fire means double side effect.
- A money, credit, subscription, or email flow with no idempotency key or existing-state check.
- Terminal failure after retries with no `failed` record written. Loses the reconciliation trail.
- A missing `await` on an async write that must finish before the next step.
- A domain model imported into another domain's service to write to it.
- A new endpoint whose VERB row in `docs/verb-catalog.md` was not updated, or that
  has no VERB at all and no note saying why.
