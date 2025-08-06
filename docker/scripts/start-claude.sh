#!/bin/bash
#
# Integrated startup script for AFK containers
# This script orchestrates git setup before launching Claude Code
#
# Flow:
# 1. Setup SSH (if needed)
# 2. Clone repository (if URL provided)
# 3. Configure git identity
# 4. cd to repository directory
# 5. Start Claude Code via ttyd
#

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Script directory
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

# Default values
DEFAULT_WORKSPACE="/workspace"
DEFAULT_TTYD_PORT="7681"

# Environment variables
REPO_URL="${REPO_URL:-}"
REPO_BRANCH="${REPO_BRANCH:-main}"
SSH_PRIVATE_KEY="${SSH_PRIVATE_KEY:-}"
GIT_USER_NAME="${GIT_USER_NAME:-Claude User}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-claude@example.com}"
WORKSPACE_DIR="${WORKSPACE_DIR:-$DEFAULT_WORKSPACE}"
TTYD_PORT="${TTYD_PORT:-$DEFAULT_TTYD_PORT}"

# State tracking
SSH_SETUP_DONE=false
GIT_SETUP_DONE=false
WORKING_DIR="$WORKSPACE_DIR"

# Setup SSH if SSH key is provided
setup_ssh() {
    if [ -n "$SSH_PRIVATE_KEY" ]; then
        log_step "Setting up SSH authentication"
        
        if [ -f "$SCRIPT_DIR/setup-ssh.sh" ]; then
            if bash "$SCRIPT_DIR/setup-ssh.sh"; then
                SSH_SETUP_DONE=true
                log_info "SSH setup completed successfully"
            else
                log_error "SSH setup failed"
                return 1
            fi
        else
            log_error "SSH setup script not found: $SCRIPT_DIR/setup-ssh.sh"
            return 1
        fi
    else
        log_info "No SSH key provided, skipping SSH setup"
        log_info "Only public repositories will be accessible"
    fi
}

# Clone repository and configure git
setup_git() {
    if [ -n "$REPO_URL" ]; then
        log_step "Setting up Git repository"
        
        # Export git configuration for the init script
        export GIT_USER_NAME
        export GIT_USER_EMAIL
        export REPO_BRANCH
        
        if [ -f "$SCRIPT_DIR/init-git.sh" ]; then
            # Run git initialization in workspace directory
            cd "$WORKSPACE_DIR"
            
            # Source SSH agent environment if available and run git init with environment
            if [ -f "$HOME/.ssh/agent.env" ]; then
                source "$HOME/.ssh/agent.env"
                env SSH_AUTH_SOCK="$SSH_AUTH_SOCK" SSH_AGENT_PID="$SSH_AGENT_PID" bash "$SCRIPT_DIR/init-git.sh" "$REPO_URL"
            else
                bash "$SCRIPT_DIR/init-git.sh" "$REPO_URL"
            fi
            
            if [ $? -eq 0 ]; then
                GIT_SETUP_DONE=true
                
                # Determine the repository directory name
                local repo_name
                repo_name=$(basename "$REPO_URL" .git)
                WORKING_DIR="$WORKSPACE_DIR/$repo_name"
                
                log_info "Git setup completed successfully"
                log_info "Repository cloned to: $WORKING_DIR"
            else
                log_error "Git setup failed"
                log_warning "Continuing without repository setup"
                # Don't fail the entire startup, just continue without git
            fi
        else
            log_error "Git initialization script not found: $SCRIPT_DIR/init-git.sh"
            log_warning "Continuing without repository setup"
        fi
    else
        log_info "No repository URL provided, skipping git setup"
        log_info "Starting Claude Code in workspace directory"
    fi
}

# Configure git identity (even without repository)
configure_git_identity() {
    log_step "Configuring git identity"
    
    # Set global git configuration
    git config --global user.name "$GIT_USER_NAME" 2>/dev/null || true
    git config --global user.email "$GIT_USER_EMAIL" 2>/dev/null || true
    
    # Set safe directory to avoid git ownership issues
    git config --global --add safe.directory '*' 2>/dev/null || true
    
    # Configure git to use SSH when available
    if [ "$SSH_SETUP_DONE" = true ]; then
        git config --global core.sshCommand "ssh -o StrictHostKeyChecking=accept-new"
    fi
    
    log_info "Git identity configured: $GIT_USER_NAME <$GIT_USER_EMAIL>"
}

# Start ttyd with simple claude command (no tmux)
start_claude_simple() {
    log_step "Starting Claude Code directly via ttyd (no tmux)"
    
    # Ensure working directory exists
    if [ ! -d "$WORKING_DIR" ]; then
        log_warning "Working directory $WORKING_DIR doesn't exist, creating it"
        mkdir -p "$WORKING_DIR"
    fi
    
    # Change to working directory
    cd "$WORKING_DIR"
    
    log_info "Starting ttyd on port $TTYD_PORT (simple mode)"
    log_info "Working directory: $(pwd)"
    log_info "Access the terminal at: http://localhost:$TTYD_PORT"
    
    # Start ttyd with claude directly - same as the original working command
    exec ttyd \
        --port "$TTYD_PORT" \
        --writable \
        claude
}

# Start ttyd with tmux session (original method)
start_claude_terminal() {
    log_step "Starting Claude Code terminal via ttyd with tmux"
    
    # Ensure working directory exists
    if [ ! -d "$WORKING_DIR" ]; then
        log_warning "Working directory $WORKING_DIR doesn't exist, creating it"
        mkdir -p "$WORKING_DIR"
    fi
    
    # Change to working directory
    cd "$WORKING_DIR"
    
    log_info "Starting ttyd on port $TTYD_PORT"
    log_info "Working directory: $(pwd)"
    log_info "Access the terminal at: http://localhost:$TTYD_PORT"
    
    # Create a custom tmux session with multiple windows
    local tmux_session="afk-main"
    
    # Start ttyd with a tmux session that has multiple windows pre-configured
    exec ttyd \
        --port "$TTYD_PORT" \
        --writable \
        --max-clients 5 \
        --terminal-type xterm-256color \
        --title-format "AFK Terminal - $(basename "$WORKING_DIR")" \
        bash -c "
            # Start tmux session with multiple windows
            tmux new-session -d -s '$tmux_session' -c '$WORKING_DIR'
            tmux new-window -t '$tmux_session:1' -n 'claude' -c '$WORKING_DIR'
            tmux new-window -t '$tmux_session:2' -n 'manual' -c '$WORKING_DIR'
            tmux select-window -t '$tmux_session:0'
            
            # Send welcome message to first window
            tmux send-keys -t '$tmux_session:0' 'echo \"Welcome to AFK Terminal!\"' Enter
            tmux send-keys -t '$tmux_session:0' 'echo \"Git setup: $GIT_SETUP_DONE, SSH setup: $SSH_SETUP_DONE\"' Enter
            tmux send-keys -t '$tmux_session:0' 'echo \"Use Ctrl+B, [0-2] to switch between windows\"' Enter
            tmux send-keys -t '$tmux_session:0' 'echo \"Window 0: Main, Window 1: Claude, Window 2: Manual\"' Enter
            tmux send-keys -t '$tmux_session:0' 'clear' Enter
            
            # Attach to the session
            tmux attach-session -t '$tmux_session'
        "
}

# Diagnostic version to debug tmux issues
start_claude_terminal_debug() {
    log_step "Starting Claude Code terminal via ttyd with tmux (DEBUG MODE)"
    
    # Ensure working directory exists
    if [ ! -d "$WORKING_DIR" ]; then
        log_warning "Working directory $WORKING_DIR doesn't exist, creating it"
        mkdir -p "$WORKING_DIR"
    fi
    
    # Change to working directory
    cd "$WORKING_DIR"
    
    log_info "Starting ttyd on port $TTYD_PORT (debug mode)"
    log_info "Working directory: $(pwd)"
    log_info "Access the terminal at: http://localhost:$TTYD_PORT"
    
    # Test 1: Simple tmux command without session creation
    log_info "Test 1: Running ttyd with simple tmux command"
    exec ttyd \
        --port "$TTYD_PORT" \
        --writable \
        --debug 2 \
        tmux new-session -A -s afk-main
}

# Alternative approach: Run tmux inside a shell
start_claude_terminal_alt1() {
    log_step "Starting Claude Code terminal via ttyd with tmux (Alternative 1)"
    
    # Ensure working directory exists
    if [ ! -d "$WORKING_DIR" ]; then
        log_warning "Working directory $WORKING_DIR doesn't exist, creating it"
        mkdir -p "$WORKING_DIR"
    fi
    
    # Change to working directory
    cd "$WORKING_DIR"
    
    log_info "Starting ttyd on port $TTYD_PORT (alt1)"
    log_info "Working directory: $(pwd)"
    log_info "Access the terminal at: http://localhost:$TTYD_PORT"
    
    # Start ttyd with bash that immediately runs tmux
    exec ttyd \
        --port "$TTYD_PORT" \
        --writable \
        bash -c "cd '$WORKING_DIR' && tmux new-session -A -s afk-main"
}

# Alternative approach: Use sh instead of bash
start_claude_terminal_alt2() {
    log_step "Starting Claude Code terminal via ttyd with tmux (Alternative 2)"
    
    # Ensure working directory exists
    if [ ! -d "$WORKING_DIR" ]; then
        log_warning "Working directory $WORKING_DIR doesn't exist, creating it"
        mkdir -p "$WORKING_DIR"
    fi
    
    # Change to working directory
    cd "$WORKING_DIR"
    
    log_info "Starting ttyd on port $TTYD_PORT (alt2)"
    log_info "Working directory: $(pwd)"
    log_info "Access the terminal at: http://localhost:$TTYD_PORT"
    
    # Use sh instead of bash
    exec ttyd \
        --port "$TTYD_PORT" \
        --writable \
        sh -c "cd '$WORKING_DIR' && exec tmux new-session -A -s afk-main"
}

# Dual TTY approach: Start two separate ttyd instances
start_claude_dual_tty() {
    log_step "Starting dual TTY sessions - Claude and Manual"
    
    # Environment variables for ports
    local claude_port="${CLAUDE_PORT:-7681}"
    local manual_port="${MANUAL_PORT:-7682}"
    
    # Ensure working directory exists
    if [ ! -d "$WORKING_DIR" ]; then
        log_warning "Working directory $WORKING_DIR doesn't exist, creating it"
        mkdir -p "$WORKING_DIR"
    fi
    
    # Change to working directory
    cd "$WORKING_DIR"
    
    log_info "Starting dual TTY sessions:"
    log_info "  Claude session: http://localhost:$claude_port"
    log_info "  Manual session: http://localhost:$manual_port"
    log_info "Working directory: $(pwd)"
    
    # Start manual bash session in background
    ttyd \
        --port "$manual_port" \
        --writable \
        bash &

    local manual_pid=$!
    log_info "Manual session started (PID: $manual_pid) on port $manual_port"

    # Wait a moment for the first session to start
    sleep 2
    
    # Start Claude session in foreground (this will block)
    log_info "Starting Claude session on port $claude_port"
    
    # Use same approach as simple mode - just call claude directly
    exec ttyd \
        --port "$claude_port" \
        --writable \
        claude
}

# Cleanup function
cleanup() {
    log_info "Shutting down AFK terminal"
    
    # Kill any remaining tmux sessions
    tmux kill-server 2>/dev/null || true
    
    # SSH cleanup - source the setup script to access cleanup function
    if [ "$SSH_SETUP_DONE" = true ] && [ -f "$SCRIPT_DIR/setup-ssh.sh" ]; then
        source "$SCRIPT_DIR/setup-ssh.sh"
        cleanup_ssh 2>/dev/null || true
    fi
    
    log_info "Cleanup completed"
}

# Register cleanup trap
trap cleanup EXIT INT TERM

# Health check function
health_check() {
    local max_attempts=30
    local attempt=1
    
    log_info "Performing health check..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$TTYD_PORT" >/dev/null 2>&1; then
            log_info "Health check passed - ttyd is responding"
            return 0
        fi
        
        log_info "Health check attempt $attempt/$max_attempts failed, retrying in 2 seconds..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Print startup banner
print_banner() {
    echo
    echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          AFK Terminal Startup        ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
    echo
    log_info "Repository URL: ${REPO_URL:-'Not provided'}"
    log_info "Repository Branch: $REPO_BRANCH"
    log_info "Git User: $GIT_USER_NAME <$GIT_USER_EMAIL>"
    log_info "SSH Key: ${SSH_PRIVATE_KEY:+'Provided'}${SSH_PRIVATE_KEY:-'Not provided'}"
    log_info "Working Directory: $WORKING_DIR"
    log_info "Terminal Mode: ${TERMINAL_MODE:-simple}"
    if [ "${TERMINAL_MODE:-simple}" = "dual" ]; then
        log_info "Claude Port: ${CLAUDE_PORT:-7681}"
        log_info "Manual Port: ${MANUAL_PORT:-7682}"
    else
        log_info "TTY Port: $TTYD_PORT"
    fi
    echo
}

# Main execution
main() {
    print_banner
    
    # Step 1: Setup SSH if needed
    if ! setup_ssh; then
        log_error "SSH setup failed, but continuing..."
    fi
    
    # Step 2: Setup Git repository if needed
    setup_git
    
    # Step 3: Configure git identity
    configure_git_identity
    
    # Step 4: Start Claude Code terminal
    log_step "Launching terminal interface"
    
    # Run health check in background after a delay
    (
        sleep 5
        health_check || log_warning "Health check failed, but terminal may still be accessible"
    ) &
    
    # Step 5: Start the terminal (this will block)
    # Select terminal mode based on TERMINAL_MODE environment variable
    TERMINAL_MODE="${TERMINAL_MODE:-simple}"
    
    case "$TERMINAL_MODE" in
        simple)
            log_info "Using simple mode (no tmux)"
            start_claude_simple
            ;;
        tmux)
            log_info "Using original tmux mode"
            start_claude_terminal
            ;;
        debug)
            log_info "Using debug mode"
            start_claude_terminal_debug
            ;;
        alt1)
            log_info "Using alternative 1 (bash -c with tmux)"
            start_claude_terminal_alt1
            ;;
        alt2)
            log_info "Using alternative 2 (sh -c with tmux)"
            start_claude_terminal_alt2
            ;;
        dual)
            log_info "Using dual TTY mode (separate Claude and Manual sessions)"
            start_claude_dual_tty
            ;;
        *)
            log_warning "Unknown terminal mode: $TERMINAL_MODE, defaulting to simple"
            start_claude_simple
            ;;
    esac
}

# Show usage information
usage() {
    echo "Usage: $0 [options]"
    echo
    echo "Environment Variables:"
    echo "  REPO_URL          - Git repository URL to clone"
    echo "  REPO_BRANCH       - Git branch to checkout (default: main)"
    echo "  SSH_PRIVATE_KEY   - Base64 encoded SSH private key"
    echo "  GIT_USER_NAME     - Git user name (default: Claude User)"
    echo "  GIT_USER_EMAIL    - Git user email (default: claude@example.com)"
    echo "  WORKSPACE_DIR     - Workspace directory (default: /workspace)"
    echo "  TTYD_PORT         - TTY port (default: 7681)"
    echo "  TERMINAL_MODE     - Terminal mode: simple, tmux, dual (default: simple)"
    echo "  CLAUDE_PORT       - Claude session port for dual mode (default: 7681)"
    echo "  MANUAL_PORT       - Manual session port for dual mode (default: 7682)"
    echo
    echo "Examples:"
    echo "  # Start with public repository"
    echo "  REPO_URL=https://github.com/user/repo.git $0"
    echo
    echo "  # Start with private repository"
    echo "  REPO_URL=git@github.com:user/repo.git SSH_PRIVATE_KEY=\$(cat key | base64) $0"
    echo
    echo "  # Start dual mode (Claude + Manual sessions)"
    echo "  TERMINAL_MODE=dual REPO_URL=https://github.com/user/repo.git $0"
    echo
    echo "  # Start without repository"
    echo "  $0"
    echo
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac