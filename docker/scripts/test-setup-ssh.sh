#!/bin/bash
#
# Test script for setup-ssh.sh
# This script tests the SSH setup functionality
#

# Source the SSH setup script functions
source "$(dirname "$0")/setup-ssh.sh"

echo "Testing SSH Setup Script Functions"
echo "=================================="

# Test 1: Directory Creation
echo -e "\n1. Testing SSH Directory Creation:"
TEST_HOME=$(mktemp -d)
export HOME=$TEST_HOME
setup_ssh_directory
if [ -d "$HOME/.ssh" ] && [ "$(stat -c %a "$HOME/.ssh" 2>/dev/null || stat -f %A "$HOME/.ssh")" = "700" ]; then
    echo "  ✓ SSH directory created with correct permissions"
else
    echo "  ✗ Failed to create SSH directory with correct permissions"
fi

# Test 2: Base64 Encoding/Decoding
echo -e "\n2. Testing SSH Key Installation:"
# Create a test SSH key
TEST_KEY=$(cat <<'EOF'
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZWQyNTUxOQAAACBtZXNzYWdlIGZyb20gdGhlIGZ1dHVyZTogdGVzdCBrZXkAAAAA
-----END OPENSSH PRIVATE KEY-----
EOF
)

# Encode the test key
ENCODED_KEY=$(echo "$TEST_KEY" | base64)
echo "  Original key length: ${#TEST_KEY}"
echo "  Encoded key length: ${#ENCODED_KEY}"

# Test key installation
if install_ssh_key "$ENCODED_KEY" 2>/dev/null; then
    echo "  ✓ SSH key installed successfully"
    if [ -f "$HOME/.ssh/id_rsa" ]; then
        PERMS=$(stat -c %a "$HOME/.ssh/id_rsa" 2>/dev/null || stat -f %A "$HOME/.ssh/id_rsa")
        if [ "$PERMS" = "600" ]; then
            echo "  ✓ SSH key has correct permissions (600)"
        else
            echo "  ✗ SSH key has wrong permissions: $PERMS"
        fi
    fi
else
    echo "  ✗ Failed to install SSH key"
fi

# Test 3: Known Hosts Setup
echo -e "\n3. Testing Known Hosts Configuration:"
setup_known_hosts
if [ -f "$HOME/.ssh/known_hosts" ]; then
    echo "  ✓ Known hosts file created"
    for host in github.com gitlab.com bitbucket.org; do
        if grep -q "$host" "$HOME/.ssh/known_hosts"; then
            echo "  ✓ $host added to known hosts"
        else
            echo "  ✗ $host not found in known hosts"
        fi
    done
else
    echo "  ✗ Known hosts file not created"
fi

# Test 4: SSH Config
echo -e "\n4. Testing SSH Client Configuration:"
configure_ssh_client
if [ -f "$HOME/.ssh/config" ]; then
    echo "  ✓ SSH config file created"
    PERMS=$(stat -c %a "$HOME/.ssh/config" 2>/dev/null || stat -f %A "$HOME/.ssh/config")
    if [ "$PERMS" = "600" ]; then
        echo "  ✓ SSH config has correct permissions (600)"
    else
        echo "  ✗ SSH config has wrong permissions: $PERMS"
    fi
else
    echo "  ✗ SSH config file not created"
fi

# Test 5: Error Handling
echo -e "\n5. Testing Error Handling:"
# Test with empty key
if ! install_ssh_key "" 2>/dev/null; then
    echo "  ✓ Correctly handles empty SSH key"
else
    echo "  ✗ Should fail with empty SSH key"
fi

# Test with invalid base64
if ! install_ssh_key "not-valid-base64!" 2>/dev/null; then
    echo "  ✓ Correctly handles invalid base64"
else
    echo "  ✗ Should fail with invalid base64"
fi

# Test 6: Environment Variable Handling
echo -e "\n6. Testing Environment Variable Handling:"
export SSH_PRIVATE_KEY=""
export GIT_SSH_HOST="custom.git.host"
# Reset HOME for this test
TEST_HOME2=$(mktemp -d)
export HOME=$TEST_HOME2

# Run main with empty SSH key (should skip setup)
if main >/dev/null 2>&1; then
    echo "  ✓ Handles missing SSH key gracefully"
else
    echo "  ✗ Should not fail when SSH key is missing"
fi

# Cleanup
rm -rf "$TEST_HOME" "$TEST_HOME2"

echo -e "\nTest completed!"