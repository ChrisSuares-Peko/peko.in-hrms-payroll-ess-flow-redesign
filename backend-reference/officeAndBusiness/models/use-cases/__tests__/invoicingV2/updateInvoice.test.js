const { updateInvoice } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');

jest.mock('../../../entities/invoicingV2');

describe('updateInvoice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find the document and update it', async () => {
    const where = { id: 1 };
    const data = { status: 'PAID' };

    const mockDoc = {
      id: 1,
      status: 'PENDING',
      update: jest.fn().mockResolvedValue({ id: 1, status: 'PAID' }),
    };

    invoicingV2.findOne.mockResolvedValue(mockDoc);

    const result = await updateInvoice(where, data);

    expect(invoicingV2.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockDoc.update).toHaveBeenCalledWith({ status: 'PAID' });
    expect(result).toEqual({ id: 1, status: 'PAID' });
  });

  it('should return null when document is not found', async () => {
    const where = { id: 9999 };
    const data = { status: 'PAID' };

    invoicingV2.findOne.mockResolvedValue(null);

    const result = await updateInvoice(where, data);

    expect(invoicingV2.findOne).toHaveBeenCalledWith({ where: { id: 9999 } });
    expect(result).toBeNull();
  });

  it('should throw an error if database query fails', async () => {
    const where = { id: 1 };
    const data = { status: 'PAID' };

    const expectedError = new Error('Database error');

    invoicingV2.findOne.mockRejectedValue(expectedError);

    await expect(updateInvoice(where, data)).rejects.toThrow('Database error');
    expect(invoicingV2.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
