export default (opts) => `<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
  <Extension Id="${opts.manifest.bundleId}">
  <HostList>
    ${opts.manifest.apps.map(app => `<Host Name="${app.id}" Port="${app.port}" />`).join('\n    ')}
  </HostList>
  </Extension>
</ExtensionList>`
