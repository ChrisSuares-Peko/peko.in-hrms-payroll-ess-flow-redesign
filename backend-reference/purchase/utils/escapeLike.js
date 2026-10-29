/**
 * Escape SQL LIKE wildcards in user search text so `%`, `_` and `\` match
 * themselves instead of "anything" / "any one character". Backslash is MySQL's
 * default LIKE escape character, so no ESCAPE clause is needed.
 */
const escapeLike = (value) => String(value ?? "").replace(/[\\%_]/g, "\\$&");

/** `%text%` pattern for a "contains" search on literal text. */
const containsLike = (value) => `%${escapeLike(value)}%`;

module.exports = { escapeLike, containsLike };
