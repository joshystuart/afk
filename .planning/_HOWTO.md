# GSD SDLC quick reference (AFK)

End-to-end flow for this repo: **discovery → planning → implementation → testing → pull request**. Commands are GSD slash commands in Claude unless noted.

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

Upstream reference: [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done).

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
