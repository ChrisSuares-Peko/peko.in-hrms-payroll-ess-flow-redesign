/**
 * Banned-keyword matching for the Products › Rules tab. One implementation is
 * shared by on_search ingest, the admin "Preview matches" and the delete of
 * already-stored products, so all three agree on what a word hits.
 *
 * Whole words only: text and keyword are both lower-cased, every run of
 * non-alphanumerics becomes one space and the result is padded with spaces,
 * so " acid " is not found in " acidity " and "watch strap" matches
 * "Watch-Strap" as a phrase.
 */

const normalizeText = (value) => {
    const flat = String(value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    return flat ? ` ${flat} ` : "";
};

/** Canonical stored form of a keyword ("Watch-Strap " → "watch strap"). */
const normalizeKeyword = (value) => normalizeText(value).trim();

/**
 * First banned word found in any of `texts`, or null.
 * @param {Array<string|null|undefined>} texts  e.g. [name, shortDesc, longDesc]
 * @param {string[]} keywords  already normalised (see normalizeKeyword)
 */
const matchBannedKeyword = (texts, keywords) => {
    if (!keywords?.length) return null;
    const haystack = (texts || []).map(normalizeText).filter(Boolean).join(" ");
    if (!haystack) return null;
    for (const word of keywords) {
        if (word && haystack.includes(` ${word} `)) return word;
    }
    return null;
};

module.exports = { normalizeText, normalizeKeyword, matchBannedKeyword };
