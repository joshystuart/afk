FROM node:20

ARG CLAUDE_CODE_VERSION=latest

# Copy certificate bundle
COPY osg_curl_ca_bundle.pem /etc/ssl/certs/osg_curl_ca_bundle.pem

ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/osg_curl_ca_bundle.pem
ENV CURL_CA_BUNDLE=/etc/ssl/certs/osg_curl_ca_bundle.pem

# Install basic development tools and iptables/ipset
RUN apt-get update && apt-get install -y --no-install-recommends \
  less \
  git \
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
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install ttyd from GitHub releases
RUN TTYD_VERSION=$(curl -s https://api.github.com/repos/tsl0922/ttyd/releases/latest | grep tag_name | cut -d '"' -f 4) && \
    curl -sL https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.x86_64 -o /usr/local/bin/ttyd && \
    chmod +x /usr/local/bin/ttyd

# Ensure default node user has access to /usr/local/share
RUN mkdir -p /usr/local/share/npm-global && \
  chown -R node:node /usr/local/share

ARG USERNAME=node

# Create workspace and config directories and set permissions
RUN mkdir -p /workspace /home/node/.claude
COPY .claude.json /home/node/.claude.json
RUN chown -R node:node /workspace /home/node/.claude.json /home/node/.claude

WORKDIR /workspace

# Set up non-root user
USER node

# Install global packages
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# Install Claude
RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}

# Expose ttyd port
EXPOSE 7681

# Start ttyd with claude
CMD ["ttyd", "-p", "7681", "-W", "/workspace", "claude"]

