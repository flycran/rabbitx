import pkg from '../package.json'

const sharedManifest: Partial<chrome.runtime.ManifestBase> = {
  content_scripts: [
    {
      js: ['src/entries/contentScript/contentScript.ts'],
      matches: ['*://*/*'],
    },
  ],
  icons: {
    16: 'icons/16.png',
    19: 'icons/19.png',
    32: 'icons/32.png',
    38: 'icons/38.png',
    48: 'icons/48.png',
    64: 'icons/64.png',
    96: 'icons/96.png',
    128: 'icons/128.png',
    256: 'icons/256.png',
    512: 'icons/512.png',
  },
  permissions: [],
  devtools_page: 'src/entries/devtools/entrance.html',
}

const browserAction = {
  default_icon: {
    16: 'icons/16.png',
    19: 'icons/19.png',
    32: 'icons/32.png',
    38: 'icons/38.png',
  },
  default_popup: 'src/entries/popup/index.html',
}

const ManifestV2 = {
  ...sharedManifest,
  background: {
    scripts: ['src/entries/background/script.ts'],
    persistent: true,
  },
  browser_action: browserAction,
  options_ui: {
    ...sharedManifest.options_ui,
    chrome_style: false,
  },
  permissions: [...sharedManifest.permissions, '*://*/*'],
}

const ManifestV3 = {
  ...sharedManifest,
  action: browserAction,
  background: {
    service_worker: 'src/entries/background/serviceWorker.ts',
  },
  host_permissions: ['*://*/*'],
}

export function getManifest(manifestVersion: number): chrome.runtime.ManifestV2 | chrome.runtime.ManifestV3 {
  const manifest = {
    author: (pkg as any).author,
    description: (pkg as any).description,
    name: (pkg as any).displayName ?? (pkg as any).name,
    version: (pkg as any).version,
  }

  if (manifestVersion === 2) {
    return {
      ...manifest,
      ...ManifestV2,
      manifest_version: manifestVersion,
    }
  }

  if (manifestVersion === 3) {
    return {
      ...manifest,
      ...ManifestV3,
      manifest_version: manifestVersion,
    }
  }

  throw new Error(`Missing manifest definition for manifestVersion ${manifestVersion}`)
}
