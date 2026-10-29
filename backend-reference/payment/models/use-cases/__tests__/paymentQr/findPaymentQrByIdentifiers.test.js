const paymentQrs = require('../../../entities/paymentQr');
const { findPaymentQrByIdentifiers } = require('../../paymentQr');

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
  reference_id: 'QR-REF-001',
  decentro_txn_id: 'QR-DTX-001',
  status: 'PENDING',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findPaymentQrByIdentifiers', () => {
  it('finds by reference_id when provided', async () => {
    const qr = makeMockQr();
    paymentQrs.findOne.mockResolvedValue(qr);

    const result = await findPaymentQrByIdentifiers({ reference_id: 'QR-REF-001' });

    expect(paymentQrs.findOne).toHaveBeenCalledWith({ where: { reference_id: 'QR-REF-001' } });
    expect(result).toEqual(qr);
  });

  it('finds by decentro_txn_id when reference_id is null', async () => {
    const qr = makeMockQr();
    paymentQrs.findOne.mockResolvedValue(qr);

    const result = await findPaymentQrByIdentifiers({ decentro_txn_id: 'QR-DTX-001' });

    expect(paymentQrs.findOne).toHaveBeenCalledWith({ where: { decentro_txn_id: 'QR-DTX-001' } });
    expect(result).toEqual(qr);
  });

  it('prefers reference_id over decentro_txn_id when both are provided', async () => {
    paymentQrs.findOne.mockResolvedValue(null);

    await findPaymentQrByIdentifiers({ reference_id: 'QR-REF-001', decentro_txn_id: 'QR-DTX-001' });

    expect(paymentQrs.findOne).toHaveBeenCalledWith({ where: { reference_id: 'QR-REF-001' } });
  });

  it('returns null without querying when both identifiers are absent', async () => {
    const result = await findPaymentQrByIdentifiers({});

    expect(paymentQrs.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when QR is not found', async () => {
    paymentQrs.findOne.mockResolvedValue(null);

    const result = await findPaymentQrByIdentifiers({ reference_id: 'QR-MISSING' });

    expect(result).toBeNull();
  });

  it('throws and logs on db error', async () => {
    paymentQrs.findOne.mockRejectedValue(new Error('Lookup failed'));

    await expect(
      findPaymentQrByIdentifiers({ reference_id: 'QR-REF-001' })
    ).rejects.toThrow('Lookup failed');
  });
});
