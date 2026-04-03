---
source: RchGrav/claudebox
kind: issue
number: 23
state: closed
url: https://github.com/RchGrav/claudebox/issues/23
author: DmitriyRomanov
comments: 1
created_at: 2025-06-24T09:46:00Z
updated_at: 2025-06-27T04:50:34Z
---

# Error chown: invalid group: ‘claude:claude’ during intitial setup

Trying to make local setup on windows wsl2 ubuntu and getting error chown

have added some debug messages and localised the line in claudebox

echo &#34;# Set up project-specific symlinks&#34;
if [ -d /home/DOCKERUSER/.claudebox/$CLAUDEBOX_PROJECT_NAME ]; then # Ensure memory directory is accessible
echo &#34;# Ensure memory directory is accessible&#34;  
 echo &#34;...DOCKERUSER&#34;
mkdir -p /home/DOCKERUSER/.claudebox/$CLAUDEBOX_PROJECT_NAME/memory
    chown -R DOCKERUSER:DOCKERUSER /home/DOCKERUSER/.claudebox/$CLAUDEBOX_PROJECT_NAME
fi

I am running claudebox from my user named &#34;dev&#34;

## AFK planning summary

- **Category**: WSL / root UID / Docker user & group edge cases
- **Theme key**: `platform_wsl_root`
- **Short description**: Error chown: invalid group: ‘claude:claude’ during intitial setup — Host UID/GID edge cases: root on WSL2, macOS group IDs, `chown` failures.
