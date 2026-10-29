const paymentQrs = require('../../../entities/paymentQr');
const unifiedTransactionContract = require('../../paymentCollectionTransaction');
const { customLog } = require('../../../../utils/loggerHelper');
const { updatePaymentQrStatus } = require('../../paymentQr');

jest.mock('../../../entities/paymentQr', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
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
  decentro_txn_id: 'QR-DTX-001',
  status: 'PENDING',
  amount: 300,
  purpose_message: 'QR payment',
  dynamic_qr_image: 'https://qr.example.com/img.png',
  expireDate: null,
  createdAt: new Date('2024-01-01'),
  successOrFailDate: null,
  settledDate: null,
  toJSON: jest.fn(function () { return { ...this }; }),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  unifiedTransactionContract.upsertUnifiedTransactionStatus.mockResolvedValue({});
});

describe('updatePaymentQrStatus', () => {
  it('throws when reference_id is missing', async () => {
    await expect(
      updatePaymentQrStatus({ reference_id: '', status: 'SUCCESS' })
    ).rejects.toThrow('reference_id is required');
  });

  it('throws when status is missing', async () => {
    await expect(
      updatePaymentQrStatus({ reference_id: 'QR-REF-001', status: '' })
    ).rejects.toThrow('status is required');
  });

  it('throws when no QR found for the reference_id', async () => {
    paymentQrs.findOne.mockResolvedValue(null);

    await expect(
      updatePaymentQrStatus({ reference_id: 'QR-NONE', status: 'SUCCESS' })
    ).rejects.toThrow('No payment QR found');
  });

  it('normalizes status to uppercase', async () => {
    paymentQrs.findOne.mockResolvedValue(makeMockQr());
    paymentQrs.update.mockResolvedValue([1]);

    const result = await updatePaymentQrStatus({
      reference_id: 'QR-REF-001',
      status: 'success',
      skipUnifiedSync: true,
    });

    expect(result.status).toBe('SUCCESS');
  });

  it('sets successOrFailDate when transitioning to SUCCESS and it was not set', async () => {
    const qr = makeMockQr({ status: 'PENDING', successOrFailDate: null });
    paymentQrs.findOne.mockResolvedValue(qr);
    paymentQrs.update.mockResolvedValue([1]);

    const result = await updatePaymentQrStatus({
      reference_id: 'QR-REF-001',
      status: 'SUCCESS',
      skipUnifiedSync: true,
    });

    expect(result.updated).toBe(true);
    expect(result.statusChanged).toBe(true);
    const updateArg = paymentQrs.update.mock.calls[0][0];
    expect(updateArg.successOrFailDate).toBeDefined();
  });

  it('sets successOrFailDate when transitioning to FAILED', async () => {
    const qr = makeMockQr({ successOrFailDate: null });
    paymentQrs.findOne.mockResolvedValue(qr);
    paymentQrs.update.mockResolvedValue([1]);

    await updatePaymentQrStatus({
      reference_id: 'QR-REF-001',
      status: 'FAILED',
      skipUnifiedSync: true,
    });

    const updateArg = paymentQrs.update.mock.calls[0][0];
    expect(updateArg.successOrFailDate).toBeDefined();
  });

  it('sets settledDate when status is SETTLED and it was not set', async () => {
    const qr = makeMockQr({ status: 'SUCCESS', successOrFailDate: new Date(), settledDate: null });
    paymentQrs.findOne.mockResolvedValue(qr);
    paymentQrs.update.mockResolvedValue([1]);

    const result = await updatePaymentQrStatus({
      reference_id: 'QR-REF-001',
      status: 'SETTLED',
      skipUnifiedSync: true,
    });

    expect(result.status).toBe('SETTLED');
    const updateArg = paymentQrs.update.mock.calls[0][0];
    expect(updateArg.settledDate).toBeDefined();
  });

  it('does not overwrite successOrFailDate when already set', async () => {
    const existingDate = new Date('2024-06-01');
    const qr = makeMockQr({ successOrFailDate: existingDate });
    paymentQrs.findOne.mockResolvedValue(qr);
    paymentQrs.update.mockResolvedValue([1]);

    await updatePaymentQrStatus({
      reference_id: 'QR-REF-001',
      status: 'SUCCESS',
      skipUnifiedSync: true,
    });

    const updateArg = paymentQrs.update.mock.calls[0][0];
    expect(updateArg.successOrFailDate).toBeUndefined();
  });

  it('skips unified sync when skipUnifiedSync is true', async () => {
    paymentQrs.findOne.mockResolvedValue(makeMockQr());
    paymentQrs.update.mockResolvedValue([1]);

    await updatePaymentQrStatus({ reference_id: 'QR-REF-001', status: 'SUCCESS', skipUnifiedSync: true });

    expect(unifiedTransactionContract.upsertUnifiedTransactionStatus).not.toHaveBeenCalled();
  });

  it('calls upsertUnifiedTransactionStatus with source=payment_qr when skipUnifiedSync is false', async () => {
    paymentQrs.findOne.mockResolvedValue(makeMockQr());
    paymentQrs.update.mockResolvedValue([1]);

    await updatePaymentQrStatus({ reference_id: 'QR-REF-001', status: 'SUCCESS', skipUnifiedSync: false });

    expect(unifiedTransactionContract.upsertUnifiedTransactionStatus).toHaveBeenCalledTimes(1);
    const syncArg = unifiedTransactionContract.upsertUnifiedTransactionStatus.mock.calls[0][0];
    expect(syncArg.source).toBe('payment_qr');
  });

  it('does not throw if unified sync fails — logs instead', async () => {
    paymentQrs.findOne.mockResolvedValue(makeMockQr());
    paymentQrs.update.mockResolvedValue([1]);
    unifiedTransactionContract.upsertUnifiedTransactionStatus.mockRejectedValue(new Error('Sync error'));

    const result = await updatePaymentQrStatus({ reference_id: 'QR-REF-001', status: 'SUCCESS' });

    expect(result.updated).toBe(true);
    expect(customLog).toHaveBeenCalled();
  });

  it('reports statusChanged as false when status did not change', async () => {
    const qr = makeMockQr({ status: 'SUCCESS' });
    paymentQrs.findOne.mockResolvedValue(qr);
    paymentQrs.update.mockResolvedValue([1]);

    const result = await updatePaymentQrStatus({
      reference_id: 'QR-REF-001',
      status: 'SUCCESS',
      skipUnifiedSync: true,
    });

    expect(result.statusChanged).toBe(false);
  });

  it('throws when db update returns updatedCount of 0', async () => {
    paymentQrs.findOne.mockResolvedValue(makeMockQr());
    paymentQrs.update.mockResolvedValue([0]);

    await expect(
      updatePaymentQrStatus({ reference_id: 'QR-REF-001', status: 'SUCCESS', skipUnifiedSync: true })
    ).rejects.toThrow('No payment QR found');
  });
});
