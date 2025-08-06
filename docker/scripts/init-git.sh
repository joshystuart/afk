#!/bin/bash
#
# Git initialization script for AFK containers
# Handles repository cloning, branch checkout, and initial git configuration
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

# Validate repository URL
validate_repo_url() {
    local url=$1
    
    if [ -z "$url" ]; then
        log_error "Repository URL is empty"
        return 1
    fi
    
    # Check if URL is HTTPS
    if [[ "$url" =~ ^https:// ]]; then
        log_info "Detected HTTPS repository URL"
        return 0
    fi
    
    # Check if URL is SSH
    if [[ "$url" =~ ^git@ ]] || [[ "$url" =~ ^ssh:// ]]; then
        log_info "Detected SSH repository URL"
        return 0
    fi
    
    # Check if URL is a short form (e.g., github:user/repo)
    if [[ "$url" =~ ^github: ]] || [[ "$url" =~ ^gitlab: ]] || [[ "$url" =~ ^bitbucket: ]]; then
        log_info "Detected short-form repository URL"
        return 0
    fi
    
    log_error "Invalid repository URL format: $url"
    return 1
}

# Convert short-form URLs to full URLs
expand_repo_url() {
    local url=$1
    
    # GitHub short form
    if [[ "$url" =~ ^github:(.+)$ ]]; then
        echo "git@github.com:${BASH_REMATCH[1]}.git"
        return
    fi
    
    # GitLab short form
    if [[ "$url" =~ ^gitlab:(.+)$ ]]; then
        echo "git@gitlab.com:${BASH_REMATCH[1]}.git"
        return
    fi
    
    # Bitbucket short form
    if [[ "$url" =~ ^bitbucket:(.+)$ ]]; then
        echo "git@bitbucket.org:${BASH_REMATCH[1]}.git"
        return
    fi
    
    # Return original URL if not a short form
    echo "$url"
}

# Clone repository
clone_repository() {
    local url=$1
    local target_dir=$2
    local max_retries=3
    local retry_count=0
    
    # Expand short-form URLs
    url=$(expand_repo_url "$url")
    
    log_info "Cloning repository: $url"
    log_info "Target directory: $target_dir"
    
    # Create target directory if it doesn't exist
    mkdir -p "$(dirname "$target_dir")"
    
    # Clone with retries
    while [ $retry_count -lt $max_retries ]; do
        if git clone "$url" "$target_dir" 2>&1; then
            log_info "Repository cloned successfully"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                log_warning "Clone failed, retrying ($retry_count/$max_retries)..."
                sleep 2
            fi
        fi
    done
    
    log_error "Failed to clone repository after $max_retries attempts"
    return 1
}

# Checkout specific branch
checkout_branch() {
    local branch=$1
    local repo_dir=$2
    
    if [ -z "$branch" ]; then
        log_info "No specific branch requested, using default branch"
        return 0
    fi
    
    cd "$repo_dir"
    
    # Check if branch exists
    if git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
        log_info "Checking out branch: $branch"
        git checkout "$branch"
    else
        log_warning "Branch '$branch' not found, staying on default branch"
        # Show available branches for debugging
        log_info "Available remote branches:"
        git branch -r | sed 's/origin\///' | grep -v HEAD | head -10
    fi
}

# Setup git configuration
setup_git_config() {
    local user_name=${GIT_USER_NAME:-"Claude User"}
    local user_email=${GIT_USER_EMAIL:-"claude@afk.local"}
    
    log_info "Setting up git configuration"
    
    # Set global git config
    git config --global user.name "$user_name"
    git config --global user.email "$user_email"
    
    # Set some useful defaults
    git config --global init.defaultBranch main
    git config --global pull.rebase false
    git config --global core.editor vim
    
    log_info "Git configured with:"
    log_info "  Name: $user_name"
    log_info "  Email: $user_email"
}

# Main execution
main() {
    local repo_url="${REPO_URL:-}"
    local repo_branch="${REPO_BRANCH:-}"
    local workspace_dir="/workspace"
    local repo_name=""
    
    log_info "Starting git initialization"
    
    # Setup git configuration first
    setup_git_config
    
    # Check if repository URL is provided
    if [ -z "$repo_url" ]; then
        log_warning "No REPO_URL provided, skipping repository clone"
        return 0
    fi
    
    # Validate repository URL
    if ! validate_repo_url "$repo_url"; then
        log_error "Repository URL validation failed"
        return 1
    fi
    
    # Extract repository name from URL
    repo_name=$(basename "$repo_url" .git)
    if [ -z "$repo_name" ]; then
        repo_name="repository"
    fi
    
    # Define target directory
    local target_dir="$workspace_dir/$repo_name"
    
    # Clone repository
    if ! clone_repository "$repo_url" "$target_dir"; then
        log_error "Failed to clone repository"
        return 1
    fi
    
    # Checkout branch if specified
    if [ -n "$repo_branch" ]; then
        checkout_branch "$repo_branch" "$target_dir"
    fi
    
    # Create a symlink for easy access
    if [ -d "$target_dir" ] && [ "$target_dir" != "$workspace_dir/repo" ]; then
        ln -sfn "$target_dir" "$workspace_dir/repo"
        log_info "Created symlink: $workspace_dir/repo -> $target_dir"
    fi
    
    # Save repository info for later use
    cat > "$workspace_dir/.git-info" <<EOF
REPO_URL=$repo_url
REPO_BRANCH=$repo_branch
REPO_NAME=$repo_name
REPO_DIR=$target_dir
EOF
    
    log_info "Git initialization completed successfully"
    log_info "Repository available at: $target_dir"
    
    return 0
}

# Run main function
main "$@"