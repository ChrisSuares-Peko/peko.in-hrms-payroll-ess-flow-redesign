/**
 * Input rules for the admin Categories tab (Manage > Products > Categories).
 *
 * Category names are shown on the corporate storefront, stamped onto products
 * and exported to spreadsheets, so they are whitelisted rather than escaped:
 * letters, digits, spaces and a few punctuation marks ("Printers & Toner",
 * "Pens, Pencils (Ball/Gel)"). The first character must be a letter or digit,
 * which also keeps out spreadsheet formula prefixes (= + - @). `<` and `>` are
 * not allowed at all, so markup can never be stored.
 *
 * The frontend form (CategoryFormModal) applies the same rules; keep them in sync.
 */

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 80
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} &'(),./+-]*$/u

const DOMAIN_MAX_LENGTH = 30
// One or more ONDC domain codes, comma-separated: "RET16" or "RET16 , RET10".
const DOMAIN_PATTERN = /^[A-Za-z0-9]+(\s*,\s*[A-Za-z0-9]+)*$/

const DISPLAY_ORDER_MAX = 99999

/** Trim and collapse runs of whitespace, so "Office  Supplies " and "Office Supplies" are one name. */
const normalizeCategoryName = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

/**
 * @returns {{ value: string } | { error: string }}
 */
const validateCategoryName = (value) => {
    if (value != null && typeof value !== 'string') return { error: '`name` must be text' }
    const name = normalizeCategoryName(value)
    if (!name) return { error: '`name` is required' }
    if (name.length < NAME_MIN_LENGTH) {
        return { error: `Name must be at least ${NAME_MIN_LENGTH} characters` }
    }
    if (name.length > NAME_MAX_LENGTH) {
        return { error: `Name must be at most ${NAME_MAX_LENGTH} characters` }
    }
    if (!NAME_PATTERN.test(name)) {
        return {
            error: "Name must start with a letter or number and may only contain letters, numbers, spaces and & ' ( ) , . / + -",
        }
    }
    return { value: name }
}

/**
 * @returns {{ value: string } | { error: string }}
 */
const validateOndcDomain = (value) => {
    if (value != null && typeof value !== 'string') return { error: '`ondcDomain` must be text' }
    const domain = String(value ?? '').trim()
    if (!domain) return { error: '`ondcDomain` is required for subcategories' }
    if (domain.length > DOMAIN_MAX_LENGTH) {
        return { error: `ONDC domain must be at most ${DOMAIN_MAX_LENGTH} characters` }
    }
    if (!DOMAIN_PATTERN.test(domain)) {
        return { error: 'ONDC domain must be one or more codes like RET16, separated by commas' }
    }
    return { value: domain }
}

/**
 * Missing/empty means 0, matching the column default.
 * @returns {{ value: number } | { error: string }}
 */
const validateDisplayOrder = (value) => {
    if (value == null || value === '') return { value: 0 }
    const text = String(value).trim()
    if (!/^\d+$/.test(text) || Number(text) > DISPLAY_ORDER_MAX) {
        return { error: `Display order must be a whole number between 0 and ${DISPLAY_ORDER_MAX}` }
    }
    return { value: Number(text) }
}

module.exports = {
    NAME_MIN_LENGTH,
    NAME_MAX_LENGTH,
    DOMAIN_MAX_LENGTH,
    DISPLAY_ORDER_MAX,
    normalizeCategoryName,
    validateCategoryName,
    validateOndcDomain,
    validateDisplayOrder,
}
