const paymentLinks = require('../../../entities/paymentLink');
const invoicingV2 = require('../../../entities/invoicingV2');
const unifiedTransactionContract = require('../../paymentCollectionTransaction');
const { customLog } = require('../../../../utils/loggerHelper');
const { updatePaymentLinkStatus } = require('../../paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../../entities/invoicingV2', () => ({
  update: jest.fn(),
}));

jest.mock('../../paymentCollectionTransaction', () => ({
  upsertUnifiedTransactionStatus: jest.fn(),
  createPendingUnifiedTransaction: jest.fn(),
  appendTimelineEvent: jest.fn(),
  normalizeUnifiedStatus: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

const makeMockLink = (overrides = {}) => ({
  id: 1,
  credentialId: 'user-1',
  reference_id: 'REF-001',
  decentro_txn_id: 'DTX-001',
  status: 'PENDING',
  amount: 500,
  paymentLink: 'https://pay.example.com/REF-001',
  customerName: 'Alice',
  customerPhone: '9999999999',
  purpose_message: 'Test payment',
  invoiceId: null,
  accessKey: 'payment_link',
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

describe('updatePaymentLinkStatus', () => {
  it('throws when reference_id is missing', async () => {
    await expect(
      updatePaymentLinkStatus({ reference_id: '', status: 'SUCCESS' })
    ).rejects.toThrow('reference_id is required');
  });

  it('throws when status is missing', async () => {
    await expect(
      updatePaymentLinkStatus({ reference_id: 'REF-001', status: '' })
    ).rejects.toThrow('status is required');
  });

  it('throws when no payment link found for the reference_id', async () => {
    paymentLinks.findOne.mockResolvedValue(null);

    await expect(
      updatePaymentLinkStatus({ reference_id: 'REF-NONE', status: 'SUCCESS' })
    ).rejects.toThrow('No payment link found');
  });

  it('normalizes status to uppercase', async () => {
    const link = makeMockLink();
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);

    const result = await updatePaymentLinkStatus({
      reference_id: 'REF-001',
      status: 'success',
      skipUnifiedSync: true,
    });

    expect(result.status).toBe('SUCCESS');
  });

  it('sets successOrFailDate when transitioning to SUCCESS and it was not set', async () => {
    const link = makeMockLink({ status: 'PENDING', successOrFailDate: null });
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);

    const result = await updatePaymentLinkStatus({
      reference_id: 'REF-001',
      status: 'SUCCESS',
      skipUnifiedSync: true,
    });

    expect(result.updated).toBe(true);
    const updateArg = paymentLinks.update.mock.calls[0][0];
    expect(updateArg.successOrFailDate).toBeDefined();
  });

  it('sets successOrFailDate when transitioning to FAILED', async () => {
    const link = makeMockLink({ status: 'PENDING', successOrFailDate: null });
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);

    const result = await updatePaymentLinkStatus({
      reference_id: 'REF-001',
      status: 'FAILED',
      skipUnifiedSync: true,
    });

    expect(result.status).toBe('FAILED');
    const updateArg = paymentLinks.update.mock.calls[0][0];
    expect(updateArg.successOrFailDate).toBeDefined();
  });

  it('sets settledDate when status is SETTLED and it was not set', async () => {
    const link = makeMockLink({ status: 'SUCCESS', successOrFailDate: new Date(), settledDate: null });
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);

    const result = await updatePaymentLinkStatus({
      reference_id: 'REF-001',
      status: 'SETTLED',
      skipUnifiedSync: true,
    });

    expect(result.status).toBe('SETTLED');
    const updateArg = paymentLinks.update.mock.calls[0][0];
    expect(updateArg.settledDate).toBeDefined();
  });

  it('does not overwrite successOrFailDate when already set', async () => {
    const existingDate = new Date('2024-06-01');
    const link = makeMockLink({ status: 'PENDING', successOrFailDate: existingDate });
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);

    await updatePaymentLinkStatus({
      reference_id: 'REF-001',
      status: 'SUCCESS',
      skipUnifiedSync: true,
    });

    const updateArg = paymentLinks.update.mock.calls[0][0];
    expect(updateArg.successOrFailDate).toBeUndefined();
  });

  it('calls invoicingV2.update when accessKey is invoice and status is SUCCESS', async () => {
    const link = makeMockLink({ accessKey: 'invoice', invoiceId: 42 });
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);
    invoicingV2.update.mockResolvedValue([1]);

    await updatePaymentLinkStatus({
      reference_id: 'REF-001',
      status: 'SUCCESS',
      skipUnifiedSync: true,
    });

    expect(invoicingV2.update).toHaveBeenCalledWith(
      { status: 'PAID' },
      { where: { id: 42 } }
    );
  });

  it('skips unified sync when skipUnifiedSync is true', async () => {
    paymentLinks.findOne.mockResolvedValue(makeMockLink());
    paymentLinks.update.mockResolvedValue([1]);

    await updatePaymentLinkStatus({ reference_id: 'REF-001', status: 'SUCCESS', skipUnifiedSync: true });

    expect(unifiedTransactionContract.upsertUnifiedTransactionStatus).not.toHaveBeenCalled();
  });

  it('calls upsertUnifiedTransactionStatus when skipUnifiedSync is false', async () => {
    paymentLinks.findOne.mockResolvedValue(makeMockLink());
    paymentLinks.update.mockResolvedValue([1]);

    await updatePaymentLinkStatus({ reference_id: 'REF-001', status: 'SUCCESS', skipUnifiedSync: false });

    expect(unifiedTransactionContract.upsertUnifiedTransactionStatus).toHaveBeenCalledTimes(1);
  });

  it('does not throw if unified sync fails — logs instead', async () => {
    paymentLinks.findOne.mockResolvedValue(makeMockLink());
    paymentLinks.update.mockResolvedValue([1]);
    unifiedTransactionContract.upsertUnifiedTransactionStatus.mockRejectedValue(new Error('Sync failed'));

    const result = await updatePaymentLinkStatus({ reference_id: 'REF-001', status: 'SUCCESS' });

    expect(result.updated).toBe(true);
    expect(customLog).toHaveBeenCalled();
  });

  it('reports statusChanged true when status actually changed', async () => {
    paymentLinks.findOne.mockResolvedValue(makeMockLink({ status: 'PENDING' }));
    paymentLinks.update.mockResolvedValue([1]);

    const result = await updatePaymentLinkStatus({
      reference_id: 'REF-001',
      status: 'SUCCESS',
      skipUnifiedSync: true,
    });

    expect(result.statusChanged).toBe(true);
  });

  it('reports statusChanged false when status did not change', async () => {
    paymentLinks.findOne.mockResolvedValue(makeMockLink({ status: 'SUCCESS' }));
    paymentLinks.update.mockResolvedValue([1]);

    const result = await updatePaymentLinkStatus({
      reference_id: 'REF-001',
      status: 'SUCCESS',
      skipUnifiedSync: true,
    });

    expect(result.statusChanged).toBe(false);
  });

  it('throws when db update returns updatedCount of 0', async () => {
    paymentLinks.findOne.mockResolvedValue(makeMockLink());
    paymentLinks.update.mockResolvedValue([0]);

    await expect(
      updatePaymentLinkStatus({ reference_id: 'REF-001', status: 'SUCCESS', skipUnifiedSync: true })
    ).rejects.toThrow('No payment link found');
  });
});
