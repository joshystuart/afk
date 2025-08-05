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


