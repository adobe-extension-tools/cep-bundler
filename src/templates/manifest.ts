export default (opts) => {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ExtensionManifest xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ExtensionBundleId="${opts.manifest.bundleId}" ExtensionBundleName="${opts.manifest.name}" ExtensionBundleVersion="${typeof opts.manifest.version === "number" ? `${opts.manifest.version}.0.0` : opts.manifest.version}" Version="${opts.manifest.cepVersion}">
  <ExtensionList>
    <Extension Id="${opts.manifest.bundleId}" Version="${typeof opts.manifest.version === "number" ? `${opts.manifest.version}.0.0` : opts.manifest.version}"/>
  </ExtensionList>
  <ExecutionEnvironment>
    <HostList>
      ${opts.manifest.apps.map(app => `<Host Name="${app.id}" Version="[${app.from},${app.to}]" />`).join('\n      ')}
    </HostList>
    <LocaleList>
      <Locale Code="All"/>
    </LocaleList>
    <RequiredRuntimeList>
      <RequiredRuntime Name="CSXS" Version="${opts.manifest.cepVersion}"/>
    </RequiredRuntimeList>
  </ExecutionEnvironment>
  <DispatchInfoList>
    <Extension Id="${opts.manifest.bundleId}">
      <DispatchInfo>
        <Resources>
          <MainPath>./index.html</MainPath>
          <CEFCommandLine>
            ${opts.manifest.cefParams.map(cefParam => `<Parameter>${cefParam}</Parameter>`).join('\n      ')}
          </CEFCommandLine>
        </Resources>
        <Lifecycle>
          <AutoVisible>true</AutoVisible>
        </Lifecycle>
        <UI>
          <Type>Panel</Type>
          <Menu>${opts.manifest.name}</Menu>
          <Geometry>
            <Size>
              <Height>200</Height>
              <Width>200</Width>
            </Size>
            <MaxSize>
              <Height>10000</Height>
              <Width>10000</Width>
            </MaxSize>
            <MinSize>
              <Height>200</Height>
              <Width>200</Width>
            </MinSize>
          </Geometry>
        </UI>
      </DispatchInfo>
    </Extension>
  </DispatchInfoList>
</ExtensionManifest>`
}
