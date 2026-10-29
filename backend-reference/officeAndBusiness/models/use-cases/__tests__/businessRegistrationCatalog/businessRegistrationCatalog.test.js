const catalog = require('../../../use-cases/businessRegistrationCatalog');
const entity = require('../../../entities/businessRegistrationCatalog');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/businessRegistrationCatalog', () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['sortOrder', 'ASC']]),
}));

describe('businessRegistrationCatalog use-cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('creates a catalog row with the given params', async () => {
            entity.create.mockResolvedValue({ id: 1 });
            const result = await catalog.create({ serviceName: 'Proprietorship', serviceId: 6 });
            expect(entity.create).toHaveBeenCalledWith({ serviceName: 'Proprietorship', serviceId: 6 });
            expect(result).toEqual({ id: 1 });
        });
    });

    describe('findByVendorKey', () => {
        it('looks up by vendorCatalogId', async () => {
            entity.findOne.mockResolvedValue({ id: 1 });
            await catalog.findByVendorKey('V-9');
            expect(entity.findOne).toHaveBeenCalledWith({ where: { vendorCatalogId: 'V-9' } });
        });
    });

    describe('findByNameKey', () => {
        it('looks up by serviceName + variantName, defaulting missing values to null', async () => {
            entity.findOne.mockResolvedValue(null);
            await catalog.findByNameKey('Proprietorship', undefined);
            expect(entity.findOne).toHaveBeenCalledWith({
                where: { serviceName: 'Proprietorship', variantName: null },
            });
        });
    });

    describe('findAllRaw', () => {
        it('fetches all rows as plain objects', async () => {
            entity.findAll.mockResolvedValue([]);
            await catalog.findAllRaw();
            expect(entity.findAll).toHaveBeenCalledWith({ raw: true });
        });
    });

    describe('destroyById', () => {
        it('destroys the row with the given id', async () => {
            entity.destroy.mockResolvedValue(1);
            const result = await catalog.destroyById(5);
            expect(entity.destroy).toHaveBeenCalledWith({ where: { id: 5 } });
            expect(result).toBe(1);
        });
    });

    describe('findAllAndCount', () => {
        it('builds a search OR clause and passes the order from handleSortFields', async () => {
            entity.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
            await catalog.findAllAndCount({ limit: 10, offset: 0, searchText: 'prop' });

            expect(handleSortFields).toHaveBeenCalledWith('sortOrder', 'ASC');
            const arg = entity.findAndCountAll.mock.calls[0][0];
            expect(arg.order).toEqual([['sortOrder', 'ASC']]);
            expect(arg.raw).toBe(true);
            expect(arg.nest).toBe(true);
            // the searchText adds an Op.or symbol key to the where clause
            expect(Object.getOwnPropertySymbols(arg.where).length).toBeGreaterThan(0);
        });

        it('uses an empty where when no searchText is given', async () => {
            entity.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
            await catalog.findAllAndCount({ limit: 10, offset: 0 });
            expect(entity.findAndCountAll.mock.calls[0][0].where).toEqual({});
        });
    });

    describe('update', () => {
        it('updates the row with the given id', async () => {
            entity.update.mockResolvedValue([1]);
            const result = await catalog.update(3, { status: false });
            expect(entity.update).toHaveBeenCalledWith({ status: false }, { where: { id: 3 } });
            expect(result).toEqual([1]);
        });
    });

    describe('getActiveCatalog', () => {
        it('fetches only active rows ordered by sortOrder', async () => {
            entity.findAll.mockResolvedValue([]);
            await catalog.getActiveCatalog();
            expect(entity.findAll).toHaveBeenCalledWith({
                where: { status: true },
                order: [['sortOrder', 'ASC']],
                raw: true,
            });
        });

        it('adds a numeric serviceId filter when provided', async () => {
            entity.findAll.mockResolvedValue([]);
            await catalog.getActiveCatalog({ serviceId: '6' });
            expect(entity.findAll.mock.calls[0][0].where).toEqual({ status: true, serviceId: 6 });
        });

        it('ignores an empty serviceId', async () => {
            entity.findAll.mockResolvedValue([]);
            await catalog.getActiveCatalog({ serviceId: '' });
            expect(entity.findAll.mock.calls[0][0].where).toEqual({ status: true });
        });
    });

    describe('getCatalogRows', () => {
        it('fetches all rows (including inactive) ordered by sortOrder', async () => {
            entity.findAll.mockResolvedValue([]);
            await catalog.getCatalogRows();
            expect(entity.findAll).toHaveBeenCalledWith({ order: [['sortOrder', 'ASC']], raw: true });
        });
    });
});
