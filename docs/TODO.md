# TODO

## Tasks

- [ ] Remove base64 encoding for pem key
- [ ] Alert before deleting or stopping a container
- [ ] Create branch for the feature
- [ ] Simple checking / raise PR
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


Complete the following tasks:
- Add a simple way to start both the client and server applications from the root directory. Use package.json scripts.
- Update the server/.env.example and server/.env files to only include the necessary environment variables for the 
  server to run. I dont think we need all of those variables now.
- Clean up all the unused files, directories and code in the server and client directories.
- Update the README.md to reflect the changes made in the server and client directories.
- Ensure the root README.md provides clear instructions for setting up and running the project because I am going to 
  open source it.