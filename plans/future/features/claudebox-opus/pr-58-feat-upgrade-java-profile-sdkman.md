---
source: RchGrav/claudebox
kind: pull_request
number: 58
state: merged
url: https://github.com/RchGrav/claudebox/pull/58
author: cowwoc
created_at: 2025-08-27
---

# feat: Upgrade Java profile to SDKMan

Migrates the Java profile to install and manage JDKs via SDKMAN, supporting current LTS releases and simpler version switching. This replaces brittle manual tarball or default-package installs for Java-heavy projects.

---

## AFK Relevance

| Field                 | Value                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Java / JVM tooling                                                                                                                                    |
| **Theme key**         | java_tooling                                                                                                                                          |
| **Short description** | Reliable JDK provisioning in containers matters for Java sessions; SDKMAN-style profiles inform how AFK might pin or expose JVM versions per session. |
