```shell
docker build -t afk .
docker run -e CLAUDE_CODE_OAUTH_TOKEN=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 -p 7681:7681 -it afk /bin/bash
```

```shell
ttyd -p 7681 -W claude
```

```Dockerfile
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/osg_curl_ca_bundle.pem
ENV CURL_CA_BUNDLE=/etc/ssl/certs/osg_curl_ca_bundle.pem
ENV CLAUDE_CODE_OAUTH_TOKEN=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
```



```shell
SSH_PRIVATE_KEY=$(cat ~/.ssh/id_ed25519 | base64 -w 0) \
REPO_URL=git@github.com:origin-retail/rewards-ledger-micro-site.git \
CLAUDE_CODE_OAUTH_TOKEN=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 \
GIT_USER_NAME="Josh Stuart" \
GIT_USER_EMAIL="joshstuartx@gmail.com" \
docker-compose up
```


```shell
  docker run -d \
    --name afk-terminal-1 \
    -p 7681:7681 \
    --privileged \
    --restart unless-stopped \
    -e CLAUDE_CODE_OAUTH_TOKEN="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" \
    -e REPO_URL="${REPO_URL}" \
    -e REPO_BRANCH="${REPO_BRANCH:-main}" \
    -e SSH_PRIVATE_KEY="$(cat ~/.ssh/id_ed25519 | base64 -w 0)" \
    -e GIT_USER_NAME="${GIT_USER_NAME}" \
    -e GIT_USER_EMAIL="${GIT_USER_EMAIL}" \
    -e GIT_SSH_HOST="${GIT_SSH_HOST}" \
    -v "$(pwd)/workspace:/workspace" \
    -v "/var/run/docker.sock:/var/run/docker.sock" \
    docker-afk-terminal:latest
```


```shell
docker run -d \
--name afk-terminal-1 \
-p 7681:7681 \
--privileged \
--restart unless-stopped \
-e CLAUDE_CODE_OAUTH_TOKEN="${CLAUDE_CODE_OAUTH_TOKEN}" \
-e REPO_URL="${REPO_URL}" \
-e REPO_BRANCH="${REPO_BRANCH:-main}" \
-e SSH_PRIVATE_KEY="${SSH_PRIVATE_KEY}" \
-e GIT_USER_NAME="${GIT_USER_NAME:-Claude User}" \
-e GIT_USER_EMAIL="${GIT_USER_EMAIL:-claude@example.com}" \
-e GIT_SSH_HOST="${GIT_SSH_HOST}" \
-v "$(pwd)/workspace:/workspace" \
-v "/var/run/docker.sock:/var/run/docker.sock" \
docker-afk-terminal:latest
```

For testing with your specific repository, you can set the environment variables first and then run:

# Set your environment variables
```shell
export REPO_URL="git@github.com:joshystuart/dismissible.git"
export SSH_PRIVATE_KEY="$(base64 < ~/.ssh/your_private_key)"
export GIT_USER_NAME="Josh Stuart"
export GIT_USER_EMAIL="your.email@example.com"
```


# Run the container
```shell
docker run -d \
--name afk-terminal-1 \
-p 7681:7681 \
--privileged \
--restart unless-stopped \
-e CLAUDE_CODE_OAUTH_TOKEN="${CLAUDE_CODE_OAUTH_TOKEN}" \
-e REPO_URL="${REPO_URL}" \
-e REPO_BRANCH="${REPO_BRANCH:-main}" \
-e SSH_PRIVATE_KEY="${SSH_PRIVATE_KEY}" \
-e GIT_USER_NAME="${GIT_USER_NAME}" \
-e GIT_USER_EMAIL="${GIT_USER_EMAIL}" \
-e GIT_SSH_HOST="${GIT_SSH_HOST}" \
-v "$(pwd)/workspace:/workspace" \
-v "/var/run/docker.sock:/var/run/docker.sock" \
docker-afk-terminal:latest
```


To view logs:
```shell
docker logs -f afk-terminal-1
```


To stop and remove:
```shell
docker stop afk-terminal-1
docker rm afk-terminal-1
```
