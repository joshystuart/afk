#!/bin/bash
#
# Example showing how to use the SSH setup script
# This demonstrates how to encode an SSH key and use it with the setup script
#

echo "SSH Setup Usage Example"
echo "======================"
echo
echo "1. First, encode your SSH private key:"
echo "   $ cat ~/.ssh/id_rsa | base64 -w 0 > ssh_key_encoded.txt"
echo
echo "2. Set the environment variable:"
echo "   $ export SSH_PRIVATE_KEY=\$(cat ssh_key_encoded.txt)"
echo
echo "3. Optionally, set a custom git host:"
echo "   $ export GIT_SSH_HOST=git.mycompany.com"
echo
echo "4. Run the setup script:"
echo "   $ ./setup-ssh.sh"
echo
echo "5. The script will:"
echo "   - Decode and install the SSH key"
echo "   - Set proper permissions (600)"
echo "   - Configure known hosts for GitHub, GitLab, Bitbucket"
echo "   - Create SSH config file"
echo "   - Start SSH agent (if needed)"
echo "   - Test connectivity"
echo
echo "Security Notes:"
echo "- SSH keys are stored only in memory and ~/.ssh/"
echo "- Keys are automatically cleaned up on container exit"
echo "- Never commit encoded keys to version control"
echo "- Use secrets management for production"
echo
echo "Docker Compose Example:"
echo "----------------------"
cat <<'EOF'
version: '3.8'
services:
  afk:
    build: .
    environment:
      - SSH_PRIVATE_KEY=${SSH_PRIVATE_KEY}
      - GIT_SSH_HOST=${GIT_SSH_HOST}
      - REPO_URL=git@github.com:myuser/myrepo.git
      - REPO_BRANCH=main
EOF