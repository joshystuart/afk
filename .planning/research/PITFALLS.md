# Pitfalls Research

**Domain:** secure agentic coding platform  
**Researched:** 2026-04-10  
**Confidence:** MEDIUM

Research combines AFK’s stated architecture ([`.planning/codebase/ARCHITECTURE.md`](../codebase/ARCHITECTURE.md)), known gaps ([`.planning/codebase/CONCERNS.md`](../codebase/CONCERNS.md)), and industry patterns for containerized agent UIs (path handling, git integration, multi-agent coordination). **HIGH confidence** for classic web/container issues (path traversal, subprocess misuse) when aligned with OWASP-style guidance and published advisories. **MEDIUM confidence** for multi-agent orchestration tradeoffs (much of the literature is blog/analysis, not formal standards). **LOW confidence** where only anecdotal or vendor content exists—called out inline.

## Critical Pitfalls

### Pitfall 1: Treating “multi-agent” as a UI toggle without isolation semantics

**What goes wrong:** Multiple CLIs (Claude, Codex, Cursor, etc.) share one working tree and one Git state. Agents overwrite each other’s edits, produce nonsense merges, or corrupt `.git` metadata. Users blame “the wrong agent” when the real issue is concurrent writers on a shared sandbox.

**Why it happens:** Product pressure adds “pick an agent per prompt” without defining **serialization**, **worktree isolation**, or **branch-per-agent** rules. Teams underestimate that filesystem and Git are shared mutable state, not message buses.

**How to avoid:** Choose an explicit model: **one active writer per workspace** (queue or lock), **git worktrees** or **cloned workdirs per agent**, or **strict serial execution** with visible status. Document what happens if two prompts are in flight. Prefer isolation patterns discussed in production multi-agent postmortems (e.g. worktree-based separation—_community/anecdotal, MEDIUM confidence_).

**Warning signs:** Intermittent “file changed on disk” errors; conflicting edits; CI flakiness only when two sessions run; Git index conflicts inside the container.

**Phase to address:** **Multi-agent & orchestration** (foundational). Must be decided before scaling UX around agent pickers.

---

### Pitfall 2: Path traversal, symlink escape, and TOCTOU in container file APIs

**What goes wrong:** A “list files” or “read file” API accepts relative paths or opaque strings and resolves them unsafely. Attackers or confused UIs read `/etc/passwd`, host-mounted secrets, Docker socket paths, or other sessions’ workspaces via `../`, encoded segments, or symlink following.

**Why it happens:** Developers concatenate user input onto a “base path” without **canonical resolution** and **prefix verification**. Symlinks and **time-of-check/time-of-use** races allow bypass even when a check “looks” correct.

**How to avoid:** Resolve paths with **`realpath`/`openat`-style** semantics; enforce **workspace root prefix** after resolution; prefer **inode-scoped** APIs; consider **`O_NOFOLLOW`** / no-follow policies for sensitive operations; never trust the browser with raw absolute container paths for authorization—**bind access to session ID → server-side resolved root**.

**Warning signs:** API accepts `..` or absolute paths; different results for Unicode-normalized paths; security tests only use happy paths; skills or workspace mounts mention “symlinks don’t work.”

**Phase to address:** **Filesystem explorer & file-access services** (core). Revisit when adding **skills mounts** (symlink behavior changes).

---

### Pitfall 3: Git/diff integration via shell string composition

**What goes wrong:** User-influenced branch names, paths, or refs are interpolated into `sh -c "git diff …"` (or equivalent). That is a direct path to **command injection** on the machine running Git—often the container, but still catastrophic inside the trust boundary.

**Why it happens:** Git is invoked from backend code via shell for convenience; **branch/ref/file** parameters look “safe” until someone passes `$(...)` or `;`.

**How to avoid:** Use **argument arrays** (no shell), or vetted libraries (`libgit2`-style) with **strict allowlists** for refs and paths. Treat diff output as **untrusted text** (XSS if rendered in web UI without escaping). **Sanitize or block** `GIT_*` env manipulation if any user input can influence the process environment.

**Warning signs:** `exec`/`spawn` with `shell: true`; string templates with `${path}`; copy-paste from Stack Overflow `child_process` examples.

**Phase to address:** **Diff viewer & git read paths** (blocking security review).

_Reference (HIGH confidence):_ OpenHands published a **Git diff handler command injection** advisory ([GHSA-7h8w-hj9j-8rjw](https://github.com/OpenHands/OpenHands/security/advisories/GHSA-7h8w-hj9j-8rjw))—same class of bug applies to any web-wrapped git tool.

---

### Pitfall 4: Unbounded diff/log streaming (DoS and bad UX)

**What goes wrong:** `git diff` or `git show` against huge binaries or megabyte-scale changes **blocks** the event loop, exhausts memory, or **fills WebSocket payloads** until clients disconnect.

**Why it happens:** “Show me what changed” is implemented as **full raw diff** with no caps, pagination, or binary detection.

**How to avoid:** Cap bytes/lines; detect binary files; summarize at high level first; **stream** with backpressure; offer per-file drill-down. Align with existing AFK patterns for streaming chat/logs.

**Warning signs:** UI freezes on large repos; OOM in container; single request spikes CPU.

**Phase to address:** **Diff viewer** (reliability). Overlaps **observability** if metrics show tail latency spikes.

---

### Pitfall 5: `@file` / folder tagging as accidental prompt-injection highways

**What goes wrong:** User (or repo) attaches “context” by path. Files contain **instructions in comments**, markdown, or data that the model obeys—**indirect prompt injection**. The UI thought it was “just adding context”; the agent treats it as task input.

**Why it happens:** LLMs don’t robustly separate **system policy** from **file contents**. Any feature that pulls arbitrary repo text into the prompt inherits this class.

**How to avoid:** **Provenance labeling** in the prompt (“untrusted file content”); optional **strip/redact** of common injection patterns (weak alone); **user visibility** of exactly what text was attached; keep **sandbox** assumption (AFK’s container boundary) as the real mitigation. Do not promise “safe @file” without defining threat model.

**Warning signs:** Agent follows instructions embedded in `README` or tests; bug reports “it deleted files after I opened a file”; support for HTML/SVG-heavy files without stripping.

**Phase to address:** **Prompt input & @file tagging** (product + security disclosure). Ongoing **hardening** phase for advanced mitigations.

---

### Pitfall 6: Skills directory mounts—symlinks, partial mounts, and “read-only” misunderstandings

**What goes wrong:** Centralized skills are mounted read-only, but **symlinks** point outside the mount, **break** at runtime, or cause tools to **silently skip** skill content. Users perceive “skills don’t load” as a bug; attackers might leverage unexpected follow behavior if any consumer follows links into writable areas (_depends on mount layout—validate per design_).

**Why it happens:** Docker bind mounts and host symlinks interact badly; **read-only** does not mean “no symlink exit” if targets are reachable. Different skill ecosystems assume different directory layouts.

**How to avoid:** Document **supported layouts**; **pre-resolve** or **reject** symlinks for the skills tree at mount or server startup; integration-test **skills.sh / GSD / other** layouts; clear errors when a skill path is missing vs empty.

**Warning signs:** “Works on my machine” only when skills are copied flat; intermittent loads after host updates; `ENOENT` in agent logs.

**Phase to address:** **Skills mounting & runtime** (dedicated). Retest when changing base images or mount options.

---

### Pitfall 7: Auto-generated commit and PR messages amplifying secrets and hallucinations

**What goes wrong:** Models summarize **staged diffs** that accidentally contain **keys** or **internal URLs**; generated text repeats them in the commit/PR UI. Separately, messages **hallucinate** scope or intent, polluting history.

**Why it happens:** Commit message features optimize for speed; **secret scanning** is not automatic in the generation path; users trust green “suggested message” text.

**How to avoid:** Run **gitleaks/detect-secrets-class** gates on **staged** content before offering AI text; **never** auto-commit without confirmation; default to **user review**; redact known patterns in prompts (_defense in depth_). Follow vendor **responsible-use** patterns (e.g. GitHub Copilot commit message guidance—_MEDIUM confidence for process, not AFK-specific_).

**Warning signs:** Suggested messages quote env var names or token-like strings; users click commit faster than read.

**Phase to address:** **Commit/PR message automation** (must include **pre-commit/scan** story).

---

### Pitfall 8: Agent dispatch mistakes—wrong binary, wrong env, wrong working directory

**What goes wrong:** “Multi-agent” is implemented as **string swap** of CLI name without matching **install**, **PATH**, **API keys**, or **invocation flags**. Sessions appear healthy but run **degraded mode** or the wrong tool.

**Why it happens:** Each agent has different install paths, auth (OAuth vs API key), and non-interactive flags. A single code path tries to branch on `agentId` with growing `switch` statements.

**How to avoid:** **Adapter interface** per agent (install probe, version check, **non-interactive** contract); **integration tests** per agent in CI; persist **resolved binary path** and **failure reasons** in session metadata.

**Warning signs:** Heisenbugs “only Codex”; logs show exit code 127; partial streaming.

**Phase to address:** **Multi-agent & orchestration** (same as Pitfall 1, implementation detail).

---

### Pitfall 9: Realtime channels without session-scoped authorization (cross-tenant/session bleed)

**What goes wrong:** WebSocket or SSE subscriptions key only on `sessionId` without proving the connection **owns** that session. Another client guesses or replays IDs and receives **streams** (logs, chat, file events).

**Why it happens:** HTTP routes use `AuthGuard`, but **Socket.IO** handshake omits the same binding (_documented gap in AFK concerns_).

**How to avoid:** **Authenticate the socket**; authorize **every** subscribe/join on `(user, session)`; align CORS/ws origin policy with HTTP. This becomes **more critical** when file/diff events add richer data.

**Warning signs:** Subscription handlers lack user context; penetration test finds cross-session room access.

**Phase to address:** **Security hardening: WebSocket auth** (prerequisite or parallel to **filesystem/diff** features that increase data sensitivity).

_Internal source (HIGH confidence for AFK):_ [`.planning/codebase/CONCERNS.md`](../codebase/CONCERNS.md) — WebSocket session namespace authorization.

---

### Pitfall 10: “Workspace mount for IDE” widens the blast radius

**What goes wrong:** Opt-in host mount is implemented for DX, but **documentation** understates that **malicious or compromised** container code can touch more of the host tree depending on mount scope.

**Why it happens:** Users conflate “Docker” with “safe”; the **mount** is a deliberate bridge.

**How to avoid:** **Narrow mount** paths; clear **UX warnings**; separate **read-only** vs read-write; ensure **explorer** and **@file** respect the same boundaries as the agent.

**Warning signs:** Single broad `~/` mount; bug reports of host file corruption.

**Phase to address:** **Filesystem explorer & IDE integration** (policy + UX). Ties to **Docker/settings** configuration.

---

## Technical Debt Patterns

| Pattern                                         | Why it bites                                           | Prevention                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **God component** for “agents + git + files”    | Un-testable branches; security mistakes hide in merges | Interactor split per capability (AFK already favors interactors—extend, don’t centralize in one gateway) |
| **Untyped stream events** (`any[]` in entities) | Diff/chat/file events evolve; runtime breaks           | Typed unions at persistence boundaries ([noted in CONCERNS.md](../codebase/CONCERNS.md))                 |
| **Client-driven path strings**                  | Authorization bypass                                   | Server resolves paths; client sends intent, not filesystem paths                                         |
| **CI runs only e2e Jest**                       | Unit tests for path/git never run                      | Fix test script split ([CONCERNS.md](../codebase/CONCERNS.md)) before adding risky modules               |

## Security Mistakes

- **Shell-first Git** — see Critical Pitfall 3.
- **Path trust** — see Pitfall 2 and 10.
- **Socket subscription trust** — Pitfall 9.
- **Prompt injection via attached files** — Pitfall 5.
- **Secrets in AI-generated commit text** — Pitfall 7.
- **Over-privileged container** — exacerbates all of the above; keep **least privilege**, read-only root where possible (_general container hygiene—HIGH confidence baseline_).

## UX Pitfalls

- **Agent picker without runtime feedback** — user doesn’t know if the agent failed vs model. Surface **version, last error, and binary path**.
- **Diff viewer as raw patch only** — non-experts can’t act; provide **file list + per-file** navigation and **binary** handling.
- **@file autocomplete noise** — huge repos freeze UI; require **debounce**, **server-side search**, **ignore globs** (e.g. `node_modules`).
- **“Open in IDE”** broken by path mapping — document **path translation** when workspace mount uses different roots.

## "Looks Done But Isn't" Checklist

- [ ] **Multi-agent:** Two concurrent tasks on same session defined (allowed or blocked?) and **tested**.
- [ ] **Explorer:** Traversal payloads in automated tests (`..`, encoded, symlink); **403** outside workspace.
- [ ] **Diff:** Large repo **smoke test**; binary file behavior; **no shell** Git.
- [ ] **Skills:** Cold start with **only** symlinked skill tree; expected failure mode documented.
- [ ] **Commit/PR AI:** Staged secret in fixture → **blocked** or **warned**, never suggested verbatim.
- [ ] **WebSocket:** Subscribe to another user’s `sessionId` → **denied** (after auth fix).

## Pitfall-to-Phase Mapping

| Phase (suggested)                        | Primary pitfalls            | Notes                                    |
| ---------------------------------------- | --------------------------- | ---------------------------------------- |
| **Security hardening: transport & auth** | 9 (WS auth), CORS alignment | Unblocks safe file/diff streaming        |
| **Multi-agent & orchestration**          | 1, 8                        | Isolation model + per-agent adapters     |
| **Filesystem explorer & @file tagging**  | 2, 5, 10                    | Path safety + prompt injection awareness |
| **Diff viewer**                          | 3, 4                        | No shell Git; size limits                |
| **Skills mounting**                      | 6                           | Symlinks, layouts, errors                |
| **Commit/PR message automation**         | 7                           | Secret scanning + human confirmation     |
| **Tab chat/terminal (if grouped)**       | 4, 9                        | Shared realtime concerns                 |

## Sources

- OWASP / API security: path traversal prevention (canonicalization, allowlists) — **MEDIUM–HIGH confidence** (general industry standard).
- OpenHands GitHub Advisory **GHSA-7h8w-hj9j-8rjw** — command injection in git diff handler — **HIGH confidence** (published advisory).
- Multi-agent coordination and **worktree** isolation narratives — **MEDIUM confidence** (industry blogs/analyses, e.g. multi-agent failure posts on galileo.ai, cribl.io, techaheadcorp.com — useful patterns, not normative standards).
- Prompt injection and indirect injection via file content — **MEDIUM confidence** (Bugcrowd, multiple security vendors; threat is well-accepted).
- Symlinks, mounts, TOCTOU — **MEDIUM confidence** (LWN, Docker forums, kernel mount options; behavior is OS-dependent—validate on target OS).
- GitHub Copilot **responsible use** for commit messages — **MEDIUM confidence** (vendor process guidance).
- **AFK-internal:** [`.planning/codebase/CONCERNS.md`](../codebase/CONCERNS.md) (WebSocket auth, CORS, test gaps) — **HIGH confidence** for this codebase.

---

_Pitfalls research for: secure agentic coding platform_  
_Researched: 2026-04-10_
