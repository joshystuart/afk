---
status: diagnosed
trigger: "Saving ideCommand in Settings → General fails with HTTP 400 'property ideCommand should not exist'"
created: 2026-04-17T00:00:00Z
updated: 2026-04-17T00:00:00Z
---

## Current Focus

hypothesis: UpdateSettingsRequest DTO is missing `ideCommand`, triggering `forbidNonWhitelisted` rejection before the interactor runs
test: Read the DTO file and confirm `ideCommand` is absent; read ApplicationFactory to confirm `forbidNonWhitelisted: true`; read the interactor to confirm it doesn't independently pass `ideCommand`
expecting: DTO has no `ideCommand` field, ValidationPipe is configured to reject unknown properties, interactor also omits `ideCommand` from its `update({...})` mapping
next_action: Return ROOT CAUSE FOUND with fix direction

## Symptoms

expected: Entering "cursor" in the IDE Command text field under Settings → General and clicking Save persists the value; reloading the page still shows "cursor".
actual: Save returns HTTP 400 `{success: false, error: {message: ["property ideCommand should not exist"], code: "INTERNAL_ERROR"}, statusCode: 400}`
errors: ["property ideCommand should not exist"] — NestJS ValidationPipe `forbidNonWhitelisted` rejection
reproduction: Open http://localhost:5173/settings → General tab. Type "cursor" in "IDE Command". Save. Observe 400 in network tab.
started: Phase 03 Plan 03 (commit 97d961d) added the UI field; Plan 01 (commit e2096b1) added the entity column but did not update the server DTO.

## Eliminated

(none — first hypothesis was confirmed directly)

## Evidence

- timestamp: 2026-04-17T00:00:00Z
  checked: server/src/libs/app-factory/application.factory.ts lines 24-33
  found: `new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, ... })` — any body property not decorated on the request DTO is rejected with "property X should not exist"
  implication: A missing field on `UpdateSettingsRequest` produces exactly the observed 400 message.

- timestamp: 2026-04-17T00:00:00Z
  checked: server/src/domain/settings/general-settings.embedded.ts
  found: `@Column('varchar', { length: 100, nullable: true }) ideCommand?: string | null;` exists (line 19-20)
  implication: Entity column is present; the gap is on the HTTP boundary.

- timestamp: 2026-04-17T00:00:00Z
  checked: server/src/domain/settings/settings.entity.ts
  found: `SettingsUpdateData.ideCommand?: string` (line 23); `update()` applies `this.general.ideCommand = data.ideCommand || null` (lines 100-101)
  implication: Domain layer accepts and persists `ideCommand` — bug is strictly at the DTO + interactor mapping layer.

- timestamp: 2026-04-17T00:00:00Z
  checked: server/src/interactors/settings/update-settings/update-settings-request.dto.ts (entire file, 105 lines)
  found: `UpdateSettingsRequest` declares sshPrivateKey, claudeToken, gitUserName, gitUserEmail, defaultMountDirectory, skillsDirectory, dockerSocketPath, dockerStartPort, dockerEndPort, githubAccessToken, idleCleanupEnabled, idleTimeoutMinutes — `ideCommand` is NOT present.
  implication: Confirmed root cause for the 400. ValidationPipe strips/rejects `ideCommand` before it reaches the interactor.

- timestamp: 2026-04-17T00:00:00Z
  checked: server/src/interactors/settings/update-settings/update-settings.interactor.ts lines 58-72
  found: `currentSettings.update({ sshPrivateKey, claudeToken, gitUserName, gitUserEmail, defaultMountDirectory, skillsDirectory, dockerSocketPath, dockerStartPort, dockerEndPort, githubAccessToken, idleCleanupEnabled, idleTimeoutMinutes })` — `ideCommand` is NOT forwarded here either.
  implication: Secondary bug. Even after adding the DTO field, the interactor must also pass `ideCommand: request.ideCommand` into `currentSettings.update(...)`, otherwise the 400 goes away but the value never persists and the UAT symptom ("reloading the page still shows cursor") will still fail.

- timestamp: 2026-04-17T00:00:00Z
  checked: Adjacent DTO field patterns (e.g. `skillsDirectory`, `claudeToken`)
  found: Pattern is `@IsOptional() @IsString() @ApiProperty({ required: false, description: '...' }) fieldName?: string;` — no `@MaxLength` used on peer string fields, no `@Expose()` usage in this DTO.
  implication: Fix should follow the same pattern for consistency. `@MaxLength(100)` matches the entity column length and is a reasonable addition but not required to follow local convention.

## Resolution

root_cause: `UpdateSettingsRequest` at `server/src/interactors/settings/update-settings/update-settings-request.dto.ts` does not declare an `ideCommand` property. The global `ValidationPipe` configured in `ApplicationFactory.configure` uses `forbidNonWhitelisted: true`, so any request body containing `ideCommand` is rejected with `"property ideCommand should not exist"` before the interactor runs. A secondary defect in `UpdateSettingsInteractor.execute` (lines 58-72) also omits `ideCommand` from the `currentSettings.update({...})` call — so even after fixing the DTO, the value would not persist without also wiring it through the interactor.
fix: Add `ideCommand` to the request DTO and forward it in the interactor (see Suggested Fix Direction).
verification: (deferred — diagnose-only mode)
files_changed: []
