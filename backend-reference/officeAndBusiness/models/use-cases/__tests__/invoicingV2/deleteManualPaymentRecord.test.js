const { deleteManualPaymentRecord } = require('../../invoicingV2');
const manualPayment = require('../../../entities/manualPayment');

jest.mock('../../../entities/manualPayment');

describe('deleteManualPaymentRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call manualPayment.update with correct args and return [1] on success', async () => {
    manualPayment.update.mockResolvedValue([1]);

    const result = await deleteManualPaymentRecord({ id: 5, invoiceId: 1 });

    expect(manualPayment.update).toHaveBeenCalledWith(
      { isDeleted: true },
      { where: { id: 5, invoiceId: 1, isDeleted: false } }
    );
    expect(result).toEqual([1]);
  });

  it('should return [0] when no matching record is found', async () => {
    manualPayment.update.mockResolvedValue([0]);

    const result = await deleteManualPaymentRecord({ id: 99, invoiceId: 1 });

    expect(manualPayment.update).toHaveBeenCalledWith(
      { isDeleted: true },
      { where: { id: 99, invoiceId: 1, isDeleted: false } }
    );
    expect(result).toEqual([0]);
  });

  it('should throw when update rejects with a DB error', async () => {
    const dbError = new Error('Database update failed');
    manualPayment.update.mockRejectedValue(dbError);

    await expect(deleteManualPaymentRecord({ id: 5, invoiceId: 1 })).rejects.toThrow(
      'Database update failed'
    );
  });
});
