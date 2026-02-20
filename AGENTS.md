# AGENTS.md

This file provides guidance to agents like claude, codex and cursor when working with code in this repository.

## Project Overview

AFK (Away From Keyboard) is a remote terminal access service that enables running Claude Code in Docker containers with web-based terminal access. The project aims to provide dual terminal sessions (Claude + manual access), automatic git integration, and containerized development environments.

## Libraries

Always prefer to use existing libraries for new features if and when we can. eg. For things like auth, third party apis, etc we should always try to find a library to use before writing our own version. This reduces the chances we create security vulnerabilities and unnecessary code that we then have to maintain ourselves.

There is a balance to be had though; we should try not to use libraries that are not already well supported. Doing so could create another potential issue in that this library is not kept up to date with security patches etc.

So first search for libraries, then if there's some border line decisions, ask me if we should use the library or not.

## Server

### Config

**NEVER** use `process.env` directly.
**NEVER** use the `@nestjs/config` way of doing config.

We use https://www.npmjs.com/package/nest-typed-config which automatically binds the hierachical .env.yaml structure to classes / DTOs eg.

```yaml
docker:
  socketPath: '${DOCKER_HOST:-/var/run/docker.sock}'
  imageName: afk
  startPort: 7681
  endPort: 7780
```

Will map `docker.config.ts`:

```typescript
export class AppConfig {
  @ValidateNested()
  @Type(() => DockerConfig)
  public readonly docker!: DockerConfig;
}
```

Which is mapped from the root `app.config.ts`

```typescript
export class AppConfig {
  @ValidateNested()
  @Type(() => DockerConfig)
  public readonly docker!: DockerConfig;
}
```

These configs are automatically available via DI and can be injected directly into classes eg.

```typescript
@Injectable()
export class DockerEngineService {
  constructor(private readonly config: DockerConfig) {}
}
```
