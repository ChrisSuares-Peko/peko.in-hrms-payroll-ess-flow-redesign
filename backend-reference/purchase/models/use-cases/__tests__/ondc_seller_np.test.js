jest.mock('../../entities/ondc_seller_np', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
}));

const { Op } = require('sequelize');
const ondcSellerNps = require('../../entities/ondc_seller_np');
const {
    normalizeBppId,
    upsertOndcSellerNp,
    findAllOndcSellerNps,
    setOndcSellerNpEnabled,
    countOndcSellerNps,
    shouldIngestCatalogBpp,
} = require('../ondc_seller_np');

const instance = (plain) => {
    const data = { ...plain };
    return {
        update: jest.fn(async (patch) => {
            Object.assign(data, patch);
        }),
        get: () => ({ ...data }),
    };
};

beforeEach(() => {
    jest.clearAllMocks();
    ondcSellerNps.findOne.mockResolvedValue(null);
    ondcSellerNps.create.mockImplementation(async (payload) => instance({ id: 1, ...payload }));
    ondcSellerNps.update.mockResolvedValue([1]);
    ondcSellerNps.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    ondcSellerNps.count.mockResolvedValue(0);
});

describe('normalizeBppId', () => {
    it('trims and lowercases', () => {
        expect(normalizeBppId('  WWW.Shopclues.COM  ')).toBe('www.shopclues.com');
        expect(normalizeBppId('')).toBe('');
        expect(normalizeBppId(null)).toBe('');
    });
});

describe('upsertOndcSellerNp', () => {
    it('returns null when bpp_id is empty', async () => {
        await expect(upsertOndcSellerNp({ bppId: '  ' })).resolves.toBeNull();
        expect(ondcSellerNps.findOne).not.toHaveBeenCalled();
        expect(ondcSellerNps.create).not.toHaveBeenCalled();
    });

    it('inserts a token-matched bpp_id as enabled', async () => {
        const row = await upsertOndcSellerNp({
            bppId: 'ondcseller-prod.costbo.com',
            bppUri: 'https://seller.example/bpp',
            npName: 'Costbo',
        });

        expect(ondcSellerNps.create).toHaveBeenCalledTimes(1);
        const payload = ondcSellerNps.create.mock.calls[0][0];
        expect(payload.bppId).toBe('ondcseller-prod.costbo.com');
        expect(payload.enabled).toBe(true);
        expect(payload.bppUri).toBe('https://seller.example/bpp');
        expect(payload.npName).toBe('Costbo');
        expect(row.enabled).toBe(true);
    });

    it('inserts an unknown bpp_id as disabled', async () => {
        const row = await upsertOndcSellerNp({ bppId: 'seller.bpp' });
        expect(ondcSellerNps.create.mock.calls[0][0].enabled).toBe(false);
        expect(row.enabled).toBe(false);
    });

    it('does not reset enabled on a later upsert', async () => {
        const existing = instance({
            id: 9,
            bppId: 'www.shopclues.com',
            enabled: false,
            npName: 'Shopclues',
        });
        ondcSellerNps.findOne.mockResolvedValue(existing);

        const row = await upsertOndcSellerNp({
            bppId: 'WWW.Shopclues.COM',
            bppUri: 'https://www.shopclues.com/bpp',
            npName: 'ShopClues',
        });

        expect(ondcSellerNps.create).not.toHaveBeenCalled();
        expect(existing.update).toHaveBeenCalledTimes(1);
        const patch = existing.update.mock.calls[0][0];
        expect(patch.enabled).toBeUndefined();
        expect(patch.bppUri).toBe('https://www.shopclues.com/bpp');
        expect(row.enabled).toBe(false);
        expect(row.bppUri).toBe('https://www.shopclues.com/bpp');
    });
});

describe('setOndcSellerNpEnabled', () => {
    it('updates the enabled flag', async () => {
        await expect(setOndcSellerNpEnabled({ id: 4, enabled: true })).resolves.toEqual([1]);
        expect(ondcSellerNps.update).toHaveBeenCalledWith(
            { enabled: true },
            { where: { id: 4 } }
        );
    });

    it('returns [0] when id is missing', async () => {
        await expect(setOndcSellerNpEnabled({ enabled: true })).resolves.toEqual([0]);
        expect(ondcSellerNps.update).not.toHaveBeenCalled();
    });
});

describe('findAllOndcSellerNps', () => {
    it('searches bppId, npName, and bppUri', async () => {
        ondcSellerNps.findAndCountAll.mockResolvedValue({
            rows: [{ id: 1, bppId: 'www.shopclues.com', enabled: true }],
            count: 1,
        });

        const result = await findAllOndcSellerNps({
            searchText: 'shop',
            page: 2,
            itemsPerPage: 5,
            sort: 'ASC',
            sortField: 'bppId',
        });

        expect(result.count).toBe(1);
        expect(result.rows).toHaveLength(1);
        const { where, order, limit, offset } = ondcSellerNps.findAndCountAll.mock.calls[0][0];
        expect(where[Op.or]).toEqual([
            { bppId: { [Op.like]: '%shop%' } },
            { npName: { [Op.like]: '%shop%' } },
            { bppUri: { [Op.like]: '%shop%' } },
        ]);
        // Enabled NPs first, A→Z by name; then the requested order.
        expect(order[0]).toEqual(['enabled', 'DESC']);
        expect(order[1][1]).toBe('ASC');
        expect(order[1][0].val).toMatch(/CASE WHEN `enabled` = 1 THEN LOWER\(COALESCE\(NULLIF\(TRIM\(`npName`\), ''\), `bppId`\)\) END/);
        expect(order.slice(2)).toEqual([['bppId', 'ASC'], ['id', 'DESC']]);
        expect(limit).toBe(5);
        expect(offset).toBe(5);
    });
});

describe('countOndcSellerNps', () => {
    it('returns the table count', async () => {
        ondcSellerNps.count.mockResolvedValue(3);
        await expect(countOndcSellerNps()).resolves.toBe(3);
    });
});

describe('shouldIngestCatalogBpp', () => {
    it('falls back to the five name tokens when the table is empty', () => {
        expect(shouldIngestCatalogBpp({
            bppId: 'ondcseller-prod.costbo.com',
            sellerNp: null,
            tableWasEmpty: true,
        })).toBe(true);
        expect(shouldIngestCatalogBpp({
            bppId: 'www.shopclues.com',
            tableWasEmpty: true,
        })).toBe(true);
        expect(shouldIngestCatalogBpp({
            bppId: 'seller.bpp',
            tableWasEmpty: true,
        })).toBe(false);
    });

    it('falls back to tokens when upsert returned no row', () => {
        expect(shouldIngestCatalogBpp({
            bppId: 'prod.dpanda.in',
            sellerNp: null,
            tableWasEmpty: false,
        })).toBe(true);
        expect(shouldIngestCatalogBpp({
            bppId: 'www.amazon.in',
            sellerNp: null,
            tableWasEmpty: false,
        })).toBe(false);
    });

    it('uses the saved enabled flag once NP rows exist', () => {
        expect(shouldIngestCatalogBpp({
            bppId: 'ondcseller-prod.costbo.com',
            sellerNp: { enabled: false },
            tableWasEmpty: false,
        })).toBe(false);
        expect(shouldIngestCatalogBpp({
            bppId: 'ondcseller-prod.costbo.com',
            sellerNp: { enabled: true },
            tableWasEmpty: false,
        })).toBe(true);
        expect(shouldIngestCatalogBpp({
            bppId: 'seller.bpp',
            sellerNp: { enabled: 1 },
            tableWasEmpty: false,
        })).toBe(true);
    });

    it('lists enabled NPs first, then the rest by most recently seen, by default', async () => {
        await findAllOndcSellerNps();

        const { order } = ondcSellerNps.findAndCountAll.mock.calls[0][0];
        expect(order[0]).toEqual(['enabled', 'DESC']);
        expect(order[1][1]).toBe('ASC');
        expect(order.slice(2)).toEqual([['lastSeenAt', 'DESC'], ['id', 'DESC']]);
    });
});
