const { execSync } = require('child_process');
const path = require('path');

const isCodeSigned = !!(process.env.CSC_LINK || process.env.CSC_NAME);

function getSignIdentity() {
  if (process.env.CSC_NAME) return process.env.CSC_NAME;
  if (process.env.CSC_LINK) return 'Developer ID Application';
  return null;
}

function findMachOBinaries(appPath) {
  const candidates = execSync(
    `find "${appPath}" -type f \\( -perm +111 -o -name "*.node" -o -name "*.dylib" -o -name "*.so" \\) 2>/dev/null || true`,
    { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 },
  )
    .trim()
    .split('\n')
    .filter(Boolean);

  if (candidates.length === 0) return [];

  const results = [];
  const batchSize = 200;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const quoted = batch.map((f) => `"${f}"`).join(' ');
    const output = execSync(`file --brief --mime-type ${quoted} 2>/dev/null`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    });
    const types = output.trim().split('\n');
    for (let j = 0; j < types.length; j++) {
      if (types[j].includes('application/x-mach-binary')) {
        results.push(batch[j]);
      }
    }
  }
  return results;
}

function findBundles(appPath) {
  const output = execSync(
    `find "${appPath}" -type d \\( -name "*.framework" -o -name "*.app" \\) -not -path "${appPath}" 2>/dev/null || true`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 },
  );
  return output.trim() ? output.trim().split('\n') : [];
}

function signFile(filePath, identity, entitlements, useRuntime) {
  const runtimeFlag = useRuntime ? '--options runtime --timestamp' : '';
  const entitlementsFlag = entitlements
    ? `--entitlements "${entitlements}"`
    : '';
  execSync(
    `codesign --force --sign ${identity === '-' ? '-' : `"${identity}"`} ${runtimeFlag} ${entitlementsFlag} "${filePath}"`,
    { stdio: 'inherit' },
  );
}

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
  );
  const entitlements = path.join(
    __dirname,
    '..',
    'build',
    'entitlements.mac.plist',
  );

  const identity = isCodeSigned ? getSignIdentity() : '-';
  const useRuntime = isCodeSigned;
  const signingType = isCodeSigned ? `Developer ID (${identity})` : 'ad-hoc';

  console.log(`Signing app bundle (${signingType}): ${appPath}`);

  const bundles = findBundles(appPath);

  const bundleMainExecutables = new Set();
  for (const bundle of bundles) {
    if (bundle.endsWith('.app')) {
      const macosDir = path.join(bundle, 'Contents', 'MacOS');
      const files = execSync(`find "${macosDir}" -type f 2>/dev/null || true`, {
        encoding: 'utf-8',
      })
        .trim()
        .split('\n')
        .filter(Boolean);
      files.forEach((f) => bundleMainExecutables.add(f));
    } else if (bundle.endsWith('.framework')) {
      const fwName = path.basename(bundle, '.framework');
      bundleMainExecutables.add(path.join(bundle, 'Versions', 'A', fwName));
    }
  }

  const mainExe = path.join(
    appPath,
    'Contents',
    'MacOS',
    context.packager.appInfo.productFilename,
  );
  bundleMainExecutables.add(mainExe);

  const binaries = findMachOBinaries(appPath).filter(
    (b) => !bundleMainExecutables.has(b),
  );
  console.log(
    `Found ${binaries.length} loose Mach-O binaries to sign (excluded ${bundleMainExecutables.size} bundle executables)`,
  );

  for (const binary of binaries) {
    signFile(binary, identity, entitlements, useRuntime);
  }

  const sortedBundles = bundles.sort(
    (a, b) => b.split('/').length - a.split('/').length,
  );

  console.log(`Signing ${sortedBundles.length} bundles (deepest first)`);
  for (const bundle of sortedBundles) {
    signFile(bundle, identity, entitlements, useRuntime);
  }

  console.log('Signing main app bundle');
  signFile(appPath, identity, entitlements, useRuntime);

  console.log('Signing complete');

  if (!isCodeSigned) return;

  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;
  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.warn(
      'Skipping notarization: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, or APPLE_TEAM_ID not set',
    );
    return;
  }

  console.log(`Notarizing ${appPath}...`);
  const { notarize } = require('@electron/notarize');
  await notarize({
    appPath,
    appleId: APPLE_ID,
    appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
    teamId: APPLE_TEAM_ID,
  });
  console.log('Notarization complete');
};
