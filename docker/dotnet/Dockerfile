FROM awayfromklaude/afk-base:latest

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    && wget https://dot.net/v1/dotnet-install.sh -O /tmp/dotnet-install.sh \
    && chmod +x /tmp/dotnet-install.sh \
    && /tmp/dotnet-install.sh --channel 10.0 --install-dir /usr/share/dotnet \
    && ln -s /usr/share/dotnet/dotnet /usr/local/bin/dotnet \
    && rm /tmp/dotnet-install.sh \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV DOTNET_ROOT=/usr/share/dotnet

USER afk
