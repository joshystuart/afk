---
source: RchGrav/claudebox
kind: pull_request
number: 55
state: open
url: https://github.com/RchGrav/claudebox/pull/55
author: fletchgqc
created_at: 2025-08-27
---

# Fix awk newline error adding Java profile

Fixes an `awk` error caused by newline characters inside substitution strings when adding the Java profile during image generation. Without this, profile injection can fail mid-build and block Java-based workflows.

---

## AFK Relevance

| Field                 | Value                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker / image build                                                                                                                                    |
| **Theme key**         | docker_build                                                                                                                                            |
| **Short description** | Robust Dockerfile/profile templating is required for reliable automated builds—directly relevant if AFK generates or patches similar layer definitions. |
