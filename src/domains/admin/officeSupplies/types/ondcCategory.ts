import { UserPayload } from '../../accounts/types/SelfTransferTypes';

/** One category or subcategory row (2-level tree: parentId null = top-level). */
export type OndcCategoryRow = {
    id: number;
    name: string;
    ondcDomain: string | null;
    /** subcategory seller categoryId / descriptor tags */
    keywords: string[] | null;
    parentId: number | null;
    displayOrder: number;
    enabled: boolean;
    /** stored snapshot, recomputed server-side after catalog ingestion — not a live count */
    productCount: number;
    /** ISO timestamp of the last count recompute; null before the first one runs */
    productCountUpdatedAt: string | null;
    /** Parent categories only — CDN URL for the corporate category bar icon. */
    iconUrl: string | null;
};

export type OndcCategoryTreeRow = OndcCategoryRow & {
    subcategories: OndcCategoryRow[];
};

/** Category: name + displayOrder + iconUrl. Subcategory: name + ondcDomain + displayOrder (keywords are legacy, no longer edited). */
export type OndcCategoryFormValues = {
    name: string;
    ondcDomain?: string;
    keywords?: string[];
    displayOrder: number | string;
    iconUrl?: string;
    iconFormat?: string | null;
};

export type CreateOndcCategoryPayload = UserPayload &
    OndcCategoryFormValues & { parentId?: number };

export type UpdateOndcCategoryPayload = UserPayload & OndcCategoryFormValues & { id: number };
