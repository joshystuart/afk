---
source: RchGrav/claudebox
kind: issue
number: 28
state: open
url: https://github.com/RchGrav/claudebox/issues/28
author: benp-mns
created_at: 2025-07-04
---

# macOS doesn't have sha256sum

Linux scripts often call `sha256sum`. On macOS, that binary is typically absent; checksums use `shasum -a 256` (or OpenSSL) instead.

**Fix direction:** Prefer a portable check (e.g. `shasum` on Darwin, `sha256sum` on Linux) or a small Python one-liner.

---

## AFK Relevance

| Field                 | Value                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Category**          | bash_compat                                                                                                         |
| **Theme key**         | bash_compat                                                                                                         |
| **Short description** | Install and verify scripts should use cross-platform hashing so macOS users are not blocked by missing `sha256sum`. |
