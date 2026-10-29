const billerMDM = require('../../../entities/billerMDM');
const { getLastUpdated } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findOne: jest.fn(),
}));

describe('getLastUpdated', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return updatedAt of the most recently updated record', async () => {
        const ts = new Date('2024-06-01T12:00:00Z');
        billerMDM.findOne.mockResolvedValue({ updatedAt: ts });
        const result = await getLastUpdated();
        expect(result).toEqual(ts);
        expect(billerMDM.findOne).toHaveBeenCalledWith({
            attributes: ['updatedAt'],
            order: [['updatedAt', 'DESC']],
        });
    });

    it('should return null when no records exist', async () => {
        billerMDM.findOne.mockResolvedValue(null);
        const result = await getLastUpdated();
        expect(result).toBeNull();
    });

    it('should throw on DB error', async () => {
        billerMDM.findOne.mockRejectedValue(new Error('DB error'));
        await expect(getLastUpdated()).rejects.toThrow('DB error');
    });
});
