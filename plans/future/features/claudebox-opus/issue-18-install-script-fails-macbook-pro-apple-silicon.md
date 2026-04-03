---
source: RchGrav/claudebox
kind: issue
number: 18
state: closed
url: https://github.com/RchGrav/claudebox/issues/18
author: KiwiParagliding
created_at: 2025-06-20
---

# Install script fails on MacBook Pro Apple Silicon

Install fails on macOS Sonoma with zsh and the system Bash 3.2. Failures relate to array syntax and features not supported in older Bash (e.g. certain array operations or `declare` usage).

**Environment:** Apple Silicon Mac, common default shells on recent macOS.

---

## AFK Relevance

| Field                 | Value                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | bash_compat                                                                                                                                          |
| **Theme key**         | bash_compat                                                                                                                                          |
| **Short description** | Install paths for macOS/Apple Silicon must avoid Bash 4+ features so users on stock Bash 3.2 can install without switching shells or upgrading Bash. |
