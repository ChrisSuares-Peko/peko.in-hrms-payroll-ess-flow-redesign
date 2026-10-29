import { MerchantCategory } from './types';

/** Static copy + options for the "Issue a card" drawer. Swap for live API data later. */

export const ISSUE_CARD_COPY = {
    title: 'Issue a card',
    subtitle:
        'Set a spend cap and frequency. Issuing a card is independent of wallet balance — cards share the wallet pool, and the first card to spend draws from it until empty.',
    banner: {
        prefix: 'A ',
        highlight: 'virtual card',
        suffix: " will be issued. The cardholder can request a physical card later from their card's management screen.",
    },
    nameHelper: 'Name printed on the card. Defaults to the member name if left blank.',
    cardLimitHelper:
        'Maximum this card can spend per month. Cards share the wallet — actual spend is first-come-first-served.',
    perTxnHelper:
        'Caps the size of any single transaction. Leave blank for no per-transaction cap.',
    merchantTitle: 'Merchant categories',
    merchantSubtitle: 'Selected categories will be restricted.',
    atmTitle: 'ATM withdrawals',
    atmFixedHeading: 'ATM withdrawal limits are fixed system-wide:',
};

/** Fixed system-wide ATM limits (rupees). */
export const ATM_PER_TXN = 2000;
export const ATM_PER_MONTH = 10000;

/**
 * Fallback category names only, used to seed useMerchantCategoriesApi's initial state (so the
 * checkboxes aren't empty for the one render before that hook's fetch resolves) and if the live
 * GET /cards/categories call fails. The canonical list (name + real MCC codes) now comes from the
 * backend — see hooks/admin/useMerchantCategoriesApi.ts. Do not add new categories here; add them
 * server-side (corporateCard/constants/merchantCategories.js) and they'll show up automatically.
 */
export const MERCHANT_CATEGORIES = [
    'Software & SaaS',
    'Financial Services & Fintech',
    'Lodging & Hotels',
    'Food & Beverage',
    'Health & Wellness',
    'Travel & Tourism',
    'Creative Arts & Design',
    'Renewable Energy & Sustainability',
    'Education & E-Learning',
    'Sports & Recreation',
];

/** MERCHANT_CATEGORIES reshaped to look like a live API response, for the hook's initial/fallback state. */
export const MERCHANT_CATEGORIES_FALLBACK: MerchantCategory[] = MERCHANT_CATEGORIES.map(
    category => ({
        category,
        mccs: [],
    })
);

/**
 * A card's `restrictedCategories` may be a list of bare names (legacy rows, or the
 * MERCHANT_CATEGORIES_FALLBACK shape) or of resolved `{ category, mccs }` records (current shape) —
 * always read the display/checkbox name through this rather than assuming one shape.
 */
export const restrictedCategoryNames = (list?: (string | MerchantCategory)[]): string[] =>
    (list ?? []).map(entry => (typeof entry === 'string' ? entry : entry.category));

export const FREQUENCY_OPTIONS = [{ label: 'Monthly', value: 'monthly' }];

export const DEFAULT_FREQUENCY = FREQUENCY_OPTIONS[0].value;
