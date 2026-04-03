---
source: RchGrav/claudebox
kind: issue
number: 80
state: open
url: https://github.com/RchGrav/claudebox/issues/80
author: jeff-r-skillrev
comments: 1
created_at: 2025-09-26T14:13:35Z
updated_at: 2025-10-03T22:12:08Z
---

# .git is not mounted in claudebox

Hey everyone,

Looking for some guidance. This project is a great idea, because isolating Claude Code (so that it doesn&#39;t go rogue and install a bunch of stuff) is really useful! Thanks for creating this.

There are a few projects I have which use git commands to determine commit hashes for use in the build process (to include a truncation of the hash for support purposes, determining which build is in which environment). As such, a few commands like &#34;npm build&#34; don&#39;t work well in claudebox since it doesn&#39;t see the .git folder of the repo, so the git status, git log, etc do not work.

Is there already support for including this in the volume(s) for the container? If not, how can I contribute and make that an option? Would you be in support of me doing a PR for this?

Thanks again! Super great initiative. 👍🏻👏🏼

## AFK planning summary

- **Category**: Git metadata in container (.git, gitconfig)
- **Theme key**: `git_integration`
- **Short description**: .git is not mounted in claudebox — Mount `.git` and/or `~/.gitconfig` so builds and git-based tooling work.
