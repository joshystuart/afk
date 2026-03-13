FROM afk-base:latest

USER root

RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN corepack enable && \
    corepack prepare yarn@stable --activate && \
    corepack prepare pnpm@latest --activate

USER afk
