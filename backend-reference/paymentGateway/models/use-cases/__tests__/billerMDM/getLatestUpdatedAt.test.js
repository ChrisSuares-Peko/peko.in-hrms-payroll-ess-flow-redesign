const billerMDM = require('../../../entities/billerMDM');
const { getLatestUpdatedAt } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findOne: jest.fn(),
}));

describe('getLatestUpdatedAt', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return updatedAt of the most recently updated record', async () => {
        const ts = new Date('2024-06-01T10:00:00Z');
        billerMDM.findOne.mockResolvedValue({ updatedAt: ts });
        const result = await getLatestUpdatedAt();
        expect(result).toEqual(ts);
        expect(billerMDM.findOne).toHaveBeenCalledWith({
            order: [['updatedAt', 'DESC']],
        });
    });

    it('should return null when no records exist', async () => {
        billerMDM.findOne.mockResolvedValue(null);
        const result = await getLatestUpdatedAt();
        expect(result).toBeNull();
    });

    it('should throw on DB error', async () => {
        billerMDM.findOne.mockRejectedValue(new Error('DB error'));
        await expect(getLatestUpdatedAt()).rejects.toThrow('DB error');
    });
});
