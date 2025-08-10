#!/bin/bash
#
# SSH key setup script for AFK containers
# Handles SSH key injection from environment variables and configuration
#

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Create SSH directory if it doesn't exist
setup_ssh_directory() {
    local ssh_dir="$HOME/.ssh"
    
    if [ ! -d "$ssh_dir" ]; then
        log_info "Creating SSH directory: $ssh_dir"
        mkdir -p "$ssh_dir"
    fi
    
    # Set proper permissions
    chmod 700 "$ssh_dir"
    log_info "SSH directory permissions set to 700"
}

# Install SSH private key
install_ssh_key() {
    local ssh_key="$1"
    local key_file="$HOME/.ssh/id_rsa"
    
    if [ -z "$ssh_key" ]; then
        log_error "No SSH key provided"
        return 1
    fi
    
    log_info "Installing SSH private key"
    
    # Write the plain text key directly to file
    if echo "$ssh_key" > "$key_file" 2>/dev/null; then
        log_info "SSH key installed successfully"
    else
        log_error "Failed to install SSH key"
        return 1
    fi
    
    # Set proper permissions on the key
    chmod 600 "$key_file"
    log_info "SSH key permissions set to 600"
    
    # Generate public key from private key
    if ssh-keygen -y -f "$key_file" > "${key_file}.pub" 2>/dev/null; then
        log_info "Generated public key from private key"
        chmod 644 "${key_file}.pub"
    else
        log_warning "Could not generate public key from private key"
    fi
    
    return 0
}

# Configure SSH known hosts for common git providers
setup_known_hosts() {
    local known_hosts_file="$HOME/.ssh/known_hosts"
    
    log_info "Setting up known hosts for common git providers"
    
    # Create known_hosts file if it doesn't exist
    touch "$known_hosts_file"
    chmod 644 "$known_hosts_file"
    
    # GitHub
    if ! grep -q "github.com" "$known_hosts_file" 2>/dev/null; then
        log_info "Adding GitHub to known hosts"
        ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> "$known_hosts_file" 2>/dev/null || \
            log_warning "Failed to add GitHub to known hosts"
    fi
    
    # GitLab
    if ! grep -q "gitlab.com" "$known_hosts_file" 2>/dev/null; then
        log_info "Adding GitLab to known hosts"
        ssh-keyscan -t rsa,ecdsa,ed25519 gitlab.com >> "$known_hosts_file" 2>/dev/null || \
            log_warning "Failed to add GitLab to known hosts"
    fi
    
    # Bitbucket
    if ! grep -q "bitbucket.org" "$known_hosts_file" 2>/dev/null; then
        log_info "Adding Bitbucket to known hosts"
        ssh-keyscan -t rsa,ecdsa,ed25519 bitbucket.org >> "$known_hosts_file" 2>/dev/null || \
            log_warning "Failed to add Bitbucket to known hosts"
    fi
}

# Configure SSH client
configure_ssh_client() {
    local ssh_config="$HOME/.ssh/config"
    
    log_info "Configuring SSH client"
    
    # Create SSH config if it doesn't exist
    if [ ! -f "$ssh_config" ]; then
        cat > "$ssh_config" <<EOF
# SSH Configuration for Git Operations
Host *
    StrictHostKeyChecking accept-new
    UserKnownHostsFile ~/.ssh/known_hosts
    IdentityFile ~/.ssh/id_rsa
    ServerAliveInterval 60
    ServerAliveCountMax 3
EOF
        chmod 600 "$ssh_config"
        log_info "Created SSH config file"
    fi
}

# Start SSH agent and add key
start_ssh_agent() {
    local key_file="$HOME/.ssh/id_rsa"
    
    # Check if SSH agent is already running
    if [ -z "$SSH_AUTH_SOCK" ]; then
        log_info "Starting SSH agent"
        eval "$(ssh-agent -s)" > /dev/null
        
        # Export SSH agent variables for child processes
        echo "export SSH_AUTH_SOCK=$SSH_AUTH_SOCK" >> "$HOME/.ssh/agent.env"
        echo "export SSH_AGENT_PID=$SSH_AGENT_PID" >> "$HOME/.ssh/agent.env"
    else
        log_info "SSH agent already running"
    fi
    
    # Add key to agent
    if [ -f "$key_file" ]; then
        log_info "Adding SSH key to agent"
        ssh-add "$key_file" 2>/dev/null || {
            log_warning "Failed to add key to SSH agent (key might be passphrase protected)"
        }
    fi
}

# Test SSH connectivity
test_ssh_connectivity() {
    local test_host="${1:-git@github.com}"
    
    log_info "Testing SSH connectivity to $test_host"
    
    if ssh -T -o ConnectTimeout=10 "$test_host" 2>&1 | grep -q "successfully authenticated\|Hi\|Welcome"; then
        log_info "SSH connectivity test successful"
        return 0
    else
        log_warning "SSH connectivity test failed or timed out"
        return 1
    fi
}

# Cleanup function for container shutdown
cleanup_ssh() {
    log_info "Cleaning up SSH configuration"
    
    # Kill SSH agent if we started it
    if [ -f "$HOME/.ssh/agent.env" ]; then
        source "$HOME/.ssh/agent.env"
        if [ -n "$SSH_AGENT_PID" ]; then
            kill "$SSH_AGENT_PID" 2>/dev/null || true
        fi
        rm -f "$HOME/.ssh/agent.env"
    fi
    
    # Remove SSH keys
    rm -f "$HOME/.ssh/id_rsa" "$HOME/.ssh/id_rsa.pub"
    
    log_info "SSH cleanup completed"
}

# Note: Cleanup is handled by the parent startup script
# Do not register EXIT trap here as it would cleanup before git operations

# Main execution
main() {
    local ssh_key="${SSH_PRIVATE_KEY:-}"
    local custom_host="${GIT_SSH_HOST:-}"
    
    log_info "Starting SSH setup"
    
    # Create SSH directory
    setup_ssh_directory
    
    # Check if SSH key is provided
    if [ -z "$ssh_key" ]; then
        log_warning "No SSH_PRIVATE_KEY provided, skipping SSH setup"
        log_info "Only public repositories will be accessible"
        return 0
    fi
    
    # Install SSH key
    if ! install_ssh_key "$ssh_key"; then
        log_error "Failed to install SSH key"
        return 1
    fi
    
    # Setup known hosts
    setup_known_hosts
    
    # Add custom host if provided
    if [ -n "$custom_host" ]; then
        log_info "Adding custom host to known hosts: $custom_host"
        ssh-keyscan -t rsa,ecdsa,ed25519 "$custom_host" >> "$HOME/.ssh/known_hosts" 2>/dev/null || \
            log_warning "Failed to add custom host to known hosts"
    fi
    
    # Configure SSH client
    configure_ssh_client
    
    # Start SSH agent
    start_ssh_agent
    
    # Test connectivity (optional, non-blocking)
    if [ "${TEST_SSH_CONNECTIVITY:-true}" = "true" ]; then
        test_ssh_connectivity || log_warning "SSH connectivity test failed, but continuing"
    fi
    
    log_info "SSH setup completed successfully"
    
    # Save SSH setup status
    echo "SSH_SETUP_COMPLETE=true" > "$HOME/.ssh/setup-status"
    
    return 0
}

# Run main function
main "$@"