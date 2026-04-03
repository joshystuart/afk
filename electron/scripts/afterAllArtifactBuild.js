const { execSync } = require('child_process');

const isCodeSigned = !!(process.env.CSC_LINK || process.env.CSC_NAME);

function getSignIdentity() {
  if (process.env.CSC_NAME) return process.env.CSC_NAME;
  if (process.env.CSC_LINK) return 'Developer ID Application';
  return null;
}

/**
 * Signs, notarizes, and staples DMG artifacts after electron-builder creates them.
 * The .app is already handled by afterPack.js — this covers the DMG wrapper.
 * ZIPs are skipped: they can't be codesigned or stapled, and the .app inside
 * is already notarized so Gatekeeper validates it on extraction.
 */
exports.default = async function afterAllArtifactBuild(buildResult) {
  if (!isCodeSigned) {
    console.log(
      'Skipping artifact signing/notarization: no code signing identity',
    );
    return buildResult.artifactPaths;
  }

  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;
  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.warn(
      'Skipping artifact notarization: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, or APPLE_TEAM_ID not set',
    );
    return buildResult.artifactPaths;
  }

  const identity = getSignIdentity();
  const { notarize } = require('@electron/notarize');

  for (const artifactPath of buildResult.artifactPaths) {
    if (!artifactPath.endsWith('.dmg')) continue;

    console.log(`Signing DMG: ${artifactPath}`);
    execSync(
      `codesign --force --sign "${identity}" --timestamp "${artifactPath}"`,
      { stdio: 'inherit' },
    );

    console.log(`Notarizing DMG: ${artifactPath}`);
    await notarize({
      appPath: artifactPath,
      appleId: APPLE_ID,
      appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
      teamId: APPLE_TEAM_ID,
    });
    console.log(`Notarized and stapled: ${artifactPath}`);
  }

  return buildResult.artifactPaths;
};
