# DB-Backed Admin User (Option C)

## Goal

Move admin user credentials out of YAML config and into the database, enabling:

- First-run onboarding that prompts the user to create their admin account
- Password changes from the Settings UI without restarting the server
- Elimination of plaintext default credentials (`admin` / `password123`) from config files
- A foundation for multi-user support in the future

## Current State

Admin credentials live in `.env.yaml` → `AdminUserConfig` (injected via DI). `AuthService.login()` compares plaintext username/password against the config values. There is no password hashing, no DB persistence, and no way to change credentials at runtime.

### Files involved today

| File                                          | Role                                                     |
| --------------------------------------------- | -------------------------------------------------------- |
| `server/src/libs/config/admin-user.config.ts` | DTO for YAML `adminUser` block                           |
| `server/src/libs/config/app.config.ts`        | Root config, references `AdminUserConfig`                |
| `server/src/libs/auth/auth.service.ts`        | Compares login credentials against `AppConfig.adminUser` |
| `server/src/libs/auth/auth.controller.ts`     | `/api/auth/login` and `/api/auth/logout` endpoints       |
| `server/src/libs/auth/auth.guard.ts`          | JWT guard, `@Public()` decorator                         |
| `server/src/libs/auth/auth.module.ts`         | Wires `JwtModule` with `AuthConfig.jwtSecret`            |
| `web/src/pages/Login.tsx`                     | Login form                                               |
| `web/src/hooks/useAuth.ts`                    | Login/logout logic                                       |
| `web/src/stores/auth.store.ts`                | Zustand auth state                                       |
| `electron/config/.env.yaml`                   | Hardcoded `adminUser` defaults                           |
| `server/.env.yaml`                            | Hardcoded `adminUser` defaults                           |

## Architecture

### Phase 1: Admin User Entity + Repository

Create a new `AdminUser` entity stored in the database alongside the existing `Settings` entity.

**New file: `server/src/domain/admin-user/admin-user.entity.ts`**

| Column       | Type         | Notes                                   |
| ------------ | ------------ | --------------------------------------- |
| id           | varchar(36)  | PK, UUID                                |
| username     | varchar(255) | Unique, min 3 chars                     |
| passwordHash | varchar(255) | bcrypt hash                             |
| isAdmin      | boolean      | Always true for now (future multi-user) |
| createdAt    | datetime     |                                         |
| updatedAt    | datetime     |                                         |

**New file: `server/src/domain/admin-user/admin-user.repository.ts`**

Standard TypeORM repository wrapping the entity. Methods:

- `findByUsername(username: string): Promise<AdminUser | null>`
- `findById(id: string): Promise<AdminUser | null>`
- `save(user: AdminUser): Promise<AdminUser>`
- `count(): Promise<number>`
- `exists(): Promise<boolean>` — convenience for checking if setup has been completed

### Phase 2: Refactor AuthService

Replace the config-based credential check with a DB lookup + bcrypt comparison.

**Changes to `server/src/libs/auth/auth.service.ts`:**

- Inject `AdminUserRepository` instead of (or alongside) `AppConfig`
- `login()`: look up user by username, compare password with `bcrypt.compare()`
- Add `isSetupComplete(): Promise<boolean>` — returns whether at least one admin user exists
- Add `createAdminUser(username, password): Promise<AdminUser>` — hashes password with `bcrypt.hash()`, saves to DB. Should only work when no admin exists yet (first-run guard).

**New dependency:** `bcrypt` (or `bcryptjs` for pure-JS, avoids native compilation issues in Electron)

> **Decision point:** `bcryptjs` is the safer choice here — it avoids native addon rebuild issues with Electron and has no security trade-off for a local desktop app. Recommend `bcryptjs`.

### Phase 3: Setup API Endpoint

Add a public endpoint for first-run account creation.

**New endpoint: `POST /api/auth/setup`**

- Decorated with `@Public()` (no JWT required)
- Request body: `{ username: string, password: string, confirmPassword: string }`
- Guard: returns `409 Conflict` if an admin user already exists (prevents re-setup)
- On success: creates the admin user, returns a JWT token (auto-login after setup)

**New endpoint: `GET /api/auth/status`**

- Decorated with `@Public()`
- Returns `{ isSetupComplete: boolean }` — used by the frontend to decide whether to show login or setup

### Phase 4: Setup / Onboarding Page (Web)

**New file: `web/src/pages/Setup.tsx`**

A dedicated onboarding page shown on first launch. Visually consistent with `Login.tsx` but with:

- Username field
- Password field
- Confirm password field
- "Create Account" button
- Subtitle: "Set up your admin account to get started"

**Routing changes in `web/src/App.tsx`:**

- Add a new public route: `/setup`
- The `Login` page (and `ProtectedRoute`) should check `/api/auth/status` on mount:
  - If `isSetupComplete === false` → redirect to `/setup`
  - If `isSetupComplete === true` → show login as normal
- The `/setup` page should also check status and redirect to `/login` if setup is already done

**New hook: `web/src/hooks/useSetupStatus.ts`**

- Calls `GET /api/auth/status` on mount
- Returns `{ isSetupComplete: boolean, isLoading: boolean }`
- Cache the result in React Query so it's not re-fetched on every route change

### Phase 5: Change Password (Settings UI)

Add a "Change Password" section to the existing Settings page.

**New endpoint: `PUT /api/auth/password`**

- Requires authentication (JWT guard)
- Request body: `{ currentPassword: string, newPassword: string, confirmPassword: string }`
- Validates current password with `bcrypt.compare()`, then updates hash

**Web changes:**

- Add a "Security" or "Account" tab/section to `web/src/pages/Settings.tsx` (or a new `web/src/pages/settings/AccountSettings.tsx` following the existing pattern of `DockerSettings.tsx`, `GeneralSettings.tsx`, `GitSettings.tsx`)
- Current password, new password, confirm password fields
- Success/error feedback

### Phase 6: Clean Up Config

Once the DB-backed auth is in place:

- Remove `adminUser` block from `electron/config/.env.yaml` and `server/.env.yaml`
- Remove `AdminUserConfig` class (`server/src/libs/config/admin-user.config.ts`)
- Remove `adminUser` property from `AppConfig`
- Remove the `ADMIN_USERNAME` and `ADMIN_PASSWORD` env var references

The `auth.jwtSecret` remains in YAML config (auto-generated in Electron, env-var-driven in server mode) — that's already handled.

## Migration / Backwards Compatibility

- **Server (non-Electron) deployments:** On first startup after this change, there will be no admin user in the DB. The server will report `isSetupComplete: false` and the web UI will redirect to `/setup`. This replaces the previous "check the YAML for default creds" workflow.
- **Existing Electron installs:** Same — the SQLite DB won't have an admin user, so the setup page will appear on next launch. This is actually a feature: users will set a real password instead of relying on the YAML default.
- **No data migration needed:** There's no existing user data to migrate. The only thing that changes is where credentials come from.

## Implementation Order

1. Add `bcryptjs` dependency to `server/package.json`
2. Create `AdminUser` entity + repository + module
3. Add `GET /api/auth/status` endpoint
4. Add `POST /api/auth/setup` endpoint
5. Refactor `AuthService.login()` to use DB lookup + bcrypt
6. Add `web/src/hooks/useSetupStatus.ts` and `web/src/api/auth.api.ts` additions
7. Create `web/src/pages/Setup.tsx`
8. Update routing in `web/src/App.tsx` (setup redirect logic)
9. Add `PUT /api/auth/password` endpoint
10. Add account/security section to Settings page
11. Remove `adminUser` from YAML configs and `AdminUserConfig` class
12. Update `electron/config/.env.yaml` and `server/.env.yaml`

Steps 1-8 are the MVP. Steps 9-10 are the password change feature. Steps 11-12 are cleanup.

## Security Considerations

- **bcrypt cost factor:** Use 12 rounds (good balance for a local app)
- **Setup endpoint guard:** Must reject if an admin already exists — this is critical to prevent hijacking
- **Password validation:** Enforce minimum 8 characters, server-side validation
- **No plaintext storage:** Passwords are only ever stored as bcrypt hashes
- **Rate limiting:** Consider adding basic rate limiting on `/api/auth/login` and `/api/auth/setup` to prevent brute force (can use `@nestjs/throttler`)
