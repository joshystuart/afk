Great question. The user guide has a specific workflow for existing codebases (called the "brownfield workflow"). Here's how it works:

## Brownfield Workflow (Existing Codebase)

The key difference from a greenfield project is that you **map your codebase first** before initializing GSD, so the project setup focuses on what you're _adding_ rather than describing what already exists.

### Step 1: Map the Codebase

```bash
/gsd-map-codebase
```

This launches 4 parallel agents that analyze your existing code and produce:

| File                                 | What it captures                                 |
| ------------------------------------ | ------------------------------------------------ |
| `.planning/codebase/STACK.md`        | Languages, frameworks, dependencies, build tools |
| `.planning/codebase/ARCHITECTURE.md` | Module structure, data flow, entry points        |
| `.planning/codebase/CONVENTIONS.md`  | Code patterns, naming, file organization         |
| `.planning/codebase/CONCERNS.md`     | Tech debt, risks, areas of complexity            |

If you want something lighter, `/gsd-scan` does a single-agent quick assessment instead.

### Step 2: Initialize the Project

```bash
/gsd-new-project
```

Because the codebase mapping already exists, the questions GSD asks will focus on **what you're adding** -- new features, improvements, goals for the next milestone -- rather than asking you to describe the existing system from scratch.

### Step 3: Normal Phase Workflow

From here it's the standard flow:

```bash
/gsd-discuss-phase 1        # Lock in your preferences for phase 1
/gsd-plan-phase 1           # Research + plan + verify
/gsd-execute-phase 1        # Parallel execution with atomic commits
/gsd-verify-work 1          # Manual UAT
/gsd-next                   # Auto-advance to whatever's next
```

### Tips for Existing Projects

- **`/gsd-scan --focus concerns`** is useful if you just want a quick risk/tech-debt assessment before deciding what to work on.
- **`/gsd-intel refresh`** builds a queryable intelligence index so you can later do things like `/gsd-intel query auth` to look up how auth works without re-reading the whole codebase.
- **`/gsd-discuss-phase`** is especially valuable on brownfield projects because it prevents Claude from making wrong assumptions about your existing patterns. The "assumptions" discuss mode (`workflow.discuss_mode: "assumptions"` in settings) is particularly good here -- GSD reads your codebase first and presents its assumptions for you to confirm/correct rather than asking open-ended questions.
- If you want planning artifacts to stay local and not be committed, set `commit_docs: false` during project init or add `.planning/` to `.gitignore`.

### For This Project (AFK)

Since AFK already has established NestJS patterns, typed config, Docker-based sessions, etc., the brownfield workflow would pick all of that up during `/gsd-map-codebase` and then `/gsd-new-project` would ask you about what you want to build next rather than rehashing the existing architecture.
