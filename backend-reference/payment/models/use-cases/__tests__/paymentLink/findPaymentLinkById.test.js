const paymentLinks = require('../../../entities/paymentLink');
const { customLog } = require('../../../../utils/loggerHelper');
const { findPaymentLinkById } = require('../../paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

const makeMockLink = (overrides = {}) => ({
  id: 1,
  credentialId: 'user-1',
  reference_id: 'REF-001',
  status: 'PENDING',
  amount: 500,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findPaymentLinkById', () => {
  it('returns the link when found', async () => {
    const link = makeMockLink();
    paymentLinks.findOne.mockResolvedValue(link);

    const result = await findPaymentLinkById({ id: 1, corporateUser: 'user-1' });

    expect(paymentLinks.findOne).toHaveBeenCalledWith({
      where: { id: 1, credentialId: 'user-1' },
    });
    expect(result).toEqual(link);
  });

  it('returns null when link is not found', async () => {
    paymentLinks.findOne.mockResolvedValue(null);

    const result = await findPaymentLinkById({ id: 999, corporateUser: 'user-1' });

    expect(result).toBeNull();
  });

  it('uses both id and credentialId in the where clause', async () => {
    paymentLinks.findOne.mockResolvedValue(null);

    await findPaymentLinkById({ id: 42, corporateUser: 'corp-99' });

    expect(paymentLinks.findOne).toHaveBeenCalledWith({
      where: { id: 42, credentialId: 'corp-99' },
    });
  });

  it('throws and logs on db error', async () => {
    paymentLinks.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findPaymentLinkById({ id: 1, corporateUser: 'user-1' })).rejects.toThrow('DB error');
    expect(customLog).toHaveBeenCalled();
  });
});
