---
source: RchGrav/claudebox
kind: pull_request
number: 101
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/101
author: b00y0h
head: fix/devops-profile-packages
base: main
created_at: 2026-02-12T23:36:23Z
updated_at: 2026-02-12T23:46:52Z
---

# fix: devops profile fails — kubectl, helm, terraform not in Debian repos

## Summary

The devops profile fails during `docker build` because `kubectl`, `helm`, and `terraform` are not available in Debian bookworm&#39;s apt repositories.

```
E: Unable to locate package kubectl
E: Unable to locate package helm
E: Unable to locate package terraform
```

## Fix

Install these tools from their official upstream sources (matching the pattern used by Rust, Go, Flutter, and Java profiles):

- **kubectl**: Direct binary download from `dl.k8s.io` with architecture detection
- **helm**: Official `get-helm-3` install script (handles arch automatically)
- **terraform**: Binary zip from `releases.hashicorp.com` with architecture detection

Keep `docker.io`, `docker-compose`, and `ansible` as apt packages since they are available in bookworm.

Also removed `awscli` which is not a valid Debian package name (the Debian package is `python3-aws` or requires pip installation).

## Testing

Verified the profile generates valid Dockerfile RUN commands:

```
RUN apt-get update &amp;&amp; apt-get install -y docker.io docker-compose ansible &amp;&amp; apt-get clean
RUN ARCH=$(dpkg --print-architecture) &amp;&amp; \
    curl -fsSL &#34;https://dl.k8s.io/release/$(curl -fsSL https://dl.k8s.io/release/stable.txt)/bin/linux/${ARCH}/kubectl&#34; -o /usr/local/bin/kubectl &amp;&amp; \
    chmod +x /usr/local/bin/kubectl
RUN curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
RUN ARCH=$(dpkg --print-architecture) &amp;&amp; \
    curl -fsSL &#34;https://releases.hashicorp.com/terraform/1.9.8/terraform_1.9.8_linux_${ARCH}.zip&#34; -o /tmp/terraform.zip &amp;&amp; \
    unzip -o /tmp/terraform.zip -d /usr/local/bin &amp;&amp; \
    rm /tmp/terraform.zip
```

Tested on arm64 (Apple Silicon / OrbStack).

## Summary by Sourcery

Update the devops profile to install kubectl, helm, and terraform from their official upstream sources instead of Debian packages, ensuring compatibility with Debian bookworm.

Bug Fixes:

- Fix devops Docker image builds failing due to kubectl, helm, and terraform not being available in Debian bookworm apt repositories.

Enhancements:

- Install kubectl via architecture-aware binary download, helm via the official installation script, and terraform via architecture-aware binary zip download in the devops profile.
- Remove the non-existent awscli Debian package from the devops profile while retaining docker.io, docker-compose, and ansible as apt-installed tools.

Build:

- Adjust generated Dockerfile RUN commands for the devops profile to use upstream installation methods for kubectl, helm, and terraform.

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: fix: devops profile fails — kubectl, helm, terraform not in Debian repos
