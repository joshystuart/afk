---
source: RchGrav/claudebox
kind: issue
number: 48
state: open
url: https://github.com/RchGrav/claudebox/issues/48
author: cowwoc
created_at: 2025-08-17T00:00:00Z
---

# Support multiple JDK versions

The **Java profile** ships a fixed JDK (e.g. **17**), but projects need **newer JDKs** (e.g. **24**). Users want selectable or multiple installed JDKs (e.g. via SDKMAN, jenv, or build args) without maintaining a fork of the profile.

## AFK Relevance

| Field                 | Value                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Category**          | Java tooling                                                                                                     |
| **Theme key**         | `java_tooling`                                                                                                   |
| **Short description** | Container images that pin one JDK force friction; AFK dev images may need the same flexibility for JVM projects. |
