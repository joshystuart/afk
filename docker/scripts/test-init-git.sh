#!/bin/bash
#
# Test script for init-git.sh
# This can be used to verify the git initialization script works correctly
#

# Source the init-git script functions
source "$(dirname "$0")/init-git.sh"

echo "Testing Git Initialization Script Functions"
echo "=========================================="

# Test 1: URL Validation
echo -e "\n1. Testing URL Validation:"
test_urls=(
    "https://github.com/user/repo.git"
    "git@github.com:user/repo.git"
    "ssh://git@github.com/user/repo.git"
    "github:user/repo"
    "gitlab:user/repo"
    "bitbucket:user/repo"
    "invalid-url"
    ""
)

for url in "${test_urls[@]}"; do
    echo -n "  Testing '$url': "
    if validate_repo_url "$url" >/dev/null 2>&1; then
        echo "VALID"
    else
        echo "INVALID"
    fi
done

# Test 2: URL Expansion
echo -e "\n2. Testing URL Expansion:"
short_urls=(
    "github:octocat/Hello-World"
    "gitlab:gitlab-org/gitlab"
    "bitbucket:atlassian/python-bitbucket"
    "https://github.com/user/repo.git"
)

for url in "${short_urls[@]}"; do
    expanded=$(expand_repo_url "$url")
    echo "  '$url' -> '$expanded'"
done

# Test 3: Git Config Setup (dry run)
echo -e "\n3. Testing Git Config Setup:"
echo "  Would set:"
echo "    user.name = ${GIT_USER_NAME:-Claude User}"
echo "    user.email = ${GIT_USER_EMAIL:-claude@afk.local}"

echo -e "\nTest completed!"