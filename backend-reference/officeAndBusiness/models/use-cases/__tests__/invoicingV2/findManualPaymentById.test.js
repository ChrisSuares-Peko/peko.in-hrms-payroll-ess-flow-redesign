const { findManualPaymentById } = require('../../invoicingV2');
const manualPayment = require('../../../entities/manualPayment');

jest.mock('../../../entities/manualPayment');

describe('findManualPaymentById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call manualPayment.findOne with correct args and return the found record', async () => {
    const mockRecord = { id: 5, invoiceId: 1, amount: 200 };
    manualPayment.findOne.mockResolvedValue(mockRecord);

    const result = await findManualPaymentById({ id: 5, invoiceId: 1 });

    expect(manualPayment.findOne).toHaveBeenCalledWith({
      where: { id: 5, invoiceId: 1 },
      raw: true,
    });
    expect(result).toEqual(mockRecord);
  });

  it('should return null when findOne returns null', async () => {
    manualPayment.findOne.mockResolvedValue(null);

    const result = await findManualPaymentById({ id: 99, invoiceId: 1 });

    expect(manualPayment.findOne).toHaveBeenCalledWith({
      where: { id: 99, invoiceId: 1 },
      raw: true,
    });
    expect(result).toBeNull();
  });

  it('should throw when findOne rejects with a DB error', async () => {
    const dbError = new Error('Database connection failed');
    manualPayment.findOne.mockRejectedValue(dbError);

    await expect(findManualPaymentById({ id: 5, invoiceId: 1 })).rejects.toThrow(
      'Database connection failed'
    );
  });
});
