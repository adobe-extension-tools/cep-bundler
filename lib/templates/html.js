"use strict";
exports.__esModule = true;
exports["default"] = (function (opts) { return "<html>\n  <head>\n    <title>" + opts.manifest.bundleId + "</title>\n    <style>\n    body {\n      background: #282827;\n      margin: 0;\n      padding: 0;\n    }\n    </style>\n  </head>\n  <body>\n    <script>\n    try {\n      if (window.cep_node) {\n        window.nodeRequire = function (path) {\n          if (path.substr(0, 1) === '.') {\n            return cep_node.require(__dirname + path.substr(1))\n          } else {\n            return cep_node.require(path)\n          }\n        }\n      } else {\n        window.nodeRequire = require\n      }\n    } catch (err) {\n      console.log(err)\n    }\n    </script>\n    " + (opts.compilers && opts.compilers.cep ? opts.compilers.cep.map(function (src, i) {
    return "<script src=\"" + (opts.live ? "http://localhost:" + (opts.devPort + i) + "/index.js" : "./" + src + "/index.js") + "\"></script>";
}) : '') + "\n  </body>\n</html>"; });
