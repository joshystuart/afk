# Stack Research

**Domain:** secure agentic coding platform  
**Researched:** 2026-04-10  
**Confidence:** HIGH (npm-verified versions); MEDIUM (Cursor CLI install/auth in Docker — confirm against current Cursor docs before locking images)

## Recommended Stack

### Core Technologies

| Technology                   | Version                                                      | Purpose                                                                   | Why Recommended                                                                                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **dockerode** (existing)     | current in repo                                              | Session containers, exec, bind mounts                                     | Already the integration point for agents and filesystem; skills mounting is a **read-only `-v host:container:ro`** (or equivalent API) — no new service mesh.                                                                                                  |
| **@openai/codex**            | **^0.118.0** (global/npm in image)                           | Codex CLI inside session images                                           | Official npm distribution (`npm i -g @openai/codex`); matches “invoke via CLI in container” constraint. Pin image build to a tested minor.                                                                                                                     |
| Cursor install script        | **not npm** — `curl https://cursor.com/install -fsS \| bash` | Cursor CLI / agent binary in container                                    | Cursor is distributed via install script + PATH (`~/.local/bin`); document `CURSOR_API_KEY` at runtime. Keeps parity with other agents without inventing a non-official package.                                                                               |
| Claude Code CLI              | **existing pattern** (`claude -p` / image packages)          | Claude agent                                                              | Already integrated; multi-agent work is **orchestration + image matrix**, not a new SDK.                                                                                                                                                                       |
| **simple-git**               | **^3.35.2**                                                  | Server-side or sidecar `git status` / `git diff` / metadata for summaries | Typed, maintained API over spawning `git` for workspace paths the server can see; feeds diff text to UI and auto-message flows. Use **inside container via exec** where the repo lives, or against an optional host bind mount — same library, two call sites. |
| **@octokit/rest** (existing) | **^22.x** in repo                                            | PR creation / GitHub integration                                          | Already present; extend for “open PR with generated body” instead of adding a second GitHub client.                                                                                                                                                            |
| **react-diff-view**          | **^3.3.3**                                                   | Post-run unified diff UI (split/unified)                                  | Purpose-built for **git unified diff** strings; pairs with `git diff` output from the session. Strong performance story vs. generic HTML renderers.                                                                                                            |
| **gitdiff-parser**           | **^0.3.1** (transitive via `react-diff-view` or explicit)    | Parse diff text                                                           | `react-diff-view` documents wrapping `gitdiff-parser`; pin explicitly only if you need direct access to `File[]` for summaries.                                                                                                                                |
| **prismjs**                  | **^1.30.0**                                                  | Optional tokenization / syntax highlighting in diff view                  | Common `react-diff-view` companion for language-aware lines; load languages lazily to control bundle size.                                                                                                                                                     |
| **@mui/x-tree-view**         | **^9.0.1**                                                   | File system explorer (tree, lazy expansion)                               | Aligns with MUI 7 + React 19 already in `web/`; Rich Tree View supports lazy loading for large repos. Match `@mui/material` minor with MUI X release notes.                                                                                                    |
| **react-mentions-ts**        | **^5.4.7**                                                   | `@file` / `@folder` autocomplete in prompt                                | React 19–first, TypeScript, async `data` loaders for file lists — fits streaming suggestions from an API. **Peers:** `clsx`, `class-variance-authority`, `tailwind-merge` (use MUI `List`/`MenuItem` in `renderSuggestion`; Tailwind optional per README).     |
| **fast-glob**                | **^3.3.3**                                                   | Server-side path listing when listing **host** workspace mount            | Fast glob for autocomplete/index APIs when the workspace is on the host path; **not** for arbitrary container paths unless the same path is mounted read-only to the server process.                                                                           |

### Supporting Libraries

| Library       | Version           | Purpose                                                         | When to Use                                                                                                                                                                    |
| ------------- | ----------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **diff2html** | **^3.4.56**       | HTML diff from unified diff                                     | **Alternative** to `react-diff-view` if you want quick HTML/CSS output or email/print export; **do not** bundle both for the primary in-app viewer — pick one rendering stack. |
| **fuse.js**   | latest compatible | Fuzzy ranking of file paths for `@` suggestions                 | When plain `filter()` is insufficient for large monorepos; optional dependency.                                                                                                |
| **ignore**    | latest compatible | Respect `.gitignore` / `.cursorignore` when building file lists | Autocomplete and explorer should not surface ignored secrets by default.                                                                                                       |

### Development Tools

| Tool                           | Purpose                                 | Notes                                                                                                                                                                                                                                                     |
| ------------------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-agent image CI**       | Matrix builds for `Dockerfile` variants | Codex npm global + Cursor install script + Claude; pin versions per image tag.                                                                                                                                                                            |
| **Protocol handlers (no npm)** | “Open in IDE”                           | Use `vscode://file/...` (and Cursor’s registered scheme if applicable on the user’s machine) via `window.open` / Electron `shell.openExternal`; map container path → host path only when workspace mount is enabled — **document**, not a library choice. |
| **Read-only bind mount**       | Centralized skills directory            | Docker `-v /host/skills:/skills:ro`; validate host path in Settings + `nest-typed-config` defaults; **no** skills-specific npm — security is mount flags + path allowlists.                                                                               |

## Alternatives Considered

| Recommended           | Alternative                                         | When to Use Alternative                                                                             |
| --------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **react-diff-view**   | **diff2html** + `dangerouslySetInnerHTML` or iframe | Need static HTML artifacts (CI report, email) without React component model                         |
| **react-diff-view**   | **Monaco** diff editor                              | Need inline editing in diff — out of scope for AFK (“no built-in editor”); Monaco is heavy          |
| **react-mentions-ts** | **react-mentions** `^4.4.10`                        | Last resort if peer/CSS conflicts; older, last publish 2023 — validate React 19 in Vitest/Storybook |
| **react-mentions-ts** | **Lexical** / **Tiptap** mention extensions         | Rich doc-style prompts — heavier than needed for a terminal-like chat input                         |
| **simple-git**        | Raw `child_process` + `git`                         | Acceptable in hot paths already using exec; `simple-git` wins for readability and batching          |
| **fast-glob**         | `fdir`                                              | If only directory walking without glob patterns — benchmark on your largest repos                   |
| **@mui/x-tree-view**  | Custom recursive `List`                             | Only if bundle size is critical — you lose lazy/virtualization patterns for large trees             |

## What NOT to Use

| Avoid                                                      | Why                                                             | Use Instead                                                                                                                                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Direct Anthropic/OpenAI REST SDKs for agent turns**      | Conflicts with product constraint: agents via **CLI in Docker** | Keep `docker exec` + Claude / `@openai/codex` / Cursor binaries; SDKs only if you add a **separate** “generate message text” path explicitly allowed by settings (still optional). |
| **Two diff stacks in the main UI**                         | Duplicate theming, a11y, and bundle weight                      | `react-diff-view` **or** `diff2html`, not both for primary UX                                                                                                                      |
| **Running unparsed `ls -R` over WebSocket for huge trees** | Noise + latency                                                 | Lazy tree endpoints + `RichTreeView` expansion; cap depth/count server-side                                                                                                        |
| ** Writable skills mounts**                                | Breaks security model (“read-only in containers”)               | Always `:ro` + tests that container user cannot remount                                                                                                                            |
| **Monaco as default file browser**                         | Conflicts with “no built-in IDE”; large dependency              | MUI tree + diff viewer                                                                                                                                                             |

## Sources

- [react-diff-view @ npm](https://www.npmjs.com/package/react-diff-view) — v3.3.3 (2026-03-30)
- [simple-git @ npm](https://www.npmjs.com/package/simple-git) — v3.35.2 (2026-04-06)
- [@mui/x-tree-view @ npm](https://www.npmjs.com/package/@mui/x-tree-view) — v9.0.1 (2026-04-08)
- [react-mentions-ts @ npm](https://www.npmjs.com/package/react-mentions-ts) — v5.4.7 (2025-11-13)
- [fast-glob @ npm](https://www.npmjs.com/package/fast-glob) — v3.3.3 (2025-01-05)
- [prismjs @ npm](https://www.npmjs.com/package/prismjs) — v1.30.0 (2025-03-10)
- [diff2html @ npm](https://www.npmjs.com/package/diff2html) — v3.4.56 (2026-01-31)
- [gitdiff-parser @ npm](https://www.npmjs.com/package/gitdiff-parser) — v0.3.1
- [@openai/codex @ npm](https://www.npmjs.com/package/@openai/codex) — v0.118.0 (as of fetch date)
- [Cursor CLI installation](https://cursor.com/docs/cli/installation) — install method and env (verify current docs before production)
- AFK `.planning/PROJECT.md` — CLI-only agents, read-only skills, nest-typed-config + Settings patterns

### Per-recommendation confidence

| Item                                | Confidence     | Notes                                                                               |
| ----------------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| react-diff-view + git diff pipeline | **HIGH**       | npm + documented usage for unified diff                                             |
| @mui/x-tree-view + MUI 7            | **HIGH**       | Peer range includes React 19; verify `@mui/material` alignment in lockfile          |
| react-mentions-ts without Tailwind  | **MEDIUM**     | README allows non-Tailwind styling; add peers and prototype in Storybook            |
| Cursor in Docker                    | **MEDIUM**     | Official script exists; forum reports auth edge cases — validate in your base image |
| fuse.js / ignore                    | **LOW–MEDIUM** | Optional; versions pinned when adopted                                              |

---

_Stack research for: secure agentic coding platform_  
_Researched: 2026-04-10_
