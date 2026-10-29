const { Op } = require('sequelize');
const billerMDM = require('../../../entities/billerMDM');
const { findPaginated } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findAndCountAll: jest.fn(),
}));

const mockResult = { count: 0, rows: [] };

describe('findPaginated', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        billerMDM.findAndCountAll.mockResolvedValue(mockResult);
    });

    it('should use defaults: page 1, pageSize 10, sorted by billerId ASC, no filters', async () => {
        await findPaginated({});
        expect(billerMDM.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                limit: 10,
                offset: 0,
                order: [['billerId', 'ASC']],
                where: {},
            })
        );
    });

    it('should apply status filter', async () => {
        await findPaginated({ status: 'active' });
        const [call] = billerMDM.findAndCountAll.mock.calls;
        expect(call[0].where[Op.and]).toEqual(expect.arrayContaining([{ status: 'active' }]));
    });

    it('should apply category filter', async () => {
        await findPaginated({ category: 'Electricity' });
        const [call] = billerMDM.findAndCountAll.mock.calls;
        expect(call[0].where[Op.and]).toEqual(expect.arrayContaining([{ billerCategory: 'Electricity' }]));
    });

    it('should apply Op.or search across 4 fields', async () => {
        await findPaginated({ search: 'electricity' });
        const [call] = billerMDM.findAndCountAll.mock.calls;
        const searchCondition = call[0].where[Op.and].find(c => c[Op.or]);
        expect(searchCondition[Op.or]).toHaveLength(4);
        expect(searchCondition[Op.or]).toEqual(expect.arrayContaining([
            { billerId: { [Op.like]: '%electricity%' } },
            { billerName: { [Op.like]: '%electricity%' } },
            { billerCategory: { [Op.like]: '%electricity%' } },
            { billerCoverage: { [Op.like]: '%electricity%' } },
        ]));
    });

    it('should trim search string', async () => {
        await findPaginated({ search: '  gas  ' });
        const [call] = billerMDM.findAndCountAll.mock.calls;
        const searchCondition = call[0].where[Op.and].find(c => c[Op.or]);
        expect(searchCondition[Op.or][0]).toEqual({ billerId: { [Op.like]: '%gas%' } });
    });

    it('should add literal condition when hasMDMData is "true"', async () => {
        await findPaginated({ hasMDMData: 'true' });
        const [call] = billerMDM.findAndCountAll.mock.calls;
        const literalCond = call[0].where[Op.and].find(c => c && c.val);
        expect(literalCond.val).toBe('JSON_LENGTH(data) > 0');
    });

    it('should add literal condition when hasMDMData is "false"', async () => {
        await findPaginated({ hasMDMData: 'false' });
        const [call] = billerMDM.findAndCountAll.mock.calls;
        const literalCond = call[0].where[Op.and].find(c => c && c.val);
        expect(literalCond.val).toBe('JSON_LENGTH(data) = 0');
    });

    it('should map known sortField to DB column', async () => {
        await findPaginated({ sortField: 'mdmUpdatedAt', sortOrder: 'DESC' });
        expect(billerMDM.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({ order: [['updatedAt', 'DESC']] })
        );
    });

    it('should default to billerId sort for unknown sortField', async () => {
        await findPaginated({ sortField: 'unknownField' });
        expect(billerMDM.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({ order: [['billerId', 'ASC']] })
        );
    });

    it('should cap pageSize at 500', async () => {
        await findPaginated({ pageSize: 1000 });
        expect(billerMDM.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 500 })
        );
    });

    it('should compute offset from page and pageSize', async () => {
        await findPaginated({ page: 3, pageSize: 20 });
        expect(billerMDM.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({ offset: 40 })
        );
    });

    it('should return the findAndCountAll result', async () => {
        const data = { count: 5, rows: [{ billerId: 'B001' }] };
        billerMDM.findAndCountAll.mockResolvedValue(data);
        const result = await findPaginated({});
        expect(result).toEqual(data);
    });

    it('should throw on DB error', async () => {
        billerMDM.findAndCountAll.mockRejectedValue(new Error('DB error'));
        await expect(findPaginated({})).rejects.toThrow('DB error');
    });
});
