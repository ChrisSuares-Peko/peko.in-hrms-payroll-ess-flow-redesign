import * as Yup from 'yup';

// Mirrors purchase/utils/ondcCategoryInput.js — the server enforces the same rules.
export const CATEGORY_NAME_MAX_LENGTH = 80;
export const ONDC_DOMAIN_MAX_LENGTH = 30;

// Letters, digits, spaces and & ' ( ) , . / + -, starting with a letter or digit, which
// keeps out markup (< >) and spreadsheet formula prefixes (= + - @).
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} &'(),./+-]*$/u;
const DOMAIN_PATTERN = /^[A-Za-z0-9]+(\s*,\s*[A-Za-z0-9]+)*$/;

/** Trim + collapse whitespace, lower-cased — how the server compares sibling names. */
export const categoryNameKey = (value: string | null | undefined) =>
    String(value ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

const collapse = (value: unknown) =>
    typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value;

/**
 * @param siblingNames names already used under the same parent (the row being edited excluded)
 * @param isSubcategory subcategories need an ONDC domain
 */
export const ondcCategorySchema = (siblingNames: string[], isSubcategory: boolean) => {
    const taken = new Set(siblingNames.map(categoryNameKey));
    return Yup.object().shape({
        name: Yup.string()
            .transform(collapse)
            .required('Please enter a name')
            .min(2, 'Name must be at least 2 characters')
            .max(CATEGORY_NAME_MAX_LENGTH, `Name must be at most ${CATEGORY_NAME_MAX_LENGTH} characters`)
            .matches(NAME_PATTERN, {
                message:
                    "Start with a letter or number; only letters, numbers, spaces and & ' ( ) , . / + - are allowed",
                excludeEmptyString: true,
            })
            .test(
                'unique-sibling',
                isSubcategory
                    ? 'A subcategory with this name already exists in this category'
                    : 'A category with this name already exists',
                value => !value || !taken.has(categoryNameKey(value))
            ),
        ondcDomain: isSubcategory
            ? Yup.string()
                  .trim()
                  .required('Please enter the ONDC domain')
                  .max(ONDC_DOMAIN_MAX_LENGTH, `ONDC domain must be at most ${ONDC_DOMAIN_MAX_LENGTH} characters`)
                  .matches(DOMAIN_PATTERN, {
                      message: 'Use ONDC domain codes like RET16, separated by commas',
                      excludeEmptyString: true,
                  })
            : Yup.string().nullable(),
        // Top-level categories need an icon (the storefront category bar shows it):
        // a freshly uploaded base64 image, or the existing CDN URL on edit.
        iconUrl: isSubcategory
            ? Yup.mixed().nullable()
            : Yup.mixed().test(
                  'icon-required',
                  'Please upload a category icon',
                  value => typeof value === 'string' && value.trim().length > 0
              ),
    });
};
