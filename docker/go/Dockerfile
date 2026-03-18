ARG BASE_TAG=latest
FROM awayfromklaude/afk-base:${BASE_TAG}

USER root

ARG GO_VERSION=1.26.1

RUN curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" | tar -C /usr/local -xz

ENV PATH="/usr/local/go/bin:/home/afk/go/bin:$PATH"
ENV GOPATH="/home/afk/go"

RUN mkdir -p /home/afk/go && chown -R afk:afk /home/afk/go

USER afk
