---
source: RchGrav/claudebox
kind: issue
number: 93
state: open
url: https://github.com/RchGrav/claudebox/issues/93
author: wojtess
comments: 0
created_at: 2025-12-28T23:36:20Z
updated_at: 2025-12-28T23:36:20Z
---

# Undocumented &#34;slots&#34; and outdated readme

The ClaudeBox README describes a simple workflow:

```
  claudebox                    # Launch Claude Code
  claudebox profile python ml   # Install profiles
```

But in reality, there&#39;s an entire &#34;slots&#34; system that&#39;s not mentioned in the README.

When running claudebox for the first time, users get:

```
  No available slots found

  To continue, you&#39;ll need an available container slot.

    claudebox create  - Create a new slot
    claudebox slots   - View existing slots
```

Only after running claudebox create can you actually launch a slot with claudebox slot 1.

The Problem

The README has no mention of:

- What slots are
- Why they exist
- How to create them
- The claudebox create command
- The claudebox slots command
- The claudebox slot command
- Managing multiple slots (claudebox revoke)

Expected Behavior

The README should have a section explaining:

1. What the slots system is for
2. How to create your first slot
3. How to launch a specific slot
4. How to manage multiple slots
5. Example workflow showing the complete process

Proposed Fix

Add a &#34;Slots System&#34; section to the README with:

```
  # First time setup - create a slot
  claudebox create

  # Launch the slot
  claudebox slot 1

  # Or list all slots
  claudebox slots

  # Remove a slot when done
  claudebox revoke
```

And explain what slots are for.

User Impact

New users cannot use ClaudeBox at all without discovering this system through trial and error, because the basic
claudebox command fails with &#34;No available slots found&#34; and the README doesn&#39;t explain why.

## AFK planning summary

- **Category**: Slots lifecycle & onboarding (“no slots”, docs)
- **Theme key**: `slots_ux`
- **Short description**: Undocumented &#34;slots&#34; and outdated readme — Users hit “no available slots” or confusion about creating/listing slots; README gaps.
