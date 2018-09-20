# cep-bundler

[![Build Status](https://aedtci.mtmograph.com/api/badges/adobe-extension-tools/cep-bundler/status.svg)](https://aedtci.mtmograph.com/adobe-extension-tools/cep-bundler)
[![npm version](https://badge.fury.io/js/cep-bundler.svg)](https://www.npmjs.com/cep-bundler)

This bundler allows you to write modern TypeScript code and bundle it into a CEP extension.
It uses LiveReactload to get near instant updates whenever you make changes to a file.
It takes a configuration file as input (it looks for it in the folder where you are running the command from).

The easiest way to use this package is to use the `cep-starter` package, which already depends on the `cep-bundler` and has a default configuration.

However, you can also use this package standalone, for that, follow the instructions below:

## requirements

- macOS
- node.js

## install

```shell
npm install --save cep-bundler
```

## configure

- Copy the `cep-config.js` file from the `cep-starter` package into you project folder.
- Modify desired options

Run the bundler:
```shell
./node_modules/.bin/cep-bundler
```

Or, add to your `package.json`'s scripts section:

```json
"scripts": {
  "start": "cep-bundler",
  "build": "cep-bundler build"
}
```

## develop

```shell
git clone https://github.com/adobe-extension-tools/cep-bundler.git
cd cep-bundler
npm install
npm start
```