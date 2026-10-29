const { Op } = require('sequelize');

jest.mock('../../entities/ondc_product_with_transactionId', () => ({
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    bulkCreate: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    sequelize: {
        escape: (s) => `'${String(s).replace(/'/g, "''")}'`,
    },
}));
jest.mock('../../entities/ondc_seller_np', () => ({ findAll: jest.fn().mockResolvedValue([]) }));
jest.mock('../ondc_category', () => ({
    resolveHiddenProductExclusion: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../../services/ondcTopDealsSettings', () => ({
    getTopDealsSettings: jest.fn(),
}));
jest.mock('../../../utils/cacheDataMethods', () => ({
    getValue: jest.fn().mockResolvedValue(null),
    setValue: jest.fn().mockResolvedValue(undefined),
    incrValue: jest.fn().mockResolvedValue(1),
}));

const ondcProducts = require('../../entities/ondc_product_with_transactionId');
const { getValue, setValue, incrValue } = require('../../../utils/cacheDataMethods');
const { setCachedList } = require('../../../services/ondcProductListCache');
const { getTopDealsSettings } = require('../../../services/ondcTopDealsSettings');
const {
    findAllOfficeSupplyProductsAndCount,
    findTopDealsByCity,
    findSellersByCity,
    hasFreshOfficeSupplyCatalogForCity,
    hasOfficeSupplyCatalogForCity,
    upsertProductsWithCity,
    deleteOfficeSupplyProductsByTransactionIds,
    deleteOldOfficeSupplyProducts,
    setOndcProductVisibility,
    findMissingCatalogDomainsForCity,
    reconcileCatalogSweep,
} = require('../ondc_product_with_transactionId');

const citySql = (where) => {
    const and = where && where[Op.and];
    if (!Array.isArray(and)) return '';
    return and.map((clause) => clause.val || String(clause)).join(' ');
};

beforeEach(() => {
    jest.clearAllMocks();
    ondcProducts.findAll.mockResolvedValue([]);
    ondcProducts.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    ondcProducts.findOne.mockResolvedValue(null);
    ondcProducts.bulkCreate.mockResolvedValue([]);
    ondcProducts.update.mockResolvedValue([0]);
    ondcProducts.destroy.mockResolvedValue(0);
    getValue.mockResolvedValue(null);
    setValue.mockResolvedValue(undefined);
    incrValue.mockResolvedValue(1);
    getTopDealsSettings.mockResolvedValue({ minPrice: null, maxDiscountPct: null });
});

describe('findAllOfficeSupplyProductsAndCount — shared city catalog', () => {
    it('excludes unclassified products from the buyer listing', async () => {
        ondcProducts.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findAllOfficeSupplyProductsAndCount({ city: 'std:080', limit: 8 });

        const { where } = ondcProducts.findAndCountAll.mock.calls[0][0];
        expect(where.category).toEqual({ [Op.ne]: null });
        expect(where.availableQuantity).toEqual({ [Op.gt]: 0 });
        expect(ondcProducts.findAll).not.toHaveBeenCalled();
    });

    it('does not return a product whose city is only B when listing city A', async () => {
        ondcProducts.findAndCountAll.mockImplementation(async ({ where }) => {
            const sql = citySql(where);
            if (sql.includes('JSON_CONTAINS') && sql.includes('std:080')) {
                return { count: 1, rows: [{ id: 1, name: 'Pen', city: ['std:080'] }] };
            }
            return { count: 0, rows: [] };
        });

        const cityBOnly = await findAllOfficeSupplyProductsAndCount({ city: 'std:022', limit: 8 });
        expect(cityBOnly).toEqual({ rows: [], count: 0 });

        const cityA = await findAllOfficeSupplyProductsAndCount({ city: 'std:080', limit: 8 });
        expect(cityA.count).toBe(1);
        expect(cityA.rows[0].id).toBe(1);
    });

    it('scopes by city JSON array and does not require a transactionId', async () => {
        await findAllOfficeSupplyProductsAndCount({ city: 'std:080' });

        const where = ondcProducts.findAndCountAll.mock.calls[0][0].where;
        expect(where.transactionId).toBeUndefined();
        expect(citySql(where)).toMatch(/JSON_CONTAINS\(city,/);
        expect(citySql(where)).toContain('std:080');
    });
});

describe('findAllOfficeSupplyProductsAndCount — Redis list cache', () => {
    const memoryRedis = () => {
        const store = new Map();
        getValue.mockImplementation(async (key) => (store.has(key) ? store.get(key) : null));
        setValue.mockImplementation(async (key, _expiry, value) => {
            store.set(key, value);
        });
        incrValue.mockImplementation(async (key) => {
            const next = (parseInt(store.get(key), 10) || 0) + 1;
            store.set(key, String(next));
            return next;
        });
        return store;
    };

    it('returns a cached storefront page without querying postgres', async () => {
        memoryRedis();
        const page = { rows: [{ id: 1, name: 'Pen' }], count: 1 };
        await setCachedList('std:080', { city: 'std:080', limit: 8 }, page);

        const result = await findAllOfficeSupplyProductsAndCount({ city: 'std:080', limit: 8 });

        expect(result).toEqual(page);
        expect(ondcProducts.findAll).not.toHaveBeenCalled();
        expect(ondcProducts.findAndCountAll).not.toHaveBeenCalled();
    });

    it('writes the page after a postgres miss', async () => {
        const page = { count: 1, rows: [{ id: 1, name: 'Pen' }] };
        ondcProducts.findAndCountAll.mockResolvedValue(page);

        const result = await findAllOfficeSupplyProductsAndCount({
            city: 'std:080',
            search: 'pen',
            offset: 0,
            limit: 20,
        });

        expect(result).toEqual(page);
        expect(setValue).toHaveBeenCalledWith(
            expect.stringMatching(/^ondc:list:std:080:v0:g0:/),
            90,
            JSON.stringify({ rows: page.rows, count: page.count }),
        );
    });

    it('does not read or write cache when transactionId is set', async () => {
        ondcProducts.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 1 }] });

        await findAllOfficeSupplyProductsAndCount({
            city: 'std:080',
            transactionId: 'txn-admin',
            limit: 8,
        });

        expect(getValue).not.toHaveBeenCalled();
        expect(setValue).not.toHaveBeenCalled();
        expect(ondcProducts.findAndCountAll).toHaveBeenCalled();
    });

    it('lists from postgres when Redis is down', async () => {
        const err = new Error('ECONNREFUSED');
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        getValue.mockRejectedValue(err);
        setValue.mockRejectedValue(err);
        ondcProducts.findAll.mockResolvedValue([]);

        await expect(findAllOfficeSupplyProductsAndCount({ city: 'std:080', limit: 8 }))
            .resolves.toEqual({ rows: [], count: 0 });
        spy.mockRestore();
    });
});

describe('hasFreshOfficeSupplyCatalogForCity', () => {
    it('is true when the city has a row newer than 12 hours', async () => {
        const now = Date.parse('2026-08-20T10:00:00.000Z');
        jest.useFakeTimers({ now });
        ondcProducts.findOne.mockResolvedValue({ id: 9 });

        await expect(hasFreshOfficeSupplyCatalogForCity({ city: 'std:080' })).resolves.toBe(true);

        const { where } = ondcProducts.findOne.mock.calls[0][0];
        expect(where.source).toBe('OFFICE_SUPPLIES');
        expect(where.availableQuantity).toEqual({ [Op.gt]: 0 });
        expect(where.visibleOnPeko).toEqual({ [Op.ne]: false });
        expect(where.updatedAt[Op.gte].toISOString()).toBe('2026-08-19T22:00:00.000Z');
        expect(citySql(where)).toMatch(/JSON_CONTAINS\(city,/);
        expect(citySql(where)).toContain('std:080');
        jest.useRealTimers();
    });

    it('is false when the city catalog is empty', async () => {
        ondcProducts.findOne.mockResolvedValue(null);
        await expect(hasFreshOfficeSupplyCatalogForCity({ city: 'std:080' })).resolves.toBe(false);
    });

    it('is false when every product in the city is out of stock', async () => {
        ondcProducts.findOne.mockResolvedValue(null);
        await expect(hasFreshOfficeSupplyCatalogForCity({ city: 'std:080' })).resolves.toBe(false);
        expect(ondcProducts.findOne.mock.calls[0][0].where.availableQuantity).toEqual({ [Op.gt]: 0 });
    });
});

describe('upsertProductsWithCity', () => {
    it('appends a new city on the same SKU instead of inserting a second row', async () => {
        const existing = {
            bppUri: 'https://bpp.example.com',
            ondcVendorId: 'V1',
            ondcProductId: 'SKU-1',
            city: ['std:080'],
            update: jest.fn().mockResolvedValue(true),
        };
        ondcProducts.findAll.mockResolvedValue([existing]);

        const result = await upsertProductsWithCity(
            [{
                bppUri: 'https://bpp.example.com',
                ondcVendorId: 'V1',
                ondcProductId: 'SKU-1',
                name: 'A4 paper',
            }],
            'std:022'
        );

        expect(result).toEqual({ inserted: 0, updated: 1 });
        expect(ondcProducts.bulkCreate).not.toHaveBeenCalled();
        expect(existing.update).toHaveBeenCalledWith(expect.objectContaining({
            city: ['std:080', 'std:022'],
            name: 'A4 paper',
        }));
    });

    it('does not append a city when upserting incremental (null cityCode)', async () => {
        const existing = {
            bppUri: 'https://bpp.example.com',
            ondcVendorId: 'V1',
            ondcProductId: 'SKU-1',
            city: ['std:080'],
            update: jest.fn().mockResolvedValue(true),
        };
        ondcProducts.findAll.mockResolvedValue([existing]);

        const result = await upsertProductsWithCity(
            [{
                bppUri: 'https://bpp.example.com',
                ondcVendorId: 'V1',
                ondcProductId: 'SKU-1',
                name: 'A4 paper',
                availableQuantity: 0,
            }],
            null
        );

        expect(result).toEqual({ inserted: 0, updated: 1 });
        const changes = existing.update.mock.calls[0][0];
        expect(changes.city).toBeUndefined();
        expect(changes.availableQuantity).toBe(0);
        expect(changes.name).toBe('A4 paper');
        expect(changes.catalogSweepId).toBeUndefined();
    });

    it('stamps catalogSweepId on a city catalog_full upsert', async () => {
        const existing = {
            bppUri: 'https://bpp.example.com',
            ondcVendorId: 'V1',
            ondcProductId: 'SKU-1',
            city: ['std:044'],
            update: jest.fn().mockResolvedValue(true),
        };
        ondcProducts.findAll.mockResolvedValue([existing]);

        await upsertProductsWithCity(
            [{
                bppUri: 'https://bpp.example.com',
                ondcVendorId: 'V1',
                ondcProductId: 'SKU-1',
                name: 'Laptop',
                catalogSweepId: 'sweep-1',
            }],
            'std:044'
        );

        expect(existing.update).toHaveBeenCalledWith(expect.objectContaining({
            catalogSweepId: 'sweep-1',
            name: 'Laptop',
        }));
    });

    it('does not stamp catalogSweepId on incremental city * upserts', async () => {
        const existing = {
            bppUri: 'https://bpp.example.com',
            ondcVendorId: 'V1',
            ondcProductId: 'SKU-1',
            city: ['std:044'],
            update: jest.fn().mockResolvedValue(true),
        };
        ondcProducts.findAll.mockResolvedValue([existing]);

        await upsertProductsWithCity(
            [{
                bppUri: 'https://bpp.example.com',
                ondcVendorId: 'V1',
                ondcProductId: 'SKU-1',
                name: 'Laptop',
                catalogSweepId: 'sweep-should-ignore',
            }],
            null
        );

        expect(existing.update.mock.calls[0][0].catalogSweepId).toBeUndefined();
    });

    it('copies sibling cities onto a new incremental SKU', async () => {
        ondcProducts.findAll
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{
                bppUri: 'https://bpp.example.com',
                ondcVendorId: 'V1',
                city: ['std:080', 'std:022'],
            }]);

        const result = await upsertProductsWithCity(
            [{
                bppUri: 'https://bpp.example.com',
                ondcVendorId: 'V1',
                ondcProductId: 'SKU-NEW',
                name: 'Stapler',
            }],
            null
        );

        expect(result).toEqual({ inserted: 1, updated: 0 });
        expect(ondcProducts.bulkCreate).toHaveBeenCalledWith([
            expect.objectContaining({
                ondcProductId: 'SKU-NEW',
                city: ['std:080', 'std:022'],
            }),
        ]);
        expect(incrValue.mock.calls.map(([key]) => key)).toEqual(expect.arrayContaining([
            'ondc:list:ver:std:080',
            'ondc:list:ver:std:022',
        ]));
    });

    it('bumps the ingest city cache version after a successful upsert', async () => {
        const existing = {
            bppUri: 'https://bpp.example.com',
            ondcVendorId: 'V1',
            ondcProductId: 'SKU-1',
            city: ['std:080'],
            update: jest.fn().mockResolvedValue(true),
        };
        ondcProducts.findAll.mockResolvedValue([existing]);

        await upsertProductsWithCity(
            [{
                bppUri: 'https://bpp.example.com',
                ondcVendorId: 'V1',
                ondcProductId: 'SKU-1',
                name: 'A4 paper',
            }],
            'std:022'
        );

        expect(incrValue.mock.calls.map(([key]) => key)).toEqual(expect.arrayContaining([
            'ondc:list:ver:std:080',
            'ondc:list:ver:std:022',
        ]));
    });

    it('bumps cities on updated rows for an incremental (null city) upsert', async () => {
        const existing = {
            bppUri: 'https://bpp.example.com',
            ondcVendorId: 'V1',
            ondcProductId: 'SKU-1',
            city: ['std:080', 'std:022'],
            update: jest.fn().mockResolvedValue(true),
        };
        ondcProducts.findAll.mockResolvedValue([existing]);

        await upsertProductsWithCity(
            [{
                bppUri: 'https://bpp.example.com',
                ondcVendorId: 'V1',
                ondcProductId: 'SKU-1',
                name: 'A4 paper',
            }],
            null
        );

        expect(incrValue.mock.calls.map(([key]) => key)).toEqual(expect.arrayContaining([
            'ondc:list:ver:std:080',
            'ondc:list:ver:std:022',
        ]));
        expect(incrValue).not.toHaveBeenCalledWith('ondc:list:ver:*');
    });
});

describe('hasOfficeSupplyCatalogForCity', () => {
    it('is true when the city has any row', async () => {
        ondcProducts.findOne.mockResolvedValue({ id: 1 });
        await expect(hasOfficeSupplyCatalogForCity({ city: 'std:080' })).resolves.toBe(true);
        const { where } = ondcProducts.findOne.mock.calls[0][0];
        expect(where.updatedAt).toBeUndefined();
        expect(citySql(where)).toContain('std:080');
    });

    it('is false for city *', async () => {
        await expect(hasOfficeSupplyCatalogForCity({ city: '*' })).resolves.toBe(false);
        expect(ondcProducts.findOne).not.toHaveBeenCalled();
    });
});

describe('findAllOfficeSupplyProductsAndCount — text search', () => {
    it('ANDs each token against name, shortDesc, and longDesc', async () => {
        ondcProducts.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findAllOfficeSupplyProductsAndCount({ city: 'std:080', search: 'black pen' });

        const { where, order } = ondcProducts.findAndCountAll.mock.calls[0][0];
        const and = where[Op.and];
        const searchOrs = and.filter((clause) => clause[Op.or]);
        expect(searchOrs.length).toBeGreaterThanOrEqual(2);
        const firstOr = searchOrs[0][Op.or];
        expect(firstOr).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: expect.any(Object) }),
                expect.objectContaining({ shortDesc: expect.any(Object) }),
                expect.objectContaining({ longDesc: expect.any(Object) }),
            ])
        );
        expect(firstOr.every((clause) => !('category' in clause) && !('localCategory' in clause))).toBe(true);
        expect(order[0][1]).toBe('DESC');
        expect(order.slice(1)).toEqual([['listingRank', 'ASC'], ['name', 'ASC']]);
    });

    it('orders by name-first score, then listing position, then name', async () => {
        ondcProducts.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findAllOfficeSupplyProductsAndCount({ city: 'std:080', search: 'stapler' });

        const { order } = ondcProducts.findAndCountAll.mock.calls[0][0];
        const score = order[0][0].val || String(order[0][0]);
        expect(score).toContain('name REGEXP');
        expect(score).toContain('shortDesc');
        expect(score).toContain('longDesc');
        expect(score).toContain('100');
        expect(order[0][1]).toBe('DESC');
        expect(order.slice(1)).toEqual([['listingRank', 'ASC'], ['name', 'ASC']]);
    });
});

describe('findAllOfficeSupplyProductsAndCount — sort', () => {
    const orderFor = async (params) => {
        ondcProducts.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
        await findAllOfficeSupplyProductsAndCount({ city: 'std:080', ...params });
        return ondcProducts.findAndCountAll.mock.calls[0][0].order;
    };
    const sql = (entry) => entry[0].val || String(entry[0]);

    it('price_asc: cheapest first, unpriced last', async () => {
        const order = await orderFor({ sort: 'price_asc' });
        expect(sql(order[0])).toBe('price IS NULL');
        expect(order.slice(1)).toEqual([['price', 'ASC'], ['name', 'ASC']]);
    });

    it('price_desc: most expensive first, unpriced last', async () => {
        const order = await orderFor({ sort: 'price_desc' });
        expect(sql(order[0])).toBe('price IS NULL');
        expect(order.slice(1)).toEqual([['price', 'DESC'], ['name', 'ASC']]);
    });

    it('discount: biggest % off first, no discount counted as 0', async () => {
        const order = await orderFor({ sort: 'discount' });
        expect(sql(order[0])).toBe(
            'CASE WHEN maxPrice > price AND maxPrice > 0 THEN (maxPrice - price) / maxPrice ELSE 0 END'
        );
        expect(order[0][1]).toBe('DESC');
        expect(order[1]).toEqual(['name', 'ASC']);
    });

    it('newest: most recently listed first', async () => {
        expect(await orderFor({ sort: 'newest' })).toEqual([['createdAt', 'DESC'], ['id', 'DESC']]);
    });

    it('a sort replaces relevance ordering but a search still filters', async () => {
        ondcProducts.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
        await findAllOfficeSupplyProductsAndCount({ city: 'std:080', search: 'pen', sort: 'price_asc' });
        const { where, order } = ondcProducts.findAndCountAll.mock.calls[0][0];
        expect(where[Op.and].some((clause) => clause[Op.or])).toBe(true);
        expect(order.slice(1)).toEqual([['price', 'ASC'], ['name', 'ASC']]);
    });

    it('relevance, or no sort, keeps the default order: listing position, then name', async () => {
        expect(await orderFor({ sort: 'relevance' })).toEqual([['listingRank', 'ASC'], ['name', 'ASC']]);
        ondcProducts.findAndCountAll.mockClear();
        expect(await orderFor({})).toEqual([['listingRank', 'ASC'], ['name', 'ASC']]);
    });
});

describe('findAllOfficeSupplyProductsAndCount — sidebar filters', () => {
    const listingWhere = async (opts) => {
        ondcProducts.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
        await findAllOfficeSupplyProductsAndCount({ city: 'std:080', ...opts });
        return ondcProducts.findAndCountAll.mock.calls[0][0].where;
    };

    const andSql = (where) => {
        const and = where[Op.and];
        if (!Array.isArray(and)) return '';
        return and.map((clause) => clause.val || String(clause)).join(' ');
    };

    it('applies a numeric price ceiling', async () => {
        const where = await listingWhere({ priceMax: 200 });
        expect(andSql(where)).toContain('CAST(price AS DECIMAL(12,2)) <= 200');
    });

    it('applies a minimum discount percent', async () => {
        const where = await listingWhere({ minDiscount: 10 });
        const sql = andSql(where);
        expect(sql).toContain('maxPrice > price');
        expect(sql).toContain('>= 10');
    });

    it('restricts by seller vendorName', async () => {
        const where = await listingWhere({ sellers: 'BizSupply Co,Office Mart' });
        expect(where.vendorName).toEqual({ [Op.in]: ['BizSupply Co', 'Office Mart'] });
    });
});

describe('findSellersByCity', () => {
    it('lists vendors from classified, visible products scoped to search and category', async () => {
        ondcProducts.findAll.mockResolvedValue([{ vendorName: 'BizSupply Co' }]);

        const sellers = await findSellersByCity({
            city: 'std:080',
            search: 'pen',
            localCategory: 'Stationery',
        });

        expect(sellers).toEqual(['BizSupply Co']);
        const { where } = ondcProducts.findAll.mock.calls[0][0];
        expect(where.category).toEqual({ [Op.ne]: null });
        expect(where.visibleOnPeko).toEqual({ [Op.ne]: false });
        expect(where.availableQuantity).toEqual({ [Op.gt]: 0 });
        expect(where.localCategory).toBe('Stationery');
        const searchOr = where[Op.and].find((clause) => clause[Op.or]);
        expect(searchOr[Op.or]).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: expect.any(Object) }),
            ])
        );
    });
});

describe('findTopDealsByCity', () => {
    it('orders by listing position, then percent off, not rupee-off', async () => {
        ondcProducts.findAll.mockResolvedValue([]);

        await findTopDealsByCity({ city: 'std:080', limit: 12 });

        expect(ondcProducts.findAll).toHaveBeenCalledTimes(1);
        const { where, order } = ondcProducts.findAll.mock.calls[0][0];
        expect(where.category).toEqual({ [Op.ne]: null });
        expect(where.availableQuantity).toEqual({ [Op.gt]: 0 });
        expect(order[0]).toEqual(['listingRank', 'ASC']);
        const pct = order[1][0].val || String(order[1][0]);
        expect(pct).toContain('(maxPrice - price) / maxPrice');
        expect(order[1][1]).toBe('DESC');
        expect(order[2][0].val || String(order[2][0])).toBe('(maxPrice - price)');
        expect(order[2][1]).toBe('DESC');
    });

    it('adds no Rules-tab filter while the settings are unset', async () => {
        await findTopDealsByCity({ city: 'std:080', limit: 12 });

        const { where } = ondcProducts.findAll.mock.calls[0][0];
        expect(where[Op.and].some((c) => c && c.price)).toBe(false);
        expect(citySql(where)).not.toContain('* 100 <=');
    });

    it('applies the minimum price and the price-sanity discount cap', async () => {
        getTopDealsSettings.mockResolvedValue({ minPrice: 250, maxDiscountPct: 60 });

        await findTopDealsByCity({ city: 'std:080', limit: 12 });

        const { where } = ondcProducts.findAll.mock.calls[0][0];
        expect(where[Op.and]).toEqual(expect.arrayContaining([{ price: { [Op.gte]: 250 } }]));
        expect(citySql(where)).toContain('((maxPrice - price) / maxPrice) * 100 <= 60');
    });
});

describe('mark office-supply products unavailable instead of deleting', () => {
    it('sets availableQuantity to 0 by transactionId without destroy or bumping updatedAt', async () => {
        ondcProducts.update.mockResolvedValue([3]);

        const count = await deleteOfficeSupplyProductsByTransactionIds({
            transactionIds: ['txn-1', 'txn-2'],
        });

        expect(count).toBe(3);
        expect(ondcProducts.destroy).not.toHaveBeenCalled();
        expect(ondcProducts.update).toHaveBeenCalledWith(
            { availableQuantity: 0 },
            expect.objectContaining({
                silent: true,
                where: expect.objectContaining({
                    source: 'OFFICE_SUPPLIES',
                    transactionId: { [Op.in]: ['txn-1', 'txn-2'] },
                }),
            })
        );
        const { where } = ondcProducts.update.mock.calls[0][1];
        expect(where[Op.or]).toEqual([
            { availableQuantity: { [Op.gt]: 0 } },
            { availableQuantity: null },
        ]);
        expect(incrValue).toHaveBeenCalledWith('ondc:list:ver:*');
    });

    it('sets availableQuantity to 0 for stale updatedAt without destroy', async () => {
        ondcProducts.update.mockResolvedValue([2]);
        const before = new Date('2026-08-29T00:00:00Z');

        const count = await deleteOldOfficeSupplyProducts({ before });

        expect(count).toBe(2);
        expect(ondcProducts.destroy).not.toHaveBeenCalled();
        expect(ondcProducts.update).toHaveBeenCalledWith(
            { availableQuantity: 0 },
            expect.objectContaining({
                silent: true,
                where: expect.objectContaining({
                    source: 'OFFICE_SUPPLIES',
                    updatedAt: { [Op.lt]: before },
                }),
            })
        );
        expect(incrValue).toHaveBeenCalledWith('ondc:list:ver:*');
    });

    it('bumps per-city cache versions from purged product rows', async () => {
        ondcProducts.findAll.mockResolvedValue([
            { city: ['std:080'] },
            { city: ['std:022', 'std:080'] },
        ]);
        ondcProducts.update.mockResolvedValue([2]);

        await deleteOldOfficeSupplyProducts({ before: new Date('2026-08-29T00:00:00Z') });

        expect(incrValue.mock.calls.map(([key]) => key)).toEqual(expect.arrayContaining([
            'ondc:list:ver:std:080',
            'ondc:list:ver:std:022',
        ]));
        expect(incrValue).not.toHaveBeenCalledWith('ondc:list:ver:*');
    });

    it('does not update when no transaction ids are given', async () => {
        expect(await deleteOfficeSupplyProductsByTransactionIds({ transactionIds: [] })).toBe(0);
        expect(ondcProducts.update).not.toHaveBeenCalled();
    });
});

describe('setOndcProductVisibility', () => {
    it('bumps list cache versions for cities on the hidden product', async () => {
        ondcProducts.findOne.mockResolvedValue({ city: ['std:080', 'std:022'] });
        ondcProducts.update.mockResolvedValue([1]);

        await setOndcProductVisibility(42, false);

        expect(incrValue.mock.calls.map(([key]) => key)).toEqual(expect.arrayContaining([
            'ondc:list:ver:std:080',
            'ondc:list:ver:std:022',
        ]));
    });
});

describe('findMissingCatalogDomainsForCity', () => {
    it('returns domains with no in-stock city row, matching ONDC:RET14 and RET14', async () => {
        ondcProducts.findAll.mockResolvedValue([{ ondcDomain: 'ONDC:RET10' }]);

        const missing = await findMissingCatalogDomainsForCity({
            city: 'std:044',
            domains: ['ONDC:RET10', 'ONDC:RET14', 'RET16'],
        });

        expect(missing).toEqual(['ONDC:RET14', 'RET16']);
        const { where } = ondcProducts.findAll.mock.calls[0][0];
        expect(where.source).toBe('OFFICE_SUPPLIES');
        expect(where.availableQuantity).toEqual({ [Op.gt]: 0 });
        expect(citySql(where)).toMatch(/JSON_CONTAINS\(city,/);
        expect(citySql(where)).toContain('std:044');
    });
});

describe('reconcileCatalogSweep', () => {
    it('drops the city from a multi-city miss and deletes a city-only miss', async () => {
        const multi = {
            city: ['std:044', 'std:080'],
            catalogSweepId: 'old',
            update: jest.fn().mockResolvedValue(true),
            destroy: jest.fn(),
        };
        const only = {
            city: ['std:044'],
            catalogSweepId: null,
            update: jest.fn(),
            destroy: jest.fn().mockResolvedValue(1),
        };
        ondcProducts.findAll.mockResolvedValue([multi, only]);

        const result = await reconcileCatalogSweep({
            city: 'std:044',
            domain: 'ONDC:RET14',
            sweepId: 'sweep-now',
        });

        expect(result).toEqual({ skipped: false, uncity: 1, deleted: 1 });
        expect(multi.update).toHaveBeenCalledWith({ city: ['std:080'] });
        expect(multi.destroy).not.toHaveBeenCalled();
        expect(only.destroy).toHaveBeenCalled();
        const { where } = ondcProducts.findAll.mock.calls[0][0];
        expect(where.ondcDomain).toEqual({ [Op.in]: ['ONDC:RET14', 'RET14'] });
        expect(incrValue).toHaveBeenCalledWith('ondc:list:ver:std:044');
    });

    it('does nothing without a sweep id', async () => {
        await expect(reconcileCatalogSweep({ city: 'std:044', domain: 'ONDC:RET14' }))
            .resolves.toEqual({ skipped: true, uncity: 0, deleted: 0 });
        expect(ondcProducts.findAll).not.toHaveBeenCalled();
    });
});

