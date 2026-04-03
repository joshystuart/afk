---
source: RchGrav/claudebox
kind: pull_request
number: 54
state: closed
draft: true
merged: false
url: https://github.com/RchGrav/claudebox/pull/54
author: jonaswre
head: feature/dynamic-profiles
base: main
created_at: 2025-08-26T19:54:11Z
updated_at: 2025-09-08T06:17:33Z
---

# feat: Add dynamic profile system for ClaudeBox

- Migrate all 20 hardcoded profiles to standalone scripts in /workspace/tooling/profiles/
- Create dynamic loader functions that scan directories for profile scripts
- Add support for user custom profiles in ~/.claudebox/profiles/
- Implement new profile management commands:
  - claudebox profile create - Create custom profile from template
  - claudebox profile install - Install profile from file or URL
- Add profile template at templates/profile.template.sh
- Maintain backward compatibility with legacy function wrappers
- Each profile script supports standard commands: info, packages, dockerfile, depends
- Enhanced profiles listing shows system vs user profiles separately
- Add security checks when installing external profiles
- Implement automatic dependency resolution via &#39;depends&#39; command

This change allows users to add custom profiles without modifying ClaudeBox core code, making the system fully extensible while preserving all existing functionality.

## Summary by Sourcery

Add a dynamic profile system to replace hardcoded profiles and enable extensibility

New Features:

- Load profile scripts dynamically from system and user directories
- Allow users to create and install custom profiles via new CLI commands
- Provide a profile template for easy custom profile creation

Enhancements:

- Maintain backward compatibility with legacy profile functions
- Separate system and user profiles in listing output
- Automatically resolve profile dependencies during expansion

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: feat: Add dynamic profile system for ClaudeBox
