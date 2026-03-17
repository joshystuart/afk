const { execSync } = require('child_process');
const path = require('path');

/**
 * Re-signs the macOS app bundle with a consistent ad-hoc identity after packaging.
 * This prevents Team ID mismatches between the main binary and Electron Framework,
 * which causes launch crashes on macOS 15+.
 */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') {
    return;
  }

  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
  );

  console.log(`Re-signing app bundle: ${appPath}`);

  const entitlements = path.join(
    __dirname,
    '..',
    'build',
    'entitlements.mac.plist',
  );

  execSync(
    `codesign --force --deep --sign - --entitlements "${entitlements}" "${appPath}"`,
    { stdio: 'inherit' },
  );

  console.log('Ad-hoc re-signing complete');
};
