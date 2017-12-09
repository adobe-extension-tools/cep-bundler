"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var child_process_1 = require("child_process");
var rimraf = require("rimraf");
var mkdirplib = require("mkdirp");
function copyAndReplace(from, to, replace) {
    var contents = fs_1.readFileSync(from, 'utf8');
    Object.keys(replace).forEach(function (key) {
        contents = contents.replace(new RegExp("" + key, 'g'), replace[key]);
    });
    fs_1.writeFileSync(to, contents);
}
exports.copyAndReplace = copyAndReplace;
function rmrf(path) {
    rimraf.sync(path);
}
exports.rmrf = rmrf;
function mkdirp(path) {
    mkdirplib.sync(path);
}
exports.mkdirp = mkdirp;
function cp(from, to) {
    fs_1.writeFileSync(to, fs_1.readFileSync(from, 'utf8'));
}
exports.cp = cp;
function cpr(from, to) {
    child_process_1.execSync("cp -r \"" + from + "\" \"" + to + "\"");
    return Promise.resolve();
}
exports.cpr = cpr;
function symlinkDir(from, to) {
    fs_1.symlinkSync(to, from, 'dir');
}
exports.symlinkDir = symlinkDir;
