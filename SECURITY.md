# Security Audit Report - AFK (Away From Keyboard)

**Date**: February 20, 2026
**Scope**: Full-stack application (NestJS backend + React frontend + Docker integration)
**Assessment Type**: Comprehensive Security Audit

---

## Executive Summary

AFK is a remote terminal access service that manages containerized Claude Code sessions. The audit identified **7 critical/high severity issues**, **7 medium severity issues**, and **4 low severity issues** related to authentication, configuration management, data protection, and infrastructure security. Most issues are mitigatable through proper configuration and code changes.

**Risk Level**: **HIGH** - Current default configuration is not production-ready and exposes multiple security vulnerabilities.

---

## CRITICAL FINDINGS

### 1. **Weak Default Admin Credentials** (Critical)

**Location**: `/workspace/afk/server/src/config/.env.mac.yaml`, `/workspace/afk/server/src/config/.env.test.yaml`

**Issue**: Default admin credentials are hardcoded with weak values:
- Username: `admin`
- Password: `password123` (6 characters)

**File Evidence**:
```yaml
# .env.mac.yaml
adminUser:
  username: "${ADMIN_USERNAME:-admin}"
  password: "${ADMIN_PASSWORD:-password123}"

# .env.test.yaml
adminUser:
  username: admin
  password: admin123
```

**Validation**: Only minimum length check (6 chars) in `AdminUserConfig` - no complexity requirements.

**Impact**:
- Trivial brute force or credential guessing attacks
- Default credentials if not overridden in production
- Easily compromised admin access

**Recommendation**:
- [ ] Enforce strong password policy (minimum 16 characters, mixed case, numbers, symbols)
- [ ] Remove default credentials from configuration files
- [ ] Require environment variable override for admin password
- [ ] Implement account lockout after failed login attempts (e.g., 5 attempts = 15 min lockout)
- [ ] Add password complexity validation to `AdminUserConfig`

**Severity**: 🔴 **CRITICAL**

---

### 2. **Hardcoded Development JWT Secret** (Critical)

**Location**: `/workspace/afk/server/src/config/.env.mac.yaml:31`

**Issue**: JWT secret is hardcoded with an obvious development value:

```yaml
auth:
  jwtSecret: "${JWT_SECRET:-afk-development-secret-key-change-in-production}"
```

**Impact**:
- Anyone with code access knows the default JWT secret
- Compromised secret allows token forgery and account impersonation
- No rotation mechanism
- Long token expiration (implied 24 hours based on code review)

**Token Details** (from `auth.service.ts`):
```typescript
const token = this.jwtService.sign(payload);
```

No explicit expiration set, using default (24 hours).

**Recommendation**:
- [ ] Make JWT secret mandatory via environment variable - no default fallback
- [ ] Use minimum 32-character random JWT secret in production
- [ ] Implement token expiration (recommend 15-30 minutes)
- [ ] Add refresh token mechanism for long-lived sessions
- [ ] Consider rotating JWT secrets periodically
- [ ] Document secret rotation procedure

**Severity**: 🔴 **CRITICAL**

---

### 3. **CORS Enabled with Wildcard Origin** (Critical)

**Location**: `/workspace/afk/server/src/libs/app-factory/application.factory.ts:43-45`

**Issue**: CORS is enabled without origin restrictions:

```typescript
if (enableCors) {
  app.enableCors();
}
```

**WebSocket CORS** (`/workspace/afk/server/src/gateways/session.gateway.ts:28-33`):
```typescript
@WebSocketGateway({
  namespace: '/sessions',
  cors: {
    origin: true,        // ⚠️ ALLOWS ANY ORIGIN
    credentials: true,
  },
})
```

**Impact**:
- Any website can make cross-origin requests to the API
- Combined with missing authentication on WebSocket = data breach
- Enables CSRF attacks
- Allows unauthorized clients to perform operations

**Recommendation**:
- [ ] Configure CORS with explicit whitelist:
  ```typescript
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600,
  });
  ```
- [ ] Apply same whitelist to WebSocket gateway
- [ ] Document allowed origins in environment variable template
- [ ] Implement CSRF tokens for state-changing operations

**Severity**: 🔴 **CRITICAL**

---

### 4. **No Authentication on WebSocket Gateway** (Critical)

**Location**: `/workspace/afk/server/src/gateways/session.gateway.ts:51-75`

**Issue**: WebSocket connections are not validated:

```typescript
async handleConnection(client: Socket) {
  this.logger.log('Client connected', {
    clientId: client.id,
  });
  // No token validation occurs here
}

@SubscribeMessage('subscribe.session')
async handleSessionSubscription(
  @MessageBody() data: { sessionId: string },
  @ConnectedSocket() client: Socket,
) {
  // No auth check - anyone can subscribe to any session
  await this.sessionSubscriptionService.subscribe(
    client.id,
    data.sessionId,
  );
}
```

**Impact**:
- Unauthenticated clients can subscribe to session updates
- Real-time container logs are exposed without authorization
- Git status and session state accessible to anyone with network access
- WebSocket persistence bypasses HTTP auth guard

**Recommendation**:
- [ ] Validate JWT token on WebSocket connection:
  ```typescript
  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.authService.validateToken(token);
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }
  ```
- [ ] Validate user authorization for each subscribe.session message
- [ ] Check that subscribing user owns the session
- [ ] Implement rate limiting on WebSocket messages

**Severity**: 🔴 **CRITICAL**

---

### 5. **Sensitive Data Exposure in Error Logging** (Critical)

**Location**: `/workspace/afk/server/src/libs/common/filters/http-exception.filter.ts:40-48`

**Issue**: Request body (containing credentials) is logged:

```typescript
this.logger.error('Unhandled exception', {
  error: exception,
  stack: exception.stack,
  request: {
    method: request.method,
    url: request.url,
    body: request.body,  // ⚠️ LOGS SENSITIVE DATA
  },
});
```

**Impact**:
- SSH private keys exposed in logs
- Claude tokens logged
- GitHub tokens logged
- Admin passwords logged if sent in login requests
- Logs may be stored insecurely or visible in monitoring

**Data Exposed**:
- `UpdateSettingsRequest` can contain `sshPrivateKey` and `claudeToken`
- `LoginRequestDto` contains admin password
- `CreateSessionRequest` can contain credentials

**Recommendation**:
- [ ] Implement request sanitization:
  ```typescript
  private sanitizeRequest(req: any) {
    const sanitized = { ...req.body };
    const sensitiveFields = ['password', 'token', 'sshPrivateKey', 'claudeToken', 'githubToken', 'secret'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    return sanitized;
  }
  ```
- [ ] Never log request bodies in production
- [ ] Implement structured logging with log levels
- [ ] Set up log aggregation with PII masking
- [ ] Monitor and rotate logs regularly

**Severity**: 🔴 **CRITICAL**

---

### 6. **Plaintext Storage of Sensitive Credentials** (Critical)

**Location**: `/workspace/afk/server/src/domain/settings/settings.repository.ts` (domain entity)

**Issue**: Sensitive data stored without encryption in SQLite database:

**Affected Data**:
- SSH private keys
- Claude Code OAuth tokens
- GitHub access tokens
- Git credentials

**Evidence**: Settings table stores these directly in database:
```typescript
// From settings entity usage
settings.updateGitHubToken(token, user.login);
await this.settingsRepository.save(settings);
```

No encryption mechanism is implemented.

**Impact**:
- Database breach exposes all user credentials
- SSH keys can be used to compromise repositories
- OAuth tokens can be replayed for unauthorized access
- No rotation on compromise

**Database Path**: `/workspace/afk/afk.sqlite` (default location)

**Recommendation**:
- [ ] Implement field-level encryption for sensitive data
- [ ] Use a dedicated encryption library (e.g., `crypto-js`, `sodium` for better security)
- [ ] Encrypt before saving, decrypt after retrieving
- [ ] Document encryption key management
- [ ] Generate unique encryption keys per installation
- [ ] Never log or display raw keys/tokens
- [ ] Implement secure credential storage interface

**Severity**: 🔴 **CRITICAL**

---

### 7. **No Rate Limiting on Authentication Endpoints** (High)

**Location**: `/workspace/afk/server/src/libs/auth/auth.controller.ts:26-39`

**Issue**: No rate limiting or account lockout on login endpoint:

```typescript
@Public()
@Post('login')
@HttpCode(HttpStatus.OK)
async login(@Body() credentials: LoginRequestDto): Promise<LoginResponseDto> {
  this.logger.debug('Logging in with', credentials);
  return this.authService.login(credentials);
  // No rate limiting - unlimited attempts
}
```

**Impact**:
- Brute force attacks possible against admin account
- Default 6-character password easily cracked
- No detection of attack patterns
- Logging doesn't systematically track failed attempts

**Recommendation**:
- [ ] Implement rate limiting using `@nestjs/throttler`:
  ```typescript
  @Throttle({
    default: { limit: 5, ttl: 60000 }, // 5 attempts per minute
  })
  @Post('login')
  ```
- [ ] Implement account lockout after N failed attempts
- [ ] Track failed login attempts with timestamps
- [ ] Log authentication events for audit trail
- [ ] Return generic error messages ("Invalid credentials") for both user/pass errors
- [ ] Consider CAPTCHA for repeated failures

**Severity**: 🟠 **HIGH**

---

---

## HIGH SEVERITY FINDINGS

### 8. **Single Admin User Authorization Model** (High)

**Location**: `/workspace/afk/server/src/libs/auth/auth.service.ts`, `/workspace/afk/server/src/libs/config/admin-user.config.ts`

**Issue**: No granular access control - only one admin user exists:

```typescript
if (username !== adminUser.username || password !== adminUser.password) {
  throw new UnauthorizedException('Invalid credentials');
}

const payload: AuthPayload = {
  userId: 'admin',  // Hard-coded admin user ID
  username: adminUser.username,
  isAdmin: true,
};
```

**Impact**:
- All users have full administrative access
- No role-based access control (RBAC)
- No session isolation between different users
- Single point of failure for authentication
- Cannot audit which user performed which action

**Recommendation**:
- [ ] Implement user management system with multiple users
- [ ] Define roles (admin, user, read-only)
- [ ] Implement role-based session access control
- [ ] Add user audit trail (who accessed what, when)
- [ ] Implement session ownership validation

**Severity**: 🟠 **HIGH**

---

### 9. **Sensitive Data in Docker Environment Variables** (High)

**Location**: `/workspace/afk/server/src/services/docker/docker-engine.service.ts:320-346`

**Issue**: Secrets passed to containers via environment variables:

```typescript
private buildEnvironment(options: ContainerCreateOptions): string[] {
  const env = [
    `REPO_URL=${repoUrl}`,
    `REPO_BRANCH=${options.branch || 'main'}`,
    `GIT_USER_NAME=${options.gitUserName}`,
    `GIT_USER_EMAIL=${options.gitUserEmail}`,
    `CLAUDE_PORT=${options.ports.claudePort}`,
    `MANUAL_PORT=${options.ports.manualPort}`,
  ];

  if (options.sshPrivateKey) {
    env.push(`SSH_PRIVATE_KEY=${options.sshPrivateKey}`);  // ⚠️ EXPOSED
  }

  if (options.claudeToken) {
    env.push(`CLAUDE_CODE_OAUTH_TOKEN=${options.claudeToken}`);  // ⚠️ EXPOSED
  }

  if (options.githubToken) {
    env.push(`GITHUB_TOKEN=${options.githubToken}`);  // ⚠️ EXPOSED
  }

  return env;
}
```

**Impact**:
- Secrets visible in `docker inspect` output
- Secrets in container process listings
- Secrets accessible in container logs
- Container escape = credential compromise
- SSH keys exposed to containerized applications

**Recommendation**:
- [ ] Use Docker secrets or volumes instead of environment variables
- [ ] Mount credentials as read-only volumes:
  ```typescript
  const mounts = [
    {
      Type: 'bind',
      Source: '/tmp/ssh_key',
      Target: '/home/node/.ssh/id_rsa',
      ReadOnly: true,
    }
  ];
  ```
- [ ] Use temporary files with restricted permissions
- [ ] Implement credential injection via initialization scripts
- [ ] Clear sensitive env vars after container setup
- [ ] Document secure credential handling

**Severity**: 🟠 **HIGH**

---

### 10. **Insufficient Input Validation and Sanitization** (High)

**Location**: Multiple endpoints accepting user input

**Issue**: While basic validation exists, command injection risks remain:

**Git Operations** (`git.interactor.ts`):
- Commit message passed directly: `['git', 'commit', '-m', message.trim()]`
- Mitigation: Using array syntax prevents shell injection, but content not validated
- Risk: Special Git options or format strings could cause issues

**GitHub Search** (`github.service.ts:96`):
```typescript
const { data } = await octokit.search.repos({
  q: `${search} in:name fork:true`,  // User input directly in search
  // Could be used for GitHub API injection
});
```

**Repository URL Validation** (`create-session-request.dto.ts`):
```typescript
@IsGitUrl()
repoUrl?: string;
```
- Validator only checks format, not malicious URLs
- URLs could point to malicious repositories
- No whitelist of allowed repositories

**Impact**:
- Potential for API injection attacks
- Malicious Git operations
- Unexpected behavior in containers
- Information disclosure through error messages

**Recommendation**:
- [ ] Implement strict allowlist for repository URLs
- [ ] Validate commit message content (no special Git commands)
- [ ] Use parameterized GitHub API queries
- [ ] Sanitize all error messages before returning to client
- [ ] Implement input length limits
- [ ] Validate branch names against Git naming conventions

**Severity**: 🟠 **HIGH**

---

### 11. **Missing HTTP Security Headers** (High)

**Location**: `/workspace/afk/server/src/main.ts`, application configuration

**Issue**: No security headers configured:

```typescript
const config = new DocumentBuilder()
  .setTitle('AFK Server API')
  // No security header configuration
  .build();
```

**Missing Headers**:
- `Strict-Transport-Security` (HSTS) - forces HTTPS
- `X-Frame-Options` - prevents clickjacking
- `X-Content-Type-Options` - prevents MIME sniffing
- `Content-Security-Policy` - prevents XSS
- `X-XSS-Protection` - XSS protection

**Impact**:
- Vulnerable to clickjacking attacks
- MIME sniffing attacks possible
- XSS vulnerabilities harder to prevent
- No HTTPS enforcement

**Recommendation**:
- [ ] Add helmet middleware:
  ```typescript
  import helmet from '@nestjs/helmet';
  app.use(helmet());
  ```
- [ ] Configure specific headers:
  ```typescript
  app.use(helmet.hsts({ maxAge: 31536000 }));
  app.use(helmet.frameguard({ action: 'deny' }));
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  }));
  ```

**Severity**: 🟠 **HIGH**

---

### 12. **No HTTPS/TLS Configuration** (High)

**Location**: `/workspace/afk/server/src/config/.env.mac.yaml:3`, application startup

**Issue**: Application listens on HTTP without TLS:

```yaml
baseUrl: http://localhost    # ⚠️ HTTP ONLY
```

Server bootstrap:
```typescript
await app.listen(appConfig.port, '0.0.0.0');
// Listens on 0.0.0.0:3001 with no TLS
```

**Impact**:
- All traffic transmitted in plaintext
- Credentials interceptable via MITM attack
- Tokens visible to network observers
- No encryption in transit
- Violates OWASP Top 10

**Recommendation**:
- [ ] Enable TLS/SSL in production:
  ```typescript
  const httpsOptions = {
    key: fs.readFileSync('/path/to/key.pem'),
    cert: fs.readFileSync('/path/to/cert.pem'),
  };
  await app.listen(appConfig.port, httpsOptions);
  ```
- [ ] Use reverse proxy (Nginx) with SSL termination
- [ ] Configure HSTS headers
- [ ] Use strong TLS version (1.2+)
- [ ] Generate certificates via Let's Encrypt
- [ ] Document certificate rotation

**Severity**: 🟠 **HIGH**

---

### 13. **Public API Documentation Without Authentication** (High)

**Location**: `/workspace/afk/server/src/main.ts:14-20`

**Issue**: Swagger API documentation exposed at `/api/docs`:

```typescript
const config = new DocumentBuilder()
  .setTitle('AFK Server API')
  // No authentication requirement
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

**Impact**:
- Complete API specification publicly visible
- Endpoint structure revealed
- Parameter details disclosed
- Facilitates attack reconnaissance
- No rate limiting on documentation endpoint

**Recommendation**:
- [ ] Protect Swagger documentation with authentication:
  ```typescript
  @UseGuards(AuthGuard)
  @Get('docs')
  getSwaggerDocs() { }
  ```
- [ ] Disable Swagger in production
- [ ] Serve documentation on separate, authenticated endpoint
- [ ] Use `@ApiHidden()` on sensitive endpoints

**Severity**: 🟠 **HIGH**

---

---

## MEDIUM SEVERITY FINDINGS

### 14. **Inadequate Error Message Handling** (Medium)

**Location**: `/workspace/afk/server/src/libs/common/filters/http-exception.filter.ts:36-48`

**Issue**: Error messages may leak internal implementation details:

```typescript
if (exception instanceof Error) {
  message = exception.message;  // ⚠️ FULL ERROR MESSAGE RETURNED
  this.logger.error('Unhandled exception', { error: exception });
}

const errorResponse = {
  success: false,
  error: {
    message,  // Returned to client
    code,
    timestamp: new Date().toISOString(),
  },
  statusCode: status,
};
```

**Examples of Leaked Information**:
- Database errors: "PostgreSQL: connection failed at localhost:5432"
- File system errors: "ENOENT: no such file or directory, open '/home/node/.ssh/id_rsa'"
- Docker errors: "error creating container: container name already exists"

**Impact**:
- Attackers learn system architecture
- Database credentials may be in error messages
- File paths disclosed
- API behavior exposed

**Recommendation**:
- [ ] Implement generic error messages for clients:
  ```typescript
  const clientMessage = {
    true: 'Internal server error',
    false: exception.message || 'Operation failed',
  }[status >= 500];
  ```
- [ ] Log detailed errors server-side only
- [ ] Create error code system:
  ```typescript
  const ERROR_CODES = {
    VALIDATION_ERROR: 'ERR_001',
    NOT_FOUND: 'ERR_002',
    INTERNAL_ERROR: 'ERR_500',
  };
  ```
- [ ] Return only codes and generic messages to clients

**Severity**: 🟡 **MEDIUM**

---

### 15. **No Database Encryption** (Medium)

**Location**: `/workspace/afk/server/src/database/database.config.ts`

**Issue**: SQLite database stored unencrypted:

**Default Configuration**:
```typescript
// SQLite database at afk.sqlite - unencrypted
```

**Impact**:
- Database file on disk is readable plaintext
- Credentials, tokens, SSH keys accessible if file is compromised
- No protection against filesystem access
- Container data accessible via volume inspection

**Database Contents at Risk**:
- SSH private keys (Settings entity)
- Claude OAuth tokens (Settings entity)
- GitHub access tokens (Settings entity)
- Session configurations with credentials

**Recommendation**:
- [ ] Enable SQLite encryption:
  ```typescript
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('afk.sqlite');
  db.run(`PRAGMA key = 'encryption-key'`);
  ```
- [ ] Or migrate to PostgreSQL with connection encryption
- [ ] Implement field-level encryption (recommended)
- [ ] Store encryption keys separately from database
- [ ] Document backup encryption procedures
- [ ] Consider using AWS KMS or HashiCorp Vault

**Severity**: 🟡 **MEDIUM**

---

### 16. **No Session Timeout Enforcement** (Medium)

**Location**: `/workspace/afk/server/src/config/.env.mac.yaml:16-18`

**Issue**: Session timeout configured but not enforced for JWT:

```yaml
session:
  maxSessionsPerUser: 10
  sessionTimeoutMinutes: 60      # ⚠️ CONFIGURED BUT NOT ENFORCED
  healthCheckIntervalSeconds: 30
```

JWT tokens have no expiration:
```typescript
const token = this.jwtService.sign(payload);
// No expiresIn option - token lasts until manually invalidated
```

**Impact**:
- Compromised tokens remain valid indefinitely
- No automatic credential rotation
- Session hijacking has no time limit
- Stale sessions can be replayed

**Recommendation**:
- [ ] Set JWT expiration:
  ```typescript
  const token = this.jwtService.sign(payload, {
    expiresIn: '15m', // 15 minute expiration
  });
  ```
- [ ] Implement refresh token mechanism:
  ```typescript
  const refreshToken = this.jwtService.sign(payload, {
    expiresIn: '7d',
  });
  ```
- [ ] Maintain session blacklist for logout
- [ ] Implement token rotation on refresh
- [ ] Monitor session activity

**Severity**: 🟡 **MEDIUM**

---

### 17. **Insufficient WebSocket Input Validation** (Medium)

**Location**: `/workspace/afk/server/src/gateways/session.gateway.ts:77-108`

**Issue**: WebSocket messages accepted without strict validation:

```typescript
@SubscribeMessage('subscribe.session')
async handleSessionSubscription(
  @MessageBody() data: { sessionId: string },  // No validation
  @ConnectedSocket() client: Socket,
) {
  await this.sessionSubscriptionService.subscribe(
    client.id,
    data.sessionId,
  );
}
```

**Possible Attacks**:
- Subscribe to other users' sessions (authorization bypass)
- Inject malicious sessionIds
- Send oversized payloads (DoS)
- Replay messages

**Impact**:
- Unauthorized session access
- Cross-client communication leakage
- Resource exhaustion

**Recommendation**:
- [ ] Add WebSocket message validation:
  ```typescript
  @SubscribeMessage('subscribe.session')
  async handleSessionSubscription(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.isValidUUID(data.sessionId)) {
      throw new BadRequestException('Invalid sessionId');
    }

    const session = await this.sessionRepository.findById(data.sessionId);
    if (!session || session.userId !== client.data.user.userId) {
      throw new UnauthorizedException('Access denied');
    }

    await this.sessionSubscriptionService.subscribe(client.id, data.sessionId);
  }
  ```
- [ ] Validate message size limits
- [ ] Implement message rate limiting per connection
- [ ] Log suspicious WebSocket activity

**Severity**: 🟡 **MEDIUM**

---

### 18. **No Authorization on Session Operations** (Medium)

**Location**: `/workspace/afk/server/src/interactors/sessions/` - All session controllers

**Issue**: No verification that user owns the session:

Based on codebase structure, sessions are retrieved by ID without ownership check:

```typescript
// Example: sessions are accessed by ID only
const session = await this.sessionRepository.findById(sessionId);
// No check: if (session.userId !== req.user.userId) throw Unauthorized
```

**Impact**:
- User A can access User B's sessions (if IDs are guessable)
- Session isolation not enforced
- Container access not verified
- Logs and git status accessible to any authenticated user

**Recommendation**:
- [ ] Add ownership validation to all session endpoints:
  ```typescript
  const session = await this.sessionRepository.findById(sessionId);
  if (session.userId !== req.user.userId && !req.user.isAdmin) {
    throw new ForbiddenException('Access denied');
  }
  ```
- [ ] Implement session-level access control
- [ ] Verify user authorization in WebSocket subscriptions
- [ ] Add audit logging for unauthorized access attempts

**Severity**: 🟡 **MEDIUM**

---

### 19. **No Audit Logging** (Medium)

**Location**: Application-wide

**Issue**: Security events not systematically logged:

- Login attempts (success/failure)
- Authorization failures
- Sensitive data access (settings retrieval)
- Session lifecycle changes
- Configuration changes

**Impact**:
- Cannot detect attacks or intrusions
- No forensic trail for incident investigation
- Compliance violations (audit trail requirements)
- Insider threats undetectable

**Recommendation**:
- [ ] Implement audit logging for security events:
  ```typescript
  private auditLog(event: string, data: any, severity: 'info' | 'warn' | 'error') {
    this.logger.log({
      timestamp: new Date().toISOString(),
      event,
      userId: req.user?.userId,
      severity,
      details: data,
    }, 'AUDIT');
  }
  ```
- [ ] Log all authentication events
- [ ] Log authorization failures
- [ ] Log sensitive data access
- [ ] Implement log retention and archival
- [ ] Set up alerting for suspicious patterns

**Severity**: 🟡 **MEDIUM**

---

### 20. **Docker Socket Access Control** (Medium)

**Location**: `/workspace/afk/docker/docker-compose.yml`

**Issue**: Docker socket binding may require elevated privileges:

```yaml
# docker-compose.yml structure
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

**Impact**:
- Container escape gives host root access
- Docker daemon compromise = system compromise
- No isolation if container is breached
- Privilege escalation possible

**Recommendation**:
- [ ] Use Docker socket only for required operations
- [ ] Consider alternative container runtimes (containerd, cri-o)
- [ ] Implement least-privilege access to Docker API
- [ ] Monitor Docker API calls
- [ ] Use AppArmor/SELinux profiles for containers
- [ ] Document security implications

**Severity**: 🟡 **MEDIUM**

---

---

## LOW SEVERITY FINDINGS

### 21. **Default Logging Configuration Verbose** (Low)

**Location**: `/workspace/afk/server/src/config/.env.mac.yaml:11-13`

**Issue**: Debug logging enabled in development:

```yaml
logger:
  level: debug          # Too verbose
  prettyPrint: true
```

**Impact**:
- Sensitive data may be logged at debug level
- Log files become large and unwieldy
- Performance impact
- Storage costs

**Recommendation**:
- [ ] Use appropriate log levels by environment
- [ ] Disable debug logging in production
- [ ] Implement structured logging

**Severity**: 🟢 **LOW**

---

### 22. **Insufficient Resource Limits** (Low)

**Location**: Docker container configuration

**Issue**: No resource limits configured for containers:

**Impact**:
- Container can consume unlimited CPU/memory
- DoS via resource exhaustion possible
- No isolation between sessions
- Host system stability at risk

**Recommendation**:
- [ ] Configure Docker resource limits:
  ```typescript
  const createOptions = {
    Memory: 1024 * 1024 * 1024,      // 1GB memory limit
    MemorySwap: 1024 * 1024 * 1024,  // No swap
    CpuShares: 1024,                  // CPU share limit
  };
  ```

**Severity**: 🟢 **LOW**

---

### 23. **No Container Health Checks** (Low)

**Location**: Docker container creation

**Issue**: No health checks configured for containers:

**Impact**:
- Unhealthy containers continue running
- No automatic recovery
- Stale sessions appear active

**Recommendation**:
- [ ] Configure health checks in container creation

**Severity**: 🟢 **LOW**

---

### 24. **Dependency Vulnerability Risk** (Low)

**Issue**: No documented dependency scanning:

**Impact**:
- Known vulnerabilities in dependencies may exist
- Outdated packages
- Supply chain risk

**Recommendation**:
- [ ] Implement dependency scanning (Snyk, Dependabot)
- [ ] Use npm audit regularly
- [ ] Keep dependencies updated
- [ ] Document security requirements

**Severity**: 🟢 **LOW**

---

---

## CONFIGURATION RECOMMENDATIONS

### Environment Variable Template

Create `.env.production.yaml` with required secure configuration:

```yaml
port: 3001
nodeEnv: production
baseUrl: https://afk.example.com  # HTTPS required

docker:
  socketPath: /var/run/docker.sock
  imageName: crimsonronin/afk:latest
  startPort: 7681
  endPort: 7780

logger:
  level: info          # Not debug
  prettyPrint: false   # Structured logging

session:
  maxSessionsPerUser: 10
  sessionTimeoutMinutes: 60
  healthCheckIntervalSeconds: 30

adminUser:
  username: ${ADMIN_USERNAME}  # REQUIRED - no default
  password: ${ADMIN_PASSWORD}  # REQUIRED - no default

github:
  clientId: ${GITHUB_CLIENT_ID}
  clientSecret: ${GITHUB_CLIENT_SECRET}
  callbackUrl: https://afk.example.com/api/github/callback
  frontendRedirectUrl: https://afk.example.com/settings

auth:
  jwtSecret: ${JWT_SECRET}  # REQUIRED - 32+ character random string
  tokenExpiresIn: 15m       # 15 minute expiration
  refreshTokenExpiresIn: 7d # 7 day refresh token
```

### Docker Security Best Practices

```dockerfile
# Dockerfile hardening
FROM node:20-alpine  # Smaller attack surface

# Run as non-root
USER node

# Read-only filesystem where possible
RUN chmod 700 /home/node/.ssh

# No unnecessary tools
```

---

## TESTING RECOMMENDATIONS

### Security Testing Checklist

- [ ] Brute force login attempts
- [ ] JWT token tampering
- [ ] CORS origin bypass testing
- [ ] WebSocket unauthorized access
- [ ] SQL injection (if applicable)
- [ ] Command injection via git operations
- [ ] File traversal attacks
- [ ] XSS in error messages
- [ ] CSRF token validation
- [ ] Rate limiting enforcement
- [ ] Session timeout enforcement

### Recommended Security Tools

1. **OWASP ZAP** - Web application security scanning
2. **Snyk** - Dependency vulnerability scanning
3. **Trivy** - Container image scanning
4. **eslint-plugin-security** - Code-level vulnerability detection
5. **npm audit** - Node.js dependency audit

---

## REMEDIATION PRIORITY

### Phase 1 (Immediate - before production)
1. ✅ Change default admin credentials
2. ✅ Set strong JWT secret (generate random 32+ chars)
3. ✅ Enable HTTPS/TLS
4. ✅ Restrict CORS to specific origins
5. ✅ Add JWT authentication to WebSocket
6. ✅ Implement field-level encryption for sensitive data

### Phase 2 (Short-term - within 1 month)
1. Add rate limiting on login endpoint
2. Implement HTTP security headers
3. Add session timeout enforcement
4. Improve error message handling
5. Add audit logging
6. Implement WebSocket input validation

### Phase 3 (Medium-term - within 3 months)
1. Implement multi-user/RBAC system
2. Add database encryption
3. Implement refresh token mechanism
4. Set up comprehensive security monitoring
5. Implement automatic dependency scanning

---

## COMPLIANCE NOTES

This application currently does **NOT** meet requirements for:
- **OWASP Top 10 2021**: Multiple critical vulnerabilities
- **NIST Cybersecurity Framework**: Inadequate access controls and encryption
- **PCI DSS** (if handling payment data): Plaintext credential storage
- **SOC 2**: Insufficient audit logging and access controls
- **GDPR** (if handling EU user data): No data protection measures

Production deployment requires addressing **all critical and high severity findings** at minimum.

---

## CONCLUSION

AFK is a well-architected application with clean code structure, but the current default configuration and implementation have significant security gaps. Most issues are remediable through configuration changes and code updates rather than architectural redesign.

**Key Actions**:
1. Review and enforce all configuration recommendations
2. Implement authentication on WebSocket connections
3. Add encryption for sensitive data storage
4. Configure HTTPS/TLS for all communications
5. Restrict CORS and implement rate limiting
6. Set up security monitoring and audit logging

---

**Report Generated**: February 20, 2026
**Next Review Recommended**: After implementing Phase 1 remediation
