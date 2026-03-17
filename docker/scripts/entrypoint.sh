#!/bin/bash
#
# Container entrypoint for AFK
# Orchestrates git/SSH setup and starts ttyd for manual terminal access.
# Claude Code is invoked on-demand via docker exec (not started here).
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
DEFAULT_TERMINAL_PORT="7681"

# Environment variables
REPO_URL="${REPO_URL:-}"
REPO_BRANCH="${REPO_BRANCH:-main}"
SSH_PRIVATE_KEY="${SSH_PRIVATE_KEY:-}"
GIT_USER_NAME="${GIT_USER_NAME:-Claude User}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-claude@example.com}"
WORKSPACE_DIR="${WORKSPACE_DIR:-$DEFAULT_WORKSPACE}"
TERMINAL_PORT="${TERMINAL_PORT:-$DEFAULT_TERMINAL_PORT}"
SESSION_NAME="${SESSION_NAME:-}"
IMAGE_NAME="${IMAGE_NAME:-}"

# State tracking
SSH_SETUP_DONE=false
GIT_SETUP_DONE=false
WORKING_DIR="$WORKSPACE_DIR"

setup_ssh() {
    log_step "Setting up SSH known hosts and configuration"
    
    if [ -f "$SCRIPT_DIR/setup-ssh.sh" ]; then
        if bash "$SCRIPT_DIR/setup-ssh.sh"; then
            if [ -n "$SSH_PRIVATE_KEY" ]; then
                SSH_SETUP_DONE=true
            fi
            log_info "SSH setup completed successfully"
        else
            log_error "SSH setup failed"
            return 1
        fi
    else
        log_error "SSH setup script not found: $SCRIPT_DIR/setup-ssh.sh"
        return 1
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


start_terminal() {
    log_step "Starting terminal session"
    
    if [ ! -d "$WORKING_DIR" ]; then
        log_warning "Working directory $WORKING_DIR doesn't exist, creating it"
        mkdir -p "$WORKING_DIR"
    fi
    
    cd "$WORKING_DIR"
    
    log_info "Starting terminal:"
    log_info "  Terminal: http://localhost:$TERMINAL_PORT"
    log_info "  Claude Code: available on-demand via docker exec"
    log_info "Working directory: $(pwd)"
    
    if tmux has-session -t terminal 2>/dev/null; then
        log_info "Killing existing terminal session"
        tmux kill-session -t terminal 2>/dev/null || true
    fi
    
    log_info "Creating new tmux session 'terminal' with bash"
    tmux -f "$HOME/.tmux.conf" new-session -d -s terminal -c "$WORKING_DIR" 'export TERM=xterm-256color; exec bash'
    sleep 1
    
    if ! tmux list-sessions | grep -q "terminal"; then
        log_error "Failed to create terminal session"
        return 1
    fi
    
    log_info "Starting ttyd on port $TERMINAL_PORT (foreground)"
    
    touch /tmp/afk-ready
    log_info "Container ready signal written"
    
    local terminal_title="AFK"
    if [ -n "$SESSION_NAME" ] && [ -n "$IMAGE_NAME" ]; then
        terminal_title="$SESSION_NAME ($IMAGE_NAME)"
    elif [ -n "$SESSION_NAME" ]; then
        terminal_title="$SESSION_NAME"
    fi
    
    exec ttyd \
        --port "$TERMINAL_PORT" \
        --writable \
        --interface 0.0.0.0 \
        --terminal-type xterm-256color \
        --client-option disableLeaveAlert=true \
        --client-option disableResizeOverlay=true \
        --client-option disableReconnect=true \
        --client-option titleFixed="$terminal_title" \
        --client-option theme='{"background":"#09090b","foreground":"#fafafa","cursor":"#10b981","cursorAccent":"#09090b","selectionBackground":"#18181b","selectionForeground":"#fafafa","black":"#09090b","red":"#ef4444","green":"#10b981","yellow":"#f59e0b","blue":"#3b82f6","magenta":"#8b5cf6","cyan":"#06b6d4","white":"#fafafa","brightBlack":"#52525b","brightRed":"#f87171","brightGreen":"#34d399","brightYellow":"#fbbf24","brightBlue":"#60a5fa","brightMagenta":"#a78bfa","brightCyan":"#22d3ee","brightWhite":"#ffffff"}' \
        --client-option fontSize=14 \
        --client-option fontFamily="'Menlo', 'Cascadia Code', 'Consolas', 'Ubuntu Mono', 'DejaVu Sans Mono', monospace" \
        --client-option cursorBlink=true \
        --client-option cursorStyle='bar' \
        --client-option bellStyle='none' \
        --client-option scrollback=1000 \
        --client-option tabStopWidth=4 \
        bash -c "export TERM=xterm-256color; tmux -f \$HOME/.tmux.conf attach-session -t terminal"
}

cleanup() {
    log_info "Shutting down AFK container"
    
    if tmux has-session -t terminal 2>/dev/null; then
        log_info "Terminating terminal tmux session"
        tmux kill-session -t terminal 2>/dev/null || true
    fi
    
    if [ "$SSH_SETUP_DONE" = true ] && [ -f "$SCRIPT_DIR/setup-ssh.sh" ]; then
        source "$SCRIPT_DIR/setup-ssh.sh"
        cleanup_ssh 2>/dev/null || true
    fi
    
    log_info "Cleanup completed"
}

# Register cleanup trap
trap cleanup EXIT INT TERM

health_check() {
    local max_attempts=30
    local attempt=1
    
    log_info "Performing health check..."
    
    while [ $attempt -le $max_attempts ]; do
        local terminal_ok=false
        
        if tmux list-sessions 2>/dev/null | grep -q "terminal" && tmux list-panes -t terminal >/dev/null 2>&1; then
            if curl -s "http://localhost:$TERMINAL_PORT" >/dev/null 2>&1; then
                terminal_ok=true
            fi
        fi
        
        if [ "$terminal_ok" = true ]; then
            log_info "Health check passed"
            log_info "  - terminal: healthy"
            log_info "  - claude CLI: available on PATH"
            return 0
        fi
        
        log_info "Health check attempt $attempt/$max_attempts - terminal: $terminal_ok"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

print_banner() {
    echo
    echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                 AFK                  ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
    echo
    log_info "Repository URL: ${REPO_URL:-'Not provided'}"
    log_info "Repository Branch: $REPO_BRANCH"
    log_info "Git User: $GIT_USER_NAME <$GIT_USER_EMAIL>"
    log_info "SSH Key: ${SSH_PRIVATE_KEY:+'Provided'}${SSH_PRIVATE_KEY:-'Not provided'}"
    log_info "Working Directory: $WORKING_DIR"
    log_info "Terminal Port: $TERMINAL_PORT"
    log_info "Claude Code: on-demand via docker exec"
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
    
    log_step "Launching terminal"
    
    (
        sleep 5
        health_check || log_warning "Health check failed, but terminal may still be accessible"
    ) &
    
    log_info "Starting terminal (Claude available on-demand via docker exec)"
    start_terminal
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
    echo "  TERMINAL_PORT     - Terminal port for ttyd (default: 7681)"
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