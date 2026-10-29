const MAX_SEARCH_LENGTH = 100;

// Escapes RegExp metacharacters so user input is matched literally.
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Caps user-supplied search text length and escapes it for use in $regex / new RegExp.
const escapeSearch = (str) => escapeRegex(String(str ?? '').slice(0, MAX_SEARCH_LENGTH));

module.exports = escapeRegex;
module.exports.escapeRegex = escapeRegex;
module.exports.escapeSearch = escapeSearch;
module.exports.MAX_SEARCH_LENGTH = MAX_SEARCH_LENGTH;
