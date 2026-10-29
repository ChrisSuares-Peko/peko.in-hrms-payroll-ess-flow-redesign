const { getNextInvoiceNumber } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');

jest.mock('../../../entities/invoicingV2');

describe('getNextInvoiceNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return max + 1 when invoices exist', async () => {
    invoicingV2.findOne.mockResolvedValue({ maxNumber: '42' });

    const result = await getNextInvoiceNumber(10);

    expect(invoicingV2.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { corporateUserId: 10 },
        raw: true,
      })
    );
    expect(result).toBe(43);
  });

  it('should return 1 when no invoices exist (maxNumber is null)', async () => {
    invoicingV2.findOne.mockResolvedValue({ maxNumber: null });

    const result = await getNextInvoiceNumber(10);

    expect(result).toBe(1);
  });

  it('should return 1 when findOne returns null', async () => {
    invoicingV2.findOne.mockResolvedValue(null);

    const result = await getNextInvoiceNumber(10);

    expect(result).toBe(1);
  });

  it('should throw an error if database query fails', async () => {
    const expectedError = new Error('Database error');

    invoicingV2.findOne.mockRejectedValue(expectedError);

    await expect(getNextInvoiceNumber(10)).rejects.toThrow('Database error');
  });
});
