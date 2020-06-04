#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var projectDir = process.cwd();
var config = require(projectDir + "/cep-config");
var fs_1 = require("fs");
var path = require("path");
var manifest_1 = require("./templates/manifest");
var html_1 = require("./templates/html");
var debug_1 = require("./templates/debug");
var child_process_1 = require("child_process");
var browserify = require("browserify");
var budo = require("budo");
var utils_1 = require("./utils");
var syncFiles = require("sync-files");
function build(opts) {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    resolvePaths(opts);
                    clean(opts);
                    createHtml(opts);
                    createManifest(opts);
                    createDebug(opts);
                    if (opts.compilers.extendscript) {
                        opts.compilers.extendscript.forEach(function (src) {
                            typescriptCompileExtendScript(opts, src);
                        });
                    }
                    if (opts.compilers.cep) {
                        opts.compilers.cep.forEach(function (src) {
                            typescriptCompileCep(opts, src);
                        });
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4, copyAssets(opts)];
                case 2:
                    _a.sent();
                    return [4, copyPublic(opts)];
                case 3:
                    _a.sent();
                    return [4, copyNodeModules(opts)];
                case 4:
                    _a.sent();
                    return [3, 6];
                case 5:
                    err_1 = _a.sent();
                    console.log("Error while copying", err_1);
                    return [3, 6];
                case 6:
                    if (!opts.compilers.extendscript) return [3, 8];
                    return [4, Promise.all(opts.compilers.extendscript.map(function (src) {
                            return browserifyBundleExtendScript(opts, src);
                        }))];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    if (opts.compilers.cep) {
                        opts.compilers.cep.forEach(function (src) {
                            browserifyBundleCep(opts, src);
                        });
                    }
                    return [2];
            }
        });
    });
}
function watch(opts) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, build(opts)];
                case 1:
                    _a.sent();
                    symlink(opts);
                    if (opts.compilers.extendscript) {
                        opts.compilers.extendscript.map(function (src) {
                            typescriptWatchExtendScript(opts, src);
                        });
                    }
                    if (opts.compilers.cep) {
                        opts.compilers.cep.forEach(function (src) {
                            typescriptWatchCep(opts, src);
                        });
                    }
                    if (!opts.compilers.extendscript) return [3, 3];
                    return [4, Promise.all(opts.compilers.extendscript.map(function (src) {
                            return browserifyWatchExtendScript(opts, src);
                        }))];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    if (opts.compilers.cep) {
                        opts.compilers.cep.forEach(function (src, i) {
                            browserifyWatchCep(opts, src, i);
                        });
                    }
                    watchPublic(opts);
                    watchAssets(opts);
                    return [2];
            }
        });
    });
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
        extendscript: ["jsx"]
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
        opts.compilers.extendscript.forEach(function (src) {
            var key = src.toUpperCase().replace(/\//g, "_") + "_BUNDLE_PATH";
            process.env[key] = path.join(opts.paths.dest, src, "index.js");
        });
    }
    if (opts.compilers.cep) {
        opts.compilers.cep.forEach(function (src) {
            var key = src.toUpperCase().replace(/\//g, "_") + "_BUNDLE_PATH";
            process.env[key] = path.join(opts.paths.dest, src, "index.js");
        });
    }
}
function clean(opts) {
    console.log("-> clean");
    try {
        utils_1.rmrf(opts.paths.dest);
    }
    catch (e) { }
    try {
        utils_1.rmrf(opts.paths.build);
    }
    catch (e) { }
    try {
        utils_1.mkdirp(opts.paths.dest);
    }
    catch (e) { }
    try {
        utils_1.mkdirp(opts.paths.assets);
    }
    catch (e) { }
}
function createManifest(opts) {
    console.log("-> createManifest");
    utils_1.mkdirp(opts.paths.manifestDir);
    fs_1.writeFileSync(opts.paths.manifestFile, manifest_1["default"](opts));
}
function createHtml(opts) {
    console.log("-> createHtml");
    fs_1.writeFileSync(opts.paths.htmlFile, opts.htmlTemplate ? opts.htmlTemplate(opts) : html_1["default"](opts));
}
function createDebug(opts) {
    console.log("-> createDebug");
    fs_1.writeFileSync(opts.paths.debugFile, debug_1["default"](opts), "utf8");
}
function copyAssets(opts) {
    console.log("-> copyAssets");
    var dest = path.join(opts.paths.build, opts.paths.assets.replace(opts.paths.src, ""));
    utils_1.mkdirp(dest);
    return utils_1.cpr(opts.paths.assets + "/", dest);
}
function copyPublic(opts) {
    console.log("-> copyPublic");
    var publicSrc = path.join(projectDir, "public/");
    var publicDest = path.join(opts.paths.dest);
    return utils_1.cpr(publicSrc, publicDest);
}
function copyNodeModules(opts) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("-> copyNodeModules");
                    utils_1.mkdirp(path.join(opts.paths.dest, "node_modules"));
                    return [4, copyDeps(opts, projectDir + "/package.json")];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
function copyDeps(opts, pkg) {
    return __awaiter(this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, utils_1.cp(pkg, opts.paths.dest + "/package.json")];
                case 1:
                    _a.sent();
                    child_process_1.execSync("cd " + opts.paths.dest + "; " + (opts.npmClient || "npm") + " install --silent");
                    return [3, 3];
                case 2:
                    err_2 = _a.sent();
                    console.error("Error encountred while installing dependencies", err_2);
                    return [3, 3];
                case 3: return [2];
            }
        });
    });
}
function getTscPath(opts) {
    var tscPaths = (opts.tscBin ? [opts.tscBin] : []).concat([
        projectDir + "/node_modules/.bin/tsc",
        __dirname + "/../../.bin/tsc",
        __dirname + "/../node_modules/.bin/tsc",
    ]);
    var tscPath = null;
    while ((tscPath = tscPaths.shift())) {
        if (fs_1.existsSync(tscPath)) {
            break;
        }
    }
    return tscPath;
}
function typescriptCompileCep(opts, src) {
    console.log("-> typescriptCompileCep (" + src + ")");
    var tscPath = getTscPath(opts);
    var tsConfigFile = path.join(opts.paths.src, src, "tsconfig.json");
    try {
        child_process_1.execSync(tscPath + " --project " + tsConfigFile);
    }
    catch (err) {
        console.log(err.stdout.toString());
    }
}
function typescriptCompileExtendScript(opts, src) {
    console.log("-> typescriptCompileExtendScript (" + src + ")");
    var tscPath = getTscPath(opts);
    var tsConfigFile = path.join(opts.paths.src, src, "tsconfig.json");
    try {
        child_process_1.execSync(tscPath + " --project " + tsConfigFile);
    }
    catch (err) {
        console.log(err.stdout.toString());
    }
}
function browserifyBundleCep(opts, src) {
    console.log("-> browserifyBundleCep");
    var entryFile = path.join(opts.paths.build, src, "index.js");
    var transform = [
        require("babelify"),
        require("envify"),
        require("brfs")
    ].concat((opts.browserify &&
        opts.browserify[src] &&
        opts.browserify[src].transform
        ? opts.browserify[src].transform
        : []));
    var plugin = opts.browserify && opts.browserify[src] && opts.browserify[src].plugin
        ? opts.browserify[src].plugin
        : [];
    var bundler = browserify({
        entries: [entryFile],
        cache: {},
        packageCache: {},
        extensions: [".js", ".jsx"],
        transform: transform,
        plugin: plugin
    });
    utils_1.mkdirp(path.join(opts.paths.dest, src));
    var bundleFile = path.join(opts.paths.dest, src, "index.js");
    var writeStream = fs_1.createWriteStream(bundleFile);
    bundler
        .bundle()
        .on("error", function (err) { return console.error(err.message); })
        .pipe(writeStream);
}
function browserifyBundleExtendScript(opts, src) {
    console.log("-> browserifyBundleExtendScript");
    return new Promise(function (resolve) {
        var entryFile = path.join(opts.paths.build, src, "index.js");
        var transform = [
            require("envify"),
            require("brfs")
        ].concat((opts.browserify &&
            opts.browserify[src] &&
            opts.browserify[src].transform
            ? opts.browserify[src].transform
            : []));
        var plugin = [
            [require("prependify"), "var globalThis = this;"]
        ].concat((opts.browserify && opts.browserify[src] && opts.browserify[src].plugin
            ? opts.browserify[src].plugin
            : []));
        var bundler = browserify({
            entries: [entryFile],
            cache: {},
            packageCache: {},
            plugin: plugin,
            transform: transform
        });
        utils_1.mkdirp(path.join(opts.paths.dest, src));
        var bundleFile = path.join(opts.paths.dest, src, "index.js");
        var writeStream = fs_1.createWriteStream(bundleFile);
        writeStream.on("finish", resolve);
        bundler
            .bundle()
            .on("error", function (err) { return console.error(err.message); })
            .pipe(writeStream);
    });
}
function watchAssets(opts) {
    console.log("-> watchAssets");
    var dest = path.join(opts.paths.build, opts.paths.assets.replace(opts.paths.src, ""));
    return syncFiles(opts.paths.assets, dest, {
        watch: true,
        "delete": false
    }, function () { });
}
function watchPublic(opts) {
    console.log("-> watchPublic");
    var publicSrc = path.join(projectDir, "public/");
    var publicDest = path.join(opts.paths.dest);
    return syncFiles(publicSrc, publicDest, {
        watch: true,
        "delete": false
    }, function () { });
}
function typescriptWatchCep(opts, src) {
    console.log("-> typescriptWatchCep");
    var tscPath = getTscPath(opts);
    var tsConfigFile = path.join(opts.paths.src, src, "tsconfig.json");
    var jsTsc = child_process_1.spawn(tscPath, ["--watch", "--project", tsConfigFile], {
        env: process.env,
        stdio: "inherit"
    });
    process.on("exit", function () {
        jsTsc.kill();
    });
}
function typescriptWatchExtendScript(opts, src) {
    console.log("-> typescriptWatchExtendScript");
    var tscPath = getTscPath(opts);
    var tsConfigFile = path.join(opts.paths.src, src, "tsconfig.json");
    var jsxTsc = child_process_1.spawn(tscPath, ["--watch", "--project", tsConfigFile], {
        env: process.env,
        stdio: "inherit"
    });
    process.on("exit", function () {
        jsxTsc.kill();
    });
}
function browserifyWatchCep(opts, src, i) {
    console.log("-> browserifyWatchCep");
    var entryFile = path.join(opts.paths.build, src, "index.js");
    var transform = [
        require("babelify"),
        require("envify"),
        require("brfs")
    ].concat((opts.browserify &&
        opts.browserify[src] &&
        opts.browserify[src].transform
        ? opts.browserify[src].transform
        : []));
    var plugin = (opts.live
        ? [
            [
                require("livereactload"),
                { host: opts.livereactloadHost || "localhost" },
            ],
        ]
        : []).concat((opts.browserify && opts.browserify[src] && opts.browserify[src].plugin
        ? opts.browserify[src].plugin
        : []));
    budo(entryFile, {
        browserify: {
            debug: true,
            extensions: [".js", ".jsx"],
            transform: transform,
            plugin: plugin
        },
        live: false,
        port: opts.devPort + i,
        portfind: false,
        host: "0.0.0.0",
        dir: opts.paths.dest,
        stream: process.stdout
    });
}
function browserifyWatchExtendScript(opts, src) {
    console.log("-> browserifyWatchExtendScript");
    return new Promise(function (resolve) {
        var entryFile = path.join(opts.paths.build, src, "index.js");
        var transform = [
            require("envify"),
            require("brfs")
        ].concat((opts.browserify &&
            opts.browserify[src] &&
            opts.browserify[src].transform
            ? opts.browserify[src].transform
            : []));
        var plugin = [
            require("watchify"),
            [require("prependify"), "var globalThis = this;"]
        ].concat((opts.browserify && opts.browserify[src] && opts.browserify[src].plugin
            ? opts.browserify[src].plugin
            : []));
        var bundler = browserify({
            entries: [entryFile],
            cache: {},
            packageCache: {},
            plugin: plugin,
            transform: transform
        });
        utils_1.mkdirp(path.join(opts.paths.dest, src));
        function updateJsx() {
            console.log("-> updateJsx");
            var bundleFile = path.join(opts.paths.dest, src, "index.js");
            var writeStream = fs_1.createWriteStream(bundleFile);
            if (arguments.length > 0) {
                writeStream.on("finish", resolve);
            }
            bundler
                .bundle()
                .on("error", function (err) { return console.error(err.message); })
                .pipe(writeStream);
        }
        bundler.on("update", updateJsx);
        updateJsx();
    });
}
function symlink(opts) {
    console.log("-> symlink");
    try {
        utils_1.rmrf("/Library/Application Support/Adobe/CEP/extensions/" + opts.manifest.bundleId);
    }
    catch (err) { }
    utils_1.symlinkDir("/Library/Application Support/Adobe/CEP/extensions/" + opts.manifest.bundleId, opts.paths.dest);
}
var args = process.argv.slice(2);
if (args.length === 0) {
    args.push("watch");
}
var action = args.shift();
switch (action) {
    case "watch":
        watch(config.bundler);
        break;
    case "build":
        build(config.bundler);
        break;
}
