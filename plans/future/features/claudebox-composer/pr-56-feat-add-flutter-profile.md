---
source: RchGrav/claudebox
kind: pull_request
number: 56
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/56
author: prateekmedia
head: add-flutter
base: main
created_at: 2025-08-27T11:16:05Z
updated_at: 2025-08-31T01:14:07Z
---

# feat: add flutter profile

Adds flutter as a profile, default to stable flutter version but can be modified when initializing claudebox:
`FLUTTER_SDK_VERSION=beta claudebox`

I would&#39;ve want a variable in profile to manage this better so people can do:
`claudebox add flutter --version=beta`

But current there is no syntax like that so used an environment variable instead.

## Summary by Sourcery

Introduce a flutter profile to claudebox that installs Flutter using fvm, defaulting to the stable channel with version overrides via an environment variable, and update configuration, help commands, and documentation accordingly.

New Features:

- Add flutter development profile installed via fvm

Enhancements:

- Allow customizing Flutter SDK version via FLUTTER_SDK_VERSION environment variable

Documentation:

- Update README and CLI help outputs to include flutter profile
- Add flutter help section in tools-report

## AFK planning summary

- **Category**: Extra profiles, uninstall, Homebrew, agents, mobile, routers
- **Theme key**: `ecosystem_bundling`
- **Short description**: feat: add flutter profile
