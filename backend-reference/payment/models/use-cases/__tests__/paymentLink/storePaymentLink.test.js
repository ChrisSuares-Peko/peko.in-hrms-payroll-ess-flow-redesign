const paymentLinks = require('../../../entities/paymentLink');
const { customLog } = require('../../../../utils/loggerHelper');
const { storePaymentLink } = require('../../paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
  create: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

const params = {
  amount: 100,
  paymentLink: 'https://pay.example.com/REF',
  status: 'PENDING',
  reference_id: 'REF-001',
  decentro_txn_id: 'DTX-001',
  expireDate: '2025-01-01',
  corporateUser: 'user-1',
  customerPhone: '9999999999',
  customerName: 'Alice',
  purpose_message: 'Demo',
  invoiceId: null,
  accessKey: 'payment_link',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('storePaymentLink', () => {
  it('creates and returns the new payment link', async () => {
    const mockRecord = { id: 1, ...params, credentialId: 'user-1' };
    paymentLinks.create.mockResolvedValue(mockRecord);

    const result = await storePaymentLink(params);

    expect(paymentLinks.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockRecord);
  });

  it('passes expireDate as a Date object when provided', async () => {
    paymentLinks.create.mockResolvedValue({ id: 1 });

    await storePaymentLink(params);

    const createArg = paymentLinks.create.mock.calls[0][0];
    expect(createArg.expireDate).toBeInstanceOf(Date);
  });

  it('sets expireDate to null when not provided', async () => {
    paymentLinks.create.mockResolvedValue({ id: 2 });

    await storePaymentLink({ ...params, expireDate: null });

    const createArg = paymentLinks.create.mock.calls[0][0];
    expect(createArg.expireDate).toBeNull();
  });

  it('maps corporateUser to credentialId in create call', async () => {
    paymentLinks.create.mockResolvedValue({ id: 1 });

    await storePaymentLink({ ...params, corporateUser: 'corp-42' });

    const createArg = paymentLinks.create.mock.calls[0][0];
    expect(createArg.credentialId).toBe('corp-42');
  });

  it('throws and logs when db create fails', async () => {
    paymentLinks.create.mockRejectedValue(new Error('DB error'));

    await expect(storePaymentLink(params)).rejects.toThrow('DB error');
    expect(customLog).toHaveBeenCalled();
  });
});
