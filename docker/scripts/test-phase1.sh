#!/bin/bash
#
# Test script for Phase 1 Git Integration
# This script validates all components of the Phase 1 implementation
#

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    log_test "Running: $test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        log_info "✓ PASSED: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log_error "✗ FAILED: $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Print test banner
print_banner() {
    echo
    echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         Phase 1 Integration Tests            ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
    echo
}

# Test script directory
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

echo "Testing from script directory: $SCRIPT_DIR"

# Test 1: Verify all required scripts exist
test_scripts_exist() {
    log_test "Checking if all required scripts exist"
    
    local scripts=(
        "init-git.sh"
        "setup-ssh.sh"
        "start-claude.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ ! -f "$SCRIPT_DIR/$script" ]; then
            log_error "Missing script: $script"
            return 1
        fi
        
        if [ ! -x "$SCRIPT_DIR/$script" ]; then
            log_error "Script not executable: $script"
            return 1
        fi
    done
    
    return 0
}

# Test 2: Verify Dockerfile has been updated
test_dockerfile_updated() {
    log_test "Checking Dockerfile updates"
    
    local dockerfile="$SCRIPT_DIR/../Dockerfile"
    
    if [ ! -f "$dockerfile" ]; then
        log_error "Dockerfile not found"
        return 1
    fi
    
    # Check if openssh-client is installed
    if ! grep -q "openssh-client" "$dockerfile"; then
        log_error "openssh-client not found in Dockerfile"
        return 1
    fi
    
    # Check if scripts are copied
    if ! grep -q "COPY scripts/" "$dockerfile"; then
        log_error "Scripts not copied in Dockerfile"
        return 1
    fi
    
    # Check if CMD is updated
    if ! grep -q "start-claude.sh" "$dockerfile"; then
        log_error "CMD not updated in Dockerfile"
        return 1
    fi
    
    return 0
}

# Test 3: Verify Docker Compose configuration
test_docker_compose_updated() {
    log_test "Checking Docker Compose configuration"
    
    local compose_file="$SCRIPT_DIR/../docker-compose.yml"
    
    if [ ! -f "$compose_file" ]; then
        log_error "docker-compose.yml not found"
        return 1
    fi
    
    # Check for git-related environment variables
    local required_vars=(
        "REPO_URL"
        "REPO_BRANCH"
        "SSH_PRIVATE_KEY"
        "GIT_USER_NAME"
        "GIT_USER_EMAIL"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "$var" "$compose_file"; then
            log_error "Environment variable $var not found in docker-compose.yml"
            return 1
        fi
    done
    
    return 0
}

# Test 4: Test git initialization script functionality
test_git_init_script() {
    log_test "Testing git initialization script functions"
    
    # Source the script to test functions
    if ! source "$SCRIPT_DIR/init-git.sh" >/dev/null 2>&1; then
        log_error "Failed to source init-git.sh"
        return 1
    fi
    
    # Test URL validation
    if ! validate_repo_url "https://github.com/user/repo.git" >/dev/null 2>&1; then
        log_error "URL validation failed for valid HTTPS URL"
        return 1
    fi
    
    if ! validate_repo_url "git@github.com:user/repo.git" >/dev/null 2>&1; then
        log_error "URL validation failed for valid SSH URL"
        return 1
    fi
    
    return 0
}

# Test 5: Test SSH setup script functionality
test_ssh_setup_script() {
    log_test "Testing SSH setup script functions"
    
    # Create temporary test environment
    local temp_home=$(mktemp -d)
    local old_home=$HOME
    export HOME=$temp_home
    
    # Source the script
    if ! source "$SCRIPT_DIR/setup-ssh.sh" >/dev/null 2>&1; then
        export HOME=$old_home
        rm -rf "$temp_home"
        log_error "Failed to source setup-ssh.sh"
        return 1
    fi
    
    # Test directory setup
    if ! setup_ssh_directory >/dev/null 2>&1; then
        export HOME=$old_home
        rm -rf "$temp_home"
        log_error "SSH directory setup failed"
        return 1
    fi
    
    # Cleanup
    export HOME=$old_home
    rm -rf "$temp_home"
    
    return 0
}

# Test 6: Test startup script syntax
test_startup_script_syntax() {
    log_test "Testing startup script syntax"
    
    # Check bash syntax
    if ! bash -n "$SCRIPT_DIR/start-claude.sh"; then
        log_error "Startup script has syntax errors"
        return 1
    fi
    
    return 0
}

# Test 7: Test startup script help
test_startup_script_help() {
    log_test "Testing startup script help function"
    
    if ! bash "$SCRIPT_DIR/start-claude.sh" --help >/dev/null 2>&1; then
        log_error "Startup script help function failed"
        return 1
    fi
    
    return 0
}

# Test 8: Verify required dependencies are available
test_dependencies() {
    log_test "Checking required dependencies"
    
    local deps=("git" "ssh" "base64" "curl")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" >/dev/null 2>&1; then
            log_warning "Dependency $dep not found (may be available in container)"
        fi
    done
    
    return 0
}

# Main test execution
main() {
    print_banner
    
    log_info "Starting Phase 1 integration tests..."
    echo
    
    # Run all tests
    run_test "Scripts Exist and Executable" "test_scripts_exist"
    run_test "Dockerfile Updated" "test_dockerfile_updated"
    run_test "Docker Compose Updated" "test_docker_compose_updated"
    run_test "Git Init Script Functions" "test_git_init_script"
    run_test "SSH Setup Script Functions" "test_ssh_setup_script"
    run_test "Startup Script Syntax" "test_startup_script_syntax"
    run_test "Startup Script Help" "test_startup_script_help"
    run_test "Dependencies Check" "test_dependencies"
    
    # Print results
    echo
    echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                Test Results                  ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
    echo
    echo "Tests Run:    $TESTS_RUN"
    echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
    echo
    
    if [ "$TESTS_FAILED" -eq 0 ]; then
        log_info "🎉 All tests passed! Phase 1 implementation is ready."
        echo
        log_info "Next steps:"
        echo "  1. Build the Docker image: docker-compose build"
        echo "  2. Test with public repo: REPO_URL=https://github.com/user/repo.git docker-compose up"
        echo "  3. Test with private repo using SSH_PRIVATE_KEY environment variable"
        echo
        return 0
    else
        log_error "❌ Some tests failed. Please review and fix the issues above."
        return 1
    fi
}

# Run tests
main "$@"