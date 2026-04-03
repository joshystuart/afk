const fs = require('fs');
const path = require('path');
const {
  buildCodesignArgs,
  isCodeSigningEnabled,
  resolveSignIdentity,
  runCommand,
} = require('./signing');

function listFiles(command, args) {
  const { stdout } = runCommand(command, args, { allowFailure: true });
  return stdout.trim() ? stdout.trim().split('\n').filter(Boolean) : [];
}

function isMachOBinary(filePath) {
  const { stdout } = runCommand(
    'file',
    ['--brief', '--mime-type', '--', filePath],
    { allowFailure: true },
  );
  return stdout.includes('application/x-mach-binary');
}

function findMachOBinaries(appPath) {
  const candidates = listFiles('find', [
    appPath,
    '-type',
    'f',
    '(',
    '-perm',
    '-u+x',
    '-o',
    '-perm',
    '-g+x',
    '-o',
    '-perm',
    '-o+x',
    '-o',
    '-name',
    '*.node',
    '-o',
    '-name',
    '*.dylib',
    '-o',
    '-name',
    '*.so',
    ')',
  ]);

  if (candidates.length === 0) return [];

  const results = [];
  const batchSize = 200;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const { stdout } = runCommand(
      'file',
      ['--brief', '--mime-type', '--', ...batch],
      { allowFailure: true },
    );
    const types = stdout.trim() ? stdout.trim().split('\n') : [];

    if (types.length !== batch.length) {
      console.warn(
        `Unexpected file output for batch starting at index ${i}; falling back to per-file inspection`,
      );
      for (const filePath of batch) {
        if (isMachOBinary(filePath)) {
          results.push(filePath);
        }
      }
      continue;
    }

    for (let j = 0; j < types.length; j++) {
      if (types[j].includes('application/x-mach-binary')) {
        results.push(batch[j]);
      }
    }
  }
  return results;
}

function findBundles(appPath) {
  return listFiles('find', [
    appPath,
    '-type',
    'd',
    '(',
    '-name',
    '*.framework',
    '-o',
    '-name',
    '*.app',
    ')',
    '-not',
    '-path',
    appPath,
  ]);
}

function signFile(filePath, identity, entitlements, useRuntime) {
  const args = buildCodesignArgs(identity, filePath, {
    entitlements,
    useRuntime,
  });
  runCommand('codesign', args, { stdio: 'inherit' });
}

function collectBundleMainExecutables(bundlePath) {
  const executables = new Set();

  if (bundlePath.endsWith('.app')) {
    const macosDir = path.join(bundlePath, 'Contents', 'MacOS');
    if (!fs.existsSync(macosDir)) {
      console.warn(
        `Skipping app bundle executable discovery: missing ${macosDir}`,
      );
      return executables;
    }

    for (const entry of fs.readdirSync(macosDir, { withFileTypes: true })) {
      if (entry.isFile() || entry.isSymbolicLink()) {
        executables.add(path.join(macosDir, entry.name));
      }
    }

    return executables;
  }

  if (bundlePath.endsWith('.framework')) {
    const frameworkName = path.basename(bundlePath, '.framework');
    const candidatePaths = [
      path.join(bundlePath, frameworkName),
      path.join(bundlePath, 'Versions', 'Current', frameworkName),
      path.join(bundlePath, 'Versions', 'A', frameworkName),
    ];

    for (const candidatePath of candidatePaths) {
      if (fs.existsSync(candidatePath)) {
        executables.add(candidatePath);
      }
    }

    if (executables.size === 0) {
      const versionsDir = path.join(bundlePath, 'Versions');
      if (fs.existsSync(versionsDir)) {
        for (const version of fs.readdirSync(versionsDir)) {
          const versionedExecutable = path.join(
            versionsDir,
            version,
            frameworkName,
          );
          if (fs.existsSync(versionedExecutable)) {
            executables.add(versionedExecutable);
          }
        }
      }
    }

    if (executables.size === 0) {
      console.warn(
        `Could not determine main executable for framework bundle ${bundlePath}`,
      );
    }
  }

  return executables;
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

  const shouldCodeSign = isCodeSigningEnabled();
  const identity = shouldCodeSign ? resolveSignIdentity() : '-';
  const useRuntime = shouldCodeSign;
  const signingType = shouldCodeSign ? identity : 'ad-hoc';

  console.log(`Signing app bundle (${signingType}): ${appPath}`);

  const bundles = findBundles(appPath);

  const bundleMainExecutables = new Set();
  for (const bundle of bundles) {
    for (const executable of collectBundleMainExecutables(bundle)) {
      bundleMainExecutables.add(executable);
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

  if (!shouldCodeSign) return;

  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;
  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.warn(
      'Skipping notarization: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, or APPLE_TEAM_ID not set',
    );
    return;
  }

  console.log(`Notarizing ${appPath}...`);
  const { notarize } = require('@electron/notarize');
  try {
    await notarize({
      appPath,
      appleId: APPLE_ID,
      appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
      teamId: APPLE_TEAM_ID,
    });
    console.log('Notarization complete');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `Notarization failed for ${path.basename(appPath)}: ${message}`,
    );
    throw error;
  }
};
