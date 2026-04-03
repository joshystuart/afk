---
source: RchGrav/claudebox
kind: issue
number: 95
state: open
url: https://github.com/RchGrav/claudebox/issues/95
author: DorianZheng
comments: 1
created_at: 2025-12-31T04:15:31Z
updated_at: 2025-12-31T08:17:08Z
---

# Consider BoxLite as an alternative to Docker for stronger isolation

### Overview

I&#39;d like to suggest considering [BoxLite](https://github.com/boxlite-labs/boxlite) as an alternative or complement to Docker for ClaudeBox. BoxLite is an embeddable VM runtime specifically designed for AI agent sandboxing with hardware-level isolation.

### Why This Makes Sense

ClaudeBox&#39;s mission of providing isolated, secure environments for Claude Code aligns perfectly with BoxLite&#39;s design goals. Here are the key advantages:

#### 🔒 **Stronger Isolation**

- **Docker**: Container isolation with shared host kernel (namespace/cgroup-based)
- **BoxLite**: Full VM isolation with separate kernel per instance via hardware virtualization (KVM/Hypervisor.framework)
- Running AI-generated code has inherent risks—container escapes do happen, but VM escapes are far more difficult

#### 🚀 **Simpler Architecture**

- **No daemon required**: BoxLite is an embeddable library, no Docker daemon needed
- **No root required**: Runs entirely in userspace without elevated privileges
- **No Docker Desktop**: Especially beneficial on macOS where Docker Desktop has licensing/resource overhead

#### 🤖 **Purpose-Built for AI Agents**

BoxLite was designed from the ground up for AI agent sandboxing:

- Async-first API for running multiple agent sessions concurrently
- Streaming I/O for real-time output
- Resource limits (CPU, memory) built-in
- Metrics for tracking agent behavior

#### 🧩 **OCI Compatible**

- Still uses standard Docker/OCI images (`python:slim`, `node:alpine`, etc.)
- Existing ClaudeBox profiles could largely transfer over
- No need to rebuild the ecosystem

#### 🌍 **Cross-Platform**

- macOS (Apple Silicon) via Hypervisor.framework
- Linux (x86_64, ARM64) via KVM
- Same API across platforms

### Example Usage

BoxLite has both Rust and Python APIs. Here&#39;s how simple it is:

```python
from boxlite import Boxlite

# Initialize runtime (no daemon, no root)
runtime = Boxlite()

# Create a box from any OCI image
box = await runtime.create_box(&#34;python:3.12-slim&#34;)

# Run Claude Code commands
result = await box.exec([&#34;python&#34;, &#34;agent_code.py&#34;])
print(result.stdout)
```

### Potential Integration Path

A few possibilities:

1. **Option to use BoxLite instead of Docker**: Let users choose their backend
2. **Hybrid approach**: Use BoxLite for high-isolation workloads, Docker for lighter ones
3. **BoxLite-first**: Make it the default with Docker as fallback

### Performance Characteristics

- **Startup**: ~500ms for a new VM (with image caching)
- **Memory**: ~100MB overhead per VM
- **Footprint**: Single binary, no daemon

### Links

- **Repository**: https://github.com/boxlite-labs/boxlite
- **PyPI**: https://pypi.org/project/boxlite/
- **Documentation**: See README for architecture and examples

### Questions?

Happy to discuss implementation details, answer questions, or help with a proof-of-concept integration. BoxLite is actively maintained and we&#39;re excited to support Claude Code use cases.

---

**Disclosure**: I&#39;m associated with the BoxLite project, but genuinely believe this could benefit ClaudeBox users who want stronger isolation guarantees when running AI-generated code.

## AFK planning summary

- **Category**: Stronger isolation / alternate runtimes (BoxLite, Apple Container)
- **Theme key**: `isolation_runtime`
- **Short description**: Consider BoxLite as an alternative to Docker for stronger isolation — Optional non-Docker runtimes (VM / Apple Container) for stronger isolation.
