---
source: RchGrav/claudebox
kind: issue
number: 91
state: open
url: https://github.com/RchGrav/claudebox/issues/91
author: noahwhite
comments: 2
created_at: 2025-12-10T01:31:05Z
updated_at: 2026-01-27T03:00:39Z
---

# Unable to rebuild container after adding profiles

This is probably operator error but here is an example run where you can see the issue I am running into:

&gt; ╰─ claudebox add core devops java shell
&gt; Profile: /home/foo/dev/github/foobar/bizbar-stack
&gt; Adding profiles: core devops java shell
&gt; All active profiles: core devops java shell
&gt;
&gt; The Docker image will be rebuilt with new profiles on next run.
&gt;  
&gt; ─ claudebox
&gt; Detected changes in Docker build files, rebuilding...
&gt; Running docker build...
&gt; [+] Building 0.3s (6/12) docker:default
&gt; =&gt; [internal] load build definition from Dockerfile 0.0s
&gt; =&gt; =&gt; transferring dockerfile: 1.55kB 0.0s
&gt; =&gt; [internal] load metadata for docker.io/library/claudebox-core:latest 0.0s
&gt; =&gt; [internal] load .dockerignore 0.0s
&gt; =&gt; =&gt; transferring context: 444B 0.0s
&gt; =&gt; CACHED [1/8] FROM docker.io/library/claudebox-core:latest@sha256:5b2b8b16f05b669ed9ebcada294b4f9105034dd1ceaf2f9e068a0c51a1bb9 0.0s
&gt; =&gt; =&gt; resolve docker.io/library/claudebox-core:latest@sha256:5b2b8b16f05b669ed9ebcada294b4f9105034dd1ceaf2f9e068a0c51a1bb9068 0.0s
&gt; =&gt; [internal] load build context 0.0s
&gt; =&gt; =&gt; transferring context: 15.58kB 0.0s
&gt; =&gt; ERROR [2/8] RUN apt-get update {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get install -y gcc g++ make git pkg-conf 0.1s
&gt; ------
&gt; &gt; [2/8] RUN apt-get update {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get install -y gcc g++ make git pkg-config libssl-dev libffi-dev zlib1g-dev tmux {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get clean:
&gt; 0.106 E: The update command takes no arguments
&gt; ------
&gt; Dockerfile:8
&gt; --------------------
&gt; 6 |
&gt; 7 | #
&gt; 8 | &gt;&gt;&gt; RUN apt-get update {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get install -y gcc g++ make git pkg-config libssl-dev libffi-dev zlib1g-dev tmux {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get clean
&gt; 9 | RUN apt-get update {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get install -y docker.io docker-compose kubectl helm terraform ansible awscli {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get clean
&gt; 10 | RUN apt-get update {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get install -y openjdk-17-jdk maven gradle ant {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get clean
&gt; --------------------
&gt; ERROR: failed to build: failed to solve: process &#34;/bin/sh -c apt-get update {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get install -y gcc g++ make git pkg-config libssl-dev libffi-dev zlib1g-dev tmux {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get clean&#34; did not complete successfully: exit code: 100
&gt; Docker build failed
&gt;

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: Unable to rebuild container after adding profiles — Dockerfile generation, profile fragments, or `awk` substitution breaks multi-profile or devops installs.
