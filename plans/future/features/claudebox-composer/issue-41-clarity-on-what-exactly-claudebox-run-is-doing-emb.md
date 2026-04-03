---
source: RchGrav/claudebox
kind: issue
number: 41
state: open
url: https://github.com/RchGrav/claudebox/issues/41
author: the-vampiire
comments: 2
created_at: 2025-08-07T19:58:26Z
updated_at: 2025-08-14T21:16:58Z
---

# clarity on what exactly claudebox.run is doing (embedded binary), overall build process using hidden / opaque files

this looks like an amazing project and a lot of effort has clearly been put into it. but the installation process is opaque and thats concerning for running an installer script.

i went to releases and pulled `claudebox.run` this is the file contents:

<img width="1027" height="1245" alt="Image" src="https://github.com/user-attachments/assets/451e806b-c37d-46a9-9781-b76a25f130fe"/>

it would go a long way to have some transparency around what this binary &#34;archive&#34; is in the script and why its there in the first place.

it did at least give me a pointer to `main.sh` (unclear why this wrapper script is needed aside from embedding the binary).

however, in `main.sh` there are references to files i cant find anywhere in the repo. as an example, the `profiles.ini` which drives the templating for profile images. its important to understand what is being installed, even in a container. it would also be helpful to know how to extend this with custom profiles.

i hope I’m not asking too much, and I’m not suggesting the project is malicious. i would be happy to contribute to documentation and transparency if you can help clarify whats going on here.

## AFK planning summary

- **Category**: Docs, installer transparency, onboarding clarity
- **Theme key**: `docs_transparency`
- **Short description**: clarity on what exactly claudebox.run is doing (embedded binary), overall build process using hidden / opaque files — Explain installer/self-extracting bundle and how profiles are built.
