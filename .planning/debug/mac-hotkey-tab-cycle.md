---
status: diagnosed
trigger: 'Ctrl+` hotkey to cycle session tabs does not work on macOS'
created: 2026-04-17T10:00:00Z
updated: 2026-04-17T10:15:00Z
---

## Current Focus

hypothesis: "Binding literal 'ctrl+`' only matches ControlKey; macOS users press ⌘+` which sets metaKey, not ctrlKey, so the matcher short-circuits to false"
test: "Read react-hotkeys-hook 5.2.4 match logic; confirm 'ctrl' vs 'mod' vs 'meta' semantics; compare against existing codebase patterns"
expecting: "Library treats ctrl as literal Control only; mod is the cross-platform alias that accepts either metaKey or ctrlKey"
next_action: "Root cause confirmed — return diagnosis for /gsd-plan-phase --gaps"

## Symptoms

expected: "Pressing Ctrl+` (or platform equivalent) cycles active tab through chat → terminal → files → chat on all platforms (Mac, Windows, Linux)"
actual: "On macOS the hotkey doesn't fire. User reported: 'this isnt working for me. Im on a mac, would it be command+` ?'"
errors: "None (silent failure — no console error, hotkey handler simply never invoked)"
reproduction: "Open http://localhost:5173/sessions/:id on macOS. Focus the session page. Press Ctrl+` → nothing. Press ⌘+` → either nothing or macOS window cycle."
started: "Phase 03 Plan 02 (commit dd76e02) — added Files tab and expanded tabCycle from 2 to 3 entries"

## Eliminated

(none — single-hypothesis investigation with strong evidence)

## Evidence

- timestamp: 2026-04-17T10:05:00Z
  checked: "web/package.json dependencies"
  found: "react-hotkeys-hook ^5.2.4 installed; verified via web/node_modules/react-hotkeys-hook/package.json"
  implication: "v5.x modifier semantics apply — including 'mod' as a documented cross-platform alias"

- timestamp: 2026-04-17T10:06:00Z
  checked: "web/src/pages/SessionDetails.tsx:166-176"
  found: "useHotkeys('ctrl+`', handler, { enableOnFormTags: true, enableOnContentEditable: true }) — literal 'ctrl' modifier, no meta/mod alternative registered"
  implication: "Binding only responds to Control key press, never to Command"

- timestamp: 2026-04-17T10:08:00Z
  checked: "web/node_modules/react-hotkeys-hook/dist/index.js recognized modifier list (line 3)"
  found: "const j = ['shift', 'alt', 'meta', 'mod', 'ctrl', 'control'] — six modifier tokens supported"
  implication: "'mod' and 'meta' are both available; developer chose literal 'ctrl'"

- timestamp: 2026-04-17T10:10:00Z
  checked: "react-hotkeys-hook match logic dist/index.js lines 117-131 (matchesHotkey function)"
  found: |
  const { alt: i, meta: c, mod: a, shift: n, ctrl: y, keys: u } = r
  const { ctrlKey: d, metaKey: m, ... } = e
  if (a) { // <-- 'mod' branch
  if (!m && !d) return !1 // accepts metaKey OR ctrlKey
  } else if (c !== m && p !== "meta" && p !== "os"
  || y !== d && p !== "ctrl" && p !== "control") return !1
  implication: |
  With binding 'ctrl+`' → y=true, a=false, c=false. Matcher requires ctrlKey===true.
On macOS, ⌘+` produces metaKey=true, ctrlKey=false → y (true) !== d (false) → return false.
  Using 'mod+`' would set a=true → accepts EITHER metaKey OR ctrlKey → works cross-platform.

- timestamp: 2026-04-17T10:11:00Z
  checked: "Existing useHotkeys usage across web/src (cross-platform reference pattern)"
  found: "Only other call is web/src/components/chat/ChatInput.tsx:90 using 'shift+tab' — no cross-platform precedent set yet"
  implication: "No prior pattern to conform to; free to introduce 'mod' as the canonical platform-aware modifier"

- timestamp: 2026-04-17T10:13:00Z
  checked: "macOS system shortcut reservation for ⌘+`"
found: "⌘+` is the standard macOS system shortcut 'Move focus to next window of active application' (System Settings → Keyboard → Keyboard Shortcuts → Keyboard → Move focus to next window). When the browser has only one window, the OS still consumes the event in many configurations, though with multiple windows JS often still sees it."
  implication: |
  'mod+`' will work on Win/Linux reliably. On macOS it MAY be intercepted by the OS in some setups.
  Safer: register multiple accelerators or pick a non-reserved combo. Dual-register 'mod+`' AND a
  Mac-friendly alternative (e.g. 'ctrl+tab' or 'mod+shift+]') via comma-separated keys string.

- timestamp: 2026-04-17T10:14:00Z
  checked: "react-hotkeys-hook docs — modifier semantics"
  found: |
  Per library README and parseHotkey implementation:
  - 'ctrl' / 'control' → ctrlKey === true literally
  - 'meta' → metaKey === true literally (⌘ on Mac, Win key on Windows)
  - 'mod' → ctrlKey === true OR metaKey === true (platform-aware shortcut modifier)
    implication: "'mod' is the idiomatic fix. Supports both single binding 'mod+`' and multi-binding 'ctrl+`,meta+`' via comma delimiter."

## Resolution

root_cause: |
The hotkey registration at web/src/pages/SessionDetails.tsx:167 uses the literal token 'ctrl'
in the binding 'ctrl+`'. In react-hotkeys-hook v5.2.4 (and all v4+ versions), 'ctrl' maps
  exclusively to the keyboard's Control key (event.ctrlKey). It does NOT alias to Command on
  macOS. The library provides a dedicated cross-platform modifier — 'mod' — which matches
  either ctrlKey or metaKey (verified in dist/index.js:125-127). Because Mac users reach for
  ⌘ by muscle memory (confirmed by the reporter's message "Im on a mac, would it be command+`?"),
the hotkey never fires on macOS for the vast majority of users. The literal Ctrl+` combination
would technically still work on a Mac, but it is not the platform-idiomatic input and is not
what the UAT test (or any Mac user) will try.

fix: |
(Empty — diagnose-only mode. See Suggested Fix Direction below.)

verification: |
(Empty — diagnose-only mode.)

files_changed: []
