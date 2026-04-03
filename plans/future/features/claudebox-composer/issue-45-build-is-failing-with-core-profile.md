---
source: RchGrav/claudebox
kind: issue
number: 45
state: closed
url: https://github.com/RchGrav/claudebox/issues/45
author: zhekaby
comments: 1
created_at: 2025-08-14T18:48:18Z
updated_at: 2025-08-27T10:12:36Z
---

# Build is failing with core profile

Installed with Method 1: Self-Extracting Installer

```
# Download the latest release
wget https://github.com/RchGrav/claudebox/releases/latest/download/claudebox.run
chmod +x claudebox.run
./claudebox.run
```

Adding core profiles

```
❯ claudebox add core
Profile: /Users/zhekaby/src/forest
Adding profiles: core
All active profiles: go core

The Docker image will be rebuilt with new profiles on next run.
```

Running claudebox

```
❯ claudebox
Running docker build...
[+] Building 0.2s (6/10)                                                                                                                             docker:desktop-linux
 =&gt; [internal] load build definition from Dockerfile                                                                                                                 0.0s
 =&gt; =&gt; transferring dockerfile: 1.19kB                                                                                                                               0.0s
 =&gt; [internal] load metadata for docker.io/library/claudebox-core:latest                                                                                             0.0s
 =&gt; [internal] load .dockerignore                                                                                                                                    0.0s
 =&gt; =&gt; transferring context: 444B                                                                                                                                    0.0s
 =&gt; CACHED [1/6] FROM docker.io/library/claudebox-core:latest                                                                                                        0.0s
 =&gt; [internal] load build context                                                                                                                                    0.0s
 =&gt; =&gt; transferring context: 15.58kB                                                                                                                                 0.0s
 =&gt; ERROR [2/6] RUN wget -O go.tar.gz https://golang.org/dl/go1.21.0.linux-amd64.tar.gz {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}}     tar -C /usr/local -x  0.1s
------
 &gt; [2/6] RUN wget -O go.tar.gz https://golang.org/dl/go1.21.0.linux-amd64.tar.gz {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}}     tar -C /usr/local -xzf go.tar.gz {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}}     rm go.tar.gz:
0.108 wget: invalid option -- &#39;C&#39;
0.108 wget: invalid option -- &#39;z&#39;
0.108 wget: invalid option -- &#39;f&#39;
0.108 Usage: wget [OPTION]... [URL]...
0.108
0.108 Try `wget --help&#39; for more options.
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

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/qo2iw27d8e8uh9toke47w93h8
Docker build failed
```

For some reason placeholders `{{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}}` are not being replaced with correct values.

      System Version: macOS 15.6 (24G84)
      Kernel Version: Darwin 24.6.0

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: Build is failing with core profile — Dockerfile generation, profile fragments, or `awk` substitution breaks multi-profile or devops installs.
