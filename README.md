# 🔒👀 `redact-env`

[![MIT License](https://img.shields.io/github/license/47ng/redact-env.svg?color=blue)](https://github.com/47ng/redact-env/blob/master/LICENSE)
[![Travis CI Build](https://img.shields.io/travis/com/47ng/redact-env.svg)](https://travis-ci.com/47ng/redact-env)
[![Average issue resolution time](https://isitmaintained.com/badge/resolution/47ng/redact-env.svg)](https://isitmaintained.com/project/47ng/redact-env)
[![Number of open issues](https://isitmaintained.com/badge/open/47ng/redact-env.svg)](https://isitmaintained.com/project/47ng/redact-env)

Redact values of critical environment variables in a string.

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

## Configuration

## License

[MIT](https://github.com/47ng/redact-env/blob/master/LICENSE) - Made with ❤️ by [François Best](https://francoisbest.com).
