const billerMDM = require('../../../entities/billerMDM');
const { countByStatus } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    count: jest.fn(),
}));

describe('countByStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return count of active billers', async () => {
        billerMDM.count.mockResolvedValue(30);
        const result = await countByStatus('active');
        expect(result).toBe(30);
        expect(billerMDM.count).toHaveBeenCalledWith({ where: { status: 'active' } });
    });

    it('should return count of disabled billers', async () => {
        billerMDM.count.mockResolvedValue(5);
        const result = await countByStatus('disabled');
        expect(result).toBe(5);
        expect(billerMDM.count).toHaveBeenCalledWith({ where: { status: 'disabled' } });
    });

    it('should return 0 when no billers match', async () => {
        billerMDM.count.mockResolvedValue(0);
        const result = await countByStatus('active');
        expect(result).toBe(0);
    });

    it('should throw on DB error', async () => {
        billerMDM.count.mockRejectedValue(new Error('DB error'));
        await expect(countByStatus('active')).rejects.toThrow('DB error');
    });
});
