---
source: RchGrav/claudebox
kind: pull_request
number: 47
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/47
author: sndsgd
head: fix-issue-45
base: main
created_at: 2025-08-17T00:17:33Z
updated_at: 2025-08-18T11:37:11Z
---

# Fix issue #45

See: https://github.com/RchGrav/claudebox/issues/45

### What

The dockerfile string replacement for `PROFILE_INSTALLATIONS` isn&#39;t working for me:

```
$ claudebox add go
Profile: /home/...
Adding profiles: go
All active profiles: go

The Docker image will be rebuilt with new profiles on next run.
```

```
$ claudebox
Detected changes in Docker build files, rebuilding...
Running docker build...
Forcing full rebuild (templates changed)
[+] Building 0.4s (6/9)                                                                                                                                                        docker:default
 =&gt; [internal] load build definition from Dockerfile                                                                                                                                     0.0s
 =&gt; =&gt; transferring dockerfile: 986B                                                                                                                                                     0.0s
 =&gt; [internal] load metadata for docker.io/library/claudebox-core:latest                                                                                                                 0.0s
 =&gt; [internal] load .dockerignore                                                                                                                                                        0.0s
 =&gt; =&gt; transferring context: 444B                                                                                                                                                        0.0s
 =&gt; CACHED [1/5] FROM docker.io/library/claudebox-core:latest                                                                                                                            0.0s
 =&gt; [internal] load build context                                                                                                                                                        0.0s
 =&gt; =&gt; transferring context: 15.58kB                                                                                                                                                     0.0s
 =&gt; ERROR [2/5] RUN wget -O go.tar.gz https://golang.org/dl/go1.21.0.linux-amd64.tar.gz {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}}     tar -C /usr/local -xzf go.tar.gz {{PROFI  0.4s
------
 &gt; [2/5] RUN wget -O go.tar.gz https://golang.org/dl/go1.21.0.linux-amd64.tar.gz {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}}     tar -C /usr/local -xzf go.tar.gz {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}}     rm go.tar.gz:
0.282 wget: invalid option -- &#39;C&#39;
0.282 wget: invalid option -- &#39;z&#39;
0.282 wget: invalid option -- &#39;f&#39;
0.282 Usage: wget [OPTION]... [URL]...
0.282
0.282 Try `wget --help&#39; for more options.
------
Dockerfile:8
--------------------
   7 |     #
   8 | &gt;&gt;&gt; RUN wget -O go.tar.gz https://golang.org/dl/go1.21.0.linux-amd64.tar.gz {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} \
   9 | &gt;&gt;&gt;     tar -C /usr/local -xzf go.tar.gz {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} \
  10 | &gt;&gt;&gt;     rm go.tar.gz
  11 |     ENV PATH=&#34;/usr/local/go/bin:$PATH&#34;
--------------------
ERROR: failed to build: failed to solve: process &#34;/bin/sh -c wget -O go.tar.gz https://golang.org/dl/go1.21.0.linux-amd64.tar.gz {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}}     tar -C /usr/local -xzf go.tar.gz {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}}     rm go.tar.gz&#34; did not complete successfully: exit code: 2
```

### Test

Using `claudebox add go` and then `claudebox` fails against `main`. It successfully builds the dockerfile against this branch.

I also tested with multiple profiles (`go` and `c`), and that built fine as well.

## Summary by Sourcery

Ensure Dockerfile placeholders PROFILE_INSTALLATIONS and LABELS are correctly replaced during image build by switching to CR-stripped, line-based awk substitutions with error detection and optional debug output

Bug Fixes:

- Fix PROFILE_INSTALLATIONS and LABELS placeholder substitution in Dockerfile by stripping CR characters and using awk for whole-line replacement
- Add guard in main.sh to error out if unreplaced placeholders remain in the generated Dockerfile
- Uncomment placeholder lines in build/Dockerfile template to match the new replacement logic

Enhancements:

- Add verbose debug logging for injected profile installations and labels content when VERBOSE is enabled

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: Fix issue #45
