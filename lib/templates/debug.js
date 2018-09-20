"use strict";
exports.__esModule = true;
exports["default"] = (function (opts) { return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ExtensionList>\n  <Extension Id=\"" + opts.manifest.bundleId + "\">\n  <HostList>\n    " + opts.manifest.apps.map(function (app) { return "<Host Name=\"" + app.id + "\" Port=\"" + app.port + "\" />"; }).join('\n    ') + "\n  </HostList>\n  </Extension>\n</ExtensionList>"; });
