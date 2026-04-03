---
source: RchGrav/claudebox
kind: pull_request
number: 58
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/58
author: fletchgqc
head: feature/java-sdkman-integration
base: main
created_at: 2025-08-27T13:41:45Z
updated_at: 2025-09-01T11:25:59Z
---

# feat: Upgrade Java profile to use SDKMan for latest LTS

## Summary

This PR modernizes the Java development profile by migrating from static OpenJDK 17 packages to SDKMan, enabling automatic use of the latest Java LTS version.

## Motivation

- Users reported wanting Java 21+ features (see issue #45 comments)
- The previous implementation was locked to Java 17, which is now outdated
- Other language profiles (Node via nvm, Rust via rustup) already use version managers
- SDKMan is the de facto standard for Java version management

## Changes

### 1. Base Docker Image

- Added `zip` package alongside existing `unzip` (required by SDKMan)

### 2. Java Profile Rewrite

- Replaced apt package installation with SDKMan
- Java, Maven, Gradle, and Ant all installed via SDKMan
- Installs as `claude` user (following SDKMan&#39;s user-space design)
- Creates system-wide symlinks for all tools
- Sets `JAVA_HOME` and `PATH` environment variables

### 3. Documentation Updates

- README now shows &#34;Latest LTS via SDKMan&#34; instead of &#34;OpenJDK 17&#34;
- Tools report updated to reflect SDKMan-based installations

## Benefits

✅ **Always Current**: Automatically gets latest Java LTS (currently 21, soon 25)
✅ **Better Integration**: Maven/Gradle/Ant managed together with Java
✅ **Consistency**: Follows same pattern as JavaScript (nvm) and Rust (rustup) profiles
✅ **Future-proof**: New LTS versions available without code changes
✅ **User-friendly**: SDKMan handles all PATH and JAVA_HOME configuration

## Alternative Approach Considered

An alternative solution would be to source SDKMan&#39;s init script in the docker-entrypoint file, similar to how nvm is handled. This would involve:

1. Adding to `build/docker-entrypoint` around lines 140-150 (where nvm is sourced):

```bash
export SDKMAN_DIR=&#34;$HOME/.sdkman&#34;
if [[ -s &#34;$SDKMAN_DIR/bin/sdkman-init.sh&#34; ]]; then
    \. &#34;$SDKMAN_DIR/bin/sdkman-init.sh&#34;
else
    echo &#34;Warning: SDKMan not found at $SDKMAN_DIR&#34; &gt;&amp;2
fi
```

2. Removing the symlink creation and ENV PATH setup from the Java profile (lines 273-282 in lib/config.sh)

This approach would be shorter and follow nvm&#39;s pattern exactly. However, we chose the current implementation because:

- It keeps all Java-related setup contained within the Java profile
- It doesn&#39;t require modifications to the core docker-entrypoint file
- System-wide symlinks ensure Java tools work even in non-interactive shells
- It&#39;s more explicit about what&#39;s being installed and where

## Testing

The changes have been tested locally:

- Java profile builds successfully
- `java -version` shows Java 21
- Maven, Gradle, and Ant are all accessible
- JAVA_HOME is properly set

## Breaking Changes

None. Users with existing Java profiles will get the new version on next rebuild.

## References

- Related to discussion in #45 about Java version requirements
- Follows established patterns from JavaScript and Rust profiles

🤖 Generated with Claude Code

## Summary by Sourcery

Upgrade the Java development profile to install Java, Maven, Gradle, and Ant via SDKMan for automatic latest LTS support, add necessary dependencies, and update documentation and reports accordingly.

New Features:

- Migrate Java, Maven, Gradle, and Ant installation to SDKMan under the ‘claude’ user with system-wide symlinks and environment variables
- Add the zip package to the base Docker image to satisfy SDKMan prerequisites

Documentation:

- Update README to describe the Java profile as using SDKMan for latest LTS
- Update tools-report to list Java tools installed via SDKMan

## AFK planning summary

- **Category**: Java/JDK versions & JVM profiles
- **Theme key**: `java_jvm_tooling`
- **Short description**: feat: Upgrade Java profile to use SDKMan for latest LTS
