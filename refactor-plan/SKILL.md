---
name: refactor-plan
description: Create structured refactor plans for replacing old implementations with new code, ensuring complete migration with verification steps
---

# Refactor Plan

Use this template for complex refactors where old code needs to be completely replaced with new implementations.

**Task:** [Refactor X to use Y]

## Before coding:
0. **Confirm branch:** `git branch --show-current`
1. **List ALL files that use old X** (paste grep results)
2. **Write replacement plan** (CREATE/UPDATE/DELETE for each file)

## While coding:
3. **As you finish each file, show git diff**
4. **Grep for old patterns after each major change**

## After coding:
5. **Final grep: Prove zero old patterns remain** (paste grep output)
6. **Test output: Prove new code actually runs** (paste curl/test results)

---

## Example usage:

**Task:** Refactor flat dict responses to use Pydantic BaseResponse

0. Branch: `update-daily-stories-content/azra`
1. Files using old pattern: `grep -r "{'child_id':" google/functions/daily-stories/`
2. Plan:
   - UPDATE: generate-daily-story/main.py (wrap response in BaseResponse)
   - UPDATE: _shared/responses.py (add BaseResponse class)
3. [Show diffs as you go]
4. [Grep after main.py change]
5. Final grep: `grep -r "{'child_id':" .` → No results
6. Test: `curl -X POST [endpoint]` → Response has `{"success": true, "content": {...}}`
