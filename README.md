<h1 align="center">🔒👀 <code>redact-env</code></h1>

<div align="center">

[![NPM](https://img.shields.io/npm/v/redact-env?color=red)](https://www.npmjs.com/package/redact-env)
[![MIT License](https://img.shields.io/github/license/47ng/redact-env.svg?color=blue)](https://github.com/47ng/redact-env/blob/next/LICENSE)
[![CI/CD](https://github.com/47ng/redact-env/workflows/CI%2FCD/badge.svg?branch=next)](https://github.com/47ng/redact-env/actions)
[![Coverage Status](https://coveralls.io/repos/github/47ng/redact-env/badge.svg?branch=next)](https://coveralls.io/github/47ng/redact-env?branch=next)

</div>

<p align="center">
  Redact values of critical environment variables in a string.
</p>

## ⚠️ Disclaimer

This library might not do exactly what you want it to.

As for anything related to security, read the [caveats](#caveats), check
out the [source code](./src/index.ts) and the [tests](./src/index.test.ts)
before using it in production.

## Installation

```shell
$ yarn add redact-env
# or
$ npm i redact-env
```

## Usage

```ts
import redactEnv from 'redact-env'

const secrets = redactEnv.build(['SECRET_ENV_VAR', 'MY_API_KEY'])

const unsafeString = `
  ${process.env.SECRET_ENV_VAR}
  Oh no, the secrets are leaking !
  ${process.env.MY_API_KEY}
`
console.log('unsafe:', unsafeString)

const safeString = redactEnv.redact(unsafeString, secrets)
console.log('safe:', safeString)
```

```
unsafe:
  QfKcO7cjGoxnLg/28/E7meEu2QaS/wNtFB7wlz+hDZA=
  Oh no, the secrets are leaking !
  d9fd627cfd3d6cb597e8faeb2ef0e4583af924aee047125479b2438ee2a18b67

safe:
  [secure]
  Oh no, the secrets are leaking !
  [secure]
```

## Caveats

### Un-redacted values

`redact-env` will **NOT** redact the following environment variable values:

- `"true"`
- `"false"`
- `"null"`

This is because these string-encoded JSON values are not specific to a
single environment variable, and redacting all the booleans and nulls in
a string seems overzealous. This is opinionated for a particular usage.

### Parsed numbers in JSON object

`redact-env` **WILL** redact numbers in environment variable values,
which will pose a problem if you parse them and dump them as numbers in a
JSON object:

```ts
import redactEnv from 'redact-env'

process.env.PIN = '1234'

const secrets = redactEnv.build(['PIN'], process.env)

const pin: number = parseInt(process.env.PIN)

const unsafe = JSON.stringify({ pin })
console.log(unsafe)
// {"pin":1234} => valid JSON

const safeButIncorrect = redactEnv.redact(unsafe, secrets)

console.log(safeButIncorrect)
// {"pin":[secure]}  => not valid JSON
```

### Windows paths in JSON objects

Because of backslash-delimited paths in Windows and string escaping
occurring in `JSON.stringify`, Windows paths in environment variables
won't be redacted if present in JSON strings.

In a future release, we might consider detecting the presence of
backslashes in the environment variable value and having two regexp for
this secret (one for the plain value and one backslashed-escaped).

## License

[MIT](https://github.com/47ng/redact-env/blob/master/LICENSE) - Made with ❤️ by [François Best](https://francoisbest.com)

Using this package at work ? [Sponsor me](https://github.com/sponsors/franky47) to help with support and maintenance.
