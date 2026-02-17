FROM node:20

# Claude Code version: "latest", "stable", or a specific version like "2.1.19"
ARG CLAUDE_CODE_VERSION=2.1.42

# Install basic development tools and dependencies
# ripgrep is required by Claude Code for search functionality
RUN apt-get update && apt-get install -y --no-install-recommends \
  less \
  git \
  openssh-client \
  procps \
  sudo \
  fzf \
  man-db \
  unzip \
  gnupg2 \
  gh \
  iptables \
  ipset \
  iproute2 \
  dnsutils \
  aggregate \
  jq \
  curl \
  screen \
  tmux \
  ripgrep \
  inotify-tools \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install ttyd from GitHub releases
RUN TTYD_VERSION=$(curl -s https://api.github.com/repos/tsl0922/ttyd/releases/latest | grep tag_name | cut -d '"' -f 4) && \
    curl -sL https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.x86_64 -o /usr/local/bin/ttyd && \
    chmod +x /usr/local/bin/ttyd

ARG USERNAME=node

# Create workspace and config directories and set permissions
RUN mkdir -p /workspace /home/node/.claude /home/node/.ssh /home/node/.gitconfig.d /home/node/scripts /home/node/.local/bin /home/node/.local/share
COPY .claude.json /home/node/.claude.json
COPY scripts/ /home/node/scripts/
COPY scripts/.screenrc /home/node/.screenrc
COPY scripts/.tmux.conf /home/node/.tmux.conf
RUN chown -R node:node /workspace /home/node/.claude.json /home/node/.claude /home/node/.ssh /home/node/.gitconfig.d /home/node/scripts /home/node/.screenrc /home/node/.tmux.conf /home/node/.local && \
    chmod 700 /home/node/.ssh && \
    chmod +x /home/node/scripts/*.sh

WORKDIR /workspace

# Set up non-root user
USER node

# Add Claude Code binary location to PATH and disable auto-updates in containers
ENV PATH="/home/node/.local/bin:$PATH"
ENV DISABLE_AUTOUPDATER=1

# Install Claude Code using native installer (replaces deprecated npm method)
# See: https://code.claude.com/docs/en/setup#install-a-specific-version
RUN curl -fsSL https://claude.ai/install.sh | bash -s "${CLAUDE_CODE_VERSION}" \
    && claude --version

CMD ["/home/node/scripts/start-claude.sh"]

