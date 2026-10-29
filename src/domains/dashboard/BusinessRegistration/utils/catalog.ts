import { BUSINESS_STRUCTURES, BusinessStructure } from './data';
import { EntityType } from '../types';

// IndiaFilings catalog service_id per entity type. Only entities with a
// confirmed service_id fetch live pricing; the rest fall back to the
// hardcoded price in BUSINESS_STRUCTURES. Add ids here as the vendor confirms.
// (OPC is absent from the vendor catalog — raised with the vendor.)
export const CATALOG_SERVICE_IDS: Partial<Record<EntityType, string>> = {
    [EntityType.PRIVATE_LIMITED]: '1',
    [EntityType.LLP]: '3',
    [EntityType.PARTNERSHIP]: '10',
    // Proprietorship = the "Proprietorship" catalog (service 6). Service 79 is the
    // generic GST Registration smart-form service, not the sellable product.
    [EntityType.PROPRIETORSHIP]: '6',
};

// Fallback matching by service name for rows whose service_id isn't usable yet.
const CATALOG_NAME_PATTERNS: Partial<Record<EntityType, RegExp>> = {
    [EntityType.PRIVATE_LIMITED]: /private\s+limited/i,
    [EntityType.PARTNERSHIP]: /partnership/i,
    [EntityType.LLP]: /\bllp\b|limited\s+liability/i,
    [EntityType.OPC]: /one\s+person|\bopc\b/i,
    // Match the "Proprietorship" catalog row.
    [EntityType.PROPRIETORSHIP]: /proprietor/i,
};

export interface CatalogPricing {
    catalogId: number;
    serviceName: string;
    price: number;
    governmentFee: number;
    unit: string;
    currency: string;
}

// Field names differ between the Postman sample (id/price/service_name) and the
// vendor doc v1.1 example (catalog_id/amount/catalog_name) — accept both.
interface CatalogItem {
    id?: number;
    catalog_id?: number;
    service_name?: string;
    catalog_name?: string;
    price?: number | string;
    amount?: number | string;
    government_fee_amount?: number | string;
    unit?: string;
    priceType?: string;
    currency?: string;
}

const num = (v: unknown) => Number(v) || 0;

// Normalize the vendor catalog response into pricing we render. The BE wraps the
// vendor payload, so getCatalog() resolves to { status, total, data: [ item ] }.
export const parseCatalog = (res: unknown): CatalogPricing | null => {
    const list = (res as { data?: unknown } | null)?.data;
    const item = (Array.isArray(list) ? list[0] : undefined) as CatalogItem | undefined;
    if (!item || (item.price == null && item.amount == null)) return null;
    return {
        catalogId: num(item.id ?? item.catalog_id),
        serviceName: String(item.service_name ?? item.catalog_name ?? ''),
        price: num(item.price ?? item.amount),
        governmentFee: num(item.government_fee_amount),
        unit: String(item.unit ?? item.priceType ?? ''),
        currency: String(item.currency ?? 'INR'),
    };
};

export interface CatalogListItem {
    // Vendor catalog row id — what the lead API takes as catalog_id.
    id?: number;
    service_id?: number | string | null;
    service_name?: string;
    variant_name?: string;
    price?: number | string;
    amount?: number | string;
    sortOrder?: number;
    // Admin visibility flag — false/0 hides the structure card.
    status?: boolean | number;
}

// Keep only the five BR structures — drops TAN, Trademark, standalone GST.
const BR_SERVICE_PATTERNS = Object.values(CATALOG_NAME_PATTERNS).filter(
    (re): re is RegExp => re instanceof RegExp
);
const isBusinessRegistrationService = (item: CatalogListItem) =>
    BR_SERVICE_PATTERNS.some(re => re.test(String(item.service_name ?? '')));

// Active BR catalog rows as callback-picker options (label = service — variant).
export const catalogSelectOptions = (list: CatalogListItem[]) =>
    list
        .filter(item => item.status !== false && item.status !== 0 && item.id != null)
        .filter(isBusinessRegistrationService)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map(item => ({
            label: [item.service_name, item.variant_name].filter(Boolean).join(' — '),
            value: String(item.id),
        }));

// Extract the catalog array from the (vendor-shaped) response.
export const parseCatalogList = (res: unknown): CatalogListItem[] => {
    const list = (res as { data?: unknown } | null)?.data;
    return Array.isArray(list) ? (list as CatalogListItem[]) : [];
};

const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// STRICT catalog mode: once a synced catalog exists, corporates see ONLY the
// services that have a saved row AND are active. Rows match our structures by
// service_id first, then service-name pattern; price = admin amount, else market
// price; cards order by sortOrder. Entities without a row (e.g. OPC — absent
// from the vendor catalog) stay hidden until the vendor adds them.
export const buildStructures = (list: CatalogListItem[]): BusinessStructure[] => {
    const isActive = (item?: CatalogListItem) =>
        Boolean(item) && item?.status !== false && item?.status !== 0;
    // A service can have duplicate rows (vendor mid-migration) — prefer an active one.
    const pickActive = (rows: CatalogListItem[]) => rows.find(isActive) ?? rows[0];
    const byServiceId = (id?: string) =>
        id ? pickActive(list.filter(item => String(item.service_id) === id)) : undefined;
    const byName = (type: EntityType) => {
        const pattern = CATALOG_NAME_PATTERNS[type];
        return pattern
            ? pickActive(list.filter(item => pattern.test(String(item.service_name ?? ''))))
            : undefined;
    };
    return BUSINESS_STRUCTURES.map((structure, index) => {
        const byId = byServiceId(CATALOG_SERVICE_IDS[structure.type]);
        const byNm = byName(structure.type);
        // Prefer an active match from either lookup so an inactive duplicate can't
        // hide a live one; fall back to any match.
        let item: CatalogListItem | undefined;
        if (isActive(byId)) item = byId;
        else if (isActive(byNm)) item = byNm;
        else item = byId ?? byNm;
        const active = isActive(item);
        return {
            structure: item
                ? { ...structure, price: formatINR(Number(item.price ?? item.amount)) }
                : structure,
            hidden: !active,
            order: item?.sortOrder ?? 1000 + index,
        };
    })
        .filter(entry => !entry.hidden)
        .sort((a, b) => a.order - b.order)
        .map(entry => entry.structure);
};
