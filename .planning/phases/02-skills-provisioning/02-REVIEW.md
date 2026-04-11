---
phase: 02-skills-provisioning
reviewed: 2026-04-11T12:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - server/src/domain/settings/general-settings.embedded.ts
  - server/src/domain/settings/settings.entity.ts
  - server/src/interactors/settings/update-settings/update-settings-request.dto.ts
  - server/src/interactors/settings/update-settings/update-settings.interactor.ts
  - server/src/interactors/settings/settings.module.ts
  - server/src/interactors/settings/get-settings/get-settings-response.dto.ts
  - server/src/domain/sessions/session-config.dto.ts
  - server/src/domain/sessions/session-config-dto.factory.ts
  - server/src/domain/containers/container.entity.ts
  - server/src/interactors/sessions/create-session/create-session-request.dto.ts
  - server/src/libs/docker/docker-container-provisioning.service.ts
  - server/src/libs/docker/docker-container-provisioning.service.spec.ts
  - server/src/interactors/sessions/create-session/create-session-request.service.ts
  - server/src/interactors/sessions/create-session/create-session-startup.service.ts
  - server/src/interactors/sessions/start-session/start-session.interactor.ts
  - docker/scripts/entrypoint.sh
  - web/src/api/types.ts
  - web/src/pages/settings/GeneralSettings.tsx
  - web/src/pages/CreateSession.tsx
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-11
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

The skills provisioning feature is well-implemented across the stack: settings persistence, session config snapshotting, Docker bind mounts (`:ro`), entrypoint symlink setup, and frontend UI are all wired together correctly. The `MountPathValidator` integration provides solid defense against obvious path traversal attacks on the server side.

Two warnings were identified: a defense-in-depth gap where the skills directory path is not validated against symlink-based traversal at session creation time (unlike the host mount path which gets the full `validateReal()` check), and a frontend UX bug where the "skills changed" warning displays unconditionally regardless of whether the setting was actually modified. Two informational items round out the findings.

No critical issues found. The `:ro` mount constraint and admin-only settings access significantly limit the attack surface of the symlink finding.

## Warnings

### WR-01: Skills path not validated with `validateReal()` at session creation — symlink traversal gap

**File:** `server/src/interactors/sessions/create-session/create-session-request.service.ts:62-70`
**Issue:** When a session is created, the skills directory path is validated with `mountPathValidator.validate()` only, which uses `path.resolve()` (string manipulation). It does not call `validateReal()`, which follows symlinks via `fs.realpathSync`. By contrast, the host mount path goes through both `validate()` and `validateReal()` (lines 89 and 103).

If the skills directory path is a symlink (or contains symlink components) pointing to a protected system directory, `validate()` would pass but Docker would mount the symlink's real target. The `:ro` flag limits exposure to reading files, not writing. The attack also requires host filesystem access to plant the symlink, which limits practical risk.

**Fix:**

```typescript
if (sessionConfig.skillsPath) {
  try {
    this.mountPathValidator.validate(sessionConfig.skillsPath);
    if (fs.existsSync(sessionConfig.skillsPath)) {
      this.mountPathValidator.validateReal(sessionConfig.skillsPath);
    }
  } catch (error) {
    if (error instanceof MountPathValidationError) {
      throw new Error(`Skills directory: ${error.message}`);
    }
    throw error;
  }
}
```

Add `import * as fs from 'fs';` at the top. The `existsSync` guard avoids errors when the directory doesn't exist yet (admin may have set the setting before creating the directory).

### WR-02: "Skills directory was changed" warning always displays regardless of actual changes

**File:** `web/src/pages/CreateSession.tsx:347-354`
**Issue:** The warning alert is displayed whenever `hasSkillsDirectory && hasRunningSessions` is true. This condition is met on every visit to the Create Session page as long as skills are configured and any session is running — even if the skills directory setting hasn't been modified. The text says "Skills directory was changed" which is misleading.

```tsx
{
  hasSkillsDirectory && hasRunningSessions && (
    <Alert severity="warning" sx={{ mb: 3 }}>
      <Typography variant="body2">
        Skills directory was changed. Running sessions need to be restarted to
        use the updated skills.
      </Typography>
    </Alert>
  );
}
```

**Fix:** Either remove this warning entirely (it's not actionable during session creation), or track whether the skills directory was actually modified in the current browser session. The simplest fix is to remove it since the information is better suited for the Settings page after a save:

```tsx
// Remove the block at lines 347-354 entirely
```

Alternatively, if you want to keep a hint on the create page, make the copy informational rather than suggesting a change occurred:

```tsx
{
  hasSkillsDirectory && (
    <Alert severity="info" sx={{ mb: 3 }}>
      <Typography variant="body2">
        Skills from <strong>{settings.skillsDirectory}</strong> will be mounted
        read-only into this session.
      </Typography>
    </Alert>
  );
}
```

## Info

### IN-01: No client-side validation for skills directory path format

**File:** `web/src/pages/settings/GeneralSettings.tsx:124-133`
**Issue:** The skills directory text field accepts any string without client-side validation. The server validates via `MountPathValidator`, so this is not a security issue, but adding basic client-side feedback (e.g., must start with `/`, minimum length) would improve UX by preventing unnecessary round-trips.

**Fix:** Add a `pattern` or custom validation to the text field, or validate on blur:

```tsx
<TextField
  fullWidth
  label="Skills Directory"
  value={formData.skillsDirectory}
  onChange={handleInputChange('skillsDirectory')}
  placeholder="/path/to/your/skills"
  helperText="Host directory containing agent skills. Mounted read-only into session containers."
  error={
    !!formData.skillsDirectory && !formData.skillsDirectory.startsWith('/')
  }
/>
```

### IN-02: Skills path containing colon character could break Docker bind mount syntax

**File:** `server/src/libs/docker/docker-container-provisioning.service.ts:50-52`
**Issue:** The bind mount string is constructed via template literal:

```typescript
`${options.skillsPath}:/home/afk/.skills:ro`;
```

Docker uses `:` as the separator between host path, container path, and options. If `skillsPath` contains a `:` character (extremely rare on macOS/Linux but technically possible), the bind mount would be mis-parsed. This same pattern applies to the pre-existing `hostMountPath` mount and is not skills-specific, but worth noting for completeness.

**Fix:** This is very low risk on macOS/Linux since `:` is not a common path character. If desired, add a check in `MountPathValidator`:

```typescript
if (resolved.includes(':')) {
  throw new MountPathValidationError(
    'Mount path must not contain colon characters',
  );
}
```

---

_Reviewed: 2026-04-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
