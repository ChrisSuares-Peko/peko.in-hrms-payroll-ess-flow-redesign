const billerMDM = require('../../../entities/billerMDM');
const { upsertBillerData } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    upsert: jest.fn(),
}));

describe('upsertBillerData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should upsert with only billerId and data when no meta fields in data', async () => {
        billerMDM.upsert.mockResolvedValue([{}, false]);
        await upsertBillerData('B001', { someField: 'value' });
        expect(billerMDM.upsert).toHaveBeenCalledWith({ billerId: 'B001', data: { someField: 'value' } });
    });

    it('should sync billerName from data when present', async () => {
        billerMDM.upsert.mockResolvedValue([{}, false]);
        await upsertBillerData('B001', { billerName: 'Electricity Co' });
        expect(billerMDM.upsert).toHaveBeenCalledWith(expect.objectContaining({ billerName: 'Electricity Co' }));
    });

    it('should sync billerCategory and billerCoverage from data', async () => {
        billerMDM.upsert.mockResolvedValue([{}, false]);
        await upsertBillerData('B001', { billerCategory: 'Gas', billerCoverage: 'National' });
        expect(billerMDM.upsert).toHaveBeenCalledWith(expect.objectContaining({
            billerCategory: 'Gas',
            billerCoverage: 'National',
        }));
    });

    it('should not add meta field when it is null in data', async () => {
        billerMDM.upsert.mockResolvedValue([{}, false]);
        await upsertBillerData('B001', { billerName: null });
        const callArg = billerMDM.upsert.mock.calls[0][0];
        expect(callArg).not.toHaveProperty('billerName');
    });

    it('should throw on DB error', async () => {
        billerMDM.upsert.mockRejectedValue(new Error('DB error'));
        await expect(upsertBillerData('B001', {})).rejects.toThrow('DB error');
    });
});
