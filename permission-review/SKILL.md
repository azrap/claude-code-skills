---
name: permission-review
description: >-
  Review the last 30 days of Claude Code permission asks and blocks, then
  suggest settings edits one by one for the user to make by hand. Use when the
  user invokes /permission-review, says Claude Code asks for too many
  permissions, wants fewer prompts without skipping permissions, wants to tune
  auto mode, or wants to revisit their permission settings.
---

# Permission Review

Find what asked the user for permission or was blocked in recent sessions.
Suggest only the settings edits that the records support. The user makes each
edit by hand and keeps control of what they care about.

## Rules

- Never edit a settings file. The user makes each edit.
- Suggest an edit only for a cause that came up in the period. A cause with a
  count of 0 is not mentioned.
- One edit per cause. Never put two causes in one edit.
- Each edit must leave the file valid by itself, so the user can do some edits
  and skip others. To add a line, insert it above an existing line, so no
  comma changes.
- Take the exact "find" text from the settings file as it is now. Read the file
  first.
- Do not answer from memory. Check the current docs in step 2.
- Do not print secrets, emails, or personal data from the records. The script
  cuts each example to 80 characters and hides emails.
- Write facts for the auto mode checker in general words. Name an organization
  or a project only when the user wants that.

## Steps

### 1. Count

Run the script in this skill folder. It is read-only.

```bash
python3 scripts/count_permission_events.py --days 30
```

- Add `--settings <path>` for each project settings file with ask rules.
- The table has: count, cause, one short example.
- An approved prompt leaves no record. The ask-rule counts are the actions
  that match a current ask rule.
- A "denied (no rule named)" row needs a look at its example to find the rule.

Also read the settings files: `~/.claude/settings.json` and the project
`.claude/settings.json` and `.claude/settings.local.json`.

### 2. Check the docs

Read these before any suggestion. Start from the index when a page moved.

- Index: https://code.claude.com/docs/llms.txt
- Permission modes: https://code.claude.com/docs/en/permission-modes.md
- Auto mode config: https://code.claude.com/docs/en/auto-mode-config.md

Facts from the docs on 2026-11-20. Confirm each one again before use:

- A deny rule blocks in every mode. An ask rule prompts in every mode, also in
  auto mode.
- Auto mode is not "skip permissions". A checker looks at each action.
- The checker reads `autoMode` only from user settings, not project settings.
- `autoMode.environment` and `autoMode.allow` hold plain sentences, not
  patterns. A list without `"$defaults"` loses the built-in entries.
- `claude auto-mode config` prints the rules in use. `claude auto-mode
  critique` gives feedback on custom entries.
- Settings load at session start.

### 3. Show the table

One short table, highest count first: cause, count, status. Status is one of:
open, fixed earlier, keep.

### 4. Give the edits

Highest count first. Put a line (`---`) between edits. Use this format:

```markdown
**Edit N: <cause> (<count> times)**
- Find this line:
  <exact line>
- <Delete it | Add these lines directly above it | Replace the full line with>:
  <exact text>
- **Now:** <what the line does now>
- **After:** <what happens after the edit>
- **Risk:** <one sentence>
```

Kinds of edit:

- An ask rule that fires often: delete the rule, or add a `!` line after it
  for the one path that is safe.
- An auto mode block on a routine action: add one plain sentence to
  `autoMode.allow`.
- An auto mode block on trusted infrastructure: fix or add the fact in
  `autoMode.environment`.
- A deny rule that hits a safe file: add a `!` line for that file after the
  rule.

### 5. List what stays

Say what keeps asking or stays blocked, and why. Defaults to keep:

- Edits to settings, skills, and instruction files. They change how Claude
  behaves.
- Secret files and keys.
- Production actions.
- Destructive commands.

### 6. Check the user's edit

When the user pastes the file or says the edit is done:

- Load the file on disk as JSON. Report an error with its line.
- Compare the paste with the file on disk. Report a stray character in the
  paste.
- List the edits that are done, the edits that are not done, and any change
  the user made to the suggested text.
- Tell the user to start a new session.

## Report honestly

- Say which numbers are counts from records and which are estimates.
- Say when the cause of a block is not known, and that the edit can fail to
  remove it.
- Mark an edit "not tested" when its rule form was not tried.
