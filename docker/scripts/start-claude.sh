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
DEFAULT_CLAUDE_PORT="7681"
DEFAULT_MANUAL_PORT="7682"

# Environment variables
REPO_URL="${REPO_URL:-}"
REPO_BRANCH="${REPO_BRANCH:-main}"
SSH_PRIVATE_KEY="${SSH_PRIVATE_KEY:-}"
GIT_USER_NAME="${GIT_USER_NAME:-Claude User}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-claude@example.com}"
WORKSPACE_DIR="${WORKSPACE_DIR:-$DEFAULT_WORKSPACE}"
CLAUDE_PORT="${CLAUDE_PORT:-$DEFAULT_CLAUDE_PORT}"
MANUAL_PORT="${MANUAL_PORT:-$DEFAULT_MANUAL_PORT}"

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


# Dual TTY approach: Start two separate persistent screen sessions
start_claude_dual_tty() {
    log_step "Starting dual persistent tmux sessions - Claude and Manual"
    
    # Ensure working directory exists
    if [ ! -d "$WORKING_DIR" ]; then
        log_warning "Working directory $WORKING_DIR doesn't exist, creating it"
        mkdir -p "$WORKING_DIR"
    fi
    
    # Change to working directory
    cd "$WORKING_DIR"
    
    log_info "Starting dual persistent sessions:"
    log_info "  Claude session: http://localhost:$CLAUDE_PORT"
    log_info "  Manual session: http://localhost:$MANUAL_PORT"
    log_info "Working directory: $(pwd)"
    
    # Force cleanup any existing manual session and start fresh
    if tmux has-session -t manual-session 2>/dev/null; then
        log_info "Killing existing manual-session"
        tmux kill-session -t manual-session 2>/dev/null || true
    fi
    
    # Always create a new manual tmux session
    log_info "Creating new tmux session 'manual-session' with bash"
    # Configure tmux with better terminal settings
    tmux -f /home/node/.tmux.conf new-session -d -s manual-session -c "$WORKING_DIR" 'export TERM=xterm-256color; exec bash'
    sleep 1
    
    # Verify the manual session is working
    if ! tmux list-sessions | grep -q "manual-session"; then
        log_error "Failed to create manual-session"
        return 1
    fi
    
    # Start ttyd for manual session in background with themed client options
    ttyd \
        --port "$MANUAL_PORT" \
        --writable \
        --interface 0.0.0.0 \
        --terminal-type xterm-256color \
        --client-option disableLeaveAlert=true \
        --client-option theme='{"background":"#09090b","foreground":"#fafafa","cursor":"#10b981","cursorAccent":"#09090b","selectionBackground":"#18181b","selectionForeground":"#fafafa","black":"#09090b","red":"#ef4444","green":"#10b981","yellow":"#f59e0b","blue":"#3b82f6","magenta":"#8b5cf6","cyan":"#06b6d4","white":"#fafafa","brightBlack":"#52525b","brightRed":"#f87171","brightGreen":"#34d399","brightYellow":"#fbbf24","brightBlue":"#60a5fa","brightMagenta":"#a78bfa","brightCyan":"#22d3ee","brightWhite":"#ffffff"}' \
        --client-option fontSize=14 \
        --client-option fontFamily="'Menlo', 'Cascadia Code', 'Consolas', 'Ubuntu Mono', 'DejaVu Sans Mono', monospace" \
        --client-option cursorBlink=true \
        --client-option cursorStyle='bar' \
        --client-option bellStyle='none' \
        --client-option scrollback=1000 \
        --client-option tabStopWidth=4 \
        bash -c "export TERM=xterm-256color; tmux -f /home/node/.tmux.conf attach-session -t manual-session" &

    local manual_pid=$!
    log_info "Manual ttyd session started (PID: $manual_pid) on port $MANUAL_PORT"

    # Wait a moment for the first session to start
    sleep 2
    
    # Force cleanup any existing claude session and start fresh
    if tmux has-session -t claude-session 2>/dev/null; then
        log_info "Killing existing claude-session"
        tmux kill-session -t claude-session 2>/dev/null || true
    fi
    
    # Always create a new claude tmux session
    log_info "Creating new tmux session 'claude-session' with Claude"
    # Configure tmux with better terminal settings
    tmux -f /home/node/.tmux.conf new-session -d -s claude-session -c "$WORKING_DIR" 'export TERM=xterm-256color; claude'
    
    # Wait for Claude to initialize properly
    sleep 3
    
    # Verify the claude session is working
    if ! tmux list-sessions | grep -q "claude-session"; then
        log_error "Failed to create claude-session"
        return 1
    fi
    
    # Start Claude ttyd session in foreground (this will block)
    log_info "Starting Claude ttyd session on port $CLAUDE_PORT"
    
    exec ttyd \
        --port "$CLAUDE_PORT" \
        --writable \
        --interface 0.0.0.0 \
        --terminal-type xterm-256color \
        --client-option disableLeaveAlert=true \
        --client-option theme='{"background":"#09090b","foreground":"#fafafa","cursor":"#10b981","cursorAccent":"#09090b","selectionBackground":"#18181b","selectionForeground":"#fafafa","black":"#09090b","red":"#ef4444","green":"#10b981","yellow":"#f59e0b","blue":"#3b82f6","magenta":"#8b5cf6","cyan":"#06b6d4","white":"#fafafa","brightBlack":"#52525b","brightRed":"#f87171","brightGreen":"#34d399","brightYellow":"#fbbf24","brightBlue":"#60a5fa","brightMagenta":"#a78bfa","brightCyan":"#22d3ee","brightWhite":"#ffffff"}' \
        --client-option fontSize=14 \
        --client-option fontFamily="'Menlo', 'Cascadia Code', 'Consolas', 'Ubuntu Mono', 'DejaVu Sans Mono', monospace" \
        --client-option cursorBlink=true \
        --client-option cursorStyle='bar' \
        --client-option bellStyle='none' \
        --client-option scrollback=1000 \
        --client-option tabStopWidth=4 \
        bash -c "export TERM=xterm-256color; tmux -f /home/node/.tmux.conf attach-session -t claude-session"
}

# Cleanup function
cleanup() {
    log_info "Shutting down AFK terminal"
    
    # Clean up tmux sessions
    if tmux has-session -t claude-session 2>/dev/null; then
        log_info "Terminating claude-session tmux session"
        tmux kill-session -t claude-session 2>/dev/null || true
    fi
    
    if tmux has-session -t manual-session 2>/dev/null; then
        log_info "Terminating manual-session tmux session"
        tmux kill-session -t manual-session 2>/dev/null || true
    fi
    
    # SSH cleanup - source the setup script to access cleanup function
    if [ "$SSH_SETUP_DONE" = true ] && [ -f "$SCRIPT_DIR/setup-ssh.sh" ]; then
        source "$SCRIPT_DIR/setup-ssh.sh"
        cleanup_ssh 2>/dev/null || true
    fi
    
    log_info "Cleanup completed"
}

# Register cleanup trap
trap cleanup EXIT INT TERM

# Enhanced health check function
health_check() {
    local max_attempts=30
    local attempt=1
    
    log_info "Performing comprehensive health check..."
    
    while [ $attempt -le $max_attempts ]; do
        local ttyd_ok=false
        local tmux_ok=false
        
        # Check if ttyd is responding
        if curl -s "http://localhost:$CLAUDE_PORT" >/dev/null 2>&1; then
            ttyd_ok=true
        fi
        
        # Check if tmux sessions are healthy
        if tmux list-sessions 2>/dev/null | grep -q "claude-session" && tmux list-panes -t claude-session >/dev/null 2>&1; then
            # Verify Claude is actually running in the session
            if tmux capture-pane -t claude-session -p | grep -q "Claude Code" || tmux list-panes -t claude-session -F "#{pane_current_command}" | grep -q "claude\|node"; then
                tmux_ok=true
            fi
        fi
        
        # Check manual session health
        local manual_ok=false
        if tmux list-sessions 2>/dev/null | grep -q "manual-session" && tmux list-panes -t manual-session >/dev/null 2>&1; then
            if curl -s "http://localhost:$MANUAL_PORT" >/dev/null 2>&1; then
                manual_ok=true
            fi
        fi
        
        if [ "$ttyd_ok" = true ] && [ "$tmux_ok" = true ] && [ "$manual_ok" = true ]; then
            log_info "Health check passed - all services are healthy"
            log_info "  - ttyd responding: ✓"
            log_info "  - tmux sessions healthy: ✓"
            log_info "  - manual session healthy: ✓"
            return 0
        fi
        
        log_info "Health check attempt $attempt/$max_attempts - ttyd: $ttyd_ok, tmux: $tmux_ok, manual: $manual_ok"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    log_error "Final status - ttyd: $ttyd_ok, tmux: $tmux_ok, manual: $manual_ok"
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
    log_info "Claude Port: $CLAUDE_PORT"
    log_info "Manual Port: $MANUAL_PORT"
    echo
}

# Cleanup any leftover processes from previous runs
startup_cleanup() {
    log_step "Performing startup cleanup for container restart"
    
    # Kill any orphaned tmux sessions
    if command -v tmux >/dev/null 2>&1; then
        log_info "Cleaning up any orphaned tmux sessions"
        tmux kill-server 2>/dev/null || true
        
        # Wait a moment for cleanup to complete
        sleep 1
    fi
    
    # Kill any orphaned ttyd processes
    if pgrep ttyd >/dev/null 2>&1; then
        log_info "Cleaning up orphaned ttyd processes"
        pkill -f ttyd || true
        sleep 1
    fi
    
    # Kill any orphaned Claude processes
    if pgrep -f "claude" >/dev/null 2>&1; then
        log_info "Cleaning up orphaned Claude processes"
        pkill -f "claude" || true
        sleep 1
    fi
    
    log_info "Startup cleanup completed"
}

# Main execution
main() {
    print_banner
    
    # Step 0: Clean up any leftover processes from previous container runs
    startup_cleanup
    
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
    log_info "Starting dual mode - separate Claude and Manual sessions"
    start_claude_dual_tty
}

# Show usage information
usage() {
    echo "Usage: $0 [options]"
    echo
    echo "Environment Variables:"
    echo "  REPO_URL          - Git repository URL to clone"
    echo "  REPO_BRANCH       - Git branch to checkout (default: main)"
    echo "  SSH_PRIVATE_KEY   - SSH private key for private repositories"
    echo "  GIT_USER_NAME     - Git user name (default: Claude User)"
    echo "  GIT_USER_EMAIL    - Git user email (default: claude@example.com)"
    echo "  WORKSPACE_DIR     - Workspace directory (default: /workspace)"
    echo "  CLAUDE_PORT       - Claude session port (default: 7681)"
    echo "  MANUAL_PORT       - Manual session port (default: 7682)"
    echo
    echo "Examples:"
    echo "  # Start with public repository"
    echo "  REPO_URL=https://github.com/user/repo.git $0"
    echo
    echo "  # Start with private repository"
    echo "  REPO_URL=git@github.com:user/repo.git SSH_PRIVATE_KEY="$(cat ~/.ssh/id_rsa)" $0"
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