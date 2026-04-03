---
source: RchGrav/claudebox
kind: pull_request
number: 43
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/43
author: johnhaley81
head: feature/mcp-server-integration
base: main
created_at: 2025-08-12T20:45:31Z
updated_at: 2025-08-18T07:13:54Z
---

# feat: Add native MCP server integration with multi-config support

# Add Native MCP Server Integration with Multi-Config Support

## Summary

Implements comprehensive MCP (Model Context Protocol) server integration for ClaudeBox using Claude Code&#39;s native `--mcp-config` multi-file support. This enables seamless MCP server access within ClaudeBox containers while maintaining security and isolation.

This implementation leverages the new `--mcp-config` flag [introduced in Claude Code v1.0.73](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md#1073) which enables loading multiple MCP configuration files with proper precedence.

## Features Implemented

### ✅ Native Claude Code Integration

- Uses Claude&#39;s official `--mcp-config` option for loading multiple configuration files
- Leverages Claude Code&#39;s built-in configuration hierarchy and merging
- No custom injection scripts - pure native approach

### ✅ Multi-Tier Configuration System

- **User Level**: `~/.claude.json` (lowest priority)
- **Project Shared**: `.claude/settings.json` (medium priority)
- **Project Local**: `.claude/settings.local.json` (highest priority)
- Each scope gets its own config file passed via separate `--mcp-config` arguments

### ✅ Security &amp; Isolation

- Host configurations mounted **read-only** in containers
- Temporary config files created for container use
- No modification of host filesystem possible from containers
- jq-based JSON processing prevents injection vulnerabilities

### ✅ Configuration Priority System

- Claude Code handles merging naturally through multiple `--mcp-config` arguments
- Later configs override earlier ones (project overrides user)
- Clean separation of user vs project scopes

## Technical Implementation

lib/docker.sh extracts MCP servers from host configurations and creates temporary config files:

```bash
# Extract user MCP servers from ~/.claude.json
jq &#39;{mcpServers: .mcpServers}&#39; &#34;$HOME/.claude.json&#34; &gt; &#34;$user_mcp_file&#34;
docker_args+=(-v &#34;$user_mcp_file&#34;:/tmp/user-mcp-config.json:ro)

# Merge project configs (.claude/settings.json + .claude/settings.local.json)
jq -s &#39;.[0].mcpServers * .[1].mcpServers | {mcpServers: .}&#39; ... &gt; &#34;$project_mcp_file&#34;
docker_args+=(-v &#34;$project_mcp_file&#34;:/tmp/project-mcp-config.json:ro)
```

build/docker-entrypoint passes multiple config files to Claude using the native flag:

```bash
# Build array of --mcp-config arguments
mcp_config_args=()
[[ -f &#34;/tmp/user-mcp-config.json&#34; ]] &amp;&amp; mcp_config_args+=(--mcp-config /tmp/user-mcp-config.json)
[[ -f &#34;/tmp/project-mcp-config.json&#34; ]] &amp;&amp; mcp_config_args+=(--mcp-config /tmp/project-mcp-config.json)

# Execute claude with native multi-config support
claude &#34;${mcp_config_args[@]}&#34; &#34;$@&#34;
```

### Configuration Examples

**User-level MCP servers** (`~/.claude.json`):

```json
{
  &#34;mcpServers&#34;: {
    &#34;memory&#34;: {
      &#34;command&#34;: &#34;npx&#34;,
      &#34;args&#34;: [&#34;-y&#34;, &#34;@modelcontextprotocol/server-memory&#34;]
    }
  }
}
```

**Project-specific MCP servers** (`.claude/settings.local.json`):

```json
{
  &#34;mcpServers&#34;: {
    &#34;filesystem&#34;: {
      &#34;command&#34;: &#34;npx&#34;,
      &#34;args&#34;: [&#34;-y&#34;, &#34;@modelcontextprotocol/server-filesystem&#34;, &#34;/workspace&#34;]
    }
  }
}
```

## Benefits

### 🚀 **Seamless Integration**

- MCP servers automatically available in all ClaudeBox containers
- No additional setup required - works with existing Claude Code configurations
- Transparent to existing ClaudeBox workflows

### 🛡️ **Security First**

- Read-only host mounts prevent container modifications
- Isolated temporary files per container instance
- No shell injection vulnerabilities through jq-based parsing

### 📈 **Scalable Architecture**

- Supports unlimited MCP servers across multiple configuration tiers
- Efficient resource usage through temporary file approach
- Clean separation of user and project-specific configurations

## Testing Completed

- ✅ User MCP servers load from `~/.claude.json`
- ✅ Project MCP servers load from `.claude/settings.json` and `.claude/settings.local.json`
- ✅ Configuration priority system works correctly (project overrides user)
- ✅ Temporary config files created and mounted properly
- ✅ Native `--mcp-config` arguments passed to Claude correctly
- ✅ Host configurations remain read-only and unmodified
- ✅ Container isolation maintained
- ✅ Backwards compatible with existing ClaudeBox workflows

## Closes

- Closes johnhaley81/claudebox#1
- Closes RchGrav/claudebox#39

---

This implementation provides robust MCP server integration while maintaining ClaudeBox&#39;s high standards for security, simplicity, and maintainability. The solution is minimal, focused, and leverages existing Claude Code infrastructure rather than reinventing it.

## Summary by Sourcery

Enable native multi-file MCP server integration in ClaudeBox by leveraging Claude Code’s --mcp-config support with a multi-tier config and secure mounting in containers.

New Features:

- Leverage Claude Code’s native --mcp-config flag to load multiple MCP configuration files.
- Introduce a multi-tier configuration system with user, project shared, and project local scopes.
- Integrate MCP servers natively into Docker containers without custom injection scripts.

Enhancements:

- Extract, merge, and mount MCP configs from ~/.claude.json and .claude/settings\*.json with proper precedence.
- Maintain security and isolation through read-only host mounts and isolated temporary config files.
- Update Docker entrypoint to build and pass multiple --mcp-config arguments to Claude.

Build:

- Enhance lib/docker.sh and Docker entrypoint scripts to handle multi-config MCP server mounting.

## AFK planning summary

- **Category**: MCP wiring, cleanup bugs, and discoverability
- **Theme key**: `mcp`
- **Short description**: feat: Add native MCP server integration with multi-config support
