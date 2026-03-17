# AFK Desktop (Electron)

Electron wrapper that bundles the AFK server and web client into a standalone desktop application. On launch it boots an embedded NestJS server and opens a BrowserWindow pointed at it.

## Prerequisites

- Node.js >= 24
- Docker Desktop installed and running (required for session operations; the web UI shows a warning banner when unavailable)
- The **server** and **web** projects must be built before packaging

## Development

From the **repository root**:

```bash
# Install all dependencies (server, web, electron)
npm run install:all

# Build everything then start Electron in dev mode
npm run start:electron:dev
```

Or from the **electron/** directory:

```bash
npm install
npm run dev      # compiles TypeScript then launches Electron
```

Dev mode (`!app.isPackaged`) resolves resource paths relative to the monorepo root and opens DevTools automatically.

## Building

### Compile TypeScript only

```bash
npm run build
```

Outputs transpiled JS and source maps to `electron/dist/`.

### Package a distributable

Before packaging, make sure the server and web are built:

```bash
# From the repo root
npm run server:build
npm run web:build
```

Then package:

```bash
# Full installer (DMG + ZIP on macOS)
npm run package

# Unpacked directory (faster, useful for debugging)
npm run package:dir
```

Both commands compile TypeScript first, then invoke `electron-builder` with the config in `electron-builder.config.js`.

## Output

| Path                | Contents                                                           |
| ------------------- | ------------------------------------------------------------------ |
| `electron/dist/`    | Compiled main process JS (`main.js`, `preload.js`) and source maps |
| `electron/release/` | Packaged distributables (DMG, ZIP, or unpacked app)                |

The packaged app bundles these extra resources alongside the Electron binary:

- `server/dist` and `server/node_modules` — the NestJS backend
- `web/dist` — the Vite-built frontend
- `electron/build/icon.png` — app icon

## Project Structure

```
electron/
├── build/                    # Build resources (icons, entitlements)
│   ├── entitlements.mac.plist
│   ├── icon.icns             # macOS icon
│   ├── icon.ico              # Windows icon
│   └── icon.png              # Linux / generic icon
├── dist/                     # Compiled JS output (gitignored)
├── release/                  # Packaged distributables (gitignored)
├── src/
│   ├── main.ts               # Electron main process entry point
│   └── preload.ts            # Context bridge (exposes platform info)
├── electron-builder.config.js
├── package.json
└── tsconfig.json
```

## How It Works

1. **Environment setup** — configures the SQLite database path inside the Electron `userData` directory.
2. **Server boot** — requires the bundled NestJS server and calls `bootstrapServer()` on port 4919.
3. **Window creation** — opens a `BrowserWindow` pointed at `http://localhost:4919` with a hidden title bar (macOS inset traffic lights).
4. **Docker health** — Docker availability is checked by the web UI via the server's `/health/ready` endpoint. A warning banner appears in the layout when Docker is unreachable.
5. **Shutdown** — gracefully closes the NestJS app on quit.

## macOS Notes

The builder config targets both `arm64` and `x64` architectures and produces DMG and ZIP artifacts. Hardened runtime and entitlements are configured for signing — set the usual `CSC_LINK` / `CSC_KEY_PASSWORD` environment variables to code-sign the build.
