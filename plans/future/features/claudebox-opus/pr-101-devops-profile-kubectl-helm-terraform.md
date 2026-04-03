---
source: RchGrav/claudebox
kind: pull_request
number: 101
state: open
url: https://github.com/RchGrav/claudebox/pull/101
author: b00y0h
created_at: 2026-02-12
---

# fix: devops profile fails kubectl/helm/terraform

Corrects the DevOps profile so kubectl, Helm, and Terraform are installed from official upstream repositories rather than expecting unavailable Debian packages. Restores a working cloud-native toolchain inside the profile build.

---

## AFK Relevance

| Field                 | Value                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker / image build                                                                                                             |
| **Theme key**         | docker_build                                                                                                                     |
| **Short description** | Profile correctness defines what users get in a session; AFK’s own stack images must source packages from valid repos similarly. |
