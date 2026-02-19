# Security Audit Report

**Project:** AFK (Away From Keyboard)
**Date:** 2026-02-19
**Auditor:** Claude Code Security Analysis
**Severity Levels:** Critical | High | Medium | Low | Info

---

## Executive Summary

This security audit identified **23 security issues** across the AFK codebase, including critical vulnerabilities in authentication, Docker configuration, and secrets management. The most critical issues include plaintext password storage, overly permissive Docker configurations, and weak default secrets.

### Summary by Severity

- **Critical:** 5 issues
- **High:** 8 issues
- **Medium:** 6 issues
- **Low:** 3 issues
- **Info:** 1 issue

---

## Critical Vulnerabilities

### 1. Plaintext Password Storage and Comparison

**File:** `server/src/auth/auth.service.ts:34`

**Issue:** Passwords are stored and compared in plaintext without hashing.

```typescript
if (username !== adminUser.username || password !== adminUser.password) {
```

**Impact:** If the configuration file or memory is compromised, attackers gain immediate access to admin credentials. This violates OWASP A02:2021 - Cryptographic Failures.

**Recommendation:**
- Use bcrypt, argon2, or scrypt to hash passwords
- Never store plaintext passwords
- Implement proper password comparison using timing-safe functions

---

### 2. Hardcoded Default JWT Secret

**File:** `server/src/auth/auth.module.ts:10-12`

**Issue:** JWT secret has a weak default value that may be used in production.

```typescript
secret: process.env.JWT_SECRET || 'afk-development-secret-key-change-in-production',
```

**Impact:** If JWT_SECRET is not set, all JWT tokens can be forged by attackers who know the default secret. This allows complete authentication bypass.

**Recommendation:**
- Require JWT_SECRET as a mandatory environment variable
- Fail application startup if JWT_SECRET is not configured
- Generate strong random secrets (minimum 256 bits)
- Never use default secrets in production

---

### 3. Docker Privileged Mode Enabled

**Files:**
- `docker/docker-compose.yml:25`
- `server/src/services/docker/docker-engine.service.ts:63`

**Issue:** Containers are created with `privileged: true`, granting full access to the host system.

```yaml
privileged: true
```

**Impact:** Privileged containers can:
- Access all host devices
- Bypass security constraints
- Potentially escape to host system
- Compromise other containers and the host

**Recommendation:**
- Remove privileged mode unless absolutely necessary
- Use specific capabilities instead (e.g., CAP_NET_ADMIN)
- Implement security profiles (AppArmor, SELinux)
- Consider alternatives to mounting Docker socket

---

### 4. Docker Socket Mounted in Containers

**Files:**
- `docker/docker-compose.yml:24`
- `server/src/services/docker/docker-engine.service.ts:59`

**Issue:** Docker socket is mounted inside containers, allowing full Docker daemon control.

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

**Impact:** Any compromise of the container grants:
- Full control over Docker daemon
- Ability to create/destroy containers
- Potential host system escape
- Access to all containers and their data

**Recommendation:**
- Use Docker API over TCP with TLS authentication
- Implement Docker socket proxy with restricted permissions
- Consider rootless Docker
- Use dedicated container orchestration solutions

---

### 5. No Rate Limiting on Authentication Endpoints

**File:** `server/src/auth/auth.controller.ts:26-38`

**Issue:** Login endpoint has no rate limiting or brute force protection.

**Impact:** Attackers can:
- Perform unlimited brute force attacks
- Enumerate valid usernames
- Cause denial of service
- Eventually crack weak passwords

**Recommendation:**
- Implement rate limiting (e.g., using @nestjs/throttler)
- Add progressive delays after failed attempts
- Implement account lockout after N failed attempts
- Use CAPTCHA for repeated failures
- Monitor and alert on suspicious login patterns

---

## High Severity Issues

### 6. Credentials Logged in Debug Mode

**File:** `server/src/auth/auth.controller.ts:37`

**Issue:** Login credentials are logged, potentially exposing passwords.

```typescript
this.logger.debug('Logging in with', credentials);
```

**Impact:** Passwords may appear in log files, monitoring systems, or error tracking platforms.

**Recommendation:**
- Never log credentials or sensitive data
- Redact sensitive fields in logging middleware
- Use structured logging with field-level control

---

### 7. CORS Enabled Without Restrictions

**File:** `server/src/libs/app-factory/application.factory.ts:44`

**Issue:** CORS is enabled without any origin restrictions.

```typescript
app.enableCors();
```

**Impact:** Any website can make requests to the API, enabling:
- CSRF attacks
- Data exfiltration
- Credential theft via malicious websites

**Recommendation:**
- Specify allowed origins explicitly
- Use credentials: true only with specific origins
- Implement CSRF tokens for state-changing operations
- Consider using SameSite cookie attributes

---

### 8. WebSocket Authentication Not Enforced

**File:** `server/src/gateways/session.gateway.ts:41-74`

**Issue:** WebSocket connections have no authentication checks on connection or subscription.

```typescript
async handleConnection(client: Socket) {
  // No authentication check
}
```

**Impact:** Unauthenticated users can:
- Subscribe to session updates
- Monitor container logs
- Access sensitive information
- Cause denial of service

**Recommendation:**
- Implement WebSocket authentication middleware
- Verify JWT tokens on connection
- Check authorization before allowing subscriptions
- Implement per-message authentication for sensitive operations

---

### 9. Missing Security Headers

**File:** `server/src/libs/app-factory/application.factory.ts`

**Issue:** No security headers are configured (helmet.js not used).

**Impact:** Missing headers allow:
- Clickjacking attacks (no X-Frame-Options)
- MIME sniffing (no X-Content-Type-Options)
- XSS attacks (no CSP)
- Insecure connections (no HSTS)

**Recommendation:**
- Install and configure helmet.js
- Set strict Content-Security-Policy
- Enable HSTS with includeSubDomains
- Add X-Frame-Options: DENY
- Set X-Content-Type-Options: nosniff

---

### 10. SSH Private Keys Passed as Environment Variables

**Files:**
- `docker/docker-compose.yml:14`
- `server/src/services/docker/docker-engine.service.ts:240-242`

**Issue:** SSH private keys are passed through environment variables.

```yaml
- SSH_PRIVATE_KEY=${SSH_PRIVATE_KEY}
```

**Impact:** SSH keys may be:
- Visible in process listings
- Logged by container orchestration systems
- Exposed through container inspection
- Leaked in error messages or dumps

**Recommendation:**
- Use Docker secrets or Kubernetes secrets
- Mount keys as files from secure storage
- Use SSH agent forwarding instead
- Rotate keys regularly
- Consider using deploy keys with limited scope

---

### 11. Command Injection Risk in Git Scripts

**File:** `docker/scripts/init-git.sh:133,164`

**Issue:** URL and branch parameters are used in shell commands without proper sanitization.

```bash
git clone "$url" "$target_dir" 2>&1
git checkout "$branch"
```

**Impact:** Malicious input could:
- Execute arbitrary commands
- Exfiltrate data
- Compromise the container
- Pivot to other systems

**Recommendation:**
- Sanitize and validate all inputs
- Use git command options to prevent injection
- Consider using git libraries instead of shell commands
- Implement allowlists for URL patterns

---

### 12. No Input Validation on Container Creation

**File:** `server/src/services/docker/docker-engine.service.ts:226-249`

**Issue:** Environment variables from user input are passed directly to containers without sanitization.

**Impact:** Malicious users can:
- Inject environment variables
- Override critical container settings
- Execute commands if variables are interpreted
- Access sensitive host information

**Recommendation:**
- Validate all input parameters
- Use allowlists for environment variable names
- Sanitize values before passing to Docker API
- Implement least privilege for container permissions

---

### 13. Session Data Exposed Through WebSocket

**File:** `server/src/gateways/session.gateway.ts:142-148`

**Issue:** Session updates are broadcast without checking if recipients are authorized.

```typescript
this.server.to(`session:${sessionId}`).emit('session.updated', {
  sessionId,
  update,
});
```

**Impact:** Users can receive updates for sessions they don't own by joining arbitrary rooms.

**Recommendation:**
- Implement authorization checks for room joining
- Verify user owns session before broadcasting
- Use user-specific rooms instead of session-based rooms
- Implement row-level security

---

## Medium Severity Issues

### 14. Weak Minimum Password Length

**File:** `server/src/libs/config/admin-user.config.ts:9`

**Issue:** Minimum password length is only 6 characters.

```typescript
@MinLength(6, { message: 'Password must be at least 6 characters long' })
```

**Impact:** Allows weak passwords that are easily cracked through brute force attacks.

**Recommendation:**
- Increase minimum to 12+ characters
- Require password complexity (uppercase, lowercase, numbers, symbols)
- Implement password strength meter
- Check against common password lists

---

### 15. Insufficient Error Handling Reveals Internal Details

**File:** `server/src/gateways/session.gateway.ts:70-73`

**Issue:** Error messages may expose internal system details.

```typescript
return {
  event: 'subscription.error',
  data: { error: error.message },
};
```

**Impact:** Detailed error messages help attackers:
- Map internal system architecture
- Identify vulnerable components
- Craft targeted attacks

**Recommendation:**
- Return generic error messages to clients
- Log detailed errors server-side only
- Implement error codes instead of messages
- Use error monitoring service for detailed tracking

---

### 16. No Session Timeout or Token Refresh

**File:** `server/src/auth/auth.module.ts:13`

**Issue:** JWT tokens expire after 24 hours but there's no refresh mechanism.

```typescript
signOptions: { expiresIn: '24h' },
```

**Impact:**
- Stolen tokens remain valid for 24 hours
- No way to invalidate compromised tokens
- Long-lived sessions increase attack window

**Recommendation:**
- Implement shorter access token expiry (15-30 minutes)
- Add refresh token mechanism
- Store token revocation list
- Implement logout functionality that invalidates tokens
- Consider using Redis for token blacklisting

---

### 17. Git URL Validation Can Be Bypassed

**File:** `server/src/libs/validators/git-url.validator.ts:21-25`

**Issue:** Regex patterns may not cover all edge cases and could be bypassed.

```typescript
const sshPattern = /^git@[\w\.\-]+:[\w\-\/]+\.git$/;
const httpsPattern = /^https?:\/\/[\w\.\-]+(:\d+)?\/[\w\-\/]+(\.git)?$/;
```

**Impact:**
- Malicious URLs could bypass validation
- Internal network access via SSRF
- Access to unintended resources

**Recommendation:**
- Use URL parsing library (like url-parse)
- Implement strict allowlists for domains
- Block internal IP ranges and private networks
- Validate protocol explicitly
- Consider using git provider APIs instead

---

### 18. Container Logs Streamed Without Access Control

**File:** `server/src/gateways/session.gateway.ts:94-125`

**Issue:** Any authenticated user can subscribe to logs of any container by knowing the containerId.

**Impact:**
- Users can access logs of other users' sessions
- Potential information disclosure
- Privacy violations

**Recommendation:**
- Verify user owns the session before streaming logs
- Implement authorization checks
- Log access attempts for audit trail

---

### 19. No Request Size Limits

**Issue:** No global request size limits are configured.

**Impact:**
- Denial of service through large payloads
- Memory exhaustion
- Service unavailability

**Recommendation:**
- Configure body-parser with size limits
- Implement request size validation
- Set WebSocket message size limits
- Monitor and alert on unusual request sizes

---

## Low Severity Issues

### 20. Excessive Logging of User Information

**Files:**
- `server/src/auth/auth.service.ts:31,35,47`
- `server/src/auth/auth.guard.ts:34,43,51`

**Issue:** Usernames and authentication attempts are logged frequently.

**Impact:**
- Privacy concerns
- Large log files
- Potential GDPR violations

**Recommendation:**
- Reduce logging verbosity in production
- Implement log retention policies
- Consider privacy regulations
- Use log sampling for high-frequency events

---

### 21. Default Git Configuration Not Secure

**File:** `docker/scripts/start-claude.sh:146`

**Issue:** StrictHostKeyChecking is set to accept-new instead of yes.

```bash
git config --global core.sshCommand "ssh -o StrictHostKeyChecking=accept-new"
```

**Impact:** Vulnerable to MITM attacks on first connection to new hosts.

**Recommendation:**
- Use StrictHostKeyChecking=yes
- Pre-populate known_hosts with trusted keys
- Verify host key fingerprints

---

### 22. Bash Scripts Use 'set -e' Without Proper Error Handling

**Files:** Multiple shell scripts

**Issue:** Scripts exit on error but may leave system in inconsistent state.

**Impact:**
- Partial configuration applied
- Resources not cleaned up
- Difficult to debug failures

**Recommendation:**
- Add trap handlers for cleanup
- Implement proper error handling for critical operations
- Use 'set -euo pipefail' for stricter error handling
- Add detailed error messages

---

## Informational

### 23. Swagger Documentation Publicly Accessible

**File:** `server/src/main.ts:20`

**Issue:** API documentation is available without authentication at `/api/docs`.

**Impact:** Attackers can easily enumerate:
- All API endpoints
- Request/response schemas
- Authentication requirements

**Recommendation:**
- Protect Swagger UI with authentication in production
- Consider removing in production entirely
- Use environment-based configuration
- Document API separately in secure location

---

## Additional Recommendations

### Security Best Practices

1. **Dependency Security**
   - Implement automated dependency scanning (npm audit, Snyk)
   - Keep dependencies updated
   - Monitor for security advisories
   - Use lock files to ensure reproducible builds

2. **Secrets Management**
   - Use dedicated secrets management (Vault, AWS Secrets Manager)
   - Implement secret rotation
   - Never commit secrets to version control
   - Use .env.example files without actual values

3. **Container Security**
   - Use minimal base images (Alpine, Distroless)
   - Run containers as non-root users
   - Implement resource limits (CPU, memory)
   - Scan images for vulnerabilities
   - Use multi-stage builds to reduce attack surface

4. **Monitoring and Logging**
   - Implement centralized logging
   - Set up security event monitoring
   - Configure alerts for suspicious activity
   - Regular security log reviews
   - Implement audit trails

5. **Network Security**
   - Use internal networks for container communication
   - Implement network segmentation
   - Use TLS for all network communications
   - Configure firewalls properly
   - Implement egress filtering

6. **Testing**
   - Add security test cases
   - Implement integration tests with security focus
   - Perform regular penetration testing
   - Set up automated security testing in CI/CD

---

## Priority Remediation Plan

### Phase 1: Critical (Immediate - Week 1)

1. Implement password hashing (Issue #1)
2. Require JWT_SECRET environment variable (Issue #2)
3. Add rate limiting to authentication (Issue #5)
4. Implement WebSocket authentication (Issue #8)

### Phase 2: High (Short-term - Weeks 2-3)

1. Remove or secure Docker privileged mode (Issue #3)
2. Implement CORS restrictions (Issue #7)
3. Add security headers with helmet.js (Issue #9)
4. Secure SSH key handling (Issue #10)
5. Add input validation and sanitization (Issues #11, #12)

### Phase 3: Medium (Mid-term - Month 1)

1. Strengthen password requirements (Issue #14)
2. Implement token refresh mechanism (Issue #16)
3. Improve Git URL validation (Issue #17)
4. Add access control to container logs (Issue #18)
5. Configure request size limits (Issue #19)

### Phase 4: Low & Info (Ongoing)

1. Reduce excessive logging (Issue #20)
2. Improve error handling in scripts (Issue #22)
3. Protect Swagger documentation (Issue #23)
4. Implement security best practices

---

## Compliance Considerations

This application should be evaluated against:

- **OWASP Top 10 2021**: Multiple issues align with OWASP categories
- **CWE Top 25**: Several CWE patterns identified
- **Docker CIS Benchmarks**: Docker configuration issues
- **NIST Cybersecurity Framework**: Implement comprehensive security controls
- **GDPR**: If handling EU user data, review logging and data retention

---

## Testing Recommendations

1. **Automated Security Testing**
   - Set up SAST tools (SonarQube, Semgrep)
   - Configure DAST scanning
   - Implement dependency vulnerability scanning

2. **Manual Testing**
   - Perform penetration testing
   - Code review with security focus
   - Threat modeling sessions

3. **Continuous Monitoring**
   - Runtime application security monitoring
   - Container security scanning
   - Network traffic analysis

---

## Conclusion

The AFK project has several critical security vulnerabilities that should be addressed before production deployment. The most pressing issues are:

1. Plaintext password storage
2. Weak authentication mechanisms
3. Overly permissive Docker configurations
4. Lack of rate limiting and input validation
5. Missing authentication on WebSocket connections

Implementing the recommended fixes will significantly improve the security posture of the application. Regular security reviews and updates should be conducted as the project evolves.

---

**Report Version:** 1.0
**Last Updated:** 2026-02-19

For questions or clarifications about this security audit, please review the specific file references and line numbers provided for each issue.
