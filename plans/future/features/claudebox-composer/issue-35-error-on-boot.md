---
source: RchGrav/claudebox
kind: issue
number: 35
state: closed
url: https://github.com/RchGrav/claudebox/issues/35
author: pbarker
comments: 2
created_at: 2025-07-21T16:33:27Z
updated_at: 2025-07-25T11:00:29Z
---

# Error on boot

```
 ~/ghq/github.com/agentsea  claudebox                                                                                                                                                                               ok  3.10.14 py  10:24:08
Symlink updated: /Users/patrickbarker/.local/bin/claudebox → /usr/local/bin/claudebox

 ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗
██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝
██║     ██║     ███████║██║   ██║██║  ██║█████╗
██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝
╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝

██████╗  ██████╗ ██╗  ██╗ ------ ┌──────────────┐
██╔══██╗██╔═══██╗╚██╗██╔╝ ------ │ The Ultimate │
██████╔╝██║   ██║ ╚███╔╝  ------ │ Claude Code  │
██╔══██╗██║   ██║ ██╔██╗  ------ │  Docker Dev  │
██████╔╝╚██████╔╝██╔╝ ██╗ ------ │ Environment  │
╚═════╝  ╚═════╝ ╚═╝  ╚═╝ ------ └──────────────┘

Using git-delta version: 0.17.0
Running docker build...
[+] Building 43.5s (26/30)                                                                                                                                                                                                    docker:orbstack
 =&gt; [internal] load build definition from Dockerfile                                                                                                                                                                                     0.0s
 =&gt; =&gt; transferring dockerfile: 5.57kB                                                                                                                                                                                                   0.0s
 =&gt; [internal] load metadata for docker.io/library/debian:bookworm                                                                                                                                                                      13.3s
 =&gt; [auth] library/debian:pull token for registry-1.docker.io                                                                                                                                                                            0.0s
 =&gt; [internal] load .dockerignore                                                                                                                                                                                                        0.0s
 =&gt; =&gt; transferring context: 2B                                                                                                                                                                                                          0.0s
 =&gt; [ 1/25] FROM docker.io/library/debian:bookworm@sha256:d42b86d7e24d78a33edcf1ef4f65a20e34acb1e1abd53cabc3f7cdf769fc4082                                                                                                               2.4s
 =&gt; =&gt; resolve docker.io/library/debian:bookworm@sha256:d42b86d7e24d78a33edcf1ef4f65a20e34acb1e1abd53cabc3f7cdf769fc4082                                                                                                                 0.0s
 =&gt; =&gt; sha256:d42b86d7e24d78a33edcf1ef4f65a20e34acb1e1abd53cabc3f7cdf769fc4082 8.52kB / 8.52kB                                                                                                                                           0.0s
 =&gt; =&gt; sha256:8f6c90463b37ab7fb787143f795dfa45245cc75ae3ad2f6444a64629a28f1922 1.04kB / 1.04kB                                                                                                                                           0.0s
 =&gt; =&gt; sha256:49c8d736314a595e0f5b875d2b239dbb7a4eebc415060ad7d5553e805ee4943a 468B / 468B                                                                                                                                               0.0s
 =&gt; =&gt; sha256:1f8ab7c4e8b4178f5f2504f6c4b199268151b1fc958cd53bb861d8dbd9faa8c3 48.34MB / 48.34MB                                                                                                                                         1.3s
 =&gt; =&gt; extracting sha256:1f8ab7c4e8b4178f5f2504f6c4b199268151b1fc958cd53bb861d8dbd9faa8c3                                                                                                                                                0.9s
 =&gt; [internal] load build context                                                                                                                                                                                                        0.0s
 =&gt; =&gt; transferring context: 7.19kB                                                                                                                                                                                                      0.0s
 =&gt; [ 2/25] RUN echo &#39;#!/bin/sh\nexit 101&#39; &gt; /usr/sbin/policy-rc.d &amp;&amp; chmod +x /usr/sbin/policy-rc.d                                                                                                                                     0.3s
 =&gt; [ 3/25] RUN export DEBIAN_FRONTEND=noninteractive &amp;&amp;     apt-get update &amp;&amp;         apt-get install -y --no-autoremove --no-install-recommends ca-certificates curl locales gnupg &amp;&amp; apt-get clean &amp;&amp;     echo &#34;en_US.UTF-8 UTF-8&#34;   11.6s
 =&gt; [ 4/25] RUN groupadd -g 20 claude || true &amp;&amp;     useradd -m -u 501 -g 20 -s /bin/bash claude                                                                                                                                         0.1s
 =&gt; [ 5/25] RUN ARCH=$(dpkg --print-architecture) &amp;&amp;     wget -q https://github.com/dandavison/delta/releases/download/0.17.0/git-delta_0.17.0_${ARCH}.deb &amp;&amp;     dpkg -i git-delta_0.17.0_${ARCH}.deb &amp;&amp;     rm git-delta_0.17.0_${ARC  1.3s
 =&gt; [ 6/25] WORKDIR /home/claude                                                                                                                                                                                                         0.0s
 =&gt; [ 7/25] RUN sh -c &#34;$(wget -O- https://github.com/deluan/zsh-in-docker/releases/download/v1.2.0/zsh-in-docker.sh)&#34; --     -p git     -p fzf     -a &#34;source /usr/share/doc/fzf/examples/key-bindings.zsh&#34;     -a &#34;source /usr/share/d  2.9s
 =&gt; [ 8/25] RUN curl -LsSf https://astral.sh/uv/install.sh | sh                                                                                                                                                                          2.7s
 =&gt; [ 9/25] RUN echo &#39;export PATH=&#34;$HOME/.local/bin:$PATH&#34;&#39; &gt;&gt; ~/.bashrc &amp;&amp;     echo &#39;export PATH=&#34;$HOME/.local/bin:$PATH&#34;&#39; &gt;&gt; ~/.zshrc                                                                                                  0.1s
 =&gt; [10/25] RUN git config --global core.pager delta &amp;&amp;     git config --global interactive.diffFilter &#34;delta --color-only&#34; &amp;&amp;     git config --global delta.navigate true &amp;&amp;     git config --global delta.light false &amp;&amp;     git conf  0.1s
 =&gt; [11/25] RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash                                                                                                                                          4.7s
 =&gt; [12/25] RUN bash -c &#34;source /home/claude/.nvm/nvm.sh &amp;&amp;     if [[ &#34;--lts&#34; == &#39;--lts&#39; ]]; then         nvm install --lts &amp;&amp;         nvm alias default &#39;lts/*&#39;;     else         nvm install --lts &amp;&amp;         nvm alias default --lts  0.6s
 =&gt; [13/25] RUN echo &#39;export NVM_DIR=&#34;$HOME/.nvm&#34;&#39; &gt;&gt; ~/.bashrc &amp;&amp;     echo &#39;[ -s &#34;$NVM_DIR/nvm.sh&#34; ] &amp;&amp; \. &#34;$NVM_DIR/nvm.sh&#34;&#39; &gt;&gt; ~/.bashrc &amp;&amp;     echo &#39;[ -s &#34;$NVM_DIR/bash_completion&#34; ] &amp;&amp; \. &#34;$NVM_DIR/bash_completion&#34;&#39; &gt;&gt; ~/.bash  0.1s
 =&gt; [14/25] RUN bash -c &#34;source /home/claude/.nvm/nvm.sh &amp;&amp;     nvm use default &amp;&amp;     npm install -g @anthropic-ai/claude-code&#34;                                                                                                         2.5s
 =&gt; [15/25] RUN cat &gt;&gt; ~/.zshrc &lt;&lt;&#39;EOF&#39;                                                                                                                                                                                                  0.1s
 =&gt; [16/25] RUN echo &#34;shopt -s checkwinsize&#34; &gt;&gt; ~/.bashrc                                                                                                                                                                                0.1s
 =&gt; [17/25] RUN cat &gt; ~/.tmux.conf &lt;&lt;&#39;EOF&#39;                                                                                                                                                                                               0.1s
 =&gt; [18/25] RUN echo &#34;claude ALL=(ALL) NOPASSWD:ALL&#34; &gt; /etc/sudoers.d/claude &amp;&amp;     chmod 0440 /etc/sudoers.d/claude                                                                                                                     0.1s
 =&gt; [19/25] RUN cat &gt; /etc/profile.d/00-winsize.sh &lt;&lt;&#39;EOF&#39;                                                                                                                                                                               0.1s
 =&gt; [20/25] COPY --chmod=755 init-firewall /home/claude/init-firewall                                                                                                                                                                    0.0s
 =&gt; ERROR [21/25] RUN chown claude:claude /home/claude/init-firewall                                                                                                                                                                     0.1s
------
 &gt; [21/25] RUN chown claude:claude /home/claude/init-firewall:
0.101 chown: invalid group: ‘claude:claude’
------
Dockerfile:140
--------------------
 138 |     # Copy init-firewall script
 139 |     COPY --chmod=755 init-firewall /home/$USERNAME/init-firewall
 140 | &gt;&gt;&gt; RUN chown $USERNAME:$USERNAME /home/$USERNAME/init-firewall
 141 |
 142 |     USER $USERNAME
--------------------
ERROR: failed to solve: process &#34;/bin/sh -c chown $USERNAME:$USERNAME /home/$USERNAME/init-firewall&#34; did not complete successfully: exit code: 1
```

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: Error on boot — Dockerfile generation, profile fragments, or `awk` substitution breaks multi-profile or devops installs.
