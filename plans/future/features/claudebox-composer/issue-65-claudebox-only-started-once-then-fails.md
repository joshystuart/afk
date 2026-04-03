---
source: RchGrav/claudebox
kind: issue
number: 65
state: open
url: https://github.com/RchGrav/claudebox/issues/65
author: gohrner
comments: 5
created_at: 2025-09-07T17:36:43Z
updated_at: 2025-10-15T13:14:21Z
---

# ClaudeBox only started once, then fails

```bash
$ claudebox
/usr/local/bin/docker-entrypoint: line 141: local: can only be used in a function
```

**Expectation:** Entering `claudebox` in the project directory starts ClaudeBox with a `claude` instance inside.

Host: Ubuntu 22.04 on x64.

After `claudebox create`, it once started and I could couple `claude` with my account.

I exited ClaudeBox and ran `claudebox help`, which already showed an error message (see the very last line):

```
$ claudebox help


█▀▀ █   ▄▀█ █ █ █▀▄ █▀▀ █▄▄ █▀█ ▀▄▀
█▄▄ █▄▄ █▀█ █▄█ █▄▀ ██▄ █▄█ █▄█ █ █

Usage: claudebox [options] [command] [prompt]

Claude Code - starts an interactive session by default, use -p/--print for
non-interactive output

Arguments:
  prompt                                            Your prompt

Options:
  -d, --debug [filter]                              Enable debug mode with optional category filtering (e.g., &#34;api,hooks&#34; or &#34;!statsig,!file&#34;)
  --verbose                                         Override verbose mode setting from config
  -p, --print                                       Print response and exit (useful for pipes). Note: The workspace trust dialog is skipped when Claude is run with the -p mode. Only use this flag in directories you trust.
  --output-format                           Output format (only works with --print): &#34;text&#34; (default), &#34;json&#34; (single result), or &#34;stream-json&#34; (realtime streaming) (choices: &#34;text&#34;, &#34;json&#34;, &#34;stream-json&#34;)
  --input-format                            Input format (only works with --print): &#34;text&#34; (default), or &#34;stream-json&#34; (realtime streaming input) (choices: &#34;text&#34;, &#34;stream-json&#34;)
  --mcp-debug                                       [DEPRECATED. Use --debug instead] Enable MCP debug mode (shows MCP server errors)
  --dangerously-skip-permissions                    Bypass all permission checks. Recommended only for sandboxes with no internet access.
  --replay-user-messages                            Re-emit user messages from stdin back on stdout for acknowledgment (only works with --input-format=stream-json and --output-format=stream-json)
  --allowedTools, --allowed-tools         Comma or space-separated list of tool names to allow (e.g. &#34;Bash(git:*) Edit&#34;)
  --disallowedTools, --disallowed-tools   Comma or space-separated list of tool names to deny (e.g. &#34;Bash(git:*) Edit&#34;)
  --mcp-config                          Load MCP servers from JSON files or strings (space-separated)
  --append-system-prompt                    Append a system prompt to the default system prompt
  --permission-mode                           Permission mode to use for the session (choices: &#34;acceptEdits&#34;, &#34;bypassPermissions&#34;, &#34;default&#34;, &#34;plan&#34;)
  -c, --continue                                    Continue the most recent conversation
  -r, --resume [sessionId]                          Resume a conversation - provide a session ID or interactively select a conversation to resume
  --model                                    Model for the current session. Provide an alias for the latest model (e.g. &#39;sonnet&#39; or &#39;opus&#39;) or a model&#39;s full name (e.g. &#39;claude-sonnet-4-20250514&#39;).
  --fallback-model                           Enable automatic fallback to specified model when default model is overloaded (only works with --print)
  --settings                          Path to a settings JSON file or a JSON string to load additional settings from
  --add-dir                         Additional directories to allow tool access to
  --ide                                             Automatically connect to IDE on startup if exactly one valid IDE is available
  --strict-mcp-config                               Only use MCP servers from --mcp-config, ignoring all other MCP configurations
  --session-id                                Use a specific session ID for the conversation (must be a valid UUID)
  -v, --version                                     Output the version number
  -h, --help                                        Display help for command

Commands:
  config                                            Manage configuration (eg. claude config set -g theme dark)
  mcp                                               Configure and manage MCP servers
  migrate-installer                                 Migrate from global npm installation to local installation
  setup-token                                       Set up a long-lived authentication token (requires Claude subscription)
  doctor                                            Check the health of your Claude Code auto-updater
  update                                            Check for updates and install if available
  install [options] [target]                        Install Claude Code native build. Use [target] to specify version (stable, latest, or specific version)
cp: cannot create regular file &#39;/home/claude/.claudebox//.claude.json&#39;: No such file or directory
```

I then added the `python` profile:

`claudebox add python`

Now any attempt to invoke `claudebox` fails immediately with the message above.

Not sure what I did wrong?

Addendum: `claudebox project clean` or similar - it covers the shell window currently, so I&#39;m not 100% sure - helped and I could restart `claudebox`, but - expectedly - had to run throught the Claude setup process incl. coupling again.

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: ClaudeBox only started once, then fails — Bash 3.2 / `set -u` / `local` misuse / array expansion bugs break install and entrypoints on macOS and strict shells.
