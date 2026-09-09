---
name: fastapi-conventions
description: How to write an endpoint in this repo — auth dependency, response shape, validation, secrets, retries, idempotency, logging, and the done checklist. Use whenever writing or reviewing an endpoint, service, or external-API client under app/.
---

# FastAPI Conventions

`CLAUDE.md` states the principles. This skill is how they look in code. When the two
disagree, fix both.

Auth, validation, response shape, and logging apply to every endpoint. Retries and
idempotency apply to external APIs and anything that costs money or sends a message.

## Layout

```
app/
  core/            # auth, config, logging, errors — shared, built once
  domains/{name}/
    routes.py      # HTTP only: parse request, call service, return model
    service.py     # the only writer for this domain
    models.py      # Pydantic request/response shapes
tests/
  test_{domain}.py
```

Routes hold no business logic. Services hold no HTTP.

## 1. Auth — every endpoint, first

Every endpoint outside `/health*` takes the auth dependency. The caller sends a bearer
token; the dependency verifies it and returns an `AuthCaller` (role + id), never a bare
uid. Members and coaches send an Identity Platform ID token. Cloud Scheduler and
Pathfinder send a Google OIDC token and have no uid. One dependency handles both. No
flag turns this off.

```python
from enum import StrEnum
from typing import Annotated
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

bearer = HTTPBearer()

class AuthCallerRole(StrEnum):
    MEMBER = "member"
    COACH = "coach"
    SERVICE = "service"

class AuthCaller(BaseModel):
    role: AuthCallerRole
    id: str  # uid for member/coach; service name for service

def current_caller(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(bearer)],
) -> AuthCaller:
    # Try firebase_admin.auth.verify_id_token, then google.oauth2.id_token.verify_oauth2_token.
    # Add firebase-admin to pyproject first.
    ...

def require(*roles: AuthCallerRole):
    def check(caller: Annotated[AuthCaller, Depends(current_caller)]) -> AuthCaller:
        if caller.role not in roles:
            raise HTTPException(status_code=403, detail="forbidden_for_role")
        return caller
    return check

@router.get("/members/me/week")
def week(
    caller: Annotated[AuthCaller, Depends(require(AuthCallerRole.MEMBER))],
) -> WeekResponse:
    ...
```

Then authorize: who may call this — the owning member, a coach, ops? Check it in the
service, not the route, and name the rule in the endpoint's docstring.

**Stripe webhooks are the one exception.** Stripe posts unauthenticated. Verify the
`Stripe-Signature` header instead, and keep the route out of any router-level auth
dependency.

### Testing with auth on

Override the dependency in tests. Nothing in `app/` changes.

```python
app.dependency_overrides[current_caller] = lambda: AuthCaller(
    role=AuthCallerRole.MEMBER, id="test-uid"
)
```

For manual calls, get a real token for a test account and paste it into the
`/docs` Authorize button or a curl header. Tokens last one hour.

## 2. Response shape

Every endpoint returns a Pydantic model declared as the return type. No bare dicts.
Errors raise `HTTPException` with a specific `detail` code the client can branch on.

```python
raise HTTPException(status_code=404, detail="member_not_found")
```

Codes name the cause: `member_not_found`, `not_subscribed`, `week_out_of_range`,
`self_referral`. Never `error`, `invalid_input`, or `failed`.

## 3. Input validation

Pydantic validates types and required fields on request models. Normalise in the model
when a downstream lookup expects a canonical form — trim and lowercase referral codes,
for example — with a `field_validator`. Never re-validate by hand what the model already
enforces.

Never accept a server-known id from the client (Stripe customer id, coach id, cohort).
Look it up by uid. See `CLAUDE.md`.

## 4. Config and secrets

One `Settings` class in `app/core/config.py` using `pydantic-settings` (pin `>=2.15,<2.16`).
It lists every variable the app needs, typed. No `os.environ` calls anywhere else.

Values resolve in this order — first match wins:

1. `.env` file (local only, gitignored)
2. Real environment variable (what Cloud Run sets)
3. Default on the field (`gcp_project_id` defaults to `matriarchproduct`; `.env` sets `matriarchtest` locally)

A missing required field fails at startup, not mid-request. Secrets come from Secret
Manager on Cloud Run and from `.env` locally; the code does not know which.

## 5. External API calls

Use `httpx2` (`import httpx2 as httpx`) with an explicit timeout. It is a dev dependency today
because Starlette's `TestClient` prefers it; add it to main `dependencies` before the first
outbound call or Cloud Run will fail to import it. `httpx` 0.x is also in the venv via
`fastapi[standard]` — do not import it. Retry network errors and 5xx, three attempts, linear
backoff. Skip 4xx — the vendor said no.

Never wrap a Firestore write in a retry.

Distinguish unreachable from rejected: a timeout or 5xx fails open, an explicit 4xx fails
closed. Raise different exceptions for the two so the service can branch.

## 6. Idempotency

Required for payments, credits, subscriptions, emails, and every webhook receiver.

- Idempotency key when the vendor supports one (Stripe does).
- Otherwise check existing state before the write.
- For non-idempotent creates with no key: look up first, create only if absent.

Webhook receivers record the event id before acting; a repeat id is a no-op returning 200.

## 7. Logging

JSON to stdout with `severity` and `event`, so Cloud Logging can query and alert.

```python
log.error("credit_failed", uid=uid, err=str(exc))
```

No `print`. Never log a token, a full document, or member health data.

## 8. Resilient writes

If the external mutation succeeded and the audit-log write failed, return success and log
the error. On final failure for a money flow, write a `status: failed` record for
reconciliation, then raise.

## 9. Query bounds

Every Firestore query has a limit or a bounded range. No reads inside a loop — batch
instead. Return counts or slices, never whole collections.

## 10. Version drift

Before the first call into any library or vendor API:

1. Find its pinned version in `uv.lock`.
2. Read that version's source in `.venv/lib/python3.13/site-packages/<pkg>` or its changelog.
3. Write the call against what is there, not what you remember.

Vendor API versions are pinned once, in the client module — e.g. `stripe.api_version` —
never per call. If the installed version differs from what a doc or skill says, the
installed version wins; fix the doc.

## Done checklist

- [ ] Auth dependency on the route; authorization rule checked in the service and named in the docstring.
- [ ] Pydantic request and response models; no bare dicts.
- [ ] Errors are `HTTPException` with a specific code.
- [ ] Server-known ids looked up by uid, not accepted from the client.
- [ ] Money, messages, and webhooks have an idempotency guard.
- [ ] External calls: `httpx2`, timeout, retry 5xx/network only, fail-open vs fail-closed distinguished.
- [ ] No Firestore write inside a retry.
- [ ] Every query bounded; no reads in a loop.
- [ ] Structured logs; no `print`; no PHI or tokens logged.
- [ ] Test written and run: `uv run pytest`. Auth overridden, not disabled.
- [ ] `uv run ruff check` and `uv run mypy` clean.
- [ ] Every new library or vendor call checked against the installed version in `uv.lock`.
- [ ] Verb catalog row updated if this endpoint implements a VERB.
