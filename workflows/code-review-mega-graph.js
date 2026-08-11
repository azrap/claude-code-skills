export const meta = {
  name: 'code-review-mega-graph',
  description: 'Parallel mega code review: 4 passes fan out, findings merge, plausible findings face independent skeptics, confirmed findings get fixed and verified',
  whenToUse: 'Before merging high-stakes code (payments, auth, subscriptions). Costs several times a normal review; not worth it for small or low-risk diffs.',
  phases: [
    { title: 'Review', detail: '4 independent passes over the same diff' },
    { title: 'Merge', detail: 'dedupe and classify findings' },
    { title: 'Refute', detail: '3 independent skeptics per plausible finding' },
    { title: 'Fix', detail: 'fix confirmed findings, then typecheck/lint/test' },
    { title: 'Report', detail: 'write MEGA_CODE_REVIEW_REPORT.md' },
  ],
}

// ---------------------------------------------------------------------------
// Invocation
//
//   /code-review-mega-graph
//   /code-review-mega-graph {"tier": "payments"}
//   /code-review-mega-graph {"tier": "payments", "scope": "1042", "fix": true}
//
// A bare string is treated as scope: /code-review-mega-graph "functions/referral"
// ---------------------------------------------------------------------------

const opts = typeof args === 'string' ? { scope: args } : (args ?? {})

const scope = opts.scope
  ? `Review scope: ${opts.scope}. Resolve it as a PR number, branch, commit range, or path, whichever matches.`
  : 'Review the current working-tree and staged diff.'

const shouldFix = opts.fix === true

// Two tiers. `payments` puts the strongest model on every stage because a
// missed bug costs real money; `standard` keeps the bulk passes on Sonnet and
// spends Opus on the step that decides what survives.
const TIERS = {
  standard: { passes: 'sonnet', skeptics: 'opus', fix: 'opus' },
  payments: { passes: 'opus', skeptics: 'opus', fix: 'opus' },
}

const tierName = opts.tier && TIERS[opts.tier] ? opts.tier : 'standard'
const tier = TIERS[tierName]

// xhigh is the documented setting for coding and agentic work; the refute step
// decides what reaches the user, so it runs at the top of the ladder.
const EFFORT = { passes: 'high', skeptics: 'xhigh', fix: 'xhigh' }

log(`Tier: ${tierName} (passes: ${tier.passes}, skeptics: ${tier.skeptics}) — ${shouldFix ? 'fix confirmed findings' : 'report only'}`)

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'file', 'evidence', 'impact', 'confidence'],
        properties: {
          title: { type: 'string', description: 'Short title for the finding' },
          file: { type: 'string', description: 'Repo-relative path' },
          line: {
            type: 'integer',
            description: '1-indexed line. Omit for a finding about the file as a whole — do not invent one.',
          },
          evidence: { type: 'string', description: 'Concrete code evidence that the issue is present' },
          impact: { type: 'string', description: 'What breaks, under what input or state' },
          recommendation: { type: 'string', description: 'Suggested fix' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          confidence: {
            type: 'string',
            enum: ['confirmed', 'plausible'],
            description: 'confirmed = direct code evidence; plausible = needs a second look',
          },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['refuted', 'reasoning'],
  properties: {
    refuted: { type: 'boolean', description: 'True if the finding does NOT hold up' },
    reasoning: { type: 'string', description: 'What in the code confirms or disproves it' },
  },
}

const FIX_SCHEMA = {
  type: 'object',
  required: ['applied', 'summary'],
  properties: {
    applied: { type: 'array', items: { type: 'string' }, description: 'Findings fixed, as "file:line — title"' },
    skipped: { type: 'array', items: { type: 'string' }, description: 'Findings left alone, each with the reason' },
    summary: { type: 'string' },
    verification: {
      type: 'object',
      properties: {
        typecheck: { type: 'string', description: 'command — pass | fail | not configured' },
        lint: { type: 'string' },
        tests: { type: 'string' },
        emulator: { type: 'string', description: 'emulator scripts run, or why they were skipped' },
      },
    },
  },
}

// The four passes are independent by design: none reads another's output, so
// each sees the original implementation rather than a partially-reviewed one.
// Report-only regardless of --fix, so later passes inspect unmodified code.
const PASSES = [
  {
    key: 'simplify',
    prompt: `Review the diff for reuse, simplification, efficiency, and altitude cleanups.
Flag: logic duplicating an existing util or helper, the same validation repeated across
functions, hardcoded constants already defined elsewhere, and overly complicated logic
that can be simplified. Grep for existing helpers before flagging duplication.`,
  },
  {
    key: 'security-review',
    prompt: `Review the diff for security issues.
Flag especially: server-known values accepted from the client instead of looked up by
authenticated uid, missing or weak input validation, secrets read at module scope,
missing auth checks, and anything that lets a modified client act on another user's data.`,
  },
  {
    key: 'backend-architecture',
    prompt: `Review the diff for architectural problems, scoped to functions/.
Trace callers and callees of every changed symbol: flag any caller whose behavior is now
inconsistent with the updated callee, and any callee that no longer matches what its
caller expects.

Flag these patterns where the diff touches them:
  - console.log/error/warn instead of functions.logger.*
  - generic error codes ("error", "failed") instead of specific ones
  - server-known IDs accepted from the client rather than looked up by authenticated uid
  - defineSecret().value() called at module scope rather than inside a lazy getter
  - logic added directly to functions/index.js instead of functions/{feature}/
  - webhook handlers with no idempotency guard (double-fire = double side effect)
  - terminal failure after retries with no status:"failed" doc written
  - missing await on a Firestore write that must land before the next step
  - Firestore reads inside a loop (N+1)
  - catch blocks that swallow the error with no log

If the diff does not touch functions/, return an empty findings array.`,
  },
  {
    key: 'code-review',
    prompt: `Review the diff for correctness bugs: logic errors, off-by-one, wrong comparison
operators, unhandled edge cases, race conditions, and incorrect error handling.
For each finding, name the concrete input or state that produces the wrong outcome.`,
  },
]

// Coverage over self-filtering: a reviewer told to report only high-severity
// issues investigates just as hard and then drops findings below its own bar,
// which reads as a recall regression. Filtering happens in Refute instead.
const REPORTING_RULES = `
Report every issue you find, including ones you are uncertain about or consider
low-severity. Do not filter for importance or confidence — a separate verification
step does that. Mark a finding "confirmed" only when direct code evidence shows the
issue is present; otherwise mark it "plausible".

Report only. Do not modify any file.`

phase('Review')

const passResults = await parallel(
  PASSES.map(pass => () =>
    agent(`${scope}\n\n${pass.prompt}\n${REPORTING_RULES}`, {
      label: `review:${pass.key}`,
      phase: 'Review',
      model: tier.passes,
      effort: EFFORT.passes,
      schema: FINDINGS_SCHEMA,
    }).then(result => ({ pass: pass.key, findings: result?.findings ?? [] }))
  )
)

const completed = passResults.filter(Boolean)
const noResult = PASSES
  .filter(p => !completed.some(c => c.pass === p.key))
  .map(p => p.key)

// Barrier is deliberate: deduping needs every pass's findings at once.
phase('Merge')

const all = completed.flatMap(r => r.findings.map(f => ({ ...f, foundBy: r.pass })))

// Same file+line from two passes is one finding credited to both.
//
// Confidence is promoted only when the titles match. Two passes can flag
// different problems on the same line — a plausible injection and a confirmed
// unused variable — and promoting across them would send an unconfirmed
// finding to the fixer under another finding's evidence.
const sameFinding = (a, b) =>
  a.title.trim().toLowerCase() === b.title.trim().toLowerCase()

// Line is optional: a finding can be about a file as a whole. Those dedupe on
// the file alone and go through refutation like any other. Forcing a line here
// would make a pass invent one, and a skeptic would then refute a real finding
// for pointing at nothing.
//
// Coerce a numeric string rather than discarding a usable line.
const lineOf = f => {
  const n = typeof f.line === 'string' ? Number(f.line) : f.line
  return Number.isInteger(n) ? n : null
}

// Only a missing file makes a finding unactionable — nothing to open, nothing
// to dedupe against. Those are held aside and reported on their own.
const hasFile = f => typeof f.file === 'string' && f.file.trim() !== ''

const locatable = all.filter(hasFile).map(f => ({ ...f, line: lineOf(f) }))
const unlocated = all.filter(f => !hasFile(f))

// "src/a.js:42" when there is a line, "src/a.js" when the finding covers the
// whole file. Used for the dedupe key, agent labels, and the fix list.
const where = f => (f.line === null || f.line === undefined ? f.file : `${f.file}:${f.line}`)

const byLocation = new Map()
for (const f of locatable) {
  const key = where(f)
  const existing = byLocation.get(key)
  if (existing) {
    if (!existing.foundBy.includes(f.foundBy)) existing.foundBy.push(f.foundBy)
    if (f.confidence === 'confirmed' && sameFinding(existing, f)) {
      existing.confidence = 'confirmed'
    }
  } else {
    byLocation.set(key, { ...f, foundBy: [f.foundBy] })
  }
}

const merged = [...byLocation.values()]
const selfConfirmed = merged.filter(f => f.confidence === 'confirmed').length

log(`${merged.length} unique findings (${selfConfirmed} self-reported confirmed) from ${completed.length}/${PASSES.length} passes`)
if (noResult.length) log(`Passes that returned nothing usable: ${noResult.join(', ')}`)
if (unlocated.length) log(`${unlocated.length} findings named no file — reported separately, not refuted or fixed`)

// The point of the whole workflow. Each skeptic has a fresh context and never
// saw the finding get raised, so refuting it is a real attempt rather than a
// model re-reading and re-agreeing with its own reasoning. Three distinct
// lenses rather than three identical refuters — diversity catches failure
// modes redundancy can't.
//
// Every finding goes through this, not just the plausible ones. A pass calling
// its own finding "confirmed" is self-assessment, and those are the findings
// the fixer acts on — the ones that most need an independent check.
phase('Refute')

const LENSES = [
  'correctness — does the described failure actually follow from this code?',
  'guards — is there validation, a framework guarantee, or an earlier check that already prevents this?',
  'reproduction — can you name concrete inputs or state that trigger it? If not, it is speculative. A finding about a file as a whole is not speculative merely for lacking a line number.',
]

// A self-reported "confirmed" still gets an independent check, but one lens
// rather than three: it already carries direct code evidence, and these are
// the findings the fixer acts on. Plausible findings get all three.
const lensesFor = finding =>
  finding.confidence === 'confirmed' ? LENSES.slice(0, 1) : LENSES

const judged = await parallel(
  merged.map(finding => () =>
    parallel(
      lensesFor(finding).map(lens => () =>
        agent(
          `${scope}

A review pass flagged this finding. Judge whether it holds up.

  Title:      ${finding.title}
  Location:   ${where(finding)}${finding.line == null ? ' (whole file — no single line)' : ''}
  Evidence:   ${finding.evidence}
  Impact:     ${finding.impact}

Examine it through this lens: ${lens}

Read the actual code and the surrounding implementation, then decide. Default to
refuted=true when uncertain — a finding that cannot be tied to concrete code should
not survive. Report only; do not modify any file.`,
          {
            label: `refute:${where(finding)}`,
            phase: 'Refute',
            model: tier.skeptics,
            effort: EFFORT.skeptics,
            schema: VERDICT_SCHEMA,
          }
        )
      )
    ).then(verdicts => {
      const dispatched = lensesFor(finding).length
      const votes = verdicts.filter(Boolean)
      const upheld = votes.filter(v => !v.refuted).length

      // Require most of the skeptics we dispatched to have actually answered.
      // Otherwise a 3-lens finding that loses two agents to errors would be
      // decided by one surviving vote, which is a majority of one and quietly
      // lowers the bar. Too few answers means unverified, not upheld.
      const quorum = Math.ceil(dispatched / 2)
      const hasQuorum = votes.length >= quorum

      return {
        ...finding,
        survived: hasQuorum && upheld > votes.length / 2,
        unverified: !hasQuorum,
        verdicts: votes,
        votesCast: votes.length,
        votesDispatched: dispatched,
      }
    })
  )
)

const judgedOk = judged.filter(Boolean)
const survivors = judgedOk.filter(f => f.survived)
const unverified = judgedOk.filter(f => f.unverified)
const refutedCount = judgedOk.length - survivors.length - unverified.length
const droppedInRefute = merged.length - judgedOk.length

log(`${survivors.length}/${merged.length} findings survived independent review`)
if (unverified.length) log(`${unverified.length} could not be checked (agent errors) — reported as unverified`)
if (droppedInRefute) log(`${droppedInRefute} findings were lost in Refute and are neither upheld nor refuted`)

// Fix policy: a finding is fixed only if a pass reported direct code evidence
// AND it survived refutation. Findings that were merely plausible are reported
// even after surviving, never auto-fixed.
phase('Fix')

const fixable = survivors.filter(f => f.confidence === 'confirmed')
const surfacedOnly = survivors.filter(f => f.confidence !== 'confirmed')

let fixResult = null

if (shouldFix && fixable.length > 0) {
  const fixList = fixable
    .map(f => `- ${where(f)} — ${f.title}\n  Evidence: ${f.evidence}\n  Impact: ${f.impact}${f.recommendation ? `\n  Suggested: ${f.recommendation}` : ''}`)
    .join('\n')

  fixResult = await agent(
    `${scope}

Fix these confirmed findings. Fix only what is listed — no unrelated refactors, no
cleanup of surrounding code, no new abstractions.

${fixList}

If a finding cannot be fixed safely, leave it unchanged and say why in "skipped".

After the last fix, run the project's verification and record the exact command and
result for each:
  1. Typecheck.
  2. Lint — scoped to changed files if a full run has unrelated pre-existing failures.
  3. Every configured unit-test suite, not only tests scoped to the changed files.
  4. Any emulator script relevant to the diff. Determine relevance from the changed
     functions, their callers, and the repository's testing guidance.

Record any check that could not run and the exact reason. Do not report success for a
check that failed or was skipped. Re-read the resulting diff for regressions before
returning.`,
    { label: 'fix:confirmed', phase: 'Fix', model: tier.fix, effort: EFFORT.fix, schema: FIX_SCHEMA }
  )

  log(fixResult ? `Fixed ${fixResult.applied?.length ?? 0}, skipped ${fixResult.skipped?.length ?? 0}` : 'Fix stage returned nothing')
} else if (shouldFix) {
  log('No findings both confirmed and upheld — nothing to fix')
}

phase('Report')

const reportPayload = {
  scope: opts.scope ?? 'working-tree and staged diff',
  tier: tierName,
  mode: shouldFix ? '--fix' : 'report-only',
  passesCompleted: completed.map(c => c.pass),
  passesWithNoFindings: noResult,
  fixable,
  surfacedOnly,
  unverified,
  unlocated,
  fix: fixResult,
  summary: {
    totalFindings: merged.length,
    upheld: survivors.length,
    fixable: fixable.length,
    surfacedOnly: surfacedOnly.length,
    unverified: unverified.length,
    refuted: refutedCount,
    lostInRefute: droppedInRefute,
    unlocated: unlocated.length,
    fixed: fixResult?.applied?.length ?? 0,
  },
}

const REPORT_SCHEMA = {
  type: 'object',
  required: ['written', 'path', 'markdown', 'chatSummary'],
  properties: {
    written: { type: 'boolean', description: 'True only if the file was actually written' },
    path: { type: 'string', description: 'Path written, or why it could not be' },
    markdown: { type: 'string', description: 'The full report, identical to the file contents' },
    chatSummary: {
      type: 'string',
      description: 'Short markdown summary for the chat session: counts, then one line per upheld finding as "path:line — title". A few lines, not the full report.',
    },
  },
}

const report = await agent(
  `Write the file MEGA_CODE_REVIEW_REPORT.md in the repository root, replacing any older
report from this workflow. Use exactly this data — do not re-review, re-derive, or add
findings of your own:

${JSON.stringify(reportPayload, null, 2)}

Structure:

# Mega Code Review Report

## Scope
- Reviewed: ...
- Tier: ...
- Mode: report-only | --fix

## Pass status
One line per pass: completed, or returned no findings.

## Confirmed and upheld
Findings from "fixable": a pass reported direct code evidence and independent
review upheld them. These are the only ones eligible for auto-fix.

### [Severity] Short title
- Location: path:line
- Found by: pass name(s)
- Evidence: ...
- Impact: ...
- Recommendation: ...
- Refutation verdicts: ...
- Fix status: not requested | fixed | not fixed — reason

## Upheld, surfaced only
Findings from "surfacedOnly": upheld by independent review, but no pass gave
direct code evidence. Same shape. Fix status is always "surfaced only; not fixed".

## Unverified
Findings from "unverified": too few skeptics answered to decide. Neither upheld
nor refuted.

## No file reported
Findings from "unlocated": the pass named no file, so they were not deduped,
refuted, or fixed. List title, found-by, evidence, and impact.

## Fixes applied

## Verification
- Typecheck / Lint / Unit tests / Emulator scripts: command — pass | fail | not configured | skipped, with the exact reason

## Summary
Counts from the "summary" object. If lostInRefute is above zero, say plainly
that those findings were lost to agent errors and are unaccounted for.

Use "None." for empty sections.

Return the file's exact contents in "markdown", and a short "chatSummary" for the
session: the counts, then one line per upheld finding. Set "written" true only if
the file was actually written.`,
  { label: 'report', phase: 'Report', model: 'sonnet', effort: 'low', schema: REPORT_SCHEMA }
)

if (!report) {
  log('Report stage returned nothing — MEGA_CODE_REVIEW_REPORT.md was not written. Findings are in this return value.')
} else if (!report.written) {
  log(`Report file not written: ${report.path}`)
} else {
  log(`Report written to ${report.path}`)
}

// The markdown is the return value so the session shows a readable report
// rather than a wall of JSON. Structured findings ride along underneath.
return {
  report: report?.markdown ?? null,
  summary: report?.chatSummary ?? null,
  reportWritten: report?.written === true,
  data: reportPayload,
}
