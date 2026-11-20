#!/usr/bin/env python3
"""Count permission asks and blocks in Claude Code session records.

Read-only. Prints one table: count, cause, short example.
An approved prompt leaves no record, so ask-rule counts are the actions
that match a current ask rule, not the prompts that were shown.
"""

import argparse
import collections
import fnmatch
import glob
import json
import os
import re
import time

HOME = os.path.expanduser("~")
FILE_TOOLS = ("Edit", "Write", "MultiEdit", "NotebookEdit", "Read")
RULE = re.compile(r"^(\w+)\((.*)\)$")


def to_glob(spec):
    """Turn a permission path spec into an fnmatch pattern on absolute paths."""
    if spec.startswith("//"):
        pattern = spec[1:]
    elif spec.startswith("~/"):
        pattern = HOME + spec[1:]
    elif spec.startswith("./"):
        pattern = "*/" + spec[2:]
    elif spec.startswith("/"):
        pattern = "*" + spec
    else:
        pattern = "*/" + spec
    return pattern.replace("**", "*")


def load_ask_rules(settings_paths):
    bash, files, negations = [], collections.defaultdict(list), collections.defaultdict(list)
    for path in settings_paths:
        try:
            with open(path) as handle:
                rules = json.load(handle).get("permissions", {}).get("ask", [])
        except (OSError, ValueError):
            continue
        for rule in rules:
            match = RULE.match(rule)
            if not match:
                continue
            tool, spec = match.groups()
            if tool == "Bash":
                bash.append(re.sub(r"[: ]\*$", "", spec))
            elif spec.startswith("!"):
                negations[tool].append(to_glob(spec[1:]))
            else:
                files[tool].append((rule, to_glob(spec)))
    return bash, files, negations


def clean(text, width):
    text = re.sub(r"\s+", " ", str(text))
    text = re.sub(r"\S+@\S+\.\S+", "<email>", text)
    return text[:width]


def sub_cause(rule, pattern, path):
    """Split a broad rule by the first folder or file below its fixed prefix."""
    prefix = re.split(r"[*?\[]", pattern)[0]
    if prefix and path.startswith(prefix):
        return f"ask rule {rule}: {path[len(prefix):].split('/')[0]}"
    return f"ask rule {rule}: {os.path.basename(path)}"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--projects", default=os.path.join(HOME, ".claude", "projects"))
    parser.add_argument(
        "--settings",
        action="append",
        help="settings file to read ask rules from; repeat for more files",
    )
    parser.add_argument("--width", type=int, default=80)
    args = parser.parse_args()

    settings = args.settings or [os.path.join(HOME, ".claude", "settings.json")]
    bash_rules, file_rules, negations = load_ask_rules(settings)
    cutoff = time.strftime("%Y-%m-%d", time.gmtime(time.time() - args.days * 86400))
    newest = time.time() - (args.days + 1) * 86400

    counts, examples = collections.Counter(), {}

    def add(cause, example=""):
        counts[cause] += 1
        if example:
            examples.setdefault(cause, clean(example, args.width))

    paths = glob.glob(os.path.join(args.projects, "**", "*.jsonl"), recursive=True)
    for path in paths:
        if os.path.getmtime(path) < newest:
            continue
        uses = {}
        with open(path, errors="ignore") as handle:
            for line in handle:
                if '"tool_use"' not in line and '"tool_result"' not in line:
                    continue
                try:
                    entry = json.loads(line)
                except ValueError:
                    continue
                if entry.get("timestamp", "9")[:10] < cutoff:
                    continue
                for block in (entry.get("message") or {}).get("content") or []:
                    if not isinstance(block, dict):
                        continue
                    if block.get("type") == "tool_use":
                        name, data = block.get("name"), block.get("input") or {}
                        uses[block.get("id")] = (name, data)
                        if name == "Bash":
                            command = str(data.get("command", ""))
                            for part in re.split(r"&&|\|\||;|\n|\|", command):
                                part = part.strip()
                                for prefix in bash_rules:
                                    if part == prefix or part.startswith(prefix + " "):
                                        add(f"ask rule Bash({prefix})", part)
                        elif name in FILE_TOOLS:
                            target = str(data.get("file_path", ""))
                            if any(fnmatch.fnmatch(target, n) for n in negations[name]):
                                continue
                            for rule, pattern in file_rules[name]:
                                if fnmatch.fnmatch(target, pattern):
                                    add(sub_cause(rule, pattern, target), target)
                                    break
                    elif block.get("type") == "tool_result":
                        text = block.get("content")
                        text = text if isinstance(text, str) else json.dumps(text)
                        name, data = uses.get(block.get("tool_use_id"), ("?", {}))
                        what = data.get("command") or data.get("file_path") or ""
                        reason = re.search(r"auto mode classifier\. Reason: \[([^\]]+)\]", text)
                        blocked = re.search(r"(\w+) from '([^']+)' was blocked by a deny rule", text)
                        if reason:
                            add(f"auto mode block [{reason.group(1)}]", what)
                        elif "auto mode could not check" in text:
                            add("auto mode could not check", what)
                        elif blocked:
                            add(f"deny rule on {os.path.basename(blocked.group(2))}", what)
                        elif "covered by a Read deny rule" in text:
                            add(f"deny rule on {os.path.basename(str(what))} (edit)", what)
                        elif "doesn't want to proceed with this tool use" in text:
                            add(f"user said no to {name}")
                        elif "requires additional permissions" in text:
                            add(f"connector needs more permissions: {name}")
                        elif "has been denied" in text[:300]:
                            add(f"denied {name} (no rule named)", what)

    print(f"Last {args.days} days. Ask rules from: {', '.join(settings)}")
    print("count | cause | example")
    for cause, count in counts.most_common():
        print(f"{count} | {cause} | {examples.get(cause, '')}")


if __name__ == "__main__":
    main()
