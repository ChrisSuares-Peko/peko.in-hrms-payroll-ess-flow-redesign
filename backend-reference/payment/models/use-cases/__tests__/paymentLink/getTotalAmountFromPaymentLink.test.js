const paymentLinks = require('../../../entities/paymentLink');
const { customLog } = require('../../../../utils/loggerHelper');
const { getTotalAmountFromPaymentLink } = require('../../paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
  findAll: jest.fn(),
  sequelize: {
    fn: jest.fn(() => 'SUM(amount)'),
    col: jest.fn(() => 'amount'),
  },
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getTotalAmountFromPaymentLink', () => {
  it('returns numeric total for SUCCESS links', async () => {
    paymentLinks.findAll.mockResolvedValue([{ totalAmount: '1500' }]);

    const result = await getTotalAmountFromPaymentLink({ corporateUser: 'user-1' });

    expect(result).toBe(1500);
    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(where.status).toBe('SUCCESS');
    expect(where.credentialId).toBe('user-1');
  });

  it('returns 0 when totalAmount is null', async () => {
    paymentLinks.findAll.mockResolvedValue([{ totalAmount: null }]);

    const result = await getTotalAmountFromPaymentLink({ corporateUser: 'user-1' });

    expect(result).toBe(0);
  });

  it('returns 0 when result array is empty', async () => {
    paymentLinks.findAll.mockResolvedValue([{}]);

    const result = await getTotalAmountFromPaymentLink({ corporateUser: 'user-1' });

    expect(result).toBe(0);
  });

  it('applies startDate filter only when provided', async () => {
    paymentLinks.findAll.mockResolvedValue([{ totalAmount: '200' }]);

    await getTotalAmountFromPaymentLink({
      corporateUser: 'user-1',
      startDate: new Date('2024-01-01'),
    });

    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(where.createdAt).toBeDefined();
  });

  it('applies endDate filter only when provided', async () => {
    paymentLinks.findAll.mockResolvedValue([{ totalAmount: '200' }]);

    await getTotalAmountFromPaymentLink({
      corporateUser: 'user-1',
      endDate: new Date('2024-01-31'),
    });

    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(where.createdAt).toBeDefined();
  });

  it('applies both startDate and endDate when both provided', async () => {
    paymentLinks.findAll.mockResolvedValue([{ totalAmount: '500' }]);

    await getTotalAmountFromPaymentLink({
      corporateUser: 'user-1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });

    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(where.createdAt).toBeDefined();
  });

  it('does not add createdAt filter when neither date provided', async () => {
    paymentLinks.findAll.mockResolvedValue([{ totalAmount: '0' }]);

    await getTotalAmountFromPaymentLink({ corporateUser: 'user-1' });

    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(where).not.toHaveProperty('createdAt');
  });

  it('throws and logs on db error', async () => {
    paymentLinks.findAll.mockRejectedValue(new Error('Sum failed'));

    await expect(getTotalAmountFromPaymentLink({ corporateUser: 'user-1' })).rejects.toThrow('Sum failed');
    expect(customLog).toHaveBeenCalled();
  });
});
