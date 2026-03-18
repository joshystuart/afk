ARG BASE_TAG=latest
FROM awayfromklaude/afk-base:${BASE_TAG}

USER root

ARG PYTHON_VERSION=3.13.3

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libreadline-dev \
    libncursesw5-dev \
    libssl-dev \
    libsqlite3-dev \
    libgdbm-dev \
    libbz2-dev \
    libffi-dev \
    zlib1g-dev \
    liblzma-dev \
    && curl -fsSL "https://www.python.org/ftp/python/${PYTHON_VERSION}/Python-${PYTHON_VERSION}.tar.xz" -o /tmp/python.tar.xz \
    && tar -xJf /tmp/python.tar.xz -C /tmp \
    && cd /tmp/Python-${PYTHON_VERSION} \
    && ./configure --enable-optimizations --prefix=/usr/local \
    && make -j "$(nproc)" \
    && make install \
    && rm -rf /tmp/python.tar.xz /tmp/Python-${PYTHON_VERSION} \
    && apt-get purge -y build-essential \
    && apt-get autoremove -y \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN ln -sf /usr/local/bin/python3 /usr/local/bin/python && \
    ln -sf /usr/local/bin/pip3 /usr/local/bin/pip

USER afk

RUN pip install --user poetry
