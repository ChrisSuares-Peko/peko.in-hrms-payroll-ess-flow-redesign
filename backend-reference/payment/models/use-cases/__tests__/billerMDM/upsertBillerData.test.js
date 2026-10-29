const billerMDM = require('../../../entities/billerMDM');
const { upsertBillerData } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    upsert: jest.fn(),
}));

describe('upsertBillerData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should upsert with only billerId and data when no meta fields present', async () => {
        billerMDM.upsert.mockResolvedValue([{}, false]);
        await upsertBillerData('B001', { someField: 'value' });
        expect(billerMDM.upsert).toHaveBeenCalledWith({ billerId: 'B001', data: { someField: 'value' } });
    });

    it('should sync billerName from data when provided', async () => {
        billerMDM.upsert.mockResolvedValue([{}, false]);
        await upsertBillerData('B001', { billerName: 'Electricity Co' });
        expect(billerMDM.upsert).toHaveBeenCalledWith(expect.objectContaining({ billerName: 'Electricity Co' }));
    });

    it('should sync billerCategory and billerCoverage from data', async () => {
        billerMDM.upsert.mockResolvedValue([{}, false]);
        await upsertBillerData('B001', { billerCategory: 'Electricity', billerCoverage: 'National' });
        expect(billerMDM.upsert).toHaveBeenCalledWith(expect.objectContaining({
            billerCategory: 'Electricity',
            billerCoverage: 'National',
        }));
    });

    it('should not include meta fields when they are null in data', async () => {
        billerMDM.upsert.mockResolvedValue([{}, false]);
        await upsertBillerData('B001', { billerName: null, billerCategory: null });
        const callArg = billerMDM.upsert.mock.calls[0][0];
        expect(callArg).not.toHaveProperty('billerName');
        expect(callArg).not.toHaveProperty('billerCategory');
    });

    it('should sync all three meta fields together', async () => {
        billerMDM.upsert.mockResolvedValue([{}, false]);
        await upsertBillerData('B002', {
            billerName: 'Gas Corp',
            billerCategory: 'Gas',
            billerCoverage: 'South',
        });
        expect(billerMDM.upsert).toHaveBeenCalledWith({
            billerId: 'B002',
            data: { billerName: 'Gas Corp', billerCategory: 'Gas', billerCoverage: 'South' },
            billerName: 'Gas Corp',
            billerCategory: 'Gas',
            billerCoverage: 'South',
        });
    });

    it('should throw if upsert rejects', async () => {
        billerMDM.upsert.mockRejectedValue(new Error('DB error'));
        await expect(upsertBillerData('B001', {})).rejects.toThrow('DB error');
    });
});
