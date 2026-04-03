---
source: RchGrav/claudebox
kind: pull_request
number: 98
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/98
author: jmcvetta
head: homebrew
base: main
created_at: 2026-01-29T16:49:20Z
updated_at: 2026-01-29T17:43:03Z
---

# Homebrew support

This PR adds a profile for the [Homebrew](https://brew.sh/) package manager.

## Summary by Sourcery

Add a new Homebrew profile to the configuration system and wire it into the profile registry.

New Features:

- Introduce a Homebrew profile with its own package set and description.
- Provide a profile expansion for Homebrew that composes with the core profile.
- Add a Homebrew-specific profile generator that installs required system packages and Homebrew via its official install script.

Enhancements:

- Extend the exported profile functions list to include the new Homebrew profile handler.

## AFK planning summary

- **Category**: Extra profiles, uninstall, Homebrew, agents, mobile, routers
- **Theme key**: `ecosystem_bundling`
- **Short description**: Homebrew support
