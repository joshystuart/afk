const { execSync } = require('child_process');
const path = require('path');

const serverDir = path.join(__dirname, '..', '..', 'server');
const electronDir = path.join(__dirname, '..');

const args = process.argv.slice(2).join(' ');

try {
  console.log('[1/4] Building electron...');
  execSync('npx tsc', { cwd: electronDir, stdio: 'inherit' });

  console.log('[2/4] Pruning server devDependencies...');
  execSync('npm prune --omit=dev', { cwd: serverDir, stdio: 'inherit' });

  console.log(`[3/4] Packaging with electron-builder...`);
  const publishFlag = args.includes('--publish') ? '' : '--publish never';
  execSync(
    `npx electron-builder --config electron-builder.config.js ${publishFlag} ${args}`,
    {
      cwd: electronDir,
      stdio: 'inherit',
    },
  );
} finally {
  console.log('[4/4] Restoring server devDependencies...');
  execSync('npm install', { cwd: serverDir, stdio: 'inherit' });
}
