# Feature Research

**Domain:** secure agentic coding platform  
**Researched:** 2026-04-10  
**Confidence:** MEDIUM

**MEDIUM rationale:** Feature lists for commercial IDEs (Cursor, Windsurf) mix marketing and rapidly shifting roadmaps; open-source projects (OpenHands, Cline, Aider) are easier to ground in repos/docs. Container-security practices are corroborated across vendor blogs and OpenHands official docs, but exact competitor parity claims should be re-checked at roadmap time.

## Feature Landscape

### Table Stakes (Users Expect These)

Features that define “agentic coding” in 2025–2026 across IDE extensions, CLIs, and web harnesses. Missing several of these makes a product feel incomplete versus **Cursor**, **Windsurf**, **Cline**, **Continue**, **Aider**, and containerized stacks like **OpenHands**.

| Feature                                           | Why Expected                                                                                    | Complexity  | Notes                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| **Streaming assistant output**                    | Users judge responsiveness on first token latency and smooth streaming; batch-only feels legacy | Medium      | AFK: WebSocket streaming ✓ ([PROJECT.md](../PROJECT.md))                             |
| **Chat + task loop**                              | Core interaction pattern: goal → agent acts → user steers                                       | Medium      | Table stakes even without full IDE                                                   |
| **Terminal / command execution**                  | Agents must run builds, tests, package managers, CLIs                                           | Medium      | AFK: web terminal ✓; isolation is differentiator                                     |
| **Git awareness**                                 | Branch, diff, commit, push are the review/ship loop                                             | Medium–High | AFK: commit/push buttons ✓; richer diff/PR automation in Active                      |
| **Model choice / BYOK**                           | Teams standardize on specific models and keys for cost/compliance                               | Medium      | AFK: model selection ✓                                                               |
| **Plan vs execute (or ask vs agent)**             | Reduces destructive surprises; matches mental model of “think then do”                          | Medium      | AFK: agent/planning modes ✓                                                          |
| **Context selection (@ files, folders, symbols)** | Models are context-bounded; explicit selection beats “hope the index is enough”                 | Medium–High | AFK: `@file` autocomplete in Active ([PROJECT.md](../PROJECT.md))                    |
| **Change review (diff)**                          | Trust comes from seeing what changed before merge                                               | Medium      | AFK: diff viewer in Active                                                           |
| **Session persistence**                           | Long tasks span hours; losing history is unacceptable                                           | Medium      | AFK: chat history ✓                                                                  |
| **Multi-session / parallel work**                 | Real work is not single-threaded                                                                | Medium–High | AFK: concurrent sessions ✓                                                           |
| **Auth for multi-user or shared installs**        | Anything beyond single-machine solo use needs identity                                          | Medium      | AFK: GitHub OAuth ✓                                                                  |
| **Real-time UI updates**                          | Status, logs, job output should live-update                                                     | Medium      | AFK: WebSocket ✓                                                                     |
| **Skills / rules / project memory**               | Repeatable behavior and house style without re-prompting                                        | Medium–High | AFK: centralized skills in Active; many tools use `.rules`, skills dirs, or memories |

**Container-based secure platforms — additional table stakes**

These are expectations when the **value proposition is isolation**, not only when selling to enterprise. They overlap OpenHands-style sandboxes and common hardening guidance for agent runtimes.

| Feature                       | Why Expected                                                  | Complexity  | Notes                                                                                  |
| ----------------------------- | ------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| **Strong isolation boundary** | Reason users accept agents that run shell and network         | High        | Docker/VM/MicroVM narrative; AFK: containers as boundary ([PROJECT.md](../PROJECT.md)) |
| **Lifecycle management**      | Create, start, stop, restart, cleanup; avoid zombie resources | Medium–High | AFK: session/container lifecycle ✓ ([ARCHITECTURE.md](../codebase/ARCHITECTURE.md))    |
| **Controlled workspace I/O**  | Explicit read-only vs read-write mounts; optional host bridge | High        | AFK: optional workspace mount, read-only skills mount ([PROJECT.md](../PROJECT.md))    |
| **Audit-friendly logging**    | Who ran what, when, in which session                          | Medium      | AFK: observability/metrics ✓; expand for compliance narratives                         |
| **Secrets hygiene**           | Tokens and keys not sprayed into logs or arbitrary file reads | High        | Ongoing; maps to “no arbitrary host execution from UI” constraint                      |
| **Health / recovery**         | Restarts, stuck jobs, reconciling state after crashes         | Medium      | AFK: startup reconciliation, health ✓                                                  |

### Differentiators (Competitive Advantage)

| Feature                                                               | Value Proposition                                                                                    | Complexity  | Notes                                                                                 |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| **Isolation-first architecture (VM/container as the trust boundary)** | Harder to bypass than in-process “sandbox” or IDE-only prompts; aligns with enterprise threat models | High        | Core AFK thesis; differs from default Cursor/Windsurf mental model (IDE-centric)      |
| **CLI-agent harness (invoke real tools in real environments)**        | Bring your own agent (`claude -p`, future `codex`, etc.) without vendor API lock-in                  | Medium–High | AFK constraint: CLI invocation ([PROJECT.md](../PROJECT.md))                          |
| **Self-hosted, open-source**                                          | Data residency, customization, no subscription to a hosted IDE                                       | High (ops)  | AFK positioning; differs from Cognition/Windsurf/Cursor cloud paths                   |
| **Desktop-embedded control plane (Electron)**                         | Single artifact, local API, auto-update                                                              | Medium      | AFK: Electron ✓                                                                       |
| **MCP / tool ecosystem (where applicable)**                           | Standardized third-party tools; parity with “modern agent” story                                     | Medium–High | Table stakes for some competitors; differentiator for AFK if first-class in-container |
| **Deep Git-native workflow (Aider-style)**                            | Auto-commits, undo, atomic change sets — strong trust loop                                           | Medium      | Partially covered; auto commit/PR messages in Active                                  |
| **Checkpoints / rollback (Cline-style)**                              | Fast recovery from bad agent runs                                                                    | Medium      | Not yet AFK validated; strong UX differentiator                                       |
| **Browser-in-agent (OpenHands-style)**                                | E2E validation, scraping docs                                                                        | High        | Security surface area; often gated or optional                                        |
| **Benchmark-oriented ACI (SWE-agent lineage)**                        | Structured tools and feedback loops for reliability                                                  | High        | More research/SWE-bench than product UX; informs tool design                          |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature                                                 | Why Requested                      | Why Problematic                                                                                       | Alternative                                                                                                                                                       |
| ------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Full in-browser IDE / collaborative editor**          | “One tab for everything”           | Massive scope; competes with VS Code/JetBrains; duplicates AFK’s “host agent, not replace IDE” stance | “Open in local IDE” + workspace mount ([PROJECT.md](../PROJECT.md))                                                                                               |
| **Real-time multiplayer editing**                       | Team whiteboarding                 | Not the product category; huge infra                                                                  | Screen share or export artifacts                                                                                                                                  |
| **Hosted agent marketplace / arbitrary plugin install** | Convenience                        | Supply-chain risk; conflicts with read-only skills and security reviews                               | Curated skills directory mount; versioned packs                                                                                                                   |
| **Silent auto-merge to main**                           | Speed                              | Breaks review/compliance; blame games                                                                 | PR drafts, branch-scoped agents, required checks                                                                                                                  |
| **Unrestricted host filesystem from container**         | Faster file access                 | Destroys isolation story                                                                              | Explicit opt-in mounts with narrow scope                                                                                                                          |
| **Arbitrary MCP/tool execution without policy**         | Feature parity with desktop agents | Exfiltration and lateral movement                                                                     | MCP gateway, allowlists, audited tools ([industry practice](https://coder.com/blog/launch-dec-2025-agent-boundaries); LOW–MEDIUM confidence on specific products) |
| **Mobile-native coding surface**                        | Accessibility                      | Poor fit for agentic coding UX                                                                        | Defer per [PROJECT.md](../PROJECT.md)                                                                                                                             |

## Feature Dependencies

```
Isolation & lifecycle (containers)
  └─ Web terminal + agent CLI exec
       └─ Git operations + diff/review
            └─ PR automation / generated messages
                 └─ Multi-agent routing (per session or per prompt)

Auth (OAuth / future SSO)
  └─ Session ownership + audit attribution
       └─ Enterprise policy hooks (future)

Streaming + persistence
  └─ Durable chat history + job logs
       └─ “Resume work” and reconciliation paths

Context (@ files, explorer)
  └─ Skills/rules (read-only)
       └─ Consistent agent behavior across sessions

Workspace mount (optional)
  └─ IDE “open file” integrations
       └─ MUST NOT weaken read-only guarantees for skills / policy
```

## MVP Definition

Aligned with AFK’s “daily driver” direction and [PROJECT.md](../PROJECT.md) **Active** list — this is product MVP for the _next milestone_, not greenfield.

### Launch With (v1)

1. **Context in prompts** — `@file` / folder tagging with autocomplete (unblocks parity with IDE assistants).
2. **Diff viewer + file explorer** — close the “what changed?” loop inside the secure session.
3. **Centralized read-only skills** — one configured mount into sessions; supports GSD/skills ecosystems without a marketplace.
4. **Multi-agent support (CLI)** — at least one additional agent path + session lock or per-prompt selection.
5. **Auto-generated commit and PR text** — configurable model; pairs with existing Git actions.

### Add After Validation (v1.x)

- **Tab or split between chat and “agent terminal” view** — improves orientation without building an IDE.
- **Stronger audit export** — session transcripts + tool runs for teams evaluating SOC2-style narratives.
- **Checkpoints / rollback** — if user research shows fear of irreversible agent runs.

### Future Consideration (v2+)

- **Optional browser tool** in container with strict egress policy (OpenHands-style), if demand outweighs security review cost.
- **Policy/MCP gateway** for enterprises that want standardized tool allowlists.
- **MicroVM/Firecracker-class isolation** — only if Docker proves insufficient for a segment (HIGH complexity).

## Feature Prioritization Matrix

Rough axes: **User impact** (how much daily-driver lift) vs **Security/Architecture cost**. Higher impact + lower incremental risk = ship first.

| Quadrant                               | Examples                                                         | Milestone guidance                    |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| **High impact / lower security risk**  | Diff viewer, `@` context, auto commit/PR messages, file explorer | Prioritize for v1                     |
| **High impact / higher security risk** | Browser automation, arbitrary MCP, broad host mount              | Require threat model + phased rollout |
| **Lower impact / lower risk**          | UI polish, shortcuts                                             | Fill gaps between larger slices       |
| **Lower impact / higher risk**         | Novel execution surfaces without clear demand                    | Avoid                                 |

## Competitor Feature Analysis

Abbreviated mapping: what the market showcases vs what AFK optimizes for (**secure container + CLI agents + web/Electron control plane**). Feature names track vendor language; verify before competitive claims in external comms.

| Product                        | Positioning                        | Standout features (reported)                                                                                                                                                            | Implication for AFK                                                                       |
| ------------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Cursor**                     | Agentic IDE (VS Code fork)         | Composer/agents, plan/debug modes, MCP, cloud agents, indexing, enterprise data controls ([cursor.com](https://cursor.com/))                                                            | Parity via **orchestration UX** (planning, MCP-in-container, review), not embedded editor |
| **Windsurf (Codeium)**         | Agentic IDE / Cascade              | Cascade agent, flow indexing, memories, MCP, terminal integration ([windsurf.com](https://windsurf.com/))                                                                               | “Memories” → skills + repo docs; keep isolation story central                             |
| **Cline**                      | VS Code extension, OSS             | Plan/Act, checkpoints, MCP marketplace, browser/computer-use, subagents ([VS Marketplace](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev))                  | Checkpoints and approval UX are strong references; marketplace → curated skills           |
| **Continue**                   | OSS IDE assistant                  | MCP config, agent mode, hub/secrets patterns ([continue.dev](https://www.continue.dev/), [MCP docs](https://docs.continue.dev/customize/deep-dives/mcp))                                | Interop: similar MCP shapes if AFK exposes tools                                          |
| **Aider**                      | Terminal pair programmer           | Git-native commits/undo, repo map, multi-file edits ([github.com/Aider-AI/aider](https://github.com/Aider-AI/aider))                                                                    | Validates auto-commit + undo patterns for trust                                           |
| **OpenHands**                  | OSS agentic dev environment        | Docker sandbox, `DockerWorkspace`, event-driven agent server, optional VNC/browser ([OpenHands Docker sandbox docs](https://docs.openhands.dev/sdk/guides/agent-server/docker-sandbox)) | Closest architectural kin; differentiate on DX polish + CLI-agent constraint              |
| **SWE-agent / mini-swe-agent** | Research + OSS agents              | Agent-computer interface, bash-forward tools, benchmarks ([swe-agent.com](https://swe-agent.com/), [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent))                       | Inform tool schemas and test loops; not a product UX template                             |
| **Devika**                     | OSS “agentic engineer” (2024 wave) | Planning, browser module, multi-model ([github.com/stitionai/devika](https://github.com/stitionai/devika))                                                                              | **LOW confidence** on maintenance pace — use for feature ideas, not dependency            |

## Sources

- AFK: [.planning/PROJECT.md](../PROJECT.md), [.planning/codebase/ARCHITECTURE.md](../codebase/ARCHITECTURE.md)
- OpenHands — Docker sandbox (official): [docs.openhands.dev/sdk/guides/agent-server/docker-sandbox](https://docs.openhands.dev/sdk/guides/agent-server/docker-sandbox)
- Cursor — product overview: [cursor.com](https://cursor.com/)
- Windsurf — product: [windsurf.com](https://windsurf.com/)
- Cline — VS Marketplace listing: [marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev)
- Continue — MCP documentation: [docs.continue.dev/customize/deep-dives/mcp](https://docs.continue.dev/customize/deep-dives/mcp)
- Aider — repository: [github.com/Aider-AI/aider](https://github.com/Aider-AI/aider)
- SWE-agent — documentation: [swe-agent.com](https://swe-agent.com/)
- Coder — agent boundaries (security narrative): [coder.com/blog/launch-dec-2025-agent-boundaries](https://coder.com/blog/launch-dec-2025-agent-boundaries)
- Devika — repository: [github.com/stitionai/devika](https://github.com/stitionai/devika)

---

_Feature research for: secure agentic coding platform_  
_Researched: 2026-04-10_
