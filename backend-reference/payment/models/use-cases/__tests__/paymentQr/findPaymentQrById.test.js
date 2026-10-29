const paymentQrs = require('../../../entities/paymentQr');
const { findPaymentQrById } = require('../../paymentQr');

jest.mock('../../../entities/paymentQr', () => ({
  findOne: jest.fn(),
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

const makeMockQr = (overrides = {}) => ({
  id: 1,
  credentialId: 'user-1',
  reference_id: 'QR-REF-001',
  status: 'PENDING',
  amount: 300,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findPaymentQrById', () => {
  it('returns the QR record when found', async () => {
    const qr = makeMockQr();
    paymentQrs.findOne.mockResolvedValue(qr);

    const result = await findPaymentQrById({ id: 1, corporateUser: 'user-1' });

    expect(paymentQrs.findOne).toHaveBeenCalledWith({
      where: { id: 1, credentialId: 'user-1' },
    });
    expect(result).toEqual(qr);
  });

  it('returns null when QR is not found', async () => {
    paymentQrs.findOne.mockResolvedValue(null);

    const result = await findPaymentQrById({ id: 999, corporateUser: 'user-1' });

    expect(result).toBeNull();
  });

  it('uses both id and credentialId in the where clause', async () => {
    paymentQrs.findOne.mockResolvedValue(null);

    await findPaymentQrById({ id: 42, corporateUser: 'corp-99' });

    expect(paymentQrs.findOne).toHaveBeenCalledWith({
      where: { id: 42, credentialId: 'corp-99' },
    });
  });

  it('throws and logs on db error', async () => {
    paymentQrs.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findPaymentQrById({ id: 1, corporateUser: 'user-1' })).rejects.toThrow('DB error');
  });
});
