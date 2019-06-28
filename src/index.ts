import escapeStringRegexp from 'escape-string-regexp'

/**
 * Build a RegExp matching the values of secure environment variables.
 *
 * @param secureEnv A list of environment variable names to redact
 * @param env Where to read the values from (defaults to process.env)
 */
export const build = (
  secureEnv: string[],
  env: NodeJS.ProcessEnv = process.env
): RegExp => {
  const unified = Object.keys(env)
    .filter(env => secureEnv.includes(env))
    .map(envName => {
      const value = env[envName]
      // Ignore JSON values that are too generic (might erase other fields)
      if (!value || ['true', 'false', 'null'].includes(value)) {
        return null
      }
      const escapedValue = escapeStringRegexp(value)
      return `(${escapedValue})`
    })
    .filter(x => !!x)
    .join('|')
  if (unified === '') {
    // Use negated negative lookahead to never match anything
    // https://stackoverflow.com/questions/1723182/a-regex-that-will-never-be-matched-by-anything
    return new RegExp(/(?!)/, 'g')
  }

  return new RegExp(unified, 'g')
}

// --

/**
 * Redact a string based on a built RegExp (from redactEnv.build).
 *
 * @param input The input string to redact
 * @param regexp A RegExp built by redactEnv.build
 * @param replace What to replace redacted text with (defaults to '\[secure\]')
 */
export const redact = (
  input: string,
  regexp: RegExp,
  replace: string = '[secure]'
) => {
  return input.replace(regexp, replace)
}

// --

export default {
  build,
  redact
}
