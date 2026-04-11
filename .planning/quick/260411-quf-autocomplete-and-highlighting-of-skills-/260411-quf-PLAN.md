---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - server/src/interactors/settings/settings.controller.ts
  - server/src/interactors/settings/settings.module.ts
  - server/src/interactors/settings/list-skills/list-skills.interactor.ts
  - server/src/interactors/settings/list-skills/list-skills-response.dto.ts
  - web/src/api/settings.api.ts
  - web/src/api/types.ts
  - web/src/hooks/useSkills.ts
  - web/src/components/chat/ChatInput.tsx
  - web/src/components/chat/SkillAutocomplete.tsx
  - web/src/components/chat/ChatPanel.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - 'Typing / in the chat input shows a dropdown of available skills'
    - 'Skills dropdown filters as user continues typing after /'
    - 'Selecting a skill from dropdown inserts it as a /skill-name tag in the input'
    - 'Selected skills are visually highlighted as chips in the input area'
    - 'The sent message includes the skill command text so the agent can use it'
    - 'Escape or clicking outside dismisses the dropdown'
    - 'Arrow keys navigate the dropdown, Enter selects'
  artifacts:
    - path: 'server/src/interactors/settings/list-skills/list-skills.interactor.ts'
      provides: 'Reads skillsDirectory from Settings and lists skill subdirectories'
    - path: 'web/src/components/chat/SkillAutocomplete.tsx'
      provides: 'Dropdown popup component triggered by / in chat input'
    - path: 'web/src/hooks/useSkills.ts'
      provides: 'React Query hook fetching available skills from server'
  key_links:
    - from: 'web/src/components/chat/ChatInput.tsx'
      to: 'web/src/components/chat/SkillAutocomplete.tsx'
      via: 'Rendered conditionally when / detected at word boundary in input'
    - from: 'web/src/hooks/useSkills.ts'
      to: 'GET /api/settings/skills'
      via: 'React Query fetch'
    - from: 'server/src/interactors/settings/settings.controller.ts'
      to: 'server/src/interactors/settings/list-skills/list-skills.interactor.ts'
      via: 'DI injection, GET endpoint'
---

<objective>
Add slash-command autocomplete for skills in the chat input, similar to Cursor and Claude Code CLI.
When a user types "/" in the chat input, a dropdown appears listing available skills from the
configured skills directory. Selected skills are visually highlighted as tags/chips. The skill
command text is included in the sent message so the agent receives it.

Purpose: Improve discoverability and usability of mounted skills during chat sessions.
Output: Server endpoint listing skills + frontend autocomplete UI with chip highlighting.
</objective>

<execution_context>
@$HOME/.cursor/get-shit-done/workflows/execute-plan.md
@$HOME/.cursor/get-shit-done/templates/summary.md
</execution_context>

<context>
@server/src/interactors/settings/settings.controller.ts
@server/src/interactors/settings/settings.module.ts
@server/src/interactors/settings/get-settings/get-settings.interactor.ts
@server/src/domain/settings/settings.entity.ts
@server/src/domain/settings/general-settings.embedded.ts
@web/src/components/chat/ChatInput.tsx
@web/src/components/chat/ChatPanel.tsx
@web/src/api/settings.api.ts
@web/src/api/types.ts
@web/src/hooks/useChat.ts
@web/src/themes/afk.ts

<interfaces>
<!-- Key types and contracts the executor needs -->

From server/src/interactors/settings/settings.controller.ts:

```typescript
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly getSettingsInteractor: GetSettingsInteractor,
    private readonly updateSettingsInteractor: UpdateSettingsInteractor,
    private readonly responseService: ResponseService,
  ) {}
}
```

From server/src/domain/settings/general-settings.embedded.ts:

```typescript
@Column('varchar', { length: 500, nullable: true })
skillsDirectory?: string | null;
```

From server/src/interactors/settings/settings.module.ts:

```typescript
@Module({
  imports: [ResponseModule, SettingsPersistenceModule, GitHubModule],
  controllers: [SettingsController],
  providers: [
    GetSettingsInteractor,
    UpdateSettingsInteractor,
    MountPathValidator,
  ],
})
export class SettingsModule {}
```

From web/src/api/settings.api.ts:

```typescript
export const settingsApi = {
  async getSettings(): Promise<Settings> { ... },
  async updateSettings(settings: UpdateSettingsRequest): Promise<Settings> { ... },
};
```

From web/src/themes/afk.ts — colors used for styling:

```typescript
const colors = {
  background: '#09090b',
  surface: '#0f0f11',
  surfaceElevated: '#18181b',
  border: '#1c1c1f',
  textPrimary: '#fafafa',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  accent: '#10b981',
  accentMuted: 'rgba(16, 185, 129, 0.12)',
};
```

Skills directory structure on host (mounted to /home/afk/.skills in container):
Each skill is a subdirectory containing a SKILL.md file. Example:

```
~/.claude/skills/
  gsd-quick/
    SKILL.md
  gsd-debug/
    SKILL.md
  gsd-execute-phase/
    SKILL.md
```

The SKILL.md first line typically contains the skill description.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Server-side skills listing endpoint</name>
  <files>
    server/src/interactors/settings/list-skills/list-skills.interactor.ts
    server/src/interactors/settings/list-skills/list-skills-response.dto.ts
    server/src/interactors/settings/settings.controller.ts
    server/src/interactors/settings/settings.module.ts
  </files>
  <action>
Create a `ListSkillsInteractor` that:
1. Injects the settings repository (via `SETTINGS_REPOSITORY` token) to read `settings.general.skillsDirectory`
2. If `skillsDirectory` is null/empty, returns an empty array
3. Uses `fs.readdir` to list subdirectories in the `skillsDirectory`
4. For each subdirectory, checks if `SKILL.md` exists; reads the first line to extract a description
5. Returns an array of `{ name: string; description: string }` objects where `name` is the directory name (which is the slash command name)

Create `ListSkillsResponseDto` with `skills` array field containing `name` and `description`.

Add a `GET /settings/skills` endpoint to `SettingsController` that calls the interactor and returns the response wrapped in `ResponseService.success()`.

Register `ListSkillsInteractor` in `SettingsModule` providers.

The endpoint should gracefully handle missing/inaccessible directories by returning an empty skills array (catch ENOENT/EACCES errors).
</action>
<verify>
<automated>cd server && npx jest --passWithNoTests --testPathPattern="settings" 2>&1 | tail -5</automated>
</verify>
<done>
GET /api/settings/skills returns `{ success: true, data: { skills: [{ name: "skill-name", description: "..." }] } }` when skillsDirectory is configured, or `{ skills: [] }` when not configured.
</done>
</task>

<task type="auto">
  <name>Task 2: Frontend skills autocomplete with visual chip highlighting</name>
  <files>
    web/src/api/settings.api.ts
    web/src/api/types.ts
    web/src/hooks/useSkills.ts
    web/src/components/chat/SkillAutocomplete.tsx
    web/src/components/chat/ChatInput.tsx
    web/src/components/chat/ChatPanel.tsx
  </files>
  <action>
**API layer:**
- Add `SkillInfo` type to `web/src/api/types.ts`: `{ name: string; description: string }`
- Add `listSkills` method to `settingsApi` in `web/src/api/settings.api.ts` that calls `GET /settings/skills`

**Hook:**

- Create `web/src/hooks/useSkills.ts` with a `useSkills()` hook using `useQuery` from `@tanstack/react-query`:
  - Query key: `['skills']`
  - Fetches from `settingsApi.listSkills()`
  - `staleTime: 5 * 60 * 1000` (skills don't change often)
  - Returns `{ skills, isLoading }`

**SkillAutocomplete component** (`web/src/components/chat/SkillAutocomplete.tsx`):

- Receives props: `skills: SkillInfo[]`, `filter: string`, `onSelect: (skillName: string) => void`, `onClose: () => void`, `anchorEl: HTMLElement | null`
- Renders as a `Popper` or absolutely-positioned dropdown above the input (like Cursor's slash command menu)
- Filters skills by prefix match on `filter` (case-insensitive)
- Each item shows `/skill-name` in accent color + description in secondary text
- Keyboard navigation: ArrowUp/ArrowDown to move selection, Enter to select, Escape to close
- Styled with `afkColors` — dark surface background, border, mono font for command names
- Max height with scroll, shows "No matching skills" when filter yields no results

**ChatInput modifications:**

- Accept new prop `skills: SkillInfo[]` (passed from ChatPanel)
- Track autocomplete state: `showAutocomplete`, `autocompleteFilter`, `autocompleteAnchor`
- On `onChange`: detect when user types "/" at start of input or after a space — open autocomplete, track characters typed after "/" as the filter
- On skill select: replace the "/partial" text with the full "/skill-name " (with trailing space) in the input value
- Visually highlight `/skill-name` tokens in the input: since MUI TextField doesn't support inline rich text easily, render skill commands as MUI `Chip` components in a row above the text input (between input and toolbar). Each chip shows the skill name with an "x" to remove. When a skill chip exists, strip it from the display value but include it when sending.
- Alternative simpler approach: keep the `/skill-name` as plain text in the input (like Cursor does) and just use the autocomplete for insertion. The visual highlighting is the autocomplete dropdown itself showing which skill was chosen. The sent message includes the `/skill-name` text naturally.
- Choose the simpler approach (plain text with autocomplete insertion) — matches Cursor/Claude behavior where slash commands are plain text in the input.

**ChatPanel modifications:**

- Call `useSkills()` hook
- Pass `skills` to `ChatInput` component
  </action>
  <verify>
  <automated>cd web && npx tsc --noEmit 2>&1 | tail -10</automated>
  </verify>
  <done>
  Typing "/" in the chat input opens a dropdown showing available skills filtered by typed text. Arrow keys navigate, Enter selects and inserts the full "/skill-name " into the input. Escape dismisses. The sent message includes the slash command text. Skills are fetched once from the server and cached.
  </done>
  </task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                          | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| client→API (GET /settings/skills) | Authenticated request; reads host filesystem path from Settings |

## STRIDE Threat Register

| Threat ID  | Category                   | Component            | Disposition | Mitigation Plan                                                                                                                           |
| ---------- | -------------------------- | -------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| T-quick-01 | I (Information Disclosure) | ListSkillsInteractor | mitigate    | Only reads directory names and first line of SKILL.md — no sensitive content. skillsDirectory is validated by MountPathValidator on save. |
| T-quick-02 | T (Tampering)              | ListSkillsInteractor | accept      | Skills directory is read-only in containers. Host path is admin-configured via Settings. No write operations.                             |
| T-quick-03 | D (Denial of Service)      | ListSkillsInteractor | mitigate    | Cap skills list to reasonable limit (e.g., 200 entries). Handle fs errors gracefully.                                                     |

</threat_model>

<verification>
1. Configure a skillsDirectory in Settings pointing to a directory with skill subdirectories
2. `GET /api/settings/skills` returns the list of skills with names and descriptions
3. In the chat input, type "/" — autocomplete dropdown appears with skills
4. Type additional characters to filter the list
5. Use arrow keys + Enter to select a skill — it's inserted into the input
6. Press Escape to dismiss without selecting
7. Send a message containing a slash command — it's included in the message content
8. When no skillsDirectory is configured, "/" typing shows "No skills available"
</verification>

<success_criteria>

- Server endpoint lists skills from configured directory
- Frontend autocomplete activates on "/" in chat input
- Keyboard navigation (arrows, Enter, Escape) works
- Selected skill inserted as "/skill-name " in input text
- Message sent includes the slash command text
- Graceful degradation when no skills directory configured
  </success_criteria>

<output>
After completion, create `.planning/quick/260411-quf-autocomplete-and-highlighting-of-skills-/260411-quf-SUMMARY.md`
</output>
