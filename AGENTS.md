# AGENTS.md

## Project Overview

AFK (Away From Keyboard) is a remote terminal access service that enables running Claude Code in Docker containers with a chat-based web interface. Each session provides a chat pane for interacting with Claude Code (invoked on-demand via `docker exec`) and a web terminal for manual shell access. Chat history is persisted and restored across session restarts.

## Patters and Best Practices

Always follow NestJS best practices eg. DI first (dont fall back to using single functions that are imported, always prefer DI).

We should also be DRY and use SOLID principles. This is important to maintain our code quality and long term maintainability.

If a single file is approaching 500 lines of code, it might be a good idea to split it up into multiple classes/files. This helps maintain your context window and keep coherence.

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
session:
  maxSessionsPerUser: 10
```

Will map `session.config.ts`:

```typescript
export class SessionConfig {
  @IsNumber()
  @Type(() => Number)
  public readonly maxSessionsPerUser!: number;
}
```

Which is mapped from the root `app.config.ts`

```typescript
export class AppConfig {
  @ValidateNested()
  @Type(() => SessionConfig)
  public readonly session!: SessionConfig;
}
```

These configs are automatically available via DI and can be injected directly into classes eg.

```typescript
@Injectable()
export class SessionManagerService {
  constructor(private readonly config: SessionConfig) {}
}
```

Note: User-configurable settings (Docker socket path, port range, GitHub OAuth, etc.) are stored in the database via the `Settings` entity, not in YAML config. YAML config is only for server infrastructure settings (port, logging, auth, etc.).
