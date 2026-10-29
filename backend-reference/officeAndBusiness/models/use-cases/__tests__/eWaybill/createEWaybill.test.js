const { createEWaybill } = require('../../eWaybill');
const eWaybill = require('../../../entities/eWaybill');

jest.mock('../../../entities/eWaybill');

describe('createEWaybill', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create and return the e-waybill record', async () => {
        const params = { corporateUserId: 1, ewbNo: 9876543210, irn: 'irn-abc-123', status: 'ACTIVE' };
        const mockCreated = { id: 1, ...params };

        eWaybill.create.mockResolvedValue(mockCreated);

        const result = await createEWaybill(params);

        expect(eWaybill.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockCreated);
    });

    it('should throw if create fails', async () => {
        eWaybill.create.mockRejectedValue(new Error('DB error'));

        await expect(createEWaybill({})).rejects.toThrow('DB error');
    });
});
