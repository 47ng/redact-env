export type Secrets = Map<string, RegExp>

export const build = (
  secureEnv: string[],
  env: NodeJS.ProcessEnv = process.env
): Secrets => {
  const map: Secrets = new Map()
  Object.keys(env)
    .filter(env => secureEnv.includes(env))
    .forEach(envName => {
      const value = env[envName]
      if (
        value &&
        !['true', 'false', 'null'].includes(value) // Ignore JSON values
      ) {
        const escapedValue = value
          .replace(/\$/g, '\\$')
          .replace(/\./g, '\\.')
          .replace(/\*/g, '\\*')
          .replace(/\?/g, '\\?')
          .replace(/\+/g, '\\+')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)')
          .replace(/\{/g, '\\{')
          .replace(/\}/g, '\\}')
          .replace(/\[/g, '\\[')
          .replace(/\]/g, '\\]')
          .replace(/\^/g, '\\^')
        map.set(envName, new RegExp(escapedValue, 'g'))
      }
    })
  return map
}

// --

export const redact = (
  input: string,
  secrets: Secrets,
  replace: string = '[secure]'
) => {
  let out = input
  for (const regex of secrets.values()) {
    out = out.replace(regex, replace)
  }
  return out
}

// --

export default {
  build,
  redact
}
