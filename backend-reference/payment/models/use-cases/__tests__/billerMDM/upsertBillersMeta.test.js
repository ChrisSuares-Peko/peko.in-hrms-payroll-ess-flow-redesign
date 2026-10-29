const billerMDM = require('../../../entities/billerMDM');
const { upsertBillersMeta } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    upsert: jest.fn(),
}));

describe('upsertBillersMeta', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should upsert all billers with provided meta fields', async () => {
        billerMDM.upsert.mockResolvedValue([{}, true]);
        const billers = [
            { billerId: 'B001', billerName: 'Electricity Co', billerCategory: 'Electricity', billerCoverage: 'Urban', status: 'active' },
            { billerId: 'B002', billerName: 'Water Board', billerCategory: 'Water', billerCoverage: 'National', status: 'active' },
        ];
        await upsertBillersMeta(billers);
        expect(billerMDM.upsert).toHaveBeenCalledTimes(2);
        expect(billerMDM.upsert).toHaveBeenCalledWith({
            billerId: 'B001',
            billerName: 'Electricity Co',
            billerCategory: 'Electricity',
            billerCoverage: 'Urban',
            status: 'active',
        });
    });

    it('should coerce falsy billerName/billerCategory/billerCoverage to null', async () => {
        billerMDM.upsert.mockResolvedValue([{}, true]);
        await upsertBillersMeta([{ billerId: 'B003', billerName: '', billerCategory: null, billerCoverage: undefined }]);
        expect(billerMDM.upsert).toHaveBeenCalledWith({
            billerId: 'B003',
            billerName: null,
            billerCategory: null,
            billerCoverage: null,
            status: 'active',
        });
    });

    it('should default status to active when not provided', async () => {
        billerMDM.upsert.mockResolvedValue([{}, true]);
        await upsertBillersMeta([{ billerId: 'B004' }]);
        expect(billerMDM.upsert).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });

    it('should not call upsert when given an empty array', async () => {
        await upsertBillersMeta([]);
        expect(billerMDM.upsert).not.toHaveBeenCalled();
    });

    it('should throw if upsert rejects', async () => {
        billerMDM.upsert.mockRejectedValue(new Error('DB error'));
        await expect(upsertBillersMeta([{ billerId: 'B005' }])).rejects.toThrow('DB error');
    });
});
