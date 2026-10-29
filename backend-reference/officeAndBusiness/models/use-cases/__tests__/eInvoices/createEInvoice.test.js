const { createEInvoice } = require('../../eInvoices');
const eInvoice = require('../../../entities/eInvoices');

jest.mock('../../../entities/eInvoices');

describe('createEInvoice', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create and return the e-invoice record', async () => {
        const params = { corporateUserId: 1, irn: 'irn-abc-123', ackNo: '111', status: 'ACTIVE' };
        const mockCreated = { id: 1, ...params };

        eInvoice.create.mockResolvedValue(mockCreated);

        const result = await createEInvoice(params);

        expect(eInvoice.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockCreated);
    });

    it('should throw if create fails', async () => {
        eInvoice.create.mockRejectedValue(new Error('DB error'));

        await expect(createEInvoice({})).rejects.toThrow('DB error');
    });
});
