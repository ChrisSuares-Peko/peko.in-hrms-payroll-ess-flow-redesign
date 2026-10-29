/**
 * on_search ingest: every item from an enabled seller NP with a usable
 * http(s) image is stored, tagged with its seller category; whether it is
 * shown is stamped afterwards by recomputeVisibility (Review mapping + Rules).
 * Imageless SKUs and disabled-NP catalogs are dropped. Waiters still receive
 * every product id.
 *
 * Requiring the webhook controller pulls onConfirm persist → subscription.js
 * (`package` is a reserved word under the test babel transform), so those
 * modules are mocked at the top like the other webhook suites.
 */

jest.mock('../../../services/ondcObservability', () => ({
    reportInbound: jest.fn(),
    reportOutbound: jest.fn(),
}));
jest.mock('../../../models/use-cases/ondc_order', () => ({
    updateOndcOrderStatus: jest.fn().mockResolvedValue([1]),
    updateOndcOrderTracking: jest.fn().mockResolvedValue([1]),
    findOndcOrderByTransactionId: jest.fn(),
}));
jest.mock('../../../services/ondcPayoutHold', () => ({
    recordDeliveryAndHoldPayout: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../services/ondcReturnLifecycle', () => ({
    applyOndcReturnOnUpdate: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../../services/ondcInvoiceNotify', () => ({
    sendOndcInvoiceEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../services/ondcOrderStatusNotify', () => ({
    dispatchOndcStatusEmails: jest.fn(),
    checkOndcEtaRevision: jest.fn(),
}));
jest.mock('../../../models/use-cases/ondc_issue', () => ({
    findOndcIssueByIssueId: jest.fn(),
    updateOndcIssueFromCallback: jest.fn(),
    createOndcIssue: jest.fn(),
}));
jest.mock('../../../models/use-cases/ondc_issue_event', () => ({
    recordOndcIssueEvent: jest.fn(),
}));
jest.mock('../../../services/ondcOnConfirmPersist', () => ({
    persistAndSettleFromOnConfirm: jest.fn(),
}));
jest.mock('../../../models/use-cases/ondc_callback_log', () => ({
    createCallbackLog: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../../../models/use-cases/ondc_product_with_transactionId', () => ({
    upsertProductsWithCity: jest.fn().mockResolvedValue({ inserted: 1, updated: 0 }),
}));
jest.mock('../../../models/use-cases/user_search_ondc', () => ({
    findByTransactionId: jest.fn(),
}));
jest.mock('../../../models/use-cases/ondc_seller', () => ({
    upsertOndcSeller: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../models/use-cases/ondc_seller_np', () => {
    const { isAllowedCatalogBpp } = require('../../../utils/ondcCatalogBppAllowlist');
    return {
        upsertOndcSellerNp: jest.fn(),
        countOndcSellerNps: jest.fn(),
        shouldIngestCatalogBpp: jest.fn(({ bppId, sellerNp, tableWasEmpty }) => {
            if (tableWasEmpty || !sellerNp) return isAllowedCatalogBpp({ bppId });
            return sellerNp.enabled === true || sellerNp.enabled === 1;
        }),
    };
});
jest.mock('../../../models/use-cases/ondc_catalog_rules', () => ({
    recordSeenDomain: jest.fn(),
    findBannedWords: jest.fn(),
    destroyProductsByKeys: jest.fn(),
}));
jest.mock('../../../services/ondcProductListCache', () => ({ bumpListCacheForCities: jest.fn() }));
jest.mock('../../../models/use-cases/ondc_seller_category', () => ({
    upsertSellerCategories: jest.fn(),
    normalizeCategoryKey: (raw) => String(raw ?? '').trim().toLowerCase() || '__none__',
}));
jest.mock('../../../services/ondcCatalogRules', () => ({
    recordIngestSkips: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../services/ondcProductVisibility', () => ({
    recomputeVisibility: jest.fn().mockResolvedValue(0),
}));
jest.mock('../../../services/ondcSellerCategorySeed', () => ({
    waitForSellerCategorySeed: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../../services/ondcCategoryCountRefresher', () => ({
    scheduleCategoryCountRefresh: jest.fn(),
}));
jest.mock('../../../services/ondcCatalogSweepReconcile', () => ({
    scheduleCatalogSweepReconcile: jest.fn(),
}));
jest.mock('../../../services/ondcSearchWaiter', () => ({
    notifyOnSearch: jest.fn(),
}));

const { Op } = require('sequelize');
const { upsertProductsWithCity } = require('../../../models/use-cases/ondc_product_with_transactionId');
const { findByTransactionId } = require('../../../models/use-cases/user_search_ondc');
const { notifyOnSearch } = require('../../../services/ondcSearchWaiter');
const { ingestOnSearchCatalog } = require('../ondc');
const { scheduleCatalogSweepReconcile } = require('../../../services/ondcCatalogSweepReconcile');
const { upsertOndcSellerNp, countOndcSellerNps } = require('../../../models/use-cases/ondc_seller_np');
const { isAllowedCatalogBpp } = require('../../../utils/ondcCatalogBppAllowlist');
const { recordSeenDomain, findBannedWords, destroyProductsByKeys } = require('../../../models/use-cases/ondc_catalog_rules');
const { upsertSellerCategories } = require('../../../models/use-cases/ondc_seller_category');
const { recordIngestSkips } = require('../../../services/ondcCatalogRules');
const { recomputeVisibility } = require('../../../services/ondcProductVisibility');
const { waitForSellerCategorySeed } = require('../../../services/ondcSellerCategorySeed');

const catalogReq = (items, { categories } = {}) => ({
    LogTraceId: 'trace-1',
    body: {
        context: {
            transaction_id: 'txn-1',
            bpp_id: 'ondcseller-prod.costbo.com',
            bpp_uri: 'https://seller.example/bpp',
            domain: 'ONDC:RET16',
            city: 'std:080',
        },
        message: {
            catalog: {
                ...(categories ? { categories } : {}),
                'bpp/providers': [
                    {
                        id: 'P1',
                        descriptor: { name: 'Seller', symbol: 'S' },
                        items,
                    },
                ],
            },
        },
    },
});

const GOOD_IMAGE = 'https://cdn.example/a4.jpg';

const item = (id, name, { images = [GOOD_IMAGE], symbol, categoryId = 'Paper' } = {}) => ({
    id,
    descriptor: { name, short_desc: name, long_desc: name, images, symbol },
    quantity: {
        unitized: { measure: { unit: 'unit', value: '1' } },
        available: { count: '10' },
        maximum: { count: '5' },
        minimum: { count: '1' },
    },
    price: { value: '10.00', maximum_value: '12.00' },
    category_id: categoryId,
});

beforeEach(() => {
    jest.clearAllMocks();
    findByTransactionId.mockResolvedValue({
        city: 'std:080',
        source: 'OFFICE_SUPPLIES',
        ondcDomain: 'ONDC:RET16',
        catalogSweepId: 'sweep-1',
    });
    upsertOndcSellerNp.mockImplementation(async ({ bppId }) => ({
        bppId,
        enabled: isAllowedCatalogBpp({ bppId }),
    }));
    countOndcSellerNps.mockResolvedValue(1);
    recordSeenDomain.mockImplementation(async (code) => ({ code, enabled: true }));
    findBannedWords.mockResolvedValue([]);
    destroyProductsByKeys.mockResolvedValue(0);
    upsertSellerCategories.mockImplementation(async (entries) => {
        const ids = new Map();
        entries.forEach((e) => {
            const key = `ONDC:RET16|${String(e.categoryKey).toLowerCase()}`;
            if (!ids.has(key)) ids.set(key, ids.size + 1);
        });
        return ids;
    });
});

const skippedRows = () => recordIngestSkips.mock.calls.flatMap(([rows]) => rows);

describe('ingestOnSearchCatalog', () => {
    it('stores every item with an image when no word is banned', async () => {
        await ingestOnSearchCatalog(catalogReq([
            item('SKU-PAPER', 'A4 Paper'),
            item('SKU-SNACK', 'Potato Chips', { categoryId: 'Snacks' }),
        ]));

        expect(upsertProductsWithCity).toHaveBeenCalledTimes(1);
        const [products, city] = upsertProductsWithCity.mock.calls[0];
        expect(city).toBe('std:080');
        expect(products.map((p) => p.ondcProductId)).toEqual(['SKU-PAPER', 'SKU-SNACK']);
        expect(products[0]).toEqual(expect.objectContaining({
            name: 'A4 Paper',
            categoryId: 'Paper',
            sellerCategoryId: 1,
            images: [GOOD_IMAGE],
            catalogSweepId: 'sweep-1',
        }));
        expect(products[1].sellerCategoryId).toBe(2);
        // category / visibility are not set at ingest
        expect(products[0]).not.toHaveProperty('category');
        expect(products[0]).not.toHaveProperty('hiddenReason');
        expect(scheduleCatalogSweepReconcile).toHaveBeenCalledWith({
            city: 'std:080',
            domain: 'ONDC:RET16',
            sweepId: 'sweep-1',
            ingested: 2,
        });
        expect(notifyOnSearch).toHaveBeenCalledWith('txn-1', ['SKU-PAPER', 'SKU-SNACK']);
    });

    it('records each seller category once, using the catalog descriptor name as label', async () => {
        await ingestOnSearchCatalog(catalogReq(
            [item('A', 'A4 Paper', { categoryId: 'CAT-7' }), item('B', 'A3 Paper', { categoryId: 'CAT-7' })],
            { categories: [{ id: 'CAT-7', descriptor: { name: 'Healthy Drinks' } }] }
        ));

        expect(waitForSellerCategorySeed).toHaveBeenCalled();
        const [entries] = upsertSellerCategories.mock.calls[0];
        expect(entries).toEqual([
            { ondcDomain: 'ONDC:RET16', categoryKey: 'CAT-7', label: 'Healthy Drinks' },
            { ondcDomain: 'ONDC:RET16', categoryKey: 'CAT-7', label: 'Healthy Drinks' },
        ]);
    });

    it('recomputes visibility for exactly the stored products', async () => {
        await ingestOnSearchCatalog(catalogReq([item('SKU-PAPER', 'A4 Paper')]));

        expect(recomputeVisibility).toHaveBeenCalledWith({
            bppId: 'ondcseller-prod.costbo.com',
            ondcVendorId: { [Op.in]: ['P1'] },
            ondcProductId: { [Op.in]: ['SKU-PAPER'] },
        });
        expect(recomputeVisibility.mock.invocationCallOrder[0])
            .toBeGreaterThan(upsertProductsWithCity.mock.invocationCallOrder[0]);
    });

    it('still stores products from a switched-off domain (hidden later by recompute)', async () => {
        recordSeenDomain.mockResolvedValue({ code: 'ONDC:RET16', enabled: false });

        await ingestOnSearchCatalog(catalogReq([item('SKU-PAPER', 'A4 Paper')]));

        expect(recordSeenDomain).toHaveBeenCalledWith('ONDC:RET16');
        expect(upsertProductsWithCity).toHaveBeenCalledTimes(1);
        expect(recomputeVisibility).toHaveBeenCalled();
    });

    it('ingests when the domain cannot be recorded', async () => {
        recordSeenDomain.mockRejectedValue(new Error('db down'));

        await ingestOnSearchCatalog(catalogReq([item('SKU-PAPER', 'A4 Paper')]));

        expect(upsertProductsWithCity).toHaveBeenCalledTimes(1);
    });

    it('stores products without a seller category id when recording categories fails', async () => {
        upsertSellerCategories.mockRejectedValue(new Error('db down'));

        await ingestOnSearchCatalog(catalogReq([item('SKU-PAPER', 'A4 Paper')]));

        const [products] = upsertProductsWithCity.mock.calls[0];
        expect(products[0].sellerCategoryId).toBeUndefined();
    });

    it('records a disabled NP and does not persist its catalog', async () => {
        const req = catalogReq([item('SKU-PAPER', 'A4 Paper')]);
        req.body.context.bpp_id = 'seller.bpp';

        await ingestOnSearchCatalog(req);

        expect(upsertOndcSellerNp).toHaveBeenCalledWith(expect.objectContaining({
            bppId: 'seller.bpp',
        }));
        expect(upsertProductsWithCity).not.toHaveBeenCalled();
        expect(upsertSellerCategories).not.toHaveBeenCalled();
        expect(notifyOnSearch).toHaveBeenCalledWith('txn-1', []);
        expect(scheduleCatalogSweepReconcile).not.toHaveBeenCalled();
    });

    it('does not persist when a known NP has been disabled', async () => {
        upsertOndcSellerNp.mockResolvedValue({
            bppId: 'ondcseller-prod.costbo.com',
            enabled: false,
        });

        await ingestOnSearchCatalog(catalogReq([item('SKU-PAPER', 'A4 Paper')]));

        expect(upsertOndcSellerNp).toHaveBeenCalled();
        expect(upsertProductsWithCity).not.toHaveBeenCalled();
        expect(notifyOnSearch).toHaveBeenCalledWith('txn-1', []);
    });

    it('ingests a token-matched catalog when the Seller NPs table is empty', async () => {
        countOndcSellerNps.mockResolvedValue(0);
        upsertOndcSellerNp.mockResolvedValue(null);

        await ingestOnSearchCatalog(catalogReq([item('SKU-PAPER', 'A4 Paper')]));

        expect(upsertProductsWithCity).toHaveBeenCalledTimes(1);
        expect(notifyOnSearch).toHaveBeenCalledWith('txn-1', ['SKU-PAPER']);
    });

    it('skips an unknown bpp_id when the Seller NPs table is empty', async () => {
        countOndcSellerNps.mockResolvedValue(0);
        const req = catalogReq([item('SKU-PAPER', 'A4 Paper')]);
        req.body.context.bpp_id = 'seller.bpp';

        await ingestOnSearchCatalog(req);

        expect(upsertProductsWithCity).not.toHaveBeenCalled();
        expect(notifyOnSearch).toHaveBeenCalledWith('txn-1', []);
    });

    it('skips store and ingest when bpp_id is missing', async () => {
        const req = catalogReq([item('SKU-PAPER', 'A4 Paper')]);
        req.body.context.bpp_id = '';

        await ingestOnSearchCatalog(req);

        expect(upsertOndcSellerNp).not.toHaveBeenCalled();
        expect(upsertProductsWithCity).not.toHaveBeenCalled();
        expect(notifyOnSearch).toHaveBeenCalledWith('txn-1', []);
    });

    it('does not persist city * from incremental on_search', async () => {
        findByTransactionId.mockResolvedValue({
            city: '*',
            source: 'OFFICE_SUPPLIES',
            ondcDomain: 'ONDC:RET16',
        });

        await ingestOnSearchCatalog(catalogReq([
            item('SKU-PAPER', 'A4 Paper'),
        ]));

        expect(upsertProductsWithCity).toHaveBeenCalledTimes(1);
        const [products, city] = upsertProductsWithCity.mock.calls[0];
        expect(city).toBeNull();
        expect(products).toHaveLength(1);
        expect(products[0].ondcProductId).toBe('SKU-PAPER');
        expect(products[0].catalogSweepId).toBeUndefined();
        expect(scheduleCatalogSweepReconcile).not.toHaveBeenCalled();
    });

    it('uses context.city * as null when there is no registry row', async () => {
        findByTransactionId.mockResolvedValue(null);
        const req = catalogReq([item('SKU-PAPER', 'A4 Paper')]);
        req.body.context.city = '*';

        await ingestOnSearchCatalog(req);

        const [, city] = upsertProductsWithCity.mock.calls[0];
        expect(city).toBeNull();
    });

    it('does not persist a SKU with no image and records it as a skip', async () => {
        await ingestOnSearchCatalog(catalogReq([
            item('SKU-PAPER', 'A4 Paper', { images: [] }),
        ]));

        expect(upsertProductsWithCity).not.toHaveBeenCalled();
        expect(recomputeVisibility).not.toHaveBeenCalled();
        expect(notifyOnSearch).toHaveBeenCalledWith('txn-1', ['SKU-PAPER']);
        expect(skippedRows()).toEqual([
            expect.objectContaining({ ondcProductId: 'SKU-PAPER', providerId: 'P1', reason: 'noImage' }),
        ]);
    });

    it('does not persist a placeholder or non-http image', async () => {
        await ingestOnSearchCatalog(catalogReq([
            item('SKU-PH', 'A4 Paper', { images: ['https://seller.example/placeholder.png'] }),
            item('SKU-BARE', 'A4 Paper', { images: ['not-a-url'] }),
        ]));

        expect(upsertProductsWithCity).not.toHaveBeenCalled();
        expect(notifyOnSearch).toHaveBeenCalledWith('txn-1', ['SKU-PH', 'SKU-BARE']);
    });

    it('stores only usable image URLs and accepts {url} objects', async () => {
        await ingestOnSearchCatalog(catalogReq([
            item('SKU-PAPER', 'A4 Paper', {
                images: [
                    'https://seller.example/no_image.jpg',
                    { url: 'https://cdn.example/real.jpg' },
                ],
            }),
        ]));

        const [products] = upsertProductsWithCity.mock.calls[0];
        expect(products).toHaveLength(1);
        expect(products[0].images).toEqual(['https://cdn.example/real.jpg']);
    });

    it('does not store items with a banned word (whole words, any description) and deletes stored copies', async () => {
        findBannedWords.mockResolvedValue(['syrup', 'acid']);
        const inDesc = item('SKU-ACID', 'Toilet Cleaner');
        inDesc.descriptor.long_desc = 'Contains hydrochloric acid.';
        await ingestOnSearchCatalog(catalogReq([
            item('SKU-PAPER', 'Acidity Relief'),
            item('SKU-SYRUP', 'Cough Syrup'),
            inDesc,
        ]));

        const [products] = upsertProductsWithCity.mock.calls[0];
        expect(products.map((p) => p.ondcProductId)).toEqual(['SKU-PAPER']);
        expect(skippedRows()).toEqual([
            expect.objectContaining({ ondcProductId: 'SKU-SYRUP', reason: 'keyword', ruleKey: 'syrup' }),
            expect.objectContaining({ ondcProductId: 'SKU-ACID', reason: 'keyword', ruleKey: 'acid' }),
        ]);
        expect(destroyProductsByKeys).toHaveBeenCalledWith('ondcseller-prod.costbo.com', [
            expect.objectContaining({ providerId: 'P1', ondcProductId: 'SKU-SYRUP' }),
            expect.objectContaining({ providerId: 'P1', ondcProductId: 'SKU-ACID' }),
        ]);
        expect(notifyOnSearch).toHaveBeenCalledWith('txn-1', ['SKU-PAPER', 'SKU-SYRUP', 'SKU-ACID']);
    });

    it('stores everything when the banned-word list cannot be read', async () => {
        findBannedWords.mockRejectedValue(new Error('db down'));
        await ingestOnSearchCatalog(catalogReq([item('SKU-SYRUP', 'Cough Syrup')]));
        expect(upsertProductsWithCity.mock.calls[0][0]).toHaveLength(1);
    });

    it('still settles the catalog when deleting stored copies fails', async () => {
        findBannedWords.mockResolvedValue(['syrup']);
        destroyProductsByKeys.mockRejectedValue(new Error('lock wait timeout'));
        await ingestOnSearchCatalog(catalogReq([item('SKU-SYRUP', 'Cough Syrup')]));
        expect(notifyOnSearch).toHaveBeenCalledWith('txn-1', ['SKU-SYRUP']);
    });
});
