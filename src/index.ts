#!/usr/bin/env node

const projectDir = process.cwd();
const config = require(`${projectDir}/cep-config`);

import { writeFileSync, createWriteStream, existsSync } from "fs";
import * as path from "path";
import manifestTemplate from "./templates/manifest";
import htmlTemplate from "./templates/html";
import debugTemplate from "./templates/debug";
import { execSync, spawn } from "child_process";
import * as browserify from "browserify";
import * as budo from "budo";
import { copyAndReplace, rmrf, mkdirp, cp, cpr, symlinkDir } from "./utils";
import * as syncFiles from "sync-files";

async function build(opts) {
  resolvePaths(opts);
  clean(opts);
  createHtml(opts);
  createManifest(opts);
  createDebug(opts);
  if (opts.compilers.extendscript) {
    opts.compilers.extendscript.forEach((src) => {
      typescriptCompileExtendScript(opts, src);
    });
  }
  if (opts.compilers.cep) {
    opts.compilers.cep.forEach((src) => {
      typescriptCompileCep(opts, src);
    });
  }
  try {
    await copyAssets(opts);
    await copyPublic(opts);
    await copyNodeModules(opts);
  } catch (err) {
    console.log("Error while copying", err);
  }
  if (opts.compilers.extendscript) {
    await Promise.all(
      opts.compilers.extendscript.map((src) => {
        return browserifyBundleExtendScript(opts, src);
      })
    );
  }
  if (opts.compilers.cep) {
    opts.compilers.cep.forEach((src) => {
      browserifyBundleCep(opts, src);
    });
  }
}

async function watch(opts) {
  await build(opts);
  symlink(opts);
  if (opts.compilers.extendscript) {
    opts.compilers.extendscript.map((src) => {
      typescriptWatchExtendScript(opts, src);
    });
  }
  if (opts.compilers.cep) {
    opts.compilers.cep.forEach((src) => {
      typescriptWatchCep(opts, src);
    });
  }
  if (opts.compilers.extendscript) {
    await Promise.all(
      opts.compilers.extendscript.map((src) => {
        return browserifyWatchExtendScript(opts, src);
      })
    );
  }
  if (opts.compilers.cep) {
    opts.compilers.cep.forEach((src, i) => {
      browserifyWatchCep(opts, src, i);
    });
  }
  watchPublic(opts);
  watchAssets(opts);
}

function resolvePaths(opts) {
  console.log("-> resolvePaths");
  opts.paths = opts.paths || {};
  opts.paths.src =
    opts.paths.src || opts.src.substr(0, 1) === "/"
      ? opts.src
      : path.join(projectDir, opts.src);
  opts.paths.assets =
    opts.paths.assets || opts.assets
      ? opts.assets.substr(0, 1) === "/"
        ? opts.assets
        : path.join(opts.paths.src, opts.assets)
      : path.join(opts.paths.src, "js", "assets");
  opts.paths.build =
    opts.paths.build || opts.build.substr(0, 1) === "/"
      ? opts.build
      : path.join(projectDir, opts.build);
  opts.paths.dest =
    opts.paths.dest || opts.dest.substr(0, 1) === "/"
      ? opts.dest
      : path.join(projectDir, opts.dest);
  opts.compilers = opts.compilers || {
    cep: ["js"],
    extendscript: ["jsx"],
  };
  opts.paths.manifestDir =
    opts.paths.manifestDir || path.join(opts.paths.dest, "CSXS");
  opts.paths.manifestFile =
    opts.paths.manifestFile ||
    path.join(opts.paths.manifestDir, "manifest.xml");
  opts.paths.htmlFile =
    opts.paths.htmlFile || path.join(opts.paths.dest, "index.html");
  opts.paths.debugFile =
    opts.paths.debugFile || path.join(opts.paths.dest, ".debug");
  if (opts.compilers.extendscript) {
    opts.compilers.extendscript.forEach((src) => {
      const key = src.toUpperCase().replace(/\//g, "_") + "_BUNDLE_PATH";
      process.env[key] = path.join(opts.paths.dest, src, "index.js");
    });
  }
  if (opts.compilers.cep) {
    opts.compilers.cep.forEach((src) => {
      const key = src.toUpperCase().replace(/\//g, "_") + "_BUNDLE_PATH";
      process.env[key] = path.join(opts.paths.dest, src, "index.js");
    });
  }
}

function clean(opts) {
  console.log("-> clean");
  try {
    rmrf(opts.paths.dest);
  } catch (e) {}
  try {
    rmrf(opts.paths.build);
  } catch (e) {}
  try {
    mkdirp(opts.paths.dest);
  } catch (e) {}
  try {
    mkdirp(opts.paths.assets);
  } catch (e) {}
}

function createManifest(opts) {
  console.log("-> createManifest");
  mkdirp(opts.paths.manifestDir);
  writeFileSync(opts.paths.manifestFile, manifestTemplate(opts));
}

function createHtml(opts) {
  console.log("-> createHtml");
  writeFileSync(
    opts.paths.htmlFile,
    opts.htmlTemplate ? opts.htmlTemplate(opts) : htmlTemplate(opts)
  );
}

function createDebug(opts) {
  console.log("-> createDebug");
  writeFileSync(opts.paths.debugFile, debugTemplate(opts), "utf8");
}

function copyAssets(opts) {
  console.log("-> copyAssets");
  const dest = path.join(
    opts.paths.build,
    opts.paths.assets.replace(opts.paths.src, "")
  );
  mkdirp(dest);
  return cpr(opts.paths.assets + "/", dest);
}

function copyPublic(opts) {
  console.log("-> copyPublic");
  const publicSrc = path.join(projectDir, "public/");
  const publicDest = path.join(opts.paths.dest);
  return cpr(publicSrc, publicDest);
}

async function copyNodeModules(opts) {
  console.log("-> copyNodeModules");
  mkdirp(path.join(opts.paths.dest, "node_modules"));
  await copyDeps(opts, `${projectDir}/package.json`);
}

async function copyDeps(opts, pkg) {
  try {
    await cp(pkg, `${opts.paths.dest}/package.json`);
    execSync(
      `cd ${opts.paths.dest}; ${opts.npmClient || "npm"} install --silent`
    );
  } catch (err) {
    console.error("Error encountred while installing dependencies", err);
  }
}

function getTscPath(opts) {
  const tscPaths = [
    ...(opts.tscBin ? [opts.tscBin] : []),
    `${projectDir}/node_modules/.bin/tsc`,
    `${__dirname}/../../.bin/tsc`,
    `${__dirname}/../node_modules/.bin/tsc`,
  ];
  let tscPath = null;
  while ((tscPath = tscPaths.shift())) {
    if (existsSync(tscPath)) {
      break;
    }
  }
  return tscPath;
}

function typescriptCompileCep(opts, src) {
  console.log(`-> typescriptCompileCep (${src})`);
  const tscPath = getTscPath(opts);
  const tsConfigFile = path.join(opts.paths.src, src, "tsconfig.json");
  try {
    execSync(`${tscPath} --project ${tsConfigFile}`);
  } catch (err) {
    console.log(err.stdout.toString());
  }
}

function typescriptCompileExtendScript(opts, src) {
  console.log(`-> typescriptCompileExtendScript (${src})`);
  const tscPath = getTscPath(opts);
  const tsConfigFile = path.join(opts.paths.src, src, "tsconfig.json");
  try {
    execSync(`${tscPath} --project ${tsConfigFile}`);
  } catch (err) {
    console.log(err.stdout.toString());
  }
}

function browserifyBundleCep(opts, src) {
  console.log("-> browserifyBundleCep");
  const entryFile = path.join(opts.paths.build, src, "index.js");
  const transform = [
    require("babelify"),
    require("envify"),
    require("brfs"),
    ...(opts.browserify &&
    opts.browserify[src] &&
    opts.browserify[src].transform
      ? opts.browserify[src].transform
      : []),
  ];
  const plugin =
    opts.browserify && opts.browserify[src] && opts.browserify[src].plugin
      ? opts.browserify[src].plugin
      : [];
  const bundler = browserify({
    entries: [entryFile],
    cache: {},
    packageCache: {},
    extensions: [".js", ".jsx"],
    transform,
    plugin,
  });
  mkdirp(path.join(opts.paths.dest, src));
  const bundleFile = path.join(opts.paths.dest, src, "index.js");
  const writeStream = createWriteStream(bundleFile);
  bundler
    .bundle()
    .on("error", (err) => console.error(err.message))
    .pipe(writeStream);
}

function browserifyBundleExtendScript(opts, src) {
  console.log("-> browserifyBundleExtendScript");
  return new Promise((resolve) => {
    const entryFile = path.join(opts.paths.build, src, "index.js");
    const transform = [
      require("envify"),
      require("brfs"),
      ...(opts.browserify &&
      opts.browserify[src] &&
      opts.browserify[src].transform
        ? opts.browserify[src].transform
        : []),
    ];
    const plugin = [
      [require("prependify"), `var globalThis = this;`],
      ...(opts.browserify && opts.browserify[src] && opts.browserify[src].plugin
        ? opts.browserify[src].plugin
        : []),
    ];
    const bundler = browserify({
      entries: [entryFile],
      cache: {},
      packageCache: {},
      plugin,
      transform,
    });
    mkdirp(path.join(opts.paths.dest, src));
    const bundleFile = path.join(opts.paths.dest, src, "index.js");
    const writeStream = createWriteStream(bundleFile);
    writeStream.on("finish", resolve);
    bundler
      .bundle()
      .on("error", (err) => console.error(err.message))
      .pipe(writeStream);
  });
}

function watchAssets(opts) {
  console.log("-> watchAssets");
  const dest = path.join(
    opts.paths.build,
    opts.paths.assets.replace(opts.paths.src, "")
  );
  return syncFiles(
    opts.paths.assets,
    dest,
    {
      watch: true,
      delete: false,
    },
    () => {}
  );
}

function watchPublic(opts) {
  console.log("-> watchPublic");
  const publicSrc = path.join(projectDir, "public/");
  const publicDest = path.join(opts.paths.dest);
  return syncFiles(
    publicSrc,
    publicDest,
    {
      watch: true,
      delete: false,
    },
    () => {}
  );
}

function typescriptWatchCep(opts, src) {
  console.log("-> typescriptWatchCep");
  const tscPath = getTscPath(opts);
  const tsConfigFile = path.join(opts.paths.src, src, "tsconfig.json");
  const jsTsc = spawn(tscPath, ["--watch", "--project", tsConfigFile], {
    env: process.env,
    stdio: "inherit",
  });
  process.on("exit", function () {
    jsTsc.kill();
  });
}

function typescriptWatchExtendScript(opts, src) {
  console.log("-> typescriptWatchExtendScript");
  const tscPath = getTscPath(opts);
  const tsConfigFile = path.join(opts.paths.src, src, "tsconfig.json");
  const jsxTsc = spawn(tscPath, ["--watch", "--project", tsConfigFile], {
    env: process.env,
    stdio: "inherit",
  });
  process.on("exit", function () {
    jsxTsc.kill();
  });
}

function browserifyWatchCep(opts, src, i) {
  console.log("-> browserifyWatchCep");
  const entryFile = path.join(opts.paths.build, src, "index.js");
  const transform = [
    require("babelify"),
    require("envify"),
    require("brfs"),
    ...(opts.browserify &&
    opts.browserify[src] &&
    opts.browserify[src].transform
      ? opts.browserify[src].transform
      : []),
  ];
  const plugin = [
    ...(opts.live
      ? [
          [
            require("livereactload"),
            { host: opts.livereactloadHost || "localhost" },
          ],
        ]
      : []),
    ...(opts.browserify && opts.browserify[src] && opts.browserify[src].plugin
      ? opts.browserify[src].plugin
      : []),
  ];
  budo(entryFile, {
    browserify: {
      debug: true,
      extensions: [".js", ".jsx"],
      transform,
      plugin,
    },
    live: false,
    port: opts.devPort + i,
    portfind: false,
    host: "0.0.0.0",
    dir: opts.paths.dest,
    stream: process.stdout,
  });
}

function browserifyWatchExtendScript(opts, src) {
  console.log("-> browserifyWatchExtendScript");
  return new Promise((resolve) => {
    const entryFile = path.join(opts.paths.build, src, "index.js");
    const transform = [
      require("envify"),
      require("brfs"),
      ...(opts.browserify &&
      opts.browserify[src] &&
      opts.browserify[src].transform
        ? opts.browserify[src].transform
        : []),
    ];
    const plugin = [
      require("watchify"),
      [require("prependify"), `var globalThis = this;`],
      ...(opts.browserify && opts.browserify[src] && opts.browserify[src].plugin
        ? opts.browserify[src].plugin
        : []),
    ];
    const bundler = browserify({
      entries: [entryFile],
      cache: {},
      packageCache: {},
      plugin,
      transform,
    });
    mkdirp(path.join(opts.paths.dest, src));
    function updateJsx() {
      console.log("-> updateJsx");
      const bundleFile = path.join(opts.paths.dest, src, "index.js");
      const writeStream = createWriteStream(bundleFile);
      if (arguments.length > 0) {
        writeStream.on("finish", resolve);
      }
      bundler
        .bundle()
        .on("error", (err) => console.error(err.message))
        .pipe(writeStream);
    }
    bundler.on("update", updateJsx);
    updateJsx();
  });
}

function symlink(opts) {
  console.log("-> symlink");
  try {
    rmrf(
      `/Library/Application Support/Adobe/CEP/extensions/${opts.manifest.bundleId}`
    );
  } catch (err) {}
  symlinkDir(
    `/Library/Application Support/Adobe/CEP/extensions/${opts.manifest.bundleId}`,
    opts.paths.dest
  );
}

const args = process.argv.slice(2);

if (args.length === 0) {
  args.push("watch");
}

const action = args.shift();

switch (action) {
  case "watch":
    watch(config.bundler);
    break;
  case "build":
    build(config.bundler);
    break;
}
