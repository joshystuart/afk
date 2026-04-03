const { spawnSync } = require('child_process');

function runCommand(command, args, options = {}) {
  const { allowFailure = false, stdio = 'pipe' } = options;
  const result = spawnSync(command, args, {
    encoding: 'utf-8',
    stdio,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !allowFailure) {
    const stderr = result.stderr?.trim();
    throw new Error(
      `${command} exited with status ${result.status}${stderr ? `: ${stderr}` : ''}`,
    );
  }

  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status ?? 0,
  };
}

function isCodeSigningEnabled() {
  return !!(process.env.CSC_LINK || process.env.CSC_NAME);
}

function getSignKeychain() {
  return process.env.CSC_KEYCHAIN || process.env.KEYCHAIN_PATH || null;
}

function resolveSignIdentity() {
  if (process.env.CSC_NAME) {
    return process.env.CSC_NAME;
  }

  if (!isCodeSigningEnabled()) {
    return null;
  }

  const keychain = getSignKeychain();
  const args = ['find-identity', '-v', '-p', 'codesigning'];
  if (keychain) {
    args.push(keychain);
  }

  const { stdout } = runCommand('security', args, { allowFailure: true });
  const matches = [...stdout.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  const teamId = process.env.APPLE_TEAM_ID;

  const preferredIdentity =
    matches.find(
      (identity) =>
        identity.includes('Developer ID Application') &&
        (!teamId || identity.includes(`(${teamId})`)),
    ) ??
    matches.find((identity) => identity.includes('Developer ID Application'));

  if (preferredIdentity) {
    return preferredIdentity;
  }

  throw new Error(
    [
      'Code signing was requested but no Developer ID Application identity is available.',
      keychain
        ? `Expected to find one in keychain ${keychain}.`
        : 'No signing keychain was provided.',
      'Import the certificate into the runner keychain or set CSC_NAME to the full identity name.',
    ].join(' '),
  );
}

function buildCodesignArgs(identity, filePath, options = {}) {
  const {
    entitlements = null,
    useRuntime = false,
    timestamp = false,
  } = options;
  const args = ['--force', '--sign', identity];

  if (useRuntime) {
    args.push('--options', 'runtime', '--timestamp');
  } else if (timestamp) {
    args.push('--timestamp');
  }

  if (entitlements) {
    args.push('--entitlements', entitlements);
  }

  const keychain = getSignKeychain();
  if (keychain && identity !== '-') {
    args.push('--keychain', keychain);
  }

  args.push(filePath);
  return args;
}

module.exports = {
  buildCodesignArgs,
  getSignKeychain,
  isCodeSigningEnabled,
  resolveSignIdentity,
  runCommand,
};
