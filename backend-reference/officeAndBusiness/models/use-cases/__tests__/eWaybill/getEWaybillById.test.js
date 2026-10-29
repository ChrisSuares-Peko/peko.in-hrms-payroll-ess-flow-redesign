const { getEWaybillById } = require('../../eWaybill');
const eWaybill = require('../../../entities/eWaybill');

jest.mock('../../../entities/eWaybill');

describe('getEWaybillById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the e-waybill matching the given id', async () => {
        const mockRecord = { id: 3, ewbNo: 9876543210, status: 'ACTIVE' };

        eWaybill.findOne.mockResolvedValue(mockRecord);

        const result = await getEWaybillById(3);

        expect(eWaybill.findOne).toHaveBeenCalledWith({ where: { id: 3 } });
        expect(result).toEqual(mockRecord);
    });

    it('should return null if no record found', async () => {
        eWaybill.findOne.mockResolvedValue(null);

        const result = await getEWaybillById(999);

        expect(result).toBeNull();
    });

    it('should throw if findOne fails', async () => {
        eWaybill.findOne.mockRejectedValue(new Error('DB error'));

        await expect(getEWaybillById(1)).rejects.toThrow('DB error');
    });
});
