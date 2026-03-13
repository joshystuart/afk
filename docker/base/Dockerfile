FROM debian:bookworm-slim

ARG CLAUDE_CODE_VERSION=2.1.42

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
  tmux \
  ripgrep \
  inotify-tools \
  ca-certificates \
  make \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN TTYD_VERSION=$(curl -s https://api.github.com/repos/tsl0922/ttyd/releases/latest | grep tag_name | cut -d '"' -f 4) && \
    curl -sL https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.x86_64 -o /usr/local/bin/ttyd && \
    chmod +x /usr/local/bin/ttyd

ARG USERNAME=afk
ARG USER_UID=1000
ARG USER_GID=1000

RUN groupadd --gid $USER_GID $USERNAME && \
    useradd --uid $USER_UID --gid $USER_GID -m -s /bin/bash $USERNAME

RUN mkdir -p /workspace /home/$USERNAME/.claude /home/$USERNAME/.ssh /home/$USERNAME/.gitconfig.d /home/$USERNAME/scripts /home/$USERNAME/.local/bin /home/$USERNAME/.local/share
COPY .claude.json /home/$USERNAME/.claude.json
COPY scripts/ /home/$USERNAME/scripts/
COPY scripts/.tmux.conf /home/$USERNAME/.tmux.conf
RUN chown -R $USERNAME:$USERNAME /workspace /home/$USERNAME/.claude.json /home/$USERNAME/.claude /home/$USERNAME/.ssh /home/$USERNAME/.gitconfig.d /home/$USERNAME/scripts /home/$USERNAME/.tmux.conf /home/$USERNAME/.local && \
    chmod 700 /home/$USERNAME/.ssh && \
    chmod +x /home/$USERNAME/scripts/*.sh

WORKDIR /workspace

USER $USERNAME

ENV PATH="/home/afk/.local/bin:$PATH"
ENV DISABLE_AUTOUPDATER=1
ENV CLAUDE_DANGEROUS_SKIP_PERMISSIONS=1
ENV HOME=/home/afk

RUN curl -fsSL https://claude.ai/install.sh | bash -s "${CLAUDE_CODE_VERSION}" \
    && claude --version

CMD ["/home/afk/scripts/entrypoint.sh"]
