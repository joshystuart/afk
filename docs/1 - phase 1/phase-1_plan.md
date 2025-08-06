# Phase 1: Git Integration - Implementation Plan

## Overview
Phase 1 builds upon the MVP to add automatic git repository integration to the AFK Docker containers. This will enable containers to automatically clone repositories, configure SSH authentication, and start Claude Code sessions within the repository context.

## Objectives
- Add git functionality to the Docker container
- Implement automatic repository cloning on container startup
- Support SSH key authentication for private repositories
- Configure git environment for Claude Code sessions
- Maintain existing ttyd web terminal functionality

## Prerequisites
- Completed MVP with working Docker container (ttyd + claude)
- Understanding of existing docker/Dockerfile and docker/docker-compose.yml
- Git and SSH knowledge for implementation

## Implementation Tasks

### Task 1: Update Dockerfile for Git Support
**Description:** Enhance the existing Dockerfile to include git and SSH client capabilities.

**Steps:**
1. Add git package installation to the Dockerfile
2. Install openssh-client for SSH support
3. Create necessary directories for git configuration
4. Set up proper permissions for SSH operations

**Technical Details:**
- Base the changes on existing docker/Dockerfile
- Ensure minimal image size increase
- Maintain compatibility with existing ttyd setup

**Success Criteria:**
- Container includes git and ssh commands
- Git operations work within the container
- No conflicts with existing functionality

**Estimated Time:** 2-3 hours

### Task 2: Create Git Initialization Script
**Description:** Develop a script to handle repository cloning and initial setup.

**Steps:**
1. Create `docker/scripts/init-git.sh` script
2. Implement repository URL validation
3. Add branch selection logic (default to main/master)
4. Handle both HTTPS and SSH repository URLs
5. Implement error handling and logging

**Technical Details:**
```bash
#!/bin/bash
# Key functions:
# - validate_repo_url()
# - clone_repository()
# - checkout_branch()
# - setup_git_config()
```

**Success Criteria:**
- Script successfully clones various repository types
- Proper error messages for failures
- Respects branch configuration
- Sets up git user configuration

**Estimated Time:** 4-5 hours

### Task 3: Implement SSH Key Management
**Description:** Create secure SSH key handling for private repository access.

**Steps:**
1. Create `docker/scripts/setup-ssh.sh` script
2. Implement SSH key injection from environment variable
3. Configure SSH agent for key management
4. Set proper file permissions (600) for SSH keys
5. Add known_hosts management for GitHub/GitLab/Bitbucket

**Security Considerations:**
- SSH keys should be base64 encoded in environment variables
- Keys must be cleaned up on container termination
- No keys should be logged or exposed in container logs

**Technical Details:**
```bash
# Environment variable: SSH_PRIVATE_KEY (base64 encoded)
# Decode and set up in ~/.ssh/id_rsa
# Configure ssh-agent for session
```

**Success Criteria:**
- Private repositories can be cloned successfully
- SSH keys are securely handled
- No security vulnerabilities introduced

**Estimated Time:** 4-6 hours

### Task 4: Update Docker Compose Configuration
**Description:** Modify docker-compose.yml to support new git-related environment variables.

**Steps:**
1. Add REPO_URL environment variable
2. Add REPO_BRANCH environment variable (optional, default: main)
3. Add SSH_PRIVATE_KEY environment variable (optional)
4. Add GIT_USER_NAME and GIT_USER_EMAIL variables
5. Update documentation for new variables

**Example Configuration:**
```yaml
environment:
  - REPO_URL=${REPO_URL}
  - REPO_BRANCH=${REPO_BRANCH:-main}
  - SSH_PRIVATE_KEY=${SSH_PRIVATE_KEY}
  - GIT_USER_NAME=${GIT_USER_NAME:-Claude User}
  - GIT_USER_EMAIL=${GIT_USER_EMAIL:-claude@example.com}
```

**Success Criteria:**
- All git-related configurations can be passed via environment
- Sensible defaults for optional values
- Clear documentation for usage

**Estimated Time:** 2-3 hours

### Task 5: Create Integrated Startup Script
**Description:** Develop a master startup script that orchestrates git setup before launching Claude.

**Steps:**
1. Create `docker/scripts/start-claude.sh`
2. Call SSH setup if SSH_PRIVATE_KEY is provided
3. Call git initialization if REPO_URL is provided
4. Change to repository directory
5. Launch Claude Code session
6. Handle failures gracefully

**Flow:**
```
1. Setup SSH (if needed)
2. Clone repository (if URL provided)
3. Configure git identity
4. cd to repository directory
5. Start Claude Code
```

**Success Criteria:**
- Seamless integration of all components
- Claude starts in the correct directory
- Failures are handled without breaking container

**Estimated Time:** 3-4 hours

### Task 6: Update Container Entrypoint
**Description:** Modify the container's entrypoint to use the new integrated startup script.

**Steps:**
1. Update Dockerfile ENTRYPOINT or CMD
2. Ensure ttyd launches with the new startup script
3. Maintain web terminal accessibility
4. Test with various configurations

**Success Criteria:**
- Container starts successfully with and without git configuration
- Web terminal remains functional
- Claude Code operates normally

**Estimated Time:** 2-3 hours

## Testing Plan

### Unit Tests
1. Test git initialization script with various repository URLs
2. Test SSH key setup with different key formats
3. Test branch switching functionality
4. Test error handling for invalid configurations

### Integration Tests
1. Launch container with public HTTPS repository
2. Launch container with private SSH repository
3. Launch container without git configuration (MVP mode)
4. Test with different git providers (GitHub, GitLab, Bitbucket)

### Security Tests
1. Verify SSH keys are not exposed in logs
2. Confirm proper file permissions
3. Test key cleanup on container termination

## Success Criteria for Phase 1

1. **Functionality:**
   - Containers can automatically clone git repositories
   - SSH authentication works for private repositories
   - Claude Code sessions start in the repository directory
   - Existing ttyd functionality is preserved

2. **Security:**
   - SSH keys are handled securely
   - No sensitive information in logs
   - Proper file permissions maintained

3. **Usability:**
   - Simple environment variable configuration
   - Clear error messages for failures
   - Backwards compatibility with MVP

4. **Performance:**
   - Minimal impact on container startup time
   - Efficient git operations

## Risk Mitigation

1. **SSH Key Security:**
   - Use environment variables with base64 encoding
   - Implement proper cleanup procedures
   - Add documentation about key rotation

2. **Repository Access Failures:**
   - Implement retry logic
   - Provide clear error messages
   - Allow container to start without repository if needed

3. **Compatibility Issues:**
   - Test with multiple git providers
   - Support both HTTPS and SSH URLs
   - Handle various repository structures

## Dependencies
- Git package in container
- OpenSSH client
- Base64 utilities for key handling
- Existing MVP infrastructure

## Timeline Estimate
- Total estimated time: 21-31 hours
- Can be completed in 1-2 weeks with focused effort

## Next Steps
After Phase 1 completion, the system will be ready for Phase 2 (Server and Web Interface) which will build upon the git-integrated containers to provide a full web-based management interface.