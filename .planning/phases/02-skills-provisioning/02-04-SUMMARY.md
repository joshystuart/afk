---
phase: 02-skills-provisioning
plan: 04
subsystem: skills-autocomplete-gating
tags: [skills, autocomplete, cache, ux, gap-closure]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [mountSkills-aware-autocomplete, reduced-cache-staleness]
  affects: [session-api-response, chat-input, settings-save]
tech_stack:
  added: []
  patterns: [conditional-prop-gating, query-invalidation-on-save]
key_files:
  created: []
  modified:
    - server/src/interactors/sessions/create-session/create-session-response.dto.ts
    - web/src/api/types.ts
    - web/src/components/chat/ChatPanel.tsx
    - web/src/hooks/useSkills.ts
    - web/src/pages/settings/GeneralSettings.tsx
    - server/src/interactors/settings/list-skills/list-skills.interactor.ts
decisions:
  - mountSkills gating uses client-side prop filtering (server enforces at container level)
  - Server cache TTL reduced to 15s to complement client 30s staleTime
metrics:
  duration: 1min
  completed: "2026-04-11T12:34:25Z"
  tasks: 2
  files: 6
---

# Phase 02 Plan 04: Skills Autocomplete Gating & Cache Freshness Summary

Skills autocomplete now respects the per-session mountSkills toggle and refreshes within ~30 seconds when the skills directory changes — closing the Phase 02 UAT gap.

## What Was Done

### Task 1: Expose mountSkills on server response DTO and web Session type (8c045bd)

Added `mountSkills` boolean field to `CreateSessionResponseDto` mapped from `session.config.mountSkills`, and added matching field to the web `Session` interface. This makes the mount preference available to all frontend session consumers.

### Task 2: Gate skills in ChatPanel, reduce cache TTL, invalidate on settings save (4349104)

- **ChatPanel**: Passes empty skills array to `ChatInput` when `session.mountSkills === false`, suppressing autocomplete for sessions without skills mounted
- **useSkills hook**: Reduced `staleTime` from 5 minutes to 30 seconds so newly added skills appear promptly
- **GeneralSettings**: Added `queryClient.invalidateQueries({ queryKey: ['skills'] })` after successful settings save for immediate cache refresh
- **ListSkillsInteractor**: Reduced server-side `CACHE_TTL_MS` from 60 seconds to 15 seconds to complement client-side reduction

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- [x] `CreateSessionResponseDto` includes `mountSkills` field mapped from domain
- [x] Web `Session` interface includes `mountSkills?: boolean`
- [x] ChatPanel passes `[]` to ChatInput when `session?.mountSkills === false`
- [x] useSkills staleTime is 30 seconds
- [x] GeneralSettings invalidates `['skills']` query after save
- [x] Server cache TTL is 15 seconds
- [x] TypeScript compiles clean in both server and web packages

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Expose mountSkills on server response DTO and web type | 8c045bd | create-session-response.dto.ts, types.ts |
| 2 | Gate skills autocomplete, reduce cache TTL, invalidate on save | 4349104 | ChatPanel.tsx, useSkills.ts, GeneralSettings.tsx, list-skills.interactor.ts |
