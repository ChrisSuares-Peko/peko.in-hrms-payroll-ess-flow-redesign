const paymentQrs = require('../../../entities/paymentQr');
const { customLog } = require('../../../../utils/loggerHelper');
const { addPaymentQr } = require('../../paymentQr');

jest.mock('../../../entities/paymentQr', () => ({
  create: jest.fn(),
}));

jest.mock('../../../../services/paymentLinks', () => ({
  getTransactionStatus: jest.fn(),
}));

jest.mock('../../paymentCollectionTransaction', () => ({
  upsertUnifiedTransactionStatus: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

const params = {
  corporateUser: 'user-1',
  amount: 300,
  purpose_message: 'QR payment',
  reference_id: 'QR-REF-001',
  decentro_txn_id: 'QR-DTX-001',
  status: 'pending',
  dynamic_qr_image: 'https://qr.example.com/img.png',
  expireDate: '2025-06-01',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('addPaymentQr', () => {
  it('creates a QR record and returns it', async () => {
    const mockQr = { id: 1, ...params };
    paymentQrs.create.mockResolvedValue(mockQr);

    const result = await addPaymentQr(params);

    expect(paymentQrs.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockQr);
  });

  it('maps corporateUser to credentialId in the create call', async () => {
    paymentQrs.create.mockResolvedValue({ id: 1 });

    await addPaymentQr({ ...params, corporateUser: 'corp-42' });

    const createArg = paymentQrs.create.mock.calls[0][0];
    expect(createArg.credentialId).toBe('corp-42');
  });

  it('normalizes status to uppercase', async () => {
    paymentQrs.create.mockResolvedValue({ id: 1 });

    await addPaymentQr({ ...params, status: 'pending' });

    const createArg = paymentQrs.create.mock.calls[0][0];
    expect(createArg.status).toBe('PENDING');
  });

  it('defaults status to PENDING when not provided', async () => {
    paymentQrs.create.mockResolvedValue({ id: 1 });

    await addPaymentQr({ ...params, status: undefined });

    const createArg = paymentQrs.create.mock.calls[0][0];
    expect(createArg.status).toBe('PENDING');
  });

  it('converts expireDate string to a Date object', async () => {
    paymentQrs.create.mockResolvedValue({ id: 1 });

    await addPaymentQr(params);

    const createArg = paymentQrs.create.mock.calls[0][0];
    expect(createArg.expireDate).toBeInstanceOf(Date);
  });

  it('sets expireDate to null when not provided', async () => {
    paymentQrs.create.mockResolvedValue({ id: 2 });

    await addPaymentQr({ ...params, expireDate: null });

    const createArg = paymentQrs.create.mock.calls[0][0];
    expect(createArg.expireDate).toBeNull();
  });

  it('throws and logs on db error', async () => {
    paymentQrs.create.mockRejectedValue(new Error('Create failed'));

    await expect(addPaymentQr(params)).rejects.toThrow('Create failed');
    expect(customLog).toHaveBeenCalled();
  });
});
