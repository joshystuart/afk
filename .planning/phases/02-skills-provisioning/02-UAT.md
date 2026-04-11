---
status: diagnosed
phase: 02-skills-provisioning
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md]
started: 2026-04-11T06:00:00Z
updated: 2026-04-11T06:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test

expected: Kill any running server. Start the application from scratch. Server boots without errors, health check returns OK.
result: pass

### 2. Settings Round-Trip Persistence

expected: Navigate to Settings → General. Enter a valid skills directory path (e.g. `/Users/josh/.claude/skills`). Save. Reload the page. The saved path appears in the Skills Directory field.
result: pass

### 3. Container Skills Bind Mount

expected: With a skills directory configured in Settings, create a new session. Run `docker inspect <container>` — the Binds array includes `/path/to/skills:/home/afk/.skills:ro`.
result: pass

### 4. Entrypoint Symlinks Created

expected: Exec into the container. All 4 discovery paths are symlinked to `/home/afk/.skills`: `~/.claude/skills`, `~/.cursor/skills`, `~/.agents/skills`, `~/.codex/skills`.
result: pass

### 5. Read-Only Enforcement

expected: Inside the container, run `touch /home/afk/.skills/test`. It fails with "Read-only file system".
result: pass

### 6. Skills Opt-Out Toggle

expected: Create a session with the "Mount skills directory" toggle OFF. Run `docker inspect` — no `.skills` entry in the container Binds.
result: issue
reported: "The skills are not loaded correctly, but since the skills are cached on the client side from previous sessions, it makes it seem like there are skills accessible. The skills autocomplete shouldn't be loaded when the skills are off for the session. They should be conditionally loaded. Also, the caching of the skills should have a relatively short ttl because if new ones are added, they will not be available in the autocomplete until it expires."
severity: major

### 7. UI Layout — Settings

expected: In Settings → General, the Skills section appears between the Workspace section and the Claude Configuration section. It has a "Skills Directory" text field with helper text.
result: pass

### 8. UI Layout — Create Session

expected: In the Create Session form, the Skills toggle appears between the Workspace section and the Session Details section. Toggle label reads "Mount skills directory".
result: pass

### 9. Disabled Toggle + Settings Link

expected: Without a skills directory configured in Settings, the "Mount skills directory" toggle in Create Session is disabled with a hint linking to Settings.
result: pass

## Summary

total: 9
passed: 8
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "With skills toggle OFF, no skills-related content should be available in the session. Skills autocomplete should not load cached data from previous sessions."
  status: failed
  reason: "User reported: Skills autocomplete still shows cached skills when skills are off for session. Skills should be conditionally loaded based on session toggle. Caching TTL is too long — new skills won't appear until cache expires."
  severity: major
  test: 6
  root_cause: "Two sub-problems: (1) useSkills() is global and session-agnostic — no mountSkills on Session API type or response DTO, ChatPanel always passes skills through, ChatInput only checks skills.length > 0. (2) React Query staleTime is 5 minutes with no invalidation on settings changes, plus server has 60s in-memory cache in ListSkillsInteractor."
  artifacts:
  - path: "web/src/hooks/useSkills.ts"
    issue: "Global query with 5min staleTime, no session awareness"
  - path: "web/src/components/chat/ChatPanel.tsx"
    issue: "Always passes skills to ChatInput regardless of session mountSkills"
  - path: "web/src/components/chat/ChatInput.tsx"
    issue: "Only checks skills.length > 0, not session mount state"
  - path: "web/src/api/types.ts"
    issue: "Session interface lacks mountSkills/skillsPath field"
  - path: "server/src/interactors/sessions/create-session/create-session-response.dto.ts"
    issue: "Does not expose mountSkills or skillsPath from session config"
  - path: "server/src/interactors/settings/list-skills/list-skills.interactor.ts"
    issue: "60s in-memory cache with no invalidation on settings changes"
    missing:
  - "Expose mountSkills or skillsMounted on session response DTO and web Session type"
  - "Gate skills autocomplete in ChatPanel on session.mountSkills"
  - "Lower React Query staleTime for skills (e.g. 30-60s)"
  - "Invalidate ['skills'] query key when settings are updated"
  - "Shorten or invalidate server-side skills cache on settings change"
