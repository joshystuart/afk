# Custom Docker Images

## Goal

Allow users to select different Docker images when launching a session so they can work in language-specific environments (Python, C#, Go, etc.) rather than being locked to a single Node.js image.

## Architecture

### Docker Image Hierarchy

```
afk-base (debian:bookworm-slim)
├── Claude Code (native installer, no Node.js needed)
├── tmux, ttyd, git, ripgrep, inotify-tools, etc.
├── Entrypoint scripts, .tmux.conf
└── Workspace setup (/workspace)

afk-node (extends afk-base)
├── Node.js 20, npm, yarn, pnpm

afk-python (extends afk-base)
├── Python 3.12, pip, venv, poetry

afk-go (extends afk-base)
├── Go 1.22+

afk-rust (extends afk-base)
├── Rust (via rustup), cargo

afk-dotnet (extends afk-base)
├── .NET SDK 8

afk-java (extends afk-base)
├── JDK 21, Gradle, Maven
```

The base image uses `debian:bookworm-slim` for a minimal footprint. Claude Code's native installer ships its own runtime, so Node.js is not needed in the base. `afk-node` adds the full Node.js toolchain (npm, yarn, pnpm, etc.).

Users can create their own images by extending `afk-base` and registering them in the settings UI.

### Data Model

**New table: `docker_images`**

| Column       | Type         | Notes                                      |
| ------------ | ------------ | ------------------------------------------ |
| id           | varchar(36)  | PK, UUID                                   |
| name         | varchar(255) | Display name (e.g. "Python")               |
| image        | varchar(255) | Docker image reference (e.g. "afk-python") |
| isDefault    | boolean      | Only one image can be the default          |
| isBuiltIn    | boolean      | True for shipped images, prevents deletion |
| status       | varchar      | AVAILABLE, PULLING, ERROR                  |
| errorMessage | text         | Nullable, stores pull error details        |
| createdAt    | datetime     |                                            |
| updatedAt    | datetime     |                                            |

**Session entity changes:**

- Add `imageId` (varchar, nullable for backwards compat with existing sessions)
- Add `imageName` (varchar, snapshot of the image reference at creation time so it survives image deletion)

### Config Changes

- Remove `docker.imageName` from `DockerConfig` and `.env.yaml`
- The image is now determined per-session from the `docker_images` table
- `docker.socketPath`, `docker.startPort`, `docker.endPort` remain unchanged

---

## Phases

### Phase 1 — Docker Infrastructure & Data Layer

Refactor the Docker build system and set up the backend data layer.

**Docker:**

- Refactor `docker/Dockerfile` into `docker/base/Dockerfile` (the `afk-base` image)
  - Base from `debian:bookworm-slim` for minimal image size
  - Keep: tmux, ttyd, git, ripgrep, inotify-tools, Claude Code (native installer), entrypoint scripts
  - No Node.js in base — the native Claude Code installer ships its own runtime
- Create language-specific Dockerfiles in `docker/<language>/Dockerfile`, each `FROM afk-base`
  - `docker/node/Dockerfile` — Node.js 20 + npm, yarn, pnpm
  - `docker/python/Dockerfile` — Python 3.12 + pip, venv, poetry
  - `docker/go/Dockerfile` — Go 1.22+
  - `docker/rust/Dockerfile` — Rust via rustup + cargo
  - `docker/dotnet/Dockerfile` — .NET SDK 8
  - `docker/java/Dockerfile` — JDK 21 + Gradle + Maven
- Update `docker-compose.yml` to build the base image and at least one language image
- Add a build script or Makefile target to build all images locally

**Backend — Entity & Repository:**

- Create `DockerImage` entity (`server/src/domain/docker-images/`)
- Create `DockerImageRepository` with CRUD operations
- Add migration/seed logic to insert built-in images on first startup (with `isBuiltIn: true`)
- Update `Session` entity to add `imageId` and `imageName` columns

**Backend — Config:**

- Remove `imageName` from `DockerConfig` class and `.env.yaml` templates

### Phase 2 — Image Management API & Settings UI

Build the backend endpoints and the settings UI for managing Docker images.

**Backend — Image Pull Service:**

- Create `DockerImageService` that handles:
  - Pulling an image from the Docker daemon (via Dockerode)
  - Updating image status (`PULLING` → `AVAILABLE` or `ERROR`)
  - Setting/unsetting the default image (enforce single-default constraint)
- Create interactors:
  - `GET /api/docker/images` — list all images
  - `POST /api/docker/images` — register a new image (triggers pull, returns immediately with `PULLING` status)
  - `DELETE /api/docker/images/:id` — remove a non-built-in image (fail if in use by active sessions)
  - `PATCH /api/docker/images/:id/default` — set an image as the default
  - `GET /api/docker/images/:id/status` — poll pull status (or use WebSocket/SSE if we already have one)

**Frontend — Settings page:**

- Add a "Docker Images" section to the Settings page
- Display the list of registered images with:
  - Name, image reference, status badge (Available / Pulling / Error)
  - Default indicator (star or badge)
  - Actions: Set as Default, Remove (disabled for built-in images)
- "Add Image" form:
  - Name (text input)
  - Image (text input for Docker image reference)
  - On submit: call `POST /api/docker-images`, show pulling state, resolve to Available or Error
- Error state shows the error message with a "Retry" option

### Phase 3 — Session Creation Integration

Wire the image selection into the session creation flow.

**Backend:**

- Add `imageId` to `CreateSessionRequest` DTO (required)
- Update `CreateSessionInteractor`:
  - Look up the `DockerImage` by `imageId`, verify status is `AVAILABLE`
  - Pass the image reference to `DockerEngineService.createContainer()`
  - Store `imageId` and `imageName` (snapshot) on the session
- Update `ContainerCreateOptions` to accept `imageName` instead of reading from config
- Update `DockerEngineService.createContainer()` to use `options.imageName` as the `Image` field

**Frontend — Create Session page:**

- Add an image selector dropdown above the repository section
  - Alpha-sorted by name
  - Default image pre-selected
  - Required field
  - Only show images with `AVAILABLE` status
- Update `CreateSessionRequest` type to include `imageId`

**Frontend — Session display:**

- Show the image name on session cards/list items so users can see what environment each session is running

---

## Out of Scope (for now)

- Per-image environment variable overrides
- Image grouping / categorization / icons
- Auto-updating images (re-pulling latest tags)
- Multi-architecture image builds
- Publishing images to a public registry
