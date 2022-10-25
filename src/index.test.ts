import * as redactEnv from './index'

describe('redact', () => {
  it('passes through untouched with no env', () => {
    const env = {}
    const secrets = redactEnv.build([], env)
    const provided = 'foo'
    const expected = 'foo'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('passes through untouched when no secrets are present', () => {
    const env = {
      secret: 'stuff'
    }
    const secrets = redactEnv.build(['secret'], env)
    const provided = 'foo does not contain secrets'
    const expected = 'foo does not contain secrets'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('ignores unlisted variables', () => {
    const env = {
      secret: 'stuff',
      notSecret: 'public'
    }
    const secrets = redactEnv.build(['secret'], env)
    const provided = 'foo contains public stuff'
    const expected = 'foo contains public *'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('ignores missing variables', () => {
    const env = {
      foo: 'bar'
    }
    const secrets = redactEnv.build(['key'], env)
    const provided = 'key is missing, bar is not marked as secure'
    const expected = 'key is missing, bar is not marked as secure'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('does not redact booleans values as string', () => {
    const env = {
      a: 'true',
      b: 'false'
    }
    const secrets = redactEnv.build(['a', 'b'], env)
    const provided = '(false !== null) === true'
    const expected = '(false !== null) === true'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('does not redact null values as string', () => {
    const env = {
      a: 'null'
    }
    const secrets = redactEnv.build(['a'], env)
    const provided = '(false !== null) === true'
    const expected = '(false !== null) === true'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('does not redact undefined env values', () => {
    const env = {
      a: undefined
    }
    const secrets = redactEnv.build(['a'], env)
    const provided = 'hello, world'
    const expected = 'hello, world'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('redacts secrets recursively', () => {
    const env = {
      foo: 'bar',
      egg: 'spam'
    }
    const secrets = redactEnv.build(['foo', 'egg'], env)
    const provided = 'the barman ordered spam, bacon and spam at the bar'
    const expected = 'the *man ordered *, bacon and * at the *'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('redacts over multiple lines', () => {
    const env = {
      foo: 'bar',
      egg: 'spam'
    }
    const secrets = redactEnv.build(['foo', 'egg'], env)
    const provided = `the barman
    ordered spam,
    bacon and spam
    at the bar
    `
    const expected = `the *man
    ordered *,
    bacon and *
    at the *
    `
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('redacts escaped strings', () => {
    const env = {
      a: 'foo',
      b: 'bar',
      c: 'eg\\Wg',
      d: 'sp\nam',
      e: 'c:\\foo'
    }
    const secrets = redactEnv.build(['a', 'b', 'c', 'd', 'e'], env)
    const provided = 'foo\nbar"eg\\Wg"\tsp\nam;c:\\foo'
    const expected = '*\n*"*"\t*;*'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('redacts quoted strings', () => {
    const env = {
      a: '"foo"',
      b: '"bar"'
    }
    const secrets = redactEnv.build(['a', 'b'], env)
    const provided = 'foo-bar-"foo"-"bar"'
    const expected = 'foo-bar-*-*'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })
})

describe('JSON', () => {
  it('redacts entire JSON', () => {
    const foo = {
      key: 'secret',
      foo: null,
      bar: 42,
      egg: ['spam']
    }
    const env = {
      foo: JSON.stringify(foo)
    }
    const secrets = redactEnv.build(['foo'], env)
    const provided = JSON.stringify(foo)
    const expected = '*'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('redacts string fields in JSON safely', () => {
    const foo = {
      key: 'secret',
      foo: null,
      bar: 123456,
      egg: ['spam', 'secret'],
      nested: {
        foo: 'secret'
      },
      spam: false
    }
    const env = {
      a: 'secret'
    }
    const secrets = redactEnv.build(['a'], env)
    const provided = JSON.stringify(foo)
    const expected =
      '{"key":"*","foo":null,"bar":123456,"egg":["spam","*"],"nested":{"foo":"*"},"spam":false}'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('redacts JSON string keys if matching', () => {
    const foo = {
      secret: 'public'
    }
    const env = {
      a: 'secret'
    }
    const secrets = redactEnv.build(['a'], env)
    const provided = JSON.stringify(foo)
    const expected = '{"*":"public"}'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('will not redact backslashed paths in JSON', () => {
    // Because they are escaped again by JSON.stringify
    const env = {
      a: 'c:\\foo' // windows-like path
    }
    const secrets = redactEnv.build(['a'], env)
    const provided = JSON.stringify(env)
    const expected = '{"a":"c:\\\\foo"}'
    expect(provided).toEqual(expected)
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })
})

describe('RegExp', () => {
  it('redacts regexp special characters', () => {
    const env = {
      a: '(?<=.) {2,}(?=[A-Z])'
    }
    const secrets = redactEnv.build(['a'], env)
    const provided = 'foo bar (?<=.) {2,}(?=[A-Z]) spam'
    const expected = 'foo bar * spam'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })
})

describe('Real-life usage', () => {
  it('redacts base64 secrets', () => {
    const env = {
      a: 'p4A5WEvyGSwAPtKt8Nk9aLnBxPg12yjkFMhWiyz9tlc=',
      b: 'xV1luhZ0Gg0Egnspt6yfoANvIV9fS+yQpiswk8vSFuU=',
      c: 'nQZBwkEJsBIa4MBsKFWBVxo57PNBjNarwC4I1/eLmZc=',
      d: 'hAnrr6nQ/p8XpC09SBeOe2zVOF2nZpMbZY8H+Kaj7cg='
    }
    const secrets = redactEnv.build(['a', 'b', 'c', 'd'], env)
    const provided = JSON.stringify(env)
    const expected = '{"a":"*","b":"*","c":"*","d":"*"}'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('redacts hex secrets', () => {
    const env = {
      a: '096a4351d7a2f374879f12e4302105b3308079c51aaef11b28f903768ce1cba5',
      b: 'a5f8013bf70683ebda27962ccb06d103d317965b5c43dfb56b25df102ae94173',
      c: '8aeea251d7c8767216dcb6c755c4900d0c82827c36c1e42dc203692cd76d47a9',
      d: 'e29c60fa3804d9c47556d921d2f1734cc5822df032c0b5f19008ea3347128f1e'
    }
    const secrets = redactEnv.build(['a', 'b', 'c', 'd'], env)
    const provided = JSON.stringify(env)
    const expected = '{"a":"*","b":"*","c":"*","d":"*"}'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('redacts UUIDs', () => {
    // testing for dash-separated hex
    const env = {
      a: '03e6a20d-e1a4-440b-8581-54b4f39b427e'
    }
    const secrets = redactEnv.build(['a'], env)
    const provided = JSON.stringify(env)
    const expected = '{"a":"*"}'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('redacts JWTs', () => {
    // testing for dot-separated base64
    const env = {
      a: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRGFAYSIsImlhdCI6MTUxNjIzOTAyMn0.0umQbI-3Le8b5mtQKAongS9vUsp6biOtyEGeXhHjZu8',
      b: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphaG4gRGFAYSIsImlhdCI6MTUxNjIzOTAyMn0.8RIUw178Ye1qtSIXezU_ruB43mSYBrIdNsT2NWCMZXU'
    }
    const secrets = redactEnv.build(['a', 'b'], env)
    const provided = JSON.stringify(env)
    const expected = '{"a":"*","b":"*"}'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('redacts string representation of numbers', () => {
    const env = {
      a: '1234567890',
      b: '0987654321'
    }
    const secrets = redactEnv.build(['a', 'b'], env)
    const provided = JSON.stringify(env)
    const expected = '{"a":"*","b":"*"}'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })

  it('redacts URIs', () => {
    const env = {
      a: 'https://github.com/47ng/redact-env?query=string&foo=bar#hash',
      b: 'twitter://@fortysevenfx',
      c: 'postgres://username:password@host:port/database'
    }
    const secrets = redactEnv.build(['a', 'b', 'c'], env)
    const provided = JSON.stringify(env)
    const expected = '{"a":"*","b":"*","c":"*"}'
    const received = redactEnv.redact(provided, secrets, '*')
    expect(received).toEqual(expected)
  })
})

describe('Defaults', () => {
  it('redacts with [secure] by default', () => {
    const env = {
      password: 'supersecret'
    }
    const secrets = redactEnv.build(['password'], env)
    const provided = 'my password is supersecret'
    const expected = 'my password is [secure]'
    const received = redactEnv.redact(provided, secrets)
    expect(received).toEqual(expected)
  })
  it('uses Node.js process.env by default', () => {
    process.env.FOO = 'foo'
    const secrets = redactEnv.build(['FOO'])
    const provided = 'my password is foo'
    const expected = 'my password is [secure]'
    const received = redactEnv.redact(provided, secrets)
    expect(received).toEqual(expected)
  })
})
