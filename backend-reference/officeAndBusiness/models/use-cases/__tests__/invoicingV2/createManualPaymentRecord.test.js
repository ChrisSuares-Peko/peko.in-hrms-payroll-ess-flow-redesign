const { createManualPaymentRecord } = require('../../invoicingV2');
const manualPayment = require('../../../entities/manualPayment');

jest.mock('../../../entities/manualPayment');

describe('createManualPaymentRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a manual payment record with all fields', async () => {
    const params = {
      invoiceId: 1,
      corporateUserId: 10,
      amount: 5000,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: '2024-03-01',
      referenceId: 'REF-001',
      notes: 'Payment for March invoice',
    };

    const mockPaymentData = {
      id: 1,
      ...params,
      createdAt: '2024-03-01T10:00:00.000Z',
      updatedAt: '2024-03-01T10:00:00.000Z',
    };

    manualPayment.create.mockResolvedValue(mockPaymentData);

    const result = await createManualPaymentRecord(params);

    expect(manualPayment.create).toHaveBeenCalledWith({
      invoiceId: 1,
      corporateUserId: 10,
      amount: 5000,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: '2024-03-01',
      referenceId: 'REF-001',
      notes: 'Payment for March invoice',
    });
    expect(result).toEqual(mockPaymentData);
  });

  it('should set referenceId and notes to null when not provided', async () => {
    const params = {
      invoiceId: 1,
      corporateUserId: 10,
      amount: 3000,
      paymentMethod: 'CASH',
      paymentDate: '2024-03-15',
    };

    const mockPaymentData = {
      id: 2,
      ...params,
      referenceId: null,
      notes: null,
      createdAt: '2024-03-15T10:00:00.000Z',
      updatedAt: '2024-03-15T10:00:00.000Z',
    };

    manualPayment.create.mockResolvedValue(mockPaymentData);

    const result = await createManualPaymentRecord(params);

    expect(manualPayment.create).toHaveBeenCalledWith({
      invoiceId: 1,
      corporateUserId: 10,
      amount: 3000,
      paymentMethod: 'CASH',
      paymentDate: '2024-03-15',
      referenceId: null,
      notes: null,
    });
    expect(result).toEqual(mockPaymentData);
  });

  it('should throw an error if payment creation fails', async () => {
    const params = {
      invoiceId: 1,
      corporateUserId: 10,
      amount: 5000,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: '2024-03-01',
    };

    const expectedError = new Error('Database error');

    manualPayment.create.mockRejectedValue(expectedError);

    await expect(createManualPaymentRecord(params)).rejects.toThrow('Database error');
    expect(manualPayment.create).toHaveBeenCalledWith({
      invoiceId: 1,
      corporateUserId: 10,
      amount: 5000,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: '2024-03-01',
      referenceId: null,
      notes: null,
    });
  });
});
