---
source: RchGrav/claudebox
kind: issue
number: 30
state: closed
url: https://github.com/RchGrav/claudebox/issues/30
author: thundercat49
comments: 2
created_at: 2025-07-05T18:13:12Z
updated_at: 2025-07-25T10:59:22Z
---

# Issue: Python Package Installation Fails with uv pip install Commands

Issue: Python Package Installation Fails with uv pip install Commands

Problem:
The ClaudeBox script uses uv pip install commands that fail due to Python environment management issues, preventing successful container builds.
Root Cause:
Lines 2107, 2114, and 2121 in the claudebox script contain:
bashRUN ~/.local/bin/uv pip install ipython black mypy pylint pytest ruff poetry pipenv
RUN ~/.local/bin/uv pip install torch transformers scikit-learn numpy pandas matplotlib  
RUN ~/.local/bin/uv pip install jupyter notebook jupyterlab numpy pandas scipy matplotlib seaborn scikit-learn statsmodels plotly
Error Messages Encountered:

error: No virtual environment found; run &#39;uv venv&#39; to create an environment, or pass &#39;--system&#39; to install into a non-virtual environment
error: The interpreter at /usr is externally managed (when using --system flag)
error: No system Python installation found (permission/path issues)

Working Solution:
Replace the problematic uv pip install commands with:
bashRUN pip3 install --break-system-packages [packages]
And ensure Python is installed first in each profile:
bashRUN apt-get update &amp;&amp; apt-get install -y python3 python3-pip python3-venv &amp;&amp; apt-get clean
Fix Required:
The uv pip install approach needs to be replaced with standard pip3 install --break-system-packages for Docker container environments, or the uv virtual environment setup needs to be properly configured before package installation.
Impact:
Currently prevents users from successfully building ClaudeBox containers with Python-related profiles (python, ml, datascience).

This should give the maintainer enough information to reproduce and fix the issue in the repository.

## AFK planning summary

- **Category**: Python & uv persistence (.local/share, venv symlinks)
- **Theme key**: `python_uv_persistence`
- **Short description**: Issue: Python Package Installation Fails with uv pip install Commands — uv-managed Python lives under unmounted paths so venv symlinks break after container restart.
