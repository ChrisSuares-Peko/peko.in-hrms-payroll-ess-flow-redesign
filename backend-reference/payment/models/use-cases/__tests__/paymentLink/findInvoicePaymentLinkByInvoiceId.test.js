const paymentLinks = require('../../../entities/paymentLink');
const { findInvoicePaymentLinkByInvoiceId } = require('../../paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
  findOne: jest.fn(),
}));

const makeMockLink = (overrides = {}) => ({
  id: 1,
  credentialId: 'user-1',
  invoiceId: '101',
  accessKey: 'invoice',
  status: 'PENDING',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findInvoicePaymentLinkByInvoiceId', () => {
  it('returns the invoice link when found', async () => {
    const link = makeMockLink();
    paymentLinks.findOne.mockResolvedValue(link);

    const result = await findInvoicePaymentLinkByInvoiceId({ invoiceId: '101', corporateUser: 'user-1' });

    expect(paymentLinks.findOne).toHaveBeenCalledWith({
      where: { credentialId: 'user-1', invoiceId: '101', accessKey: 'invoice' },
      order: [['createdAt', 'DESC']],
    });
    expect(result).toEqual(link);
  });

  it('coerces numeric invoiceId to string in where clause', async () => {
    paymentLinks.findOne.mockResolvedValue(null);

    await findInvoicePaymentLinkByInvoiceId({ invoiceId: 42, corporateUser: 'user-1' });

    const where = paymentLinks.findOne.mock.calls[0][0].where;
    expect(where.invoiceId).toBe('42');
  });

  it('returns null when invoiceId is missing', async () => {
    const result = await findInvoicePaymentLinkByInvoiceId({ invoiceId: null, corporateUser: 'user-1' });

    expect(paymentLinks.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when corporateUser is missing', async () => {
    const result = await findInvoicePaymentLinkByInvoiceId({ invoiceId: '101', corporateUser: null });

    expect(paymentLinks.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when both invoiceId and corporateUser are missing', async () => {
    const result = await findInvoicePaymentLinkByInvoiceId({});

    expect(paymentLinks.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when link is not found', async () => {
    paymentLinks.findOne.mockResolvedValue(null);

    const result = await findInvoicePaymentLinkByInvoiceId({ invoiceId: '999', corporateUser: 'user-1' });

    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    paymentLinks.findOne.mockRejectedValue(new Error('DB error'));

    await expect(
      findInvoicePaymentLinkByInvoiceId({ invoiceId: '101', corporateUser: 'user-1' })
    ).rejects.toThrow('DB error');
  });
});
