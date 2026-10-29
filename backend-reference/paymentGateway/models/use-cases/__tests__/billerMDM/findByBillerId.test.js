const billerMDM = require('../../../entities/billerMDM');
const { findByBillerId } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findOne: jest.fn(),
}));

describe('findByBillerId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the data field of the found record', async () => {
        const data = { billerName: 'Electricity', interchangeFeeCCF1: {} };
        billerMDM.findOne.mockResolvedValue({ billerId: 'B001', data });
        const result = await findByBillerId('B001');
        expect(result).toEqual(data);
        expect(billerMDM.findOne).toHaveBeenCalledWith({ where: { billerId: 'B001' } });
    });

    it('should return null when no record is found', async () => {
        billerMDM.findOne.mockResolvedValue(null);
        const result = await findByBillerId('UNKNOWN');
        expect(result).toBeNull();
    });

    it('should throw on DB error', async () => {
        billerMDM.findOne.mockRejectedValue(new Error('DB error'));
        await expect(findByBillerId('B001')).rejects.toThrow('DB error');
    });
});
