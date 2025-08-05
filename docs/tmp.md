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
REPO_URL=git@github.com:joshystuart/dismissible.git \
GIT_SSH_HOST=github.com \
CLAUDE_CODE_OAUTH_TOKEN=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 \
SSH_PRIVATE_KEY=$SSH_PRIVATE_KEY \
GIT_USER_NAME="Josh Stuart" \
GIT_USER_EMAIL="joshstuartx@gmail.com" \
docker-compose up
```


```shell
afk-terminal-1  | [INFO] Cloning repository: git@github.com:your-org/private-repo.git
afk-terminal-1  | [INFO] Target directory: /workspace/private-repo
afk-terminal-1  | Cloning into '/workspace/private-repo'...
afk-terminal-1  | no such identity: /home/node/.ssh/id_rsa: No such file or directory
afk-terminal-1  | git@github.com: Permission denied (publickey).
afk-terminal-1  | fatal: Could not read from remote repository.
afk-terminal-1  | 
afk-terminal-1  | Please make sure you have the correct access rights
afk-terminal-1  | and the repository exists.
afk-terminal-1  | [WARNING] Clone failed, retrying (1/3)...
afk-terminal-1  | Cloning into '/workspace/private-repo'...
afk-terminal-1  | no such identity: /home/node/.ssh/id_rsa: No such file or directory
afk-terminal-1  | git@github.com: Permission denied (publickey).
afk-terminal-1  | fatal: Could not read from remote repository.
```

