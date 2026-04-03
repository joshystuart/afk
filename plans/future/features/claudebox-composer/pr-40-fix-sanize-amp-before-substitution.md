---
source: RchGrav/claudebox
kind: pull_request
number: 40
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/40
author: deas
head: fix-sanitize
base: main
created_at: 2025-08-06T16:19:38Z
updated_at: 2025-08-18T07:28:08Z
---

# fix: Sanize &amp; before substitution

Adding any profile with a literal `&amp;&amp;`, I run into an error:

```
&gt; claudebox add php
&gt; claudebox
....
 =&gt; ERROR [2/5] RUN apt-get update {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get install -y php php-cli php-fpm php-mysql php-pgsql php-  0.2s
------
 &gt; [2/5] RUN apt-get update {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get install -y php php-cli php-fpm php-mysql php-pgsql php-sqlite3 php-curl php-gd php-mbstring php-xml php-zip composer {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get clean:
0.104 E: The update command takes no arguments
------
Dockerfile:8
--------------------
   6 |
   7 |     #
   8 | &gt;&gt;&gt; RUN apt-get update {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get install -y php php-cli php-fpm php-mysql php-pgsql php-sqlite3 php-curl php-gd php-mbstring php-xml php-zip composer {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get clean
   9 |
  10 |     #
--------------------
...
```

This patch fixes that for me.

As a sidenote, it appears packages are not honored a the moment, e.g.:

```
claudbox install htop
```

adds an entry to `profile.ini`, but does not yet install the package to the container.

## Summary by Sourcery

Bug Fixes:

- Escape backslashes and ampersands in profile_installations before substituting into the Dockerfile template to prevent invalid Dockerfile RUN commands

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: fix: Sanize &amp; before substitution
