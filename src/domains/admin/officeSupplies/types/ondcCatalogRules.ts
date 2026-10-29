/** Manage > Products > Rules (purchase `/ondc/rules/*`). */

export type RuleSectionKey = 'domains' | 'sellers' | 'keywords' | 'priceSanity' | 'topDeals';

export interface RuleLastChange {
    actorName: string | null;
    createdAt: string;
}

export interface HiddenByCount {
    key: string;
    label: string;
    count: number;
}

export interface CatalogRulesSummary {
    synced: number;
    visible: number;
    hidden: number;
    hiddenBy: HiddenByCount[];
    lastAppliedAt: string | null;
    unmapped: { products: number; sellerCategories: number; excludedProducts: number };
}

export interface OndcDomainRule {
    id: number;
    code: string;
    name: string;
    enabled: boolean;
    /** null = seeded from a category but never answered ("nothing received yet") */
    lastSeenAt: string | null;
    storedCount: number;
    /** stored products this domain being off hides (first failing rule) */
    hiddenCount: number;
}

export interface BlockedSeller {
    id: number;
    bppId: string;
    providerId: string;
    sellerName: string | null;
    reason: string | null;
    blockedByName: string | null;
    createdAt: string;
    /** products this block hides (first failing rule) */
    hiding: number;
    /** products of this seller an earlier rule (domain) already hides */
    hiddenByEarlierRule: number;
    /** all stored products of this seller */
    total: number;
}

export interface SellerOption {
    bppId: string;
    providerId: string;
    sellerName: string | null;
    productCount: number;
}

export interface BannedKeyword {
    id: number;
    word: string;
    /** products this word kept out, last 24 h */
    hits: number;
    addedByName: string | null;
    createdAt: string;
}

export interface TopDealsRules {
    minPrice: number | null;
    maxDiscountPct: number | null;
    belowMinPrice: number;
    overDiscountCap: number;
    lastChange: { topDeals: RuleLastChange | null; priceSanity: RuleLastChange | null };
}

export interface RuleHistoryEntry {
    id: number;
    section: RuleSectionKey;
    action: string;
    detail: Record<string, any> | null;
    actorName: string | null;
    createdAt: string;
}

/** Stored products a new rule would match (shown before asking to delete them). */
export interface MatchPreview {
    total: number;
    sample: string[];
}

export interface KeywordPreview {
    words: { word: string; count: number; sample: string[] }[];
    alreadyBanned: string[];
    total: number;
}

export interface WithLastChange<T> {
    data: T[];
    lastChange: RuleLastChange | null;
}
