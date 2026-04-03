/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'com.afk.desktop',
  productName: 'AFK',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: ['dist/**/*', 'package.json'],
  extraResources: [
    {
      from: '../server/dist',
      to: 'server/dist',
      filter: ['**/*'],
    },
    {
      from: '../server/node_modules',
      to: 'server/node_modules',
      filter: ['**/*'],
    },
    {
      from: '../server/package.json',
      to: 'server/package.json',
    },
    {
      from: '../web/dist',
      to: 'web/dist',
      filter: ['**/*'],
    },
    {
      from: 'config/.env.yaml',
      to: 'server/dist/config/.env.yaml',
    },
    {
      from: 'build/icon.png',
      to: 'electron/build/icon.png',
    },
  ],
  publish: null,
  afterPack: './scripts/afterPack.js',
  afterAllArtifactBuild: './scripts/afterAllArtifactBuild.js',
  mac: {
    category: 'public.app-category.developer-tools',
    icon: 'build/icon.icns',
    target: [
      {
        target: 'dmg',
        arch: ['arm64', 'x64'],
      },
      {
        target: 'zip',
        arch: ['arm64', 'x64'],
      },
    ],
    darkModeSupport: true,
    hardenedRuntime: false,
    gatekeeperAssess: false,
    identity: null,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
  },
  dmg: {
    contents: [
      {
        x: 130,
        y: 220,
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications',
      },
    ],
  },
};
