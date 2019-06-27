import redactEnv from './index'

describe('build', () => {
  test('empty env equals empty map', () => {
    const env = {}
    const received = redactEnv.build([], env)
    expect(received.size).toBe(0)
  })

  test('it only picks secure env variable names', () => {
    const env = {
      foo: 'bar',
      egg: 'spam'
    }
    const received = redactEnv.build(['foo'], env)
    expect(received.size).toBe(1)
    expect(received.get('foo')).toEqual(/bar/g)
    expect(received.has('egg')).toBe(false)
  })

  test('it handles regex special characters in the env value', () => {
    const env = {
      foo: '$.*?+(){}[]^',
      bar: '[a-z]',
      egg: '(?#foo#bar)'
    }
    const received = redactEnv.build(['foo', 'bar', 'egg'], env)
    expect(received.get('foo')).toEqual(/\$\.\*\?\+\(\)\{\}\[\]\^/g)
    expect(received.get('bar')).toEqual(/\[a-z\]/g)
    expect(received.get('egg')).toEqual(/\(\?#foo#bar\)/g)
  })

  test('it ignores undefined env values', () => {
    const env = {
      foo: undefined
    }
    const received = redactEnv.build(['foo'], env)
    expect(received.size).toBe(0)
  })

  test('it ignores text-encoded booleans', () => {
    // Those are ignored to avoid breaking JSON
    const env = {
      foo: 'true',
      bar: 'false'
    }
    const received = redactEnv.build(['foo', 'bar'], env)
    expect(received.size).toBe(0)
  })

  test('it ignores text-encoded nulls', () => {
    // Those are ignored to avoid breaking JSON
    const env = {
      foo: 'null'
    }
    const received = redactEnv.build(['foo'], env)
    expect(received.size).toBe(0)
  })
})

describe('redact', () => {
  test('it passes through untouched with no env', () => {
    const env = {}
    const secrets = redactEnv.build([], env)
    const expected = 'foo'
    const received = redactEnv.redact(expected, secrets, '*')
    expect(received).toEqual(expected)
  })

  test('it passes through untouched when no secrets are present', () => {
    const env = {
      secret: 'stuff'
    }
    const secrets = redactEnv.build(['secret'], env)
    const expected = 'foo does not contain secrets'
    const received = redactEnv.redact(expected, secrets, '*')
    expect(received).toEqual(expected)
  })

  test('it redacts secrets recursively', () => {
    const env = {
      foo: 'bar',
      egg: 'spam'
    }
    const secrets = redactEnv.build(['foo', 'egg'], env)
    const unsafe = 'the barman ordered spam, bacon and spam at the bar'
    const received = redactEnv.redact(unsafe, secrets, '*')
    const expected = 'the *man ordered *, bacon and * at the *'
    expect(received).toEqual(expected)
  })

  test('it redacts entire JSON', () => {
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
    const unsafe = env.foo
    const received = redactEnv.redact(unsafe, secrets, '*')
    const expected = '*'
    expect(received).toEqual(expected)
  })

  test('it redacts fields in JSON safely', () => {
    const foo = {
      key: 'secret',
      foo: null,
      bar: 123456, // Parsed numbers will not be redacted
      egg: ['spam', 'nope'],
      spam: false
    }
    const env = {
      a: 'secret',
      b: 'nope',
      d: 'null',
      e: 'false'
    }
    const secrets = redactEnv.build(['a', 'b', 'c', 'd', 'e'], env)
    const unsafe = JSON.stringify(foo)
    const received = redactEnv.redact(unsafe, secrets, '*')
    const expected =
      '{"key":"*","foo":null,"bar":123456,"egg":["spam","*"],"spam":false}'
    expect(received).toEqual(expected)
  })
})
