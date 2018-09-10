#!/usr/bin/env node

const projectDir = process.cwd()
const config = require(`${projectDir}/cep-config`)

import { writeFileSync, createWriteStream, existsSync } from 'fs'
import * as path from 'path'
import manifestTemplate from './templates/manifest'
import htmlTemplate from './templates/html'
import debugTemplate from './templates/debug'
import { execSync, spawn } from 'child_process'
import * as browserify from 'browserify'
import * as budo from 'budo'
import {
  copyAndReplace,
  rmrf,
  mkdirp,
  cp,
  cpr,
  symlinkDir
} from './utils'
import * as syncFiles from 'sync-files'

async function build(opts) {
  resolvePaths(opts)
  clean(opts)
  createHtml(opts)
  createManifest(opts)
  createDebug(opts)
  typescriptCompileJsx(opts)
  typescriptCompileJs(opts)
  try {
    await copyAssets(opts)
    await copyPublic(opts)
    await copyNodeModules(opts)    
  } catch (err) {
    console.log('Error while copying', err)
  }
  await browserifyBundleJsx(opts)
  browserifyBundleJs(opts)
}

async function watch(opts) {
  try {
    await build(opts)
  } catch (err) {}
  symlink(opts)
  typescriptWatchJs(opts)
  typescriptWatchJsx(opts)
  browserifyWatchJsx(opts)
  browserifyWatchJs(opts)
  watchPublic(opts)
  watchAssets(opts)
}

function resolvePaths(opts) {
  console.log('-> resolvePaths')
  opts.paths = opts.paths || {}
  opts.paths.src = opts.paths.src || path.join(projectDir, opts.src)
  opts.paths.build = opts.paths.build || path.join(projectDir, opts.build)
  opts.paths.dest = opts.paths.dest || opts.dest.substr(0, 1) === '/' ? opts.dest : path.join(projectDir, opts.dest)
  opts.paths.manifestDir = opts.paths.manifestDir || path.join(opts.paths.dest, 'CSXS')
  opts.paths.manifestFile = opts.paths.manifestFile || path.join(opts.paths.manifestDir, 'manifest.xml')
  opts.paths.htmlFile = opts.paths.htmlFile || path.join(opts.paths.dest, 'index.html')
  opts.paths.debugFile = opts.paths.debugFile || path.join(opts.paths.dest, '.debug')
  process.env.JSX_BUNDLE_PATH = path.join(opts.paths.dest, 'index.jsx')
}

function clean(opts) {
  console.log('-> clean')
  try {
    rmrf(opts.paths.dest)
  } catch (e) {}
  try {
    mkdirp(opts.paths.dest)
  } catch (e) {}
  try {
    mkdirp(path.join(opts.paths.src, 'js', 'assets'))
  } catch (e) {}
}

function createManifest(opts) {
  console.log('-> createManifest')
  mkdirp(opts.paths.manifestDir)
  writeFileSync(opts.paths.manifestFile, manifestTemplate(opts))
}

function createHtml(opts) {
  console.log('-> createHtml')
  writeFileSync(opts.paths.htmlFile, opts.htmlTemplate ? opts.htmlTemplate(opts) : htmlTemplate(opts))
}

function createDebug(opts) {
  console.log('-> createDebug')
  writeFileSync(opts.paths.debugFile, debugTemplate(opts), 'utf8')
}

function copyAssets(opts) {
  console.log('-> copyAssets')
  const assetsSrc = path.join(opts.paths.src, 'js', 'assets')
  const assetsDest = path.join(opts.paths.build, 'js')
  return cpr(assetsSrc, assetsDest)
}

function copyPublic(opts) {
  console.log('-> copyPublic')
  const publicSrc = path.join(projectDir, 'public/')
  const publicDest = path.join(opts.paths.dest)
  return cpr(publicSrc, publicDest)
}

async function copyNodeModules(opts) {
  console.log('-> copyNodeModules')
  mkdirp(path.join(opts.paths.dest, 'node_modules'))
  await copyDeps(opts, `${projectDir}/package.json`)
}

async function copyDeps(opts, pkg) {
  const packageJson = require(pkg)
  const deps = packageJson.dependencies || {}
  for (const dep of Object.keys(deps)) {
    try {
      await cpr(`${projectDir}/node_modules/${dep}`, `${opts.paths.dest}/node_modules`)
    } catch (err) {
      console.error('Error while copying', err)
    }
    await copyDeps(opts, `${projectDir}/node_modules/${dep}/package.json`)
  }
}

function typescriptCompileJs(opts) {
  console.log('-> typescriptCompileJs')
  let tscPath = `${__dirname}/../../.bin/tsc`
  if (!existsSync(tscPath)) {
    tscPath = `${__dirname}/../node_modules/.bin/tsc`
  }
  const tsConfigFile = path.join(opts.paths.src, 'js', 'tsconfig.json')
  try {
    execSync(`${tscPath} --project ${tsConfigFile}`)
  } catch (err) {
    console.log(err.stdout.toString())
  }
}

function typescriptCompileJsx(opts) {
  console.log('-> typescriptCompileJsx')
  let tscPath = `${__dirname}/../../.bin/tsc`
  if (!existsSync(tscPath)) {
    tscPath = `${__dirname}/../node_modules/.bin/tsc`
  }
  const tsConfigFile = path.join(opts.paths.src, 'jsx', 'tsconfig.json')
  try {
    execSync(`${tscPath} --project ${tsConfigFile}`)
  } catch (err) {
    console.log(err.stdout.toString())
  }
}

function browserifyBundleJs(opts, cb = () => {}) {
  console.log('-> browserifyBundleJs')
  const entryFile = path.join(opts.paths.build, 'js', 'index.js')
  let transform = []
  if (opts.browserify && opts.browserify.js && opts.browserify.js.transform) {
    transform = transform.concat(opts.browserify.js.transform)
  }
  transform = transform.concat([
    require('babelify'),
    require('envify'),
    require('brfs')
  ])
  const bundler = browserify({
    entries: [entryFile],
    cache: {},
    packageCache: {},
    extensions: ['.js', '.jsx'],
    transform: transform,
    plugin: []
  })
  const bundleFile = path.join(opts.paths.dest, 'index.js')
  const writeStream = createWriteStream(bundleFile)
  cb && writeStream.on('finish', cb)
  bundler.bundle()
    .on('error', err => console.error(err.message))
    .pipe(writeStream)
}

function browserifyBundleJsx(opts) {
  console.log('-> browserifyBundeJsx')
  return new Promise(resolve => {
    const entryFile = path.join(opts.paths.build, 'jsx', 'index.js')
    const bundler = browserify({
      entries: [entryFile],
      cache: {},
      packageCache: {},
      plugin: [
        [require('prependify'), `var globalThis = this;`]
      ],
      transform: [
        require('envify'),
        require('brfs')
      ]
    })
    const bundleFile = path.join(opts.paths.dest, 'index.jsx')
    const writeStream = createWriteStream(bundleFile)
    writeStream.on('finish', resolve)
    bundler.bundle()
      .on('error', err => console.error(err.message))
      .pipe(writeStream)
  })
}

function watchAssets(opts) {
  console.log('-> watchAssets')
  const assetsSrc = path.join(opts.paths.src, 'js', 'assets')
  const assetsDest = path.join(opts.paths.build, 'js')
  return syncFiles(assetsSrc, assetsDest, {
    watch: true,
    delete: false
  }, () => {})
}

function watchPublic(opts) {
  console.log('-> watchPublic')
  const publicSrc = path.join(projectDir, 'public/')
  const publicDest = path.join(opts.paths.dest)
  return syncFiles(publicSrc, publicDest, {
    watch: true,
    delete: false
  }, () => {})
}

function typescriptWatchJs(opts) {
  console.log('-> typescriptWatchJs')
  let tscPath = `${__dirname}/../../.bin/tsc`
  if (!existsSync(tscPath)) {
    tscPath = `${__dirname}/../node_modules/.bin/tsc`
  }
  const tsConfigFile = path.join(opts.paths.src, 'js', 'tsconfig.json')
  const jsTsc = spawn(tscPath, ['--watch', '--project', tsConfigFile], {
    env: process.env,
    stdio: 'inherit'
  })
  process.on('exit', function () {
    jsTsc.kill()
  })
}

function typescriptWatchJsx(opts) {
  console.log('-> typescriptWatchJsx')
  let tscPath = `${__dirname}/../../.bin/tsc`
  if (!existsSync(tscPath)) {
    tscPath = `${__dirname}/../node_modules/.bin/tsc`
  }
  const tsConfigFile = path.join(opts.paths.src, 'jsx', 'tsconfig.json')
  const jsxTsc = spawn(tscPath, ['--watch', '--project', tsConfigFile], {
    env: process.env,
    stdio: 'inherit'
  })
  process.on('exit', function () {
    jsxTsc.kill()
  })
}

function browserifyWatchJs(opts) {
  console.log('-> browserifyWatchJs')
  const entryFile = path.join(opts.paths.build, 'js', 'index.js')
  let transform = []
  if (opts.browserify && opts.browserify.js && opts.browserify.js.transform) {
    transform = transform.concat(opts.browserify.js.transform)
  }
  transform = transform.concat([
    require('babelify'),
    require('envify'),
    require('brfs')
  ])
  budo(entryFile, {
    browserify: {
      debug: true,
      extensions: ['.js', '.jsx'],
      transform: transform,
      plugin: opts.live
        ? [
          [require('livereactload'), {
            host: opts.livereactloadHost || 'localhost'
          }]
        ]
        : []
    },
    live: false,
    port: opts.devPort,
    portfind: false,
    host: '0.0.0.0',
    dir: opts.paths.dest,
    stream: process.stdout
  })
}

function browserifyWatchJsx(opts) {
  console.log('-> browserifyWatchJsx')
  const entryFile = path.join(opts.paths.build, 'jsx', 'index.js')
  const bundler = browserify({
    entries: [entryFile],
    cache: {},
    packageCache: {},
    plugin: [
      require('watchify'),
      [require('prependify'), `var globalThis = this;`]
    ],
    transform: [
      require('envify'),
      require('brfs')
    ]
  })
  function updateJsx() {
    console.log('-> updateJsx')
    const bundleFile = path.join(opts.paths.dest, 'index.jsx')
    const writeStream = createWriteStream(bundleFile)
    bundler.bundle()
      .on('error', err => console.error(err.message))
      .pipe(writeStream)
  }
  bundler.on('update', updateJsx)
  updateJsx()
}

function symlink(opts) {
  console.log('-> symlink')
  try {
    rmrf(`/Library/Application Support/Adobe/CEP/extensions/${opts.manifest.bundleId}`)
  } catch (err) {}
  symlinkDir(`/Library/Application Support/Adobe/CEP/extensions/${opts.manifest.bundleId}`, opts.paths.dest)
}

const args = process.argv.slice(2)

if (args.length === 0) {
  args.push('watch')
}

const action = args.shift()

switch (action) {
  case 'watch':
    watch(config.bundler)
  break
  case 'build':
    build(config.bundler)
  break
}
