const paymentLinks = require('../../../entities/paymentLink');
const { findPaymentLinkByIdentifiers } = require('../../paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
  findOne: jest.fn(),
}));

const makeMockLink = (overrides = {}) => ({
  id: 1,
  reference_id: 'REF-001',
  decentro_txn_id: 'DTX-001',
  status: 'PENDING',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findPaymentLinkByIdentifiers', () => {
  it('finds by reference_id when provided', async () => {
    const link = makeMockLink();
    paymentLinks.findOne.mockResolvedValue(link);

    const result = await findPaymentLinkByIdentifiers({ reference_id: 'REF-001' });

    expect(paymentLinks.findOne).toHaveBeenCalledWith({ where: { reference_id: 'REF-001' } });
    expect(result).toEqual(link);
  });

  it('finds by decentro_txn_id when reference_id is null', async () => {
    const link = makeMockLink();
    paymentLinks.findOne.mockResolvedValue(link);

    const result = await findPaymentLinkByIdentifiers({ decentro_txn_id: 'DTX-001' });

    expect(paymentLinks.findOne).toHaveBeenCalledWith({ where: { decentro_txn_id: 'DTX-001' } });
    expect(result).toEqual(link);
  });

  it('prefers reference_id over decentro_txn_id when both provided', async () => {
    paymentLinks.findOne.mockResolvedValue(null);

    await findPaymentLinkByIdentifiers({ reference_id: 'REF-001', decentro_txn_id: 'DTX-001' });

    expect(paymentLinks.findOne).toHaveBeenCalledWith({ where: { reference_id: 'REF-001' } });
  });

  it('returns null without querying when both identifiers are null', async () => {
    const result = await findPaymentLinkByIdentifiers({});

    expect(paymentLinks.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when link is not found', async () => {
    paymentLinks.findOne.mockResolvedValue(null);

    const result = await findPaymentLinkByIdentifiers({ reference_id: 'REF-MISSING' });

    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    paymentLinks.findOne.mockRejectedValue(new Error('Lookup failed'));

    await expect(
      findPaymentLinkByIdentifiers({ reference_id: 'REF-001' })
    ).rejects.toThrow('Lookup failed');
  });
});
