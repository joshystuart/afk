---
phase: quick
plan: 260411-quf
subsystem: settings, chat
tags: [skills, autocomplete, ux, frontend, api]
dependency_graph:
  requires: [settings-entity, settings-repository, chat-panel]
  provides: [skills-listing-api, skill-autocomplete-ui]
  affects: [settings-controller, settings-module, chat-input, chat-panel]
tech_stack:
  added: []
  patterns: [interactor-pattern, react-query-hook, popper-dropdown]
key_files:
  created:
    - server/src/interactors/settings/list-skills/list-skills.interactor.ts
    - server/src/interactors/settings/list-skills/list-skills-response.dto.ts
    - web/src/components/chat/SkillAutocomplete.tsx
    - web/src/hooks/useSkills.ts
  modified:
    - server/src/interactors/settings/settings.controller.ts
    - server/src/interactors/settings/settings.module.ts
    - web/src/api/types.ts
    - web/src/api/settings.api.ts
    - web/src/components/chat/ChatInput.tsx
    - web/src/components/chat/ChatPanel.tsx
decisions:
  - Chose plain-text slash command insertion (like Cursor/Claude) over chip-based approach for simplicity
  - Capped skills list at 200 entries to mitigate DoS (T-quick-03)
  - Used 5-minute stale time for skills query since skills directory rarely changes
metrics:
  duration: 3min
  completed: 2026-04-11T09:27:00Z
  tasks: 2
  files: 10
---

# Quick Task 260411-quf: Skills Autocomplete Summary

Slash-command autocomplete for skills in chat input — server reads configured skillsDirectory and lists skill subdirectories with descriptions from SKILL.md; frontend shows a filtered dropdown on `/` keystroke with keyboard navigation.

## What Was Built

### Task 1: Server-side skills listing endpoint (6b5a6a4)

- `ListSkillsInteractor` reads `settings.general.skillsDirectory`, lists subdirectories, extracts first line of each `SKILL.md` as description
- Capped at 200 entries; gracefully returns empty array on ENOENT/EACCES
- `ListSkillsResponseDto` with Swagger decorators
- `GET /settings/skills` endpoint added to `SettingsController`
- Registered in `SettingsModule`

### Task 2: Frontend skills autocomplete (b534ec0)

- `SkillInfo` type and `listSkills` API method added
- `useSkills()` hook with React Query (5min staleTime)
- `SkillAutocomplete` dropdown component: filters by name/description, renders with AFK design system colors
- Keyboard navigation: ArrowUp/Down, Enter to select, Escape to dismiss, Tab to accept
- `ChatInput` detects `/` at start or after whitespace, opens dropdown, inserts `/skill-name ` on selection
- `ChatPanel` wires `useSkills()` to `ChatInput`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows are wired end-to-end.

## Self-Check: PASSED

- All 4 created files exist on disk
- Commits 6b5a6a4 and b534ec0 verified in git log
