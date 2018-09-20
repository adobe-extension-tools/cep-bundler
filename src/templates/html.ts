export default (opts) => `<html>
  <head>
    <title>${opts.manifest.bundleId}</title>
    <style>
    body {
      background: #282827;
      margin: 0;
      padding: 0;
    }
    </style>
  </head>
  <body>
    <script>
    try {
      if (window.cep_node) {
        window.nodeRequire = function (path) {
          if (path.substr(0, 1) === '.') {
            return cep_node.require(__dirname + path.substr(1))
          } else {
            return cep_node.require(path)
          }
        }
      } else {
        window.nodeRequire = require
      }
    } catch (err) {
      console.log(err)
    }
    </script>
    ${opts.compilers && opts.compilers.cep ? opts.compilers.cep.map((src, i) =>
      `<script src="${opts.live ? `http://localhost:${opts.devPort + i}/index.js` : `./${src}/index.js`}"></script>`) : ''}
  </body>
</html>`
