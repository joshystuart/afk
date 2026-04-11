---
status: partial
phase: 02-skills-provisioning
source: [02-VERIFICATION.md]
started: 2026-04-11T05:00:00Z
updated: 2026-04-11T11:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Settings Round-Trip Persistence

expected: Enter skills directory path in Settings General, save, reload — saved path appears
result: [pending]

### 2. Container Skills Bind Mount

expected: docker inspect shows /path/to/skills:/home/afk/.skills:ro in Binds
result: [pending]

### 3. Entrypoint Symlinks Created

expected: All 4 discovery paths symlinked to /home/afk/.skills inside container
result: [pending]

### 4. Read-Only Enforcement

expected: touch /home/afk/.skills/test fails with Read-only file system
result: [pending]

### 5. Skills Opt-Out Toggle

expected: Create session with mount toggle OFF, no .skills in container Binds
result: [pending]

### 6. UI Layout Verification

expected: Skills section between Workspace and Claude Configuration in Settings; Skills toggle between Workspace and Session Details in CreateSession
result: [pending]

### 7. Disabled Toggle + Settings Link

expected: Without skills directory configured, toggle disabled with Settings link
result: [pending]

### 8. Autocomplete Gating on mountSkills

expected: Create session with mountSkills OFF, open chat, type `/` — no autocomplete suggestions appear. With mountSkills ON, autocomplete works normally.
result: [pending]

### 9. Cache Freshness After Settings Save

expected: Change skills directory in Settings, save — within ~30 seconds, autocomplete reflects new directory contents
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0
blocked: 0

## Gaps
