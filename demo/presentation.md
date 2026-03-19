# AFK Demo

## Sessions + Scheduled Jobs

### Goal

Show the difference between:

- **Sessions**: interactive Claude workspaces with persistent chat and terminal access
- **Jobs**: automated scheduled Claude runs against a repo, with history and optional commit/push

---

## 1. What AFK Is

AFK lets you run Claude Code in isolated Docker environments in two modes:

- **Session**: long-lived interactive workspace
- **Job**: repeatable automated run on a schedule

Use **sessions** when you want to explore, debug, and iterate.

Use **jobs** when you want recurring repo automation without manual effort.

---

## 2. Sessions vs Jobs

### Sessions

- Persistent chat history
- Web terminal access
- Good for exploration, debugging, and implementation
- Human stays in the loop

### Jobs

- Prompt is saved once and rerun automatically
- Runs in an ephemeral container
- Keeps run history and output
- Can optionally create a branch and commit/push changes

Simple summary:

- **Session = interactive collaborator**
- **Job = automated recurring worker**

---

## 3. Running Order

### 0:00-1:00 Intro

- Explain AFK at a high level
- Set up the key distinction: sessions vs jobs

### 1:00-4:00 Session Demo

- Open or create a session
- Show the repo, chat pane, and terminal access
- Run one strong interactive prompt
- Ask one follow-up question live to show persistence and iteration

### 4:00-8:00 Job Demo

- Go to Scheduled Jobs
- Open an existing job or create one quickly
- Show the saved prompt, schedule, and options
- Trigger **Run Now**
- Show run history and output
- If available, show branch creation or auto-commit behavior

### 8:00-10:00 Wrap Up

- Re-state when to use sessions vs jobs
- Give 2-3 practical examples for each
- End on the automation angle

---

## 4. Session Prompt

Use: `demo/session-onboarding.md`

Why it works:

- Shows repo awareness fast
- Gives you a natural follow-up question
- Feels interactive, not scripted

Recommended live follow-up:

```text
Now narrow that down: what are the top 3 areas most likely to break during future changes, and why?
```

---

## 5. Job Prompt

Use: `demo/security.md`

Suggested schedule:

```text
*/5 * * * *
```

Why it works:

- Easy to explain
- Clearly useful
- Produces a visible artifact
- Good example of automation vs interaction

---

## 6. Backup Job Prompt

Use: `demo/engineering-health.md`

Suggested schedule:

```text
0 8 * * 1-5
```

Why it works:

- Less likely to be controversial than security findings
- Easy for an audience to understand
- Produces a concise report and next steps

---

## 7. Presenter Notes

Good one-liners to say out loud:

- "A session is where I work with Claude."
- "A job is where Claude works for me on a schedule."
- "Same isolated environment, different workflow."
- "Interactive for exploration, automated for maintenance."

---

## 8. Recommended Demo Story

1. Start with a **session**
2. Ask Claude to explain the repo and scheduled jobs architecture
3. Ask one follow-up question live
4. Switch to **jobs**
5. Show the saved security audit prompt
6. Trigger a run manually
7. Open the run output/history
8. Close by explaining when you would use each mode
