'use strict';

// Placeholder rules for admin-managed email templates.
//
// Deliberately minimal: a placeholder is `${variable_name}` and nothing else —
// this is the one syntax used end to end: the editor's mock preview
// (templateSyntax.ts), this save-time validator, and the send-path resolver
// all agree on `${key}`. There is no expression evaluation, no function calls,
// no property paths and no templating engine — so there is no code path that
// can execute template content. Anything that does not match VALID_VARIABLE_KEY
// is rejected at save time.
//
// Templates do not declare their variables, so there is nothing to check a
// placeholder name against: whether a value exists is decided by the caller at
// send time, and a placeholder with no value is caught there. What remains here
// is the syntax rule, which stops `${ doSomething() }` or `${x.y}` being saved
// as though some renderer would understand it.

// Captures whatever sits between a `${` and the next `}`, so malformed tokens
// are caught rather than silently ignored.
const PLACEHOLDER_PATTERN = /\$\{([^{}]*)\}/g;

const VALID_VARIABLE_KEY = /^[a-zA-Z0-9_]{1,64}$/;

/**
 * Every `${...}` token in `content`, in order of appearance.
 * @returns {{ raw: string, token: string, isValid: boolean }[]}
 */
const extractPlaceholders = (content) => {
    if (!content || typeof content !== 'string') return [];
    const found = [];
    let match;
    PLACEHOLDER_PATTERN.lastIndex = 0;
    while ((match = PLACEHOLDER_PATTERN.exec(content)) !== null) {
        const token = String(match[1]).trim();
        found.push({
            raw: match[0],
            token,
            isValid: VALID_VARIABLE_KEY.test(token),
        });
    }
    return found;
};

/**
 * Checks that no placeholder in the subject or HTML body uses unsupported syntax.
 *
 * @param {object} input
 * @param {string} [input.subject]
 * @param {string} [input.htmlBody]
 * @returns {string[]} error messages (empty when valid)
 */
const validateTemplateContent = ({ subject, htmlBody } = {}) => {
    const errors = [];

    const scan = (content, label) => {
        extractPlaceholders(content).forEach(({ raw, isValid }) => {
            if (!isValid) {
                errors.push(
                    `Invalid placeholder "${raw}" in ${label} — only simple placeholders such as \${user_name} are supported (letters, numbers and underscores)`
                );
            }
        });
    };

    scan(subject, 'subject');
    scan(htmlBody, 'HTML body');

    // Same message repeated for several occurrences of one bad token adds noise.
    return [...new Set(errors)];
};

module.exports = {
    PLACEHOLDER_PATTERN,
    VALID_VARIABLE_KEY,
    extractPlaceholders,
    validateTemplateContent,
};
