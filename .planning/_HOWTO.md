# GSD SDLC quick reference (AFK)

End-to-end flow for this repo: **discovery → planning → implementation → testing → pull request**. Commands are GSD slash commands in Claude unless noted.

**GSD (Get Shit Done)** is the upstream meta-prompting and spec-driven workflow this project uses. Repository, install, and changelog: [github.com/gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done). Update the CLI periodically: `npx get-shit-done-cc@latest`. In chat, **`/gsd-help`** prints the full upstream command reference (GSD evolves quickly; this file summarizes for AFK).

## Overview

| Stage     | Goal                        | Typical commands / actions                                               |
| --------- | --------------------------- | ------------------------------------------------------------------------ |
| Discovery | Understand the codebase     | `/gsd-map-codebase`, `/gsd-scan`, `/gsd-intel refresh`                   |
| Planning  | Requirements, phases, plans | `/gsd-new-project`, `/gsd-discuss-phase`, `/gsd-plan-phase`              |
| Quick     | Small ad-hoc change         | `/gsd-quick` (see [Small changes](#small-changes-quick-mode))            |
| Coding    | Execute plans with commits  | `/gsd-execute-phase`                                                     |
| Testing   | Automated + human UAT       | Project test scripts, `/gsd-verify-work`, optional `/gsd-validate-phase` |
| PR        | Push and open GitHub PR     | `/gsd-pr-branch` (optional), `/gsd-ship`                                 |

---

## GSD commands (what each is for)

Grouped by role. Arguments like `<n>` are phase numbers; see each workflow for flags (`--wave`, `--full`, etc.).

### Project, codebase, and workspaces

| Command                 | Use for                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `/gsd-new-project`      | Greenfield: questioning → optional research → requirements → roadmap → `.planning/` artifacts.           |
| `/gsd-map-codebase`     | Brownfield: parallel mappers → `.planning/codebase/` (stack, architecture, conventions, concerns, etc.). |
| `/gsd-scan`             | Lighter single-agent codebase pass; optional `--focus` (e.g. concerns).                                  |
| `/gsd-import`           | Ingest an external plan with conflict detection before writing PLAN.md.                                  |
| `/gsd-new-workspace`    | Isolated workspace (worktrees/clones) with its own `.planning/`.                                         |
| `/gsd-list-workspaces`  | List GSD workspaces under `~/gsd-workspaces/`.                                                           |
| `/gsd-remove-workspace` | Tear down a workspace and clean up worktrees.                                                            |

### Phase planning and design

| Command                           | Use for                                                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `/gsd-discuss-phase <n>`          | Capture vision and decisions → CONTEXT.md before planning (optional `--batch`, auto/chain/power modes per GSD). |
| `/gsd-research-phase <n>`         | Standalone ecosystem research → RESEARCH.md (niche domains; planning usually bundles research).                 |
| `/gsd-list-phase-assumptions <n>` | See Claude’s assumed approach before planning (conversation only).                                              |
| `/gsd-plan-phase <n>`             | Executable PLAN.md files + research/plan-check loop (e.g. `--prd`, `--gaps`, `--reviews`).                      |
| `/gsd-ui-phase <n>`               | UI design contract → UI-SPEC.md before implementation-heavy frontend work.                                      |

### Execution and automation

| Command                  | Use for                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `/gsd-execute-phase <n>` | Run all plans in a phase by wave (optional `--wave N`, gap-only variants per GSD).      |
| `/gsd-autonomous`        | Drive remaining phases (or `--from` / `--to` / `--only`) with discuss → plan → execute. |

### Router and quick paths

| Command              | Use for                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/gsd-do <text>`     | Dispatch natural language to the best `/gsd-*` command.                                                                    |
| `/gsd-quick`         | Small ad-hoc work under `.planning/quick/` with atomic commits (flags: `--full`, `--validate`, `--discuss`, `--research`). |
| `/gsd-fast "<text>"` | Trivial inline fix (no PLAN); redirects to quick if too large.                                                             |
| `/gsd-next`          | Inspect STATE/ROADMAP and route to the next sensible step.                                                                 |

### Roadmap and backlog

| Command                               | Use for                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `/gsd-add-phase "<title>"`            | Append a new integer phase to the current milestone.                              |
| `/gsd-insert-phase <after> "<title>"` | Decimal phase (e.g. 7.1) for urgent mid-milestone work.                           |
| `/gsd-remove-phase <n>`               | Remove a **future** unstarted phase and renumber.                                 |
| `/gsd-add-backlog "<title>"`          | Parking-lot item under 999.x numbering (ideas not yet sequenced).                 |
| `/gsd-analyze-dependencies`           | Suggest `Depends on` between phases to reduce merge conflicts when parallelizing. |
| `/gsd-plant-seed "<idea>"`            | Forward-looking idea with triggers; can resurface at `/gsd-new-milestone`.        |

### Milestones

| Command                             | Use for                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `/gsd-new-milestone "<name>"`       | Next milestone cycle on an existing project (optional `--reset-phase-numbers`). |
| `/gsd-complete-milestone <version>` | Archive milestone, tag, MILESTONES.md, prep next version.                       |
| `/gsd-milestone-summary`            | Human-readable summary from milestone artifacts (onboarding).                   |
| `/gsd-plan-milestone-gaps`          | Turn MILESTONE-AUDIT gaps into new roadmap phases.                              |

### Progress, session, and reporting

| Command               | Use for                                                           |
| --------------------- | ----------------------------------------------------------------- |
| `/gsd-progress`       | Progress bar, recent summaries, routing to execute or plan.       |
| `/gsd-resume-work`    | Restore context after a break (pairs with pause handoff).         |
| `/gsd-pause-work`     | Write handoff files for session continuity.                       |
| `/gsd-session-report` | Session summary to `.planning/reports/` (stakeholders / history). |
| `/gsd-stats`          | Phases, plans, requirements, git stats, timeline.                 |

### Workstreams (parallel milestone tracks)

| Command            | Use for                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `/gsd-workstreams` | Defaults to `list`; subcommands: `list`, `create <name>`, `status <name>`, `switch <name>`, `progress`, `complete <name>`, `resume <name>`. |

### Debugging and investigation

| Command                | Use for                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| `/gsd-debug [issue]`   | Structured debug log under `.planning/debug/`; resume with `/gsd-debug`.  |
| `/gsd-diagnose-issues` | Parallel investigation of UAT gaps → root causes for plan-phase `--gaps`. |
| `/gsd-forensics`       | Post-mortem when a GSD workflow fails or stalls (git + `.planning/`).     |

### Notes, todos, and ideation

| Command                   | Use for                                                |
| ------------------------- | ------------------------------------------------------ |
| `/gsd-note <text>`        | Append/list/promote quick notes (optional `--global`). |
| `/gsd-add-todo [text]`    | Structured todo under `.planning/todos/pending/`.      |
| `/gsd-check-todos [area]` | List and pick a todo to work.                          |
| `/gsd-explore`            | Socratic ideation; routes outputs into GSD artifacts.  |

### Testing, verification, security, and UI quality

| Command                   | Use for                                                                        |
| ------------------------- | ------------------------------------------------------------------------------ |
| `/gsd-verify-work <n>`    | Conversational UAT → UAT.md and gap handoff to planning.                       |
| `/gsd-validate-phase <n>` | Nyquist-style validation gaps, tests, VALIDATION.md (gate in `/gsd-settings`). |
| `/gsd-add-tests <n>`      | Generate tests from phase artifacts (classification + approval).               |
| `/gsd-secure-phase <n>`   | Threat mitigations vs PLAN.md → SECURITY.md.                                   |
| `/gsd-ui-review <n>`      | Retroactive 6-pillar visual audit → UI-REVIEW.md.                              |

### Ship, review, and branches

| Command                       | Use for                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `/gsd-ship [n]`               | Push branch, open PR with body from artifacts (needs `gh`).             |
| `/gsd-review --phase <n> ...` | Cross-AI review (Gemini, Claude, Codex, CodeRabbit, etc.) → REVIEWS.md. |
| `/gsd-pr-branch [base]`       | Review-only branch without `.planning/` commit noise.                   |
| `/gsd-code-review <n>`        | Repo review of phase-changed files → REVIEW.md.                         |
| `/gsd-code-review-fix <n>`    | Apply fixes from REVIEW.md with bounded iterations.                     |

### Audits and documentation

| Command                          | Use for                                                               |
| -------------------------------- | --------------------------------------------------------------------- |
| `/gsd-audit-uat`                 | Cross-phase UAT/verification debt before closing a milestone.         |
| `/gsd-audit-milestone [version]` | Milestone vs intent → MILESTONE-AUDIT.md.                             |
| `/gsd-audit-fix`                 | Run an audit (e.g. UAT), auto-fix classified items, test, commit.     |
| `/gsd-docs-update`               | Generate/verify project docs against the codebase (manifest + waves). |

### Configuration and tooling

| Command                      | Use for                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| `/gsd-settings`              | Interactive toggles (researcher, plan checker, verifier, UI/security gates, model profile). |
| `/gsd-set-profile <profile>` | Quick model profile: `quality`, `balanced`, `budget`, `inherit`.                            |
| `/gsd-cleanup`               | Archive old phase dirs into milestone folders.                                              |
| `/gsd-health`                | Integrity check (and optional repair) for `.planning/`.                                     |
| `/gsd-undo`                  | Safe revert of GSD commits (`--last`, `--phase`, `--plan` forms).                           |
| `/gsd-update`                | Update GSD install with changelog.                                                          |
| `/gsd-reapply-patches`       | After update, merge local GSD patches from `gsd-local-patches/`.                            |
| `/gsd-help`                  | Print full command reference from the installed GSD.                                        |
| `/gsd-join-discord`          | Community link / onboarding.                                                                |

### Interactive orchestration and meta

| Command             | Use for                                                                      |
| ------------------- | ---------------------------------------------------------------------------- |
| `/gsd-manager`      | Terminal dashboard: phase status, dispatch discuss/plan/execute in parallel. |
| `/gsd-profile-user` | Consent + session analysis → developer profile artifacts.                    |
| `/gsd-inbox`        | Triage GitHub issues/PRs against contribution templates (if present).        |

_Internal workflows (no user slash command):_ e.g. transition between phase steps is invoked automatically—see upstream docs.

---

## Discovery

**Brownfield (this repo):** Map first so planning focuses on _what you are adding_, not re-describing the whole system.

```bash
/gsd-map-codebase
```

Produces under `.planning/codebase/`:

| File              | What it captures                                 |
| ----------------- | ------------------------------------------------ |
| `STACK.md`        | Languages, frameworks, dependencies, build tools |
| `ARCHITECTURE.md` | Module structure, data flow, entry points        |
| `CONVENTIONS.md`  | Code patterns, naming, file organization         |
| `CONCERNS.md`     | Tech debt, risks, complexity                     |

Lighter option: `/gsd-scan` (single-agent). Focused risk pass: `/gsd-scan --focus concerns`.

**Ongoing lookup:** `/gsd-intel refresh` then queries like `/gsd-intel query auth` so you do not re-read the entire tree for every question.

---

## Planning

**Initialize or extend the milestone:**

```bash
/gsd-new-project
```

If codebase mapping already exists, prompts emphasize **new goals and features** rather than greenfield boilerplate.

**Per phase:**

```bash
/gsd-discuss-phase 1        # preferences, constraints; reduces wrong assumptions
/gsd-plan-phase 1           # research + plan + plan quality checks
```

Use `/gsd-next` to advance when you are not sure what the next planning step is.

**Tips (brownfield):** `/gsd-discuss-phase` is especially valuable so assumptions match NestJS / typed config / Docker patterns here. If your GSD settings use `workflow.discuss_mode: "assumptions"`, GSD surfaces codebase-derived assumptions for you to confirm or correct.

**Keeping `.planning/` out of code review:** During init set `commit_docs: false`, or add `.planning/` to `.gitignore`, if you want artifacts local-only.

---

## Small changes (quick mode)

For **ad-hoc tasks that do not need a full phase** (bugfix, small UI tweak, doc-only change), use [GSD quick mode](https://github.com/gsd-build/get-shit-done#quick-mode) instead of discuss → plan → execute on `ROADMAP.md`:

```bash
/gsd-quick
```

Quick mode keeps **atomic commits** and **state tracking** like phased work, but uses a shorter path: planner + executor, with research / plan-checker / verifier **off by default**. Artifacts live under **`.planning/quick/`** (numbered folders with `PLAN.md`, `SUMMARY.md`), not under `phases/`. Completed quick tasks are also reflected in **`STATE.md`** (“Quick Tasks Completed”), not in the roadmap phase list.

**Optional flags** (composable; same semantics as upstream GSD):

| Flag         | Effect                                                                              |
| ------------ | ----------------------------------------------------------------------------------- |
| `--discuss`  | Light discussion before planning to surface gray areas                              |
| `--research` | Focused research before planning (libraries, approaches, pitfalls)                  |
| `--validate` | Plan-checking plus post-execution verification                                      |
| `--full`     | Full pipeline in quick-task form: discuss + research + plan-checking + verification |

**Capture only (no implementation yet):** `/gsd-add-todo` or `/gsd-add-backlog` to park an idea without running quick mode.

---

## Coding

```bash
/gsd-execute-phase 1        # wave-based parallel execution, atomic commits
```

Follow repo conventions in `AGENTS.md` / `CLAUDE.md` (Nest DI, `nest-typed-config`, no `process.env` in app code, `npm run format` after edits).

---

## Testing

1. **Automated:** run the project’s tests and lint as you go (e.g. server Jest, web Vitest, CI in `.github/workflows/`).
2. **Human UAT:** after implementation is in good shape:

   ```bash
   /gsd-verify-work 1
   ```

3. **Retroactive gap fill (optional):** `/gsd-validate-phase` on a completed phase if you want Nyquist-style verification filled in after the fact.

`/gsd-ship` expects a phase **VERIFICATION** artifact with a passing (or explicitly human-approved) status—see ship preflight in GSD’s ship workflow.

---

## Pull request (ship)

**Prerequisites**

- Git remote **`origin`** pointing at the GitHub repo you want the PR against.
- [GitHub CLI](https://cli.github.com/) (`gh`) installed and logged in: `gh auth login`, `gh auth status`.
- Clean working tree; you should be on a **feature branch**, not the base branch (usually `main`—GSD reads `git.base_branch` from config when set).

**Optional — clean branch without planning-only commits**

If `.planning/` commits would clutter the PR:

```bash
/gsd-pr-branch
```

Creates a review-friendly branch (code-only history per GSD’s pr-branch workflow).

**Create the PR**

```bash
/gsd-ship 1
```

(or milestone-style argument if your GSD init uses that). This pushes the current branch and runs `gh pr create` with a body assembled from roadmap, verification, and phase summaries.

After merge: `/gsd-complete-milestone` when appropriate, `/gsd-progress` for what’s next.

---

## For this project (AFK)

AFK already has NestJS, typed config, Docker-backed sessions, etc. **`/gsd-map-codebase`** (then **`/gsd-new-project`**) steers new work toward **incremental features** without rehashing the whole architecture in every phase.
