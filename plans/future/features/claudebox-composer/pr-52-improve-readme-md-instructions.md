---
source: RchGrav/claudebox
kind: pull_request
number: 52
state: closed
draft: true
merged: false
url: https://github.com/RchGrav/claudebox/pull/52
author: puffo
head: docs/improve-readme-commands
base: main
created_at: 2025-08-19T03:04:55Z
updated_at: 2025-08-19T03:05:54Z
---

# Improve README.md instructions

- **Apply fixes**
- **Fix double slash problem when no project supplied**
- **Remove non-apt packages from devops**
- **Add docker compose plugin to devops**
- **Fix devops profile**
- **Clearer instructions for profiles**

## Summary by Sourcery

Improve documentation and refine the devops profile setup by fixing path issues, removing unsupported packages, adding docker-compose plugin support, and clarifying profile commands in the README

New Features:

- Support installation of the docker-compose plugin in the devops profile
- Introduce explicit `claudebox add` and `claudebox remove` commands in the README for profile management

Bug Fixes:

- Prevent double slashes in paths when no project directory is supplied
- Remove non-apt packages from the devops profile installation

Enhancements:

- Overhaul devops profile logic to configure official apt repositories for Docker, Kubernetes, Helm, and Terraform
- Clean up and standardize indentation across main scripts and config functions

Documentation:

- Update README with new GitHub links, release URLs, and clearer profile add/remove/rebuild instructions

## AFK planning summary

- **Category**: Docs, installer transparency, onboarding clarity
- **Theme key**: `docs_transparency`
- **Short description**: Improve README.md instructions
