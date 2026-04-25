/**
 * Trust system + user-installed CAs (needed for mkcert HTTPS on Android 7+).
 * Without this, fetch() to https://localhost or https://127.0.0.1 may fail with "Network request failed".
 */
const fs = require('fs');
const path = require('path');

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

const XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
      <certificates src="user" />
    </trust-anchors>
  </base-config>
</network-security-config>
`;

function withAndroidNetworkSecurityFile(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const project = config.modRequest.platformProjectRoot;
      const dest = path.join(project, 'app/src/main/res/xml/network_security_config.xml');
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, XML);
      return config;
    },
  ]);
}

function withAndroidNetworkSecurityManifest(config) {
  return withAndroidManifest(config, (config) => {
    const applications = config.modResults.manifest.application;
    if (!Array.isArray(applications) || applications.length < 1) {
      return config;
    }
    const app = applications[0];
    if (!app.$) {
      app.$ = {};
    }
    app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return config;
  });
}

module.exports = function withAndroidUserCA(config) {
  config = withAndroidNetworkSecurityFile(config);
  config = withAndroidNetworkSecurityManifest(config);
  return config;
};
