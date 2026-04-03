---
source: RchGrav/claudebox
kind: pull_request
number: 103
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/103
author: shen390s
head: vendors
base: main
created_at: 2026-03-20T15:34:24Z
updated_at: 2026-03-20T15:35:16Z
---

# support 3rd party vendor and fix local can only used in function warning

- Add support 3rd party vendor, by set ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN in environment
- Fix shell warning, local keyword just can used in function in file build/docker-entrypoint line 106

Rongsong

## Summary by Sourcery

Add environment configuration for Anthropic third-party vendor support in the Claudebox Docker container and adjust exported shell functions in the Docker helper script.

New Features:

- Pass ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN environment variables into the Claudebox Docker container to support third-party Anthropic-compatible vendors.

Enhancements:

- Refine the list of exported shell functions in lib/docker.sh to align with current usage.

## AFK planning summary

- **Category**: API base URL, vendors, subscriptions, alternate models
- **Theme key**: `api_routing_auth`
- **Short description**: support 3rd party vendor and fix local can only used in function warning
