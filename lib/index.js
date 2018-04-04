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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
                    typescriptCompileJsx(opts);
                    typescriptCompileJs(opts);
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
                    console.log('Error while copying', err_1);
                    return [3, 6];
                case 6: return [4, browserifyBundleJsx(opts)];
                case 7:
                    _a.sent();
                    browserifyBundleJs(opts);
                    return [2];
            }
        });
    });
}
function watch(opts) {
    return __awaiter(this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, build(opts)];
                case 1:
                    _a.sent();
                    return [3, 3];
                case 2:
                    err_2 = _a.sent();
                    return [3, 3];
                case 3:
                    symlink(opts);
                    typescriptWatchJs(opts);
                    typescriptWatchJsx(opts);
                    browserifyWatchJsx(opts);
                    browserifyWatchJs(opts);
                    watchPublic(opts);
                    watchAssets(opts);
                    return [2];
            }
        });
    });
}
function resolvePaths(opts) {
    console.log('-> resolvePaths');
    opts.paths = opts.paths || {};
    opts.paths.src = opts.paths.src || path.join(projectDir, opts.src);
    opts.paths.build = opts.paths.build || path.join(projectDir, opts.build);
    opts.paths.dest = opts.paths.dest || opts.dest.substr(0, 1) === '/' ? opts.dest : path.join(projectDir, opts.dest);
    opts.paths.manifestDir = opts.paths.manifestDir || path.join(opts.paths.dest, 'CSXS');
    opts.paths.manifestFile = opts.paths.manifestFile || path.join(opts.paths.manifestDir, 'manifest.xml');
    opts.paths.htmlFile = opts.paths.htmlFile || path.join(opts.paths.dest, 'index.html');
    opts.paths.debugFile = opts.paths.debugFile || path.join(opts.paths.dest, '.debug');
    process.env.JSX_BUNDLE_PATH = path.join(opts.paths.dest, 'index.jsx');
}
function clean(opts) {
    console.log('-> clean');
    try {
        utils_1.rmrf(opts.paths.dest);
    }
    catch (e) { }
    try {
        utils_1.mkdirp(opts.paths.dest);
    }
    catch (e) { }
    try {
        utils_1.mkdirp(path.join(opts.paths.src, 'js', 'assets'));
    }
    catch (e) { }
}
function createManifest(opts) {
    console.log('-> createManifest');
    utils_1.mkdirp(opts.paths.manifestDir);
    fs_1.writeFileSync(opts.paths.manifestFile, manifest_1["default"](opts));
}
function createHtml(opts) {
    console.log('-> createHtml');
    fs_1.writeFileSync(opts.paths.htmlFile, opts.htmlTemplate ? opts.htmlTemplate(opts) : html_1["default"](opts));
}
function createDebug(opts) {
    console.log('-> createDebug');
    fs_1.writeFileSync(opts.paths.debugFile, debug_1["default"](opts), 'utf8');
}
function copyAssets(opts) {
    console.log('-> copyAssets');
    var assetsSrc = path.join(opts.paths.src, 'js', 'assets');
    var assetsDest = path.join(opts.paths.build, 'js');
    return utils_1.cpr(assetsSrc, assetsDest);
}
function copyPublic(opts) {
    console.log('-> copyPublic');
    var publicSrc = path.join(projectDir, 'public/');
    var publicDest = path.join(opts.paths.dest);
    return utils_1.cpr(publicSrc, publicDest);
}
function copyNodeModules(opts) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('-> copyNodeModules');
                    utils_1.mkdirp(path.join(opts.paths.dest, 'node_modules'));
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
        var packageJson, deps, _i, _a, dep, err_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    packageJson = require(pkg);
                    deps = packageJson.dependencies || {};
                    _i = 0, _a = Object.keys(deps);
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3, 8];
                    dep = _a[_i];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4, utils_1.cpr(projectDir + "/node_modules/" + dep, opts.paths.dest + "/node_modules")];
                case 3:
                    _b.sent();
                    return [3, 5];
                case 4:
                    err_3 = _b.sent();
                    console.error('Error while copying', err_3);
                    return [3, 5];
                case 5: return [4, copyDeps(opts, projectDir + "/node_modules/" + dep + "/package.json")];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7:
                    _i++;
                    return [3, 1];
                case 8: return [2];
            }
        });
    });
}
function typescriptCompileJs(opts) {
    console.log('-> typescriptCompileJs');
    var tscPath = __dirname + "/../../.bin/tsc";
    if (!fs_1.existsSync(tscPath)) {
        tscPath = __dirname + "/../node_modules/.bin/tsc";
    }
    var tsConfigFile = path.join(opts.paths.src, 'js', 'tsconfig.json');
    try {
        child_process_1.execSync(tscPath + " --project " + tsConfigFile);
    }
    catch (err) {
        console.log(err.stdout.toString());
    }
}
function typescriptCompileJsx(opts) {
    console.log('-> typescriptCompileJsx');
    var tscPath = __dirname + "/../../.bin/tsc";
    if (!fs_1.existsSync(tscPath)) {
        tscPath = __dirname + "/../node_modules/.bin/tsc";
    }
    var tsConfigFile = path.join(opts.paths.src, 'jsx', 'tsconfig.json');
    try {
        child_process_1.execSync(tscPath + " --project " + tsConfigFile);
    }
    catch (err) {
        console.log(err.stdout.toString());
    }
}
function browserifyBundleJs(opts, cb) {
    if (cb === void 0) { cb = function () { }; }
    console.log('-> browserifyBundleJs');
    var entryFile = path.join(opts.paths.build, 'js', 'index.js');
    var transform = [];
    if (opts.browserify && opts.browserify.js && opts.browserify.js.transform) {
        transform = transform.concat(opts.browserify.js.transform);
    }
    transform = transform.concat([
        require('babelify'),
        require('envify'),
        require('brfs')
    ]);
    var bundler = browserify({
        entries: [entryFile],
        cache: {},
        packageCache: {},
        extensions: ['.js', '.jsx'],
        transform: transform,
        plugin: []
    });
    var bundleFile = path.join(opts.paths.dest, 'index.js');
    var writeStream = fs_1.createWriteStream(bundleFile);
    cb && writeStream.on('finish', cb);
    bundler.bundle()
        .on('error', function (err) { return console.error(err.message); })
        .pipe(writeStream);
}
function browserifyBundleJsx(opts) {
    console.log('-> browserifyBundeJsx');
    return new Promise(function (resolve) {
        var entryFile = path.join(opts.paths.build, 'jsx', 'index.js');
        var bundler = browserify({
            entries: [entryFile],
            cache: {},
            packageCache: {},
            plugin: [
                [require('prependify'), "var globalThis = this;"]
            ],
            transform: [
                require('envify'),
                require('brfs')
            ]
        });
        var bundleFile = path.join(opts.paths.dest, 'index.jsx');
        var writeStream = fs_1.createWriteStream(bundleFile);
        writeStream.on('finish', resolve);
        bundler.bundle()
            .on('error', function (err) { return console.error(err.message); })
            .pipe(writeStream);
    });
}
function watchAssets(opts) {
    console.log('-> watchAssets');
    var assetsSrc = path.join(opts.paths.src, 'js', 'assets');
    var assetsDest = path.join(opts.paths.build, 'js');
    return syncFiles(assetsSrc, assetsDest, {
        watch: true,
        "delete": false
    }, function () { });
}
function watchPublic(opts) {
    console.log('-> watchPublic');
    var publicSrc = path.join(projectDir, 'public/');
    var publicDest = path.join(opts.paths.dest);
    return syncFiles(publicSrc, publicDest, {
        watch: true,
        "delete": false
    }, function () { });
}
function typescriptWatchJs(opts) {
    console.log('-> typescriptWatchJs');
    var tscPath = __dirname + "/../../.bin/tsc";
    if (!fs_1.existsSync(tscPath)) {
        tscPath = __dirname + "/../node_modules/.bin/tsc";
    }
    var tsConfigFile = path.join(opts.paths.src, 'js', 'tsconfig.json');
    var jsTsc = child_process_1.spawn(tscPath, ['--watch', '--project', tsConfigFile], {
        env: process.env,
        stdio: 'inherit'
    });
    process.on('exit', function () {
        jsTsc.kill();
    });
}
function typescriptWatchJsx(opts) {
    console.log('-> typescriptWatchJsx');
    var tscPath = __dirname + "/../../.bin/tsc";
    if (!fs_1.existsSync(tscPath)) {
        tscPath = __dirname + "/../node_modules/.bin/tsc";
    }
    var tsConfigFile = path.join(opts.paths.src, 'jsx', 'tsconfig.json');
    var jsxTsc = child_process_1.spawn(tscPath, ['--watch', '--project', tsConfigFile], {
        env: process.env,
        stdio: 'inherit'
    });
    process.on('exit', function () {
        jsxTsc.kill();
    });
}
function browserifyWatchJs(opts) {
    console.log('-> browserifyWatchJs');
    var entryFile = path.join(opts.paths.build, 'js', 'index.js');
    var transform = [];
    if (opts.browserify && opts.browserify.js && opts.browserify.js.transform) {
        transform = transform.concat(opts.browserify.js.transform);
    }
    transform = transform.concat([
        require('babelify'),
        require('envify'),
        require('brfs')
    ]);
    budo(entryFile, {
        browserify: {
            debug: true,
            extensions: ['.js', '.jsx'],
            transform: transform,
            plugin: [
                [require('livereactload'), {
                        host: opts.livereactloadHost || 'localhost'
                    }]
            ]
        },
        live: false,
        port: opts.devPort,
        portfind: false,
        host: '0.0.0.0',
        dir: opts.paths.dest,
        stream: process.stdout
    });
}
function browserifyWatchJsx(opts) {
    console.log('-> browserifyWatchJsx');
    var entryFile = path.join(opts.paths.build, 'jsx', 'index.js');
    var bundler = browserify({
        entries: [entryFile],
        cache: {},
        packageCache: {},
        plugin: [
            require('watchify'),
            [require('prependify'), "var globalThis = this;"]
        ],
        transform: [
            require('envify'),
            require('brfs')
        ]
    });
    function updateJsx() {
        console.log('-> updateJsx');
        var bundleFile = path.join(opts.paths.dest, 'index.jsx');
        var writeStream = fs_1.createWriteStream(bundleFile);
        bundler.bundle()
            .on('error', function (err) { return console.error(err.message); })
            .pipe(writeStream);
    }
    bundler.on('update', updateJsx);
    updateJsx();
}
function symlink(opts) {
    console.log('-> symlink');
    try {
        utils_1.rmrf("/Library/Application Support/Adobe/CEP/extensions/" + opts.manifest.bundleId);
    }
    catch (err) { }
    utils_1.symlinkDir("/Library/Application Support/Adobe/CEP/extensions/" + opts.manifest.bundleId, opts.paths.dest);
}
var args = process.argv.slice(2);
if (args.length === 0) {
    args.push('watch');
}
var action = args.shift();
switch (action) {
    case 'watch':
        watch(config.bundler);
        break;
    case 'build':
        build(config.bundler);
        break;
}
