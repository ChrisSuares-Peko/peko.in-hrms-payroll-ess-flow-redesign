const billerMDM = require('../../../entities/billerMDM');
const { upsertBillers } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    upsert: jest.fn(),
}));

describe('upsertBillers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should upsert each biller with billerId and the full biller object as data', async () => {
        billerMDM.upsert.mockResolvedValue([{}, true]);
        const billers = [
            { billerId: 'B001', billerName: 'Electricity' },
            { billerId: 'B002', billerName: 'Water' },
        ];
        await upsertBillers(billers);
        expect(billerMDM.upsert).toHaveBeenCalledTimes(2);
        expect(billerMDM.upsert).toHaveBeenCalledWith({
            billerId: 'B001',
            data: { billerId: 'B001', billerName: 'Electricity' },
        });
        expect(billerMDM.upsert).toHaveBeenCalledWith({
            billerId: 'B002',
            data: { billerId: 'B002', billerName: 'Water' },
        });
    });

    it('should not call upsert when given an empty array', async () => {
        await upsertBillers([]);
        expect(billerMDM.upsert).not.toHaveBeenCalled();
    });

    it('should throw if upsert rejects', async () => {
        billerMDM.upsert.mockRejectedValue(new Error('DB error'));
        await expect(upsertBillers([{ billerId: 'B001' }])).rejects.toThrow('DB error');
    });
});
