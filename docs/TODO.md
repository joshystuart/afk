# TODO

## Tasks

- [ ] Remove base64 encoding for pem key
- [ ] Mobile friendly
- [ ] Alert before deleting or stopping a container
- [ ] Create branch for the feature
- [ ] Simple checking / raise PR

## Manual Testing
```shell
exec ttyd \
--port 5001 \
--writable \
-t rendererType=canvas \
claude --continue
```

```shell
docker ps -a | grep afk
docker logs awesome_thompson --tail 50
docker logs b05f9c350fb7 --tail 50
```
