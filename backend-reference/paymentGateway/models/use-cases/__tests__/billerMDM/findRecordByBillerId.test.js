const billerMDM = require('../../../entities/billerMDM');
const { findRecordByBillerId } = require('../../billerMDM');

jest.mock('../../../entities/billerMDM', () => ({
    findOne: jest.fn(),
}));

describe('findRecordByBillerId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the full biller record including all fields', async () => {
        const record = { id: 1, billerId: 'B001', billerCategory: 'Electricity', status: 'active', data: {} };
        billerMDM.findOne.mockResolvedValue(record);
        const result = await findRecordByBillerId('B001');
        expect(result).toEqual(record);
        expect(billerMDM.findOne).toHaveBeenCalledWith({ where: { billerId: 'B001' } });
    });

    it('should return null when no record exists', async () => {
        billerMDM.findOne.mockResolvedValue(null);
        const result = await findRecordByBillerId('UNKNOWN');
        expect(result).toBeNull();
    });

    it('should throw on DB error', async () => {
        billerMDM.findOne.mockRejectedValue(new Error('DB error'));
        await expect(findRecordByBillerId('B001')).rejects.toThrow('DB error');
    });
});
