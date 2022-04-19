# karma-jasmine

[![npm version](https://img.shields.io/npm/v/karma-jasmine?style=flat-square)](https://www.npmjs.com/package/karma-jasmine)
[![npm downloads](https://img.shields.io/npm/dm/karma-jasmine?style=flat-square)](https://www.npmjs.com/package/karma-jasmine)
[![Release Workflow Status](https://img.shields.io/github/workflow/status/karma-runner/karma-jasmine/Release/master?style=flat-square&logo=github&label=Release)](https://github.com/karma-runner/karma-jasmine/actions/workflows/release.yml?query=branch%3Amaster)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen?style=flat-square)](https://github.com/karma-runner/karma-jasmine)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079?style=flat-square)](https://github.com/semantic-release/semantic-release)

> Adapter for the [Jasmine](https://jasmine.github.io/) testing framework.

## Installation

```bash
npm install karma-jasmine --save-dev
```

## Configuration

```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      '*.js'
    ]
  })
}
```

If you want to run only some tests whose name match a given pattern you can do this in the following way

```bash
$ karma start &
$ karma run -- --grep=<pattern>
```

where pattern is either a string (e.g `--grep=#slow` runs tests containing "#slow") or a Regex (e.g `--grep=/^(?!.*#slow).*$/` runs tests _not_ containing "#slow").

You can also pass it to `karma.config.js`:

```js
module.exports = function(config) {
  config.set({
    // ...
    client: {
      args: ['--grep', '<pattern>'],
      // ...
    }
  })
}
```

If you want to pass configuration options directly to jasmine you can do this in the following way

```js
module.exports = function(config) {
  config.set({
    client: {
      jasmine: {
        random: true,
        seed: '4321',
        oneFailurePerSpec: true,
        failFast: true,
        timeoutInterval: 1000
      }
    }
  })
}
```

## Debug by URL

Failing tests print a debug URL with `?spec=`. Use it with `--no_single_run`
and paste it into your browser to focus on a single failing test.

## Sharding

By setting `config.client.shardIndex` and `config.client.totalShards`, you can
run a subset of the full set of specs. Complete sharding support needs to be
done in the process that calls karma, and would need to support test result
integration across shards.

---

For more information on Karma see the [homepage](https://karma-runner.github.io/).
