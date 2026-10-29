/** ONDC item tag group — same shape as corporate catalog rows. */
export type OndcTag = {
    code: string;
    list: { code: string; value: string }[];
};

export type OndcTagProductSource = {
    tags?: OndcTag[] | null;
    measureValue?: string | null;
    uom?: string | null;
    returnable?: boolean | null;
    statutory?: {
        packagedCommodities?: Record<string, string> | null;
    } | null;
};

const COUNTRY_NAMES: Record<string, string> = {
    IND: 'India',
    IN: 'India',
    USA: 'United States',
    US: 'United States',
    CHN: 'China',
    CN: 'China',
};

/** Look up a value inside the ONDC `tags` array by group code + item code. */
export const readTag = (
    tags: OndcTag[] | null | undefined,
    groupCode: string,
    itemCode: string
): string => {
    const group = tags?.find(t => t.code === groupCode);
    return group?.list?.find(i => i.code === itemCode)?.value?.trim() || '';
};

export const getBrand = (product: OndcTagProductSource): string =>
    readTag(product.tags, 'attribute', 'brand');

export const getCountryOfOrigin = (product: OndcTagProductSource): string => {
    const code = readTag(product.tags, 'origin', 'country');
    if (!code) return '';
    return COUNTRY_NAMES[code.toUpperCase()] || code;
};

/** Same as corporate product detail — measure value + unit from the catalog row. */
export const getNetQuantity = (product: OndcTagProductSource): string =>
    `${product.measureValue || ''} ${product.uom || ''}`.trim();

export const getHsn = (product: OndcTagProductSource): string =>
    readTag(product.tags, 'attribute', 'hsn_code') || readTag(product.tags, 'attribute', 'hsn');

const getGstRate = (product: OndcTagProductSource): string => {
    const raw =
        readTag(product.tags, 'attribute', 'gst_rate') ||
        readTag(product.tags, 'tax', 'gst') ||
        readTag(product.tags, 'attribute', 'gst');
    if (!raw) return '';
    const normalized = raw.includes('%') ? raw : `${raw}%`;
    return `${normalized} (included in price)`;
};

const getManufacturer = (product: OndcTagProductSource): string =>
    product.statutory?.packagedCommodities?.manufacturer_or_packer_name?.trim() || '';

const getReturnsLabel = (product: OndcTagProductSource): string => {
    if (product.returnable === true) return 'Returnable';
    if (product.returnable === false) return 'Non-returnable';
    return '';
};

/** Human-readable label for a tag group/item pair. */
const tagLabel = (groupCode: string, itemCode: string): string => {
    const known: Record<string, Record<string, string>> = {
        attribute: {
            brand: 'Brand',
            hsn: 'HSN code',
            hsn_code: 'HSN code',
            gst_rate: 'GST rate',
            gst: 'GST rate',
            model: 'Model',
            colour: 'Colour',
            color: 'Colour',
        },
        origin: { country: 'Country of origin' },
        pack_config: { set: 'Pack size', unit: 'Unit count', case: 'Case size' },
        veg_nonveg: { veg: 'Vegetarian' },
    };
    const label = known[groupCode]?.[itemCode];
    if (label) return label;
    const human = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `${human(groupCode)} — ${human(itemCode)}`;
};

/** Tag item codes already rendered via dedicated corporate-style fields. */
const HANDLED_TAG_CODES = new Set([
    'brand',
    'hsn',
    'hsn_code',
    'gst_rate',
    'gst',
    'country',
]);

/**
 * Build product metadata rows from ONDC tags + catalog fields — same sources
 * as the corporate Key Attributes / product details panels.
 */
export const buildProductMetadataRows = (
    product: OndcTagProductSource
): { label: string; value: string }[] => {
    const rows: { label: string; value: string }[] = [];
    const seen = new Set<string>();

    const add = (label: string, value: string) => {
        const v = value?.trim();
        if (!v || seen.has(label)) return;
        seen.add(label);
        rows.push({ label, value: v });
    };

    // Corporate-aligned fields (from tags + row quantity)
    add('Brand', getBrand(product));
    add('Net quantity', getNetQuantity(product));
    add('Pack size', readTag(product.tags, 'pack_config', 'set'));
    add('HSN code', getHsn(product));
    add('GST rate', getGstRate(product));
    add('Returns', getReturnsLabel(product));
    add('Manufacturer', getManufacturer(product));
    add('Country of origin', getCountryOfOrigin(product));

    // Any other seller-provided tag values not covered above
    const extraTagRows = (product.tags || []).flatMap(group =>
        (group.list || [])
            .filter(item => {
                if (HANDLED_TAG_CODES.has(item.code)) return false;
                if (group.code === 'pack_config' && item.code === 'set') return false;
                return Boolean(item.value?.trim());
            })
            .map(item => ({
                label: tagLabel(group.code, item.code),
                value: item.value.trim(),
            }))
    );

    extraTagRows.forEach(({ label, value }) => add(label, value));

    return rows;
};
