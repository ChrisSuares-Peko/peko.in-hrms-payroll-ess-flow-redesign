// Placeholder syntax for the Email Template editor's mock preview — kept
// aligned with the documented backend contract: only simple `${key}`
// placeholders are supported, matching `${[A-Za-z0-9_]{1,64}}` exactly. There
// is no templating engine, no expression evaluation, and no nested-path or
// loop syntax — `${user.name}`, `${user["name"]}`, `${executeSomething()}`
// and `${foo + bar}` are all deliberately NOT matched by this regex (its
// character class only allows letters/digits/underscore).
export const VARIABLE_TOKEN_REGEX = /\$\{([A-Za-z0-9_]{1,64})\}/g;
